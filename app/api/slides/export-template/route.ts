import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PizZip from 'pizzip'
import path from 'path'
import fs from 'fs'

// Helper: read zip file content as string
async function readZipText(zip: PizZip, filePath: string): Promise<string> {
    const f = zip.file(filePath) as any
    if (!f) throw new Error(`File not found in zip: ${filePath}`)
    if (typeof f.asText === 'function') return f.asText()
    if (typeof f.async === 'function') return await f.async('text')
    throw new Error(`Cannot read file: ${filePath}`)
}

// Escape XML special characters
function escapeXml(text: string): string {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, slides, title } = body

    if (!templateId || !slides || !title) {
        return NextResponse.json({ error: 'Template, slides, and title required' }, { status: 400 })
    }

    const templatePath = path.join(process.cwd(), 'public', 'templates', `${templateId}.pptx`)
    if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    try {
        const templateBuffer = fs.readFileSync(templatePath)
        const zip = new PizZip(templateBuffer)

        // ---- 1. Find master slide files ----
        const existingSlideFiles = Object.keys(zip.files)
            .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
            .sort()

        if (existingSlideFiles.length === 0) {
            return NextResponse.json({ error: 'No slides in template' }, { status: 400 })
        }

        const existingRelsFiles = Object.keys(zip.files)
            .filter(f => /^ppt\/slides\/_rels\/slide\d+\.xml\.rels$/.test(f))
            .sort()

        // ---- 2. Read master slide XML and its rels file ----
        const masterSlideXml = await readZipText(zip, existingSlideFiles[0])
        const masterRels = existingRelsFiles.length > 0
            ? await readZipText(zip, existingRelsFiles[0])
            : null

        // ---- 3. Remove all existing slides and rels ----
        existingSlideFiles.forEach(f => zip.remove(f))
        existingRelsFiles.forEach(f => zip.remove(f))

        // ---- 4. Create new slides (one per data item) ----
        for (let i = 0; i < slides.length; i++) {
            const data = slides[i]
            const slideNum = i + 1

            let xml = masterSlideXml

            // Replace {title}
            const titleText = escapeXml(data.title || 'Untitled')
            xml = xml.split('{title}').join(titleText)

            // Replace {bullets} – needs proper <a:p> paragraph structure
            const bulletsList = (data.bullets || ['No content']).map((b: string) => escapeXml(b))
            if (bulletsList.length === 1) {
                xml = xml.split('{bullets}').join(bulletsList[0])
            } else {
                // For multiple bullets: close current paragraph, open new ones
                const bulletXml = bulletsList
                    .map((b, idx) => {
                        if (idx === 0) return b
                        return `</a:t></a:r></a:p><a:p><a:r><a:t>${b}`
                    })
                    .join('')
                xml = xml.split('{bullets}').join(bulletXml)
            }

            zip.file(`ppt/slides/slide${slideNum}.xml`, xml)

            // ✅ CRITICAL: Copy the rels file for this slide
            if (masterRels) {
                zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`, masterRels)
            }
        }

        // ---- 5. Update [Content_Types].xml ----
        let ct = await readZipText(zip, '[Content_Types].xml')
        // Remove old slide overrides
        ct = ct.replace(/<Override[^>]*PartName="\/ppt\/slides\/slide\d+\.xml"[^>]*\/>/g, '')
        // Add new slide overrides
        const slideOverrides = slides
            .map((_: any, i: number) =>
                `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
            )
            .join('')
        ct = ct.replace('</Types>', slideOverrides + '</Types>')
        zip.file('[Content_Types].xml', ct)

        // ---- 6. Update presentation.xml.rels ----
        const presRelsPath = 'ppt/_rels/presentation.xml.rels'
        let presRels = await readZipText(zip, presRelsPath)

        // Remove existing slide relationships (keep slideMaster, etc.)
        presRels = presRels.replace(
            /<Relationship[^>]*Type="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/relationships\/slide"[^>]*\/>/g,
            ''
        )

        // Find max existing rId to avoid conflicts
        const rIdMatches = presRels.match(/Id="rId(\d+)"/g) || []
        const maxRId = rIdMatches.reduce((max: number, r: string) => {
            const n = parseInt(r.replace(/Id="rId(\d+)"/, '$1'))
            return n > max ? n : max
        }, 0)

        // Add new slide relationships
        const slideRels = slides
            .map((_: any, i: number) =>
                `<Relationship Id="rId${maxRId + i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
            )
            .join('')
        presRels = presRels.replace('</Relationships>', slideRels + '</Relationships>')
        zip.file(presRelsPath, presRels)

        // ---- 7. Update presentation.xml sldIdLst ----
        let presXml = await readZipText(zip, 'ppt/presentation.xml')

        const sldIdEntries = slides
            .map((_: any, i: number) =>
                `<p:sldId id="${256 + i}" r:id="rId${maxRId + i + 1}"/>`
            )
            .join('')

        if (presXml.match(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/)) {
            presXml = presXml.replace(
                /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,
                `<p:sldIdLst>${sldIdEntries}</p:sldIdLst>`
            )
        } else {
            presXml = presXml.replace(
                /(<p:presentation[^>]*>)/,
                `$1<p:sldIdLst>${sldIdEntries}</p:sldIdLst>`
            )
        }
        zip.file('ppt/presentation.xml', presXml)

        // ---- 8. Generate output ----
        const outputBuffer = zip.generate({ type: 'nodebuffer' }) as Buffer

        return new NextResponse(new Uint8Array(outputBuffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}.pptx"`,
            },
        })
    } catch (error: any) {
        console.error('Template export error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate presentation' },
            { status: 500 }
        )
    }
}
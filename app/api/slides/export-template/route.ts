import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PizZip from 'pizzip'
import path from 'path'
import fs from 'fs'

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

        // Get master slide XML (pehli slide)
        const slideFiles = Object.keys(zip.files).filter(
            f => f.startsWith('ppt/slides/slide') && f.endsWith('.xml')
        )
        slideFiles.sort()

        if (slideFiles.length === 0) {
            return NextResponse.json({ error: 'No slides found in template' }, { status: 400 })
        }

        // ✅ Read master slide XML as string (NO PARSING)
        const masterSlideFile = zip.file(slideFiles[0]) as any
        if (!masterSlideFile) {
            return NextResponse.json({ error: 'Master slide not found' }, { status: 404 })
        }

        let masterSlideXml: string
        try {
            masterSlideXml = masterSlideFile.asText()
        } catch {
            masterSlideXml = await masterSlideFile.async('text')
        }

        // ✅ Clone and replace text in each slide WITHOUT parsing XML
        const slideXmls: string[] = []
        for (const data of slides) {
            let xml = masterSlideXml  // Copy string directly

            // Replace {title} and {bullets} with actual data
            const titleText = escapeXml(data.title || 'Untitled')
            const bulletsText = (data.bullets || ['No content'])
                .map((b: string) => escapeXml(b))
                .join('\n')

            xml = xml.split('{title}').join(titleText)
            xml = xml.split('{bullets}').join(bulletsText)

            slideXmls.push(xml)
        }

        // Remove old slides
        for (const f of slideFiles) {
            zip.remove(f)
        }

        // Add new slide files
        for (let i = 0; i < slideXmls.length; i++) {
            zip.file(`ppt/slides/slide${i + 1}.xml`, slideXmls[i])
        }

        // ✅ Update presentation.xml – read as string, regex replace
        const presFile = zip.file('ppt/presentation.xml') as any
        if (!presFile) {
            return NextResponse.json({ error: 'presentation.xml not found' }, { status: 404 })
        }

        let presXml: string
        try {
            presXml = presFile.asText()
        } catch {
            presXml = await presFile.async('text')
        }

        // Build new sldIdLst XML
        const newSldIdLst = slideXmls.map((_, i) =>
            `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`
        ).join('')

        // Replace existing sldIdLst content
        presXml = presXml.replace(
            /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,
            `<p:sldIdLst>${newSldIdLst}</p:sldIdLst>`
        )

        // Agar sldIdLst nahi mila toh add karo (very rare)
        if (!presXml.includes('<p:sldIdLst>')) {
            presXml = presXml.replace(
                /<p:presentation[^>]*>/,
                (match) => `${match}<p:sldIdLst>${newSldIdLst}</p:sldIdLst>`
            )
        }

        zip.file('ppt/presentation.xml', presXml)

        // ✅ Update Content_Types.xml – ensure all slides are listed
        const ctFile = zip.file('[Content_Types].xml') as any
        if (ctFile) {
            let ctXml: string
            try {
                ctXml = ctFile.asText()
            } catch {
                ctXml = await ctFile.async('text')
            }

            // Remove existing slide overrides
            ctXml = ctXml.replace(/<Override PartName="\/ppt\/slides\/slide\d+\.xml"[^\/]*\/>/g, '')

            // Add new slide overrides
            const slideOverrides = slideXmls.map((_, i) =>
                `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
            ).join('')

            // Insert before closing </Types>
            ctXml = ctXml.replace('</Types>', `${slideOverrides}</Types>`)
            zip.file('[Content_Types].xml', ctXml)
        }

        // ✅ Update presentation.xml.rels to have proper slide relationships
        const relsPath = 'ppt/_rels/presentation.xml.rels'
        const relsFile = zip.file(relsPath) as any
        if (relsFile) {
            let relsXml: string
            try {
                relsXml = relsFile.asText()
            } catch {
                relsXml = await relsFile.async('text')
            }

            // Remove existing slide relationships
            relsXml = relsXml.replace(/<Relationship[^>]*Type="[^"]*\/slide"[^>]*\/>/g, '')

            // Add new slide relationships
            const slideRels = slideXmls.map((_, i) =>
                `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
            ).join('')

            relsXml = relsXml.replace('</Relationships>', `${slideRels}</Relationships>`)
            zip.file(relsPath, relsXml)
        }

        // Generate final buffer
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

// ✅ Escape special XML characters
function escapeXml(text: string): string {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}
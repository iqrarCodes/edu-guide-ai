import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PizZip from 'pizzip'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
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

        const parser = new XMLParser({ ignoreAttributes: false })
        const builder = new XMLBuilder({ format: true, ignoreAttributes: false })

        // Get master slide
        const slideFiles = Object.keys(zip.files).filter(
            f => f.startsWith('ppt/slides/slide') && f.endsWith('.xml')
        )
        slideFiles.sort()

        if (slideFiles.length === 0) {
            return NextResponse.json({ error: 'No slides found in template' }, { status: 400 })
        }

        // ✅ FIX: Use .asText() instead of .async('text')
        const masterSlideFile = zip.files[slideFiles[0]] as any
        if (!masterSlideFile) {
            return NextResponse.json({ error: 'Master slide not found' }, { status: 404 })
        }

        let masterSlideContent: string
        if (typeof masterSlideFile.asText === 'function') {
            masterSlideContent = masterSlideFile.asText()
        } else if (typeof masterSlideFile.async === 'function') {
            masterSlideContent = await masterSlideFile.async('text')
        } else {
            throw new Error('Cannot read slide content')
        }

        const masterSlideObj = parser.parse(masterSlideContent)

        // Clone slides for each slide data
        const slideXmls: string[] = []
        for (const data of slides) {
            const clone = JSON.parse(JSON.stringify(masterSlideObj))
            replaceTextInObject(clone, '{title}', data.title || 'Untitled')
            replaceTextInObject(clone, '{bullets}', (data.bullets || ['No content']).join('\n'))
            const xml = builder.build(clone)
            slideXmls.push(xml)
        }

        // Remove old slides
        for (const f of slideFiles) {
            zip.remove(f)
        }

        // Add new slides
        for (let i = 0; i < slideXmls.length; i++) {
            zip.file(`ppt/slides/slide${i + 1}.xml`, slideXmls[i])
        }

        // Update presentation.xml
        const presFile = zip.files['ppt/presentation.xml'] as any
        if (!presFile) {
            return NextResponse.json({ error: 'presentation.xml not found' }, { status: 404 })
        }

        let presContent: string
        if (typeof presFile.asText === 'function') {
            presContent = presFile.asText()
        } else if (typeof presFile.async === 'function') {
            presContent = await presFile.async('text')
        } else {
            throw new Error('Cannot read presentation.xml')
        }

        const presObj = parser.parse(presContent)

        const sldIdLst = presObj['p:presentation']?.['p:sldIdLst'] || {}
        sldIdLst['p:sldId'] = []
        for (let i = 0; i < slideXmls.length; i++) {
            sldIdLst['p:sldId'].push({
                '@_id': 256 + i,
                '@_r:id': `rId${i + 1}`,
            })
        }
        presObj['p:presentation']['p:sldIdLst'] = sldIdLst
        zip.file('ppt/presentation.xml', builder.build(presObj))

        // Generate buffer
        const outputBuffer = await zip.generate({ type: 'nodebuffer' }) as Buffer

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

function replaceTextInObject(obj: any, search: string, replace: string) {
    if (typeof obj === 'string') {
        return obj.replace(new RegExp(search, 'g'), replace)
    }
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = replaceTextInObject(obj[i], search, replace)
        }
    } else if (obj && typeof obj === 'object') {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = replaceTextInObject(obj[key], search, replace)
            }
        }
    }
    return obj
}
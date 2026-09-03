import { Buffer } from 'buffer'

export async function extractContextFromFile(file: File): Promise<string> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''

    let text = ''

    if (ext === 'pdf') {
        // ✅ TypeScript-friendly dynamic import with type assertion
        const pdfParse = (await import('pdf-parse') as any).default
        const pdfData = await pdfParse(buffer)
        text = pdfData.text
    } else if (ext === 'docx') {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        text = result.value
    } else if (ext === 'txt' || ext === 'md') {
        text = buffer.toString('utf-8')
    } else if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) {
        const Tesseract = await import('tesseract.js')
        const { data: { text: ocrText } } = await Tesseract.recognize(buffer, 'eng')
        text = ocrText
    } else {
        text = buffer.toString('utf-8')
    }

    return text || 'No readable text found in file.'
}
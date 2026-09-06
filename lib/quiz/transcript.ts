import { YoutubeTranscript } from 'youtube-transcript'

export async function getTranscript(videoUrl: string, preferredLanguage: string = 'en') {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) throw new Error('Invalid YouTube URL')

    const languages = [preferredLanguage, 'en', 'en-US', 'en-GB', 'auto']
    let lastError: Error | null = null

    for (const lang of languages) {
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang })
            const text = transcript.map(seg => seg.text).join(' ')
            return { text, languageUsed: lang }
        } catch (err: any) {
            lastError = err
            console.warn(`Failed with language '${lang}':`, err.message)
        }
    }

    // Final fallback: without language param
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId)
        const text = transcript.map(seg => seg.text).join(' ')
        return { text, languageUsed: 'default' }
    } catch (err: any) {
        lastError = err
    }

    throw new Error('This video does not have captions available. Please try another video or upload a file.')
}

function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&]|$)/,
        /(?:embed\/)([0-9A-Za-z_-]{11})/,
        /(?:youtu.be\/)([0-9A-Za-z_-]{11})/
    ]
    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }
    return null
}
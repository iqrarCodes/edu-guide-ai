import { YoutubeTranscript } from 'youtube-transcript'

export async function getTranscript(videoUrl: string, language: string = 'en') {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) throw new Error('Invalid YouTube URL')

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId)
        const text = transcript.map(seg => seg.text).join(' ')
        return { text, languageUsed: language }
    } catch (err: any) {
        throw new Error(`Transcript extraction failed: ${err.message}`)
    }
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
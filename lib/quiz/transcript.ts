import { YoutubeTranscript } from 'youtube-transcript'

export async function getTranscript(videoUrl: string) {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) throw new Error('Invalid YouTube URL')

    // ✅ Try multiple languages (more robust)
    const languages = ['en', 'en-US', 'en-GB', 'ko', 'ja', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ar', 'hi', 'ur', 'auto']
    let lastError: Error | null = null

    for (const lang of languages) {
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang })
            const text = transcript.map((item: any) => item.text).join(' ')
            if (text.trim().length > 0) {
                console.log(`✅ Transcript fetched in language: ${lang}`)
                return { text, languageUsed: lang }
            }
        } catch (err: any) {
            lastError = err
            console.warn(`❌ Failed with language '${lang}':`, err.message)
        }
    }

    // If all fail, throw a user-friendly error
    throw new Error('This video does not have captions. Please try another video or upload a file.')
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
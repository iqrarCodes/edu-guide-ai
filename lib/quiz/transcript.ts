import { getSubtitles } from 'youtube-captions-scraper'

export async function getTranscript(videoUrl: string, preferredLanguage: string = 'en') {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) throw new Error('Invalid YouTube URL')

    // Try multiple languages in order
    const languages = [preferredLanguage, 'en', 'en-US', 'en-GB', 'auto']
    let lastError: Error | null = null

    for (const lang of languages) {
        try {
            console.log(`🔄 Trying to fetch transcript with language: ${lang}`)
            const subtitles = await getSubtitles({
                videoID: videoId,
                lang: lang,
            })
            if (!subtitles || subtitles.length === 0) {
                console.warn(`⚠️ No subtitles found for language: ${lang}`)
                continue
            }
            const text = subtitles.map((s: any) => s.text).join(' ')
            console.log(`✅ Transcript fetched successfully in language: ${lang}`)
            return { text, languageUsed: lang }
        } catch (err: any) {
            lastError = err
            console.warn(`❌ Failed with language '${lang}':`, err.message)
        }
    }

    // Final fallback: without language (library default)
    try {
        console.log('🔄 Trying without language specification...')
        const subtitles = await getSubtitles({ videoID: videoId })
        const text = subtitles.map((s: any) => s.text).join(' ')
        return { text, languageUsed: 'default' }
    } catch (err: any) {
        console.error('🔥 Final fallback failed:', err)
        throw new Error('This video does not have captions. Please try another video or upload a file.')
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
import axios from 'axios'
import { YoutubeTranscript } from 'youtube-transcript'

export async function getTranscript(videoUrl: string) {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) throw new Error('Invalid YouTube URL')

    // ----- Method 1: youtube-transcript (direct – may fail on Vercel) -----
    try {
        console.log('🔍 Trying youtube-transcript...')
        const transcript = await YoutubeTranscript.fetchTranscript(videoId)
        const text = transcript.map((item: any) => item.text).join(' ')
        if (text.trim()) {
            console.log('✅ youtube-transcript success')
            return { text, languageUsed: 'en' }
        }
    } catch (err: any) {
        console.warn('⚠️ youtube-transcript failed:', err.message)
    }

    // ----- Method 2: Proxy fetch (allorigins.win) -----
    try {
        console.log('🔍 Trying proxy fetch...')
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`
        const { data: html } = await axios.get(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        // Extract ytInitialPlayerResponse JSON from HTML
        const match = html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});\s*(?:var|<\/script>)/)
        if (!match) throw new Error('Could not find player response')

        const playerResponse = JSON.parse(match[1])
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (!captions || captions.length === 0) {
            throw new Error('No captions found')
        }

        let track = captions.find((c: any) => c.languageCode?.startsWith('en')) || captions[0]

        // Fetch transcript XML using proxy as well (to avoid IP block)
        const transcriptProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(track.baseUrl)}`
        const { data: xml } = await axios.get(transcriptProxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        const text = xml
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

        if (!text) throw new Error('Empty transcript')
        console.log('✅ Proxy fetch success')
        return { text, languageUsed: track.languageCode }
    } catch (err: any) {
        console.warn('⚠️ Proxy fetch failed:', err.message)
    }

    // ----- All methods failed -----
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
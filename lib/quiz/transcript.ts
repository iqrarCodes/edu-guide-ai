import axios from 'axios'
import ytdl from '@distube/ytdl-core'
import { YoutubeTranscript } from 'youtube-transcript'

export async function getTranscript(videoUrl: string) {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) throw new Error('Invalid YouTube URL')

    // ----- Method 1: ytdl-core (best for serverless) -----
    try {
        console.log('🔍 Trying ytdl-core method...')
        const info = await ytdl.getInfo(videoId, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        })
        const captions = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (captions && captions.length > 0) {
            let track = captions.find((c: any) => c.languageCode?.startsWith('en'))
            if (!track) track = captions[0]
            const { data: xml } = await axios.get(track.baseUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })
            const text = xml
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
            if (text) {
                console.log('✅ ytdl-core success')
                return { text, languageUsed: track.languageCode }
            }
        }
    } catch (err: any) {
        console.warn('⚠️ ytdl-core failed:', err.message)
    }

    // ----- Method 2: youtube-transcript (fallback) -----
    try {
        console.log('🔍 Trying youtube-transcript method...')
        const transcript = await YoutubeTranscript.fetchTranscript(videoId)
        const text = transcript.map((item: any) => item.text).join(' ')
        if (text.trim().length > 0) {
            console.log('✅ youtube-transcript success')
            return { text, languageUsed: 'en' }
        }
    } catch (err: any) {
        console.warn('⚠️ youtube-transcript failed:', err.message)
    }

    // ----- Method 3: Direct scraping (last resort) -----
    try {
        console.log('🔍 Trying direct scrape method...')
        const { data: html } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })
        const match = html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});\s*(?:var|<\/script>)/)
        if (match) {
            const playerResponse = JSON.parse(match[1])
            const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
            if (captions && captions.length > 0) {
                let track = captions.find((c: any) => c.languageCode?.startsWith('en'))
                if (!track) track = captions[0]
                const { data: xml } = await axios.get(track.baseUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                })
                const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                if (text) {
                    console.log('✅ direct scrape success')
                    return { text, languageUsed: track.languageCode }
                }
            }
        }
    } catch (err: any) {
        console.warn('⚠️ direct scrape failed:', err.message)
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
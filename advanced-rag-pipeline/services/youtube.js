import { YoutubeTranscript } from "youtube-transcript"


function getVideoId(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
    if (!match) throw new Error('Invalid YouTube URL')
    return match[1]
}

export async function extractYoutube(url) {
    const videoId = getVideoId(url)

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcript || transcript.length === 0) {
        throw new Error("No transcript available for this video")
    }

    return transcript.map(e => e.text).join(' ')
}
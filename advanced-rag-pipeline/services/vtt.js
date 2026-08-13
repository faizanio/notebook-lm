import fs from 'fs/promises'
import { getSignedCloudinaryUrl } from '../utils/cloudinaryHelper.js'

export async function extractVtt(fileUrl) {
    let fetchUrl = getSignedCloudinaryUrl(fileUrl)
    let res = await fetch(fetchUrl)
    if (!res.ok && fetchUrl !== fileUrl) {
        res = await fetch(fileUrl)
    }
    if (!res.ok) {
        throw new Error(`Failed to fetch VTT from Cloudinary: ${res.status}`)
    }
    const raw = await res.text()

    const lines = raw.split('\n')
    const textLines = []

    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed === 'WEBVTT') continue
        if (/^\d+$/.test(trimmed)) continue
        if (/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}/.test(trimmed)) continue
        if (trimmed.startsWith('NOTE')) continue
        textLines.push(trimmed.replace(/<[^>]+>/g, ''))
    }

    const text = textLines.join(' ').replace(/\s+/g, ' ').trim()
    if (!text) throw new Error('No extractable text found in VTT file')
    return text
}
import fs from 'fs/promises'
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { getSignedCloudinaryUrl } from '../utils/cloudinaryHelper.js';

export async function readPdfText(fileUrl) {
    let fetchUrl = getSignedCloudinaryUrl(fileUrl)
    let res = await fetch(fetchUrl)
    if (!res.ok && fetchUrl !== fileUrl) {
        res = await fetch(fileUrl)
    }
    if (!res.ok) {
        throw new Error(`Failed to fetch PDF from Cloudinary: ${res.status}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const data = await pdfParse(buffer)
    return data.text
}
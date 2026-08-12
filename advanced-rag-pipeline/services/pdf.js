import fs from 'fs/promises'
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { getSignedCloudinaryUrl } from '../utils/cloudinaryHelper.js';

export async function readPdfText(fileUrl) {
    const fetchUrl = getSignedCloudinaryUrl(fileUrl)
    const res = await fetch(fetchUrl)
    if (!res.ok) {
        throw new Error(`Failed to fetch PDF from Cloudinary: ${res.status}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const data = await pdfParse(buffer)
    return data.text
}
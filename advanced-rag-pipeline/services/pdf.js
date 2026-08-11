import fs from 'fs/promises'
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function readPdfText(fileUrl) {
    // const buffer = await fs.readFile(filepath)

    // const data = await pdfParse(buffer)

    // return data.text
    const res = await fetch(fileUrl)
    if (!res.ok) {
        throw new Error(`Failed to fetch PDF from Cloudinary: ${res.status}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const data = await pdfParse(buffer)
    return data.text
}
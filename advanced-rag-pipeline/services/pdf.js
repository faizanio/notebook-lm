import fs from 'fs/promises'
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function readPdfText(filepath){
    const buffer = await fs.readFile(filepath)

    const data = await pdfParse(buffer)

    return data.text
}
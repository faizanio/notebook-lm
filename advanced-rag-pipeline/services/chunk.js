


export async function chunkText(text, chunkSize=1000, overlap=200){
    const clean = text.replace(/\s+/g, " ").trim()

    if(!clean) return []

    const chunks = []

    let start = 0;

    while(start < clean.length){

        let end = Math.min(
            start + chunkSize,
            clean.length
        )

        if(end < clean.length){

            const lastSpace = clean.lastIndexOf(" ", end)

            if(lastSpace > start){
                end = lastSpace
            }
        }

        chunks.push(
            clean.slice(start, end).trim()
        )

        if(end >= clean.length){
            break
        }

        start = end - overlap
    }

    return chunks
}
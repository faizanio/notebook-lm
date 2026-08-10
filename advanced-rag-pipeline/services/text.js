

export async function extractText(content) {
    if (!content || typeof content !== 'string') {
        throw new Error("Text content is missing or invalid")
    }

    return content
}
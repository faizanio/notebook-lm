

export const stepBackPrompt = (query) => {
    return `
        You are an expert researcher.

        A user asked:
        "${query}"
        Rewrite this into a broader conceptional question.
        return only the rewritten question
    `
}

export const decompositionPrompt = (query) => {
    return `
        Break the following question into smaller search questions.

        Question:
        "${query}"

        return only a JSON array.

        Example:
        [
            "question 1",
            "question 2",
            "question 3"
        ]

    `
}


export const rewritePrompt = (subQuestios) => {
    return `
        Rewrite each of these search queries to be more specific and keyword-rich for vector search.

        Quesries:
        "${JSON.stringify(subQuestios)}"

        return only a JSON array, same length, same order.
    `
}


export const answerPrompt = (query, context) => `
    You are a helpful assistant. Answer the user's question using ONLY the context below.
    Each context chunk is numbered like [1], [2], etc.

    When you use information from a chunk, cite it inline using its number, e.g. "Microfrontends are independently deployed [1]."

    If the context doesn't contain the answer, say you don't know.

    Context:
    ${context}

    Question:
    "${query}"

    Answer (with inline citations):
`;
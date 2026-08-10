import * as cheerio from 'cheerio'

export async function extractUrl(url) {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RAGBot/1.0)' }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    $('script, style, noscript, header, footer, nav, iframe, form, [role="complementary"], [role="navigation"]').remove()

    const text = $('body').text().replace(/\s+/g, ' ').trim()

    if (!text) {
        throw new Error('No extractable text found at URL')
    }

    return text
}
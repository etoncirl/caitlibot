/**
 * Utility for extracting relevant syllabus text chunks.
 */
const fs = require('fs');
const path = require('path');

/**
 * Break text into overlapping chunks
 */
function createChunks(inputText) {
    const chunkSize = 1024;
    const offset = chunkSize / 2;
    const length = inputText.length;
    let chunks = [];
    let start = 0;
    while (start < length) {
        let end = start + chunkSize;
        if (end > length) {
            end = length;
        }
        let chunk = inputText.slice(start, end);
        if (end === length && chunk.length < offset / 2 && chunks.length > 0) {
            chunks[chunks.length - 1] += chunk;
        } else {
            chunks.push(chunk);
        }
        start += offset;
    }
    return chunks;
}

/**
 * Score a text chunk based on keyword proximity
 */
function scoreChunk(chunkText, keywords) {


    let chunkWords = chunkText.toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/).filter(Boolean);
    let score = 0;
    let indices = [];
    for (let keyword of keywords) {
        for (let i = 0; i < chunkWords.length; i++) {
            if (chunkWords[i] === keyword) {
                indices.push(i);
                score += 5;
            }
        }
    }
    indices.sort((a, b) => a - b);
    for (let i = 0; i < indices.length - 1; i++) {
        let dist = indices[i + 1] - indices[i];
        if (dist > 0) {
            score += Math.max(0, 10 - dist);
        }
    }
    const allKeywordsPresent = keywords.every(k => chunkWords.includes(k));
    if (allKeywordsPresent) {
        score += 50;
    }
    return score;
}

/**
 * Return the best matching chunks for a search string
 */
function getSpecChunks(subjectId, searchString, noOfResults) {
    // 1. Locate specification directory
    const specsDir = path.join(__dirname, "../../data/specs");
    if (!fs.existsSync(specsDir)) {
        fs.mkdirSync(specsDir, { recursive: true });
    }
    
    const textFileName = path.join(specsDir, subjectId + ".txt");

    // 2. Load specification text
    let text = fs.readFileSync(textFileName, { encoding: 'utf8' });
    
    // 3. Generate overlapping chunks
    const chunks = createChunks(text.toString());
    const commonWords = new Set([
        'the', 'and', 'or', 'in', 'of', 'to', 'a', 'is', 'it', 'for', 'on', 'at', 'by', 'an', 'be', 'as', 'are',
        'this', 'that', 'with', 'but', 'from', 'they', 'he', 'she', 'we', 'you', 'not', 'was', 'were', 'can', 'will',
        'would', 'could', 'should', 'there', 'their', 'then'
    ]);

    let cleaned = searchString.toLowerCase().replace(/[^a-z]/g, ' ');
    let keywords = cleaned.split(/\s+/).filter(Boolean).filter(w => !commonWords.has(w));
    if (keywords.length === 0) {
        return [];
    }
    // 4. Score each chunk against keywords
    let scoredChunks = chunks.map((chunk, idx) => {
        return {
            index: idx,
            text: chunk,
            score: scoreChunk(chunk, keywords)
        };
    });
    scoredChunks.sort((a, b) => b.score - a.score);
    // 5. Return top scoring snippets
    scoredChunks = scoredChunks.slice(0, noOfResults).map((chunk) => chunk.text);
    return scoredChunks;
}

module.exports = getSpecChunks;

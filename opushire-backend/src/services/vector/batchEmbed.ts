/**
 * Natively chunks massive LLM embedding arrays (such as processing 100 jobs at once)
 * into smaller parallel groupings to bypass strict Gemini/OpenAI API Rate Limits.
 */
export async function batchEmbed<T>(texts: T[], embedFn: (item: T) => Promise<any>, size: number = 20): Promise<any[]> {
  const out = [];
  
  for (let i = 0; i < texts.length; i += size) {
    const chunk = texts.slice(i, i + size);
    
    // Execute all items inside this chunk precisely in parallel
    const vecs = await Promise.all(chunk.map(embedFn));
    out.push(...vecs);
  }
  
  return out;
}

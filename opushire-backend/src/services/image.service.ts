import axios from 'axios';

/**
 * Fetches an image from a URL and converts it to a Base64 data URI.
 * @param url The URL of the image to fetch.
 * @returns A promise that resolves to the Base64 data URI or the original URL if fetching fails.
 */
export const imageToBase64 = async (url: string): Promise<string> => {
    if (!url || url.startsWith('data:')) return url;

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        let contentType = response.headers['content-type'] || 'image/png';
        // Handle cases where multiple content-types might be returned or other weirdness
        if (contentType.includes(';')) contentType = contentType.split(';')[0];

        const base64 = Buffer.from(response.data as any, 'binary').toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (error: any) {
        console.error(`❌ Failed to convert image to base64: ${url}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
        } else {
            console.error(`   Error: ${error.message}`);
        }
        return url; // Fallback to original URL if fetch fails
    }
};

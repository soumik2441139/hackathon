import axios from 'axios';

/**
 * Fetches an image from a URL and converts it to a Base64 data URI.
 * @param url The URL of the image to fetch.
 * @returns A promise that resolves to the Base64 data URI or the original URL if fetching fails.
 */
export const imageToBase64 = async (url: string): Promise<string> => {
    if (!url || url.startsWith('data:')) return url;

    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];
        const base64 = Buffer.from(response.data as any, 'binary').toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error(`Failed to convert image to base64: ${url}`, error);
        return url; // Fallback to original URL if fetch fails
    }
};

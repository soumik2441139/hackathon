import { imageToBase64 } from './src/services/image.service';

const test = async () => {
    const url = 'https://unavatar.io/vercel.com';
    try {
        const base64 = await imageToBase64(url);
        console.log('URL:', url);
        console.log('Is Base64:', base64.startsWith('data:'));
    } catch (err) {
        console.error('Test script caught error:', err);
    }
};

test();

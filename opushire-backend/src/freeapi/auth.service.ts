import FormData from 'form-data';
import { freeApiClient } from './freeapi.client';

export class FreeApiAuthService {
    // We use a deterministic password for the shadow accounts
    private static getShadowPassword(email: string) {
        return `OpusHire!${Buffer.from(email).toString('base64').slice(0, 10)}`;
    }

    /**
     * Creates a shadow account on FreeAPI or logs in if it already exists.
     * Returns the FreeAPI Bearer token and the FreeAPI User ID needed for Chat App.
     */
    static async getFreeApiAuthUser(email: string, username: string): Promise<{ token: string, freeApiUserId: string }> {
        const password = this.getShadowPassword(email);

        try {
            // Attempt to login first
            const loginRes = await freeApiClient.post('/users/login', {
                username: username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + Math.random().toString(36).slice(2, 6), // Fallback if email login needs username
                email,
                password,
            });
            return {
                token: loginRes.data.data.accessToken,
                freeApiUserId: loginRes.data.data.user._id
            };
        } catch (error: any) {
            // If login fails, try to register
            if (error.response?.status === 404 || error.response?.status === 401) {
                try {
                    // FreeAPI requires username, email, password
                    const safeUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const finalUsername = safeUsername.length > 3 ? safeUsername : `user${Math.floor(Math.random() * 10000)}`;

                    await freeApiClient.post('/users/register', {
                        username: finalUsername + Math.floor(Math.random() * 10000).toString(),
                        email,
                        password,
                    });

                    // Login after successful registration
                    const loginRes = await freeApiClient.post('/users/login', {
                        email,
                        password,
                    });
                    return {
                        token: loginRes.data.data.accessToken,
                        freeApiUserId: loginRes.data.data.user._id
                    };
                } catch (regError: any) {
                    console.error('Failed to register shadow account on FreeAPI:', regError.response?.data);
                    throw new Error('Could not establish FreeAPI session');
                }
            }
            throw error;
        }
    }

    /**
     * Legacy wrapper that just returns the token.
     */
    static async getOrGenerateToken(email: string, username: string): Promise<string> {
        const authInfo = await this.getFreeApiAuthUser(email, username);
        return authInfo.token;
    }

    /**
     * Uploads an avatar image to FreeAPI and returns the public URL.
     */
    static async uploadAvatar(token: string, fileBuffer: Buffer, filename: string, mimetype: string): Promise<string> {
        const formData = new FormData();
        formData.append('avatar', fileBuffer, {
            filename,
            contentType: mimetype,
        });

        const res = await freeApiClient.patch('/users/avatar', formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`,
            },
        });

        return res.data.data.avatar.url;
    }

    /**
     * Uploads a cover image to FreeAPI and returns the public URL.
     */
    static async uploadCoverImage(token: string, fileBuffer: Buffer, filename: string, mimetype: string): Promise<string> {
        const formData = new FormData();
        formData.append('coverImage', fileBuffer, {
            filename,
            contentType: mimetype,
        });

        const res = await freeApiClient.patch('/users/cover-image', formData, {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${token}`,
            },
        });

        return res.data.data.coverImage.url;
    }
}

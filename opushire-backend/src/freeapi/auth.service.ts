import FormData from 'form-data';
import { freeApiClient } from './freeapi.client';

export class FreeApiAuthService {
    // We use a deterministic password for the shadow accounts
    private static getShadowPassword(email: string) {
        return `OpusHire!${Buffer.from(email).toString('base64').slice(0, 10)}`;
    }

    private static getShadowUsername(username: string, email: string): string {
        const cleanedUsername = (username || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const emailPrefix = (email.split('@')[0] || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const base = (cleanedUsername || emailPrefix || 'user').slice(0, 18);
        const suffix = Buffer.from(email.toLowerCase()).toString('hex').slice(0, 6);
        const candidate = `${base}${suffix}`;
        return candidate.length >= 4 ? candidate : `${candidate}user`;
    }

    private static parseAuthResponse(payload: any): { token: string; freeApiUserId: string } {
        const token = payload?.data?.accessToken;
        const freeApiUserId = payload?.data?.user?._id;

        if (!token || !freeApiUserId) {
            throw new Error('FreeAPI auth response missing token or user id');
        }

        return { token, freeApiUserId };
    }

    /**
     * Creates a shadow account on FreeAPI or logs in if it already exists.
     * Returns the FreeAPI Bearer token and the FreeAPI User ID needed for Chat App.
     */
    static async getFreeApiAuthUser(email: string, username: string): Promise<{ token: string, freeApiUserId: string }> {
        const password = this.getShadowPassword(email);
        const shadowUsername = this.getShadowUsername(username, email);

        // Handle 401/404 as expected first-time states to avoid noisy interceptor error logs.
        const firstLogin = await freeApiClient.post('/users/login', {
            email,
            password,
        }, {
            validateStatus: (status) => status === 200 || status === 401 || status === 404,
        });

        if (firstLogin.status === 200) {
            return this.parseAuthResponse(firstLogin.data);
        }

        const registerRes = await freeApiClient.post('/users/register', {
            username: shadowUsername,
            email,
            password,
        }, {
            validateStatus: (status) => status === 200 || status === 201 || status === 400 || status === 409,
        });

        const registerMessage = String(registerRes.data?.message || '').toLowerCase();
        const alreadyExists = registerMessage.includes('already') && registerMessage.includes('exist');
        const canProceedToLogin = registerRes.status === 200 || registerRes.status === 201 || registerRes.status === 409 || alreadyExists;

        if (!canProceedToLogin) {
            throw new Error(`Could not establish FreeAPI session (register status ${registerRes.status})`);
        }

        const secondLogin = await freeApiClient.post('/users/login', {
            email,
            password,
        }, {
            validateStatus: (status) => status === 200 || status === 401 || status === 404,
        });

        if (secondLogin.status !== 200) {
            throw new Error(`Could not establish FreeAPI session (login status ${secondLogin.status})`);
        }

        return this.parseAuthResponse(secondLogin.data);
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('opushire_token');
}

async function request<T>(
    path: string,
    options: RequestInit = { cache: 'no-store' }
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
        const error = new Error(data.message || 'Something went wrong') as Error & { fields?: unknown };
        error.fields = data.errors; // Capture Zod field errors
        throw error;
    }
    return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthResponse {
    success: boolean;
    data: { user: import('./types').User; token: string };
}

export const auth = {
    register: (body: {
        name: string; email: string; password: string;
        role?: string; college?: string; degree?: string; year?: string;
    }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
        request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    getMe: () =>
        request<{ success: boolean; data: import('./types').User }>('/auth/me'),

    updateProfile: (body: Partial<import('./types').User>) =>
        request<{ success: boolean; data: import('./types').User }>('/auth/me', {
            method: 'PUT', body: JSON.stringify(body),
        }),
};

// ─── FreeAPI (File Uploads) ──────────────────────────────────────────────────
export const freeapi = {
    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return request<{ success: boolean; data: { avatarUrl: string } }>('/freeapi/users/avatar', {
            method: 'PATCH',
            body: formData,
        });
    },

    uploadCoverImage: (file: File) => {
        const formData = new FormData();
        formData.append('coverImage', file);
        return request<{ success: boolean; data: { coverUrl: string } }>('/freeapi/users/cover-image', {
            method: 'PATCH',
            body: formData,
        });
    },

    social: {
        saveJob: (jobId: string) =>
            request<{ success: boolean; data: { isSaved: boolean } }>(`/freeapi/jobs/${jobId}/save`, { method: 'POST' }),
    },

    chat: {
        getAllChats: () =>
            request<{ success: boolean; data: { chats: Record<string, unknown>[] } }>('/freeapi/chats'),

        createOrGetChat: (receiverId: string) =>
            request<{ success: boolean; data: { chat: Record<string, unknown> } }>(`/freeapi/chats/user/${receiverId}`, {
                method: 'POST'
            }),

        getMessages: (chatId: string) =>
            request<{ success: boolean; data: { messages: Record<string, unknown>[] } }>(`/freeapi/chats/${chatId}/messages`),

        sendMessage: (chatId: string, content: string) =>
            request<{ success: boolean; data: { message: Record<string, unknown> } }>(`/freeapi/chats/${chatId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content })
            }),
    }
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export interface JobsResponse {
    success: boolean;
    data: {
        jobs: import('./types').Job[];
        pagination: { total: number; page: number; limit: number; pages: number };
    };
}

export interface JobFilters {
    q?: string; type?: string; mode?: string;
    city?: string; featured?: string; page?: number; limit?: number;
    postedBy?: string;
}

export const jobs = {
    getAll: (filters: JobFilters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== '') params.set(k, String(v));
        });
        const qs = params.toString();
        return request<JobsResponse>(`/jobs${qs ? `?${qs}` : ''}`);
    },

    getById: (id: string) =>
        request<{ success: boolean; data: import('./types').Job }>(`/jobs/${id}`),

    create: (body: object) =>
        request<{ success: boolean; data: import('./types').Job }>('/jobs', {
            method: 'POST', body: JSON.stringify(body),
        }),

    update: (id: string, body: object) =>
        request<{ success: boolean; data: import('./types').Job }>(`/jobs/${id}`, {
            method: 'PUT', body: JSON.stringify(body),
        }),

    delete: (id: string) =>
        request<{ success: boolean; data: { message: string } }>(`/jobs/${id}`, {
            method: 'DELETE',
        }),

    getStats: () =>
        request<{ success: boolean; data: { activeJobs: number; totalApplicants: number; profileViews: string } }>('/jobs/stats/me'),
};

// ─── Applications ─────────────────────────────────────────────────────────────
export interface ApplyBody {
    jobId: string; coverLetter?: string; phone?: string; linkedin?: string;
}

export const applications = {
    apply: (body: ApplyBody) =>
        request<{ success: boolean; data: import('./types').Application }>('/applications', {
            method: 'POST', body: JSON.stringify(body),
        }),

    getMine: () =>
        request<{ success: boolean; data: import('./types').Application[] }>('/applications/my'),

    getAll: (jobId?: string) => {
        const qs = jobId ? `?jobId=${jobId}` : '';
        return request<{ success: boolean; data: import('./types').Application[] }>(`/applications${qs}`);
    },

    updateStatus: (id: string, status: string) =>
        request<{ success: boolean; data: import('./types').Application }>(`/applications/${id}/status`, {
            method: 'PUT', body: JSON.stringify({ status }),
        }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const admin = {
    getUsers: (role?: string) =>
        request<{ success: boolean; data: import('./types').User[] }>(`/admin/users${role ? `?role=${role}` : ''}`),

    deleteUser: (id: string) =>
        request<{ success: boolean; data: { message: string } }>(`/admin/users/${id}`, {
            method: 'DELETE',
        }),

    getStats: () =>
        request<{
            success: boolean; data: {
                totalJobs: number;
                totalApplicants: number;
                totalStudents: number;
                totalRecruiters: number;
                activeUsers: number;
            }
        }>('/admin/stats'),

    reSync: () =>
        request<{ success: boolean; data: unknown }>('/admin/debug-db?force=true'),

    getPendingJobs: () =>
        request<{ success: boolean; data: any[] }>('/admin/pending-jobs'),

    resolvePendingJob: (id: string, action: 'approve' | 'reject') =>
        request<{ success: boolean; data: any }>(`/admin/apply-fix/${id}`, {
            method: 'POST',
            body: JSON.stringify({ action })
        }),

    autoFixJob: (id: string) =>
        request<{ success: boolean; data: import('./types').Job }>(`/admin/cleaner/auto-fix/${id}`, {
            method: 'POST'
        }),

    bots: {
        getStatuses: () =>
            request<{ success: boolean; data: any[] }>('/admin/bots'),
        pipeline: () =>
            request<{ success: boolean; message: string }>('/admin/bots/pipeline', { method: 'POST' }),
        start: (id: string) =>
            request<{ success: boolean; data: any }>(`/admin/bots/${id}/start`, { method: 'POST' }),
        stop: (id: string) =>
            request<{ success: boolean; data: any }>(`/admin/bots/${id}/stop`, { method: 'POST' }),
        getLogs: (id: string) =>
            request<{ success: boolean; data: string[] }>(`/admin/bots/${id}/logs`),
    },

    botStats: {
        getToday: () => request<{ success: boolean; data: any }>('/admin/bot-stats/today')
    }
};

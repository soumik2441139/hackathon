const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('opushire_token');
}

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
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

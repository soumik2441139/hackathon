export type UserRole = 'student' | 'admin';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    college?: string;
    degree?: string;
    year?: string;
    skills: string[];
    bio?: string;
    avatar: string;
    createdAt: string;
    updatedAt: string;
}

export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Hired';

export interface Job {
    _id: string;
    title: string;
    company: string;
    companyLogo: string;
    location: string;
    city: string;
    type: 'Internship' | 'Full-time' | 'Part-time' | 'Contract';
    mode: 'Remote' | 'Hybrid' | 'Onsite';
    salaryMin: number;
    salaryMax: number;
    salary: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    tags: string[];
    openings: number;
    deadline?: string;
    featured: boolean;
    posted: string;
    postedBy: string | Partial<User>;
    createdAt: string;
    updatedAt: string;
}

export interface Application {
    _id: string;
    job: string | Job;
    applicant: string | User;
    status: ApplicationStatus;
    coverLetter?: string;
    phone?: string;
    linkedin?: string;
    appliedAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

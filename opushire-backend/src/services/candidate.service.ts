import mongoose from 'mongoose';
import { User } from '../models/User';
import Resume from '../models/Resume';

export interface CandidateProfile {
    candidateId: string;
    name: string;
    skills: string[];
    domains: string[];
    experienceLevel: string;      // 'intern' | 'junior' | 'mid' | etc.
    location: string;             // e.g. "Bangalore, India"
    preferredRoles: string[];     // derived from domains + experience
    remote: boolean;
    education: string[];
    projects: string[];
}

/**
 * Builds a unified candidate profile by combining the User document
 * and their most recent parsed Resume data.
 */
export async function getCandidateProfile(candidateId: string): Promise<CandidateProfile | null> {
    const [user, resume] = await Promise.all([
        User.findById(candidateId).lean(),
        Resume.findOne({ userId: new mongoose.Types.ObjectId(candidateId) })
              .sort({ createdAt: -1 })
              .lean(),
    ]);

    if (!user) return null;

    // Merge skills: user-level skills + resume parsed skills (deduplicated)
    const skillSet = new Set<string>([
        ...(user.skills || []),
        ...(resume?.parsedData?.skills || []),
    ]);

    const domains  = resume?.parsedData?.domains  || [];
    const expLevel = resume?.parsedData?.experience_level || 'junior';

    // Infer preferred roles from domains + experience level
    const preferredRoles = inferPreferredRoles(domains, expLevel);

    // Infer location from college city or default to India
    const location = inferLocation(user.college);

    return {
        candidateId: candidateId.toString(),
        name:           user.name,
        skills:         Array.from(skillSet),
        domains,
        experienceLevel: expLevel,
        location,
        preferredRoles,
        remote: false,
        education: resume?.parsedData?.education || [],
        projects:  resume?.parsedData?.projects  || [],
    };
}

function inferPreferredRoles(domains: string[], expLevel: string): string[] {
    const prefix = expLevel === 'intern' ? 'Intern' : 'Junior';
    const roles: string[] = [];

    const domainMap: Record<string, string> = {
        'frontend':         `${prefix} Frontend Developer`,
        'backend':          `${prefix} Backend Developer`,
        'fullstack':        `${prefix} Full Stack Developer`,
        'machine learning': `${prefix} ML Engineer`,
        'data science':     `${prefix} Data Scientist`,
        'devops':           `${prefix} DevOps Engineer`,
        'mobile':           `${prefix} Mobile Developer`,
        'android':          `${prefix} Android Developer`,
        'ios':              `${prefix} iOS Developer`,
        'design':           `${prefix} UI/UX Designer`,
        'blockchain':       `${prefix} Blockchain Developer`,
        'cloud':            `${prefix} Cloud Engineer`,
        'cybersecurity':    `${prefix} Security Engineer`,
    };

    for (const domain of domains) {
        const normalized = domain.toLowerCase().trim();
        for (const [key, role] of Object.entries(domainMap)) {
            if (normalized.includes(key)) {
                roles.push(role);
                break;
            }
        }
    }

    // Fallback if no domain mapped
    if (roles.length === 0) roles.push(`${prefix} Software Engineer`);

    return [...new Set(roles)];
}

function inferLocation(college?: string): string {
    if (!college) return 'India';
    const lower = college.toLowerCase();

    const cityMap: Record<string, string> = {
        'bangalore': 'Bangalore, India', 'bengaluru': 'Bangalore, India',
        'mumbai': 'Mumbai, India', 'delhi': 'Delhi, India',
        'hyderabad': 'Hyderabad, India', 'pune': 'Pune, India',
        'chennai': 'Chennai, India', 'kolkata': 'Kolkata, India',
        'noida': 'Noida, India', 'gurgaon': 'Gurgaon, India',
        'bhubaneswar': 'Bhubaneswar, India', 'odisha': 'Bhubaneswar, India',
        'jaipur': 'Jaipur, India', 'ahmedabad': 'Ahmedabad, India',
        'kochi': 'Kochi, India', 'indore': 'Indore, India',
        'chandigarh': 'Chandigarh, India',
    };

    for (const [key, city] of Object.entries(cityMap)) {
        if (lower.includes(key)) return city;
    }

    return 'India';
}

import { Student } from '../models/Student';
import { Recruiter } from '../models/Recruiter';
import { Admin } from '../models/Admin';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { createError } from '../middleware/errorHandler';

export const getAllUsers = async (role?: string) => {
    if (role === 'student') return Student.find().sort({ createdAt: -1 });
    if (role === 'recruiter') return Recruiter.find().sort({ createdAt: -1 });
    if (role === 'admin') return Admin.find().sort({ createdAt: -1 });

    // If no role, aggregate all (simple approach)
    const [students, recruiters, admins] = await Promise.all([
        Student.find(),
        Recruiter.find(),
        Admin.find()
    ]);
    return [...students, ...recruiters, ...admins].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const deleteUser = async (userId: string) => {
    // Attempt deletion from all collections
    let user = await Student.findByIdAndDelete(userId);
    if (!user) user = await Recruiter.findByIdAndDelete(userId);
    if (!user) user = await Admin.findByIdAndDelete(userId);

    if (!user) throw createError('User not found', 404);

    // Cleanup: Delete jobs posted by recruiter
    if (user.role === 'recruiter') {
        await Job.deleteMany({ postedBy: userId });
    }

    // Cleanup: Delete applications by student
    if (user.role === 'student') {
        await Application.deleteMany({ applicant: userId });
    }

    return { message: 'User and associated data deleted successfully' };
};

export const getSystemStats = async () => {
    const [totalJobs, totalApplicants, totalStudents, totalRecruiters] = await Promise.all([
        Job.countDocuments(),
        Application.countDocuments(),
        Student.countDocuments(),
        Recruiter.countDocuments()
    ]);

    return {
        totalJobs,
        totalApplicants,
        totalStudents,
        totalRecruiters,
        activeUsers: totalStudents + totalRecruiters // Simple sum for now
    };
};

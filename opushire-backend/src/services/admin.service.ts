import { User } from '../models/User';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { createError } from '../middleware/errorHandler';

export const getAllUsers = async (role?: string) => {
    const query = role ? { role } : {};
    return User.find(query).sort({ createdAt: -1 });
};

export const deleteUser = async (userId: string) => {
    const user = await User.findByIdAndDelete(userId);
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
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'recruiter' })
    ]);

    return {
        totalJobs,
        totalApplicants,
        totalStudents,
        totalRecruiters,
        activeUsers: totalStudents + totalRecruiters // Simple sum for now
    };
};

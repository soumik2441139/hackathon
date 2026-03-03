import { Request, Response } from 'express';
import { FreeApiAuthService } from './auth.service';
import { Student } from '../models/Student';
import { Recruiter } from '../models/Recruiter';
import { Admin } from '../models/Admin';

async function findUserAnywhere(userId: string) {
    let user = await Student.findById(userId);
    if (!user) user = await Recruiter.findById(userId);
    if (!user) user = await Admin.findById(userId);
    return user;
}

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No image file provided' });
            return;
        }

        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const user = await findUserAnywhere(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        // 1. Get FreeAPI token for this specific user
        const token = await FreeApiAuthService.getOrGenerateToken(user.email, user.name);

        // 2. Upload avatar to FreeAPI and get the public URL back
        const avatarUrl = await FreeApiAuthService.uploadAvatar(
            token,
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        // 3. Save URL to local OpusHire DB
        // Determine the collection to update
        if ((user as any).role === 'student') await Student.findByIdAndUpdate(userId, { avatar: avatarUrl });
        else if ((user as any).role === 'recruiter') await Recruiter.findByIdAndUpdate(userId, { avatar: avatarUrl });
        else if ((user as any).role === 'admin') await Admin.findByIdAndUpdate(userId, { avatar: avatarUrl });

        res.json({
            success: true,
            message: 'Avatar updated successfully',
            data: { avatarUrl },
        });
    } catch (error: any) {
        console.error('❌ [FreeAPI] Error uploading avatar:', error.message);
        res.status(500).json({ success: false, message: 'Failed to upload avatar' });
    }
};

export const uploadCoverImage = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No image file provided' });
            return;
        }

        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const user = await findUserAnywhere(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const token = await FreeApiAuthService.getOrGenerateToken(user.email, user.name);

        const coverUrl = await FreeApiAuthService.uploadCoverImage(
            token,
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        if ((user as any).role === 'student') await Student.findByIdAndUpdate(userId, { avatar: coverUrl }); // You probably want coverImage field, but mapping to avatar for now if missing
        else if ((user as any).role === 'recruiter') await Recruiter.findByIdAndUpdate(userId, { companyLogo: coverUrl });
        else if ((user as any).role === 'admin') await Admin.findByIdAndUpdate(userId, { avatar: coverUrl });

        res.json({
            success: true,
            message: 'Cover image updated successfully',
            data: { coverUrl },
        });
    } catch (error: any) {
        console.error('❌ [FreeAPI] Error uploading cover image:', error.message);
        res.status(500).json({ success: false, message: 'Failed to upload cover image' });
    }
};

import { FreeApiSocialService } from './social.service';

export const toggleSaveJob = async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobId } = req.params;
        const userId = (req as any).user?.id;

        const user = await findUserAnywhere(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const token = await FreeApiAuthService.getOrGenerateToken(user.email, user.name);
        // Call FreeAPI to toggle like status
        const { isLiked } = await FreeApiSocialService.toggleSaveJob(token, String(jobId));

        // Sync with our local MongoDB for fast retrieval on profile page
        if (isLiked) {
            await (user.constructor as any).findByIdAndUpdate(userId, { $addToSet: { savedJobs: jobId } });
        } else {
            await (user.constructor as any).findByIdAndUpdate(userId, { $pull: { savedJobs: jobId } });
        }

        res.json({ success: true, data: { isSaved: isLiked } });
    } catch (error: any) {
        console.error('❌ [FreeAPI] Error saving/liking job:', error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle save status' });
    }
};



import { FreeApiChatService } from './chat.service';

export const getAllChats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const user = await findUserAnywhere(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const token = await FreeApiAuthService.getOrGenerateToken(user.email, user.name);
        const chats = await FreeApiChatService.getAllChats(token);

        res.json({ success: true, data: { chats } });
    } catch (error: any) {
        console.error('❌ [FreeAPI] Error getting all chats:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get chats' });
    }
};

export const createOrGetChat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { receiverId } = req.params; // This is the OpusHire Recruiter/Student ID
        const userId = (req as any).user?.id; // Current user

        const currentUser = await findUserAnywhere(userId);
        const receiverUser = await findUserAnywhere(String(receiverId));

        if (!currentUser || !receiverUser) {
            res.status(404).json({ success: false, message: 'User or Receiver not found' });
            return;
        }

        // 1. Get current user's token
        const currentUserAuth = await FreeApiAuthService.getFreeApiAuthUser(currentUser.email, currentUser.name);

        // 2. We need receiver's FreeAPI ID. 
        // We can just call getFreeApiAuthUser for the receiver to ensure their shadow account exists and get their FreeAPI ID!
        const receiverAuth = await FreeApiAuthService.getFreeApiAuthUser(receiverUser.email, receiverUser.name);

        // 3. Create chat on FreeAPI
        const chat = await FreeApiChatService.createOrGetChat(currentUserAuth.token, receiverAuth.freeApiUserId);

        res.json({ success: true, data: { chat } });
    } catch (error: any) {
        console.error('❌ [FreeAPI] Error creating chat:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create chat' });
    }
};

export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
        const userId = (req as any).user?.id;

        const user = await findUserAnywhere(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const token = await FreeApiAuthService.getOrGenerateToken(user.email, user.name);
        const messages = await FreeApiChatService.getChatMessages(token, String(chatId));

        res.json({ success: true, data: { messages } });
    } catch (error: any) {
        console.error('❌ [FreeAPI] Error getting chat messages:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const userId = (req as any).user?.id;

        if (!content) {
            res.status(400).json({ success: false, message: 'Message content is required' });
            return;
        }

        const user = await findUserAnywhere(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const token = await FreeApiAuthService.getOrGenerateToken(user.email, user.name);
        const message = await FreeApiChatService.sendMessage(token, String(chatId), content);

        res.json({ success: true, data: { message } });
    } catch (error: any) {
        console.error('❌ [FreeAPI] Error sending message:', error.message);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

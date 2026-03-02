import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import {
    uploadAvatar,
    uploadCoverImage,
    toggleSaveJob,
    getAllChats,
    createOrGetChat,
    getChatMessages,
    sendMessage
} from './freeapi.controller';

const router = Router();

// Store files in memory temporarily before sending them to FreeAPI
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// Protected routes (require user login)
router.patch('/users/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.patch('/users/cover-image', authenticate, upload.single('coverImage'), uploadCoverImage);

// Social routes
router.post('/jobs/:jobId/save', authenticate, toggleSaveJob);

// Chat routes
router.get('/chats', authenticate, getAllChats);
router.post('/chats/user/:receiverId', authenticate, createOrGetChat);
router.get('/chats/:chatId/messages', authenticate, getChatMessages);
router.post('/chats/:chatId/messages', authenticate, sendMessage);

export default router;

import mongoose from 'mongoose';
import { IUser, UserSchema } from './User';

export const Recruiter = mongoose.model<IUser>('Recruiter', UserSchema, 'recruiters');

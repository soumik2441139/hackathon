import mongoose from 'mongoose';
import { IUser, UserSchema } from './User';

export const Student = mongoose.model<IUser>('Student', UserSchema, 'students');

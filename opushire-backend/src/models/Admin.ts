import mongoose from 'mongoose';
import { IUser, UserSchema } from './User';

export const Admin = mongoose.model<IUser>('Admin', UserSchema, 'admins');

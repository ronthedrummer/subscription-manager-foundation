import mongoose from 'mongoose';
import { UserDocument } from '@models/user.model';

export interface OrganizationDocument extends mongoose.Document {
  name: string;
  createdAt: Date;
  owner: UserDocument['_id'];
}

const OrganizationSchema = new mongoose.Schema<OrganizationDocument>({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export const Organization = mongoose.model<OrganizationDocument>(
  'Organization',
  OrganizationSchema
);

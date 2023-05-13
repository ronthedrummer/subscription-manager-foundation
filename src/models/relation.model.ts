import { Schema, model, Document, PopulatedDoc } from 'mongoose';
import { UserDocument } from '@models/user.model';
import { OrganizationDocument } from '@models/organization.model';

interface Relation {
  user: PopulatedDoc<UserDocument & Document>;
  organization: OrganizationDocument['_id'];
  role: string;
}

export type RelationDocument = Relation & Document;

const relationSchema = new Schema<Relation>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
  role: String
});

export const Relation = model<RelationDocument>('Relation', relationSchema);

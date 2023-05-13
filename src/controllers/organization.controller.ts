import { Request, Response, NextFunction } from 'express';
import { Organization, OrganizationDocument } from '@models/organization.model';
import { User, UserDocument } from '@models/user.model';

interface URequest extends Request {
  userId?: string;
}

export async function createOrganization(name: string, ownerId: string) {
  try {
    const owner = await User.findById(ownerId);

    if (!owner) {
      throw new Error(`User not found when creating org: ${ownerId}`);
    }

    const newOrganization = new Organization({
      name,
      owner: owner._id
    });

    const savedOrganization = await newOrganization.save();

    owner.organizations.push(savedOrganization._id);
    await owner.save();

    return savedOrganization;
  } catch (error) {
    return { error };
  }
}

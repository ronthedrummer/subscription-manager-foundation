// src/controllers/relation.controller.ts

import { Request, Response } from 'express';
import { Relation } from '@models/relation.model';
import { User } from '@models/user.model';
import { Organization } from '@models/organization.model';

export const addUserToOrganization = async (req: Request, res: Response) => {
  const { userId, organizationId, role } = req.body;

  const user = await User.findById(userId);
  const organization = await Organization.findById(organizationId);

  if (!user || !organization) {
    return res.status(404).json({ message: 'User or Organization not found' });
  }

  const relation = new Relation({
    user: userId,
    organization: organizationId,
    role
  });

  await relation.save();

  res.status(201).json({ message: 'User added to the organization', relation });
};

export const getUsersInOrganization = async (req: Request, res: Response) => {
  const { organizationId } = req.params;

  const relations = await Relation.find({ organization: organizationId })
    .populate('user', 'email firstName lastName')
    .select('user role');

  res.json({ relations });
};

export const getOrganizationsForUser = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const relations = await Relation.find({ user: userId })
    .populate('organization', 'name')
    .select('organization role');

  res.json({ relations });
};

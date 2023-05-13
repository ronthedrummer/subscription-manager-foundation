import { Organization, OrganizationDocument } from '@models/organization.model';
import { User, UserDocument } from '@models/user.model';
import app from '@app';
import config from '@config';
import request from 'supertest';
import jwt from 'jsonwebtoken';

export const setupTestOrgAndUser = async () => {
  const userData = {
    email: 'test@test.com',
    password: 'password',
    firstName: 'Test',
    lastName: 'User',
    organizationName: 'Test Org',
    organizationRole: 'owner'
  };

  const response = await request(app).post('/api/users').send(userData);
  const user: UserDocument = response.body.user;

  const org: OrganizationDocument | null = response.body.organization;

  return { org, user };
};

export const getJWT = (userID: string) => {
  return jwt.sign({ userId: userID }, config.jwt_secret!, {
    expiresIn: config.jwt_term || '2d'
  });
};

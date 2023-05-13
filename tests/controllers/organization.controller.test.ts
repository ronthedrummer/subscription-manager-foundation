// tests/controllers/user.controller.test.ts
import config from '@config';
import mongoose from 'mongoose';
import db from '@db';
import httpMocks from 'node-mocks-http';
import { Organization } from '@models/organization.model';
import { Relation } from '@models/relation.model';
import { User } from '@models/user.model';
import app, { server } from '@app';
import request from 'supertest';

interface UserCredentials {
  email: string;
  password: string;
}

let createdUser: UserCredentials;
let createdUserId: string;

beforeAll(async () => {
  const uri = config.database.mongo_uri ?? '';
  await mongoose.connect(uri, {});
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Relation.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  server.close();
});

beforeEach(async () => {});

describe('OrganizationController', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeAll(async () => {
    await db;
  });

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  if (config.organizations.enabled) {
    describe('createUser with new Organization', () => {
      it('should create a new user and return the user object', async () => {
        const organization = new Organization({
          name: 'Acme Inc',
          owner: 'owner-id'
        });

        const userData = {
          email: 'test3@test.com',
          password: 'password',
          firstName: 'John',
          lastName: 'Doe',
          organizationName: organization.name,
          organizationRole: 'owner'
        };

        const response = await request(app).post('/api/users').send(userData);

        expect(response.status).toBe(201);

        expect(response.body.message).toEqual('User created successfully');

        expect(response.body.user.firstName).toEqual('John');
        expect(response.body.user.lastName).toEqual('Doe');
        expect(response.body.user.email).toEqual('test3@test.com');
        expect(response.body.user.organizations).toHaveLength(1);

        expect(response.body.organization.name).toEqual('Acme Inc');

        expect(response.body.relation.role).toEqual('owner');

        createdUser = { email: 'test3@test.com', password: 'password' };
        createdUserId = response.body.user._id;
      });
    });

    describe('create Organization based on existing user', () => {
      let jwtToken: string;

      beforeAll(async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({ email: createdUser.email, password: 'password' });

        jwtToken = response.body.token;
      });

      it('should create a new organization and return the organization object', async () => {
        const orgData = { name: 'Poppys Place', userId: createdUserId };
        const response = await request(app)
          .post('/api/organizations')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send(orgData);

        expect(response.status).toBe(201);
        expect(response.body.message).toEqual(
          'Organization created successfully'
        );
        expect(response.body.organization.name).toEqual('Poppys Place');
      });
    });
  } else {
    describe('skip Organization based testing', () => {
      it('organizations are disabled in configuration file', async () => {
        const data = '';
        expect(data).toEqual('');
      });
    });
  }
});

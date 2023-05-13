import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import config from '@config';
import db from '@db';
import { Organization } from '@models/organization.model';
import { Relation } from '@models/relation.model';
import { User } from '@models/user.model';
import app, { server } from '@app';
import request from 'supertest';

interface UserCredentials {
  id?: string;
  email: string;
  password: string;
}

let createdUserAsOwner: UserCredentials;
let createdUserAsUser: UserCredentials;
let organizationId: string;
let ownerToken: string;

beforeAll(async () => {
  const uri = config.database.mongo_uri ?? '';
  await mongoose.connect(uri, {});
});

afterAll(async () => {
  await mongoose.disconnect();
  server.close();
});

beforeEach(async () => {});

describe('UserController', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeAll(async () => {
    await db;
    // clear all data before we run any tests, only once at the begining
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Relation.deleteMany({});
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

  describe('createUser as owner with new Organization', () => {
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

      if (config.organizations.enabled) {
        expect(response.body.user.organizations).toHaveLength(1);
        expect(response.body.organization.name).toEqual('Acme Inc');
        expect(response.body.relation.role).toEqual('owner');

        organizationId = response.body.relation.organization;
      }

      createdUserAsOwner = {
        id: response.body.user.id,
        email: 'test3@test.com',
        password: 'password'
      };
    });
  });

  describe('getUser as owner that was just created', () => {
    let jwtToken: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ email: createdUserAsOwner.email, password: 'password' });

      jwtToken = ownerToken = response.body.token;
    });

    it('should return a user object', async () => {
      const response = await request(app)
        .get(`/api/users/${createdUserAsOwner.id}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);

      expect(response.body.firstName).toEqual('John');
      expect(response.body.lastName).toEqual('Doe');
      expect(response.body.email).toEqual('test3@test.com');
      if (config.organizations.enabled) {
        expect(response.body.organizations).toHaveLength(1);
      }
    });
  });

  describe('createUser as user role on existing Organization', () => {
    it('should create a new user and return the user object', async () => {
      const userData = {
        email: 'test4@test.com',
        password: 'password',
        firstName: 'James',
        lastName: 'Doe',
        organizationId: organizationId,
        organizationRole: 'user'
      };

      const response = await request(app).post('/api/users').send(userData);

      expect(response.status).toBe(201);

      expect(response.body.message).toEqual('User created successfully');

      expect(response.body.user.firstName).toEqual('James');
      expect(response.body.user.lastName).toEqual('Doe');
      expect(response.body.user.email).toEqual('test4@test.com');

      if (config.organizations.enabled) {
        expect(response.body.user.organizations).toEqual([organizationId]);
        expect(response.body.organization.id).toEqual(organizationId);
        expect(response.body.organization.name).toEqual('Acme Inc');
        expect(response.body.relation.role).toEqual('user');
      }

      createdUserAsUser = {
        id: response.body.user.id,
        email: 'test4@test.com',
        password: 'password'
      };
    });
  });

  if (config.organizations.enabled) {
    describe('getUsers for an organization', () => {
      it('should return an array of user objects with one owner and one user', async () => {
        const response = await request(app)
          .get(`/api/users/`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(200);

        expect(response.body).toHaveLength(2);
        expect(response.body[0].email).toEqual('test3@test.com');
        expect(response.body[0].firstName).toEqual('John');
        expect(response.body[0].lastName).toEqual('Doe');
        expect(response.body[1].email).toEqual('test4@test.com');
        expect(response.body[1].firstName).toEqual('James');
        expect(response.body[1].lastName).toEqual('Doe');
      });
    });
  }

  describe('resetPassword', () => {
    let token: string;
    const newPassword = 'newpassword';

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/users/forgot')
        .send({ email: createdUserAsOwner.email });

      token = response.body.token;
    });

    it('should return a 400 status when using an invalid or expired token', async () => {
      const response = await request(app)
        .post('/api/users/reset')
        .send({ password: newPassword, token: 'badtoken' });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual('Invalid or expired token');
    });

    it('should reset the password when using a valid token', async () => {
      const response = await request(app)
        .post(`/api/users/reset/`)
        .send({ password: newPassword, token });

      expect(response.status).toBe(200);
      expect(response.body.message).toEqual('Password reset successful');

      // Verify that the new password can be used to log in
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({ email: createdUserAsOwner.email, password: newPassword });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
    });
  });
});

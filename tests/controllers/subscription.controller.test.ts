import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import config from '@config';
import db from '@db';
import { Organization } from '@models/organization.model';
import { Relation } from '@models/relation.model';
import { User, UserDocument } from '@models/user.model';
import {
  Subscription,
  SubscriptionTier,
  SubscriptionTerm
} from '@models/subscription.model';
import app, { server } from '@app';
import request from 'supertest';
import { setupTestOrgAndUser, getJWT } from '../helpers';

interface UserResponse extends UserDocument {
  token?: string;
}

interface UResponse {
  user?: UserDocument;
  subscription?: object | null;
}

let createdUserAsOwner: UserResponse;
let organizationId: string;
let createdSubscriptionId: string;
let firstCreatedUser: UserResponse;
let firstCreatedOrgId: string;

beforeAll(async () => {
  const uri = config.database.mongo_uri ?? '';
  await mongoose.connect(uri, {});
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Relation.deleteMany({});
  await Subscription.deleteMany({});

  const response = await setupTestOrgAndUser();
  createdUserAsOwner = firstCreatedUser = response.user;
  organizationId = firstCreatedOrgId = response.org!.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  server.close();
});

beforeEach(async () => {});

describe('SubscriptionController', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeAll(async () => {
    await db;
    // clear all data before we run any tests, only once at the beginning
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

  describe('create subscription for user', () => {
    beforeAll(async () => {});

    it('should create a subscription for the user', async () => {
      const subscriptionData = {
        tier: SubscriptionTier.Pro,
        term: SubscriptionTerm.Annually,
        user: createdUserAsOwner.id
      };

      const response = await request(app)
        .post(`/api/subscriptions/`)
        .send(subscriptionData);

      expect(response.status).toBe(201);

      expect(response.body.message).toEqual(
        'Subscription created successfully'
      );

      expect(response.body.subscription.tier).toEqual('pro');
      expect(response.body.subscription.term).toEqual('annually');
      expect(response.body.subscription.user).toEqual(createdUserAsOwner.id);

      createdSubscriptionId = response.body.subscription._id;
    });
  });

  describe('renew subscription for user', () => {
    it('should renew the subscription', async () => {
      const response = await request(app).put(
        `/api/subscriptions/${createdSubscriptionId}/renew`
      );

      expect(response.status).toBe(200);

      expect(response.body.message).toEqual(
        'Subscription renewed successfully'
      );

      expect(response.body.subscription.tier).toEqual('pro');
      expect(response.body.subscription.term).toEqual('annually');
      expect(response.body.subscription.user).toEqual(createdUserAsOwner.id);
    });
  });

  describe('get current subscription for user', () => {
    it('should return the current subscription for the user', async () => {
      const token = getJWT(createdUserAsOwner.id);
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.subscribed).toBe(true);
      expect(response.body.subscription.tier).toEqual('pro');
      expect(response.body.subscription.term).toEqual('annually');
      expect(response.body.subscription.user).toEqual(createdUserAsOwner.id);
    });

    it('should return "subscribed: false" if the user has no current subscription', async () => {
      // Remove the current subscription for the user
      await Subscription.deleteMany({ user: createdUserAsOwner.id });

      const token = getJWT(createdUserAsOwner.id);
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.subscribed).toBe(false);
    });

    it('should return 401 status if the authorization token is missing', async () => {
      const response = await request(app).get('/api/subscriptions/current');

      expect(response.status).toBe(401);
      expect(response.body.message).toEqual('No token, authorization denied');
    });
  });

  describe('get currently subscribed users for an organization', () => {
    let userWithSubscription: UResponse;
    let userWithoutSubscription: UResponse;

    beforeAll(async () => {
      const userData1 = {
        email: 'test3@test.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        organizationId: organizationId,
        organizationRole: 'admin'
      };

      const userData2 = {
        email: 'test4@test.com',
        password: 'password',
        firstName: 'James',
        lastName: 'Doe',
        organizationName: organizationId,
        organizationRole: 'user'
      };

      // Create two additional users for the organization
      const res1 = await request(app).post('/api/users').send(userData1);
      const user1: UserDocument = res1.body.user;
      const res2 = await request(app).post('/api/users').send(userData2);
      const user2: UserDocument = res2.body.user;

      const subscriptionData = {
        tier: SubscriptionTier.Pro,
        term: SubscriptionTerm.Annually,
        user: user1.id,
        organization: organizationId
      };

      // Create subscriptions for user1 only
      await Subscription.create(subscriptionData);

      userWithSubscription = {
        user: user1,
        subscription: {
          tier: SubscriptionTier.Pro,
          term: SubscriptionTerm.Annually,
          user: user1._id,
          organization: organizationId
        }
      };
      userWithoutSubscription = { ...user2, subscription: null };
    });

    it('should return an array of users with their active subscriptions', async () => {
      const token = getJWT(createdUserAsOwner.id);
      const response = await request(app)
        .get(`/api/subscriptions/organization/${organizationId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users).toHaveLength(2);

      // Check if the user with a subscription has the correct subscription object
      const userWithSubscriptionObj = response.body.users.find(
        (user: UserResponse) => user._id === userWithSubscription.user!.id
      );
      expect(userWithSubscriptionObj.subscription).toBeDefined();
      expect(userWithSubscriptionObj.subscription.tier).toEqual('pro');
      expect(userWithSubscriptionObj.subscription.term).toEqual('annually');
      expect(userWithSubscriptionObj.subscription.user).toEqual(
        userWithSubscription.user!.id
      );
    });

    it('should return "subscribed: false" if the user has no current subscription', async () => {
      // Remove the current subscription for the user
      await Subscription.deleteMany({ user: createdUserAsOwner.id });

      const token = getJWT(createdUserAsOwner.id);
      const response = await request(app)
        .get('/api/subscriptions/current')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.subscribed).toBe(false);
    });

    it('should return 401 status if the authorization token is missing', async () => {
      const response = await request(app).get('/api/subscriptions/current');

      expect(response.status).toBe(401);
      expect(response.body.message).toEqual('No token, authorization denied');
    });
  });
});

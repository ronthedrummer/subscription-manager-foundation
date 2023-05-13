import httpMocks from 'node-mocks-http';
import mongoose from 'mongoose';
import request from 'supertest';
import config from '@config';
import app, { server } from '@app';
import http from 'http';

beforeAll(async () => {
  await mongoose.connect(config.database.mongo_uri!, {});
});

afterAll(async () => {
  await mongoose.disconnect();
  server.close();
});

describe('GET /', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return 200 OK', async () => {
    const response = await request(app).get(`/`);
    expect(response.status).toBe(200);
    expect(response.text).toContain('Hello World!');
  });
});

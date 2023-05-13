// jest.config.js

const { resolve } = require('path');

process.env.NODE_ENV = 'test';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@config$': '<rootDir>/src/config/setup.ts',
    '^@db$': '<rootDir>/src/config/db.ts',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@helpers/(.*)$': '<rootDir>/src/helpers/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@app$': '<rootDir>/src/app.ts'
  },
  setupFilesAfterEnv: [
    'tsconfig-paths/register',
    resolve(__dirname, './jest.setup.js')
  ],
  testMatch: ['<rootDir>/tests/**/[^_]*.test.ts']
};

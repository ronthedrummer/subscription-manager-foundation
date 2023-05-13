// db.ts

import mongoose from 'mongoose';
import config from '@config';

mongoose.Promise = global.Promise;

export async function connectDB() {
  console.log('dev mode');
  console.log(config.database.mongo_uri);
  mongoose.connect(config.database.mongo_uri!, {});
}

const db = mongoose.connection;

db.on('error', (err) => {
  console.error(err);
});

db.once('open', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('MongoDB connection successful!');
  }
});

export default db;

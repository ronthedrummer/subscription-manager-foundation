import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import config from '@config';

import userRoutes from './routes/user.routes';
import authRoutes from '@routes/auth.routes';
import subscriptionRoutes from '@routes/subscription.routes';
import { organizationRouter } from '@routes/organization.routes';

const app = express();
export let server: any;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Use the routes
app.use('/api/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

if (config.organizations.enabled) {
  app.use('/api/organizations', organizationRouter);
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).send('Server Error 00:28');
  }
);

// Connect to MongoDB and start the server
mongoose
  .connect(config.database.mongo_uri!, {})
  .then(() => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('MongoDB connected!');
    }
    const port = config.server.port || 3000;
    server = app.listen(port, () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Server listening on port ${port}`);
      }
    });
  })
  .catch((err) => {
    console.error(err);
  });

export default app;

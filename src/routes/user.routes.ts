// src/routes/user.routes.ts

import * as userController from '@controllers/user.controller';
import { Router, Request, Response, NextFunction } from 'express';
import {
  authMiddleware,
  checkAdminOrOwner
} from '@middlewares/auth.middleware';

interface UserRequest extends Request {
  userId: string;
}

const router = Router();

// Authentication route
router.post('/login', userController.authenticateUser);

// Route to create a new user
router.post('/', userController.createUser);

// Route to update a user
router.patch('/:id', userController.updateUser);

// Route to get a user by ID
router.get('/:id', authMiddleware, checkAdminOrOwner, userController.getUser);

// Route to get all users from the organization owned by the authenticated user
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userController.getUsersByOrganization(req, res);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/forgot', userController.forgotPassword);

router.post('/reset', userController.resetPassword);

export default router;

import express from 'express';
import {
  createSubscription,
  renewSubscription,
  getCurrentSubscription,
  getSubscribedUsers
} from '@controllers/subscription.controller';
import {
  authMiddleware,
  checkAdminOrOwner
} from '@middlewares/auth.middleware';

const router = express.Router();

router.post('/', createSubscription);
router.put('/:subscriptionId/renew', renewSubscription);
router.get('/current', authMiddleware, getCurrentSubscription);
router.get(
  '/organization/:organizationId',
  authMiddleware,
  checkAdminOrOwner,
  getSubscribedUsers
);

export default router;

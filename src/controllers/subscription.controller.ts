import { Request, Response, NextFunction } from 'express';
import { Subscription } from '@models/subscription.model';
import { User } from '@models/user.model';
import { Relation } from '@models/relation.model';
import { checkAdminOrOwner } from '@middlewares/auth.middleware';
import { URequest } from '@middlewares/auth.middleware';

export const createSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tier, term, user, organization } = req.body;
    const subscription = new Subscription({
      tier,
      term,
      user,
      organization
    });
    await subscription.save();

    return res
      .status(201)
      .json({ message: 'Subscription created successfully', subscription });
  } catch (err) {
    return next(err);
  }
};

export const renewSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    await subscription.updateRenewalDate();
    await subscription.save();
    return res.json({
      message: 'Subscription renewed successfully',
      subscription
    });
  } catch (err) {
    return next(err);
  }
};

export const getCurrentSubscription = async (
  req: URequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const subscription = await Subscription.findOne({ user: user.id });
    if (subscription) {
      return res.json({ subscribed: true, subscription });
    }
    return res.json({ subscribed: false });
  } catch (err) {
    return next(err);
  }
};

export const getSubscribedUsers = async (
  req: URequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;

    // Find the requesting user's relation to the organization
    const relation = await Relation.findOne({
      user: req.userId,
      organization: organizationId
    });

    if (!relation) {
      return res
        .status(403)
        .json({ message: 'Not authorized to access this organization' });
    }

    // Get all users in the organization with their active subscriptions
    const users = await User.find({
      organizations: { $in: [organizationId] }
    });

    const usersWithSubscriptions = await Promise.all(
      users.map(async (user) => {
        const subscription = await Subscription.findOne({
          user: user.id,
          organization: organizationId
        });
        return { ...user.toJSON(), subscription };
      })
    );

    return res.json({ users: usersWithSubscriptions });
  } catch (err) {
    return next({ error: err });
  }
};

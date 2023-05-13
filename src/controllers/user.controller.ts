// src/controllers/user.controller.ts
import { NextFunction, Request, Response } from 'express';
import config from '@config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, UserDocument } from '@models/user.model';
import { Organization, OrganizationDocument } from '@models/organization.model';
import { Relation } from '@models/relation.model';
import { sendEmail, MailgunParams } from '@helpers/mailgun.helper';
import crypto from 'crypto';

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      organizationId,
      organizationName,
      organizationRole
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    let savedUser;

    // Create and populate organization and relation if organizations are enabled
    if (config.organizations.enabled) {
      if (!organizationId && !organizationName) {
        return res.status(400).json({
          message: 'Either organizationId or organizationName must be provided'
        });
      }

      if (!organizationRole) {
        return res
          .status(400)
          .json({ message: 'Organization role must be provided' });
      }

      let organization: OrganizationDocument | null;

      if (organizationId) {
        organization = await Organization.findById(organizationId);

        if (!organization) {
          return res.status(404).json({ message: 'Organization not found' });
        }
      } else {
        organization = new Organization({
          name: organizationName,
          owner: user._id
        });
        // replace save() with custom controller logic
        await organization.save();
      }

      user.organizations = [organization._id];

      // Save user
      savedUser = await user.save();

      // Create a relation between user and organization
      const relation = new Relation({
        user: savedUser._id,
        organization: organization._id,
        role: organizationRole
      });

      await relation.save();

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          organizations: savedUser.organizations
        },
        organization: {
          id: organization._id,
          name: organization.name
        },
        relation
      });
    } else {
      // Save user
      savedUser = await user.save();

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error :: u.c.111' });
  }
};

interface URequest extends Request {
  userId?: string;
}

export const getUsersByOrganization = async (req: URequest, res: Response) => {
  try {
    const owner = await User.findById(req.userId).select('-password');
    if (!owner) {
      return res.status(404).json({ message: 'User not found' });
    }

    const organization = await Organization.findOne({ owner: owner._id });
    if (!organization) {
      return res
        .status(400)
        .json({ message: 'The user is not an owner of any organization' });
    }

    const relations = await Relation.find({ organization }).populate('user');

    const relationIds = relations.map((relation) => relation.user._id);

    const users = await User.find({ _id: { $in: relationIds } });
    const usersMap = users.reduce((map, user) => {
      map.set(user._id.toString(), user);
      return map;
    }, new Map<string, UserDocument>());

    const usersWithRoles = relations.map((relation) => {
      const userId = relation.user.id.toString(); // Convert the ObjectId to a string
      const user = usersMap.get(userId);
      if (!user) throw new Error('User not found in relation');
      return {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: relation.role
      };
    });

    res.json(users);
  } catch (error) {
    console.error('Error in getUsersByOrganization:', error);
    res.status(500).json({ message: 'Server error:: u.c.157' });
  }
};

export const authenticateUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const payload = {
      userId: user.id
    };

    jwt.sign(
      payload,
      config.jwt_secret!,
      { expiresIn: '14d' },
      (err, token) => {
        if (err) {
          throw err;
        }
        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error:: u.c.192' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    const updatedUser = await user.save();

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error::u.c.214' });
  }
};

interface ResetResponse {
  message: string;
  token?: string;
}

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const resetToken = generatePasswordResetToken();
    await user.save();

    const token = await user.generatePasswordResetToken();

    const data: MailgunParams = {
      to: user.email,
      subject: `Password Reset Request`,
      text: `You have requested to reset your password. Please click on this link to reset it: ${config.url}/reset-password/${token}`,
      from: config.email.from_address
    };

    await sendEmail(data);

    const message: ResetResponse = {
      message: 'Password reset email sent. Please check your email.'
    };

    if (process.env.NODE_ENV === 'test') {
      message.token = token;
    }

    return res.status(200).json(message);
  } catch (err) {
    return next(err);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    await user.setPassword(password);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    let message: ResetResponse = {
      message: 'Password reset successful'
    };

    return res.status(200).json(message);
  } catch (err) {
    return next(err);
  }
};

function generatePasswordResetToken(): string {
  const token = crypto.randomBytes(20).toString('hex');
  return token;
}

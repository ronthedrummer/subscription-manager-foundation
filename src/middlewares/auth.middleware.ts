// src/middlewares/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import config from '@config';
import jwt from 'jsonwebtoken';
import { Relation } from '@models/relation.model';

interface DecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

export interface URequest extends Request {
  userId?: string;
}

function getTokenFromHeader(
  authorizationHeader: string | undefined
): string | undefined {
  if (authorizationHeader) {
    const tokenRegex = /^Bearer\s(.*)$/;
    const match = tokenRegex.exec(authorizationHeader);
    return match ? match[1] : undefined;
  } else {
    return undefined;
  }
}

export const authMiddleware = (
  req: URequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header('Authorization');
  const token = getTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt_secret!) as DecodedToken;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

export const checkAdminOrOwner = async (
  req: URequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header('Authorization');
    const token = getTokenFromHeader(authHeader);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwt_secret as string) as {
      id: string;
    };
    const requestedUserId = req.params.userId;

    // Check if the requesting user is the same as the requested user
    if (decoded.id === requestedUserId) {
      return next();
    }

    // Check if the requesting user is an admin or owner in any organization the requested user belongs to
    const relations = await Relation.find({ user: requestedUserId });

    for (const relation of relations) {
      const requestingUserRelation = await Relation.findOne({
        user: decoded.id,
        organization: relation.organization,
        role: { $in: ['admin', 'owner'] }
      });

      if (requestingUserRelation) {
        return next();
      }
    }

    return res.status(403).json({
      message: 'Not authorized as admin or owner in any shared organization'
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Error in checkAdminOrOwner middleware', error });
  }
};

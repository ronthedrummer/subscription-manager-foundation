import { Router, Request, Response, NextFunction } from 'express';
import { createOrganization } from '@controllers/organization.controller';
import { OrganizationDocument } from '@models/organization.model';
import { authMiddleware } from '@middlewares/auth.middleware';

interface URequest extends Request {
  userId?: string;
}

export interface CreateOrganizationResult {
  organization?: OrganizationDocument;
  error?: Error;
}

const router = Router();

// Route to create a new organization
router.post(
  '/',
  authMiddleware,
  async (req: URequest, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;
      const ownerId = req.userId;

      if (!ownerId) {
        return res.status(400).json({
          message: 'User ID not provided'
        });
      }

      const org = (await createOrganization(
        name,
        ownerId
      )) as CreateOrganizationResult;

      if (org.error) {
        return res.status(400).json({
          message: org.error.message
        });
      }

      return res.status(201).json({
        message: 'Organization created successfully',
        organization: org
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as organizationRouter };

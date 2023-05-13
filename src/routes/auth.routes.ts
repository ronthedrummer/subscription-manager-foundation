import { Request, Response, Router } from 'express';
import bcryptjs from 'bcryptjs';
import config from '@config';
import jwt from 'jsonwebtoken';
import { User, UserDocument } from '@models/user.model';

const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find the user by their email
  const user: UserDocument | null = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if the password matches
  const isPasswordMatch = await bcryptjs.compare(password, user.password);
  if (!isPasswordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate a JWT token with a payload containing the user ID
  const token = jwt.sign({ userId: user._id }, config.jwt_secret!, {
    expiresIn: config.jwt_term || '2d'
  });

  // Return the token to the client
  res.json({ token });
});

export default authRouter;

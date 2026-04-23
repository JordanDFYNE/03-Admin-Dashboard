import { Router } from 'express';
import { authenticateGoogleIdToken, requireAuth, signAppToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

router.post(
  '/google',
  asyncHandler(async (request, response) => {
    const { idToken } = request.body || {};

    if (!idToken) {
      throw new HttpError(400, 'idToken is required');
    }

    const user = await authenticateGoogleIdToken(idToken);
    const token = signAppToken(user);

    response.json({
      token,
      user,
    });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json({ user: request.user });
  })
);

export default router;

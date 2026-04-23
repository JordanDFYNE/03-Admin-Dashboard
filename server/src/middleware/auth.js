import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { query } from '../db/query.js';
import { HttpError } from '../utils/http.js';

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

export function signAppToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    },
    env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export async function authenticateGoogleIdToken(idToken) {
  if (!googleClient) {
    throw new HttpError(500, 'GOOGLE_CLIENT_ID is not configured on the backend');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new HttpError(401, 'Google account email was not available');
  }

  const result = await query(
    `
      insert into users (email, display_name, auth_provider, auth_subject)
      values ($1, $2, 'google', $3)
      on conflict (email)
      do update set display_name = excluded.display_name,
                    auth_provider = 'google',
                    auth_subject = excluded.auth_subject,
                    is_active = true,
                    updated_at = now()
      returning id, email, display_name, is_active
    `,
    [payload.email, payload.name || payload.email, payload.sub]
  );

  const roleResult = await query(
    `
      select r.name
      from user_roles ur
      join roles r on r.id = ur.role_id
      where ur.user_id = $1
      order by r.name asc
    `,
    [result.rows[0].id]
  );

  const roles = roleResult.rows.map((row) => row.name);
  return {
    ...result.rows[0],
    roles: roles.length ? roles : ['viewer'],
  };
}

export async function requireAuth(request, response, next) {
  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    if (env.NODE_ENV !== 'production') {
      request.user = {
        id: 0,
        email: 'local-dev@example.com',
        display_name: 'Local Dev User',
        roles: ['admin'],
      };
      return next();
    }

    return next(new HttpError(401, 'Authentication required'));
  }

  try {
    request.user = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch {
    return next(new HttpError(401, 'Invalid access token'));
  }
}

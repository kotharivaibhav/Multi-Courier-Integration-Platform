import jwt from 'jsonwebtoken';

export interface AdminTokenPayload {
  userId: number;
  email: string;
}

export function signAdminToken(
  payload: AdminTokenPayload,
  secret: string,
  expiresInHours: number,
): string {
  return jwt.sign(payload, secret, {
    expiresIn: `${expiresInHours}h`,
  });
}

export function verifyAdminToken(
  token: string,
  secret: string,
): AdminTokenPayload {
  const decoded = jwt.verify(token, secret);
  if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
    throw new Error('Invalid token payload');
  }

  const { userId, email } = decoded as AdminTokenPayload;
  if (typeof userId !== 'number' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }

  return { userId, email };
}

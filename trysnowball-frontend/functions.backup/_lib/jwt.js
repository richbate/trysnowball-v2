import { SignJWT, jwtVerify } from 'jose';

const getSecret = (env) => {
  return new TextEncoder().encode(env.JWT_SECRET || 'fallback-secret-for-dev-only-must-be-256-bits-minimum-in-production');
};

export const sign = async (env, payload, exp = '7d') => {
  const secret = getSecret(env);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
};

export const verify = async (env, token) => {
  const secret = getSecret(env);
  const { payload } = await jwtVerify(token, secret);
  return payload;
};

export const getUserFromRequest = async (request, env) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authentication token provided');
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  const payload = await verify(env, token);
  return payload; // Contains user data
};

// Default export for compatibility
export default {
  sign,
  verify,
  getUserFromRequest
};
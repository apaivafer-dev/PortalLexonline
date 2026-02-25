import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types';

export function generateToken(payload: AuthTokenPayload): string {
    const secret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
    const expires = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(payload, secret, { expiresIn: expires } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthTokenPayload {
    const secret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
    return jwt.verify(token, secret) as AuthTokenPayload;
}

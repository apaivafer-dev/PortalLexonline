import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthTokenPayload } from '../types';

export interface AuthenticatedRequest extends Request {
    user?: AuthTokenPayload;
}

/**
 * Middleware para validar o token JWT e anexar o payload ao objeto req.user.
 * Suporta leitura de cookies HttpOnly conforme OWASP Session Hardening.
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    // Tenta obter o token do cookie primeiro, depois do header Authorization
    const token = req.cookies?.lexonline_session ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);

    if (!token) {
        res.status(401).json({ success: false, error: 'Token de autenticação não fornecido' });
        return;
    }

    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
    }
}

/**
 * Middleware para restringir acesso apenas a administradores (Owner).
 * OWASP: Verifica role === 'Owner' ao invés de is_admin genérico
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (!req.user?.isAdmin && req.user?.role !== 'Owner') {
        res.status(403).json({ success: false, error: 'Acesso negado: privilégios de administrador necessários' });
        return;
    }
    next();
}

/**
 * Middleware para restringir acesso apenas ao Owner (dono da aplicação).
 */
export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (req.user?.role !== 'Owner') {
        res.status(403).json({ success: false, error: 'Acesso negado: apenas o dono pode realizar esta ação' });
        return;
    }
    next();
}

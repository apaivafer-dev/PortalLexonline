import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.path}:`, err);

    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ success: false, error: 'Token inválido' });
        return;
    }

    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, error: 'Token expirado' });
        return;
    }

    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
}

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
}

export function notFound(req: Request, res: Response): void {
    console.log(`[404] ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, error: `Rota não encontrada: ${req.method} ${req.path}` });
}

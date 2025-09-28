import jwt from 'jsonwebtoken';
export function requireAuth(req, res, next) {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.auth = { userId: decoded.sub, role: decoded.role, name: decoded.name };
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
export function requireRole(roles) {
    return (req, res, next) => {
        requireAuth(req, res, () => {
            if (!req.auth)
                return res.status(401).json({ error: 'Unauthorized' });
            if (!roles.includes(req.auth.role))
                return res.status(403).json({ error: 'Forbidden' });
            next();
        });
    };
}

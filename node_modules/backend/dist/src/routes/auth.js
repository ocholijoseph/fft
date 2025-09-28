import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';
export const router = Router();
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback'
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = (profile.emails?.[0]?.value || '').toLowerCase();
        const name = profile.displayName || 'User';
        const googleId = profile.id;
        let user = await prisma.user.findUnique({ where: { googleId } });
        if (!user) {
            // Default new users to CHILD; admin can promote later
            user = await prisma.user.upsert({
                where: { email },
                update: { googleId, name },
                create: { email, name, googleId, role: 'CHILD' }
            });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res) => {
    const user = req.user;
    const token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    const redirect = process.env.WEB_REDIRECT_URL || 'http://localhost:5173/';
    res.redirect(redirect);
});
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
});

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configure Google OAuth2 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
          include: { family: true },
        });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists by email but with different Google ID
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.emails?.[0]?.value },
        });

        if (existingUser) {
          // Update existing user with Google ID
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: { googleId: profile.id },
            include: { family: true },
          });
          return done(null, user);
        }

        // Create new user and family
        const family = await prisma.family.create({
          data: {
            name: `${profile.displayName}'s Family`,
          },
        });

        // Create user with default CHILD role (can be changed later)
        user = await prisma.user.create({
          data: {
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || '',
            role: 'CHILD', // Default role, can be changed by family admin
            familyId: family.id,
            googleId: profile.id,
          },
          include: { family: true },
        });

        return done(null, user);
      } catch (error) {
        console.error('OAuth2 error:', error);
        return done(error, undefined);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { family: true },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

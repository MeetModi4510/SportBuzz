import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as DiscordStrategy } from 'passport-discord';
import User from '../models/User.js';
import crypto from 'crypto';
import Activity from '../models/Activity.js';
import Achievement from '../models/Achievement.js';

// Initialize passport strategies - call this AFTER dotenv.config()
export const initializePassport = () => {
    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                proxy: true,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists
                    let user = await User.findOne({ email: profile.emails[0].value });

                    if (!user) {
                        // Create new user
                        user = await User.create({
                            fullName: profile.displayName,
                            email: profile.emails[0].value,
                            password: crypto.randomBytes(20).toString('hex'), // Random password for OAuth users
                            provider: 'google',
                            photoUrl: profile.photos[0]?.value,
                            isEmailVerified: true,
                            stats: {
                                totalPoints: 50,
                                level: 'Rookie'
                            }
                        });

                        // Log activity
                        await Activity.create({
                            userId: user._id,
                            type: 'signup',
                            description: 'Account created via Google'
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );

    // Discord OAuth Strategy
    passport.use(
        new DiscordStrategy(
            {
                clientID: process.env.DISCORD_CLIENT_ID,
                clientSecret: process.env.DISCORD_CLIENT_SECRET,
                callbackURL: process.env.DISCORD_CALLBACK_URL,
                proxy: true,
                scope: ['identify', 'email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists
                    let user = await User.findOne({ discordId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if user exists with same email (if available)
                    const email = profile.email;

                    if (email) {
                        user = await User.findOne({ email });

                        if (user) {
                            // Link Discord account to existing user
                            user.discordId = profile.id;
                            user.provider = 'discord'; // Update provider or handle multiple providers logic if needed
                            if (!user.photoUrl) user.photoUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
                            await user.save();
                            return done(null, user);
                        }
                    }

                    // Create new user
                    const newUser = new User({
                        discordId: profile.id,
                        email: email,
                        fullName: profile.global_name || profile.username,
                        provider: 'discord',
                        photoUrl: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
                    });

                    await newUser.save();
                    done(null, newUser);
                } catch (error) {
                    done(error, null);
                }
            }
        )
    );
};

export default passport;

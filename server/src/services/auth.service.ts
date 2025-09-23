import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Profile, UserPreference } from '../generated/prisma';
// import prisma from '../lib/database'; // Legacy - migrated to Firebase
import logger from '../utils/logger';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  firm?: string;
  role?: string;
  phone?: string;
  location?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User & {
    profile: Profile | null;
    preferences: UserPreference | null;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role?: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  private static readonly JWT_SECRET: string = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly REFRESH_TOKEN_EXPIRES_IN: string = '30d';
  private static readonly SALT_ROUNDS: number = 12;

  /**
   * Register a new user
   */
  static async register(userData: CreateUserData): Promise<LoginResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

      // Create user with profile and preferences
      const user = await prisma.user.create({
        data: {
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          name: userData.name,
          firm: userData.firm,
          role: userData.role,
          phone: userData.phone,
          location: userData.location,
          profile: {
            create: {
              title: userData.role,
              joinDate: new Date(),
            }
          },
          preferences: {
            create: {
              emailNotify: true,
              pushNotify: true,
              calendarNotify: true,
              dealNotify: true,
              autoSave: true,
              darkMode: false,
            }
          }
        },
        include: {
          profile: true,
          preferences: true,
        }
      });

      logger.info(`New user registered: ${user.email}`);

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: user as any,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Find user with profile and preferences
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          profile: true,
          preferences: true,
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      logger.info(`User logged in: ${user.email}`);

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: user as any,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          preferences: true,
          integrations: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, profileData: Partial<User>) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: profileData,
        include: {
          profile: true,
          preferences: true,
        }
      });

      logger.info(`User profile updated: ${user.email}`);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(userId: string, preferencesData: Partial<UserPreference>) {
    try {
      const preferences = await prisma.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...preferencesData,
        },
        update: preferencesData,
      });

      logger.info(`User preferences updated: ${userId}`);
      return preferences;
    } catch (error) {
      logger.error('Update preferences error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as TokenPayload;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);
      
      logger.info(`Tokens refreshed for user: ${user.email}`);
      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      logger.error('Token verification error:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private static generateTokens(user: User): { token: string; refreshToken: string } {
    const accessPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role || undefined,
      type: 'access'
    };

    const refreshPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role || undefined,
      type: 'refresh'
    };

    const token = jwt.sign(
      accessPayload,
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as any
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN } as any
    );

    return { token, refreshToken };
  }

  /**
   * Delete user account
   */
  static async deleteAccount(userId: string, password: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Password is incorrect');
      }

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id: userId }
      });

      logger.info(`User account deleted: ${user.email}`);
    } catch (error) {
      logger.error('Delete account error:', error);
      throw error;
    }
  }
}

export default AuthService;
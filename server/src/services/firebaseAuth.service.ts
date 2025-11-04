import { auth, db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

export class FirebaseAuthService {
  // Create a new user in Firebase Auth and Firestore
  static async createUser(email: string, password: string, userData: any) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: userData.name,
        emailVerified: false,
      });

      // Set custom claims if role is provided
      if (userData.role) {
        await auth.setCustomUserClaims(userRecord.uid, {
          role: userData.role
        });
      }

      // Create user document in Firestore
      const userDoc = {
        email,
        name: userData.name,
        firm: userData.firm || null,
        role: userData.role || 'user',
        phone: userData.phone || null,
        location: userData.location || null,
        avatar: null,
        emailVerified: false,
        isActive: true,
        createdAt: FirestoreHelpers.serverTimestamp(),
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await FirestoreHelpers.getUserDoc(userRecord.uid).set(userDoc);

      // Create user profile subcollection
      await FirestoreHelpers.getUserDocInCollection(userRecord.uid, 'profile', 'main').set({
        title: null,
        bio: null,
        joinDate: FirestoreHelpers.serverTimestamp(),
        timezone: 'UTC',
        language: 'en',
        theme: 'light',
        notifications: {},
        settings: {},
        createdAt: FirestoreHelpers.serverTimestamp(),
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      // Create user preferences
      await FirestoreHelpers.getUserDocInCollection(userRecord.uid, 'preferences', 'main').set({
        emailNotify: true,
        pushNotify: true,
        smsNotify: false,
        calendarNotify: true,
        dealNotify: true,
        autoSave: true,
        darkMode: false,
        createdAt: FirestoreHelpers.serverTimestamp(),
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      logger.info('User created successfully', {
        uid: userRecord.uid,
        email: userRecord.email
      });

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        user: userDoc
      };
    } catch (error: any) {
      logger.error('Error creating user:', error);

      if (error.code === 'auth/email-already-exists') {
        throw new Error('User with this email already exists');
      }

      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      }

      if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }

      throw new Error('Failed to create user');
    }
  }

  // Get user data from Firestore
  static async getUserData(uid: string) {
    try {
      const userDoc = await FirestoreHelpers.getUserDoc(uid).get();

      if (!userDoc.exists) {
        throw new Error('User data not found');
      }

      return userDoc.data();
    } catch (error: any) {
      logger.error('Error getting user data:', error);
      throw new Error('Failed to get user data');
    }
  }

  // Update user profile
  static async updateProfile(uid: string, updates: any) {
    try {
      const updateData = {
        ...updates,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await FirestoreHelpers.getUserDoc(uid).update(updateData);

      // Also update display name in Firebase Auth if name is being updated
      if (updates.name) {
        await auth.updateUser(uid, {
          displayName: updates.name
        });
      }

      // Get updated user data
      const updatedUser = await this.getUserData(uid);

      logger.info('User profile updated', { uid, updatedFields: Object.keys(updates) });

      return updatedUser;
    } catch (error: any) {
      logger.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Update user preferences
  static async updatePreferences(uid: string, preferences: any) {
    try {
      const updateData = {
        ...preferences,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await FirestoreHelpers.getUserDocInCollection(uid, 'preferences', 'main').update(updateData);

      // Get updated preferences
      const preferencesDoc = await FirestoreHelpers.getUserDocInCollection(uid, 'preferences', 'main').get();

      logger.info('User preferences updated', { uid });

      return preferencesDoc.data();
    } catch (error: any) {
      logger.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  // Change user password
  static async changePassword(uid: string, newPassword: string) {
    try {
      await auth.updateUser(uid, {
        password: newPassword
      });

      logger.info('Password changed successfully', { uid });
    } catch (error: any) {
      logger.error('Error changing password:', error);

      if (error.code === 'auth/weak-password') {
        throw new Error('New password is too weak');
      }

      throw new Error('Failed to change password');
    }
  }

  // Delete user account
  static async deleteAccount(uid: string) {
    try {
      // Delete all user data from Firestore
      await this.deleteUserData(uid);

      // Delete user from Firebase Auth
      await auth.deleteUser(uid);

      logger.info('User account deleted', { uid });
    } catch (error: any) {
      logger.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }

  // Delete all user data from Firestore
  private static async deleteUserData(uid: string) {
    try {
      const batch = FirestoreHelpers.batch();

      // Get all subcollections that need to be deleted
      const collections = [
        'deals', 'funds', 'investors', 'lpGroups', 'contacts',
        'activities', 'communications', 'documents', 'integrations',
        'profile', 'preferences'
      ];

      // Delete all documents in each subcollection
      for (const collectionName of collections) {
        const collectionRef = FirestoreHelpers.getUserCollection(uid, collectionName);
        const snapshot = await collectionRef.get();

        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      // Delete the user document itself
      batch.delete(FirestoreHelpers.getUserDoc(uid));

      await batch.commit();

      logger.info('User data deleted from Firestore', { uid });
    } catch (error: any) {
      logger.error('Error deleting user data:', error);
      throw error;
    }
  }

  // Set custom user claims (for roles)
  static async setUserRole(uid: string, role: string) {
    try {
      await auth.setCustomUserClaims(uid, { role });

      // Also update in Firestore
      await FirestoreHelpers.getUserDoc(uid).update({
        role,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      logger.info('User role updated', { uid, role });
    } catch (error: any) {
      logger.error('Error setting user role:', error);
      throw new Error('Failed to set user role');
    }
  }

  // Generate custom token (for testing or special cases)
  static async createCustomToken(uid: string, additionalClaims?: Record<string, any>) {
    try {
      const customToken = await auth.createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error: any) {
      logger.error('Error creating custom token:', error);
      throw new Error('Failed to create custom token');
    }
  }

  // Verify ID token
  static async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error: any) {
      logger.error('Error verifying ID token:', error);
      throw new Error('Invalid ID token');
    }
  }

  // Get user by email
  static async getUserByEmail(email: string) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      const userData = await this.getUserData(userRecord.uid);

      return {
        ...userRecord,
        userData
      };
    } catch (error: any) {
      logger.error('Error getting user by email:', error);

      if (error.code === 'auth/user-not-found') {
        throw new Error('User not found');
      }

      throw new Error('Failed to get user');
    }
  }

  // Send email verification
  static async sendEmailVerification(uid: string) {
    try {
      const link = await auth.generateEmailVerificationLink(uid);
      // Here you would send the email using your email service
      logger.info('Email verification link generated', { uid });
      return link;
    } catch (error: any) {
      logger.error('Error generating email verification link:', error);
      throw new Error('Failed to send email verification');
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(email: string) {
    try {
      const link = await auth.generatePasswordResetLink(email);
      // Here you would send the email using your email service
      logger.info('Password reset link generated', { email });
      return link;
    } catch (error: any) {
      logger.error('Error generating password reset link:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}
import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { users, userProfiles, type User, type NewUser, type UserProfile, type NewUserProfile } from '../schema';
import { handleDatabaseError, NotFoundError, withRetry } from '../utils';

export class UserService {
  // Create a new user
  static async createUser(userData: NewUser): Promise<User> {
    try {
      return await withRetry(async () => {
        const [user] = await db.insert(users).values(userData).returning();
        return user;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User> {
    try {
      return await withRetry(async () => {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        if (!user) {
          throw new NotFoundError('User', id);
        }
        return user;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await withRetry(async () => {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user || null;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Update user
  static async updateUser(id: string, userData: Partial<NewUser>): Promise<User> {
    try {
      return await withRetry(async () => {
        const [user] = await db
          .update(users)
          .set({ ...userData, updatedAt: new Date() })
          .where(eq(users.id, id))
          .returning();
        
        if (!user) {
          throw new NotFoundError('User', id);
        }
        return user;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<void> {
    try {
      await withRetry(async () => {
        const result = await db.delete(users).where(eq(users.id, id));
        if (result.rowCount === 0) {
          throw new NotFoundError('User', id);
        }
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Create user profile
  static async createUserProfile(profileData: NewUserProfile): Promise<UserProfile> {
    try {
      return await withRetry(async () => {
        const [profile] = await db.insert(userProfiles).values(profileData).returning();
        return profile;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get user profile by user ID
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      return await withRetry(async () => {
        const [profile] = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId));
        return profile || null;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Update user profile
  static async updateUserProfile(
    userId: string,
    profileData: Partial<NewUserProfile>
  ): Promise<UserProfile> {
    try {
      return await withRetry(async () => {
        const [profile] = await db
          .update(userProfiles)
          .set({ ...profileData, updatedAt: new Date() })
          .where(eq(userProfiles.userId, userId))
          .returning();
        
        if (!profile) {
          throw new NotFoundError('User profile for user', userId);
        }
        return profile;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  // Get user with profile
  static async getUserWithProfile(userId: string): Promise<{
    user: User;
    profile: UserProfile | null;
  }> {
    try {
      return await withRetry(async () => {
        const user = await this.getUserById(userId);
        const profile = await this.getUserProfile(userId);
        return { user, profile };
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}
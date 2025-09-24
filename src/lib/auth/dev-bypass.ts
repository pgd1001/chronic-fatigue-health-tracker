// Development bypass for authentication when database is not available
// This allows UI preview without setting up the full auth system

export const DEV_MODE = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

export const DEV_USER = {
  id: 'dev-user-123',
  email: 'dev@example.com',
  name: 'Development User',
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const DEV_SESSION = {
  user: DEV_USER,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
};

// Mock auth functions for development
export const devAuth = () => {
  if (DEV_MODE) {
    return Promise.resolve(DEV_SESSION);
  }
  return null;
};

export const devUseSession = () => {
  if (DEV_MODE) {
    return {
      data: DEV_SESSION,
      isPending: false,
      error: null,
    };
  }
  return {
    data: null,
    isPending: false,
    error: null,
  };
};
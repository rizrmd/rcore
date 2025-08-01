import type { User } from "better-auth/types";

/**
 * Middleware to check if the user is an author
 * Use this in API handlers to restrict access to author-only endpoints
 */
export const authorMiddleware = async (user: User): Promise<boolean> => {
  if (!user || !user.id) {
    return false;
  }
  
  try {
    const userData = await db.auth_user.findUnique({
      where: { id: user.id },
      select: { id: true, id_author: true }
    });
    
    if (!userData) {
      return false;
    }
    
    return userData.id_author !== null;
  } catch (error) {
    console.error("Error in author middleware:", error);
    return false;
  }
};

import type { User } from "shared/types";
import { proxy } from "valtio";

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const userWrite = proxy<UserState>({
  user: null,
  loading: true,
  error: null,
});

export const userState = {
  write: userWrite,
  
  setUser(user: User | null) {
    userWrite.user = user;
    userWrite.loading = false;
    userWrite.error = null;
  },
  
  setLoading(loading: boolean) {
    userWrite.loading = loading;
  },
  
  setError(error: string | null) {
    userWrite.error = error;
    userWrite.loading = false;
  },
  
  reset() {
    userWrite.user = null;
    userWrite.loading = true;
    userWrite.error = null;
  },
  
  getLoyaltyData() {
    if (!userWrite.user?.customer) return null;
    
    // Generate loyalty ID from user info or use existing customer data
    const loyaltyId = userWrite.user.customer.id
      ? userWrite.user.customer.id.slice(-8).toUpperCase()
      : "GUEST";
    
    // For now, return mock points data - in real app, this would come from the customer record
    return {
      id: loyaltyId,
      points: 0, // This should come from the actual customer loyalty data
    };
  }
};

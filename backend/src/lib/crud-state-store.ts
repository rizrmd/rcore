import crypto from 'crypto';

// ECrud state interface for storage
export interface ECrudState {
  view: 'list' | 'form' | 'detail';
  formMode: 'create' | 'edit' | null;
  filters: Record<string, any>;
  sorting: {
    field: string | null;
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  showTrash: boolean;
  selectedEntityId?: string | number | null;
}

// In-memory storage with TTL
interface StoredState {
  state: ECrudState;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class StateStorage {
  private storage = new Map<string, StoredState>();
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours
  
  // Default state values
  private defaultState: ECrudState = {
    view: 'list',
    formMode: null,
    filters: {},
    sorting: {
      field: null,
      direction: 'asc',
    },
    pagination: {
      page: 1,
      pageSize: 50,
    },
    showTrash: false,
    selectedEntityId: null,
  };
  
  // Check if state is the default state
  private isDefaultState(state: ECrudState): boolean {
    // Compare each property with default state
    if (state.view !== this.defaultState.view) return false;
    if (state.formMode !== this.defaultState.formMode) return false;
    if (state.showTrash !== this.defaultState.showTrash) return false;
    if (state.selectedEntityId !== this.defaultState.selectedEntityId) return false;
    
    // Compare pagination
    if (state.pagination.page !== this.defaultState.pagination.page) return false;
    if (state.pagination.pageSize !== this.defaultState.pagination.pageSize) return false;
    
    // Compare sorting
    if (state.sorting.field !== this.defaultState.sorting.field) return false;
    if (state.sorting.direction !== this.defaultState.sorting.direction) return false;
    
    // Compare filters - check if filters object is empty
    if (Object.keys(state.filters).length > 0) return false;
    
    return true;
  }

  // Generate hash from state
  private generateHash(state: ECrudState): string {
    const stateString = JSON.stringify(state, Object.keys(state).sort());
    return crypto.createHash('sha256').update(stateString).digest('hex').substring(0, 16);
  }

  // Clean expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [hash, stored] of this.storage.entries()) {
      if (now - stored.timestamp > stored.ttl) {
        this.storage.delete(hash);
      }
    }
  }

  // Store state and return hash
  store(state: ECrudState, ttl?: number): string {
    this.cleanup();
    
    // Check if state is the default state
    const isDefaultState = this.isDefaultState(state);
    if (isDefaultState) {
      // Return a special empty hash to indicate default state
      return '';
    }
    
    const hash = this.generateHash(state);
    console.log("Backend: Generated hash for state:", hash);
    
    const storedState: StoredState = {
      state,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.storage.set(hash, storedState);
    console.log("Backend: Stored state with hash:", hash);
    return hash;
  }

  // Retrieve state by hash
  retrieve(hash: string): ECrudState | null {
    // If hash is empty, return default state
    if (!hash) {
      return { ...this.defaultState };
    }
    
    this.cleanup();
    
    const stored = this.storage.get(hash);
    if (!stored) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - stored.timestamp > stored.ttl) {
      this.storage.delete(hash);
      return null;
    }
    
    return stored.state;
  }

  // Update existing state
  update(hash: string, state: ECrudState): string | null {
    // If hash is empty, treat it as a new state
    if (!hash) {
      return this.store(state);
    }
    
    const existing = this.retrieve(hash);
    if (!existing) {
      return null;
    }
    
    // Generate new hash for updated state
    return this.store(state);
  }

  // Get storage stats
  getStats(): { count: number; memoryUsage: string } {
    this.cleanup();
    const count = this.storage.size;
    const memoryUsage = `${Math.round(JSON.stringify([...this.storage.values()]).length / 1024)}KB`;
    return { count, memoryUsage };
  }

  // Clear all stored states
  clear(): void {
    this.storage.clear();
  }
}

// Global instance
export const stateStorage = new StateStorage();

// Helper functions for ECrud integration
export const createStateHash = (state: ECrudState): string => {
  return stateStorage.store(state);
};

export const getStateByHash = (hash: string): ECrudState | null => {
  return stateStorage.retrieve(hash);
};

export const updateStateHash = (hash: string, state: ECrudState): string | null => {
  return stateStorage.update(hash, state);
};
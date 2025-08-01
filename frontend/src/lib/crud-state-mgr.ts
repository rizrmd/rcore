import type { ECrudState } from "@/lib/crud-hook";

// URL state manager for ECrud components
export class URLStateManager {
  private baseUrl: string;
  private stateHandlers: {
    onStoreState: (state: ECrudState) => Promise<string>;
    onGetState: (hash: string) => Promise<ECrudState | null>;
    onUpdateState: (hash: string, state: ECrudState) => Promise<string>;
  };
  private currentHash: string | null = null;

  constructor(
    baseUrl: string,
    stateHandlers: {
      onStoreState: (state: ECrudState) => Promise<string>;
      onGetState: (hash: string) => Promise<ECrudState | null>;
      onUpdateState: (hash: string, state: ECrudState) => Promise<string>;
    }
  ) {
    this.baseUrl = baseUrl;
    this.stateHandlers = stateHandlers;
  }

  // Get current hash from URL
  private getCurrentHashFromURL(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("state");
  }

  // Get defaultData hash from URL
  private getDefaultDataHashFromURL(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("defaultData");
  }

  // Update URL with new hash
  private updateURL(hash: string): void {
    const url = new URL(window.location.href);
    url.searchParams.set("state", hash);
    window.history.replaceState({}, "", url.toString());
  }

  // Remove state from URL
  private clearURL(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete("state");
    url.searchParams.delete("defaultData");
    window.history.replaceState({}, "", url.toString());
  }

  // Get defaultData from URL
  async getDefaultData(): Promise<Record<string, any> | null> {
    const defaultDataHash = this.getDefaultDataHashFromURL();
    if (!defaultDataHash) return null;

    try {
      const defaultData = await this.stateHandlers.onGetState(defaultDataHash);
      return defaultData ? (defaultData as any).defaultData : null;
    } catch (error) {
      console.warn("Failed to load defaultData from URL:", error);
      return null;
    }
  }

  // Initialize state from URL or return default state
  async initializeState(defaultState: ECrudState): Promise<ECrudState> {
    const hashFromURL = this.getCurrentHashFromURL();

    if (hashFromURL) {
      try {
        const storedState = await this.stateHandlers.onGetState(hashFromURL);
        if (storedState) {
          // Check if the stored state is actually the default state
          if (this.areStatesEqual(storedState, this.defaultState)) {
            // If it's the default state, clear the URL
            this.clearURL();
            return { ...this.defaultState };
          }
          
          this.currentHash = hashFromURL;
          return storedState;
        } else {
          // State expired or not found, clear URL and use default
          this.clearURL();
        }
      } catch (error) {
        console.warn("Failed to load state from URL:", error);
        this.clearURL();
      }
    }

    return defaultState;
  }

  // Compare two states to see if they're equivalent
  private areStatesEqual(state1: ECrudState, state2: ECrudState): boolean {
    // Compare basic properties
    if (state1.view !== state2.view) return false;
    if (state1.formMode !== state2.formMode) return false;
    if (state1.showTrash !== state2.showTrash) return false;
    if (state1.selectedEntityId !== state2.selectedEntityId) return false;
    if (state1.activeTab !== state2.activeTab) return false;
    
    // Compare pagination
    if (state1.pagination.page !== state2.pagination.page) return false;
    if (state1.pagination.pageSize !== state2.pagination.pageSize) return false;
    
    // Compare sorting
    if (state1.sorting.field !== state2.sorting.field) return false;
    if (state1.sorting.direction !== state2.sorting.direction) return false;
    
    // Compare filters - deep comparison
    const filters1Keys = Object.keys(state1.filters);
    const filters2Keys = Object.keys(state2.filters);
    
    if (filters1Keys.length !== filters2Keys.length) return false;
    
    for (const key of filters1Keys) {
      if (JSON.stringify(state1.filters[key]) !== JSON.stringify(state2.filters[key])) {
        return false;
      }
    }
    
    return true;
  }

  // Default state values - should match backend
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
    activeTab: 'main',
  };
  
  // Check if state is the default state
  private isDefaultState(state: ECrudState): boolean {
    return this.areStatesEqual(state, this.defaultState);
  }

  // Save current state and update URL
  async saveState(state: ECrudState): Promise<void> {
    try {
      // Check if this is the default state - if so, just clear the URL
      if (this.isDefaultState(state)) {
        this.currentHash = null;
        this.clearURL();
        return;
      }
      
      // If we have a current hash, get the current state to compare
      if (this.currentHash) {
        const currentState = await this.stateHandlers.onGetState(this.currentHash);
        
        // If current state exists and is the same as new state, don't update
        if (currentState && this.areStatesEqual(currentState, state)) {
          return; // No need to update, states are the same
        }
      }
      
      let newHash: string;

      if (this.currentHash) {
        // Update existing state
        newHash = await this.stateHandlers.onUpdateState(
          this.currentHash,
          state
        );
      } else {
        // Store new state
        newHash = await this.stateHandlers.onStoreState(state);
      }

      // If hash is empty, it means we're dealing with default state
      // In this case, clear the URL instead of updating it
      if (!newHash) {
        this.currentHash = null;
        this.clearURL();
        return;
      }

      this.currentHash = newHash;
      this.updateURL(newHash);
    } catch (error) {
      console.warn("Failed to save state:", error);
    }
  }

  // Clear state from storage and URL
  clearState(): void {
    this.currentHash = null;
    this.clearURL();
  }

  // Get shareable URL with current state
  getShareableURL(): string {
    if (this.currentHash) {
      const url = new URL(this.baseUrl, window.location.origin);
      url.searchParams.set("state", this.currentHash);
      return url.toString();
    }
    return this.baseUrl;
  }

  // Check if URL has state parameter
  hasStateInURL(): boolean {
    return this.getCurrentHashFromURL() !== null;
  }
}

// Helper function to create URL state manager
export const createURLStateManager = (
  baseUrl: string,
  stateHandlers: {
    onStoreState: (state: ECrudState) => Promise<string>;
    onGetState: (hash: string) => Promise<ECrudState | null>;
    onUpdateState: (hash: string, state: ECrudState) => Promise<string>;
  }
): URLStateManager => {
  return new URLStateManager(baseUrl, stateHandlers);
};

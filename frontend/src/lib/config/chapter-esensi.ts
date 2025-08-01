// Global configuration for chapter.esensi
export const CHAPTER_ESENSI_CONFIG = {
  // Base path for chapter.esensi - can be changed as needed
  BASE_PATH: "/index-draft",
  
  // Helper function to create chapter.esensi URLs
  url: (path: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${CHAPTER_ESENSI_CONFIG.BASE_PATH}/${cleanPath}`;
  },
  
  // Helper to get clean path without the base path prefix
  getCleanPath: (fullPath: string) => {
    if (fullPath.startsWith(CHAPTER_ESENSI_CONFIG.BASE_PATH)) {
      return fullPath.slice(CHAPTER_ESENSI_CONFIG.BASE_PATH.length);
    }
    return fullPath;
  }
};
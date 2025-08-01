export type UploadAPIResponse = {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    name: string;
    size: number;
    mimetype: string;
  };
  message?: string;
  error?: string;
  name?: string; // For backwards compatibility
};
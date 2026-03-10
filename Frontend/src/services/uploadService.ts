import { apiService, ApiResponse } from './api';

// Types
export interface UploadedImage {
  _id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  originalName: string;
  size: number;
  format: string;
  width: number;
  height: number;
  folder: string;
  uploadedBy: string;
  createdAt: string;
}

export interface GalleryImage extends UploadedImage {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  order?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Upload Service
export const uploadService = {
  // Upload single image
  uploadImage: async (
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<UploadedImage>> => {
    const formData = new FormData();
    formData.append('image', file);

    return await apiService.upload<UploadedImage>('/upload/image', formData, (percentage) => {
      if (onProgress) {
        onProgress({
          loaded: (percentage / 100) * file.size,
          total: file.size,
          percentage,
        });
      }
    });
  },

  // Upload multiple images
  uploadImages: async (
    files: File[], 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<UploadedImage[]>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return await apiService.upload<UploadedImage[]>('/upload/images', formData, (percentage) => {
      if (onProgress) {
        onProgress({
          loaded: (percentage / 100) * totalSize,
          total: totalSize,
          percentage,
        });
      }
    });
  },

  // Upload profile image
  uploadProfileImage: async (
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<UploadedImage>> => {
    const formData = new FormData();
    formData.append('profileImage', file);

    return await apiService.upload<UploadedImage>('/upload/profile-image', formData, (percentage) => {
      if (onProgress) {
        onProgress({
          loaded: (percentage / 100) * file.size,
          total: file.size,
          percentage,
        });
      }
    });
  },

  // Delete image
  deleteImage: async (publicId: string): Promise<ApiResponse> => {
    return await apiService.delete(`/upload/image/${publicId}`);
  },

  // Admin: Get gallery images
  getGalleryImages: async (): Promise<ApiResponse<GalleryImage[]>> => {
    return await apiService.get<GalleryImage[]>('/upload/gallery');
  },

  // Admin: Upload gallery images
  uploadGalleryImages: async (
    files: File[], 
    metadata?: {
      title?: string;
      description?: string;
      category?: string;
      tags?: string[];
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<GalleryImage[]>> => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('galleryImages', file);
    });

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return await apiService.upload<GalleryImage[]>('/upload/gallery', formData, (percentage) => {
      if (onProgress) {
        onProgress({
          loaded: (percentage / 100) * totalSize,
          total: totalSize,
          percentage,
        });
      }
    });
  },

  // Admin: Delete gallery image
  deleteGalleryImage: async (imageId: string): Promise<ApiResponse> => {
    return await apiService.delete(`/upload/gallery/${imageId}`);
  },

  // Utility: Validate file
  validateFile: (file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
  }): { valid: boolean; error?: string } => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options || {};

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  },

  // Utility: Create image preview
  createImagePreview: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to create image preview'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  // Utility: Compress image (basic client-side compression)
  compressImage: (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  },
};

export default uploadService;
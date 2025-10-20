import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/headshots');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter to only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export class ImageUploadService {
  async uploadHeadshot(file: Express.Multer.File, searcherId: string): Promise<string> {
    try {
      // Generate a public URL for the uploaded image with full base URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:4001';
      const imageUrl = `${baseUrl}/uploads/headshots/${file.filename}`;

      logger.info('Headshot uploaded successfully', {
        searcherId,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        imageUrl
      });

      return imageUrl;
    } catch (error) {
      logger.error('Error uploading headshot', {
        error: error,
        searcherId
      });
      throw new Error('Failed to upload headshot');
    }
  }

  async deleteHeadshot(imageUrl: string): Promise<void> {
    try {
      // Handle both full URLs and relative paths
      if (imageUrl && (imageUrl.includes('/uploads/headshots/') || imageUrl.startsWith('/uploads/headshots/'))) {
        const filename = path.basename(imageUrl);
        const filePath = path.join(__dirname, '../../uploads/headshots', filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info('Headshot deleted successfully', { filename });
        }
      }
    } catch (error) {
      logger.error('Error deleting headshot', { error, imageUrl });
      throw new Error('Failed to delete headshot');
    }
  }
}

export const imageUploadService = new ImageUploadService();

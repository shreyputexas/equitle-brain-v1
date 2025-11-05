// @ts-nocheck
import { storage, db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

export interface Document {
  id?: string;
  dealId?: string;
  name: string;
  description?: string;
  type: string; // 'pdf', 'doc', 'xls', 'ppt', 'image', etc.
  category?: string; // 'pitch-deck', 'financials', 'legal', 'dd', etc.
  size?: number; // Size in bytes
  firebaseStoragePath?: string; // Firebase Storage path
  downloadUrl?: string; // Firebase Storage download URL
  version: string;
  isConfidential: boolean;
  uploadedBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DocumentsFirestoreService {
  // Get all documents for a user
  static async getAllDocuments(userId: string, options: {
    dealId?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { dealId, category, search, limit = 50, offset = 0 } = options;

      let query = FirestoreHelpers.getUserCollection(userId, 'documents')
        .orderBy('createdAt', 'desc');

      // Apply filters
      if (dealId) {
        query = query.where('dealId', '==', dealId);
      }
      if (category) {
        query = query.where('category', '==', category);
      }

      // Apply pagination
      if (offset > 0) {
        const offsetSnapshot = await query.limit(offset).get();
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.limit(limit).get();
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter (client-side)
      let filteredDocuments = documents;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredDocuments = documents.filter((doc: any) =>
          doc.name?.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.category?.toLowerCase().includes(searchLower) ||
          doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }

      logger.info('Retrieved documents', { userId, count: filteredDocuments.length });
      return { documents: filteredDocuments, total: filteredDocuments.length };
    } catch (error: any) {
      logger.error('Error getting documents:', error);
      throw new Error('Failed to retrieve documents');
    }
  }

  // Get single document by ID
  static async getDocumentById(userId: string, documentId: string) {
    try {
      const documentDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'documents', documentId).get();

      if (!documentDoc.exists) {
        throw new Error('Document not found');
      }

      const document = { id: documentDoc.id, ...documentDoc.data() };

      logger.info('Retrieved document details', { userId, documentId });
      return { document };
    } catch (error: any) {
      logger.error('Error getting document:', error);
      if (error.message === 'Document not found') {
        throw error;
      }
      throw new Error('Failed to retrieve document');
    }
  }

  // Upload document to Firebase Storage and save metadata to Firestore
  static async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    metadata: {
      dealId?: string;
      description?: string;
      category?: string;
      isConfidential?: boolean;
      tags?: string[];
    }
  ) {
    try {
      // Generate unique filename
      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const storagePath = `users/${userId}/documents/${uniqueFileName}`;

      // Upload to Firebase Storage
      const bucket = storage.bucket();
      const fileUpload = bucket.file(storagePath);

      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      return new Promise<{ document: Document }>((resolve, reject) => {
        stream.on('error', (error) => {
          logger.error('Error uploading file to Firebase Storage:', error);
          reject(new Error('Failed to upload file'));
        });

        stream.on('finish', async () => {
          try {
            // Make the file publicly readable
            await fileUpload.makePublic();

            // Get download URL
            const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

            // Save document metadata to Firestore
            const now = FirestoreHelpers.serverTimestamp();
            const documentData = {
              name: file.originalname,
              description: metadata.description || null,
              type: fileExtension || 'unknown',
              category: metadata.category || null,
              size: file.size,
              firebaseStoragePath: storagePath,
              downloadUrl,
              version: '1.0',
              isConfidential: metadata.isConfidential || false,
              uploadedBy: userId,
              tags: metadata.tags || [],
              dealId: metadata.dealId || null,
              metadata: {
                contentType: file.mimetype,
                originalName: file.originalname,
              },
              createdAt: now,
              updatedAt: now,
            };

            const docRef = await FirestoreHelpers.getUserCollection(userId, 'documents').add(documentData);
            const createdDocument = await docRef.get();

            logger.info('Document uploaded successfully', {
              userId,
              documentId: docRef.id,
              filename: file.originalname,
              size: file.size
            });

            resolve({
              document: {
                id: docRef.id,
                ...createdDocument.data()
              } as Document
            });
          } catch (error) {
            logger.error('Error saving document metadata:', error);
            reject(new Error('Failed to save document metadata'));
          }
        });

        stream.end(file.buffer);
      });
    } catch (error: any) {
      logger.error('Error uploading document:', error);
      throw new Error('Failed to upload document');
    }
  }

  // Update document metadata
  static async updateDocument(userId: string, documentId: string, updates: Partial<Document>) {
    try {
      const documentRef = FirestoreHelpers.getUserDocInCollection(userId, 'documents', documentId);
      const documentDoc = await documentRef.get();

      if (!documentDoc.exists) {
        throw new Error('Document not found');
      }

      const updateData = {
        ...updates,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await documentRef.update(updateData);
      const updatedDocument = await documentRef.get();

      logger.info('Document updated', { userId, documentId, updatedFields: Object.keys(updates) });

      return {
        document: {
          id: documentId,
          ...updatedDocument.data()
        }
      };
    } catch (error: any) {
      logger.error('Error updating document:', error);
      if (error.message === 'Document not found') {
        throw error;
      }
      throw new Error('Failed to update document');
    }
  }

  // Delete document from both Firestore and Firebase Storage
  static async deleteDocument(userId: string, documentId: string) {
    try {
      const documentRef = FirestoreHelpers.getUserDocInCollection(userId, 'documents', documentId);
      const documentDoc = await documentRef.get();

      if (!documentDoc.exists) {
        throw new Error('Document not found');
      }

      const documentData = documentDoc.data();

      // Delete from Firebase Storage if path exists
      if (documentData.firebaseStoragePath) {
        try {
          const bucket = storage.bucket();
          const file = bucket.file(documentData.firebaseStoragePath);
          await file.delete();
          logger.info('File deleted from Firebase Storage', {
            userId,
            documentId,
            path: documentData.firebaseStoragePath
          });
        } catch (storageError) {
          logger.warn('Failed to delete file from Firebase Storage (may not exist):', storageError);
          // Continue with Firestore deletion even if storage deletion fails
        }
      }

      // Delete from Firestore
      await documentRef.delete();

      logger.info('Document deleted', { userId, documentId, name: documentData.name });

      return { message: 'Document deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting document:', error);
      if (error.message === 'Document not found') {
        throw error;
      }
      throw new Error('Failed to delete document');
    }
  }

  // Get documents by category
  static async getDocumentsByCategory(userId: string, category: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'documents')
        .where('category', '==', category)
        .orderBy('createdAt', 'desc')
        .get();

      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved documents by category', { userId, category, count: documents.length });
      return documents;
    } catch (error: any) {
      logger.error('Error getting documents by category:', error);
      throw new Error('Failed to retrieve documents by category');
    }
  }

  // Get documents statistics
  static async getDocumentsStats(userId: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'documents').get();
      const documents = snapshot.docs.map(doc => doc.data());

      const stats = {
        total: documents.length,
        byCategory: {},
        byType: {},
        totalSize: 0,
        confidentialCount: 0,
        recentUploads: 0, // Last 7 days
      };

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      documents.forEach((doc: any) => {
        // Count by category
        const category = doc.category || 'uncategorized';
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = 0;
        }
        stats.byCategory[category]++;

        // Count by type
        const type = doc.type || 'unknown';
        if (!stats.byType[type]) {
          stats.byType[type] = 0;
        }
        stats.byType[type]++;

        // Sum total size
        if (doc.size) {
          stats.totalSize += doc.size;
        }

        // Count confidential documents
        if (doc.isConfidential) {
          stats.confidentialCount++;
        }

        // Count recent uploads
        if (doc.createdAt && doc.createdAt.toDate && doc.createdAt.toDate() > sevenDaysAgo) {
          stats.recentUploads++;
        }
      });

      logger.info('Retrieved documents statistics', { userId, totalDocuments: stats.total });
      return stats;
    } catch (error: any) {
      logger.error('Error getting documents statistics:', error);
      throw new Error('Failed to retrieve documents statistics');
    }
  }

  // Search documents
  static async searchDocuments(userId: string, searchTerm: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'documents').get();
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const searchLower = searchTerm.toLowerCase();
      const filteredDocuments = documents.filter((doc: any) =>
        doc.name?.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.category?.toLowerCase().includes(searchLower) ||
        doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );

      logger.info('Searched documents', { userId, searchTerm, results: filteredDocuments.length });
      return filteredDocuments;
    } catch (error: any) {
      logger.error('Error searching documents:', error);
      throw new Error('Failed to search documents');
    }
  }

  // Generate download URL for a document
  static async getDownloadUrl(userId: string, documentId: string) {
    try {
      const documentDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'documents', documentId).get();

      if (!documentDoc.exists) {
        throw new Error('Document not found');
      }

      const documentData = documentDoc.data();

      if (!documentData.firebaseStoragePath) {
        throw new Error('Document storage path not found');
      }

      // For public files, return the existing download URL
      if (documentData.downloadUrl) {
        return { downloadUrl: documentData.downloadUrl };
      }

      // Generate a signed URL for private files (if needed in the future)
      const bucket = storage.bucket();
      const file = bucket.file(documentData.firebaseStoragePath);

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      logger.info('Generated download URL', { userId, documentId });
      return { downloadUrl: url };
    } catch (error: any) {
      logger.error('Error generating download URL:', error);
      if (error.message === 'Document not found' || error.message === 'Document storage path not found') {
        throw error;
      }
      throw new Error('Failed to generate download URL');
    }
  }
}

// Multer configuration for file uploads
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});
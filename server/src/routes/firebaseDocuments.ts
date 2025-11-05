import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { DocumentsFirestoreService, uploadMiddleware } from '../services/documents.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// Validation schemas
const updateDocumentSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  category: Joi.string().optional(),
  isConfidential: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  dealId: Joi.string().optional(),
});

// @route   GET /api/firebase-documents
// @desc    Get all documents for the authenticated user
// @access  Private
router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { dealId, category, search, limit = 50, offset = 0 } = req.query;

    const result = await DocumentsFirestoreService.getAllDocuments(userId, {
      dealId: dealId as string,
      category: category as string,
      search: search as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-documents/stats
// @desc    Get document statistics
// @access  Private
router.get('/stats', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const stats = await DocumentsFirestoreService.getDocumentsStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Get documents stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-documents/search
// @desc    Search documents
// @access  Private
router.get('/search', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const documents = await DocumentsFirestoreService.searchDocuments(userId, q as string);

    res.json({
      success: true,
      data: documents
    });
  } catch (error: any) {
    logger.error('Search documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-documents/by-category/:category
// @desc    Get documents by category
// @access  Private
router.get('/by-category/:category', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { category } = req.params;

    const documents = await DocumentsFirestoreService.getDocumentsByCategory(userId, category);

    res.json({
      success: true,
      data: documents
    });
  } catch (error: any) {
    logger.error('Get documents by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-documents/:id
// @desc    Get single document by ID
// @access  Private
router.get('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await DocumentsFirestoreService.getDocumentById(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get document error:', error);

    if (error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-documents/:id/download
// @desc    Get download URL for document
// @access  Private
router.get('/:id/download', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await DocumentsFirestoreService.getDownloadUrl(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get download URL error:', error);

    if (error.message === 'Document not found' || error.message === 'Document storage path not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-documents/upload
// @desc    Upload new document
// @access  Private
router.post('/upload', firebaseAuthMiddleware, uploadMiddleware.single('file'), async (req, res) => {
  try {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Parse metadata from request body
    const metadata = {
      dealId: req.body.dealId,
      description: req.body.description,
      category: req.body.category,
      isConfidential: req.body.isConfidential === 'true',
      tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
    };

    const result = await DocumentsFirestoreService.uploadDocument(userId, file, metadata);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Upload document error:', error);

    if (error.message === 'File type not allowed') {
      return res.status(400).json({
        success: false,
        message: 'File type not allowed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error uploading document'
    });
  }
});

// @route   PUT /api/firebase-documents/:id
// @desc    Update document metadata
// @access  Private
router.put('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateDocumentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await DocumentsFirestoreService.updateDocument(userId, id, value);

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Update document error:', error);

    if (error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating document'
    });
  }
});

// @route   DELETE /api/firebase-documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await DocumentsFirestoreService.deleteDocument(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Delete document error:', error);

    if (error.message === 'Document not found') {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error deleting document'
    });
  }
});

export default router;
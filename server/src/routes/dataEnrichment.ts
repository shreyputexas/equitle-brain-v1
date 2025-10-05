import express from 'express';
import multer from 'multer';
import { EnrichmentService } from '../services/enrichment.service';
import logger from '../utils/logger';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream', // Sometimes Excel files are detected as this
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

/**
 * POST /api/data-enrichment/upload
 * Upload and enrich Excel file with company data
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    logger.info('Data enrichment upload request', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // Check if Apollo API key is configured
    const apolloApiKey = process.env.APOLLO_API_KEY;
    if (!apolloApiKey) {
      logger.error('Apollo API key not configured');
      return res.status(500).json({
        success: false,
        error: 'Apollo API key not configured. Please add APOLLO_API_KEY to environment variables.',
      });
    }

    // Initialize enrichment service
    const enrichmentService = new EnrichmentService(apolloApiKey);

    // Process the file
    const enrichedFileBuffer = await enrichmentService.processExcelFile(req.file.buffer);

    // Generate filename for download
    const originalName = req.file.originalname.replace(/\.(xlsx|xls)$/i, '');
    const enrichedFilename = `${originalName}_enriched_${Date.now()}.xlsx`;

    logger.info('Data enrichment completed successfully', {
      originalFile: req.file.originalname,
      enrichedFile: enrichedFilename,
      outputSize: enrichedFileBuffer.length,
    });

    // Send enriched file as download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${enrichedFilename}"`);
    res.setHeader('Content-Length', enrichedFileBuffer.length);

    res.send(enrichedFileBuffer);
  } catch (error: any) {
    logger.error('Data enrichment failed', {
      filename: req.file?.originalname,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Data enrichment failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * GET /api/data-enrichment/test
 * Test endpoint to verify API key configuration
 */
router.get('/test', async (req, res) => {
  try {
    const apolloApiKey = process.env.APOLLO_API_KEY;

    res.json({
      success: true,
      data: {
        apolloConfigured: !!apolloApiKey,
        apiKeyLength: apolloApiKey ? apolloApiKey.length : 0,
        apiKeyPreview: apolloApiKey ? `${apolloApiKey.substring(0, 8)}...` : 'Not configured',
        message: apolloApiKey
          ? 'Apollo API key is configured and ready for use'
          : 'Apollo API key is not configured. Please add APOLLO_API_KEY to environment variables.',
      },
    });
  } catch (error: any) {
    logger.error('Data enrichment test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Test endpoint failed',
    });
  }
});

/**
 * GET /api/data-enrichment/sample
 * Download sample Excel template
 */
router.get('/sample', (req, res) => {
  try {
    // Create a sample Excel file buffer with template data
    const XLSX = require('xlsx');

    const sampleData = [
      ['Company Name', 'Website'],
      ['Shopify', 'shopify.com'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="company_template.xlsx"');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

    logger.info('Sample template downloaded');
  } catch (error: any) {
    logger.error('Sample template generation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate sample template',
    });
  }
});

export default router;
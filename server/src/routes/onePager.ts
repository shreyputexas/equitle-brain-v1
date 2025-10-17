import express from 'express';
import { onePagerGenerationService, OnePagerRequest } from '../services/onePagerGeneration.service';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import logger from '../utils/logger';

const router = express.Router();

// Generate one-pager content and DOCX
router.post('/generate', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { searcherProfiles, thesisData, teamConnection } = req.body as OnePagerRequest;

    if (!searcherProfiles || !thesisData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Searcher profiles and thesis data are required' 
      });
    }

    if (searcherProfiles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one searcher profile is required' 
      });
    }

    logger.info('Generating one-pager content', {
      userId: req.user?.uid,
      searcherCount: searcherProfiles.length,
      thesisName: thesisData.name
    });

    // Generate content using OpenAI
    const content = await onePagerGenerationService.generateContent({
      searcherProfiles,
      thesisData,
      teamConnection
    });

    // Generate DOCX file
    const searcherNames = searcherProfiles.map(profile => profile.name);
    const docxBuffer = await onePagerGenerationService.generateDocx(content, searcherNames);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="search-fund-pitch-${Date.now()}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);

    // Send the DOCX file
    res.send(docxBuffer);

    logger.info('One-pager generated successfully', {
      userId: req.user?.uid,
      contentLength: JSON.stringify(content).length,
      docxSize: docxBuffer.length
    });

  } catch (error: any) {
    logger.error('Error generating one-pager', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate one-pager',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get one-pager content only (without DOCX generation)
router.post('/content', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { searcherProfiles, thesisData, teamConnection } = req.body as OnePagerRequest;

    if (!searcherProfiles || !thesisData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Searcher profiles and thesis data are required' 
      });
    }

    if (searcherProfiles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one searcher profile is required' 
      });
    }

    logger.info('Generating one-pager content only', {
      userId: req.user?.uid,
      searcherCount: searcherProfiles.length,
      thesisName: thesisData.name
    });

    // Generate content using OpenAI
    const content = await onePagerGenerationService.generateContent({
      searcherProfiles,
      thesisData,
      teamConnection
    });

    res.json({
      success: true,
      content
    });

  } catch (error: any) {
    logger.error('Error generating one-pager content', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate one-pager content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;

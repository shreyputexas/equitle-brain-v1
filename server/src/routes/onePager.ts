import express from 'express';
import { onePagerGenerationService, OnePagerRequest } from '../services/onePagerGeneration.service';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import logger from '../utils/logger';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const router = express.Router();

// Test endpoint to check template accessibility
router.get('/test-template', async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');

    const projectRoot = process.cwd();
    const templatesPath = path.join(projectRoot, 'equitle-brain-v1/one_pager_templates');
    const navyBluePath = path.join(templatesPath, 'navy_blue.docx');

    const info = {
      projectRoot,
      templatesPath,
      navyBluePath,
      templatesPathExists: fs.existsSync(templatesPath),
      navyBlueExists: fs.existsSync(navyBluePath),
      templateFiles: fs.existsSync(templatesPath) ? fs.readdirSync(templatesPath) : []
    };

    console.log('Template test info:', info);
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Test template generation without auth
router.post('/test-generate', async (req, res) => {
  try {
    const { searcherProfiles, thesisData, teamConnection, template } = req.body as OnePagerRequest;

    console.log('=== DEBUG TEMPLATE GENERATION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!searcherProfiles || !thesisData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Searcher profiles and thesis data are required' 
      });
    }

    // Mock user data for testing
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
      photoURL: '',
      disabled: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      }
    };

    // Mock request with user
    const mockReq = {
      ...req,
      user: mockUser,
      userId: mockUser.uid
    };

    // Call the actual generation service
    const result = await onePagerGenerationService.generateDocxWithTemplate({
      searcherProfiles,
      thesisData,
      teamConnection,
      template: template || 'navy_blue'
    });

    console.log('Generation result size:', result.length);
    console.log('=== END DEBUG ===');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="test-one-pager.docx"');
    res.send(result);

  } catch (error: any) {
    console.error('=== TEMPLATE GENERATION ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===');
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Generate one-pager content and DOCX
router.post('/generate', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { searcherProfiles, thesisData, teamConnection, template } = req.body as OnePagerRequest;

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
      thesisName: thesisData.name,
      template: template || 'basic'
    });

    // Fetch additional user data for template support
    let searchFundName = '';
    let searchFundWebsite = '';
    let searchFundLogo = '';
    let searchFundAddress = '';
    let searchFundEmail = '';

    try {
      const userId = req.user?.uid || 'dev-user-123';
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        searchFundName = userData.searchFundName || '';
        searchFundWebsite = userData.searchFundWebsite || '';
        searchFundLogo = userData.searchFundLogo || '';
        searchFundAddress = userData.searchFundAddress || '';
        searchFundEmail = userData.searchFundEmail || '';
      }
    } catch (error) {
      logger.warn('Could not fetch user data for template', { error: error.message });
    }

    // Generate content using OpenAI
    const content = await onePagerGenerationService.generateContent({
      searcherProfiles,
      thesisData,
      teamConnection
    });

    // Generate DOCX file with template support
    const requestWithTemplate: OnePagerRequest = {
      searcherProfiles,
      thesisData,
      teamConnection,
      template,
      searchFundName,
      searchFundWebsite,
      searchFundLogo,
      searchFundAddress,
      searchFundEmail
    };

    const docxBuffer = await onePagerGenerationService.generateDocxWithTemplate(requestWithTemplate, content);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="search-fund-pitch-${Date.now()}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);

    // Send the DOCX file
    res.send(docxBuffer);

    logger.info('One-pager generated successfully', {
      userId: req.user?.uid,
      contentLength: JSON.stringify(content).length,
      docxSize: docxBuffer.length,
      template: template || 'basic'
    });

  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorStack = error?.stack || 'No stack trace available';

    logger.error('Error generating one-pager', {
      error: errorMessage,
      stack: errorStack,
      userId: req.user?.uid
    });

    console.error('=== ONE-PAGER GENERATION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('===================================');

    res.status(500).json({
      success: false,
      message: 'Failed to generate one-pager',
      error: errorMessage,
      errorType: error?.constructor?.name || typeof error,
      stack: errorStack
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

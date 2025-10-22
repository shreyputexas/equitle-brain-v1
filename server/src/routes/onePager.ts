import express from 'express';
import { onePagerGenerationService, OnePagerRequest } from '../services/onePagerGeneration.service';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import logger from '../utils/logger';
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

// Debug endpoint to check user profile data
router.get('/debug-user-data', async (req, res) => {
  try {
    const userId = 'dev-user-123';
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      res.json({
        success: true,
        userId,
        userData: {
          searchFundName: userData?.searchFundName,
          searchFundWebsite: userData?.searchFundWebsite,
          searchFundLogo: userData?.searchFundLogo,
          searchFundAddress: userData?.searchFundAddress,
          searchFundEmail: userData?.searchFundEmail,
          // Show all available fields
          allFields: Object.keys(userData || {})
        }
      });
    } else {
      res.json({
        success: false,
        message: 'User document not found',
        userId
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
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

            // Get actual searcher profiles from database
            const userId = 'dev-user-123';
            const searcherProfilesRef = db.collection('users').doc(userId).collection('searcherProfiles');
            const searcherProfilesSnapshot = await searcherProfilesRef.get();
            
            let actualSearcherProfiles = [];
            if (!searcherProfilesSnapshot.empty) {
              actualSearcherProfiles = searcherProfilesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            }
            
            // Fallback to test data if no profiles found
            if (actualSearcherProfiles.length === 0) {
              actualSearcherProfiles = [
                {
                  name: "Shariq Hafizi",
                  title: "Founder",
                  headshotUrl: "uploads/headshots/test-headshot-1.jpg"
                },
                {
                  name: "Hazyk Obaid", 
                  title: "Co-Founder",
                  headshotUrl: "uploads/headshots/test-headshot-2.jpg"
                }
              ];
            }

            // Get search fund data from user profile
            let searchFundName = '';
            let searchFundWebsite = '';
            let searchFundLogo = '';
            let searchFundAddress = '';
            let searchFundEmail = '';

            try {
              const userRef = db.collection('users').doc(userId);
              const userDoc = await userRef.get();
              
              if (userDoc.exists) {
                const userData = userDoc.data();
                searchFundName = userData?.searchFundName || '';
                searchFundWebsite = userData?.searchFundWebsite || '';
                searchFundLogo = userData?.searchFundLogo || '';
                searchFundAddress = userData?.searchFundAddress || '';
                searchFundEmail = userData?.searchFundEmail || '';
                
                console.log('=== FETCHED USER DATA ===');
                console.log('searchFundName:', searchFundName);
                console.log('searchFundWebsite:', searchFundWebsite);
                console.log('searchFundAddress:', searchFundAddress);
                console.log('searchFundEmail:', searchFundEmail);
                console.log('searchFundLogo:', searchFundLogo);
                console.log('=== END USER DATA ===');
              } else {
                console.log('User document not found');
              }
            } catch (error) {
              console.log('Could not fetch user data:', error.message);
            }

            // Generate content first
            const content = await onePagerGenerationService.generateContent({
              searcherProfiles: actualSearcherProfiles,
              thesisData,
              teamConnection,
              template: template || 'navy_blue'
            });

            // Call the actual generation service with content
            const result = await onePagerGenerationService.generateDocxWithTemplate({
              searcherProfiles: actualSearcherProfiles,
              searchFundName,
              searchFundWebsite,
              searchFundLogo,
              searchFundAddress,
              searchFundEmail,
              thesisData,
              teamConnection,
              template: template || 'navy_blue'
            }, content); // Pass the generated content as second parameter

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
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        searchFundName = userData?.searchFundName || '';
        searchFundWebsite = userData?.searchFundWebsite || '';
        searchFundLogo = userData?.searchFundLogo || '';
        searchFundAddress = userData?.searchFundAddress || '';
        searchFundEmail = userData?.searchFundEmail || '';
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

// Test endpoint for industry research (no auth required)
router.post('/test-industry-research', async (req, res) => {
  try {
    const { thesisData, selectedIndustry } = req.body;

    if (!thesisData || !thesisData.name) {
      return res.status(400).json({
        success: false,
        message: 'Thesis data with name is required'
      });
    }

    logger.info('Generating test industry research report', {
      thesisName: thesisData.name,
      selectedIndustry: selectedIndustry || 'all industries'
    });

    // Generate industry research with AI
    const docxBuffer = await onePagerGenerationService.generateIndustryResearchWithAI(thesisData, selectedIndustry);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="test-industry-research-${Date.now()}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);

    // Send the file
    res.send(docxBuffer);

    logger.info('Test industry research report generated successfully', {
      thesisName: thesisData.name,
      docxSize: docxBuffer.length
    });

  } catch (error: any) {
    logger.error('Failed to generate test industry research report', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate industry research report', 
      error: error.message 
    });
  }
});

// Industry Research Report Generation
router.post('/generate-industry-research', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { thesisData, selectedIndustry } = req.body;

    if (!thesisData || !thesisData.name || !thesisData.criteria) {
      return res.status(400).json({
        success: false,
        message: 'Thesis data is required with name and criteria'
      });
    }

    logger.info('Generating industry research report', {
      thesisName: thesisData.name,
      criteriaCount: thesisData.criteria.length,
      selectedIndustry: selectedIndustry || 'all industries',
      userId: req.user?.uid
    });

    // Generate industry research with AI
    const docxBuffer = await onePagerGenerationService.generateIndustryResearchWithAI(thesisData, selectedIndustry);

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="industry-research-${thesisData.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);

    // Send the file
    res.send(docxBuffer);

    logger.info('Industry research report generated successfully', {
      thesisName: thesisData.name,
      fileSize: docxBuffer.length,
      userId: req.user?.uid
    });

  } catch (error: any) {
    logger.error('Error generating industry research report', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate industry research report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;

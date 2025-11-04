import express from 'express';
import { onePagerGenerationService, OnePagerRequest } from '../services/onePagerGeneration.service';
import { firebaseAuthMiddleware, User } from '../middleware/firebaseAuth';
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
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
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
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
            
            let actualSearcherProfiles: any[] = [];
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
            } catch (error: unknown) {
              console.log('Could not fetch user data:', error instanceof Error ? error.message : 'Unknown error');
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

  } catch (error: unknown) {
    console.error('=== TEMPLATE GENERATION ERROR ===');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('=== END ERROR ===');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });
  }
});

// Generate one-pager content and DOCX
router.post('/generate', firebaseAuthMiddleware, async (req: any, res: any) => {
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
    } catch (error: unknown) {
      logger.warn('Could not fetch user data for template', { error: error instanceof Error ? error.message : 'Unknown error' });
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

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error');
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';

    logger.error('Error generating one-pager', {
      error: errorMessage,
      stack: errorStack,
      userId: req.user?.uid
    });

    console.error('=== ONE-PAGER GENERATION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error instanceof Error ? error.constructor.name : 'Unknown');
    console.error('Error message:', errorMessage);
    console.error('Error stack:', errorStack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    console.error('===================================');

    res.status(500).json({
      success: false,
      message: 'Failed to generate one-pager',
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: errorStack
    });
  }
});

// Get one-pager content only (without DOCX generation)
router.post('/content', firebaseAuthMiddleware, async (req: any, res: any) => {
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

  } catch (error: unknown) {
    logger.error('Error generating one-pager content', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.user?.uid
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate one-pager content',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

// Test endpoint for basic document generation (no auth required)
router.post('/test-basic-document', async (req, res) => {
  try {
    console.log('=== TEST-BASIC-DOCUMENT REQUEST ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Full request body:', JSON.stringify(req.body, null, 2));

    const { thesisData, selectedIndustry, template } = req.body;

    console.log('Extracted template:', template);
    console.log('Template type:', typeof template);
    console.log('Template === "navy":', template === 'navy');

    if (!thesisData || !thesisData.name || !thesisData.criteria) {
      return res.status(400).json({
        success: false,
        message: 'Thesis data is required with name and criteria'
      });
    }

    if (!selectedIndustry) {
      return res.status(400).json({
        success: false,
        message: 'Selected industry is required'
      });
    }

    logger.info('Generating test industry document', {
      thesisName: thesisData.name,
      selectedIndustry: selectedIndustry,
      template: template || 'basic'
    });

    // Fetch search fund data (using dev user for test)
    let searchFundData = {
      name: undefined,
      website: undefined,
      email: undefined,
      address: undefined
    };

    try {
      const userId = 'dev-user-123';
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        searchFundData = {
          name: userData?.searchFundName,
          website: userData?.searchFundWebsite,
          email: userData?.searchFundEmail,
          address: userData?.searchFundAddress,
        };
      }
    } catch (error: unknown) {
      console.log('Could not fetch search fund data for test, continuing without it');
    }

    // Use new method with template support
    const docxBuffer = await onePagerGenerationService.generateIndustryResearchWithTemplate(
      thesisData,
      selectedIndustry,
      template,
      searchFundData
    );

    // Set response headers for file download
    const templateSuffix = template === 'navy' ? '-navy' : '';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="test-industry-report-${selectedIndustry.replace(/[^a-zA-Z0-9]/g, '-')}${templateSuffix}-${Date.now()}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);

    // Send the file
    res.send(docxBuffer);

    logger.info('Test industry document generated successfully', {
      thesisName: thesisData.name,
      selectedIndustry: selectedIndustry,
      template: template || 'basic',
      fileSize: docxBuffer.length
    });

  } catch (error: unknown) {
    logger.error('Error generating test industry document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack available'
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate test industry document',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate basic industry research document
router.post('/generate-basic-document', firebaseAuthMiddleware, async (req: any, res: any) => {
  try {
    console.log('=== GENERATE-BASIC-DOCUMENT REQUEST ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Template value:', req.body.template);
    console.log('Template type:', typeof req.body.template);

    const { thesisData, selectedIndustry, template } = req.body;

    console.log('Extracted template:', template);
    console.log('Template === "navy":', template === 'navy');

    if (!thesisData || !thesisData.name || !thesisData.criteria) {
      return res.status(400).json({
        success: false,
        message: 'Thesis data is required with name and criteria'
      });
    }

    if (!selectedIndustry) {
      return res.status(400).json({
        success: false,
        message: 'Selected industry is required'
      });
    }

    logger.info('Generating industry document', {
      thesisName: thesisData.name,
      selectedIndustry: selectedIndustry,
      template: template || 'basic',
      userId: req.user?.uid
    });

    // Fetch search fund data from user profile
    let searchFundData = {
      name: undefined,
      website: undefined,
      email: undefined,
      address: undefined
    };

    try {
      const userId = req.user?.uid || 'dev-user-123';
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        searchFundData = {
          name: userData?.searchFundName,
          website: userData?.searchFundWebsite,
          email: userData?.searchFundEmail,
          address: userData?.searchFundAddress,
        };

        console.log('Fetched search fund data:', searchFundData);
      }
    } catch (error: unknown) {
      logger.warn('Could not fetch search fund data, continuing without it', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Generate document with template support
    const docxBuffer = await onePagerGenerationService.generateIndustryResearchWithTemplate(
      thesisData,
      selectedIndustry,
      template,
      searchFundData
    );

    // Set response headers for file download
    const templateSuffix = template === 'navy' ? '-navy' : '';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="industry-report-${selectedIndustry.replace(/[^a-zA-Z0-9]/g, '-')}${templateSuffix}-${Date.now()}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);

    // Send the file
    res.send(docxBuffer);

    logger.info('Industry document generated successfully', {
      thesisName: thesisData.name,
      selectedIndustry: selectedIndustry,
      template: template || 'basic',
      fileSize: docxBuffer.length,
      userId: req.user?.uid
    });

  } catch (error: unknown) {
    logger.error('Error generating industry document', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack available',
      userId: req.user?.uid
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate industry document',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    });
  }
});

export default router;

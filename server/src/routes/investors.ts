import express from 'express';
import logger from '../utils/logger';

const router = express.Router();

// Start with empty array - no fake data
const investors: any[] = [];

router.get('/', async (req, res) => {
  try {
    res.json({ investors });
  } catch (error) {
    logger.error('Get investors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      region,
      commitment,
      called = 0,
      currency,
      contactName,
      contactEmail,
      contactPhone,
      address,
      website,
      description,
      investmentPreferences,
      isQualifiedInvestor,
      requiresReporting,
      taxExempt,
      status = 'active',
      onboardingDate,
      entities = []
    } = req.body;

    // Validate required fields
    if (!name || !type || !commitment || !contactName || !contactEmail) {
      return res.status(400).json({
        message: 'Missing required fields: name, type, commitment, contactName, contactEmail'
      });
    }

    // Create new investor
    const newInvestor = {
      id: Date.now().toString(), // Simple ID generation
      name,
      type,
      region,
      commitment: Number(commitment),
      called: Number(called),
      currency,
      contactName,
      contactEmail,
      contactPhone,
      address,
      website,
      description,
      investmentPreferences: investmentPreferences || [],
      isQualifiedInvestor: isQualifiedInvestor || false,
      requiresReporting: requiresReporting || false,
      taxExempt: taxExempt || false,
      status,
      onboardingDate: onboardingDate || new Date().toISOString(),
      entities,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to investors array
    investors.push(newInvestor);

    logger.info('New investor added:', { id: newInvestor.id, name: newInvestor.name });

    res.status(201).json({
      message: 'Investor added successfully',
      investor: newInvestor
    });

  } catch (error) {
    logger.error('Add investor error:', error);
    res.status(500).json({ message: 'Server error adding investor' });
  }
});

export default router;
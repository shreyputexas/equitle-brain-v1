import express from 'express';
import logger from '../utils/logger';

const router = express.Router();

// Start with empty array - no fake data
const funds: any[] = [];

router.get('/', async (req, res) => {
  try {
    res.json({ funds });
  } catch (error) {
    logger.error('Get funds error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      strategy,
      targetSize,
      minimumCommitment,
      managementFee,
      carriedInterest,
      currency,
      vintage,
      investmentPeriod,
      fundTerm,
      geoFocus,
      sectorFocus,
      description,
      status = 'Pre-Launch'
    } = req.body;

    // Validate required fields
    if (!name || !type || !targetSize) {
      return res.status(400).json({
        message: 'Missing required fields: name, type, targetSize'
      });
    }

    // Create new fund
    const newFund = {
      id: Date.now().toString(), // Simple ID generation
      name,
      type,
      strategy,
      targetSize: Number(targetSize),
      minimumCommitment: Number(minimumCommitment),
      managementFee: Number(managementFee),
      carriedInterest: Number(carriedInterest),
      currency: currency || 'USD',
      vintage: Number(vintage),
      investmentPeriod: Number(investmentPeriod),
      fundTerm: Number(fundTerm),
      geoFocus,
      sectorFocus,
      description,
      status,
      raisedAmount: 0,
      investorCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to funds array
    funds.push(newFund);

    logger.info('New fund created:', { id: newFund.id, name: newFund.name });

    res.status(201).json({
      message: 'Fund created successfully',
      fund: newFund
    });

  } catch (error) {
    logger.error('Create fund error:', error);
    res.status(500).json({ message: 'Server error creating fund' });
  }
});

export default router;
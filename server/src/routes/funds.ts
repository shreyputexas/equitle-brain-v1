import express from 'express';
import logger from '../utils/logger';
import prisma from '../lib/database';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const funds = await prisma.fund.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ funds });
  } catch (error) {
    logger.error('Get funds error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

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

    // Create new fund using Prisma
    const newFund = await prisma.fund.create({
      data: {
        userId,
        name,
        type,
        strategy,
        targetSize: Number(targetSize),
        minimumCommitment: minimumCommitment ? Number(minimumCommitment) : null,
        managementFee: managementFee ? Number(managementFee) : null,
        carriedInterest: carriedInterest ? Number(carriedInterest) : null,
        currency: currency || 'USD',
        vintage: vintage ? Number(vintage) : null,
        investmentPeriod: investmentPeriod ? Number(investmentPeriod) : null,
        fundTerm: fundTerm ? Number(fundTerm) : null,
        geoFocus,
        sectorFocus,
        description,
        status
      }
    });

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

// Delete fund
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    console.log('=== DELETE /funds/:id called ===');
    console.log('Fund ID:', id);
    console.log('User ID:', userId);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if fund exists and belongs to user
    const existingFund = await prisma.fund.findFirst({
      where: { id, userId }
    });

    console.log('Found fund:', existingFund);

    if (!existingFund) {
      console.log('Fund not found - returning 404');
      return res.status(404).json({ message: 'Fund not found' });
    }

    // Delete the fund
    await prisma.fund.delete({
      where: { id }
    });

    logger.info('Fund deleted:', { id, name: existingFund.name });

    res.json({ message: 'Fund deleted successfully' });

  } catch (error) {
    logger.error('Delete fund error:', error);
    res.status(500).json({ message: 'Server error deleting fund' });
  }
});

export default router;
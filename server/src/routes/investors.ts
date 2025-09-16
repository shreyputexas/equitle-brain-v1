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

    const investors = await prisma.investor.findMany({
      where: { userId },
      include: {
        entities: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ investors });
  } catch (error) {
    logger.error('Get investors error:', error);
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

    // Create new investor using Prisma
    const newInvestor = await prisma.investor.create({
      data: {
        userId,
        name,
        type,
        status,
        totalCommitment: Number(commitment),
        totalCalled: Number(called),
        description,
        website,
        location: region,
        tags: investmentPreferences || [],
        metadata: {
          contactName,
          contactEmail,
          contactPhone,
          address,
          currency,
          isQualifiedInvestor: isQualifiedInvestor || false,
          requiresReporting: requiresReporting || false,
          taxExempt: taxExempt || false,
          onboardingDate: onboardingDate || new Date().toISOString()
        }
      },
      include: {
        entities: true
      }
    });

    logger.info('New investor added:', { id: newInvestor.id, name: newInvestor.name });

    // Auto-assign to default "All Limited Partners" group
    await assignToDefaultGroup(userId, newInvestor.id);

    res.status(201).json({
      message: 'Investor added successfully',
      investor: newInvestor
    });

  } catch (error) {
    logger.error('Add investor error:', error);
    res.status(500).json({ message: 'Server error adding investor' });
  }
});

// Helper function to assign investor to default group
async function assignToDefaultGroup(userId: string, investorId: string) {
  try {
    // Find or create the default "All Limited Partners" group
    let defaultGroup = await prisma.lPGroup.findFirst({
      where: {
        userId,
        type: 'system',
        name: 'All Limited Partners'
      }
    });

    // Create the default group if it doesn't exist
    if (!defaultGroup) {
      defaultGroup = await prisma.lPGroup.create({
        data: {
          userId,
          name: 'All Limited Partners',
          description: 'Default group containing all Limited Partners',
          type: 'system',
          autoAssign: true,
          emailPreferences: {
            enableNotifications: true,
            frequency: 'monthly',
            types: ['quarterly_reports', 'capital_calls', 'performance_updates']
          }
        }
      });

      logger.info('Created default LP group:', { id: defaultGroup.id, userId });
    }

    // Check if investor is already in the group
    const existingMembership = await prisma.investorGroupMember.findFirst({
      where: {
        investorId,
        groupId: defaultGroup.id
      }
    });

    // Add investor to the default group if not already a member
    if (!existingMembership) {
      await prisma.investorGroupMember.create({
        data: {
          investorId,
          groupId: defaultGroup.id,
          autoAssigned: true
        }
      });

      logger.info('Auto-assigned investor to default group:', {
        investorId,
        groupId: defaultGroup.id
      });
    }

  } catch (error) {
    logger.error('Error assigning investor to default group:', error);
    // Don't throw error to avoid blocking investor creation
  }
}

// Function to assign all existing investors to default group (for migration purposes)
export async function assignAllExistingInvestorsToDefaultGroup(userId: string) {
  try {
    // Find all investors for this user
    const investors = await prisma.investor.findMany({
      where: { userId }
    });

    // Assign each investor to the default group
    for (const investor of investors) {
      await assignToDefaultGroup(userId, investor.id);
    }

    logger.info('Assigned all existing investors to default group:', {
      userId,
      count: investors.length
    });

  } catch (error) {
    logger.error('Error assigning existing investors to default group:', error);
  }
}

// Delete investor
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if investor exists and belongs to user
    const existingInvestor = await prisma.investor.findFirst({
      where: { id, userId }
    });

    if (!existingInvestor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    // Delete the investor (this will cascade delete group memberships)
    await prisma.investor.delete({
      where: { id }
    });

    logger.info('Investor deleted:', { id, name: existingInvestor.name });

    res.json({ message: 'Investor deleted successfully' });

  } catch (error) {
    logger.error('Delete investor error:', error);
    res.status(500).json({ message: 'Server error deleting investor' });
  }
});

export default router;
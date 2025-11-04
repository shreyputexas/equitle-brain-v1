import express from 'express';
import logger from '../utils/logger';
import prisma from '../lib/database';
import { assignAllExistingInvestorsToDefaultGroup } from './investors';

const router = express.Router();

// Get all LP groups for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const groups = await prisma.lPGroup.findMany({
      where: { userId },
      include: {
        members: {
          include: {
            investor: {
              select: {
                id: true,
                name: true,
                type: true,
                totalCommitment: true,
              }
            }
          }
        }
      },
      orderBy: [
        { type: 'asc' }, // System groups first
        { createdAt: 'desc' }
      ]
    });

    // Add member count to each group
    const groupsWithCounts = groups.map(group => ({
      ...group,
      memberCount: group.members.length
    }));

    // Ensure existing investors are assigned to default group (migration logic)
    // This runs in the background without blocking the response
    assignAllExistingInvestorsToDefaultGroup(userId).catch(err => {
      logger.error('Background assignment to default group failed:', err);
    });

    res.json({ groups: groupsWithCounts });
  } catch (error) {
    logger.error('Get LP groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new LP group
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const {
      name,
      description,
      criteria,
      autoAssign,
      emailPreferences
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Group name is required'
      });
    }

    // Create new LP group
    const newGroup = await prisma.lPGroup.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        type: 'custom',
        criteria: criteria || null,
        autoAssign: autoAssign || false,
        emailPreferences: emailPreferences || null
      },
      include: {
        members: {
          include: {
            investor: {
              select: {
                id: true,
                name: true,
                type: true,
                totalCommitment: true,
              }
            }
          }
        }
      }
    });

    // If auto-assign is enabled, assign matching investors
    if (autoAssign && criteria) {
      await assignInvestorsToGroup(newGroup.id, userId, criteria);
    }

    logger.info('New LP group created:', { id: newGroup.id, name: newGroup.name });

    res.status(201).json({
      message: 'LP group created successfully',
      group: {
        ...newGroup,
        memberCount: newGroup.members.length
      }
    });

  } catch (error) {
    logger.error('Create LP group error:', error);
    res.status(500).json({ message: 'Server error creating LP group' });
  }
});

// Update LP group
router.put('/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if group exists and belongs to user
    const existingGroup = await prisma.lPGroup.findFirst({
      where: { id, userId }
    });

    if (!existingGroup) {
      return res.status(404).json({ message: 'LP group not found' });
    }

    // Prevent modification of system groups
    if (existingGroup.type === 'system') {
      return res.status(403).json({ message: 'Cannot modify system groups' });
    }

    const {
      name,
      description,
      criteria,
      autoAssign,
      emailPreferences
    } = req.body;

    // Update the group
    const updatedGroup = await prisma.lPGroup.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(criteria !== undefined && { criteria }),
        ...(autoAssign !== undefined && { autoAssign }),
        ...(emailPreferences !== undefined && { emailPreferences })
      },
      include: {
        members: {
          include: {
            investor: {
              select: {
                id: true,
                name: true,
                type: true,
                totalCommitment: true,
              }
            }
          }
        }
      }
    });

    logger.info('LP group updated:', { id: updatedGroup.id, name: updatedGroup.name });

    res.json({
      message: 'LP group updated successfully',
      group: {
        ...updatedGroup,
        memberCount: updatedGroup.members.length
      }
    });

  } catch (error) {
    logger.error('Update LP group error:', error);
    res.status(500).json({ message: 'Server error updating LP group' });
  }
});

// Delete LP group
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if group exists and belongs to user
    const existingGroup = await prisma.lPGroup.findFirst({
      where: { id, userId }
    });

    if (!existingGroup) {
      return res.status(404).json({ message: 'LP group not found' });
    }

    // Prevent deletion of system groups
    if (existingGroup.type === 'system') {
      return res.status(403).json({ message: 'Cannot delete system groups' });
    }

    // Delete the group (cascade will handle member relationships)
    await prisma.lPGroup.delete({
      where: { id }
    });

    logger.info('LP group deleted:', { id, name: existingGroup.name });

    res.json({ message: 'LP group deleted successfully' });

  } catch (error) {
    logger.error('Delete LP group error:', error);
    res.status(500).json({ message: 'Server error deleting LP group' });
  }
});

// Add investor to group
router.post('/:id/members', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { investorId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!investorId) {
      return res.status(400).json({ message: 'Investor ID is required' });
    }

    // Verify group exists and belongs to user
    const group = await prisma.lPGroup.findFirst({
      where: { id, userId }
    });

    if (!group) {
      return res.status(404).json({ message: 'LP group not found' });
    }

    // Verify investor exists and belongs to user
    const investor = await prisma.investor.findFirst({
      where: { id: investorId, userId }
    });

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    // Check if membership already exists
    const existingMembership = await prisma.investorGroupMember.findFirst({
      where: { investorId, groupId: id }
    });

    if (existingMembership) {
      return res.status(409).json({ message: 'Investor is already in this group' });
    }

    // Add investor to group
    await prisma.investorGroupMember.create({
      data: {
        investorId,
        groupId: id,
        autoAssigned: false
      }
    });

    logger.info('Investor added to LP group:', { groupId: id, investorId });

    res.json({ message: 'Investor added to group successfully' });

  } catch (error) {
    logger.error('Add investor to group error:', error);
    res.status(500).json({ message: 'Server error adding investor to group' });
  }
});

// Remove investor from group
router.delete('/:id/members/:investorId', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id, investorId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify group exists and belongs to user
    const group = await prisma.lPGroup.findFirst({
      where: { id, userId }
    });

    if (!group) {
      return res.status(404).json({ message: 'LP group not found' });
    }

    // Don't allow removal from system "All Limited Partners" group
    if (group.type === 'system' && group.name === 'All Limited Partners') {
      return res.status(403).json({ message: 'Cannot remove investors from the default group' });
    }

    // Remove investor from group
    const deletedMembership = await prisma.investorGroupMember.deleteMany({
      where: { investorId, groupId: id }
    });

    if (deletedMembership.count === 0) {
      return res.status(404).json({ message: 'Investor not found in this group' });
    }

    logger.info('Investor removed from LP group:', { groupId: id, investorId });

    res.json({ message: 'Investor removed from group successfully' });

  } catch (error) {
    logger.error('Remove investor from group error:', error);
    res.status(500).json({ message: 'Server error removing investor from group' });
  }
});

// Helper function to assign investors to group based on criteria
async function assignInvestorsToGroup(groupId: string, userId: string, criteria: any) {
  try {
    // Build where clause based on criteria
    const where: any = { userId };

    if (criteria.investorTypes?.length > 0) {
      where.type = { in: criteria.investorTypes };
    }

    if (criteria.minCommitment || criteria.maxCommitment) {
      where.totalCommitment = {};
      if (criteria.minCommitment) where.totalCommitment.gte = criteria.minCommitment;
      if (criteria.maxCommitment !== Infinity && criteria.maxCommitment > 0) {
        where.totalCommitment.lte = criteria.maxCommitment;
      }
    }

    if (criteria.regions?.length > 0) {
      where.location = { in: criteria.regions };
    }

    // Find matching investors
    const matchingInvestors = await prisma.investor.findMany({
      where,
      select: { id: true }
    });

    // Create group memberships for matching investors (ignore duplicates)
    const memberships = matchingInvestors.map(investor => ({
      investorId: investor.id,
      groupId,
      autoAssigned: true
    }));

    if (memberships.length > 0) {
      await prisma.investorGroupMember.createMany({
        data: memberships,
        skipDuplicates: true
      });
    }

    logger.info('Auto-assigned investors to group:', {
      groupId,
      count: memberships.length
    });

  } catch (error) {
    logger.error('Auto-assign investors error:', error);
  }
}

export default router;// Trigger restart

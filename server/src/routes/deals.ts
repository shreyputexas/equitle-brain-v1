import express from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/database';
import logger from '../utils/logger';

const router = express.Router();

// Validation schemas
const createDealSchema = Joi.object({
  company: Joi.string().required(),
  description: Joi.string().optional(),
  sector: Joi.string().optional(),
  stage: Joi.string().valid('prospect', 'due-diligence', 'term-sheet', 'closing', 'closed').default('prospect'),
  status: Joi.string().valid('active', 'paused', 'closed', 'lost').default('active'),
  value: Joi.number().optional(),
  probability: Joi.number().min(0).max(100).optional(),
  leadPartner: Joi.string().optional(),
  team: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  targetClose: Joi.date().optional(),
  nextStep: Joi.string().optional(),
  source: Joi.string().optional(),
  geography: Joi.string().optional(),
  dealSize: Joi.string().optional(),
});

const updateDealSchema = Joi.object({
  company: Joi.string().optional(),
  description: Joi.string().optional(),
  sector: Joi.string().optional(),
  stage: Joi.string().valid('prospect', 'due-diligence', 'term-sheet', 'closing', 'closed').optional(),
  status: Joi.string().valid('active', 'paused', 'closed', 'lost').optional(),
  value: Joi.number().optional(),
  probability: Joi.number().min(0).max(100).optional(),
  leadPartner: Joi.string().optional(),
  team: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  targetClose: Joi.date().optional(),
  nextStep: Joi.string().optional(),
  source: Joi.string().optional(),
  geography: Joi.string().optional(),
  dealSize: Joi.string().optional(),
});

// @route   GET /api/deals
// @desc    Get all deals for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { search, sector, stage, status, limit = 50, offset = 0 } = req.query;

    // Build where conditions
    const where: any = { userId };

    if (search) {
      where.OR = [
        { company: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { nextStep: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (sector) where.sector = sector;
    if (stage) where.stage = stage;
    if (status) where.status = status;

    const deals = await prisma.deal.findMany({
      where,
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            relationshipScore: true,
            status: true,
            lastContact: true,
          }
        },
        activities: {
          select: {
            id: true,
            type: true,
            title: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: 5,
        },
        communications: {
          select: {
            id: true,
            type: true,
            subject: true,
            sentAt: true,
          },
          orderBy: { sentAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            contacts: true,
            activities: true,
            communications: true,
            documents: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({ deals, total: deals.length });
  } catch (error: any) {
    logger.error('Get deals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/deals/:id
// @desc    Get single deal by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id, userId },
      include: {
        contacts: {
          include: {
            activities: {
              orderBy: { date: 'desc' },
              take: 10,
            },
            communications: {
              orderBy: { sentAt: 'desc' },
              take: 10,
            }
          }
        },
        activities: {
          include: {
            contact: {
              select: { name: true, email: true }
            }
          },
          orderBy: { date: 'desc' },
        },
        communications: {
          include: {
            contact: {
              select: { name: true, email: true }
            }
          },
          orderBy: { sentAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        }
      }
    });

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json({ deal });
  } catch (error: any) {
    logger.error('Get deal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/deals
// @desc    Create new deal
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Validate input
    const { error, value } = createDealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const deal = await prisma.deal.create({
      data: {
        ...value,
        userId,
        lastActivity: new Date(),
      },
      include: {
        contacts: true,
        _count: {
          select: {
            contacts: true,
            activities: true,
            communications: true,
            documents: true,
          }
        }
      }
    });

    logger.info(`Deal created: ${deal.company} by user ${userId}`);
    res.status(201).json({ deal });
  } catch (error: any) {
    logger.error('Create deal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/deals/:id
// @desc    Update deal
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateDealSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Check if deal exists and belongs to user
    const existingDeal = await prisma.deal.findFirst({
      where: { id, userId }
    });

    if (!existingDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...value,
        lastActivity: new Date(),
      },
      include: {
        contacts: true,
        _count: {
          select: {
            contacts: true,
            activities: true,
            communications: true,
            documents: true,
          }
        }
      }
    });

    logger.info(`Deal updated: ${deal.company} by user ${userId}`);
    res.json({ deal });
  } catch (error: any) {
    logger.error('Update deal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/deals/:id
// @desc    Delete (archive) deal
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Check if deal exists and belongs to user
    const existingDeal = await prisma.deal.findFirst({
      where: { id, userId }
    });

    if (!existingDeal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Soft delete by updating status
    await prisma.deal.update({
      where: { id },
      data: { status: 'closed' }
    });

    logger.info(`Deal archived: ${existingDeal.company} by user ${userId}`);
    res.json({ message: 'Deal archived successfully' });
  } catch (error: any) {
    logger.error('Delete deal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/deals/:id/contacts
// @desc    Add contact to deal
// @access  Private
router.post('/:id/contacts', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id: dealId } = req.params;
    const { contactId } = req.body;

    // Verify deal exists and belongs to user
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, userId }
    });

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Verify contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId }
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Update contact to associate with deal
    await prisma.contact.update({
      where: { id: contactId },
      data: { dealId }
    });

    logger.info(`Contact ${contact.name} added to deal ${deal.company}`);
    res.json({ message: 'Contact added to deal successfully' });
  } catch (error: any) {
    logger.error('Add contact to deal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
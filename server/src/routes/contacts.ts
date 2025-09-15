import express from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/database';
import logger from '../utils/logger';

const router = express.Router();

// Validation schemas
const createContactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  company: Joi.string().optional(),
  title: Joi.string().optional(),
  role: Joi.string().optional(),
  linkedinUrl: Joi.string().uri().optional(),
  notes: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  relationshipScore: Joi.number().min(0).max(100).optional(),
  status: Joi.string().valid('hot', 'warm', 'cold', 'inactive').default('warm'),
  isKeyContact: Joi.boolean().default(false),
  dealId: Joi.string().optional(),
});

const updateContactSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  company: Joi.string().optional(),
  title: Joi.string().optional(),
  role: Joi.string().optional(),
  linkedinUrl: Joi.string().uri().optional(),
  notes: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  relationshipScore: Joi.number().min(0).max(100).optional(),
  status: Joi.string().valid('hot', 'warm', 'cold', 'inactive').optional(),
  isKeyContact: Joi.boolean().optional(),
  dealId: Joi.string().optional(),
});

// @route   GET /api/contacts
// @desc    Get all contacts for the authenticated user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { search, dealId, status, limit = 50, offset = 0 } = req.query;

    // Build where conditions
    const where: any = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (dealId) where.dealId = dealId;
    if (status) where.status = status;

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        deal: {
          select: {
            id: true,
            company: true,
            stage: true,
            status: true,
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
            activities: true,
            communications: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json({ contacts, total: contacts.length });
  } catch (error: any) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/contacts/:id
// @desc    Get single contact by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id, userId },
      include: {
        deal: {
          select: {
            id: true,
            company: true,
            stage: true,
            status: true,
            value: true,
            probability: true,
          }
        },
        activities: {
          orderBy: { date: 'desc' },
        },
        communications: {
          orderBy: { sentAt: 'desc' },
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({ contact });
  } catch (error: any) {
    logger.error('Get contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/contacts
// @desc    Create new contact
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Validate input
    const { error, value } = createContactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Check if contact with same email already exists for this user
    if (value.email) {
      const existingContact = await prisma.contact.findFirst({
        where: { userId, email: value.email }
      });

      if (existingContact) {
        return res.status(409).json({ message: 'Contact with this email already exists' });
      }
    }

    const contact = await prisma.contact.create({
      data: {
        ...value,
        userId,
        lastContact: new Date(),
      },
      include: {
        deal: {
          select: {
            id: true,
            company: true,
            stage: true,
            status: true,
          }
        },
        _count: {
          select: {
            activities: true,
            communications: true,
          }
        }
      }
    });

    logger.info(`Contact created: ${contact.name} by user ${userId}`);
    res.status(201).json({ contact });
  } catch (error: any) {
    logger.error('Create contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/contacts/:id
// @desc    Update contact
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateContactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: { id, userId }
    });

    if (!existingContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Check for email conflicts if email is being updated
    if (value.email && value.email !== existingContact.email) {
      const emailConflict = await prisma.contact.findFirst({
        where: { userId, email: value.email, id: { not: id } }
      });

      if (emailConflict) {
        return res.status(409).json({ message: 'Contact with this email already exists' });
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: value,
      include: {
        deal: {
          select: {
            id: true,
            company: true,
            stage: true,
            status: true,
          }
        },
        _count: {
          select: {
            activities: true,
            communications: true,
          }
        }
      }
    });

    logger.info(`Contact updated: ${contact.name} by user ${userId}`);
    res.json({ contact });
  } catch (error: any) {
    logger.error('Update contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/contacts/:id
// @desc    Delete contact
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: { id, userId }
    });

    if (!existingContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await prisma.contact.delete({
      where: { id }
    });

    logger.info(`Contact deleted: ${existingContact.name} by user ${userId}`);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error: any) {
    logger.error('Delete contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/contacts/:id/interactions
// @desc    Log interaction with contact
// @access  Private
router.post('/:id/interactions', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id: contactId } = req.params;
    const { type, title, description, content, date, duration, outcome, nextSteps } = req.body;

    // Verify contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId }
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Create activity
    const activity = await prisma.activity.create({
      data: {
        userId,
        contactId,
        dealId: contact.dealId,
        type,
        title,
        description,
        content,
        date: date ? new Date(date) : new Date(),
        duration,
        outcome,
        nextSteps,
        status: 'completed',
      }
    });

    // Update contact's last contact date
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastContact: new Date() }
    });

    logger.info(`Interaction logged for contact ${contact.name}: ${type}`);
    res.status(201).json({ activity });
  } catch (error: any) {
    logger.error('Log interaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
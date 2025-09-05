import express from 'express';
import logger from '../utils/logger';

const router = express.Router();

// Mock deals data
const deals = [
  {
    id: '1',
    company: 'TechCorp Inc.',
    sector: 'Technology',
    stage: 'Due Diligence',
    value: 12500000,
    probability: 65,
    leadPartner: 'John Smith',
    status: 'active'
  }
];

// @route   GET /api/deals
// @desc    Get all deals
// @access  Private
router.get('/', async (req, res) => {
  try {
    res.json({ deals });
  } catch (error) {
    logger.error('Get deals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/deals/:id
// @desc    Get deal by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const deal = deals.find(d => d.id === req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }
    res.json({ deal });
  } catch (error) {
    logger.error('Get deal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
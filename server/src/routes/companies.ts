import express from 'express';
import logger from '../utils/logger';

const router = express.Router();

const companies = [
  { id: '1', name: 'TechCorp Inc.', sector: 'Technology', status: 'active' }
];

router.get('/', async (req, res) => {
  try {
    res.json({ companies });
  } catch (error) {
    logger.error('Get companies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
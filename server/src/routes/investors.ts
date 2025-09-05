import express from 'express';
import logger from '../utils/logger';

const router = express.Router();

const investors = [
  { id: 1, name: 'Goldman Sachs', type: 'Institutional', commitment: 50000000 }
];

router.get('/', async (req, res) => {
  try {
    res.json({ investors });
  } catch (error) {
    logger.error('Get investors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
import express from 'express';
import logger from '../utils/logger';

const router = express.Router();

const contacts = [
  { id: '1', name: 'Michael Chen', role: 'CEO', company: 'TechCorp Inc.' }
];

router.get('/', async (req, res) => {
  try {
    res.json({ contacts });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
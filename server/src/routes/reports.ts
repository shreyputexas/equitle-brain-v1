import express from 'express';
import logger from '../utils/logger';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const reports = [
      { id: '1', title: 'Q4 Performance Report', type: 'quarterly' }
    ];
    res.json({ reports });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
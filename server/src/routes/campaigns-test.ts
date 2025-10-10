console.log('🚀 CAMPAIGN TEST ROUTES: Starting to load...');

import express from 'express';

console.log('🚀 CAMPAIGN TEST ROUTES: Express imported');

const router = express.Router();

console.log('🚀 CAMPAIGN TEST ROUTES: Router created');

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Campaign test routes working!' });
});

console.log('🚀 CAMPAIGN TEST ROUTES: Test route registered');

console.log('🚀 CAMPAIGN TEST ROUTES: Ready to export');

export default router;
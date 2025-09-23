import express from 'express';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import prisma from '../lib/database';
import logger from '../utils/logger';

// Type definitions for Prisma models
interface Deal {
  id: string;
  userId: string;
  company: string;
  stage: string;
  value: number | null;
  status: string;
  probability: number | null;
  sector: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface Communication {
  id: string;
  userId: string;
  type: string;
  createdAt: Date;
}

interface Document {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

const router = express.Router();

// Get comprehensive dashboard data
router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const [user, metrics, dealFlow, portfolioDistribution, recentDeals] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      getMetrics(userId),
      getDealFlow(userId),
      getPortfolioDistribution(userId),
      getRecentDeals(userId)
    ]);

    res.json({
      success: true,
      data: {
        userName: user?.name || 'User',
        metrics,
        dealFlow,
        portfolioDistribution,
        recentDeals
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

// Alias route for /data (frontend compatibility)
router.get('/data', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const [user, metrics, dealFlow, portfolioDistribution, recentDeals] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      getMetrics(userId),
      getDealFlow(userId),
      getPortfolioDistribution(userId),
      getRecentDeals(userId)
    ]);

    res.json({
      success: true,
      data: {
        userName: user?.name || 'User',
        metrics,
        dealFlow,
        portfolioDistribution,
        recentDeals
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

// Get dashboard metrics
router.get('/metrics', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const metrics = await getMetrics(userId);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
});

// Get deal flow data
router.get('/deal-flow', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const dealFlow = await getDealFlow(userId);

    res.json({
      success: true,
      data: dealFlow
    });
  } catch (error) {
    logger.error('Error fetching deal flow data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deal flow data' });
  }
});

// Get portfolio distribution
router.get('/portfolio-distribution', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const portfolioDistribution = await getPortfolioDistribution(userId);

    res.json({
      success: true,
      data: portfolioDistribution
    });
  } catch (error) {
    logger.error('Error fetching portfolio distribution:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch portfolio distribution' });
  }
});

// Get recent deals
router.get('/recent-deals', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const recentDeals = await getRecentDeals(userId);

    res.json({
      success: true,
      data: recentDeals
    });
  } catch (error) {
    logger.error('Error fetching recent deals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent deals' });
  }
});

// Helper functions
async function getMetrics(userId: string) {
  const [deals, contacts, communications, documents] = await Promise.all([
    prisma.deal.findMany({ where: { userId } }),
    prisma.contact.findMany({ where: { userId } }),
    prisma.communication.findMany({ where: { userId } }),
    prisma.document.findMany({ where: { userId } })
  ]);

  const activeDeals = deals.filter((deal: Deal) => deal.status === 'active').length;
  const totalPortfolioValue = deals.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0);

  // Get previous month data for comparison
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [prevDeals, prevContacts] = await Promise.all([
    prisma.deal.findMany({
      where: {
        userId,
        createdAt: { lt: lastMonth }
      }
    }),
    prisma.contact.findMany({
      where: {
        userId,
        createdAt: { lt: lastMonth }
      }
    })
  ]);

  const prevActiveDeals = prevDeals.filter((deal: Deal) => deal.status === 'active').length;
  const activeDealsChange = activeDeals - prevActiveDeals;
  const contactsChange = contacts.length - prevContacts.length;

  return {
    totalPortfolioValue: `$${(totalPortfolioValue / 1000000).toFixed(1)}M`,
    totalPortfolioValueChange: '+12.5%', // This would need more complex calculation
    activeDeals,
    activeDealsChange,
    portfolioCompanies: deals.length,
    portfolioCompaniesChange: Math.max(0, deals.length - prevDeals.length),
    totalContacts: contacts.length,
    totalContactsChange: contactsChange
  };
}

async function getDealFlow(userId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const deals = await prisma.deal.findMany({
    where: {
      userId,
      createdAt: { gte: sixMonthsAgo }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group by month
  const monthlyData: { [key: string]: { deals: number; value: number } } = {};

  deals.forEach((deal: Deal) => {
    const month = deal.createdAt.toLocaleDateString('en-US', { month: 'short' });
    if (!monthlyData[month]) {
      monthlyData[month] = { deals: 0, value: 0 };
    }
    monthlyData[month].deals += 1;
    monthlyData[month].value += deal.value || 0;
  });

  // Convert to array format expected by frontend
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    deals: monthlyData[month]?.deals || 0,
    value: Math.round((monthlyData[month]?.value || 0) / 1000000) // Convert to millions
  }));
}

async function getPortfolioDistribution(userId: string) {
  const deals = await prisma.deal.findMany({
    where: { userId },
    select: { sector: true, value: true }
  });

  const sectorTotals: { [key: string]: number } = {};
  let totalValue = 0;

  deals.forEach((deal: { sector: string | null; value: number | null }) => {
    const sector = deal.sector || 'Others';
    const value = deal.value || 0;
    sectorTotals[sector] = (sectorTotals[sector] || 0) + value;
    totalValue += value;
  });

  const colors = ['#5E5CE6', '#7C7AED', '#10B981', '#F59E0B', '#6B7280'];
  let colorIndex = 0;

  return Object.entries(sectorTotals)
    .map(([name, value]) => ({
      name,
      value: Math.round((value / totalValue) * 100),
      color: colors[colorIndex++ % colors.length]
    }))
    .sort((a, b) => b.value - a.value);
}

async function getRecentDeals(userId: string) {
  const deals = await prisma.deal.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      company: true,
      stage: true,
      value: true,
      status: true,
      probability: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return deals.map((deal: { id: string; company: string; stage: string; value: number | null; status: string; probability: number | null; createdAt: Date }) => ({
    id: deal.id,
    company: deal.company,
    stage: deal.stage,
    value: `$${(deal.value || 0) / 1000000}M`,
    status: deal.status,
    progress: deal.probability || 0,
    createdAt: deal.createdAt.toISOString()
  }));
}

export default router;
import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { BrainProvider } from './contexts/BrainContext';
import { AppThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import DealDetail from './pages/DealDetail';
import Companies from './pages/Companies';
import Contacts from './pages/Contacts';
import InvestorRelations from './pages/InvestorRelations';
import Brain from './pages/Brain';
import Reports from './pages/Reports';
import Funds from './pages/Funds';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import OAuthCallback from './pages/OAuthCallback';
import VoiceCalls from './pages/VoiceCalls';
import Investors from './pages/Investors';
import Brokers from './pages/Brokers';
import Scraping from './pages/Scraping';

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrainProvider>
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Routes>
            {/* OAuth callback routes */}
            <Route path="/app/oauth/callback" element={<OAuthCallback />} />
            <Route path="/integrations/success" element={<OAuthCallback />} />
            <Route path="/integrations/error" element={<OAuthCallback />} />

            {/* Main app routes - no authentication required */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/outreach/deals" />} />

              {/* Outreach Routes */}
              <Route path="outreach">
                <Route path="deals" element={<Deals />} />
                <Route path="deals/:id" element={<DealDetail />} />
                <Route path="investors" element={<Investors />} />
                <Route path="brokers" element={<Brokers />} />
              </Route>

              {/* Legacy Deals Routes - redirect to new structure */}
              <Route path="deals">
                <Route path="all" element={<Navigate to="/outreach/deals" />} />
                <Route path="all/:id" element={<Navigate to="/outreach/deals/:id" />} />
              </Route>

              {/* Fundraising Routes */}
              <Route path="fundraising">
                <Route path="limited-partners" element={<InvestorRelations />} />
                <Route path="funds" element={<Funds />} />
              </Route>

              {/* Settings and other routes */}
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="voice-calls" element={<VoiceCalls />} />
              <Route path="scraping" element={<Scraping />} />

              {/* Legacy routes - keeping for backward compatibility */}
              <Route path="dashboard" element={<Navigate to="/outreach/deals" />} />
              <Route path="companies" element={<Navigate to="/outreach/deals" />} />
              <Route path="contacts" element={<Navigate to="/outreach/deals" />} />
              <Route path="investor-relations" element={<Navigate to="/fundraising/limited-partners" />} />
              <Route path="brain" element={<Brain />} />
              <Route path="reports" element={<Navigate to="/fundraising/funds" />} />
              <Route path="deals" element={<Navigate to="/outreach/deals" />} />
              <Route path="deals/relationships" element={<Navigate to="/outreach/deals" />} />
            </Route>
          </Routes>
          </Box>
        </BrainProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;
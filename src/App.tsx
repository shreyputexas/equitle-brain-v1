import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { BrainProvider } from './contexts/BrainContext';
import { AppThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';

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

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrainProvider>
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <ScrollToTop />
          <Routes>
            {/* OAuth callback routes */}
            <Route path="/app/oauth/callback" element={<OAuthCallback />} />
            <Route path="/integrations/success" element={<OAuthCallback />} />
            <Route path="/integrations/error" element={<OAuthCallback />} />

            {/* Main app routes - no authentication required */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/deals/all" />} />

              {/* Deals Routes */}
              <Route path="deals">
                <Route path="all" element={<Deals />} />
                <Route path="all/:id" element={<DealDetail />} />
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

              {/* Legacy routes - keeping for backward compatibility */}
              <Route path="dashboard" element={<Navigate to="/deals/all" />} />
              <Route path="companies" element={<Navigate to="/deals/all" />} />
              <Route path="contacts" element={<Navigate to="/deals/all" />} />
              <Route path="investor-relations" element={<Navigate to="/fundraising/limited-partners" />} />
              <Route path="brain" element={<Brain />} />
              <Route path="reports" element={<Navigate to="/fundraising/funds" />} />
              <Route path="deals" element={<Navigate to="/deals/all" />} />
              <Route path="deals/relationships" element={<Navigate to="/deals/all" />} />
            </Route>
          </Routes>
          </Box>
        </BrainProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;
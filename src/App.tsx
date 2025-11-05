import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { BrainProvider } from './contexts/BrainContext';
import { AppThemeProvider } from './contexts/ThemeContext';
import AppLayout from './components/AppLayout';
import Landing from './pages/Landing';
import Product from './pages/Product';
import Manifesto from './pages/Manifesto';
import Network from './pages/Network';
import ScrollToTop from './components/ScrollToTop';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
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
import MassVoicemail from './pages/MassVoicemail';
import Investors from './pages/Investors';
import Brokers from './pages/Brokers';
import DataEnrichment from './pages/DataEnrichment';
import MyThesis from './pages/MyThesis';

function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <BrainProvider>
          <ScrollToTop />
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Routes>
            {/* Public marketing site */}
            <Route path="/" element={<Landing />} />
            <Route path="/product" element={<Product />} />
            <Route path="/manifesto" element={<Manifesto />} />
            <Route path="/network" element={<Network />} />

            {/* Authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* OAuth callback routes */}
            <Route path="/app/oauth/callback" element={<OAuthCallback />} />
            <Route path="/integrations/success" element={<OAuthCallback />} />
            <Route path="/integrations/error" element={<OAuthCallback />} />

            {/* Protected app routes */}
            <Route element={<AppLayout />}>
              <Route path="/outreach/deals" element={<Deals />} />
              <Route path="/outreach/deals/:id" element={<DealDetail />} />
              <Route path="/outreach/brokers" element={<Brokers />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/voice-calls" element={<VoiceCalls />} />
              <Route path="/mass-voicemail" element={<MassVoicemail />} />
              <Route path="/data-enrichment" element={<DataEnrichment />} />
              <Route path="/my-thesis" element={<MyThesis />} />
              <Route path="/contacts" element={<Contacts />} />
            </Route>

            {/* Legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/outreach/deals" replace />} />
            <Route path="/companies" element={<Navigate to="/outreach/deals" replace />} />
            <Route path="/investor-relations" element={<Navigate to="/fundraising/limited-partners" replace />} />
            <Route path="/reports" element={<Navigate to="/fundraising/funds" replace />} />
            <Route path="/deals" element={<Navigate to="/outreach/deals" replace />} />
            <Route path="/deals/relationships" element={<Navigate to="/outreach/deals" replace />} />

            {/* Fallback: redirect unknown routes to marketing site */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Box>
        </BrainProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

export default App;
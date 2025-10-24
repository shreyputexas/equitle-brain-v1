import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { BrainProvider } from './contexts/BrainContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import Product from './pages/Product';
import Manifesto from './pages/Manifesto';
import Network from './pages/Network';
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

function App() {
  return (
    <AuthProvider>
      <BrainProvider>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/product" element={<Product />} />
            <Route path="/manifesto" element={<Manifesto />} />
            <Route path="/network" element={<Network />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route path="/app" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
              <Route index element={<Navigate to="/app/deals/relationships" />} />
              
              {/* Deals Routes */}
              <Route path="deals">
                <Route path="relationships" element={<Deals />} />
                <Route path="relationships/:id" element={<DealDetail />} />
              </Route>
              
              {/* Fundraising Routes */}
              <Route path="fundraising">
                <Route path="limited-partners" element={<InvestorRelations />} />
                <Route path="funds" element={<Funds />} />
              </Route>
              
              {/* Settings and other routes */}
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              
              {/* Legacy routes - keeping for backward compatibility */}
              <Route path="dashboard" element={<Navigate to="/deals/relationships" />} />
              <Route path="companies" element={<Navigate to="/deals/relationships" />} />
              <Route path="contacts" element={<Navigate to="/deals/relationships" />} />
              <Route path="investor-relations" element={<Navigate to="/fundraising/limited-partners" />} />
              <Route path="brain" element={<Brain />} />
              <Route path="reports" element={<Navigate to="/fundraising/funds" />} />
              <Route path="deals" element={<Navigate to="/deals/relationships" />} />
            </Route>
          </Routes>
        </Box>
      </BrainProvider>
    </AuthProvider>
  );
}

export default App;
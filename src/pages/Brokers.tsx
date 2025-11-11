import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import NewBrokerModal from '../components/NewBrokerModal';
import BrokerOutreach from '../components/BrokerOutreach';
import BrokerPipeline from '../components/BrokerPipeline';
import EditBrokerModal from '../components/EditBrokerModal';
import brokersApi, { Broker } from '../services/brokersApi';
import contactsApi from '../services/contactsApi';

export default function Brokers() {
  const ACCENT_MAROON = '#800020';
  const ACCENT_MAROON_DARK = '#660018';

  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBrokerModalOpen, setNewBrokerModalOpen] = useState(false);
  const [editBrokerModalOpen, setEditBrokerModalOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [brokerContacts, setBrokerContacts] = useState<Record<string, any[]>>({});

  // Load brokers on component mount
  useEffect(() => {
    loadBrokers();
  }, []);

  const loadBrokers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading brokers with contacts and communications...');

      const result = await brokersApi.getBrokers({ include: 'contacts,communications' });
      console.log('📦 Loaded brokers from API:', result);

      // Clear broker contacts state before refreshing
      const newBrokerContacts: Record<string, any[]> = {};

      // Fetch contacts and communications for each broker
      const brokersWithData = await Promise.all(
        result.brokers.map(async (broker) => {
          try {
            // Get contacts for this broker
            const contactsResult = await contactsApi.getContacts();
            const contacts = contactsResult.contacts.filter((c: any) =>
              c.metadata?.brokerId === broker.id
            );

            console.log(`👥 Broker ${broker.name} (${broker.id}) has ${contacts.length} contact(s)`);

            // Map contacts to Person format
            const people = contacts.map((c: any) => ({
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              title: c.title,
              company: c.company,
              linkedinUrl: c.linkedinUrl,
              relationshipScore: c.relationshipScore || 0,
              status: c.status || 'warm',
              isKeyContact: c.isKeyContact || false,
              lastContact: c.lastContact,
              notes: c.notes,
              tags: c.tags
            }));

            // Store contacts by broker ID in new state
            if (contacts.length > 0) {
              newBrokerContacts[broker.id] = people;
            }

            return {
              ...broker,
              people,
              contactCount: contacts.length
            };
          } catch (err) {
            console.error(`Error loading data for broker ${broker.id}:`, err);
            return broker;
          }
        })
      );

      console.log('✅ Brokers loaded with data:', brokersWithData);

      // Update state with fresh data
      setBrokerContacts(newBrokerContacts);
      setBrokers(brokersWithData);
    } catch (err: any) {
      console.error('Error loading brokers:', err);
      setError('Failed to load brokers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Pipeline Banner */}
      <Box sx={{
        position: 'relative',
        bgcolor: 'white',
        borderRadius: '0 0 32px 32px',
        overflow: 'hidden',
        mb: 6,
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)'
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.02) 0%, rgba(234, 88, 12, 0.05) 100%)',
          zIndex: 1,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 20,
            right: 20,
            width: 120,
            height: 120,
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            borderRadius: '50%',
            opacity: 0.15,
            zIndex: 1
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 20,
            left: 20,
            width: 80,
            height: 80,
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            borderRadius: 2,
            opacity: 0.15,
            transform: 'rotate(15deg)',
            zIndex: 1
          }
        }} />

        <Box sx={{ position: 'relative', zIndex: 2, px: 4, py: 6 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: '#1e293b',
                    fontSize: { xs: '2.2rem', md: '3rem' },
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  BROKER OUTREACH
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    mb: 3,
                    color: '#475569',
                    fontSize: '1.1rem',
                    lineHeight: 1.5,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  Track and manage your broker relationships from initial outreach to closing
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#64748b',
                    mb: 4,
                    maxWidth: '600px',
                    lineHeight: 1.6,
                    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  Track your brokers, send tailored emails, and get notified when new responses come in.
                </Typography>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="text"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => setNewBrokerModalOpen(true)}
                    sx={{
                      background: 'transparent',
                      color: '#6b7280',
                      border: 'none',
                      boxShadow: 'none',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      '&:hover': {
                        background: '#f9fafb',
                        color: '#374151',
                        transform: 'translateY(-1px)'
                      },
                      '& .MuiButton-startIcon': {
                        color: '#6b7280'
                      },
                      '&:hover .MuiButton-startIcon': {
                        color: '#374151'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    New Broker
                  </Button>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                <Box sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(249, 115, 22, 0.3)'
                }}>
                  <BusinessIcon sx={{ fontSize: 64, color: 'white' }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Box sx={{ px: 4, mb: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Broker Pipeline */}
      <Box sx={{ px: 4 }}>
        <BrokerPipeline
          brokers={brokers}
          loading={false}
          error={error}
          onRefresh={loadBrokers}
          onEditBroker={(broker) => {
            setSelectedBroker(broker);
            setEditBrokerModalOpen(true);
          }}
          onDeleteBroker={async (brokerId) => {
            try {
              await brokersApi.deleteBroker(brokerId);
              setBrokers(prev => prev.filter(b => b.id !== brokerId));
            } catch (err: any) {
              console.error('Error deleting broker:', err);
              setError('Failed to delete broker');
            }
          }}
        />
      </Box>

      {/* Broker Outreach Section */}
      <BrokerOutreach />

      {/* New Broker Modal */}
      <NewBrokerModal
        open={newBrokerModalOpen}
        onClose={() => setNewBrokerModalOpen(false)}
        onSuccess={async () => {
          console.log('Broker created successfully, closing modal and reloading...');
          setNewBrokerModalOpen(false);
          // Reload brokers immediately to show new broker
          await loadBrokers();
        }}
      />

      {/* Edit Broker Modal */}
      <EditBrokerModal
        open={editBrokerModalOpen}
        broker={selectedBroker}
        onClose={() => {
          setEditBrokerModalOpen(false);
          setSelectedBroker(null);
        }}
        onSuccess={async () => {
          console.log('Broker updated successfully, closing modal and reloading...');
          setEditBrokerModalOpen(false);
          setSelectedBroker(null);
          // Reload brokers immediately to show updated data
          await loadBrokers();
        }}
      />
    </Box>
  );
}

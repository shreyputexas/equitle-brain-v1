import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import NewBrokerModal from '../components/NewBrokerModal';
import LinkedInOutreach from '../components/LinkedInOutreach';
import BrokerPipeline from '../components/BrokerPipeline';
import brokersApi, { Broker } from '../services/brokersApi';
import contactsApi from '../services/contactsApi';

export default function Brokers() {
  const ACCENT_MAROON = '#800020';
  const ACCENT_MAROON_DARK = '#660018';

  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBrokerModalOpen, setNewBrokerModalOpen] = useState(false);
  const [brokerContacts, setBrokerContacts] = useState<Record<string, any[]>>({});

  // Load brokers on component mount
  useEffect(() => {
    loadBrokers();
  }, []);

  const loadBrokers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await brokersApi.getBrokers({ include: 'contacts,communications' });
      console.log('Loaded brokers:', result);

      // Fetch contacts and communications for each broker
      const brokersWithData = await Promise.all(
        result.brokers.map(async (broker) => {
          try {
            // Get contacts for this broker
            const contactsResult = await contactsApi.getContacts();
            const contacts = contactsResult.contacts.filter((c: any) =>
              c.metadata?.brokerId === broker.id
            );

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

            // Store contacts by broker ID
            if (contacts.length > 0) {
              setBrokerContacts(prev => ({ ...prev, [broker.id]: people }));
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
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)',
        color: 'white',
        px: 4,
        py: 3,
        mb: 3
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
              Broker Pipeline
            </Typography>
            <Chip
              label={`${brokers.length} Broker${brokers.length !== 1 ? 's' : ''}`}
              sx={{
                bgcolor: '#f97316',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Track and manage your broker relationships
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewBrokerModalOpen(true)}
              sx={{
                bgcolor: '#f97316',
                color: 'white',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                '&:hover': {
                  bgcolor: '#ea580c',
                  boxShadow: '0 6px 16px rgba(249, 115, 22, 0.4)',
                }
              }}
            >
              Add Broker
            </Button>
          </Box>
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
            // TODO: Implement edit functionality
            console.log('Edit broker:', broker);
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

      {/* LinkedIn Outreach Section */}
      <LinkedInOutreach />

      {/* New Broker Modal */}
      <NewBrokerModal
        open={newBrokerModalOpen}
        onClose={() => setNewBrokerModalOpen(false)}
        onSuccess={async () => {
          console.log('Broker created successfully, closing modal and reloading...');
          setNewBrokerModalOpen(false);
          // Wait a moment for Firestore to update, then reload brokers
          setTimeout(async () => {
            await loadBrokers();
          }, 800);
        }}
      />
    </Box>
  );
}

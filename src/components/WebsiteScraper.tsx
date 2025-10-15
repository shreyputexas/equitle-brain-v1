import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import axios from 'axios';

interface TeamMember {
  name: string;
  title: string;
  bio: string;
}

interface ScrapedData {
  company_name: string;
  url: string;
  founders: TeamMember[];
  team_members: TeamMember[];
  testimonials: Array<{ text: string; author: string }>;
  about: string;
  mission: string;
  contact_info: { email?: string; phone?: string };
  scraped_at: string;
}

export default function WebsiteScraper() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScrapedData | null>(null);

  const handleScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post('http://localhost:4001/api/scraper/scrape', {
        url: url
      });

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to scrape website');
      }
    } catch (err: any) {
      console.error('Scraper error:', err);
      setError(err.response?.data?.error || 'An error occurred while scraping');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ mt: 2, overflow: 'hidden' }}>
      {/* Black Header Section */}
      <Box sx={{ p: 2.5, bgcolor: '#000000', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: 'white', fontSize: '1.125rem' }}>
          Website Research Tool
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Extract company information, team members, and founder details from any website
        </Typography>
      </Box>

      {/* White Content Section */}
      <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="https://www.company.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleScrape()}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'white',
                borderRadius: 1.5
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleScrape}
            disabled={loading || !url}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            sx={{
              bgcolor: '#000000',
              color: 'white',
              minWidth: 120,
              '&:hover': {
                bgcolor: '#333333'
              }
            }}
          >
            {loading ? 'Scraping...' : 'Scrape'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {data && (
          <Box>
            {/* Company Info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BusinessIcon />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {data.company_name}
                </Typography>
              </Box>
              {data.about && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {data.about}
                </Typography>
              )}
              {data.contact_info && (Object.keys(data.contact_info).length > 0) && (
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  {data.contact_info.email && (
                    <Chip label={data.contact_info.email} size="small" variant="outlined" />
                  )}
                  {data.contact_info.phone && (
                    <Chip label={data.contact_info.phone} size="small" variant="outlined" />
                  )}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Founders */}
            {data.founders && data.founders.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Founders & Leadership ({data.founders.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {data.founders.map((founder, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        bgcolor: '#f9f9f9',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {founder.name}
                      </Typography>
                      {founder.title && (
                        <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                          {founder.title}
                        </Typography>
                      )}
                      {founder.bio && (
                        <Typography variant="body2" color="text.secondary">
                          {founder.bio}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Team Members */}
            {data.team_members && data.team_members.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Team Members ({data.team_members.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {data.team_members.map((member, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          bgcolor: '#f9f9f9',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {member.name}
                        </Typography>
                        {member.title && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {member.title}
                          </Typography>
                        )}
                        {member.bio && (
                          <Typography variant="caption" color="text.secondary">
                            {member.bio.substring(0, 150)}
                            {member.bio.length > 150 && '...'}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Testimonials */}
            {data.testimonials && data.testimonials.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChatIcon />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Testimonials ({data.testimonials.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {data.testimonials.map((testimonial, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        bgcolor: '#f9f9f9',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontStyle: 'italic'
                      }}
                    >
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        "{testimonial.text}"
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        — {testimonial.author}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Debug Info */}
            <Box sx={{ mt: 2, p: 1, bgcolor: '#f0f0f0', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Scraped {data.scraped_at} • {data.url}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

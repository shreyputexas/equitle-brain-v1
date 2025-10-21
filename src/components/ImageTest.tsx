import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Card, CardContent } from '@mui/material';

interface ImageTestProps {
  searcherProfiles: Array<{
    id: string;
    name: string;
    title: string;
    headshotUrl: string;
  }>;
}

// BULLETPROOF Helper function to ensure headshot URL is absolute
const getAbsoluteHeadshotUrl = (url: string | undefined): string | undefined => {
  if (!url) {
    console.log('❌ No headshot URL provided');
    return undefined;
  }

  console.log('🔍 Original headshot URL:', url);

  // If URL is already absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ URL is already absolute:', url);
    return url;
  }

  // If URL is relative, prepend the base URL
  const baseUrl = 'http://localhost:4001';
  
  // Ensure URL starts with / if it doesn't already
  let finalUrl = url;
  if (!url.startsWith('/')) {
    finalUrl = `/${url}`;
  }
  
  const absoluteUrl = `${baseUrl}${finalUrl}`;
  console.log('✅ Converted to absolute URL:', absoluteUrl);
  
  return absoluteUrl;
};

export default function ImageTest({ searcherProfiles }: ImageTestProps) {
  const [imageStates, setImageStates] = useState<Record<string, 'loading' | 'success' | 'error'>>({});

  const handleImageLoad = (id: string, url: string) => {
    console.log(`✅ Image loaded successfully for ${id}:`, url);
    setImageStates(prev => ({ ...prev, [id]: 'success' }));
  };

  const handleImageError = (id: string, url: string) => {
    console.log(`❌ Image failed to load for ${id}:`, url);
    setImageStates(prev => ({ ...prev, [id]: 'error' }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Image Test Component
      </Typography>
      
      {searcherProfiles.map((searcher) => {
        const absoluteUrl = getAbsoluteHeadshotUrl(searcher.headshotUrl);
        const imageState = imageStates[searcher.id] || 'loading';
        
        return (
          <Card key={searcher.id} sx={{ mb: 2, p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {searcher.name} - {searcher.title}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Original URL:</strong> {searcher.headshotUrl}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Absolute URL:</strong> {absoluteUrl}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Status:</strong> 
                <span style={{ 
                  color: imageState === 'success' ? 'green' : 
                         imageState === 'error' ? 'red' : 'orange',
                  fontWeight: 'bold',
                  marginLeft: '8px'
                }}>
                  {imageState.toUpperCase()}
                </span>
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {/* Method 1: Avatar */}
                <Box>
                  <Typography variant="body2" gutterBottom>Method 1: Avatar</Typography>
                  <Avatar
                    src={absoluteUrl}
                    sx={{ width: 80, height: 80 }}
                    onLoad={() => handleImageLoad(searcher.id, absoluteUrl || '')}
                    onError={() => handleImageError(searcher.id, absoluteUrl || '')}
                  >
                    {searcher.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
                
                {/* Method 2: Direct img */}
                <Box>
                  <Typography variant="body2" gutterBottom>Method 2: Direct img</Typography>
                  <img
                    src={absoluteUrl}
                    alt={`${searcher.name} headshot`}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #ccc'
                    }}
                    onLoad={() => handleImageLoad(searcher.id, absoluteUrl || '')}
                    onError={() => handleImageError(searcher.id, absoluteUrl || '')}
                  />
                </Box>
                
                {/* Method 3: Background image */}
                <Box>
                  <Typography variant="body2" gutterBottom>Method 3: Background</Typography>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundImage: `url(${absoluteUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '2px solid #ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.5rem'
                    }}
                  >
                    {searcher.name.charAt(0).toUpperCase()}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

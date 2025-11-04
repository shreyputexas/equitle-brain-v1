import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Crop as CropIcon
} from '@mui/icons-material';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface HeadshotCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropFinish: (croppedImageBlob: Blob) => void;
  searcherName: string;
}

export const HeadshotCropper: React.FC<HeadshotCropperProps> = ({
  open,
  onClose,
  imageSrc,
  onCropFinish,
  searcherName
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Set initial crop to center square
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // 1:1 aspect ratio
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(crop);
  }, []);

  const onCropChange = useCallback((crop: Crop) => {
    setCrop(crop);
  }, []);

  const onCropComplete = useCallback((crop: Crop, percentCrop: Crop) => {
    setCompletedCrop(convertToPixelCrop(crop, imgRef.current?.naturalWidth || 0, imgRef.current?.naturalHeight || 0));
  }, []);

  const handleCropImage = async () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      // Set canvas size to 300x300
      canvas.width = 300;
      canvas.height = 300;

      // Draw the cropped image scaled to 300x300
      ctx.drawImage(
        imgRef.current,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        300,
        300
      );

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropFinish(blob);
          setIsProcessing(false);
          onClose();
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CropIcon color="primary" />
          <Typography variant="h6">
            Crop Headshot for {searcherName}
          </Typography>
        </Box>
        <IconButton 
          onClick={handleClose} 
          disabled={isProcessing}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Drag to adjust the crop area. The image will be resized to 300x300 pixels.
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          maxHeight: '400px',
          overflow: 'hidden'
        }}>
          <ReactCrop
            crop={crop}
            onChange={onCropChange}
            onComplete={onCropComplete}
            aspect={1}
            minWidth={100}
            minHeight={100}
          >
            <img
              ref={imgRef}
              alt="Crop preview"
              src={imageSrc}
              style={{ maxHeight: '400px', maxWidth: '100%' }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </Box>
        
        {/* Hidden canvas for processing */}
        <canvas
          ref={previewCanvasRef}
          style={{ display: 'none' }}
        />
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button 
          onClick={handleClose}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCropImage}
          variant="contained"
          disabled={!completedCrop || isProcessing}
          startIcon={isProcessing ? <CircularProgress size={16} /> : <CropIcon />}
        >
          {isProcessing ? 'Processing...' : 'Crop & Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

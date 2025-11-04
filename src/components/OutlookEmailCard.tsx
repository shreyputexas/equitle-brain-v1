import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface EmailCategory {
  category: 'deal' | 'investor' | 'broker' | 'general';
  confidence: number;
  extractedData: {
    companyName?: string;
    dealValue?: number;
    dealStage?: string;
    investorName?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    priority?: 'high' | 'medium' | 'low';
  };
}

interface OutlookEmail {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  body: {
    content: string;
    contentType: string;
  };
  importance?: 'low' | 'normal' | 'high';
  categories?: string[];
  categorization?: EmailCategory;
}

interface OutlookEmailCardProps {
  email: OutlookEmail;
  onReply?: (email: OutlookEmail) => void;
  onForward?: (email: OutlookEmail) => void;
  onMarkAsRead?: (emailId: string) => void;
  onStar?: (emailId: string) => void;
  onDelete?: (emailId: string) => void;
  onCreateDeal?: (email: OutlookEmail) => void;
}

export default function OutlookEmailCard({
  email,
  onReply,
  onForward,
  onMarkAsRead,
  onStar,
  onDelete,
  onCreateDeal
}: OutlookEmailCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePreview = () => {
    setPreviewOpen(true);
    handleMenuClose();
  };

  const handleReply = () => {
    onReply?.(email);
    handleMenuClose();
  };

  const handleForward = () => {
    onForward?.(email);
    handleMenuClose();
  };

  const handleMarkAsRead = () => {
    onMarkAsRead?.(email.id);
    handleMenuClose();
  };

  const handleStar = () => {
    onStar?.(email.id);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.(email.id);
    handleMenuClose();
  };

  const handleCreateDeal = () => {
    onCreateDeal?.(email);
    handleMenuClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case 'high': return '#f44336';
      case 'low': return '#9e9e9e';
      default: return '#1976d2';
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const getEmailPreview = (content: string, contentType: string) => {
    if (contentType === 'html') {
      const textContent = stripHtml(content);
      return textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent;
    }
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2, 
          border: email.isRead ? '1px solid #e0e0e0' : '2px solid #1976d2',
          backgroundColor: email.isRead ? 'background.paper' : '#f3f8ff',
          '&:hover': {
            boxShadow: 2,
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: getImportanceColor(email.importance),
                mr: 2,
                width: 40,
                height: 40
              }}
            >
              {getInitials(email.from.emailAddress.name)}
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: email.isRead ? 400 : 600,
                    color: 'text.primary',
                    mr: 1
                  }}
                >
                  {email.from.emailAddress.name}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ ml: 'auto' }}
                >
                  {formatDate(email.receivedDateTime)}
                </Typography>
              </Box>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: email.isRead ? 400 : 600,
                  color: 'text.primary',
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {email.subject || '(No Subject)'}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {getEmailPreview(email.body.content, email.body.contentType)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {email.hasAttachments && (
              <Chip
                icon={<AttachFileIcon />}
                label="Attachment"
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
            
            {email.importance === 'high' && (
              <Chip
                label="High Priority"
                size="small"
                color="error"
                variant="filled"
              />
            )}
            
            {email.categories && email.categories.length > 0 && (
              <Chip
                label={email.categories[0]}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}

            {/* Categorization chips */}
            {email.categorization && (
              <>
                <Chip
                  label={email.categorization.category.toUpperCase()}
                  size="small"
                  variant="filled"
                  color={email.categorization.category === 'deal' ? 'success' : 
                         email.categorization.category === 'investor' ? 'info' :
                         email.categorization.category === 'broker' ? 'warning' : 'default'}
                />
                
                {email.categorization.extractedData.companyName && (
                  <Chip
                    label={email.categorization.extractedData.companyName}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
                
                {email.categorization.extractedData.dealValue && (
                  <Chip
                    label={`$${(email.categorization.extractedData.dealValue / 1000000).toFixed(1)}M`}
                    size="small"
                    variant="outlined"
                    color="success"
                  />
                )}
                
                {email.categorization.extractedData.sentiment && (
                  <Chip
                    label={email.categorization.extractedData.sentiment}
                    size="small"
                    variant="outlined"
                    color={email.categorization.extractedData.sentiment === 'positive' ? 'success' :
                           email.categorization.extractedData.sentiment === 'negative' ? 'error' : 'default'}
                  />
                )}
              </>
            )}
          </Box>
        </CardContent>

        <CardActions sx={{ pt: 0, px: 2, pb: 2, gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={handlePreview}
            variant="outlined"
            sx={{ flex: 1, minWidth: 'fit-content' }}
          >
            View
          </Button>
          
          <Button
            size="small"
            startIcon={<BusinessIcon />}
            onClick={handleCreateDeal}
            color="primary"
            variant="contained"
            sx={{ flex: 1, minWidth: 'fit-content' }}
          >
            Make Deal
          </Button>
          
          <Button
            size="small"
            endIcon={<MoreVertIcon />}
            onClick={handleMenuOpen}
            variant="outlined"
            sx={{ flex: 1, minWidth: 'fit-content' }}
          >
            More Actions
          </Button>
        </CardActions>
      </Card>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleReply}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleForward}>
          <ListItemIcon>
            <ForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Forward</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMarkAsRead}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{email.isRead ? 'Mark as Unread' : 'Mark as Read'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleStar}>
          <ListItemIcon>
            {email.categories?.includes('starred') ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{email.categories?.includes('starred') ? 'Remove Star' : 'Add Star'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Email Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon />
            <Typography variant="h6">{email.subject || '(No Subject)'}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>From:</strong> {email.from.emailAddress.name} ({email.from.emailAddress.address})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Received:</strong> {new Date(email.receivedDateTime).toLocaleString()}
            </Typography>
            {email.hasAttachments && (
              <Typography variant="body2" color="text.secondary">
                <strong>Attachments:</strong> Yes
              </Typography>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              maxHeight: 400,
              overflow: 'auto',
              '& img': { maxWidth: '100%', height: 'auto' }
            }}
            dangerouslySetInnerHTML={{
              __html: email.body.contentType === 'html' ? email.body.content : email.body.content
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button onClick={handleReply} variant="contained" startIcon={<ReplyIcon />}>
            Reply
          </Button>
          <Button onClick={handleCreateDeal} variant="outlined" startIcon={<BusinessIcon />}>
            Create Deal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

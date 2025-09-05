import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as BrainIcon,
  Lightbulb as LightbulbIcon,
  Description as DocumentIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AttachMoney as DealIcon,
  AutoAwesome as AutoAwesomeIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useBrain } from '../contexts/BrainContext';

const suggestedQuestions = [
  "What are our top performing portfolio companies this quarter?",
  "Show me all deals in the healthcare sector above $10M",
  "What's the status of the TechCorp acquisition?",
  "Generate a quarterly investor report",
  "Find contacts at Fortune 500 companies",
  "What are the key risks in our current pipeline?"
];

interface Message {
  id: string;
  type: 'user' | 'brain';
  content: string;
  timestamp: Date;
  context?: any[];
  isTyping?: boolean;
}

export default function Brain() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { askBrain, isProcessing, getSuggestions } = useBrain();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: '0',
      type: 'brain',
      content: "Hello! I'm Brain, your AI-powered intelligence assistant. I can help you with deal insights, company information, investor relations, and much more. What would you like to know?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askBrain(input);
      
      const brainMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'brain',
        content: response.response,
        timestamp: new Date(),
        context: response.context
      };

      setMessages(prev => [...prev, brainMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'brain',
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getIconForContext = (type: string) => {
    switch (type) {
      case 'deal': return <DealIcon />;
      case 'company': return <BusinessIcon />;
      case 'contact': return <PersonIcon />;
      case 'document': return <DocumentIcon />;
      default: return <LightbulbIcon />;
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Brain Intelligence Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ask anything about your deals, portfolio, and market insights
        </Typography>
      </Box>

      {messages.length === 1 && (
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)' }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
            Suggested Questions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestedQuestions.map((question, index) => (
              <Chip
                key={index}
                label={question}
                onClick={() => handleSuggestedQuestion(question)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'white'
                  }
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      <Paper sx={{ flex: 1, p: 3, overflow: 'auto', mb: 3 }}>
        <List>
          {messages.map((message, index) => (
            <Fade in key={message.id}>
              <ListItem
                sx={{
                  flexDirection: 'column',
                  alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                  py: 2
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    maxWidth: '80%',
                    flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.type === 'user' ? 'secondary.main' : 'primary.main',
                      mx: 1
                    }}
                  >
                    {message.type === 'user' ? 'U' : <BrainIcon />}
                  </Avatar>
                  <Card
                    sx={{
                      bgcolor: message.type === 'user' ? 'background.paper' : 'background.default',
                      border: '1px solid',
                      borderColor: message.type === 'user' ? 'secondary.main' : 'primary.main',
                      borderRadius: 2
                    }}
                  >
                    <CardContent>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      {message.context && message.context.length > 0 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Related Context:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {message.context.slice(0, 5).map((item, idx) => (
                              <Chip
                                key={idx}
                                size="small"
                                icon={getIconForContext(item.type)}
                                label={item.title}
                                variant="outlined"
                                sx={{ borderColor: 'primary.main' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {message.type === 'brain' && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Tooltip title="Copy response">
                            <IconButton size="small">
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Helpful">
                            <IconButton size="small">
                              <ThumbUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Not helpful">
                            <IconButton size="small">
                              <ThumbDownIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Regenerate">
                            <IconButton size="small">
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, mx: 6 }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </ListItem>
            </Fade>
          ))}
          {isTyping && (
            <ListItem sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <BrainIcon />
                </Avatar>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CircularProgress size={8} />
                  <CircularProgress size={8} sx={{ animationDelay: '0.2s' }} />
                  <CircularProgress size={8} sx={{ animationDelay: '0.4s' }} />
                </Box>
              </Box>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask Brain anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            sx={{
              ml: 2,
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              '&:disabled': {
                bgcolor: 'action.disabled'
              }
            }}
          >
            {isProcessing ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  InputBase,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  Mic as MicIcon,
  Close as CloseIcon,
  Stop as StopIcon,
  Send as SendIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useBrain } from '../contexts/BrainContext';
import ProfessionalNavbar from './ProfessionalNavbar';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}


export default function Layout() {
  const theme = useTheme();
  const [brainChatOpen, setBrainChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickLookupOpen, setQuickLookupOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { askBrain } = useBrain();

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Quick lookup functionality - search for documents, emails, transcripts, etc.
      console.log('Quick lookup search:', searchQuery);
      // TODO: Implement quick lookup search functionality
      setSearchQuery('');
    }
  };

  const handleBrainChatToggle = () => {
    if (!brainChatOpen) {
      // Opening - start recording immediately
      setBrainChatOpen(true);
      setShowChatbot(false);
      setTranscript('');
      setMessages([]);
      // Start recording after a brief delay to allow UI to render
      setTimeout(() => {
        startRecording();
      }, 100);
    } else {
      // Closing - stop recording and reset
      if (isRecording) {
        stopRecording();
      }
      setBrainChatOpen(false);
      setShowChatbot(false);
      setTranscript('');
      setMessages([]);
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          setIsTranscribing(false);
        } else if (interimTranscript) {
          setTranscript(prev => {
            // Remove any previous interim text and add new interim text
            const withoutInterim = prev.replace(/[^.!?]*$/, '');
            return withoutInterim + interimTranscript;
          });
          setIsTranscribing(true);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsTranscribing(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setIsTranscribing(false);
      };
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsRecording(true);
      setIsTranscribing(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(false);
      
      // Auto-process the transcript after a brief delay
      setTimeout(() => {
        if (transcript.trim()) {
          handleSendMessage();
        }
      }, 500);
    }
  };

  const handleSendMessage = () => {
    if (transcript.trim()) {
      // Clean the transcript to remove the repetitive prefix
      const cleanTranscript = transcript
        .replace(/^what's the update with sarah johnson from tech corp inc\s*/gi, '')
        .replace(/^what's the update with sarah johnson from tech corp inc\s*/gi, '')
        .trim();
      
      const newMessage = {
        id: Date.now().toString(),
        text: cleanTranscript || "What's the update with Sarah Johnson from Tech Corp Inc?",
        isUser: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setIsProcessing(true);
      setTranscript(''); // Clear transcript immediately when processing starts
      
      // Simulate AI response with voice
      setTimeout(() => {
        const aiResponseText = "Here's the update on Tech Corp Inc with Sarah Johnson: The NDA was signed by Sarah Johnson on March 15th, 2024. The technical due diligence is scheduled for next week, and we're waiting for their financial statements. Sarah mentioned they're looking to close the Series A round by end of Q2. Next steps are to schedule the technical due diligence meeting and review their cap table.";
        
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          isUser: false,
          timestamp: new Date(),
          sources: [
            { type: 'call', title: 'Call transcription - March 14, 2024', description: 'Initial discussion with Sarah Johnson' },
            { type: 'email', title: 'Email thread from March 12, 2024', description: 'NDA negotiation and signing' },
            { type: 'document', title: 'Due diligence checklist', description: 'Technical review requirements' },
            { type: 'meeting', title: 'Meeting notes - March 10, 2024', description: 'Series A timeline discussion' }
          ]
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsProcessing(false);
        
        // Show chatbot interface after processing
        setShowChatbot(true);
      }, 2000);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Professional Navigation Bar */}
      <ProfessionalNavbar onSidebarCollapsedChange={setSidebarCollapsed} />
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: { xs: 8, md: 0 }, // Account for mobile app bar
          ml: { xs: 0, md: sidebarCollapsed ? '80px' : '280px' }, // Dynamic sidebar width
          bgcolor: 'background.default',
          minHeight: '100vh',
          width: { xs: '100%', md: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)' }, // Dynamic width calculation
          transition: 'all 0.2s ease-in-out' // Smooth transition when sidebar collapses
        }}
      >
        <Outlet />
      </Box>

      {/* Voice assistant button removed */}
    </Box>
  );
}
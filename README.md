# Equitle Brain - Enterprise Deal Intelligence Platform

A modern, AI-powered deal management and investor relations platform for private equity firms, built with React, TypeScript, Node.js, and Material-UI.

## 🚀 Features

### Core Functionality
- **Dashboard**: Comprehensive overview of portfolio performance, deal pipeline, and key metrics
- **Deal Management**: Track deals through every stage from initial review to closing
- **AI Brain**: Intelligent knowledge base with natural language querying
- **Investor Relations**: Manage LP communications, reporting, and engagement
- **Portfolio Companies**: Track and manage your portfolio company information
- **Contacts**: Centralized contact management and relationship tracking
- **Reports & Analytics**: Generate insights and performance reports

### AI-Powered Features
- **Smart Search**: Natural language queries across your entire data ecosystem
- **Deal Insights**: AI-generated analysis and recommendations for deals
- **Risk Assessment**: Automated risk analysis and portfolio insights
- **Market Intelligence**: AI-powered market trends and competitive analysis

### Enterprise Features
- **Role-Based Access Control**: Admin, Manager, Analyst, and Viewer roles
- **Real-time Collaboration**: Live updates and team collaboration
- **Advanced Security**: JWT authentication, rate limiting, and data encryption
- **Scalable Architecture**: Microservices-ready with TypeScript throughout

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for modern, professional UI components
- **React Router** for navigation
- **Recharts** for data visualization
- **Axios** for API communication
- **Date-fns** for date manipulation

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **JWT** for authentication
- **Winston** for logging
- **Socket.io** for real-time features
- **bcrypt** for password hashing

### AI Integration (Ready for Production)
- **OpenAI GPT** integration ready
- **LangChain** for AI orchestration
- **Pinecone** for vector database
- **PDF processing** for document analysis

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL (for production)
- Redis (for caching and sessions)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd equitle-brain
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts both frontend (port 3000) and backend (port 5000) concurrently.

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Demo Credentials
- **Email:** demo@equitle.com
- **Password:** demo123

## 📋 Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:client` - Start only the frontend
- `npm run dev:server` - Start only the backend
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## 🏗 Project Structure

```
equitle-brain/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts (Auth, Brain)
│   ├── services/          # API services
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic services
│   │   ├── utils/         # Server utilities
│   │   └── types/         # Backend type definitions
│   └── tsconfig.json      # Backend TypeScript config
├── public/                # Static assets
└── docs/                  # Documentation
```

## 🔐 Authentication & Authorization

The platform implements JWT-based authentication with role-based access control:

- **Admin**: Full system access
- **Manager**: Deal and portfolio management
- **Analyst**: Read/write access to deals and companies
- **Viewer**: Read-only access

## 🧠 AI Brain Features

The AI Brain is designed to be your intelligent assistant for:

- **Portfolio Analysis**: \"What are our top performing companies this quarter?\"
- **Deal Intelligence**: \"Show me all healthcare deals above $10M\"
- **Risk Assessment**: \"What are the key risks in our current pipeline?\"
- **Market Insights**: \"Generate competitive analysis for TechCorp\"
- **Investor Relations**: \"Create quarterly LP update\"

## 🚀 Production Deployment

### Environment Variables
Set up the following environment variables for production:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-production-secret
OPENAI_API_KEY=your-openai-key
```

### Build and Deploy
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@equitle.com or create an issue in the repository.

---

Built with ❤️ for the private equity industry
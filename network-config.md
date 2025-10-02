# Network Configuration for Voice Calling

## Environment Variables for External Access

Create a `.env` file in your project root with these variables:

```bash
# Server Configuration
PORT=4001
NODE_ENV=development

# API URLs - Update these for external access
VITE_API_URL=http://YOUR_IP:4001
BACKEND_URL=http://YOUR_IP:4001
FRONTEND_URL=http://YOUR_IP:3001

# Allow external origins (comma-separated)
ALLOWED_ORIGINS=http://YOUR_IP:3001,http://YOUR_IP:3000,http://localhost:3001

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Retell Configuration
RETELL_API_KEY=your-retell-api-key
RETELL_AGENT_ID=your-agent-id
RETELL_PHONE_NUMBER=your-phone-number

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

## Quick Fix for Your Coding Partner

1. **Find your machine's IP address:**
   ```bash
   # On macOS/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On Windows:
   ipconfig
   ```

2. **Update the environment variables:**
   - Replace `YOUR_IP` with your actual IP address
   - Make sure your firewall allows connections on ports 3001 and 4001

3. **Start the server with external access:**
   ```bash
   # Make sure to bind to all interfaces
   npm run dev:server -- --host 0.0.0.0
   ```

4. **For your coding partner:**
   - They should access the app at `http://YOUR_IP:3001`
   - The API will be at `http://YOUR_IP:4001`

## Alternative: Use ngrok for External Access

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Expose your local server:**
   ```bash
   # Terminal 1: Start your server
   npm run dev
   
   # Terminal 2: Expose frontend
   ngrok http 3001
   
   # Terminal 3: Expose backend
   ngrok http 4001
   ```

3. **Update environment variables with ngrok URLs:**
   ```bash
   VITE_API_URL=https://your-backend-ngrok-url.ngrok.io
   BACKEND_URL=https://your-backend-ngrok-url.ngrok.io
   ALLOWED_ORIGINS=https://your-frontend-ngrok-url.ngrok.io
   ```

## Troubleshooting Steps

1. **Check if ports are accessible:**
   ```bash
   # Test if your partner can reach your server
   curl http://YOUR_IP:4001/health
   ```

2. **Check firewall settings:**
   ```bash
   # macOS: Allow incoming connections
   sudo pfctl -f /etc/pf.conf
   
   # Or temporarily disable firewall for testing
   sudo pfctl -d
   ```

3. **Verify CORS is working:**
   - Check browser console for CORS errors
   - Look for "Access-Control-Allow-Origin" headers in network tab

4. **Test WebSocket connection:**
   - Open browser dev tools
   - Check if Socket.IO connection is established
   - Look for WebSocket errors in console

# Development Environment Guide

This guide helps you maintain a stable development environment and troubleshoot common issues.

## Quick Commands

### When Things Break
```bash
# Nuclear option - full environment reset
npm run fresh-start

# Light cleanup - just caches
npm run clean

# Reset and restart dev servers
npm run dev:reset
```

### Manual Reset
```bash
# Run the reset script manually
./scripts/dev-reset.sh
```

## Common Issues & Solutions

### 1. White Screen / Port Issues
**Symptoms:** Dev server shows white screen, wrong port numbers (3000-3002 instead of expected ports)

**Causes:**
- Stale Vite cache
- Port conflicts from previous sessions
- Process hanging in background

**Solution:**
```bash
npm run clean && npm run dev
# or
npm run fresh-start
```

### 2. "Component Missing" Errors
**Symptoms:** Previously working components suddenly missing, navigation broken

**Causes:**
- Cache corruption
- Hot reload issues
- TypeScript build cache problems

**Solution:**
```bash
npm run clean
# Then restart your dev servers
npm run dev
```

### 3. Dependencies Issues
**Symptoms:** Module not found errors, weird import issues

**Solution:**
```bash
npm run fresh-start
# This will reinstall node_modules
```

### 4. Firebase/Webhook Issues
**Symptoms:** Zapier webhooks failing, "connection refused" errors

**Check:**
1. Is the server running? (`npm run dev:server`)
2. Is localtunnel running? (`lt --port 4001 --subdomain equitle-webhook-v2`)
3. Check server logs for errors

## Development Workflow

### Starting Development
```bash
# Start all services
npm run dev

# Or start individually:
npm run dev:client    # Frontend (Vite)
npm run dev:server    # Backend (Express)
```

### Before Taking Breaks
- Kill all dev processes (`Ctrl+C` in terminals)
- Close terminal windows to prevent orphaned processes

### After Coming Back
If things aren't working:
1. Try `npm run dev` first
2. If issues persist, run `npm run clean && npm run dev`
3. For serious issues, use `npm run fresh-start`

## Environment Details

### Ports
- **3000+**: Vite dev server (auto-assigned)
- **4000**: Express server default
- **4001**: Express server (current config)
- **9099**: Firebase Auth emulator
- **8080**: Firebase Firestore emulator

### Cache Locations
- `.vite/` - Vite build cache
- `node_modules/.cache/` - Various tool caches
- `dist/` - Build outputs
- `*.tsbuildinfo` - TypeScript incremental build info

### Scripts Explained
- `npm run clean` - Removes cache directories only
- `npm run fresh-start` - Full reset including dependencies
- `npm run dev:reset` - Reset + restart dev servers
- `./scripts/dev-reset.sh` - Interactive reset script

## Troubleshooting Checklist

When development environment is broken:

1. **Kill all processes**
   ```bash
   # Kill any hanging Node processes
   pkill -f "node.*vite"
   pkill -f "node.*nodemon"
   ```

2. **Clear caches**
   ```bash
   npm run clean
   ```

3. **Check ports**
   ```bash
   lsof -ti:3000  # Check if port 3000 is in use
   lsof -ti:4001  # Check if port 4001 is in use
   ```

4. **Restart fresh**
   ```bash
   npm run dev
   ```

5. **If still broken**
   ```bash
   npm run fresh-start
   ```

## Prevention Tips

1. **Always use `Ctrl+C`** to stop dev servers (don't just close terminals)
2. **Use provided scripts** instead of manual cache clearing
3. **Keep dependencies updated** regularly
4. **Don't commit cache files** (they're in .gitignore)
5. **Use the reset script** when in doubt

## Environment Variables

Make sure you have:
- `.env` file with required variables
- Firebase config properly set up
- Localtunnel installed globally: `npm install -g localtunnel`

## Getting Help

If you're still having issues after trying the reset script:
1. Check if ports are properly freed
2. Verify environment variables
3. Check for global dependency conflicts
4. Consider restarting your computer (for stubborn port conflicts)
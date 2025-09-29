#!/bin/bash

# Development Environment Reset Script
# This script provides a "nuclear option" to reset the development environment
# to a clean state when things get broken after periods of inactivity.

set -e  # Exit on any error

echo "🔥 Development Environment Reset Script"
echo "======================================="
echo ""

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    echo "🔍 Checking for processes on port $port..."

    # Find and kill processes using the port
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        echo "💀 Killing process $pid on port $port"
        kill -9 $pid 2>/dev/null || true
    else
        echo "✅ Port $port is free"
    fi
}

# Function to clean cache directories
clean_caches() {
    echo ""
    echo "🧹 Cleaning cache directories..."

    # Vite cache
    if [ -d ".vite" ]; then
        echo "🗑️  Removing .vite cache..."
        rm -rf .vite
    fi

    # Node modules cache
    if [ -d "node_modules/.cache" ]; then
        echo "🗑️  Removing node_modules/.cache..."
        rm -rf node_modules/.cache
    fi

    # Server node modules cache
    if [ -d "server/node_modules/.cache" ]; then
        echo "🗑️  Removing server/node_modules/.cache..."
        rm -rf server/node_modules/.cache
    fi

    # Dist directories
    if [ -d "dist" ]; then
        echo "🗑️  Removing dist directory..."
        rm -rf dist
    fi

    if [ -d "server/dist" ]; then
        echo "🗑️  Removing server/dist directory..."
        rm -rf server/dist
    fi

    # TypeScript build info
    if [ -f "tsconfig.tsbuildinfo" ]; then
        echo "🗑️  Removing TypeScript build info..."
        rm -f tsconfig.tsbuildinfo
    fi

    if [ -f "server/tsconfig.tsbuildinfo" ]; then
        echo "🗑️  Removing server TypeScript build info..."
        rm -f server/tsconfig.tsbuildinfo
    fi

    echo "✅ Cache cleanup complete"
}

# Function to kill all development processes
kill_dev_processes() {
    echo ""
    echo "💀 Killing development processes..."

    # Kill common development ports
    kill_port 3000  # Vite dev server
    kill_port 3001  # Alternative Vite port
    kill_port 3002  # Alternative Vite port
    kill_port 3003  # Alternative Vite port
    kill_port 4000  # Express server
    kill_port 4001  # Express server alternative
    kill_port 5173  # Vite default port
    kill_port 5174  # Vite alternative port

    # Kill any remaining Node processes that might be hanging
    echo "🔍 Killing any remaining Node/npm processes..."
    pkill -f "node.*vite" 2>/dev/null || true
    pkill -f "node.*nodemon" 2>/dev/null || true
    pkill -f "node.*ts-node" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true

    echo "✅ Process cleanup complete"
}

# Function to reinstall dependencies (optional)
reinstall_deps() {
    echo ""
    read -p "🤔 Do you want to reinstall node_modules? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Reinstalling dependencies..."

        # Remove node_modules
        if [ -d "node_modules" ]; then
            echo "🗑️  Removing root node_modules..."
            rm -rf node_modules
        fi

        if [ -d "server/node_modules" ]; then
            echo "🗑️  Removing server node_modules..."
            rm -rf server/node_modules
        fi

        # Remove package-lock files
        if [ -f "package-lock.json" ]; then
            echo "🗑️  Removing package-lock.json..."
            rm -f package-lock.json
        fi

        if [ -f "server/package-lock.json" ]; then
            echo "🗑️  Removing server/package-lock.json..."
            rm -f server/package-lock.json
        fi

        # Fresh install
        echo "📥 Installing root dependencies..."
        npm install

        echo "📥 Installing server dependencies..."
        cd server && npm install && cd ..

        echo "✅ Dependencies reinstalled"
    else
        echo "⏭️  Skipping dependency reinstall"
    fi
}

# Main execution
echo "This script will:"
echo "  1. Kill all development processes on common ports"
echo "  2. Clean all cache directories"
echo "  3. Optionally reinstall node_modules"
echo ""
read -p "🚀 Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted by user"
    exit 1
fi

# Execute cleanup steps
kill_dev_processes
clean_caches
reinstall_deps

echo ""
echo "🎉 Development environment reset complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the development servers"
echo "  2. If issues persist, try running this script with dependency reinstall"
echo ""
echo "💡 Tip: You can also run individual cleanup commands:"
echo "   npm run clean      - Clean caches only"
echo "   npm run fresh-start - Full reset including dependencies"
#!/bin/bash

# Script to switch between Firebase emulator and cloud modes

if [ "$1" = "cloud" ]; then
    echo "🔄 Switching to Firebase Cloud mode..."

    # Update .env file
    sed -i '' 's/FIREBASE_USE_EMULATORS=true/FIREBASE_USE_EMULATORS=false/' .env
    sed -i '' 's/VITE_FIREBASE_USE_EMULATORS=true/VITE_FIREBASE_USE_EMULATORS=false/' .env

    echo "✅ Switched to Firebase Cloud mode"
    echo "📝 Make sure you have:"
    echo "   - Added FIREBASE_SERVICE_ACCOUNT_KEY to .env"
    echo "   - Updated VITE_FIREBASE_* values with real config"
    echo "   - Deployed security rules: firebase deploy --only firestore:rules,storage"

elif [ "$1" = "emulator" ]; then
    echo "🔄 Switching to Firebase Emulator mode..."

    # Update .env file
    sed -i '' 's/FIREBASE_USE_EMULATORS=false/FIREBASE_USE_EMULATORS=true/' .env
    sed -i '' 's/VITE_FIREBASE_USE_EMULATORS=false/VITE_FIREBASE_USE_EMULATORS=true/' .env

    echo "✅ Switched to Firebase Emulator mode"
    echo "🚀 Start emulators with: firebase emulators:start"

else
    echo "Usage: $0 [cloud|emulator]"
    echo ""
    echo "Current mode:"
    if grep -q "FIREBASE_USE_EMULATORS=true" .env; then
        echo "📱 Emulator mode"
    else
        echo "☁️  Cloud mode"
    fi
fi
#!/bin/bash
echo "🟢 Running full clean build for VirtualMix STT..."

# Usuwamy ewentualne pozostałości po starych buildach
rm -rf node_modules
rm -f package-lock.json

# Instalujemy tylko potrzebne pakiety
npm install form-data

echo "✅ Dependencies installed."

#!/bin/bash

echo "🚀 Starting Split-Bill Platform Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.template .env
    echo "⚠️  Please edit .env file with your actual API keys and credentials"
    echo "   - Briq SMS API credentials"
    echo "   - Africa's Talking USSD credentials"
    echo "   - Database connection string"
    echo ""
    read -p "Press Enter after you've configured .env file..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start database
echo "🗄️  Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check database health
if docker-compose ps postgres | grep -q "healthy"; then
    echo "✅ Database is ready!"
else
    echo "❌ Database is not ready. Please check Docker logs:"
    echo "   docker-compose logs postgres"
    exit 1
fi

# Generate and run migrations
echo "🔄 Setting up database schema..."
npm run db:generate
npm run db:migrate

echo "🎉 Setup complete! You can now start the development server:"
echo "   npm run dev"
echo ""
echo "📱 Test the USSD flow with:"
echo "   node test-ussd-flow.js"
echo ""
echo "🔍 Check API health at:"
echo "   http://localhost:3000/health"

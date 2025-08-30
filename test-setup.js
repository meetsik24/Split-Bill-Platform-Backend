#!/usr/bin/env node

/**
 * Simple test script to verify project setup
 * Run with: node test-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Split-Bill Platform Setup...\n');

// Check if package.json exists
if (fs.existsSync('package.json')) {
  console.log('✅ package.json found');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ Project name: ${packageJson.name}`);
    console.log(`✅ Version: ${packageJson.version}`);
  } catch (error) {
    console.log('❌ Error reading package.json');
  }
} else {
  console.log('❌ package.json not found');
}

// Check if src directory exists
if (fs.existsSync('src')) {
  console.log('✅ src directory found');
  
  const srcContents = fs.readdirSync('src');
  console.log(`✅ Source files: ${srcContents.join(', ')}`);
} else {
  console.log('❌ src directory not found');
}

// Check if docker-compose.yml exists
if (fs.existsSync('docker-compose.yml')) {
  console.log('✅ docker-compose.yml found');
} else {
  console.log('❌ docker-compose.yml not found');
}

// Check if Dockerfile exists
if (fs.existsSync('Dockerfile')) {
  console.log('✅ Dockerfile found');
} else {
  console.log('❌ Dockerfile not found');
}

// Check if .env.example exists
if (fs.existsSync('env.example')) {
  console.log('✅ env.example found');
} else {
  console.log('❌ env.example not found');
}

// Check if tsconfig.json exists
if (fs.existsSync('tsconfig.json')) {
  console.log('✅ tsconfig.json found');
} else {
  console.log('❌ tsconfig.json not found');
}

// Check if drizzle.config.ts exists
if (fs.existsSync('drizzle.config.ts')) {
  console.log('✅ drizzle.config.ts found');
} else {
  console.log('❌ drizzle.config.ts not found');
}

// Check if README.md exists
if (fs.existsSync('README.md')) {
  console.log('✅ README.md found');
} else {
  console.log('❌ README.md not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Copy env.example to .env and fill in your credentials');
console.log('2. Run: docker-compose up -d postgres');
console.log('3. Run: npm install');
console.log('4. Run: npm run db:generate');
console.log('5. Run: npm run db:migrate');
console.log('6. Run: npm run dev');
console.log('\n🚀 Your Split-Bill Platform will be ready!');

# Split-Bill Platform Backend

A complete backend solution for a Split-Bill Platform that integrates USSD (Africa's Talking) and SMS (Briq) services to enable users to create and manage shared bills through mobile interactions.

## 🚀 Features

- **USSD Integration**: Africa's Talking USSD API for bill creation
- **SMS Notifications**: Briq SMS API for payment reminders and updates
- **Bill Management**: Create, track, and manage split bills
- **Payment Tracking**: Monitor payment status and send updates
- **RESTful API**: Complete API endpoints for all operations
- **TypeScript**: Full type safety and modern development experience
- **Docker Support**: Containerized deployment with Docker Compose

## 🏗️ Architecture

```
src/
├── config/          # Environment configuration
├── db/             # Database schema and connection
├── routes/         # API route handlers
├── services/       # Business logic services
├── utils/          # Utility functions and helpers
├── app.ts          # Fastify application setup
└── index.ts        # Server entry point
```

## 🛠️ Tech Stack

- **Framework**: Fastify (high-performance Node.js web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **SMS Service**: Briq SMS API
- **USSD Service**: Africa's Talking USSD API
- **Language**: TypeScript
- **Containerization**: Docker & Docker Compose
- **Validation**: Zod schema validation
- **Logging**: Custom logger with structured logging

## 📋 Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL database (or Neon cloud database)
- Briq SMS API account
- Africa's Talking USSD account

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd split-bill-platform

# Option 1: Use the automated setup script (recommended)
./start.sh

# Option 2: Manual setup
npm install
```

### 2. Environment Configuration

Copy the environment template and fill in your credentials:

```bash
cp env.template .env
```

**Note:** The `start.sh` script will automatically create the `.env` file for you.

Edit `.env` with your actual values:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/splitbill

# Briq SMS API
BRIQ_API_KEY=your_briq_api_key_here
BRIQ_SENDER_ID=your_sender_id_here

# Africa's Talking
AT_USERNAME=your_at_username_here
AT_API_KEY=your_at_api_key_here
AT_ENVIRONMENT=sandbox

# Security
JWT_SECRET=your_jwt_secret_here
```

### 3. Start Database

```bash
docker-compose up -d postgres
```

Wait for the database to be ready (check with `docker-compose ps`).

### 4. Run Database Migrations

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

**Troubleshooting:** If you encounter logger issues, the project now uses a simplified logger configuration that doesn't require external dependencies.

The server will start on `http://localhost:3000`

## 🗄️ Database Schema

### Users Table
- `id`: Primary key
- `name`: User's full name
- `phone`: Phone number (unique)
- `created_at`: Account creation timestamp

### Bills Table
- `id`: Primary key
- `creator_id`: Reference to users table
- `amount`: Total bill amount
- `description`: Optional bill description
- `created_at`: Bill creation timestamp

### Bill Members Table
- `id`: Primary key
- `bill_id`: Reference to bills table
- `member_phone`: Member's phone number
- `amount`: Amount owed by this member
- `status`: Payment status (pending/paid)
- `paid_at`: Payment completion timestamp

## 📱 API Endpoints

### USSD Endpoints

#### `POST /api/v1/ussd`
Africa's Talking USSD callback handler.

**Request Body:**
```json
{
  "sessionId": "string",
  "serviceCode": "string",
  "phoneNumber": "string",
  "text": "string"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "serviceCode": "string",
  "message": "string",
  "status": "CON|END"
}
```

**Note:** Uses Africa's Talking USSD API format with `CON` for continue and `END` for end.

### SMS Endpoints

#### `POST /api/v1/sms/send`
Send a single SMS via Briq API.

**Request Body:**
```json
{
  "to": "+255712345678",
  "message": "Your payment reminder message"
}
```

#### `POST /api/v1/sms/bulk`
Send multiple SMS messages.

**Request Body:**
```json
{
  "messages": [
    {
      "to": "+255712345678",
      "message": "Message 1"
    },
    {
      "to": "+255698765432",
      "message": "Message 2"
    }
  ]
}
```

### Payment Endpoints

#### `POST /api/v1/payment/mock`
Simulate a member payment.

**Request Body:**
```json
{
  "billId": 1,
  "memberPhone": "+255712345678"
}
```

#### `POST /api/v1/bills`
Create a new bill (alternative to USSD).

**Request Body:**
```json
{
  "creatorPhone": "+255712345678",
  "creatorName": "John Doe",
  "amount": 50000,
  "memberPhones": ["+255698765432", "+255612345678"],
  "description": "Dinner at restaurant"
}
```

#### `GET /api/v1/bills/:id`
Get bill details by ID.

#### `GET /api/v1/bills/creator/:phone`
Get all bills created by a specific phone number.

### Health Check Endpoints

- `GET /health` - Overall system health
- `GET /api/v1/ussd/health` - USSD service health
- `GET /api/v1/sms/health` - SMS service health
- `GET /api/v1/payment/health` - Payment service health

## 🔄 USSD Flow

1. **Welcome**: User dials USSD code (*123#)
2. **Amount Input**: Enter total bill amount
3. **Members Input**: Enter phone numbers separated by commas
4. **Confirmation**: Review bill summary and confirm
5. **Creation**: Bill is created and SMS notifications sent

**USSD Response Format:**
- `CON` - Continue session (waiting for more input)
- `END` - End session (bill created or cancelled)

## 📧 SMS Notifications

- **Bill Split Request**: Sent to all members when bill is created
- **Payment Updates**: Progress updates as members pay
- **Payment Confirmation**: Confirmation when individual pays
- **Completion Notification**: Sent to organizer when all payments complete

## 🐳 Docker Deployment

### Build and Run

```bash
# Build the application
docker build -t split-bill-platform .

# Run with Docker Compose
docker-compose up -d
```

### Production Deployment

Uncomment the app service in `docker-compose.yml` and update environment variables for production.

## 📊 Monitoring & Logging

The application includes comprehensive logging:

- **Structured Logging**: JSON-formatted logs with context
- **Performance Monitoring**: Slow operation detection
- **Error Tracking**: Detailed error logging with stack traces
- **Service Health**: Health check endpoints for all services

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking
```

### Database Commands

```bash
npm run db:generate  # Generate new migration
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio
npm run db:push      # Push schema changes
npm run db:drop      # Drop all tables
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📚 API Documentation

When the server is running, visit:
- **API Overview**: `http://localhost:3000/`
- **Health Check**: `http://localhost:3000/health`

## 🔒 Security Features

- **Rate Limiting**: Configurable rate limiting per endpoint
- **Input Validation**: Zod schema validation for all inputs
- **CORS Protection**: Configurable CORS settings
- **Helmet Security**: Security headers and protection
- **Environment Variables**: Secure configuration management

## 🌍 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `BRIQ_API_KEY` | Briq SMS API key | Yes | - |
| `BRIQ_SENDER_ID` | Briq sender ID | Yes | - |
| `AT_USERNAME` | Africa's Talking username | Yes | - |
| `AT_API_KEY` | Africa's Talking API key | Yes | - |
| `AT_ENVIRONMENT` | AT environment | No | `sandbox` |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `RATE_LIMIT_MAX` | Max requests per window | No | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | No | `900000` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the logs for debugging information

## 🔮 Roadmap

- [ ] User authentication and authorization
- [ ] Payment gateway integration
- [ ] Web dashboard for bill management
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Mobile app integration
- [ ] Webhook support for external integrations

---

**Built with ❤️ using Fastify, TypeScript, and Drizzle ORM**

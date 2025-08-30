import { createApp } from './app';
import { env } from './config/env';

async function startServer() {
  try {
    const app = await createApp();
    
    // Start server
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0', // Listen on all network interfaces
    });

    console.log(`🚀 Server is running on port ${env.PORT}`);
    console.log(`📱 Split-Bill Platform API ready`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`📊 Health check: http://localhost:${env.PORT}/health`);
    console.log(`📖 API docs: http://localhost:${env.PORT}/docs`);
    
    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await app.close();
        console.log('✅ Server closed successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

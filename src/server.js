const app = require('./app');
const { connectDatabases } = require('./config/database');
const config = require('./config/env');
const logger = require('./config/logger');

const startServer = async () => {
  try {
    await connectDatabases();
    const port = config.get('port');
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
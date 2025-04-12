const swaggerJsdoc = require('swagger-jsdoc');
const config = require('../config/env');
const port = config.get('port');
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OpenMRS to HSMS Migration API',
      description: 'API for migrating from MySQL to PostgreSQL | MongoDB to PostgreSQL | PostgreSQL to PostgreSQL',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${port}/api`,
        description: 'Development server',
      },
    ],
  },
  apis: [
    './src/routes/*.js', // Scan route files
    './src/controllers/*.js', // Scan controller files
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
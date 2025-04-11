const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Patient Migration API',
      description: 'API for migrating patient data from MySQL to PostgreSQL',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:6969/api',
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
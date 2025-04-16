const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger'); // Assuming this is your Swagger spec file
const patientRoutes = require('./routes/patientRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const opdRoutes = require('./routes/opdRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Centralized /api router
const apiRouter = express.Router();

// Mount all routes under /api
apiRouter.use(patientRoutes);
apiRouter.use(inventoryRoutes);
apiRouter.use(pharmacyRoutes);
apiRouter.use(opdRoutes);

// Mount the apiRouter under /api
app.use('/api', apiRouter);

// Error handling
app.use(errorHandler);

module.exports = app;
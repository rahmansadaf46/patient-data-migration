const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');
const patientRoutes = require('./routes/patientRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const opdRoutes = require('./routes/opdRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', patientRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', pharmacyRoutes);
app.use('/api', opdRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
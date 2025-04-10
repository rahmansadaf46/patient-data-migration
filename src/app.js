const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const userRoutes = require("./routers/userRouters");
const departmentRoutes = require("./routers/departmentRoutes");
const patientRouters = require("./routers/patientRouters")
const allPatients = require("./routers/allPatient")
require("dotenv").config();


const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/", userRoutes);
app.use("/api", departmentRoutes);
app.use("/api", patientRouters)
app.use("/api", allPatients)

module.exports = app;

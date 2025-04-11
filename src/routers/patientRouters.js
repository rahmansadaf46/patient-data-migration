const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

router.get("/migrate-patients", patientController.migratePatients);
router.get("/migrate-dependent-patients", patientController.updatePatientRelationships);
module.exports = router;

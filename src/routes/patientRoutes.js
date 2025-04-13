const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');

/**
 * @swagger
 * /registration/migrate-patients:
 *   get:
 *     summary: Migrate patient data from MySQL to PostgreSQL
 *     tags: [Registration]
 *     responses:
 *       200:
 *         description: Migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Migration completed.
 *                 totalMigrated:
 *                   type: integer
 *                   example: 100
 *                 skippedPatientsCount:
 *                   type: integer
 *                   example: 2
 *                 skippedPatientIDs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["1", "2"]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error migrating patients
 */
router.get('/registration/migrate-patients', PatientController.migratePatients);

/**
 * @swagger
 * /registration/migrate-dependent-patients:
 *   get:
 *     summary: Update patient relationships in PostgreSQL
 *     tags: [Registration]
 *     responses:
 *       200:
 *         description: Relationships updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Patient relationships updated successfully.
 *                 totalUpdated:
 *                   type: integer
 *                   example: 50
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error updating patient relationships
 */
router.get('/registration/migrate-dependent-patients', PatientController.updatePatientRelationships);


module.exports = router;
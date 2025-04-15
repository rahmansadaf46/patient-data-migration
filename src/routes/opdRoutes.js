const express = require('express');
const router = express.Router();
const OpdController = require('../controllers/opdController');

/**
 * @swagger
 * /api/opd/migrate-prescriptions:
 *   get:
 *     summary: Migrate OPD prescriptions from MySQL to PostgreSQL
 *     tags: [OPD]
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
 *                   example: OPD prescriptions migration completed.
 *                 totalMigrated:
 *                   type: integer
 *                   example: 100
 *                 skippedRecordsCount:
 *                   type: integer
 *                   example: 2
 *                 skippedRecords:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["patient_identifier_1", "patient_identifier_2"]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error migrating OPD prescriptions
 */
router.get('/opd/migrate-prescriptions', OpdController.migrateOpdPrescriptions);

module.exports = router;
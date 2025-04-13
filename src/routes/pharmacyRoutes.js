const express = require('express');
const router = express.Router();
const PharmacyController = require('../controllers/pharmacyController');

/**
 * @swagger
 * /migrate-pharmacy:
 *   get:
 *     summary: Migrate pharmacy data from MySQL to PostgreSQL
 *     tags: [Pharmacy]
 *     responses:
 *       200:
 *         description: Pharmacy migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pharmacy migration completed.
 *                 totalMigrated:
 *                   type: object
 *                   properties:
 *                     dosage:
 *                       type: integer
 *                       example: 50
 *                     categories:
 *                       type: integer
 *                       example: 10
 *                     genericNames:
 *                       type: integer
 *                       example: 100
 *                     formulationTypes:
 *                       type: integer
 *                       example: 20
 *                     manufacturers:
 *                       type: integer
 *                       example: 1
 *                     routes:
 *                       type: integer
 *                       example: 8
 *                 skippedItems:
 *                   type: object
 *                   properties:
 *                     dosage:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     genericNames:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     formulationTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     manufacturers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     routes:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error migrating pharmacy data
 */
router.get('/migrate-pharmacy', PharmacyController.migratePharmacy);

/**
 * @swagger
 * /migrate-formulations:
 *   get:
 *     summary: Migrate formulations data from MySQL to PostgreSQL
 *     tags: [Pharmacy]
 *     responses:
 *       200:
 *         description: Formulations migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Formulations migration completed.
 *                 totalMigrated:
 *                   type: integer
 *                   example: 100
 *                 skippedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       formulationTypeName:
 *                         type: string
 *                         example: Tablet
 *                       dosageName:
 *                         type: string
 *                         example: 500mg
 *                       reason:
 *                         type: string
 *                         example: Duplicate formulation
 *                   example:
 *                     - formulationTypeName: "Tablet"
 *                       dosageName: "500mg"
 *                       reason: "Duplicate formulation"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error migrating formulations
 */
router.get('/migrate-formulations', PharmacyController.migrateFormulations);

/**
 * @swagger
 * /migrate-medicines:
 *   get:
 *     summary: Migrate medicines data from MySQL to PostgreSQL
 *     tags: [Pharmacy]
 *     responses:
 *       200:
 *         description: Medicines migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Medicines migration completed.
 *                 totalMigrated:
 *                   type: integer
 *                   example: 200
 *                 skippedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       brandName:
 *                         type: string
 *                         example: Panadol
 *                       genericName:
 *                         type: string
 *                         example: Paracetamol
 *                       categoryName:
 *                         type: string
 *                         example: Analgesics
 *                       formulationTypeName:
 *                         type: string
 *                         example: TABLET
 *                       dosageName:
 *                         type: string
 *                         example: 500mg
 *                       reason:
 *                         type: string
 *                         example: Duplicate medicine
 *                   example:
 *                     - brandName: "Panadol"
 *                       genericName: "Paracetamol"
 *                       categoryName: "Analgesics"
 *                       formulationTypeName: "TABLET"
 *                       dosageName: "500mg"
 *                       reason: "Duplicate medicine"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error migrating medicines
 */
router.get('/migrate-medicines', PharmacyController.migrateMedicines);

module.exports = router;
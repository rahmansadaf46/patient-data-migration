const express = require('express');
const router = express.Router();
const PharmacyController = require('../controllers/pharmacyController');

/**
 * @swagger
 * tags:
 *   name: Pharmacy Migration
 *   description: API endpoints for migrating pharmacy-related data
 */

/**
 * @swagger
 * /api/pharmacy/migrate-pharmacy:
 *   get:
 *     summary: Migrate basic pharmacy data (dosage, categories, generic names, formulation types, manufacturers, routes)
 *     tags: [Pharmacy Migration]
 *     responses:
 *       200:
 *         description: Pharmacy migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMigrated:
 *                   type: object
 *                   properties:
 *                     dosage:
 *                       type: integer
 *                       example: 10
 *                     categories:
 *                       type: integer
 *                       example: 5
 *                     genericNames:
 *                       type: integer
 *                       example: 20
 *                     formulationTypes:
 *                       type: integer
 *                       example: 8
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                     genericNames:
 *                       type: array
 *                       items:
 *                         type: string
 *                     formulationTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     manufacturers:
 *                       type: array
 *                       items:
 *                         type: string
 *                     routes:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Error during pharmacy migration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error during pharmacy migration
 */
router.get('/pharmacy/migrate-pharmacy', PharmacyController.migratePharmacy);

/**
 * @swagger
 * /api/pharmacy/migrate-formulations:
 *   get:
 *     summary: Migrate formulations data
 *     tags: [Pharmacy Migration]
 *     responses:
 *       200:
 *         description: Formulations migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMigrated:
 *                   type: integer
 *                   example: 50
 *                 skippedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       formulationTypeName:
 *                         type: string
 *                         example: TABLET
 *                       dosageName:
 *                         type: string
 *                         example: 500mg
 *                       reason:
 *                         type: string
 *                         example: Missing required fields
 *       500:
 *         description: Error during formulations migration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error during formulations migration
 */
router.get('/pharmacy/migrate-formulations', PharmacyController.migrateFormulations);

/**
 * @swagger
 * /api/pharmacy/migrate-medicines:
 *   get:
 *     summary: Migrate medicines data
 *     tags: [Pharmacy Migration]
 *     responses:
 *       200:
 *         description: Medicines migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMigrated:
 *                   type: integer
 *                   example: 100
 *                 skippedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       brandName:
 *                         type: string
 *                         example: Paracetamol
 *                       genericName:
 *                         type: string
 *                         example: Paracetamol
 *                       categoryName:
 *                         type: string
 *                         example: ANALGESIC
 *                       formulationTypeName:
 *                         type: string
 *                         example: TABLET
 *                       dosageName:
 *                         type: string
 *                         example: 500mg
 *                       reason:
 *                         type: string
 *                         example: Duplicate medicine
 *       500:
 *         description: Error during medicines migration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error during medicines migration
 */
router.get('/pharmacy/migrate-medicines', PharmacyController.migrateMedicines);

/**
 * @swagger
 * /api/pharmacy/migrate-pharmacy-locations:
 *   get:
 *     summary: Migrate pharmacy locations data
 *     tags: [Pharmacy Migration]
 *     responses:
 *       200:
 *         description: Pharmacy locations migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMigrated:
 *                   type: integer
 *                   example: 4
 *                 skippedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: SKH-warehouse
 *                       reason:
 *                         type: string
 *                         example: Already exists
 *       500:
 *         description: Error during pharmacy locations migration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error during pharmacy locations migration
 */
router.get('/pharmacy/migrate-pharmacy-locations', PharmacyController.migratePharmacyLocations);

/**
 * @swagger
 * /api/pharmacy/migrate-pharmacy-stocks:
 *   get:
 *     summary: Migrate pharmacy stocks data
 *     tags: [Pharmacy Migration]
 *     responses:
 *       200:
 *         description: Pharmacy stocks migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMigrated:
 *                   type: integer
 *                   example: 400
 *                 skippedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ref_medicine_id:
 *                         type: string
 *                         example: "550e8400-e29b-41d4-a716-446655440000"
 *                       name:
 *                         type: string
 *                         example: Paracetamol
 *                       location_id:
 *                         type: integer
 *                         example: 1
 *                       reason:
 *                         type: string
 *                         example: Duplicate stock entry
 *       500:
 *         description: Error during pharmacy stocks migration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error during pharmacy stocks migration
 */
router.get('/pharmacy/migrate-pharmacy-stocks', PharmacyController.migratePharmacyStocks);

module.exports = router;
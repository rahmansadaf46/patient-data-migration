const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');

/**
 * @swagger
 * /api/inventory/migrate-inventory:
 *   get:
 *     summary: Migrate inventory data from MySQL to PostgreSQL
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Inventory migration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Inventory migration completed.
 *                 totalMigrated:
 *                   type: integer
 *                   example: 100
 *                 skippedItemsCount:
 *                   type: integer
 *                   example: 2
 *                 skippedItems:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Stamp Pad", "Envelope"]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error migrating inventory
 */
router.get('/inventory/migrate-inventory', InventoryController.migrateInventory);

module.exports = router;
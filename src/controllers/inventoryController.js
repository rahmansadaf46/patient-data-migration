const InventoryService = require('../services/inventoryService');
const logger = require('../config/logger');

class InventoryController {
  async migrateInventory(req, res, next) {
    try {
      logger.info('Starting inventory migration...');
      const { totalMigrated, skippedItems } = await InventoryService.migrateInventory();
      logger.info('Inventory migration completed.', { totalMigrated, skippedItemsCount: skippedItems.length });
      res.status(200).json({
        message: 'Inventory migration completed.',
        totalMigrated,
        skippedItemsCount: skippedItems.length,
        skippedItems,
      });
    } catch (error) {
      logger.error('Error migrating inventory', { error: error.message });
      next(error);
    }
  }
}

module.exports = new InventoryController();
const PharmacyService = require('../services/pharmacyService');
const logger = require('../config/logger');

class PharmacyController {
  async migratePharmacy(req, res, next) {
    try {
      logger.info('Starting pharmacy migration...');
      const { totalMigrated, skippedItems } = await PharmacyService.migratePharmacy();
      logger.info('Pharmacy migration completed.', { totalMigrated, skippedItems });
      res.status(200).json({
        message: 'Pharmacy migration completed.',
        totalMigrated,
        skippedItems,
      });
    } catch (error) {
      logger.error('Error migrating pharmacy data', { error: error.message });
      next(error);
    }
  }

  async migrateFormulations(req, res, next) {
    try {
      logger.info('Starting formulations migration...');
      const { totalMigrated, skippedItems } = await PharmacyService.migrateFormulations();
      logger.info('Formulations migration completed.', { totalMigrated, skippedItems });
      res.status(200).json({
        message: 'Formulations migration completed.',
        totalMigrated,
        skippedItems,
      });
    } catch (error) {
      logger.error('Error migrating formulations', { error: error.message });
      next(error);
    }
  }

  async migrateMedicines(req, res, next) {
    try {
      logger.info('Starting medicines migration...');
      const { totalMigrated, skippedItems } = await PharmacyService.migrateMedicines();
      logger.info('Medicines migration completed.', { totalMigrated, skippedItems });
      res.status(200).json({
        message: 'Medicines migration completed.',
        totalMigrated,
        skippedItems,
      });
    } catch (error) {
      logger.error('Error migrating medicines', { error: error.message });
      next(error);
    }
  }
}

module.exports = new PharmacyController();
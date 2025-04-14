const OpdService = require('../services/opdService');
const logger = require('../config/logger');

class OpdController {
  async migrateOpdPrescriptions(req, res, next) {
    try {
      logger.info('Starting OPD prescriptions migration...');
      const { totalMigrated, skippedRecordsCount, skippedRecords } = await OpdService.migrateOpdPrescriptions();
      logger.info('OPD prescriptions migration completed.', { totalMigrated, skippedRecordsCount });
      res.status(200).json({
        message: 'OPD prescriptions migration completed.',
        totalMigrated,
        skippedRecordsCount,
        skippedRecords,
      });
    } catch (error) {
      logger.error('Error migrating OPD prescriptions', { error: error.message });
      next(error);
    }
  }
}

module.exports = new OpdController();
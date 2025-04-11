const PatientService = require('../services/patientService');
const logger = require('../config/logger');

class PatientController {
  async migratePatients(req, res, next) {
    try {
      logger.info('Starting patient migration...');
      const { totalMigrated, skippedPatients } = await PatientService.migratePatients();
      logger.info('Patient migration completed.', { totalMigrated, skippedPatientsCount: skippedPatients.length });
      res.status(200).json({
        message: 'Migration completed.',
        totalMigrated,
        skippedPatientsCount: skippedPatients.length,
        skippedPatientIDs: skippedPatients,
      });
    } catch (error) {
      logger.error('Error migrating patients', { error: error.message });
      next(error);
    }
  }

  async updatePatientRelationships(req, res, next) {
    try {
      logger.info('Starting patient relationships update...');
      const { totalUpdated } = await PatientService.updatePatientRelationships();
      logger.info('Patient relationships update completed.', { totalUpdated });
      res.status(200).json({
        message: 'Patient relationships updated successfully.',
        totalUpdated,
      });
    } catch (error) {
      logger.error('Error updating patient relationships', { error: error.message });
      next(error);
    }
  }
}

module.exports = new PatientController();
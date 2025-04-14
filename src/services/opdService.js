const { mysqlPool, opdPostgresPool, registrationPostgresPool } = require('../config/database'); // Add registrationPostgresPool
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const config = require('../config/env');
const { dateFormat } = require('../utils/dateUtils');

class OpdService {
    async createOpdTablesIfNotExists() {
        const client = await opdPostgresPool.connect();
        try {
            // Check if the 'opd' schema exists
            const schemaCheck = await client.query(
                `SELECT EXISTS (
          SELECT FROM pg_namespace 
          WHERE nspname = 'opd'
        )`
            );

            if (!schemaCheck.rows[0].exists) {
                logger.info('Creating opd schema...');
                await client.query(`CREATE SCHEMA opd`);
                logger.info('Schema opd created successfully.');
            }

            // Check if the 'opd_prescriptions' table exists
            const tableCheck = await client.query(
                `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'opd' AND tablename = 'opd_prescriptions'
        )`
            );

            if (!tableCheck.rows[0].exists) {
                logger.info('Creating opd.opd_prescriptions table...');
                await client.query(`
          CREATE EXTENSION IF NOT EXISTS pgcrypto;
          CREATE TABLE opd.opd_prescriptions (
            id BIGSERIAL PRIMARY KEY,
            hospital_id UUID NOT NULL,
            doctor_id UUID NOT NULL,
            patient_id UUID NOT NULL,
            speciality_id UUID NOT NULL,
            consultation_id UUID NOT NULL,
            is_final BOOLEAN NOT NULL,
            prescription_data TEXT,
            uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE,
            created_by VARCHAR(255),
            updated_by VARCHAR(255),
            reason_to_update TEXT,
            reason_to_delete TEXT
          );
        `);
                logger.info('Table opd.opd_prescriptions created successfully.');
            }
        } catch (error) {
            logger.error('Error creating opd tables', { error: error.message });
            throw error;
        } finally {
            client.release();
        }
    }

    async migrateOpdPrescriptions() {
        await this.createOpdTablesIfNotExists();

        const limit = 1000;
        let offset = 0;
        let totalMigrated = 0;
        const skippedRecords = [];

        // List of investigations that should be categorized under radiology
        const radiologyInvestigations = new Set([
            'ABDOMEN', 'BMD', 'CONTRAST X-RAY BARIUM MEAL FOLLOW THROUGH (WITHOUT MEDICINE)',
            'CONTRAST X-RAY BARIUM MEAL OF STOMACH AND DUODENUM (WITHOUT MEDICINE)', 'CT SCAN HRCT OF CHEST',
            'CT SCAN OF BRAIN', 'CT SCAN OF C/S OR D/L OR L/S SPINE', 'CT SCAN OF CHEST',
            'CT SCAN OF HBS WITH CONTRAST', 'CT SCAN OF KUB WITH CONTRAST', 'CT SCAN OF LOWER ABDOMEN WITH CONTRAST (ORAL+IV)',
            'CT SCAN OF NECK', 'CT SCAN OF PELVIS/JOINT', 'CT SCAN OF UPPER ABDOMEN WITH CONTRAST (ORAL+IV)',
            'CT SCAN OF WHOLE ABDOMEN WITH CONTRAST (ORAL+IV)', 'CT SCAN ORBIT', 'CT SCAN PNS', 'LOWER EXTREMITY',
            'MAMMOGRAM OF BOTH BREAST', 'MAMMOGRAM OF LEFT BREAST', 'MAMMOGRAM OF RIGHT BREAST', 'MRA of Brain', 'MRCP',
            'MRI of Both Hip Joint (plain)', 'MRI of Both Hip Joint with contrast (without medicine)', 'MRI of Both Knee Joint',
            'MRI of Both S.I. Joint (plain)', 'MRI of Both S.I. Joint with contrast (without medicine)', 'MRI of Brain (plain)',
            'MRI of Brain with contrast (without medicine)', 'MRI of Cervical Spine (plain)', 'MRI of Cervical Spine with contrast (without medicine)',
            'MRI of Dorsal Spine (plain)', 'MRI of Dorsal Spine with contrast (without medicine)', 'MRI of Left Hip Joint (plain)',
            'MRI of Left Hip Joint with contrast (without medicine)', 'MRI of Left S.I. Joint (plain)', 'MRI of Left S.I. Joint with contrast (without medicine)',
            'MRI of Lumbar Spine (plain)', 'MRI of Lumbar Spine with contrast (without medicine)', 'MRI OF LUMBO SACRAL SPINE WITH SCREENING OF WHOLE SPINE',
            'MRI of Orbit (plain)', 'MRI of Orbit with contrast (without medicine)', 'MRI of Pelvis (plain)', 'MRI of Pelvis (plain) with contrast (without medicine)',
            'MRI of Right Hip Joint (plain)', 'MRI of Right Hip Joint with contrast (without medicine)', 'MRI of Right Knee Joint (plain)',
            'MRI of Right Knee Joint with contrast (without medicine)', 'MRI of Right S.I. Joint (plain)', 'MRI of Right S.I. Joint with contrast (without medicine)',
            'NECK', 'SPINE', 'ULTRASOUND HBS', 'ULTRASOUND LOWER ABDOMEN', 'ULTRASOUND OF BOTH BREAST', 'ULTRASOUND OF LEFT BREAST',
            'ULTRASOUND OF SUPERFICIAL STRUCTURE', 'ULTRASOUND PREGNANCY PROFILE', 'ULTRASOUND SCROTUM (TESTES)', 'ULTRASOUND UPPER ABDOMEN',
            'ULTRASOUND WHOLE ABDOMEN', 'UPPER EXTREMITY', 'USG OF W/A TO EXCLUDE ANY PATHOLOGY', 'X-RAY CHEST', 'X-RAY MASTOID TOWNE\'S VIEW',
            'X-RAY NASOPHARYNX (LAT VIEW)', 'X-RAY OPG', 'X-Ray PNS (OM view)', 'X-RAY PNS (OM VIEW)', 'X-RAY TM JOINT B/V'
        ]);

        while (true) {
            // Fetch distinct patient identifiers from the obs table
            const [patientIdentifiers] = await mysqlPool.query(
                `
        SELECT DISTINCT pi.identifier
        FROM obs
        LEFT JOIN patient_identifier pi ON obs.person_id = pi.patient_id
        WHERE pi.identifier IS NOT NULL
        LIMIT ? OFFSET ?
        `,
                [limit, offset]
            );

            if (patientIdentifiers.length === 0) break;

            const client = await opdPostgresPool.connect();
            try {
                await client.query('BEGIN');

                for (const { identifier: patientIdentifier } of patientIdentifiers) {
                    // Fetch the patient_id from registration.patient using patient_identifier
                    const patientResult = await registrationPostgresPool.query(
                        `SELECT patient_id FROM registration.patient WHERE patient_identifier = $1`,
                        [patientIdentifier]
                    );

                    if (patientResult.rows.length === 0) {
                        logger.warn(`No patient found in registration.patient for identifier ${patientIdentifier}. Skipping...`);
                        skippedRecords.push(patientIdentifier);
                        continue;
                    }

                    const patientId = patientResult.rows[0].patient_id;

                    // Fetch investigation data
                    const [investigationResult] = await mysqlPool.query(
                        `
            SELECT
              pi.identifier AS patient_identifier,
              cn.name AS attribute_name,
              cn1.name AS investigation,
              obs.obs_datetime AS visited_date
            FROM obs
            LEFT JOIN concept_name cn ON obs.concept_id = cn.concept_id
            LEFT JOIN concept_name cn1 ON obs.value_coded = cn1.concept_id
            LEFT JOIN patient_identifier pi ON obs.person_id = pi.patient_id
            WHERE pi.identifier = ?
              AND cn.name = 'INVESTIGATION'
              AND cn.concept_name_type = 'FULLY_SPECIFIED'
              AND cn1.concept_name_type = 'FULLY_SPECIFIED'
            `,
                        [patientIdentifier]
                    );

                    // Fetch chief complaint data
                    const [chiefComplaintResult] = await mysqlPool.query(
                        `
            SELECT
              pi.identifier AS patient_identifier,
              cn.name AS attribute_name,
              obs.value_text AS chief_complain,
              obs.obs_datetime AS visited_date
            FROM obs
            LEFT JOIN concept_name cn ON obs.concept_id = cn.concept_id
            LEFT JOIN patient_identifier pi ON obs.person_id = pi.patient_id
            WHERE pi.identifier = ?
              AND cn.name = 'CHIEF COMPLAIN'
              AND cn.concept_name_type = 'FULLY_SPECIFIED'
            `,
                        [patientIdentifier]
                    );

                    // Fetch diagnosis data
                    const [diagnosisResult] = await mysqlPool.query(
                        `
            SELECT
              pi.identifier AS patient_identifier,
              cn.name AS attribute_name,
              cn1.name AS diagnosis,
              obs.obs_datetime AS visited_date
            FROM obs
            LEFT JOIN concept_name cn ON obs.concept_id = cn.concept_id
            LEFT JOIN concept_name cn1 ON obs.value_coded = cn1.concept_id
            LEFT JOIN patient_identifier pi ON obs.person_id = pi.patient_id
            WHERE pi.identifier = ?
              AND cn.name = 'PROVISIONAL DIAGNOSIS'
              AND cn.concept_name_type = 'FULLY_SPECIFIED'
              AND cn1.concept_name_type = 'FULLY_SPECIFIED'
            `,
                        [patientIdentifier]
                    );

                    // Fetch advice data
                    const [adviceResult] = await mysqlPool.query(
                        `
            SELECT
              pi.identifier AS patient_identifier,
              cn.name AS attribute_name,
              obs.value_text AS advice,
              obs.obs_datetime AS visited_date
            FROM obs
            LEFT JOIN concept_name cn ON obs.concept_id = cn.concept_id
            LEFT JOIN patient_identifier pi ON obs.person_id = pi.patient_id
            WHERE pi.identifier = ?
              AND cn.name = 'HOSPITAL ADVICE'
              AND cn.concept_name_type = 'FULLY_SPECIFIED'
              AND obs.value_text IS NOT NULL
              AND TRIM(obs.value_text) != ''
            `,
                        [patientIdentifier]
                    );

                    // Fetch referral data
                    const [referralResult] = await mysqlPool.query(
                        `
            SELECT
              pi.identifier AS patient_identifier,
              cn.name AS attribute_name,
              cn1.name AS refered,
              obs.obs_datetime AS visited_date
            FROM obs
            LEFT JOIN concept_name cn ON obs.concept_id = cn.concept_id
            LEFT JOIN concept_name cn1 ON obs.value_coded = cn1.concept_id
            LEFT JOIN patient_identifier pi ON obs.person_id = pi.patient_id
            WHERE pi.identifier = ?
              AND cn.name = 'INTERNAL REFERRAL'
              AND cn.concept_name_type = 'FULLY_SPECIFIED'
              AND cn1.concept_name_type = 'FULLY_SPECIFIED'
            `,
                        [patientIdentifier]
                    );

                    // Skip if no relevant data is found
                    if (
                        investigationResult.length === 0 &&
                        chiefComplaintResult.length === 0 &&
                        diagnosisResult.length === 0 &&
                        adviceResult.length === 0 &&
                        referralResult.length === 0
                    ) {
                        skippedRecords.push(patientIdentifier);
                        continue;
                    }

                    // Categorize investigations into investigations and radiology
                    const investigations = [];
                    const radiology = [];
                    for (const item of investigationResult) {
                        const investigationEntry = {
                            id: uuidv4(),
                            entity: 'investigation',
                            entry: item.investigation || '',
                            score: 1,
                            doctorId: '',
                            speciality: '',
                            notes: '',
                            sync: false,
                            visited_date: item.visited_date ? dateFormat(item.visited_date) : '',
                        };

                        if (radiologyInvestigations.has(item.investigation?.toUpperCase())) {
                            radiology.push(investigationEntry);
                        } else {
                            investigations.push(investigationEntry);
                        }
                    }

                    // Transform chief complaints
                    const chiefComplaints = chiefComplaintResult.map((item) => ({
                        id: uuidv4(),
                        entity: 'chief complaint',
                        entry: item.chief_complain || '',
                        score: 1,
                        doctorId: '',
                        speciality: '',
                        duration: '',
                        severity: '',
                        sync: false,
                        visited_date: item.visited_date ? dateFormat(item.visited_date) : '',
                    }));

                    // Transform diagnoses
                    const diagnoses = diagnosisResult.map((item) => ({
                        title: item.diagnosis || '',
                        order: 'Primary',
                        certainty: 'Confirmed',
                        note: '',
                        visited_date: item.visited_date ? dateFormat(item.visited_date) : '',
                    }));

                    // Transform advice
                    const advice = adviceResult.map((item) => ({
                        id: uuidv4(),
                        entity: 'advice',
                        entry: item.advice || '',
                        score: 1,
                        doctorId: '',
                        speciality: '',
                        notes: '',
                        sync: false,
                        visited_date: item.visited_date ? dateFormat(item.visited_date) : '',
                    }));

                    // Transform referral
                    const referredTo = referralResult.length > 0 ? {
                        selectedRoom: referralResult[0].refered || '',
                        selectedGovtHospital: null,
                        selectedOtherHospital: null,
                        selectedDoctor: null
                    } : {
                        selectedRoom: null,
                        selectedGovtHospital: null,
                        selectedOtherHospital: null,
                        selectedDoctor: null,
                    };

                    // Placeholder for other fields (since MySQL data doesn't provide these)
                    const followUp = {
                        type: 'duration',
                        duration: '',
                        durationUnit: '',
                        note: '',
                    };

                    const generalExamination = {
                        formData: {
                            temperature: '',
                            bpSystolic: '',
                            bpDiastolic: '',
                            pulse: '',
                            pulseType: '',
                            respiratoryRate: '',
                            anemia: '',
                            bmi: '',
                            bmiStatus: '',
                            height: '',
                            heightUnit: '',
                            jaundice: '',
                            lymphNode: '',
                            ofc: '',
                            spleen: '',
                            thyroid: '',
                            weight: '',
                        },
                        visited_date: '',
                    };

                    // Construct prescription data
                    const prescriptionData = {
                        investigations,
                        chiefComplaints,
                        diagnoses,
                        advice,
                        followUp,
                        generalExamination,
                        radiology,
                        referredTo,
                        specialityId: uuidv4(),
                    };

                    // Generate UUIDs for required fields
                    const consultationId = uuidv4();
                    const doctorId = uuidv4(); // Placeholder doctor ID

                    // Insert into opd_prescriptions
                    await client.query(
                        `
            INSERT INTO opd.opd_prescriptions (
              hospital_id, doctor_id, patient_id, speciality_id, consultation_id, is_final, prescription_data,
              uuid, status, created_at, updated_at, created_by, updated_by, reason_to_update, reason_to_delete
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `,
                        [
                            config.get('hospital_id'),
                            doctorId,
                            patientId, // Use the patientId from registration.patient
                            prescriptionData.specialityId,
                            consultationId,
                            true, // is_final
                            JSON.stringify(prescriptionData),
                            uuidv4(),
                            'ACTIVE',
                            new Date(),
                            null,
                            null,
                            null,
                            null,
                            null,
                        ]
                    );

                    totalMigrated++;
                }

                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                logger.error('Error during OPD migration', { error: error.message });
                throw error;
            } finally {
                client.release();
            }

            offset += limit;
        }

        logger.info('OPD migration completed.', { totalMigrated, skippedRecordsCount: skippedRecords.length, skippedRecords });
        return { totalMigrated, skippedRecordsCount: skippedRecords.length, skippedRecords };
    }
}

module.exports = new OpdService();
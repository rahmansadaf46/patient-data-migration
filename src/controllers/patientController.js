const { mysqlDB, connectPostgresDB } = require("../config/db");
const { dateFormat } = require("../utils/mainUtils");
const { v4: uuidv4 } = require("uuid");

exports.migratePatients = async (req, res) => {
  let pgPool;
  try {
    pgPool = await connectPostgresDB();

    // Check if the registration.patient table exists
    const tableCheck = await pgPool.query(
      `SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'registration' AND tablename = 'patient'
      )`
    );
    if (!tableCheck.rows[0].exists) {
      console.log("Table registration.patient does not exist. Creating it now...");
      await pgPool.query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto; -- Enable pgcrypto for gen_random_uuid()
        CREATE TABLE registration.patient (
          -- BaseEntity Fields
          uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE,
          created_by UUID,
          updated_by UUID,
          status VARCHAR(50),
          reason_to_update TEXT,
          reason_to_delete TEXT,

          -- Patient Fields
          id BIGSERIAL,
          patient_id UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
          organization_id UUID,
          hospital_id UUID,
          name VARCHAR(255),
          patient_identifier VARCHAR(255),
          salutation VARCHAR(50),
          first_name VARCHAR(255),
          middle_name VARCHAR(255),
          last_name VARCHAR(255),
          nid VARCHAR(255),
          brn VARCHAR(255),
          health_id VARCHAR(255),
          birth_place VARCHAR(255),
          image_path VARCHAR(255),
          dob TIMESTAMP,
          gender VARCHAR(50),
          patient_category VARCHAR(100),

          -- JSON Columns
          patient_info TEXT,
          identifications TEXT,
          verified BOOLEAN,
          verification_process VARCHAR(255),
          verified_by UUID,
          workplaces TEXT,
          contact_info TEXT,
          address TEXT,
          relationship TEXT NOT NULL,

          -- Additional Fields
          is_dependant BOOLEAN,
          is_dead BOOLEAN,
          death_date TIMESTAMP,
          death_reason VARCHAR(255),
          death_notes TEXT,
          patient_type VARCHAR(255),
          issue_type VARCHAR(255),
          issue_date TIMESTAMP
        );
      `);
      console.log("Table registration.patient created successfully.");
    }

    const limit = 500;
    let offset = 0;
    let totalMigrated = 0;
    let skippedPatients = [];

    while (true) {
      const [patients] = await mysqlDB.query(
        `SELECT * FROM patient LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      if (patients.length === 0) {
        break;
      }

      for (const patient of patients) {
        const newPatientId = uuidv4();
        const originalPatientId = patient.patient_id;

        const existingPatient = await pgPool.query(
          `SELECT patient_id FROM registration.patient WHERE patient_identifier = $1`,
          [originalPatientId.toString()]
        );

        if (existingPatient.rows.length > 0) {
          console.log(
            `Patient with original ID ${originalPatientId} already exists. Skipping...`
          );
          skippedPatients.push(originalPatientId);
          continue;
        }

        // Fetch related data
        const [patientIdentifiers] = await mysqlDB.query(
          `SELECT * FROM patient_identifier WHERE patient_id = ?`,
          [originalPatientId]
        );
        const [patientSearch] = await mysqlDB.query(
          `SELECT * FROM patient_search WHERE patient_id = ?`,
          [originalPatientId]
        );
        const [person] = await mysqlDB.query(
          `SELECT * FROM person WHERE person_id = ?`,
          [originalPatientId]
        );
        const [personAddress] = await mysqlDB.query(
          `SELECT * FROM person_address WHERE person_id = ?`,
          [originalPatientId]
        );
        const [personAttribute] = await mysqlDB.query(
          `SELECT * FROM person_attribute WHERE person_id = ?`,
          [originalPatientId]
        );
        const [personName] = await mysqlDB.query(
          `SELECT * FROM person_name WHERE person_id = ?`,
          [originalPatientId]
        );

        const originalCreator = patient.creator;
        const originalChangedBy = patient.changed_by;
        const createdByUuid = originalCreator ? uuidv4() : null;
        const updatedByUuid = originalChangedBy ? uuidv4() : null;

        const patientData = {
          patient_id: newPatientId,
          patient_identifier: patientIdentifiers[0]?.identifier,
          created_at: dateFormat(patient.date_created),
          updated_at: patient.date_changed ? dateFormat(patient.date_changed) : null,
          created_by: createdByUuid,
          updated_by: updatedByUuid,
          status: patient.voided ? "VOIDED" : "ACTIVE",
          reason_to_delete: patient.void_reason,

          name: `${personName[0]?.given_name || ""} ${personName[0]?.middle_name || ""
            } ${personName[0]?.family_name || ""}`.trim(),
          first_name: personName[0]?.given_name,
          middle_name: personName[0]?.middle_name,
          last_name: personName[0]?.family_name,
          dob: dateFormat(person[0]?.birthdate),
          gender:
            person[0]?.gender === "M"
              ? "MALE"
              : person[0]?.gender === "F"
                ? "FEMALE"
                : "OTHER",
          is_dead: person[0]?.dead || false,
          death_date: dateFormat(person[0]?.death_datetime),
          death_reason: person[0]?.cause_of_death,

          identifications: '',
          patient_info: JSON.stringify({
            bloodGroup: '',
            maritalStatus: '',
            religion: '',
            fatherNameEnglish: '',
            motherNameEnglish: '',
            spouseName: '',
            relativeName: '',
          }),
          address: personAddress[0]
            ? JSON.stringify({
              address: '',
              division: '',
              district: personAddress[0]?.county_district,
              upazila: personAddress[0]?.city_village,
              addressLine: personAddress[0]?.address1,
            })
            : null,
          contact_info: patientSearch[0]
            ? JSON.stringify({
              phone: patientSearch[0]?.phone_no ? patientSearch[0]?.phone_no : '',
              email: ''
            })
            : null,

          relationship: "[]",
          organization_id: process.env.ORGANIZATION_ID,
          hospital_id: process.env.HOSPITAL_ID,
        };

        await pgPool.query(
          `
          INSERT INTO registration.patient (
            patient_id, patient_identifier, created_at, updated_at, created_by, updated_by, status, reason_to_delete,
            name, first_name, middle_name, last_name, dob, gender, is_dead, death_date, death_reason,
            identifications, patient_info, address, contact_info, relationship, organization_id, hospital_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          `,
          [
            patientData.patient_id,
            patientData.patient_identifier,
            patientData.created_at,
            patientData.updated_at,
            patientData.created_by,
            patientData.updated_by,
            patientData.status,
            patientData.reason_to_delete,
            patientData.name,
            patientData.first_name,
            patientData.middle_name,
            patientData.last_name,
            patientData.dob,
            patientData.gender,
            patientData.is_dead,
            patientData.death_date,
            patientData.death_reason,
            patientData.identifications,
            patientData.patient_info,
            patientData.address,
            patientData.contact_info,
            patientData.relationship,
            patientData.organization_id,
            patientData.hospital_id,
          ]
        );

        totalMigrated++;
      }

      offset += limit;
    }

    res.status(200).send({
      message: "Migration completed.",
      totalMigrated,
      skippedPatientsCount: skippedPatients.length,
      skippedPatientIDs: skippedPatients,
    });
  } catch (error) {
    console.error("Error migrating patients:", error);
    res
      .status(500)
      .send({ message: "Error migrating patients", error: error.message });
  } finally {
    if (pgPool) {
      await pgPool.end();
    }
  }
};
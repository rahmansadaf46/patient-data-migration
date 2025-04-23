const { mysqlPool, registrationPostgresPool } = require('../config/database');
const { dateFormat } = require('../utils/dateUtils');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const config = require('../config/env');
const { getValue } = require('../utils/commonUtils');

class PatientService {
  async createPatientTableIfNotExists() {
    const client = await registrationPostgresPool.connect();
    try {
      // Check if the 'registration' schema exists
      const schemaCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_namespace 
          WHERE nspname = 'registration'
        )`
      );

      if (!schemaCheck.rows[0].exists) {
        logger.info('Creating registration schema...');
        await client.query(`CREATE SCHEMA registration`);
        logger.info('Schema registration created successfully.');
      }

      // Check if the 'patient' table exists
      const tableCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'registration' AND tablename = 'patient'
        )`
      );

      if (!tableCheck.rows[0].exists) {
        logger.info('Creating registration.patient table...');
        await client.query(`
          CREATE EXTENSION IF NOT EXISTS pgcrypto;
          CREATE TABLE registration.patient (
            uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(50),
            reason_to_update TEXT,
            reason_to_delete TEXT,
            id BIGINT,
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
            document_path VARCHAR(255),
            dob TIMESTAMP,
            gender VARCHAR(50),
            patient_category VARCHAR(100),
            patient_info TEXT,
            identifications TEXT,
            verified BOOLEAN,
            verification_process VARCHAR(255),
            verify_id VARCHAR(255),
            verified_by UUID,
            workplaces TEXT,
            contact_info TEXT,
            address TEXT,
            relationship TEXT NOT NULL,
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
        logger.info('Table registration.patient created successfully.');
      }
    } catch (error) {
      logger.error('Error creating patient table', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  async migratePatients() {
    await this.createPatientTableIfNotExists();
  
    const limit = 1000;
    let offset = 0;
    let totalMigrated = 0;
    const skippedPatients = [];
  
    while (true) {
      const [patients] = await mysqlPool.query(
        `SELECT * FROM patient LIMIT ? OFFSET ?`,
        [limit, offset]
      );
  
      if (patients.length === 0) break;
  
      const client = await registrationPostgresPool.connect();
      try {
        await client.query('BEGIN');
  
        for (const patient of patients) {
          const newPatientId = uuidv4();
          const originalPatientId = patient.patient_id;
  
          const [patientIdentifiers] = await mysqlPool.query(
            `SELECT * FROM patient_identifier WHERE patient_id = ?`,
            [originalPatientId]
          );
  
          if (!patientIdentifiers[0]?.identifier) {
            skippedPatients.push(originalPatientId);
            continue;
          }
  
          // Sanitize patient_identifier
          let patientIdentifier = patientIdentifiers[0].identifier;
          if (/^\d+$/.test(patientIdentifier) && patientIdentifier.length > 19) {
            logger.warn(`Sanitizing patient_identifier ${patientIdentifier} for patient ${originalPatientId}.`);
            patientIdentifier = `SANITIZED_${originalPatientId}`;
          }
  
          const existingPatient = await client.query(
            `SELECT patient_identifier FROM registration.patient WHERE patient_identifier = $1`,
            [patientIdentifier]
          );
  
          if (existingPatient.rows.length > 0) {
            logger.warn(`Patient with identifier ${patientIdentifier} already exists. Skipping...`);
            skippedPatients.push(originalPatientId);
            continue;
          }
  
          const [patientSearch] = await mysqlPool.query(
            `SELECT * FROM patient_search WHERE patient_id = ?`,
            [originalPatientId]
          );
          const [person] = await mysqlPool.query(
            `SELECT * FROM person WHERE person_id = ?`,
            [originalPatientId]
          );
          const [personAddress] = await mysqlPool.query(
            `SELECT * FROM person_address WHERE person_id = ?`,
            [originalPatientId]
          );
          const [personName] = await mysqlPool.query(
            `SELECT * FROM person_name WHERE person_id = ?`,
            [originalPatientId]
          );
          const [familyAttribute] = await mysqlPool.query(
            `SELECT * FROM family_member_master_table WHERE identifier = ?`,
            [patientIdentifier]
          );
          const [familyMemberAttribute] = await mysqlPool.query(
            `SELECT * FROM family_member_master_table_details WHERE identifier = ?`,
            [patientIdentifier]
          );
  
          const [emailResult] = await mysqlPool.query(
            `
            SELECT pa.person_id, pat.name AS attribute_name, pa.value AS value
            FROM person_attribute pa
            LEFT JOIN person_attribute_type pat ON pa.person_attribute_type_id = pat.person_attribute_type_id
            WHERE pat.name = 'Email Address'
            AND pa.person_id = ?
            ORDER BY pa.date_created DESC LIMIT 1
            `,
            [originalPatientId]
          );
  
          const [nidResult] = await mysqlPool.query(
            `
            SELECT pa.person_id, pat.name AS attribute_name, pa.value AS value
            FROM person_attribute pa
            LEFT JOIN person_attribute_type pat ON pa.person_attribute_type_id = pat.person_attribute_type_id
            WHERE pat.name = 'National ID'
            AND pa.person_id = ?
            ORDER BY pa.date_created DESC LIMIT 1
            `,
            [originalPatientId]
          );
  
          const [workplaceResult] = await mysqlPool.query(
            `
            SELECT pa.person_id, pat.name AS attribute_name, pa.value AS value
            FROM person_attribute pa
            LEFT JOIN person_attribute_type pat ON pa.person_attribute_type_id = pat.person_attribute_type_id
            WHERE pat.name = 'Work Place'
            AND pa.person_id = ?
            ORDER BY pa.date_created DESC LIMIT 1
            `,
            [originalPatientId]
          );
  
          const [designationResult] = await mysqlPool.query(
            `
            SELECT pa.person_id, pat.name AS attribute_name, pa.value AS value
            FROM person_attribute pa
            JOIN person_attribute_type pat ON pa.person_attribute_type_id = pat.person_attribute_type_id
            WHERE pat.name = 'Designation'
            AND pa.person_id = ?
            ORDER BY pa.date_created DESC LIMIT 1
            `,
            [originalPatientId]
          );
  
          const [spouseResult] = await mysqlPool.query(
            `
            SELECT
              fmt.patient_id,
              fmtd.relationType AS attribute_name,
              fmtd.gender as gender,
              CONCAT_WS(' ', fmtd.given_name, fmtd.family_name) AS value
            FROM
              family_member_master_table fmt
            LEFT JOIN
              family_member_master_table_details fmtd ON fmt.master_id = fmtd.master_id
            WHERE
              fmtd.relationType = 'spouse'
              AND fmt.patient_id = ?
            `,
            [originalPatientId]
          );
  
          const [fatherResult] = await mysqlPool.query(
            `
            SELECT
              fmt.patient_id,
              fmtd.relationType AS attribute_name,
              CONCAT_WS(' ', fmtd.given_name, fmtd.family_name) AS value
            FROM
              family_member_master_table fmt
            LEFT JOIN
              family_member_master_table_details fmtd ON fmt.master_id = fmtd.master_id
            WHERE
              fmtd.relationType = 'father'
              AND fmt.patient_id = ?
            `,
            [originalPatientId]
          );
  
          const [motherResult] = await mysqlPool.query(
            `
            SELECT
              fmt.patient_id,
              fmtd.relationType AS attribute_name,
              CONCAT_WS(' ', fmtd.given_name, fmtd.family_name) AS value
            FROM
              family_member_master_table fmt
            LEFT JOIN
              family_member_master_table_details fmtd ON fmt.master_id = fmtd.master_id
            WHERE
              fmtd.relationType = 'mother'
              AND fmt.patient_id = ?
            `,
            [originalPatientId]
          );
  
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const email =
            emailResult &&
              emailResult.length > 0 &&
              emailRegex.test(emailResult[0].value)
              ? emailResult[0].value
              : '';
          const nid = nidResult?.[0]?.value && /^(?:\d{10}|\d{13}|\d{17})$/.test(nidResult[0].value) ? nidResult[0].value : '';
          const workplace = getValue(workplaceResult);
          const designation = getValue(designationResult);
          const spouseName = (getValue(spouseResult) && person[0]?.gender !== spouseResult[0]?.gender) ? getValue(spouseResult) : '';
          const fatherName = getValue(fatherResult);
          const motherName = getValue(motherResult);
  
          const patientData = {
            patient_id: newPatientId,
            patient_identifier: patientIdentifier,
            created_at: dateFormat(patient.date_created),
            updated_at: patient.date_changed
              ? dateFormat(patient.date_changed)
              : null,
            created_by: null,
            updated_by: null,
            status: patient.voided ? 'VOIDED' : 'ACTIVE',
            reason_to_delete: patient.void_reason,
            name: `${personName[0]?.given_name || ''} ${personName[0]?.middle_name || ''
              } ${personName[0]?.family_name || ''}`.trim(),
            first_name: personName[0]?.given_name,
            middle_name: personName[0]?.middle_name,
            last_name: personName[0]?.family_name,
            dob: dateFormat(person[0]?.birthdate),
            gender:
              person[0]?.gender === 'M'
                ? 'MALE'
                : person[0]?.gender === 'F'
                  ? 'FEMALE'
                  : 'OTHER',
            is_dead: false,
            death_date: dateFormat(person[0]?.death_datetime),
            death_reason: person[0]?.cause_of_death,
            identifications: '',
            patient_info: JSON.stringify({
              bloodGroup: '',
              maritalStatus: '',
              religion: '',
              fatherNameEnglish: fatherName,
              motherNameEnglish: motherName,
              spouseName: spouseName,
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
            contact_info: patientSearch[0] || email
              ? JSON.stringify({
                phone: patientSearch[0]?.phone_no || '',
                email: email || '',
              })
              : null,
            relationship: '[]',
            organization_id: config.get('organization_id'),
            hospital_id: config.get('hospital_id'),
            patientType:
              familyMemberAttribute.length > 0
                ? 'DEPENDANT'
                : familyAttribute.length > 0
                  ? 'GOVERNMENT'
                  : 'NON_GOVERNMENT',
            nid: nid,
            workplaces: JSON.stringify({
              current: {
                place: familyAttribute.length > 0 ? workplace : '',
                designation: familyAttribute.length > 0 ? designation : '',
                rank: '',
              },
              previous: [],
            }),
          };
  
          const isDependent = familyMemberAttribute.length > 0 ? true : false;
  
          // Remove the id column from the INSERT statement to let PostgreSQL generate it
          const result = await client.query(
            `
            INSERT INTO registration.patient (
              patient_id, patient_identifier, created_at, updated_at, created_by, updated_by, status, reason_to_delete,
              name, first_name, middle_name, last_name, dob, gender, is_dead, death_date, death_reason,
              identifications, patient_info, address, contact_info, relationship, organization_id, hospital_id, patient_type, nid, workplaces, verified, is_dependant, issue_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
            RETURNING id
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
              patientData.patientType,
              patientData.nid,
              patientData.workplaces,
              false,
              isDependent,
              patientData.created_at
            ]
          );
  
          const insertedId = result.rows[0].id;
          logger.info('Inserted patient with id:', { insertedId });
  
          totalMigrated++;
        }
  
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
  
      offset += limit;
    }
  
    return { totalMigrated, skippedPatients };
  }

  async updatePatientRelationships() {
    const client = await registrationPostgresPool.connect();
    try {
      await client.query('BEGIN');

      const patientsResult = await client.query(
        `SELECT patient_id, patient_identifier, gender, patient_type 
         FROM registration.patient`
      );
      const patients = patientsResult.rows;

      const [familyMasters] = await mysqlPool.query(
        `SELECT * FROM family_member_master_table`
      );
      const [familyDetails] = await mysqlPool.query(
        `SELECT * FROM family_member_master_table_details`
      );

      let updatedCount = 0;
      const patientMap = new Map(patients.map((p) => [p.patient_identifier, p]));

      for (const patient of patients) {
        let relationships = [];
        let isDependant = false;
        let needsUpdate = false;

        const normalizeRelationship = (relation, patientGender, relatedGender) => {
          if (!relation || relation.trim() === '') return 'OTHER';

          let cleanedRelation = relation
            .replace(/[^a-zA-Z\s]/g, '')
            .trim()
            .toUpperCase()
            .replace(/\s+/g, '_');

          const relationMap = {
            FATHER_IN_LAW: relatedGender === 'MALE' ? 'FATHER_IN_LAW' : 'MOTHER_IN_LAW',
            MOTHER_IN_LAW: relatedGender === 'FEMALE' ? 'MOTHER_IN_LAW' : 'FATHER_IN_LAW',
            FATHER: patientGender === 'MALE' ? 'FATHER' : 'MOTHER',
            MOTHER: patientGender === 'FEMALE' ? 'MOTHER' : 'FATHER',
            SON: patientGender === 'MALE' ? 'SON' : 'DAUGHTER',
            DAUGHTER: patientGender === 'FEMALE' ? 'DAUGHTER' : 'SON',
            BROTHER: patientGender === 'MALE' ? 'BROTHER' : 'SISTER',
            SISTER: patientGender === 'FEMALE' ? 'SISTER' : 'BROTHER',
            SPOUSE: 'SPOUSE',
            WIFE: 'SPOUSE',
            HUSBAND: 'SPOUSE',
            SON_IN_LAW: patientGender === 'MALE' ? 'SON_IN_LAW' : 'DAUGHTER_IN_LAW',
            DAUGHTER_IN_LAW: patientGender === 'FEMALE' ? 'DAUGHTER_IN_LAW' : 'SON_IN_LAW',
            UNCLE: patientGender === 'MALE' ? 'UNCLE' : 'AUNT',
            AUNT: patientGender === 'FEMALE' ? 'AUNT' : 'UNCLE',
            NEPHEW: patientGender === 'MALE' ? 'NEPHEW' : 'NIECE',
            NIECE: patientGender === 'FEMALE' ? 'NIECE' : 'NEPHEW',
            GRANDFATHER: patientGender === 'MALE' ? 'GRANDFATHER' : 'GRANDMOTHER',
            GRANDMOTHER: patientGender === 'FEMALE' ? 'GRANDMOTHER' : 'GRANDFATHER',
            GRANDSON: patientGender === 'MALE' ? 'GRANDSON' : 'GRANDDAUGHTER',
            GRANDDAUGHTER: patientGender === 'FEMALE' ? 'GRANDDAUGHTER' : 'GRANDSON',
          };

          return relationMap[cleanedRelation] || 'OTHER';
        };

        if (patient.patient_type === 'GOVERNMENT') {
          const masterEntry = familyMasters.find(
            (m) => m.identifier === patient.patient_identifier
          );
          if (masterEntry) {
            const dependents = familyDetails.filter(
              (d) => d.master_id === masterEntry.master_id
            );

            relationships = dependents
              .map((dep) => {
                const depPatient = patientMap.get(dep.identifier);
                if (!depPatient) return null;

                const relation = normalizeRelationship(
                  dep.relationType,
                  depPatient.gender,
                  patient.gender
                );

                return {
                  relationType: relation,
                  patientId: depPatient.patient_id,
                  patientIdentifier: dep.identifier,
                  patientName: `${dep.given_name} ${dep.middle_name || ''
                    } ${dep.family_name}`.trim(),
                };
              })
              .filter((r) => r !== null);

            if (relationships.length > 0) {
              needsUpdate = true;
              isDependant = false;
            }
          }
        }

        if (patient.patient_type === 'DEPENDANT') {
          const dependentEntry = familyDetails.find(
            (d) => d.identifier === patient.patient_identifier
          );
          if (dependentEntry) {
            const master = familyMasters.find(
              (m) => m.master_id === dependentEntry.master_id
            );
            if (master) {
              const masterPatient = patientMap.get(master.identifier);
              if (masterPatient) {
                const relation = normalizeRelationship(
                  dependentEntry.relationType,
                  patient.gender,
                  masterPatient.gender
                );

                relationships.push({
                  relationType: relation,
                  patientId: masterPatient.patient_id,
                  patientIdentifier: master.identifier,
                  patientName: `${master.given_name} ${master.middle_name || ''
                    } ${master.family_name}`.trim(),
                });
                needsUpdate = true;
                isDependant = true;
              }
            }
          }
        }

        if (needsUpdate) {
          await client.query(
            `
            UPDATE registration.patient
            SET relationship = $1,
                is_dependant = $2,
                updated_at = NOW()
            WHERE patient_id = $3
            `,
            [JSON.stringify(relationships), isDependant, patient.patient_id]
          );
          updatedCount++;
        }
      }

      await client.query('COMMIT');
      return { totalUpdated: updatedCount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PatientService();
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
          patient_info TEXT,
          identifications TEXT,
          verified BOOLEAN,
          verification_process VARCHAR(255),
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
      console.log("Table registration.patient created successfully.");
    }

    const limit = 1000;
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

        const [patientIdentifiers] = await mysqlDB.query(
          `SELECT * FROM patient_identifier WHERE patient_id = ?`,
          [originalPatientId]
        );
        const existingPatient = await pgPool.query(
          `SELECT patient_identifier FROM registration.patient WHERE patient_identifier = $1`,
          [patientIdentifiers[0]?.identifier]
        );

        if (existingPatient.rows.length > 0) {
          console.log(
            `Patient with Identifier ${patientIdentifiers[0]?.identifier} already exists. Skipping...`
          );
          skippedPatients.push(originalPatientId);
          continue;
        }

        // Fetch related data
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
        const [personName] = await mysqlDB.query(
          `SELECT * FROM person_name WHERE person_id = ?`,
          [originalPatientId]
        );
        const [familyAttribute] = await mysqlDB.query(
          `SELECT * FROM family_member_master_table WHERE identifier = ?`,
          [patientIdentifiers[0]?.identifier]
        );
        const [familyMemberAttribute] = await mysqlDB.query(
          `SELECT * FROM family_member_master_table_details WHERE identifier = ?`,
          [patientIdentifiers[0]?.identifier]
        );

        // Fetch email from person_attribute
        const [emailResult] = await mysqlDB.query(
          `
          SELECT pi.identifier, pa.value
          FROM person_attribute pa
          LEFT JOIN person_attribute_type pat ON pa.person_attribute_type_id = pat.person_attribute_type_id
          LEFT JOIN patient_identifier pi ON pa.person_id = pi.patient_id
          WHERE pat.name = 'Email Address'
          AND pi.identifier = ?
          ORDER BY pa.date_created DESC LIMIT 1
          `,
          [patientIdentifiers[0]?.identifier]
        );

        // Validate if the value is an email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const email = emailResult && emailResult.length > 0 && emailRegex.test(emailResult[0].value)
          ? emailResult[0].value
          : "";
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
          name: `${personName[0]?.given_name || ""} ${
            personName[0]?.middle_name || ""
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
          identifications: "",
          patient_info: JSON.stringify({
            bloodGroup: "",
            maritalStatus: "",
            religion: "",
            fatherNameEnglish: "",
            motherNameEnglish: "",
            spouseName: "",
            relativeName: "",
          }),
          address: personAddress[0]
            ? JSON.stringify({
                address: "",
                division: "",
                district: personAddress[0]?.county_district,
                upazila: personAddress[0]?.city_village,
                addressLine: personAddress[0]?.address1,
              })
            : null,
          contact_info: patientSearch[0] || email
            ? JSON.stringify({
                phone: patientSearch[0]?.phone_no || "",
                email: email || "",
              })
            : null,
          relationship: "[]",
          organization_id: process.env.ORGANIZATION_ID,
          hospital_id: process.env.HOSPITAL_ID,
          patientType:
            familyMemberAttribute.length > 0
              ? "DEPENDENT"
              : familyAttribute.length > 0
              ? "GOVERNMENT"
              : "NON_GOVERNMENT",
        };

        await pgPool.query(
          `
          INSERT INTO registration.patient (
            patient_id, patient_identifier, created_at, updated_at, created_by, updated_by, status, reason_to_delete,
            name, first_name, middle_name, last_name, dob, gender, is_dead, death_date, death_reason,
            identifications, patient_info, address, contact_info, relationship, organization_id, hospital_id, patient_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
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
    res.status(500).send({ message: "Error migrating patients", error: error.message });
  } finally {
    if (pgPool) {
      await pgPool.end();
    }
  }
};

exports.updatePatientRelationships = async (req, res) => {
  let pgPool;
  try {
    pgPool = await connectPostgresDB();
    // Fetch all patients from PostgreSQL
    const patientsResult = await pgPool.query(
      `SELECT patient_id, patient_identifier, gender, patient_type 
       FROM registration.patient`
    );
    const patients = patientsResult.rows;

    // Fetch family data from MySQL
    const [familyMasters] = await mysqlDB.query(
      `SELECT * FROM family_member_master_table`
    );
    const [familyDetails] = await mysqlDB.query(
      `SELECT * FROM family_member_master_table_details`
    );

    let updatedCount = 0;

    // Create a map for quick patient lookup
    const patientMap = new Map(
      patients.map(p => [p.patient_identifier, p])
    );
    for (const patient of patients) {
      let relationships = [];
      let isDependant = false;
      let needsUpdate = false;

      // Normalize relationship function with "wife" mapping
      const normalizeRelationship = (relation, patientGender, relatedGender) => {
        // Handle null/undefined or empty relation
        if (!relation || relation.trim() === "") {
          return "OTHER";
        }

        // Clean the input: remove extra characters, normalize spaces, and convert to uppercase
        let cleanedRelation = relation
          .replace(/[^a-zA-Z\s]/g, "") // Remove special characters like '\'
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "_"); // Replace spaces with underscores
  
        // Map common variations to standard types
        switch (cleanedRelation) {
          case "FATHER_IN_LAW":
            return relatedGender === "MALE" ? "FATHER_IN_LAW" : "MOTHER_IN_LAW";
          case "MOTHER_IN_LAW":
            return relatedGender === "FEMALE" ? "MOTHER_IN_LAW" : "FATHER_IN_LAW";
          case "FATHER":
            return patientGender === "MALE" ? "FATHER" : "MOTHER";
          case "MOTHER":
            return patientGender === "FEMALE" ? "MOTHER" : "FATHER";
          case "SON":
            return patientGender === "MALE" ? "SON" : "DAUGHTER";
          case "DAUGHTER":
            return patientGender === "FEMALE" ? "DAUGHTER" : "SON";
          case "BROTHER":
            return patientGender === "MALE" ? "BROTHER" : "SISTER";
          case "SISTER":
            return patientGender === "FEMALE" ? "SISTER" : "BROTHER";
          case "SPOUSE":
          case "WIFE": // Map "wife" to "SPOUSE"
          case "HUSBAND": // Optionally map "husband" to "SPOUSE" as well
            return "SPOUSE";
          case "SON_IN_LAW":
            return patientGender === "MALE" ? "SON_IN_LAW" : "DAUGHTER_IN_LAW";
          case "DAUGHTER_IN_LAW":
            return patientGender === "FEMALE" ? "DAUGHTER_IN_LAW" : "SON_IN_LAW";
          case "UNCLE":
            return patientGender === "MALE" ? "UNCLE" : "AUNT";
          case "AUNT":
            return patientGender === "FEMALE" ? "AUNT" : "UNCLE";
          case "NEPHEW":
            return patientGender === "MALE" ? "NEPHEW" : "NIECE";
          case "NIECE":
            return patientGender === "FEMALE" ? "NIECE" : "NEPHEW";
          case "GRANDFATHER":
            return patientGender === "MALE" ? "GRANDFATHER" : "GRANDMOTHER";
          case "GRANDMOTHER":
            return patientGender === "FEMALE" ? "GRANDMOTHER" : "GRANDFATHER";
          case "GRANDSON":
            return patientGender === "MALE" ? "GRANDSON" : "GRANDDAUGHTER";
          case "GRANDDAUGHTER":
            return patientGender === "FEMALE" ? "GRANDDAUGHTER" : "GRANDSON";
          default:
            return "OTHER";
        }
      };

      // Handle GOVERNMENT employees
      if (patient.patient_type === "GOVERNMENT") {
        const masterEntry = familyMasters.find(
          m => m.identifier === patient.patient_identifier
        );
        if (masterEntry) {
          const dependents = familyDetails.filter(
            d => d.master_id === masterEntry.master_id
          );

          relationships = dependents
            .map(dep => {
              const depPatient = patientMap.get(dep.identifier);
              if (!depPatient) return null;

              const relation = normalizeRelationship(
                dep.relationType,
                depPatient.gender,
                patient.gender // For in-law relationships
              );

              return {
                relationType: relation,
                patientId: depPatient.patient_id,
                patientIdentifier: dep.identifier,
                patientName: `${dep.given_name} ${dep.middle_name || ''} ${dep.family_name}`.trim()
              };
            })
            .filter(r => r !== null);

          if (relationships.length > 0) {
            needsUpdate = true;
            isDependant = false;
          }
        }
      }

      // Handle DEPENDENT patients
      if (patient.patient_type === "DEPENDENT") {
        const dependentEntry = familyDetails.find(
          d => d.identifier === patient.patient_identifier
        );
        if (dependentEntry) {
          const master = familyMasters.find(
            m => m.master_id === dependentEntry.master_id
          );
          if (master) {
            const masterPatient = patientMap.get(master.identifier);
            if (masterPatient) {
              const relation = normalizeRelationship(
                dependentEntry.relationType,
                patient.gender,
                masterPatient.gender // For in-law relationships
              );

              relationships.push({
                relationType: relation,
                patientId: masterPatient.patient_id,
                patientIdentifier: master.identifier,
                patientName: `${master.given_name} ${master.middle_name || ''} ${master.family_name}`.trim()
              });
              needsUpdate = true;
              isDependant = true;
            }
          }
        }
      }

      // Update patient if relationships were found
      if (needsUpdate) {
        await pgPool.query(
          `
          UPDATE registration.patient
          SET relationship = $1,
              is_dependant = $2,
              updated_at = NOW()
          WHERE patient_id = $3
          `,
          [
            JSON.stringify(relationships),
            isDependant,
            patient.patient_id
          ]
        );
        updatedCount++;
      }
    }

    res.status(200).send({
      message: "Patient relationships updated successfully.",
      totalUpdated: updatedCount,
    });
  } catch (error) {
    console.error("Error updating patient relationships:", error);
    res.status(500).send({ 
      message: "Error updating patient relationships", 
      error: error.message 
    });
  } finally {
    if (pgPool) await pgPool.end();
  }
};
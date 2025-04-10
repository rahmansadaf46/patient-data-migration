const { mysqlDB } = require("../config/db");
const Patient = require("../models/User");

exports.getAllUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    let offset = parseInt(req.query.offset) || 0;

    let totalMigrated = 0;
    let patients = [];

    // Fetch data in batches from MySQL with pagination using limit and offset
    [patients] = await mysqlDB.query(
      `SELECT * FROM patient_search LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    if (patients.length > 0) {
      // Map MySQL data to MongoDB model format
      const mongoPatients = patients.map((patient) => ({
        patient_id: patient.patient_id,
        identifier: patient.identifier,
        fullname: patient.fullname,
        given_name: patient.given_name,
        middle_name: patient.middle_name,
        family_name: patient.family_name,
        gender: patient.gender,
        birthdate: patient.birthdate,
        age: patient.age,
        person_name_id: patient.person_name_id,
        photo: patient.photo,
      }));

      // Insert non-duplicate patients into MongoDB
      for (let i = 0; i < mongoPatients.length; i++) {
        const existingPatient = await Patient.findOne({
          patient_id: mongoPatients[i].patient_id,
        });

        if (!existingPatient) {
          await Patient.create(mongoPatients[i]);
          totalMigrated += 1;
        }
      }

      // Return success message with total migrated patients
      res.json({
        message: "Data migration completed",
        totalMigrated,
        nextOffset: offset + limit, // Add this to show the next offset for the next request
      });
    } else {
      res.json({
        message: "No more data to migrate.",
        totalMigrated: 0,
        nextOffset: offset,
      });
    }
  } catch (error) {
    console.error("Error during migration:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.addPatient = async (req, res) => {
  try {
    const {
      patient_id,
      identifier,
      fullname,
      given_name,
      middle_name,
      family_name,
      gender,
      birthdate,
      age,
      person_name_id,
      photo,
    } = req.body;
    const existingPatient = await Patient.findOne({ patient_id });

    if (existingPatient) {
      return res
        .status(400)
        .json({ message: "Patient with this ID already exists." });
    }

    const newPatient = new Patient({
      patient_id,
      identifier,
      fullname,
      given_name,
      middle_name,
      family_name,
      gender,
      birthdate,
      age,
      person_name_id,
      photo,
    });

    await newPatient.save();
    res
      .status(201)
      .json({ message: "Patient added successfully", patient: newPatient });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

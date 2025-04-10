const Patient = require("../models/PatientModel");

exports.getAllPatientList = async (req, res) => {
    try {
        const patients = await Patient.find();
        const totalPatients = patients.length;
        res.status(200).json({
            total: totalPatients,  
            patients: patients  
        });
    } catch (error) {
        console.error("❌ Error fetching patients:", error);
        res.status(500).json({ message: "Failed to fetch patient data", error: error.message });
    }
};

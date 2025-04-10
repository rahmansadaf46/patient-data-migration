const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    name: { type: String, required: true },
    retired: { type: Number, required: true }, // Ensure this is a Number
    created_on: { type: Date, required: true },
    created_by: { type: String, required: true },
    department_concept: [
        {
            id: { type: Number, required: true },
            department_id: { type: Number, required: true },
            concept_id: { type: Number, required: true },
            type_concept: { type: String, required: true },
            created_on: { type: Date, required: true },
            created_by: { type: String, required: true }
        }
    ],
    department_ward: [
        {
            department_id: { type: Number, required: true },
            ward_id: { type: Number, required: true }
        }
    ]
});

module.exports = mongoose.model("Department", departmentSchema);
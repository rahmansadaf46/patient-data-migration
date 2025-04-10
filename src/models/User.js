const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
    {
        patient_id: { type: Number, required: true, unique: true },
        identifier: { type: String, maxlength: 30 },
        fullname: { type: String, maxlength: 200 },
        given_name: { type: String, maxlength: 60 },
        middle_name: { type: String, maxlength: 60 },
        family_name: { type: String, maxlength: 60 },
        gender: { type: String, enum: ["Male", "Female", "Other", "M", "F","O"] },
        birthdate: { type: String },
        age: { type: Number, min: 0 },
        person_name_id: { type: Number },
        photo: { type: Buffer },
      }, 
      { timestamps: true }
    
)

module.exports = mongoose.model('User',userSchema)
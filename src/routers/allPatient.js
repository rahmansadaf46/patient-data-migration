const express = require("express");
const {getAllPatientList } = require("../controllers/allPatient");

const router = express.Router();

router.get("/allPatients", getAllPatientList);
module.exports = router;

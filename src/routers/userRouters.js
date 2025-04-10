const express = require("express");
const {getAllUsers,addPatient} = require("../controllers/userController")

const router = express.Router();

router.get("/users", getAllUsers)
router.post("/add-user", addPatient)
module.exports = router;
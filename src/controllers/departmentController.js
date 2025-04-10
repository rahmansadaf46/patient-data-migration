const { mysqlDB, connectDB } = require("../config/db");
const Department = require("../models/Department");

exports.getAllDepartments = async (req, res) => {
    try {
        await connectDB();

        const [departments] = await mysqlDB.query("SELECT * FROM department");

        for (const dept of departments) {
            const [concepts] = await mysqlDB.query("SELECT * FROM department_concept WHERE department_id = ?", [dept.id]);
            const [wards] = await mysqlDB.query("SELECT * FROM department_ward WHERE department_id = ?", [dept.id]);

            // Handle Buffer data for `retired`
            const retired = dept.retired instanceof Buffer ? dept.retired.readUInt8(0) : Number(dept.retired);

            const departmentData = {
                id: dept.id,
                name: dept.name,
                retired: retired, // Use the converted value
                created_on: dept.created_on,
                created_by: dept.created_by,
                department_concept: concepts.map(concept => ({
                    id: concept.id,
                    department_id: concept.department_id,
                    concept_id: concept.concept_id,
                    type_concept: concept.type_concept,
                    created_on: concept.created_on,
                    created_by: concept.created_by
                })),
                department_ward: wards.map(ward => ({
                    department_id: ward.department_id,
                    ward_id: ward.ward_id
                }))
            };

            await Department.create(departmentData);
        }

        res.status(200).json({ message: "Department data migration completed" });

    } catch (error) {
        console.error("Migration failed:", error);
        res.status(500).json({ message: "Error occurred during migration", error: error.message });
    }
};

exports.createDepartment = async(req,res)=>{
    try{
        const { id, name, retired, created_on, created_by, department_concept, department_ward } = req.body;

        if (!id || !name || retired === undefined || !created_on || !created_by) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const newDepartment = new Department({
            id,
            name,
            retired,
            created_on,
            created_by,
            department_concept,
            department_ward
        });
        await newDepartment.save();
        res.status(201).json({ message: "Department created successfully", department: newDepartment });

    }catch (error) {
        res.status(500).json({ message: "Error creating department", error: error.message });
    }
}


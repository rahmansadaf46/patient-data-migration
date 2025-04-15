const { mysqlPool, pharmacyPostgresPool } = require('../config/database');
const logger = require('../config/logger');
const config = require('../config/env');
const { v4: uuidv4 } = require('uuid');

class PharmacyService {
  async createPharmacyTablesIfNotExists() {
    const client = await pharmacyPostgresPool.connect();
    try {
      // Check if the 'pharmacy' schema exists
      const schemaCheck = await client.query(
        `SELECT EXISTS (
        SELECT FROM pg_namespace 
        WHERE nspname = 'pharmacy'
      )`
      );

      if (!schemaCheck.rows[0].exists) {
        logger.info('Creating pharmacy schema...');
        await client.query(`CREATE SCHEMA pharmacy`);
        logger.info('Schema pharmacy created successfully.');
      }

      logger.info('Checking/creating pharmacy tables...');

      // Dosage table
      const dosageCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'dosage'
        )`
      );
      if (!dosageCheck.rows[0].exists) {
        logger.info('Creating pharmacy.dosage table...');
        await client.query(`
          CREATE TABLE pharmacy.dosage (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            dosage VARCHAR(255) NOT NULL
          );
        `);
        logger.info('Table pharmacy.dosage created.');
      }

      // Medicine Categories table
      const categoryCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'medicine_categories'
        )`
      );
      if (!categoryCheck.rows[0].exists) {
        logger.info('Creating pharmacy.medicine_categories table...');
        await client.query(`
          CREATE TABLE pharmacy.medicine_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            atc_code VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            created_by VARCHAR(50),
            updated_by VARCHAR(50)
          );
        `);
        logger.info('Table pharmacy.medicine_categories created.');
      }

      // Generic Name table
      const genericNameCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'generic_name'
        )`
      );
      if (!genericNameCheck.rows[0].exists) {
        logger.info('Creating pharmacy.generic_name table...');
        await client.query(`
          CREATE TABLE pharmacy.generic_name (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL
          );
        `);
        logger.info('Table pharmacy.generic_name created.');
      }

      // Formulation Type table
      const formulationTypeCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'formulation_type'
        )`
      );
      if (!formulationTypeCheck.rows[0].exists) {
        logger.info('Creating pharmacy.formulation_type table...');
        await client.query(`
          CREATE TABLE pharmacy.formulation_type (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            formulation_type VARCHAR(255) NOT NULL
          );
        `);
        logger.info('Table pharmacy.formulation_type created.');
      }

      // Manufacturer table
      const manufacturerCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'manufacturer'
        )`
      );
      if (!manufacturerCheck.rows[0].exists) {
        logger.info('Creating pharmacy.manufacturer table...');
        await client.query(`
          CREATE TABLE pharmacy.manufacturer (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            manufacturer VARCHAR(255) NOT NULL
          );
        `);
        logger.info('Table pharmacy.manufacturer created.');
      }

      // Route table
      const routeCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'route'
        )`
      );
      if (!routeCheck.rows[0].exists) {
        logger.info('Creating pharmacy.route table...');
        await client.query(`
          CREATE TABLE pharmacy.route (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            route VARCHAR(255) NOT NULL
          );
        `);
        logger.info('Table pharmacy.route created.');
      }

      // Formulations table
      const formulationsCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'formulations'
        )`
      );
      if (!formulationsCheck.rows[0].exists) {
        logger.info('Creating pharmacy.formulations table...');
        await client.query(`
          CREATE TABLE pharmacy.formulations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            formulation_type_id UUID NOT NULL,
            dosage_id UUID NOT NULL,
            route_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            created_by VARCHAR(50),
            updated_by VARCHAR(50),
            FOREIGN KEY (formulation_type_id) REFERENCES pharmacy.formulation_type(id),
            FOREIGN KEY (dosage_id) REFERENCES pharmacy.dosage(id),
            FOREIGN KEY (route_id) REFERENCES pharmacy.route(id)
          );
        `);
        logger.info('Table pharmacy.formulations created.');
      }

      // Medicines table
      const medicinesCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'medicines'
        )`
      );
      if (!medicinesCheck.rows[0].exists) {
        logger.info('Creating pharmacy.medicines table...');
        await client.query(`
          CREATE TABLE pharmacy.medicines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID,
            hospital_id UUID,
            brand_name VARCHAR(255) NOT NULL,
            generic_name_id UUID NOT NULL,
            category_id UUID NOT NULL,
            manufacturer_id UUID NOT NULL,
            formulation_id UUID NOT NULL,
            ref_code VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            created_by VARCHAR(50),
            updated_by VARCHAR(50),
            FOREIGN KEY (generic_name_id) REFERENCES pharmacy.generic_name(id),
            FOREIGN KEY (category_id) REFERENCES pharmacy.medicine_categories(id),
            FOREIGN KEY (manufacturer_id) REFERENCES pharmacy.manufacturer(id),
            FOREIGN KEY (formulation_id) REFERENCES pharmacy.formulations(id)
          );
        `);
        logger.info('Table pharmacy.medicines created.');
      }

      // Pharmacy Locations table
      const pharmacyLocationsCheck = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'pharmacy' AND tablename = 'pharmacy_locations'
        )`
      );
      if (!pharmacyLocationsCheck.rows[0].exists) {
        logger.info('Creating pharmacy.pharmacy_locations table...');
        await client.query(`
          CREATE TABLE pharmacy.pharmacy_locations (
            id BIGINT GENERATED BY DEFAULT AS IDENTITY (INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1) PRIMARY KEY,
            organization_id UUID NOT NULL,
            hospital_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            location_type VARCHAR(50) NOT NULL,
            address VARCHAR(255),
            parent_location_id BIGINT,
            uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20),
            reason_to_update TEXT,
            reason_to_delete TEXT
          );
  
          CREATE INDEX idx_pharmacy_locations_hospital_id ON pharmacy.pharmacy_locations USING btree (hospital_id ASC NULLS LAST);
          CREATE INDEX idx_pharmacy_locations_organization_id ON pharmacy.pharmacy_locations USING btree (organization_id ASC NULLS LAST);
        `);
        logger.info('Table pharmacy.pharmacy_locations created.');
      }

      // Pharmacy Stocks table
      const pharmacyStocksCheck = await client.query(
        `SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'pharmacy' AND tablename = 'pharmacy_stocks'
      )`
      );
      if (!pharmacyStocksCheck.rows[0].exists) {
        logger.info('Creating pharmacy.pharmacy_stocks table...');
        await client.query(`
        CREATE TABLE pharmacy.pharmacy_stocks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID NOT NULL,
          hospital_id UUID NOT NULL,
          location_id BIGINT NOT NULL,
          ref_medicine_id UUID NOT NULL,
          sku VARCHAR(100) NOT NULL,
          name VARCHAR(255) NOT NULL,
          category_id UUID NOT NULL,
          formulation_id UUID NOT NULL,
          stock_status VARCHAR(50) NOT NULL,
          quantity INTEGER NOT NULL,
          remains_after_hold_quantity INTEGER NOT NULL,
          reorder_level INTEGER NOT NULL,
          challan_number VARCHAR(255),
          uuid UUID DEFAULT gen_random_uuid() UNIQUE,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITHOUT TIME ZONE,
          created_by UUID,
          updated_by UUID,
          status VARCHAR(20),
          reason_to_update TEXT,
          reason_to_delete TEXT,
          CONSTRAINT pharmacy_stocks_sku_key UNIQUE (sku),
          CONSTRAINT uk_location_ref_medicine UNIQUE (location_id, ref_medicine_id),
          CONSTRAINT fk_pharmacy_stocks_location FOREIGN KEY (location_id) 
            REFERENCES pharmacy.pharmacy_locations (id),
          CONSTRAINT chk_pharmacy_quantity CHECK (quantity >= 0),
          CONSTRAINT chk_pharmacy_remains_after_hold_quantity CHECK (remains_after_hold_quantity >= 0)
        );

        CREATE INDEX idx_pharmacy_stock_medicine ON pharmacy.pharmacy_stocks USING btree (ref_medicine_id ASC NULLS LAST);
      `);
        logger.info('Table pharmacy.pharmacy_stocks created.');
      }
    } catch (error) {
      logger.error('Error creating pharmacy tables', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  // Existing migratePharmacy method (unchanged, assuming it’s already updated with uppercase normalization)
  async migratePharmacy() {
    await this.createPharmacyTablesIfNotExists();
    const client = await pharmacyPostgresPool.connect();
    let totalMigrated = {
      dosage: 0,
      categories: 0,
      genericNames: 0,
      formulationTypes: 0,
      manufacturers: 0,
      routes: 0,
    };
    const skippedItems = {
      dosage: [],
      categories: [],
      genericNames: [],
      formulationTypes: [],
      manufacturers: [],
      routes: [],
    };

    try {
      await client.query('BEGIN');

      // Insert static Route data
      const routes = [
        'Oral',
        'Injection/IV',
        'Topical',
        'Respiratory',
        'Ophthalmic',
        'Nasal',
        'Rectal/Vaginal',
        'Other',
      ];
      for (const route of routes) {
        const trimmedRoute = route.trim();
        const existingRoute = await client.query(
          `SELECT route FROM pharmacy.route WHERE route = $1`,
          [trimmedRoute]
        );
        if (existingRoute.rows.length === 0) {
          await client.query(
            `INSERT INTO pharmacy.route (route) VALUES ($1)`,
            [trimmedRoute]
          );
          totalMigrated.routes++;
        } else {
          skippedItems.routes.push(trimmedRoute);
        }
      }

      // Insert static Manufacturer data
      const manufacturers = ['Bangladesh Medicine Ltd.'];
      for (const manufacturer of manufacturers) {
        const trimmedManufacturer = manufacturer.trim();
        const existingManufacturer = await client.query(
          `SELECT manufacturer FROM pharmacy.manufacturer WHERE manufacturer = $1`,
          [trimmedManufacturer]
        );
        if (existingManufacturer.rows.length === 0) {
          await client.query(
            `INSERT INTO pharmacy.manufacturer (manufacturer) VALUES ($1)`,
            [trimmedManufacturer]
          );
          totalMigrated.manufacturers++;
        } else {
          skippedItems.manufacturers.push(trimmedManufacturer);
        }
      }

      // Migrate Dosage
      const [dosageResult] = await mysqlPool.query(
        `
        SELECT 
          TRIM(dozage) AS dosage
        FROM 
          inventory_drug_formulation 
        GROUP BY 
          dozage
        `
      );
      for (const item of dosageResult) {
        const trimmedDosage = item.dosage ? item.dosage.trim() : null;
        if (!trimmedDosage) {
          skippedItems.dosage.push(trimmedDosage);
          continue;
        }
        const existingDosage = await client.query(
          `SELECT dosage FROM pharmacy.dosage WHERE dosage = $1`,
          [trimmedDosage]
        );
        if (existingDosage.rows.length === 0) {
          await client.query(
            `INSERT INTO pharmacy.dosage (dosage) VALUES ($1)`,
            [trimmedDosage]
          );
          totalMigrated.dosage++;
        } else {
          skippedItems.dosage.push(trimmedDosage);
        }
      }

      // Migrate Medicine Categories
      const [categoryResult] = await mysqlPool.query(
        `
        SELECT 
          TRIM(ic.name) AS name,
          TRIM(ic.description) AS description
        FROM 
          inventory_drug_category ic
        `
      );
      for (const item of categoryResult) {
        const trimmedName = item.name ? item.name.trim() : null;
        const trimmedDescription = item.description ? item.description.trim() : null;
        if (!trimmedName) {
          skippedItems.categories.push(trimmedName);
          continue;
        }
        const existingCategory = await client.query(
          `SELECT name FROM pharmacy.medicine_categories WHERE name = $1`,
          [trimmedName]
        );
        if (existingCategory.rows.length === 0) {
          await client.query(
            `
            INSERT INTO pharmacy.medicine_categories (
              name, description, created_at
            ) VALUES ($1, $2, NOW())
            `,
            [trimmedName, trimmedDescription]
          );
          totalMigrated.categories++;
        } else {
          skippedItems.categories.push(trimmedName);
        }
      }

      // Migrate Generic Names
      const [genericNameResult] = await mysqlPool.query(
        `
        SELECT
          TRIM(name) AS generic_name
        FROM
          inventory_drug
        GROUP BY
          name
        `
      );
      for (const item of genericNameResult) {
        const trimmedGenericName = item.generic_name ? item.generic_name.trim() : null;
        if (!trimmedGenericName) {
          skippedItems.genericNames.push(trimmedGenericName);
          continue;
        }
        const existingGenericName = await client.query(
          `SELECT name FROM pharmacy.generic_name WHERE name = $1`,
          [trimmedGenericName]
        );
        if (existingGenericName.rows.length === 0) {
          await client.query(
            `INSERT INTO pharmacy.generic_name (name) VALUES ($1)`,
            [trimmedGenericName]
          );
          totalMigrated.genericNames++;
        } else {
          skippedItems.genericNames.push(trimmedGenericName);
        }
      }

      // Migrate Formulation Types
      const [formulationTypeResult] = await mysqlPool.query(
        `
        SELECT DISTINCT
          UPPER(TRIM(name)) AS formulation_type
        FROM
          inventory_drug_formulation
        `
      );
      for (const item of formulationTypeResult) {
        const trimmedFormulationType = item.formulation_type ? item.formulation_type.trim() : null;
        if (!trimmedFormulationType) {
          skippedItems.formulationTypes.push(trimmedFormulationType);
          continue;
        }
        const existingFormulationType = await client.query(
          `SELECT formulation_type FROM pharmacy.formulation_type WHERE formulation_type = $1`,
          [trimmedFormulationType]
        );
        if (existingFormulationType.rows.length === 0) {
          await client.query(
            `INSERT INTO pharmacy.formulation_type (formulation_type) VALUES ($1)`,
            [trimmedFormulationType]
          );
          totalMigrated.formulationTypes++;
        } else {
          skippedItems.formulationTypes.push(trimmedFormulationType);
        }
      }

      await client.query('COMMIT');
      logger.info('Pharmacy migration completed.', { totalMigrated, skippedItems });
      return { totalMigrated, skippedItems };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error during pharmacy migration', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  // Existing migrateFormulations method (unchanged, assuming it’s already updated)
  async migrateFormulations() {
    await this.createPharmacyTablesIfNotExists();
    const client = await pharmacyPostgresPool.connect();
    let totalMigrated = 0;
    const skippedItems = [];

    try {
      await client.query('BEGIN');

      const [formulationResult] = await mysqlPool.query(`
        SELECT
          UPPER(TRIM(name)) AS formulationTypeName,
          TRIM(dozage) AS dosageName
        FROM
          inventory_drug_formulation
      `);

      const routeMapping = {
        'Oral': [
          'TABLET', 'CAPSULE', 'CAPSUL', 'CAPSULES', 'SYRUP', 'LIQUID SYRUP', 'ORAL',
          'ORAL GEL', 'PACKET', 'DRY SYRUP', 'SUSPENSION', 'SUSPENSION 125', 'VITAMIN'
        ].map(item => item.trim()),
        'Injection/IV': [
          'INJECTION', 'INJECTION 100ML', 'INJECTION- 200MG', 'IV 600', 'IV 600 INFUSION',
          'IV 600 INFUSION-300ML', 'IV400 INFUSION', 'INFUSION', 'INFUTION', 'INFUTION-',
          'INSULIN', 'INSULIN-', 'BI PHASIC PREMIX', 'GLARGINE', 'NEUTRAL ISOPHANE', 'R 100',
          'REGULAR'
        ].map(item => item.trim()),
        'Topical': [
          'CREAM', 'GEL', 'LOTION', 'SKIN OINMENT', 'SHAMPOO', 'APPLICATION', 'OINMENT', 'JEL'
        ].map(item => item.trim()),
        'Respiratory': [
          'INHALER', 'INHALER HFA', 'NEBULE', 'NEBULIZER', '2 PUFF S/L'
        ].map(item => item.trim()),
        'Ophthalmic': [
          'EYE DROP', 'EYE OINMENT'
        ].map(item => item.trim()),
        'Nasal': [
          'NASAL DROP'
        ].map(item => item.trim()),
        'Rectal/Vaginal': [
          'SUPPOSITORY', 'CONDOM'
        ].map(item => item.trim()),
        'Other': [
          'MOUTHWASH', 'SPRAY', 'SALINE', 'BAG', 'SOLUTION', 'WATER', 'FORTE 400', 'WRONG', 'N/A'
        ].map(item => item.trim()),
      };

      const findRouteName = (formulationTypeName) => {
        const trimmedFormulationTypeName = formulationTypeName ? formulationTypeName.trim() : '';
        for (const [routeName, formulationTypes] of Object.entries(routeMapping)) {
          if (formulationTypes.includes(trimmedFormulationTypeName)) {
            return routeName.trim();
          }
        }
        return 'Other';
      };

      for (const item of formulationResult) {
        const { formulationTypeName, dosageName } = item;

        const trimmedFormulationTypeName = formulationTypeName ? formulationTypeName.trim() : null;
        const trimmedDosageName = dosageName ? dosageName.trim() : null;

        if (!trimmedFormulationTypeName || !trimmedDosageName) {
          skippedItems.push({
            formulationTypeName: trimmedFormulationTypeName,
            dosageName: trimmedDosageName,
            reason: 'Missing required fields'
          });
          continue;
        }

        let formulationTypeQuery = await client.query(
          `SELECT id FROM pharmacy.formulation_type WHERE formulation_type = $1`,
          [trimmedFormulationTypeName]
        );
        let formulationTypeId;
        if (formulationTypeQuery.rows.length === 0) {
          logger.info(`Creating missing formulation_type: ${trimmedFormulationTypeName}`);
          await client.query(
            `INSERT INTO pharmacy.formulation_type (formulation_type) VALUES ($1)`,
            [trimmedFormulationTypeName]
          );
          formulationTypeQuery = await client.query(
            `SELECT id FROM pharmacy.formulation_type WHERE formulation_type = $1`,
            [trimmedFormulationTypeName]
          );
        }
        formulationTypeId = formulationTypeQuery.rows[0].id;

        let dosageQuery = await client.query(
          `SELECT id FROM pharmacy.dosage WHERE dosage = $1`,
          [trimmedDosageName]
        );
        let dosageId;
        if (dosageQuery.rows.length === 0) {
          logger.info(`Creating missing dosage: ${trimmedDosageName}`);
          await client.query(
            `INSERT INTO pharmacy.dosage (dosage) VALUES ($1)`,
            [trimmedDosageName]
          );
          dosageQuery = await client.query(
            `SELECT id FROM pharmacy.dosage WHERE dosage = $1`,
            [trimmedDosageName]
          );
        }
        dosageId = dosageQuery.rows[0].id;

        const routeName = findRouteName(trimmedFormulationTypeName);
        const trimmedRouteName = routeName.trim();

        let routeQuery = await client.query(
          `SELECT id FROM pharmacy.route WHERE route = $1`,
          [trimmedRouteName]
        );
        let routeId;
        if (routeQuery.rows.length === 0) {
          logger.info(`Creating missing route: ${trimmedRouteName}`);
          await client.query(
            `INSERT INTO pharmacy.route (route) VALUES ($1)`,
            [trimmedRouteName]
          );
          routeQuery = await client.query(
            `SELECT id FROM pharmacy.route WHERE route = $1`,
            [trimmedRouteName]
          );
        }
        routeId = routeQuery.rows[0].id;

        const existingFormulation = await client.query(
          `
          SELECT id FROM pharmacy.formulations 
          WHERE formulation_type_id = $1 AND dosage_id = $2 AND route_id = $3
          `,
          [formulationTypeId, dosageId, routeId]
        );

        if (existingFormulation.rows.length === 0) {
          await client.query(
            `
            INSERT INTO pharmacy.formulations (
              formulation_type_id, dosage_id, route_id, created_at
            ) VALUES ($1, $2, $3, NOW())
            `,
            [formulationTypeId, dosageId, routeId]
          );
          totalMigrated++;
        } else {
          skippedItems.push({
            formulationTypeName: trimmedFormulationTypeName,
            dosageName: trimmedDosageName,
            reason: 'Duplicate formulation'
          });
        }
      }

      await client.query('COMMIT');
      logger.info('Formulations migration completed.', { totalMigrated, skippedItems });
      return { totalMigrated, skippedItems };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error during formulations migration', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  // New method to migrate medicines
  async migrateMedicines() {
    await this.createPharmacyTablesIfNotExists();
    const client = await pharmacyPostgresPool.connect();
    let totalMigrated = 0;
    const skippedItems = [];

    try {
      await client.query('BEGIN');

      // Fetch the manufacturerId for "Bangladesh Medicine Ltd."
      const manufacturerQuery = await client.query(
        `SELECT id FROM pharmacy.manufacturer WHERE manufacturer = $1`,
        ['Bangladesh Medicine Ltd.']
      );
      if (manufacturerQuery.rows.length === 0) {
        throw new Error('Manufacturer "Bangladesh Medicine Ltd." not found in pharmacy.manufacturer');
      }
      const manufacturerId = manufacturerQuery.rows[0].id;

      // Fetch medicine data from MySQL
      const [medicineResult] = await mysqlPool.query(`
        SELECT
          idff.name AS formulationTypeName,
          idff.dozage AS dosageName,
          id.name AS brandName,
          id.name AS genericName,
          idc.name AS category_name
        FROM inventory_drug id
        LEFT JOIN inventory_drug_formulations idf ON id.drug_id = idf.drug_id
        LEFT JOIN inventory_drug_formulation idff ON idf.formulation_id = idff.id
        LEFT JOIN inventory_drug_category idc ON id.category_id = idc.id
      `);

      for (const item of medicineResult) {
        const { formulationTypeName, dosageName, brandName, genericName, category_name } = item;

        // Trim and normalize values
        const trimmedFormulationTypeName = formulationTypeName ? formulationTypeName.trim().toUpperCase() : null;
        const trimmedDosageName = dosageName ? dosageName.trim() : null;
        const trimmedBrandName = brandName ? brandName.trim() : null;
        const trimmedGenericName = genericName ? genericName.trim() : null;
        const trimmedCategoryName = category_name ? category_name.trim() : null;

        // Validate required fields
        if (!trimmedBrandName || !trimmedGenericName || !trimmedCategoryName || !trimmedFormulationTypeName || !trimmedDosageName) {
          skippedItems.push({
            brandName: trimmedBrandName,
            genericName: trimmedGenericName,
            categoryName: trimmedCategoryName,
            formulationTypeName: trimmedFormulationTypeName,
            dosageName: trimmedDosageName,
            reason: 'Missing required fields'
          });
          continue;
        }

        // Find or create genericNameId
        let genericNameQuery = await client.query(
          `SELECT id FROM pharmacy.generic_name WHERE name = $1`,
          [trimmedGenericName]
        );
        let genericNameId;
        if (genericNameQuery.rows.length === 0) {
          logger.info(`Creating missing generic_name: ${trimmedGenericName}`);
          await client.query(
            `INSERT INTO pharmacy.generic_name (name) VALUES ($1)`,
            [trimmedGenericName]
          );
          genericNameQuery = await client.query(
            `SELECT id FROM pharmacy.generic_name WHERE name = $1`,
            [trimmedGenericName]
          );
        }
        genericNameId = genericNameQuery.rows[0].id;

        // Find or create categoryId
        let categoryQuery = await client.query(
          `SELECT id FROM pharmacy.medicine_categories WHERE name = $1`,
          [trimmedCategoryName]
        );
        let categoryId;
        if (categoryQuery.rows.length === 0) {
          logger.info(`Creating missing medicine_category: ${trimmedCategoryName}`);
          await client.query(
            `INSERT INTO pharmacy.medicine_categories (name, created_at) VALUES ($1, NOW())`,
            [trimmedCategoryName]
          );
          categoryQuery = await client.query(
            `SELECT id FROM pharmacy.medicine_categories WHERE name = $1`,
            [trimmedCategoryName]
          );
        }
        categoryId = categoryQuery.rows[0].id;

        // Find formulationId (requires formulationTypeName, dosageName, and route)
        const routeMapping = {
          'Oral': [
            'TABLET', 'CAPSULE', 'CAPSUL', 'CAPSULES', 'SYRUP', 'LIQUID SYRUP', 'ORAL',
            'ORAL GEL', 'PACKET', 'DRY SYRUP', 'SUSPENSION', 'SUSPENSION 125', 'VITAMIN'
          ].map(item => item.trim()),
          'Injection/IV': [
            'INJECTION', 'INJECTION 100ML', 'INJECTION- 200MG', 'IV 600', 'IV 600 INFUSION',
            'IV 600 INFUSION-300ML', 'IV400 INFUSION', 'INFUSION', 'INFUTION', 'INFUTION-',
            'INSULIN', 'INSULIN-', 'BI PHASIC PREMIX', 'GLARGINE', 'NEUTRAL ISOPHANE', 'R 100',
            'REGULAR'
          ].map(item => item.trim()),
          'Topical': [
            'CREAM', 'GEL', 'LOTION', 'SKIN OINMENT', 'SHAMPOO', 'APPLICATION', 'OINMENT', 'JEL'
          ].map(item => item.trim()),
          'Respiratory': [
            'INHALER', 'INHALER HFA', 'NEBULE', 'NEBULIZER', '2 PUFF S/L'
          ].map(item => item.trim()),
          'Ophthalmic': [
            'EYE DROP', 'EYE OINMENT'
          ].map(item => item.trim()),
          'Nasal': [
            'NASAL DROP'
          ].map(item => item.trim()),
          'Rectal/Vaginal': [
            'SUPPOSITORY', 'CONDOM'
          ].map(item => item.trim()),
          'Other': [
            'MOUTHWASH', 'SPRAY', 'SALINE', 'BAG', 'SOLUTION', 'WATER', 'FORTE 400', 'WRONG', 'N/A'
          ].map(item => item.trim()),
        };

        const findRouteName = (formulationTypeName) => {
          const trimmedFormulationTypeName = formulationTypeName ? formulationTypeName.trim() : '';
          for (const [routeName, formulationTypes] of Object.entries(routeMapping)) {
            if (formulationTypes.includes(trimmedFormulationTypeName)) {
              return routeName.trim();
            }
          }
          return 'Other';
        };

        const routeName = findRouteName(trimmedFormulationTypeName);
        const trimmedRouteName = routeName.trim();

        // Find or create formulation_type
        let formulationTypeQuery = await client.query(
          `SELECT id FROM pharmacy.formulation_type WHERE formulation_type = $1`,
          [trimmedFormulationTypeName]
        );
        let formulationTypeId;
        if (formulationTypeQuery.rows.length === 0) {
          logger.info(`Creating missing formulation_type: ${trimmedFormulationTypeName}`);
          await client.query(
            `INSERT INTO pharmacy.formulation_type (formulation_type) VALUES ($1)`,
            [trimmedFormulationTypeName]
          );
          formulationTypeQuery = await client.query(
            `SELECT id FROM pharmacy.formulation_type WHERE formulation_type = $1`,
            [trimmedFormulationTypeName]
          );
        }
        formulationTypeId = formulationTypeQuery.rows[0].id;

        // Find or create dosage
        let dosageQuery = await client.query(
          `SELECT id FROM pharmacy.dosage WHERE dosage = $1`,
          [trimmedDosageName]
        );
        let dosageId;
        if (dosageQuery.rows.length === 0) {
          logger.info(`Creating missing dosage: ${trimmedDosageName}`);
          await client.query(
            `INSERT INTO pharmacy.dosage (dosage) VALUES ($1)`,
            [trimmedDosageName]
          );
          dosageQuery = await client.query(
            `SELECT id FROM pharmacy.dosage WHERE dosage = $1`,
            [trimmedDosageName]
          );
        }
        dosageId = dosageQuery.rows[0].id;

        // Find or create route
        let routeQuery = await client.query(
          `SELECT id FROM pharmacy.route WHERE route = $1`,
          [trimmedRouteName]
        );
        let routeId;
        if (routeQuery.rows.length === 0) {
          logger.info(`Creating missing route: ${trimmedRouteName}`);
          await client.query(
            `INSERT INTO pharmacy.route (route) VALUES ($1)`,
            [trimmedRouteName]
          );
          routeQuery = await client.query(
            `SELECT id FROM pharmacy.route WHERE route = $1`,
            [trimmedRouteName]
          );
        }
        routeId = routeQuery.rows[0].id;

        // Find or create formulation
        let formulationQuery = await client.query(
          `
          SELECT id FROM pharmacy.formulations 
          WHERE formulation_type_id = $1 AND dosage_id = $2 AND route_id = $3
          `,
          [formulationTypeId, dosageId, routeId]
        );
        let formulationId;
        if (formulationQuery.rows.length === 0) {
          logger.info(`Creating missing formulation for formulation_type: ${trimmedFormulationTypeName}, dosage: ${trimmedDosageName}`);
          await client.query(
            `
            INSERT INTO pharmacy.formulations (
              formulation_type_id, dosage_id, route_id, created_at
            ) VALUES ($1, $2, $3, NOW())
            `,
            [formulationTypeId, dosageId, routeId]
          );
          formulationQuery = await client.query(
            `
            SELECT id FROM pharmacy.formulations 
            WHERE formulation_type_id = $1 AND dosage_id = $2 AND route_id = $3
            `,
            [formulationTypeId, dosageId, routeId]
          );
        }
        formulationId = formulationQuery.rows[0].id;

        // Check for existing medicine (to avoid duplicates)
        const existingMedicine = await client.query(
          `
          SELECT id FROM pharmacy.medicines 
          WHERE brand_name = $1 AND generic_name_id = $2 AND category_id = $3 AND formulation_id = $4
          `,
          [trimmedBrandName, genericNameId, categoryId, formulationId]
        );

        if (existingMedicine.rows.length === 0) {
          // Insert into medicines table
          await client.query(
            `
            INSERT INTO pharmacy.medicines (
              brand_name, generic_name_id, category_id, manufacturer_id, formulation_id, organization_id, hospital_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            `,
            [trimmedBrandName, genericNameId, categoryId, manufacturerId, formulationId, config.get('organization_id'), config.get('hospital_id')]
          );
          totalMigrated++;
        } else {
          skippedItems.push({
            brandName: trimmedBrandName,
            genericName: trimmedGenericName,
            categoryName: trimmedCategoryName,
            formulationTypeName: trimmedFormulationTypeName,
            dosageName: trimmedDosageName,
            reason: 'Duplicate medicine'
          });
        }
      }

      await client.query('COMMIT');
      logger.info('Medicines migration completed.', { totalMigrated, skippedItems });
      return { totalMigrated, skippedItems };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error during medicines migration', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  async migratePharmacyLocations() {
    await this.createPharmacyTablesIfNotExists();
    const client = await pharmacyPostgresPool.connect();
    let totalMigrated = 0;
    const skippedItems = [];

    try {
      await client.query('BEGIN');

      // Insert SKH-warehouse (WAREHOUSE)
      let warehouseResult = await client.query(
        `
        INSERT INTO pharmacy.pharmacy_locations (
          organization_id, hospital_id, name, location_type, parent_location_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
        `,
        [
          config.get('organization_id'),
          config.get('hospital_id'),
          'SKH-warehouse',
          'WAREHOUSE',
          0,
          'ACTIVE'
        ]
      );
      const warehouseId = warehouseResult.rows[0].id;
      totalMigrated++;

      // Insert SKH-mainstore (CENTRAL_STORE) with parent as SKH-warehouse
      let mainstoreResult = await client.query(
        `
        INSERT INTO pharmacy.pharmacy_locations (
          organization_id, hospital_id, name, location_type, parent_location_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
        `,
        [
          config.get('organization_id'),
          config.get('hospital_id'),
          'SKH-mainstore',
          'CENTRAL_STORE',
          warehouseId,
          'ACTIVE'
        ]
      );
      const mainstoreId = mainstoreResult.rows[0].id;
      totalMigrated++;

      // Insert Pharmacy Indoor (SUB_STORE) with parent as SKH-mainstore
      await client.query(
        `
        INSERT INTO pharmacy.pharmacy_locations (
          organization_id, hospital_id, name, location_type, parent_location_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `,
        [
          config.get('organization_id'),
          config.get('hospital_id'),
          'Pharmacy Indoor',
          'SUB_STORE',
          mainstoreId,
          'ACTIVE'
        ]
      );
      totalMigrated++;

      // Insert Pharmacy Outdoor (SUB_STORE) with parent as SKH-mainstore
      await client.query(
        `
        INSERT INTO pharmacy.pharmacy_locations (
          organization_id, hospital_id, name, location_type, parent_location_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `,
        [
          config.get('organization_id'),
          config.get('hospital_id'),
          'Pharmacy Outdoor',
          'SUB_STORE',
          mainstoreId,
          'ACTIVE'
        ]
      );
      totalMigrated++;

      await client.query('COMMIT');
      logger.info('Pharmacy locations migration completed.', { totalMigrated, skippedItems });
      return { totalMigrated, skippedItems };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error during pharmacy locations migration', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  async migratePharmacyStocks() {
    await this.createPharmacyTablesIfNotExists();
    const client = await pharmacyPostgresPool.connect();
    let totalMigrated = 0;
    const skippedItems = [];
  
    // Function to generate a random 5-character code (uppercase letters and numbers)
    const generateRandomCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };
  
    try {
      await client.query('BEGIN');
  
      // Fetch specific pharmacy locations by name
      const locationResult = await client.query(`
        SELECT id, name 
        FROM pharmacy.pharmacy_locations 
        WHERE name IN ($1, $2, $3, $4)
      `, ['SKH-warehouse', 'SKH-mainstore', 'Pharmacy Indoor', 'Pharmacy Outdoor']);
      const locations = locationResult.rows;
      
      if (locations.length !== 4) {
        throw new Error('Required pharmacy locations not found. Please migrate pharmacy locations first.');
      }
  
      // Fetch medicine data from pharmacy.medicines
      const medicineResult = await client.query(`
        SELECT 
          m.id as ref_medicine_id,
          m.brand_name as name,
          mc.name as sku,
          m.category_id as category_id,
          m.formulation_id as formulation_id
        FROM pharmacy.medicines as m
        LEFT JOIN pharmacy.medicine_categories as mc
          ON m.category_id = mc.id
      `);
      const medicines = medicineResult.rows;
  
      if (medicines.length === 0) {
        throw new Error('No medicines found. Please migrate medicines first.');
      }
  
      // For each medicine, create stock entries for all 4 locations
      for (const medicine of medicines) {
        const { ref_medicine_id, name, sku, category_id, formulation_id } = medicine;
  
        // Validate required fields
        if (!ref_medicine_id || !name || !sku || !category_id || !formulation_id) {
          skippedItems.push({
            ref_medicine_id,
            name,
            reason: 'Missing required fields'
          });
          continue;
        }
  
        // Generate SKU prefix (first 5 characters of the category name, uppercase)
        const skuPrefix = sku.substring(0, 5).toUpperCase();
  
        // Create stock entry for each location
        for (const location of locations) {
          const { id: location_id } = location;
  
          // Generate a unique SKU for each stock entry
          const randomCode = generateRandomCode();
          const formattedSku = `${skuPrefix}-${randomCode}`; // e.g., "VITAM-D8C78"
  
          // Check for existing stock entry to avoid duplicates (based on unique constraint location_id, ref_medicine_id)
          const existingStock = await client.query(
            `
            SELECT id FROM pharmacy.pharmacy_stocks 
            WHERE location_id = $1 AND ref_medicine_id = $2
            `,
            [location_id, ref_medicine_id]
          );
  
          if (existingStock.rows.length > 0) {
            skippedItems.push({
              ref_medicine_id,
              location_id,
              reason: 'Duplicate stock entry'
            });
            continue;
          }
  
          // Generate a unique ID for the stock entry
          const stockId = uuidv4();
  
          // Insert stock entry with the generated id
          await client.query(
            `
            INSERT INTO pharmacy.pharmacy_stocks (
              id, organization_id, hospital_id, location_id, ref_medicine_id, sku, name, category_id, 
              formulation_id, stock_status, quantity, remains_after_hold_quantity, reorder_level, 
              challan_number, status, reason_to_update, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
            `,
            [
              stockId, // Use the generated ID
              config.get('organization_id'),
              config.get('hospital_id'),
              location_id,
              ref_medicine_id,
              formattedSku,
              name,
              category_id,
              formulation_id,
              'OUT_OF_STOCK',
              0, // quantity
              0, // remains_after_hold_quantity
              100, // reorder_level
              'initial-0000', // challan_number
              'ACTIVE', // status
              'Auto Generated' // reason_to_update
            ]
          );
          totalMigrated++;
        }
      }
  
      await client.query('COMMIT');
      logger.info('Pharmacy stocks migration completed.', { totalMigrated, skippedItems });
      return { totalMigrated, skippedItems };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error during pharmacy stocks migration', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PharmacyService();
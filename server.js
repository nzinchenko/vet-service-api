const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

//Schema for owner
const ownerSchema = {
    type: "object",
    properties: {
        first_name: { type: "string", minLength: 2 },
        last_name:  { type: "string", minLength: 2 },
        phone:      { type: "string", minLength: 10, pattern: "^[0-9+]+$" }, 
        email:      { type: "string", format: "email" }
    },
    required: ["first_name", "last_name", "phone"],
    additionalProperties: false
};

//Schema for cats
const catSchema = {
    type: "object",
    properties: {
        name:     { type: "string", minLength: 1 },
        gender:   { type: "string", enum: ["Male", "Female"] },
        breed:    { type: "string" },
        color:    { type: "string" },
        age:      { type: "integer", minimum: 0, maximum: 30 },
        owner_id: { type: "integer" }
    },
    required: ["name", "owner_id"],
    additionalProperties: false
};

//Schema for visits
const visitSchema = {
    type: "object",
    properties: {
        cat_id:     { type: "integer" },
        visit_date: { type: "string", format: "date-time" },
        reason:     { type: "string", minLength: 3 },
        notes:      { type: "string" }
    },
    required: ["cat_id", "visit_date", "reason"],
    additionalProperties: false
};

function validateDto(schema) {
    const validate = ajv.compile(schema);
    return (req, res, next) => {
        const valid = validate(req.body);
        if (!valid) {
            return res.status(400).json({
                error: "Data validation error (AJV)",
                details: validate.errors.map(err => ({
                    field: err.instancePath.replace('/', ''), 
                    message: err.message 
                }))
            });
        }
        next(); 
    };
}

require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.get('/', (req, res) => {
    res.json({
        message: "Veterinary API",
        endpoints: {
            owners: "GET /api/owners",
            owner_add: "POST /api/owners",
            owner_update: "PUT /api/owners/:id",
            owner_cats: "GET /api/owners/:id/cats",
            cat_add: "POST /api/cats",
            cats_full: "GET /api/cats-info",
            cat_update: "PUT /api/cats/:id",
            visit_add: "POST /api/visits",
            visit_update: "PUT /api/visits/:id",
            visit_delete: "DELETE /api/visits/:id",
            visit_info: "GET /api/visit"
        }
    });
});

//Get owners
app.get('/api/owners', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM owners ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Add new owners
app.post('/api/owners', validateDto(ownerSchema), async (req, res) => {
    try {
        const { first_name, last_name, phone, email } = req.body;
        const result = await pool.query(
            'INSERT INTO owners (first_name, last_name, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [first_name, last_name, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Update owner info
app.put('/api/owners/:id', validateDto(ownerSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, email } = req.body;
        const result = await pool.query(
            'UPDATE owners SET first_name = $1, last_name = $2, phone = $3, email = $4 WHERE id = $5 RETURNING *',
            [first_name, last_name, phone, email, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "this owner not found" });
        }
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//All cats by owner id
app.get('/api/owners/:id/cats', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM cats WHERE owner_id = $1 ORDER BY id DESC', [id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Add new cats
app.post('/api/cats', validateDto(catSchema), async (req, res) => {
    try {
        const { name, breed, color, age, gender, owner_id } = req.body;
        const result = await pool.query(
            'INSERT INTO cats (name, gender, breed, color, age, owner_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, gender, breed, color, age, owner_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Update cats info
app.put('/api/cats/:id', validateDto(catSchema),  async (req, res) => {
    try {
        const { id } = req.params;
        const { name, breed, color, age, gender, owner_id } = req.body;
        const result = await pool.query(
            'UPDATE cats SET name = $1, gender = $2, breed = $3, color = $4, age = $5, owner_id = $6 WHERE id = $7 RETURNING *',
            [name, gender, breed, color, age, owner_id, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "This cat not found" });
        }
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Get cat and his owner
app.get('/api/cats-info', async (req, res) => {
    try {
        const query = `
            SELECT 
                cats.id, 
                cats.name AS cat_name, 
                cats.breed, 
                cats.age,
                owners.first_name, 
                owners.last_name,
                owners.phone AS owner_phone
            FROM cats
            LEFT JOIN owners ON cats.owner_id = owners.id
            ORDER BY cats.id DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Add visit
app.post('/api/visits', validateDto(visitSchema), async (req, res) => {
    try {
        const { cat_id, visit_date, reason, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO visits (cat_id, visit_date, reason, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [cat_id, visit_date, reason, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Update info about visit
app.put('/api/visits/:id', validateDto(visitSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { visit_date, reason, notes } = req.body;
        
        const result = await pool.query(
            'UPDATE visits SET visit_date = $1, reason = $2, notes = $3 WHERE id = $4 RETURNING *',
            [visit_date, reason, notes, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "This visit not found" });
        }
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Delete visit
app.delete('/api/visits/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM visits WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "This visit not found" });
        }
        res.json({ message: "This visit is deleted successfully!", deletedVisit: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//Get all visit info
app.get('/api/visit', async (req, res) => {
    try {
        const query = `
            SELECT 
                visits.id AS visit_id,
                visits.visit_date,
                visits.reason,
                cats.name AS cat_name,
                cats.breed AS cat_breed,
                owners.first_name AS owner_name,
                owners.last_name AS owner_surname,
                owners.phone AS owner_contact
            FROM visits
            JOIN cats ON visits.cat_id = cats.id
            JOIN owners ON cats.owner_id = owners.id
            ORDER BY visits.visit_date ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
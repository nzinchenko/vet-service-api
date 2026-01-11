import { Request, Response, NextFunction, Router } from 'express';
import { pool } from './db';
import { QueryResult } from 'pg';
import Ajv, { Schema } from 'ajv';
import addFormats from 'ajv-formats';
import { ownerSchema, catSchema, visitSchema, Owner, Cat, Visit } from './types';
import { StatusCodes } from 'http-status-codes';

const router = Router();

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

//Middleware
export const validateDto = (schema: Schema) => {
    const validate = ajv.compile(schema);

    return (req: Request, res: Response, next: NextFunction) => {
        if (!validate(req.body)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: "Validation error",
                details: validate.errors
            });
        }
        next();
    };
};

// Get owners
router.get('/owners', async (req, res) => {
    try {
        const result: QueryResult<Owner> = await pool.query('SELECT * FROM owners ORDER BY id DESC');
        res.json(result.rows);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// Add new owners
router.post('/owners', validateDto(ownerSchema), async (req, res) => {
    try {
        const { first_name, last_name, phone, email } = req.body as Owner;
        const result = await pool.query(
            'INSERT INTO owners (first_name, last_name, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
            [first_name, last_name, phone, email]
        );
        res.status(StatusCodes.CREATED).json(result.rows[0]);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// Update owner info
router.put('/owners/:id', validateDto(ownerSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, email } = req.body as Owner;
        const result = await pool.query(
            'UPDATE owners SET first_name = $1, last_name = $2, phone = $3, email = $4 WHERE id = $5 RETURNING *',
            [first_name, last_name, phone, email, id]
        );
        if (result.rows.length === 0) return res.status(StatusCodes.NOT_FOUND).json({ message: "This owner not found" });
        res.json(result.rows[0]);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// All cats by owner id
router.get('/owners/:id/cats', async (req, res) => {
    try {
        const { id } = req.params;
        const result: QueryResult<Cat> = await pool.query('SELECT * FROM cats WHERE owner_id = $1 ORDER BY id DESC', [id]);
        res.json(result.rows);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// Add new cats
router.post('/cats', validateDto(catSchema), async (req, res) => {
    try {
        const { name, breed, color, age, gender, owner_id } = req.body as Cat;
        const result = await pool.query(
            'INSERT INTO cats (name, gender, breed, color, age, owner_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, gender, breed, color, age, owner_id]
        );
        res.status(StatusCodes.CREATED).json(result.rows[0]);
    } catch (err: any) { 
        if (err.code === '23503') return res.status(StatusCodes.BAD_REQUEST).json({ error: "The owner with this ID doesn`t exist." });
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); 
    }
});

// Update cats info
router.put('/cats/:id', validateDto(catSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, breed, color, age, gender, owner_id } = req.body as Cat;
        const result = await pool.query(
            'UPDATE cats SET name = $1, gender = $2, breed = $3, color = $4, age = $5, owner_id = $6 WHERE id = $7 RETURNING *',
            [name, gender, breed, color, age, owner_id, id]
        );
        if (result.rows.length === 0) return res.status(StatusCodes.NOT_FOUND).json({ message: "This cat not found" });
        res.json(result.rows[0]);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// Get cat and his owner
router.get('/cats-info', async (req, res) => {
    try {
       const query = `
            SELECT cats.id, cats.name, cats.breed, cats.age, 
                   owners.first_name, owners.last_name, owners.phone 
            FROM cats LEFT JOIN owners ON cats.owner_id = owners.id 
            ORDER BY cats.id DESC;`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// Add visit
router.post('/visits', validateDto(visitSchema), async (req, res) => {
    try {
        const { cat_id, visit_date, reason, notes } = req.body as Visit;
        const result = await pool.query(
            'INSERT INTO visits (cat_id, visit_date, reason, notes) VALUES ($1, $2, $3, $4) RETURNING *',
            [cat_id, visit_date, reason, notes]
        );
        res.status(StatusCodes.CREATED).json(result.rows[0]);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// Update info about visit
router.put('/visits/:id', validateDto(visitSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { visit_date, reason, notes } = req.body as Visit;
        const result = await pool.query(
            'UPDATE visits SET visit_date = $1, reason = $2, notes = $3 WHERE id = $4 RETURNING *',
            [visit_date, reason, notes, id]
        );
        if (result.rows.length === 0) return res.status(StatusCodes.NOT_FOUND).json({ message: "This visit not found" });
        res.json(result.rows[0]);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// Delete visit
router.delete('/visits/:id', validateDto(visitSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM visits WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "This visit not found" });
        res.json({ message: "This visit successfully canceled" });
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

// Get all visits info
router.get('/visits', async (req, res) => {
    try {
        const query = `
            SELECT visits.id, visits.visit_date, visits.reason, 
                   cats.name AS cat_name, owners.first_name, owners.phone 
            FROM visits 
            JOIN cats ON visits.cat_id = cats.id 
            JOIN owners ON cats.owner_id = owners.id 
            ORDER BY visits.visit_date ASC;`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err: any) { res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message }); }
});

export default router;
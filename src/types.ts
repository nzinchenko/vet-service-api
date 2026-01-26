import Ajv, { Schema } from 'ajv';
import addFormats from 'ajv-formats';

export enum CatGender {
    Male = 'Male',
    Female = 'Female'
}

export interface Person { 
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
}

export interface Owner extends Person {
    id?: number;
}

export interface Cat {
    id?: number;
    name: string;
    breed?: string;
    color?: string;
    age?: number;
    gender?: CatGender;
    ownerId: number;
}

export interface Visit {
    id?: number;
    catId: number;
    visitDate: string;
    reason: string;
    notes?: string;
}

// JSON Schema (AJV)
export const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const ownerSchema: Schema = {
    type: "object",
    properties: {
        firstName: { type: "string", minLength: 2 },
        lastName:  { type: "string", minLength: 2 },
        phone:      { type: "string", minLength: 10, pattern: "^[0-9+]+$" },
        email:      { type: "string", format: "email" }
    },
    required: ["firstName", "lastName", "phone"],
    additionalProperties: false
};

export const catSchema: Schema = {
    type: "object",
    properties: {
        name:     { type: "string", minLength: 1 },
        breed:    { type: "string" },
        color:    { type: "string" },
        age:      { type: "integer", minimum: 0, maximum: 30 },
        gender: {
            type: "string",
            enum: Object.values(CatGender)
        },
        ownerId: { type: "integer" }
    },
    required: ["name", "ownerId"],
    additionalProperties: false
};

export const visitSchema: Schema = {
    type: "object",
    properties: {
        catId:     { type: "integer" },
        visitDate: { type: "string", format: "date-time" },
        reason:     { type: "string", minLength: 3 },
        notes:      { type: "string" }
    },
    required: ["catId", "visitDate", "reason"],
    additionalProperties: false
};



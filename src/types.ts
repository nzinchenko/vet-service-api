import Ajv, { Schema } from 'ajv';
import addFormats from 'ajv-formats';

export enum CatGender {
    Male = 'Male',
    Female = 'Female'
}

export interface Person { 
    first_name: string;
    last_name: string;
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
    owner_id: number;
}

export interface Visit {
    id?: number;
    cat_id: number;
    visit_date: string;
    reason: string;
    notes?: string;
}

//JSON Schema (AJV)
export const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const ownerSchema: Schema = {
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
        owner_id: { type: "integer" }
    },
    required: ["name", "owner_id"],
    additionalProperties: false
};

export const visitSchema: Schema = {
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



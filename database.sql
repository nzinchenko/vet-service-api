--1. CREATE DATABASE cats_db;

-- 2. Owners table
CREATE TABLE owners (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(30)
);

-- 3. Cats table
CREATE TABLE cats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(25) NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female')),
    breed VARCHAR(50),
    color VARCHAR(50),
    age INTEGER,
    owner_id INTEGER,
    CONSTRAINT fk_owner FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL
);

-- 4. Visit table
CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    cat_id INTEGER NOT NULL,
    visit_date TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    CONSTRAINT fk_cat FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE
);

-- 5. Test data
-- Create owner
INSERT INTO owners (first_name, last_name, phone, email) 
VALUES ('Ivan', 'Ivanov', '+380505050505', 'ivan@gmail.com');

-- Create cat for this owner (owner_id=1)
INSERT INTO cats (name, gender, breed, color, age, owner_id) 
VALUES ('Test', 'Male', 'British', 'Grey', 3, 1);

-- Create visit for this cat (cat_id=1)
INSERT INTO visits (cat_id, visit_date, reason, notes) 
VALUES (1, '2025-05-20 10:00:00', 'Vaccination', 'The procedure was successfull');
# Veterinary Service API :cat::hospital:
A simple REST API for managing cats and their owners.  
The project is built with Node.js, Express, PostgreSQL, and TypeScript.

## :pushpin:Features 
- **Owners:** Registration and editing of client contact details.  
- **Cats:** Pet management linked to an owner (One-to-Many Relation).  
- **Visits:** Appointment scheduling, medical history, and doctor's notes.  
- **Data Security:** Strict input validation (AJV) — prevents adding a cat with negative age or invalid date formats.  
- **Complex Reports:** Utilizing SQL JOIN to retrieve combined information (e.g., daily schedule with owner names and pet names).

## :satellite:API Documentation
### :bust_in_silhouette:Owners
- `GET /api/owners` — List all clients
- `POST /api/owners` — Add a new client
- `PUT /api/owners/:id` — Update client data
- `GET /api/owners/:id/cats` — Show all cats of a specific owner
### :cat:Cats
- `POST /api/cats` — Patient registration
- `PUT /api/cats/:id` — Update patient record
- `GET /api/cats-details` — Get cats with owner details
### :calendar:Visit
- `GET /api/visits` — Full visits schedule 
- `POST /api/visits` — Book an appointment
- `PUT /api/visits/:id` — Reschedule a visit
- `DELETE /api/visits/:id` — Cancel a visit

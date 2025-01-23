# OffersPlus API Documentation

## Authentication
All API endpoints except for token generation require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Get JWT Token
```http
POST /api/token/
Content-Type: application/json

{
    "username": "string",
    "password": "string"
}
```

### Refresh JWT Token
```http
POST /api/token/refresh/
Content-Type: application/json

{
    "refresh": "string"
}
```

## Companies API

### List Companies
```http
GET /api/companies/
Authorization: Bearer <token>
```

### Create Company
```http
POST /api/companies/
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string",
    "description": "string",
    "website": "string (url)",
    "location": "string"
}
```

### Get Company
```http
GET /api/companies/{id}/
Authorization: Bearer <token>
```

### Update Company
```http
PUT /api/companies/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "string",
    "description": "string",
    "website": "string (url)",
    "location": "string"
}
```

### Delete Company
```http
DELETE /api/companies/{id}/
Authorization: Bearer <token>
```

## Jobs API

### List Jobs
```http
GET /api/jobs/
Authorization: Bearer <token>
```

Query Parameters:
- `company`: Filter by company ID

### Create Job
```http
POST /api/jobs/
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "string",
    "company": "integer",
    "description": "string",
    "requirements": "string",
    "location": "string",
    "salary_range": "string",
    "employment_type": "string (FULL_TIME|PART_TIME|CONTRACT|INTERNSHIP)",
    "status": "string (OPEN|CLOSED|DRAFT)",
    "deadline": "string (date-time)"
}
```

### Get Job
```http
GET /api/jobs/{id}/
Authorization: Bearer <token>
```

### Update Job
```http
PUT /api/jobs/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "string",
    "company": "integer",
    "description": "string",
    "requirements": "string",
    "location": "string",
    "salary_range": "string",
    "employment_type": "string (FULL_TIME|PART_TIME|CONTRACT|INTERNSHIP)",
    "status": "string (OPEN|CLOSED|DRAFT)",
    "deadline": "string (date-time)"
}
```

### Delete Job
```http
DELETE /api/jobs/{id}/
Authorization: Bearer <token>
```

### Apply for Job
```http
POST /api/jobs/{id}/apply/
Authorization: Bearer <token>
```

## Application Records API

### List Application Records
```http
GET /api/applications/
Authorization: Bearer <token>
```

### Create Application Record
```http
POST /api/applications/
Authorization: Bearer <token>
Content-Type: application/json

{
    "outcome": "string (TO DO|IN PROGRESS|REFER|REJECT(Resume)|REJECT(VO)|REJECT(OA)|VO|OA)",
    "job_title": "string",
    "company_name": "string",
    "application_link": "string",
    "OA_date": "string (date-time)",
    "VO_date": "string (date-time)"
}
```

### Get Application Record
```http
GET /api/applications/{id}/
Authorization: Bearer <token>
```

### Update Application Record
```http
PUT /api/applications/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
    "outcome": "string (TO DO|IN PROGRESS|REFER|REJECT(Resume)|REJECT(VO)|REJECT(OA)|VO|OA)",
    "job_title": "string",
    "company_name": "string",
    "application_link": "string",
    "OA_date": "string (date-time)",
    "VO_date": "string (date-time)"
}
```

### Delete Application Record
```http
DELETE /api/applications/{id}/
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
    "id": "integer",
    ...other fields specific to the model
    "created_at": "string (date-time)",
    "updated_at": "string (date-time)"
}
```

### Error Response
```json
{
    "detail": "string",
    "code": "string"
}
```

## Common Error Codes
- `401`: Authentication credentials were not provided or are invalid
- `403`: You do not have permission to perform this action
- `404`: The requested resource was not found
- `400`: Bad request (validation error)
- `405`: Method not allowed

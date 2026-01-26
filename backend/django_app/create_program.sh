# Set your token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0OTM1NTI4LCJpYXQiOjE3NjQ5MzE5MjgsImp0aSI6IjI0ZjFiMjk1MzgxYjRiMWZiZGI2ZWU3MjhiN2ZiMTc0IiwidXNlcl9pZCI6IjQifQ.KKnz-x-g9QD8vBTZbic_Q9mG7sEYGH2NIHTMEAPgSLQ"

# List Programs
curl -X GET http://localhost:8000/api/v1/programs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Get Program by ID
curl -X GET http://localhost:8000/api/v1/programs/{program-id}/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"

# Create Program
curl -X POST http://localhost:8000/api/v1/programs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Cybersecurity Fundamentals",
    "category": "technical",
    "description": "Learn cybersecurity basics",
    "duration_months": 6,
    "default_price": 1000.00,
    "currency": "USD",
    "status": "active"
  }'

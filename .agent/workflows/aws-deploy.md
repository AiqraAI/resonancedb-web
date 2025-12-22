---
description: Deploy ResonanceDB to AWS EC2 and RDS
---

# AWS Deployment Workflow

## Connection Credentials

### EC2 Instance (API Server)
- **Region**: ap-southeast-1 (Singapore)
- **Host**: ec2-18-141-205-67.ap-southeast-1.compute.amazonaws.com
- **User**: ec2-user
- **Key File**: `resonancedb-key.pem` (in project root)

### RDS PostgreSQL Database
- **Endpoint**: resonancedb.c98e8gec41j1.ap-southeast-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: resonancedb
- **Username**: postgres

---

## SSH Connection

```bash
# Make key readable (first time only)
chmod 400 resonancedb-key.pem

# Connect to EC2
ssh -i "resonancedb-key.pem" ec2-user@ec2-18-141-205-67.ap-southeast-1.compute.amazonaws.com
```

---

## Deploy API (Step 3.4)

After connecting via SSH:

```bash
# Clone the repo
git clone https://github.com/AiqraAI/resonancedb-web.git
cd resonancedb-web

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@resonancedb.c98e8gec41j1.ap-southeast-1.rds.amazonaws.com:5432/resonancedb
API_KEY_SECRET=your-random-secret-key-here
CORS_ORIGINS=["*"]
EOF

# Start the API
docker-compose up -d

# Check if running
docker ps
curl http://localhost:8000/docs
```

---

## Test API (Step 3.5)

- API Docs: http://18.141.205.67:8000/docs
- Health Check: http://18.141.205.67:8000/health

---

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update code
git pull
docker-compose up -d --build
```

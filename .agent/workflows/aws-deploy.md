---
description: Deploy ResonanceDB to AWS EC2 and RDS
---

# AWS Deployment Workflow

## Live Endpoints

- **API**: http://44.211.73.228:8000/
- **API Docs**: http://44.211.73.228:8000/docs
- **Frontend**: http://44.211.73.228:3000/

---

## Connection Credentials

### EC2 Instance (API + Frontend)
- **Region**: us-east-1
- **Public IP**: 44.211.73.228
- **User**: ec2-user
- **Key File**: `resonancedb-key.pem` (in project root)

### RDS PostgreSQL Database
- **Endpoint**: resonancedb.c98e8gec41j1.ap-southeast-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: resonancedb
- **Username**: postgres
- **Password**: YourSecurePassword123!

---

## SSH Connection

```bash
# Windows - fix key permissions first
icacls "resonancedb-key.pem" /inheritance:r /grant:r "%USERNAME%:(R)"

# Connect to EC2
ssh -i "resonancedb-key.pem" ec2-user@44.211.73.228
```

---

## Deploy Commands

```bash
cd resonancedb-web

# Pull latest code
git pull

# Rebuild and restart services
docker compose -f docker-compose.ec2.yml down
docker compose -f docker-compose.ec2.yml build --no-cache
docker compose -f docker-compose.ec2.yml up -d

# View logs
docker compose -f docker-compose.ec2.yml logs -f
```

---

## Environment Variables (.env)

Located at `/home/ec2-user/resonancedb-web/.env`:

```
DATABASE_URL=postgresql+asyncpg://postgres:YourSecurePassword123!@resonancedb.c98e8gec41j1.ap-southeast-1.rds.amazonaws.com:5432/resonancedb
API_KEY_SECRET=resonancedb-api-secret-key-2024-secure
```

---

## Troubleshooting

### Disk Full
```bash
docker system prune -af
docker builder prune -af
df -h
```

### View Container Logs
```bash
docker logs resonancedb-api
docker logs resonancedb-web
```

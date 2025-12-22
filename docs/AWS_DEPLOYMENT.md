# ResonanceDB AWS Deployment Guide

Deploy ResonanceDB to AWS EC2 with RDS PostgreSQL for a production-ready setup.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           AWS Cloud                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     VPC (10.0.0.0/16)                        │    │
│  │                                                               │    │
│  │  ┌─────────────────────────────────────────────────────┐     │    │
│  │  │              Public Subnet (10.0.1.0/24)             │     │    │
│  │  │  ┌─────────────────────────────────────────────┐     │     │    │
│  │  │  │            EC2 Instance (t3.medium)          │     │     │    │
│  │  │  │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │     │     │    │
│  │  │  │  │ Traefik │ │   API   │ │   Frontend      │ │     │     │    │
│  │  │  │  │  :80    │ │  :8000  │ │     :3000       │ │     │     │    │
│  │  │  │  │  :443   │ │         │ │                 │ │     │     │    │
│  │  │  │  └─────────┘ └─────────┘ └─────────────────┘ │     │     │    │
│  │  │  │  ┌─────────────────────────────────────────┐ │     │     │    │
│  │  │  │  │              Redis :6379                │ │     │     │    │
│  │  │  │  └─────────────────────────────────────────┘ │     │     │    │
│  │  │  └─────────────────────────────────────────────┘     │     │    │
│  │  └─────────────────────────────────────────────────────┘     │    │
│  │                                                               │    │
│  │  ┌─────────────────────────────────────────────────────┐     │    │
│  │  │            Private Subnet (10.0.2.0/24)              │     │    │
│  │  │  ┌─────────────────────────────────────────────┐     │     │    │
│  │  │  │        RDS PostgreSQL (db.t3.micro)         │     │     │    │
│  │  │  │              Port 5432                       │     │     │    │
│  │  │  └─────────────────────────────────────────────┘     │     │    │
│  │  └─────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- AWS Account with appropriate permissions
- Domain name with DNS access
- SSH key pair for EC2 access
- AWS CLI installed locally (optional but recommended)

---

## Step 1: Create RDS PostgreSQL Database

### 1.1 Navigate to RDS Console
1. Go to **AWS Console → RDS → Create Database**
2. Choose **Standard Create**

### 1.2 Engine Configuration
| Setting | Value |
|---------|-------|
| Engine | PostgreSQL |
| Version | 16.x (latest) |
| Template | Free tier (or Production) |

### 1.3 Instance Configuration
| Setting | Value |
|---------|-------|
| DB Instance Identifier | `resonancedb` |
| Master Username | `resonance_admin` |
| Master Password | (generate strong password) |
| Instance Class | db.t3.micro (free tier) or db.t3.small |

### 1.4 Storage
| Setting | Value |
|---------|-------|
| Storage Type | gp3 |
| Allocated Storage | 20 GB |
| Storage Autoscaling | Enable (max 100GB) |

### 1.5 Connectivity
| Setting | Value |
|---------|-------|
| VPC | Create new or use default |
| Subnet Group | Create new |
| Public Access | **No** |
| VPC Security Group | Create new → `resonancedb-rds-sg` |

### 1.6 Database Options
| Setting | Value |
|---------|-------|
| Initial Database Name | `resonancedb` |
| Port | 5432 |
| Backup Retention | 7 days |
| Encryption | Enable |

### 1.7 Create Database
Click **Create Database** and wait ~10 minutes for provisioning.

> **Save the endpoint!** It will look like: `resonancedb.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com`

---

## Step 2: Create EC2 Instance

### 2.1 Launch Instance
1. Go to **AWS Console → EC2 → Launch Instance**

### 2.2 Configuration
| Setting | Value |
|---------|-------|
| Name | `resonancedb-server` |
| AMI | Ubuntu 24.04 LTS |
| Instance Type | t3.medium (2 vCPU, 4GB RAM) |
| Key Pair | Select or create new |

### 2.3 Network Settings
| Setting | Value |
|---------|-------|
| VPC | Same as RDS |
| Subnet | Public subnet |
| Auto-assign Public IP | Enable |
| Security Group | Create new → `resonancedb-ec2-sg` |

### 2.4 Security Group Rules (EC2)

**Inbound:**
| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | Admin access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | 443 | 0.0.0.0/0 | SSL traffic |

### 2.5 Storage
- 30 GB gp3 (root volume)

### 2.6 Launch Instance

---

## Step 3: Configure Security Group for RDS

Allow EC2 to connect to RDS:

1. Go to **RDS → resonancedb → Security Groups**
2. Edit inbound rules for `resonancedb-rds-sg`:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| PostgreSQL | 5432 | resonancedb-ec2-sg | EC2 access |

---

## Step 4: Connect to EC2 and Install Docker

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes
exit
```

---

## Step 5: Clone and Configure Application

```bash
# SSH back in
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Clone repository
git clone https://github.com/AiqraAI/resonancedb-web.git
cd resonancedb-web

# Create production environment file
cp .env.production.example .env
```

### Edit `.env` file:
```bash
nano .env
```

```env
# Domain (without https://)
DOMAIN=resonancedb.yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# RDS Database
POSTGRES_USER=resonance_admin
POSTGRES_PASSWORD=<your-rds-password>

# Generate with: openssl rand -hex 32
API_KEY_SECRET=<generated-secret>

# Optional: Traefik dashboard auth
# Generate with: htpasswd -nb admin password | sed 's/\$/\$\$/g'
TRAEFIK_DASHBOARD_AUTH=
```

---

## Step 6: Create AWS-Specific Docker Compose

Create `docker-compose.aws.yml`:

```bash
nano docker-compose.aws.yml
```

```yaml
version: '3.8'

# AWS EC2 + RDS Deployment
# Uses external RDS PostgreSQL instead of local PostgreSQL container

services:
  traefik:
    image: traefik:v2.10
    container_name: resonancedb-traefik
    command:
      - "--api.dashboard=true"
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--log.level=INFO"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: resonancedb-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: resonancedb-api
    environment:
      # Use RDS endpoint here!
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${RDS_ENDPOINT}:5432/resonancedb
      API_KEY_SECRET: ${API_KEY_SECRET}
      DEBUG: "false"
      CORS_ORIGINS: '["https://${DOMAIN}", "https://www.${DOMAIN}"]'
      REDIS_URL: redis://redis:6379
    depends_on:
      redis:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.${DOMAIN}`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=8000"
    restart: unless-stopped
    command: uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4

  web:
    build:
      context: ./web
      dockerfile: Dockerfile.prod
      args:
        NEXT_PUBLIC_API_URL: https://api.${DOMAIN}
    container_name: resonancedb-web
    environment:
      NEXT_PUBLIC_API_URL: https://api.${DOMAIN}
    depends_on:
      - api
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`${DOMAIN}`) || Host(`www.${DOMAIN}`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=3000"
    restart: unless-stopped

volumes:
  redis_data:
  traefik_letsencrypt:
```

### Add RDS endpoint to `.env`:
```bash
echo "RDS_ENDPOINT=resonancedb.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com" >> .env
```

---

## Step 7: Configure DNS

Add these DNS records for your domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `<EC2-PUBLIC-IP>` | 300 |
| A | www | `<EC2-PUBLIC-IP>` | 300 |
| A | api | `<EC2-PUBLIC-IP>` | 300 |

Wait 5-10 minutes for DNS propagation.

---

## Step 8: Deploy

```bash
# Build and start all services
docker-compose -f docker-compose.aws.yml up --build -d

# View logs
docker-compose -f docker-compose.aws.yml logs -f

# Check status
docker-compose -f docker-compose.aws.yml ps
```

---

## Step 9: Verify Deployment

1. **Frontend**: https://resonancedb.yourdomain.com
2. **API Docs**: https://api.resonancedb.yourdomain.com/docs
3. **Health Check**: https://api.resonancedb.yourdomain.com/health

---

## Maintenance Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.aws.yml logs -f

# Specific service
docker-compose -f docker-compose.aws.yml logs -f api
```

### Update Application
```bash
cd ~/resonancedb-web
git pull
docker-compose -f docker-compose.aws.yml build
docker-compose -f docker-compose.aws.yml up -d
```

### Database Backup (RDS)
RDS handles automated backups. For manual backup:
```bash
# From EC2 instance (requires psql client)
sudo apt install postgresql-client -y
pg_dump -h $RDS_ENDPOINT -U resonance_admin -d resonancedb > backup_$(date +%Y%m%d).sql
```

### Restart Services
```bash
docker-compose -f docker-compose.aws.yml restart
```

---

## Cost Estimate (Monthly)

| Service | Configuration | Est. Cost |
|---------|---------------|-----------|
| EC2 | t3.medium (on-demand) | ~$30 |
| RDS | db.t3.micro (free tier) | $0-15 |
| EBS | 30GB gp3 | ~$3 |
| Data Transfer | 100GB out | ~$9 |
| **Total** | | **~$42-57/month** |

> **Tip**: Use Reserved Instances or Savings Plans for 30-60% savings on EC2/RDS.

---

## Security Best Practices

- [ ] Enable RDS encryption at rest
- [ ] Use AWS Secrets Manager for credentials
- [ ] Enable CloudWatch monitoring
- [ ] Set up AWS Backup for RDS
- [ ] Configure VPC flow logs
- [ ] Use IAM roles instead of access keys
- [ ] Enable MFA for AWS console access

---

## Troubleshooting

### Cannot connect to RDS
```bash
# Test from EC2
nc -zv <RDS-ENDPOINT> 5432

# Check security group allows EC2 → RDS
```

### SSL certificate not issued
```bash
# Check Traefik logs
docker logs resonancedb-traefik

# Ensure DNS is pointing to EC2
nslookup yourdomain.com
```

### API errors
```bash
# Check API logs
docker logs resonancedb-api

# Test database connection
docker exec -it resonancedb-api python -c "from api.core.database import engine; print(engine)"
```

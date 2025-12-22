# 🔊 ResonanceDB Web

**The Open Database of How Everything Vibrates**

A complete web infrastructure for ResonanceDB featuring a FastAPI backend, Next.js dashboard, and ML-powered material prediction.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **🎯 Material Prediction** - ML-powered identification from vibration signatures
- **📊 Sample Database** - Browse, search, and analyze vibration fingerprints
- **👥 Contributor System** - Tier-based rewards for data contributions
- **🔐 API Key Authentication** - Secure access with rate limiting
- **📈 Leaderboard** - Track top contributors

## 🏗️ Architecture

```
resonancedb-web/
├── api/                  # FastAPI backend
│   ├── core/            # Config, database, security
│   ├── models/          # SQLAlchemy models
│   ├── routers/         # API endpoints
│   └── schemas/         # Pydantic schemas
├── web/                  # Next.js 14 frontend
│   ├── src/app/         # App router pages
│   └── src/components/  # React components
├── python/              # Feature extraction
├── models/              # Trained ML models
├── docker-compose.yml   # Development
└── docker-compose.prod.yml  # Production (Traefik + SSL)
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/AiqraAI/resonancedb-web.git
cd resonancedb-web

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Access:**
- 🌐 Frontend: http://localhost:3001
- 📚 API Docs: http://localhost:8000/docs
- 🔍 Health Check: http://localhost:8000/health

### Option 2: Manual Setup

**Backend (FastAPI):**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export API_KEY_SECRET=$(openssl rand -hex 32)
export DATABASE_URL=sqlite+aiosqlite:///./resonancedb.db

# Run development server
uvicorn api.main:app --reload --port 8000
```

**Frontend (Next.js):**
```bash
cd web
npm install
npm run dev
```

## ⚙️ Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `API_KEY_SECRET` | Secret for hashing API keys | `openssl rand -hex 32` |
| `DATABASE_URL` | Async database connection | `postgresql+asyncpg://user:pass@host:5432/db` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `false` |
| `CORS_ORIGINS` | Allowed origins (JSON) | `["http://localhost:3000"]` |
| `REDIS_URL` | Redis for rate limiting | `memory://` (in-memory) |
| `NEXT_PUBLIC_API_URL` | Backend URL for frontend | `http://localhost:8000` |

See `.env.example` for full list.

## 🔧 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new contributor |
| `/api/v1/auth/regenerate-key` | POST | Generate new API key |
| `/api/v1/auth/me` | GET | Get current user profile |

### Samples
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/samples/` | POST | Submit vibration sample |
| `/api/v1/samples/` | GET | List samples (paginated) |
| `/api/v1/samples/{id}` | GET | Get sample details |

### Prediction
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/predict/` | POST | Predict material from vibration |

### Contributors
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/contributors/leaderboard` | GET | Top contributors |
| `/api/v1/contributors/me/stats` | GET | Your contribution stats |

### Health
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/stats` | GET | Database statistics |
| `/health` | GET | Health check |

## 🚢 Production Deployment

### Prerequisites
- Domain name with DNS configured
- Docker and Docker Compose installed
- Ports 80 and 443 available

### Steps

1. **Configure environment:**
   ```bash
   cp .env.production.example .env
   ```

2. **Edit `.env` with your values:**
   ```env
   DOMAIN=resonancedb.example.com
   ACME_EMAIL=admin@example.com
   POSTGRES_USER=resonance_prod
   POSTGRES_PASSWORD=<strong-password>
   API_KEY_SECRET=<generate-with-openssl-rand-hex-32>
   ```

3. **Generate secrets:**
   ```bash
   # Generate API_KEY_SECRET
   openssl rand -hex 32
   
   # Generate POSTGRES_PASSWORD
   openssl rand -base64 24
   ```

4. **Deploy:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Verify:**
   ```bash
   # Check all containers are running
   docker-compose -f docker-compose.prod.yml ps
   
   # View logs
   docker-compose -f docker-compose.prod.yml logs -f
   ```

### Production Stack

| Service | Purpose | Port |
|---------|---------|------|
| **Traefik** | Reverse proxy, auto-SSL | 80, 443 |
| **PostgreSQL** | Database | Internal |
| **Redis** | Rate limiting | Internal |
| **API** | Backend | Internal |
| **Web** | Frontend | Internal |

### SSL Certificates

SSL certificates are automatically provisioned via Let's Encrypt. The first request may take a few seconds while the certificate is issued.

### Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Backup

```bash
# Backup database
docker exec resonancedb-postgres pg_dump -U $POSTGRES_USER resonancedb > backup_$(date +%Y%m%d).sql

# Restore database
cat backup.sql | docker exec -i resonancedb-postgres psql -U $POSTGRES_USER -d resonancedb
```

## 🧪 Testing

```bash
# Run backend tests
pytest

# Run with coverage
pytest --cov=api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Related Projects

- [ResonanceDB Core](https://github.com/AiqraAI/resonancedb) - Python library & ML models
- [AIQRA AI](https://aiqra.ai) - Project sponsor

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://aiqra.ai">AIQRA AI</a>
</p>

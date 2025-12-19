#  ResonanceDB Web

**Server Infrastructure for ResonanceDB**  
*FastAPI Backend + Next.js Dashboard*

##  Architecture

`
resonancedb-web/
 api/              # FastAPI backend
 web/              # Next.js 14 dashboard
 python/           # Feature extraction (shared with core)
 models/           # Trained ML models
 Dockerfile
 docker-compose.yml
 requirements.txt
`

##  Quick Start

### Backend (FastAPI)

`ash
# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn api.main:app --reload --port 8000
`

API docs: http://localhost:8000/docs

### Frontend (Next.js)

`ash
cd web
npm install
npm run dev
`

Dashboard: http://localhost:3001

##  Environment Variables

Copy `.env.example` to `.env` and configure:

`env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/resonancedb
API_KEY_SECRET=your-secret-key
`

##  Docker

`ash
docker-compose up
`

##  API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register contributor |
| `/api/v1/samples/` | POST | Submit vibration sample |
| `/api/v1/predict/` | POST | Get material prediction |
| `/api/v1/contributors/leaderboard` | GET | Top contributors |

##  Related

- [ResonanceDB Core](https://github.com/AiqraAI/resonancedb) - Python library & source code
- [AIQRA AI](https://aiqra.ai) - Project sponsor

##  License

MIT License

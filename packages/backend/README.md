# SmarTrack Python Backend

FastAPI backend with all business logic and processing.

## 🌐 For Cloud Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete cloud deployment guide.

Quick deploy to Railway: https://railway.app/new

## Setup

### 1. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
Copy `.env` file and update with your credentials.

### 4. Run Development Server
```bash
uvicorn main:app --reload --port 8000
```

Server will run on http://localhost:8000

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Endpoints

- `GET /api/health` - Health check
- `GET /api/links` - List all links
- `POST /api/links` - Create new link (with content extraction)
- `GET /api/links/{id}` - Get single link
- `PATCH /api/links/{id}` - Update link
- `DELETE /api/links/{id}` - Delete link
- `GET /api/user/stats` - Get user statistics

## Features

- ✅ **Content Extraction**: Automatic webpage content extraction
- ✅ **MongoDB**: Async database operations
- ✅ **Auth0**: JWT authentication
- ✅ **Rate Limiting**: Request throttling
- ✅ **Input Validation**: Pydantic models
- ✅ **Auto Documentation**: Swagger/ReDoc

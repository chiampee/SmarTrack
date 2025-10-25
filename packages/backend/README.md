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
Create a `.env` file in this directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0

# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-identifier

# Application Settings (optional)
DEBUG=True
MAX_LINKS_PER_USER=1000
MAX_PAGE_SIZE_BYTES=524288
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

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

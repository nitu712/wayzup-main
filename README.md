# WayzUp – GIS-Based Community Hazard Alert System

A lightweight, storage-free full-stack mini project enabling users to report and view local road hazards via geo-tagged photos.

- Frontend: React, Vite, Tailwind CSS, React Router, React Toastify, @react-google-maps/api
- Backend: Python Flask, Pillow (PIL) for EXIF GPS extraction, CORS
- Storage: In-memory only (no DB, no files)

## Folder structure

- `frontend/` – React app
- `backend/` – Flask API server

## Prerequisites

- Node.js 18+
- Python 3.10+
- A Google Maps API Key with Maps JavaScript API enabled

## Backend Setup

```bash
cd backend
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
python app.py
```

The server runs at `http://localhost:5000`.

### API
- `POST /report` – multipart/form-data with fields `image` (file) and `description` (string). Extracts GPS from EXIF, stores hazard in memory, verifies hazards when multiple reports occur within ~100m.
- `GET /hazards` – returns verified hazards only: `{ hazards: Array<{ id, lat, lng, description, imagePreview }> }`

## Frontend Setup

```bash
cd frontend
npm install
# Create .env file for keys
cp .env.example .env
# Edit .env and set keys
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment Variables (frontend)
Create `frontend/.env` (or use `.env.example`):

```
VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY
VITE_API_BASE_URL=http://localhost:5000
```

## Usage Notes
- Ensure the photo you upload is geo-tagged (has GPS EXIF). If the backend cannot find GPS data, it will return an error.
- Verified hazards are displayed on the map as reports accumulate (>=2 within ~100 meters).

## Deployment (optional)
- Frontend: Netlify or Vercel
- Backend: Render or any Flask-supporting host

## License
MIT


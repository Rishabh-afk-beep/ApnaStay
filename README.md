# ApnaStay: The Ultimate Student Rental Marketplace 🎓

ApnaStay (formerly CollegePG) is a modern, full-stack platform designed to simplify student housing. It connects students directly with PG owners, hostel operators, and landlords near their specific college campuses—completely eliminating broker chaos.

## 🚀 Features

- **College-First Discovery:** Students search for housing anchored around their university or campus, filtering by walking distance, amenities, budget, and property type.
- **Robust Role System:** Separate interfaces and workflows for **Students**, **Owners**, and **Admins**.
- **Owner Dashboard:** Landlords can easily list properties, manage room availability, and track student inquiries.
- **Admin Moderation:** All listings are pending until an Admin approves them. Includes audit logs and real-time marketplace analytics.
- **Real-time Map Integration:** Built-in Leaflet Maps pinpointing property coordinates.
- **Cross-Platform:** Includes both a responsive React Web App and a React Native Mobile App scaffolding!

---

## 🛠 Tech Stack

Built for scale, security, and velocity using modern technologies.

- **Frontend (Web):** React, Vite, Tailwind CSS, `@tanstack/react-query`, React Router.
- **Mobile (App):** React Native (Expo)
- **Backend:** Python, FastAPI, Pydantic (Type validation)
- **Database / Auth:** Firebase Auth (Google + Email) & Firebase Firestore (NoSQL Document DB)
- **Maps:** Leaflet & OpenStreetMap (100% Free)

---

## 🏗 Repository Structure

This is a Monorepo containing three distinct codebases:

```text
/apnastay
│
├── /frontend      # The React Web App (Vercel Ready)
├── /backend       # The FastAPI Python Server (Render Ready)
├── /mobile        # The React Native Expo Application
└── docker-compose.yml 
```

---

## 💻 Local Development Setup

You can run the entire platform using Docker, or natively manually.

### Option 1: Docker (Fastest)
Ensure Docker Desktop is running, then execute the startup script from the root folder:
```powershell
./start.ps1
```
This automatically scaffolds missing `.env` files and builds both the `backend` and `frontend` containers side-by-side.

### Option 2: Native Setup 
If you want to run things manually for debugging:

**1. Backend (FastAPI)**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # (or .\.venv\Scripts\activate on Windows)
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*API will run at: `http://localhost:8000`*

**2. Frontend (React/Vite)**
```bash
cd frontend
npm install
npm run dev
```
*Web App will run at: `http://localhost:5173`*

---

## 🔒 Firebase Configuration

ApnaStay relies on Firebase for Authentication and Database architecture. 
To launch successfully, you must have a Firebase project securely connected.

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Firestore Database** and **Authentication** (Email/Password & Google).
3. Fetch your web settings and populate `frontend/.env`.
4. Generate a Service Account Private Key (`.json`), base64 encode it, and place it in the environment variable `FIREBASE_SERVICE_ACCOUNT_B64` for the backend.

### Firestore Security Rules
All read/write operations happen securely through the FastAPI backend! Keep your Firestore lock down:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Only backend Python SDK has access 
    }
  }
}
```

---

## ☁️ Production Deployment

### Backend (Render)
1. Deploy the `/backend` folder as a **Web Service** on Render using the Python 3 native environment.
2. Set Build Command: `pip install -r requirements.txt`
3. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Inject your Base64 Firebase Credentials via Environment Variables.
5. Set `APP_ENV=production` exactly to automatically hide sensitive Swagger API docs!

### Frontend (Vercel)
1. Import the `/frontend` directory to Vercel.
2. Vercel automatically detects Vite configurations. 
3. **CRITICAL:** Set `VITE_API_BASE_URL` to point to your deployed Render URL (e.g. `https://apnastay-api.onrender.com/api/v1`).
4. Add your Vercel URL to the Firebase Auth "Authorized Domains" list to prevent cross-origin auth blocking.

---

## 📜 Dev & Testing Scripts
Inside the `backend/scripts` folder, you will find incredibly helpful scripts:
- `seed_firestore.py` - Automatically inserts test colleges, 3 mock properties, and test users into a fresh database.
- `generate_dev_tokens.py` - Synthesizes fake JWT tokens if Firebase is intentionally bypassed during local UI testing.
- `smoke_auth.ps1` - Runs end-to-end integration tests natively. 

**Maintained and updated lovingly for the college housing ecosystem.**

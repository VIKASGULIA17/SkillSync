# SkillSync

**AI-Powered Resume Analysis & Career Guidance**

SkillSync analyzes your resume against target job roles, identifies skill gaps, provides AI-powered improvement recommendations, and connects you with matching job opportunities.

---

## ✨ Features

- **📄 Smart Resume Analysis** — Upload your PDF resume and get an instant skill-match score against 55+ tech roles
- **🎯 Auto Role Detection** — AI automatically identifies the best-matching role for your profile
- **💡 AI Career Coach** — Personalized feedback and learning recommendations powered by Groq/Llama
- **🔍 Job Discovery** — Browse 700+ jobs scraped from Internshala and FreshersWorld with search & filters
- **📊 Skill Gap Visualization** — See exactly which skills you have and which ones you're missing
- **📈 Progress Tracking** — Track your skill improvement over time with analysis history
- **🗂️ Application Tracker** — Kanban board to manage job applications (Wishlist → Applied → Interview → Offered)
- **💾 Saved Jobs** — Bookmark jobs for later and quick apply
- **⚖️ Resume Comparison** — Compare two resume versions side-by-side against a target role
- **👥 User Management** — Complete user profile system with skills matrix
- **🔐 Admin Panel** — Full admin dashboard for user/job/scraper management

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Backend | FastAPI (Python) |
| Database | SQLite (SQLAlchemy ORM) |
| AI | Groq API + LangChain (Llama 4 Scout) |
| Styling | Vanilla CSS with glassmorphism design |

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Groq API Key** — Get one free at [console.groq.com/keys](https://console.groq.com/keys)

### 1. Clone the Repository

```bash
git clone https://github.com/VIKASGULIA17/SkiilSync.git
cd SkiilSync
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API key (copy example and edit)
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive API documentation.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

> **Note:** The frontend proxies `/api` requests to the backend at `localhost:8000`, so both servers must be running.

### 4. (Optional) Configure API Key via UI

Instead of using the `.env` file, you can also configure your Groq API key through the **Settings** page in the web UI.

## 📁 Project Structure

```
SkiilSync/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py          # App entry point, CORS, startup
│   │   ├── config.py        # Settings & environment variables
│   │   ├── database.py      # SQLite + SQLAlchemy setup
│   │   ├── models.py        # DB models + Pydantic schemas
│   │   ├── routes/          # API route handlers
│   │   │   ├── resume.py    # /api/analyze endpoints
│   │   │   ├── jobs.py      # /api/jobs endpoints
│   │   │   ├── skills.py    # /api/roles endpoint
│   │   │   └── settings.py  # /api/settings endpoints
│   │   └── services/        # Business logic (single source of truth)
│   │       ├── resume_parser.py
│   │       ├── gap_analyzer.py
│   │       ├── ai_feedback.py
│   │       ├── skills_db.py
│   │       └── job_scraper.py
│   ├── data/
│   │   └── skills_data.csv  # Role-skill mapping database
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── api/client.js    # API wrapper
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── App.jsx          # Router setup
│   │   └── index.css        # Design system
│   ├── index.html
│   └── vite.config.js
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register new user account |
| `POST` | `/api/auth/login` | Login and get JWT token |
| `GET` | `/api/auth/me` | Get current user profile |
| `GET` | `/api/auth/is_admin` | Check if user is admin |
| `GET` | `/api/auth/is_user` | Check if user is regular user |

### Resume Analysis
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload PDF resume for analysis |
| `POST` | `/api/analyze/feedback` | Get AI-powered improvement feedback |
| `POST` | `/api/analyze/role` | Analyze resume for a specific role |
| `POST` | `/api/analyze/linkedin` | Analyze LinkedIn profile URL |
| `POST` | `/api/analyze/compare` | Compare two resumes side-by-side |

### User Features
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/history` | Get user's analysis history |
| `POST` | `/api/user/history` | Save analysis to history |
| `GET` | `/api/user/stats` | Get user statistics |
| `GET` | `/api/user/applications` | Get tracked job applications |
| `POST` | `/api/user/applications` | Add job application |
| `PATCH` | `/api/user/applications/{id}` | Update application status |
| `DELETE` | `/api/user/applications/{id}` | Remove application |
| `GET` | `/api/user/saved-jobs` | Get saved/bookmarked jobs |
| `POST` | `/api/user/saved-jobs` | Save a job |
| `DELETE` | `/api/user/saved-jobs/{id}` | Unsave a job |

### User Profile
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user_profile` | Get user profile |
| `POST` | `/api/user_profile/personalInfo/update` | Update personal info |
| `POST` | `/api/user_profile/skill_set/update` | Update skills matrix |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | List jobs with filtering & pagination |
| `POST` | `/api/jobs/refresh` | Trigger background job scraping |
| `GET` | `/api/jobs/status` | Get scraping status |
| `GET` | `/api/roles` | List all available roles |

### Settings
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/settings/api-key` | Configure Groq API key |
| `GET` | `/api/settings/api-key/status` | Check API key status |

### Admin (Requires Admin Role)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/users` | List all users |
| `GET` | `/api/admin/users/{id}` | Get user details |
| `PATCH` | `/api/admin/users/{id}/role` | Update user role |
| `DELETE` | `/api/admin/users/{id}` | Delete user |
| `POST` | `/api/admin/jobs` | Create job manually |
| `PUT` | `/api/admin/jobs/{id}` | Update job |
| `DELETE` | `/api/admin/jobs/{id}` | Delete job |
| `GET` | `/api/admin/scraper/logs` | Get scraper history |

## 📄 License

This project is open source.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
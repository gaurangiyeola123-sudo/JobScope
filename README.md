# JobScope — Job Market Intelligence Platform

**JobScope** is a data-driven job market intelligence platform that analyzes Indian job market data to help users explore employment trends, understand in-demand skills, compare salary patterns, and make informed career decisions.

It combines data analytics, an interactive job explorer, and an AI-powered career advisor in one platform.

---

## 🚀 Features

### 1. Real Job Market Analytics
- Analyze approximately 97,679 unique job listings.
- View total job listings, companies, locations, and salary-disclosed jobs.
- Identify the most frequently listed job roles.
- Explore job demand across Indian cities.
- Analyze salary trends by role.
- Identify the most demanded technical skills.
- Understand experience requirements.
- Explore companies with the highest number of listings.

### 2. Real Job Explorer
- Browse real job-market records.
- Search by job title or company.
- Filter jobs by location.
- Filter by minimum and maximum experience.
- Filter by salary range.
- Navigate through paginated job listings.
- View detailed job descriptions and required skills.

### 3. AI Career Advisor
- Generate personalized career analysis using Google's Gemini API.
- Analyze educational background, skills, interests, and experience level.
- Receive recommended career roles.
- Identify skill gaps.
- Get learning priorities and a six-month roadmap.
- Explore relevant industry opportunities.

### 4. Skills Intelligence
- Explore in-demand skills.
- Analyze skill combinations.
- Compare skills across job roles.
- Identify potential skill gaps.

### 5. Interactive Dashboard
- Modern, responsive dashboard interface.
- Interactive charts and analytics.
- Dedicated navigation for different platform sections.

---

## 🛠️ Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Requests | Axios |
| Backend | Python, FastAPI |
| Data Processing | Pandas |
| Database | MySQL |
| ORM | SQLAlchemy |
| AI Integration | Google Gemini API |
| Version Control | Git and GitHub |

---

## 📊 Dataset

The project uses an Indian job market dataset containing approximately 97,929 original records.

After cleaning and deduplication:

- **Original records:** 97,929
- **Unique job listings imported:** 97,679
- **Duplicate records skipped:** 250
- **Currencies:** INR and USD
- **Primary market:** India

### Data Processing

The ETL pipeline performs:

1. Data extraction from CSV files.
2. Data cleaning and standardization.
3. Duplicate job ID removal.
4. Handling missing values.
5. Salary data normalization.
6. Data validation.
7. Loading processed records into MySQL.

**Data considerations:**
- Undisclosed salaries are stored as NULL rather than zero.
- INR and USD records are kept separate in salary analytics.
- Salary analysis uses INR listings with disclosed salary bounds.
- Relative job posting labels are preserved instead of generating artificial posting dates.

The dataset represents historical job-market records and should not be interpreted as a live vacancy feed.

---

## 🏗️ Project Architecture

```text
JobScope/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── RealAnalytics.jsx
│   │   ├── RealJobExplorer.jsx
│   │   ├── CareerAdvisor.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   └── package.json
│
├── backend/
│   ├── data/
│   │   ├── raw/
│   │   └── processed/
│   │
│   ├── etl/
│   │   ├── etl_pipeline.py
│   │   ├── inspect_dataset.py
│   │   ├── profile_dataset.py
│   │   └── import_real_jobs.py
│   │
│   ├── main.py
│   ├── real_analytics.py
│   ├── database.py
│   ├── models.py
│   ├── gemini_service.py
│   └── requirements.txt
│
└── README.md
```

---

## ⚙️ Installation and Setup

### Prerequisites

Install the following:

- Python 3.10+
- Node.js and npm
- MySQL Server
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/gaurangiyeola123-sudo/JobScope.git
cd JobScope
```

### 2. Backend Setup

Create a virtual environment:

```bash
python -m venv backend/venv
```

Install dependencies:

```bash
backend/venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` directory.

```env
DATABASE_URL=mysql+pymysql://USERNAME:PASSWORD@localhost/jobscope_db
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_configured_gemini_model
```

Replace the placeholders with your own configuration.

**Never upload your `.env` file or API keys to GitHub.**

### 4. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE jobscope_db;
```

The application creates its SQLAlchemy tables when the backend starts.

To import the original sample records, run the migration script if required.

To import the real dataset, place the CSV file at:

```text
backend/data/raw/indian_jobs_raw.csv
```

Then run:

```bash
backend/venv/Scripts/python.exe backend/etl/import_real_jobs.py
```

The raw dataset is not included in this repository.

### 5. Start the Backend

From the project root:

```bash
backend/venv/Scripts/python.exe -m uvicorn main:app --reload --app-dir backend
```

Backend URL:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 6. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

---

## 🔌 API Endpoints

### General APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/jobs` | Retrieve sample jobs |
| GET | `/api/stats` | Sample dashboard statistics |
| GET | `/api/skills` | Skills analytics |
| GET | `/api/salaries` | Sample salary analytics |
| GET | `/api/locations` | Location analytics |

### Real Job Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/real/stats` | Overall job statistics |
| GET | `/api/real/roles` | Top job roles |
| GET | `/api/real/locations` | Top job locations |
| GET | `/api/real/salaries` | Salary analysis |
| GET | `/api/real/skills` | Most demanded skills |
| GET | `/api/real/experience` | Experience analysis |
| GET | `/api/real/companies` | Top companies |
| GET | `/api/real/jobs` | Search and filter real jobs |
| GET | `/api/real/jobs/{job_id}` | Individual job details |

### AI Career Advisor

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/career-advisor` | Generate AI-powered career analysis |

---

## 🔮 Future Enhancements

- Live job data integration.
- Advanced job recommendation system.
- More detailed salary prediction models.
- Personalized skill development recommendations.
- Additional data visualizations.
- Improved AI-powered career guidance.

---

## 🎯 Project Objective

The objective of JobScope is to transform raw job-market data into meaningful insights and make career exploration more data-driven.

It demonstrates the integration of data engineering, analytics, backend development, database management, and generative AI in a practical application.

---

## 👩‍💻 Author

**Gaurangi Yeola**

Computer Engineering Student  
Gokhale Education Society's R. H. Sapat College of Engineering, Management Studies and Research

[GitHub Repository](https://github.com/gaurangiyeola123-sudo/JobScope)

---

*Built as a data analytics and AI-powered portfolio project.*
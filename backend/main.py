from real_analytics import (
    get_real_stats,
    get_top_roles,
    get_top_locations,
    get_salary_analysis,
    get_top_skills,
    get_experience_analysis,
    get_top_companies
)
from pydantic import BaseModel, Field
from gemini_service import generate_ai_response
import re
from itertools import combinations

from collections import Counter

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from database import engine, Base, get_db
from models import Job,RealJob


# --------------------------------------------------
# DATABASE
# --------------------------------------------------

Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="JobScope API",
    description="Job Market Intelligence Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# AI CAREER ADVISOR - REQUEST MODEL
# ==========================================

class CareerAdvisorRequest(BaseModel):
    education: str = Field(min_length=2, max_length=200)
    skills: str = Field(min_length=1, max_length=1000)
    interests: str = Field(min_length=2, max_length=1000)
    preferred_domain: str = Field(min_length=2, max_length=100)
    experience_level: str = Field(min_length=2, max_length=100)


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def split_skills(skills_string):
    if not skills_string:
        return []

    return [
        skill.strip()
        for skill in skills_string.split(";")
        if skill.strip()
    ]


def job_to_dict(job):
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "experience": job.experience,
        "min_salary": job.min_salary,
        "max_salary": job.max_salary,
        "job_type": job.job_type,
        "skills": job.skills
    }


def get_all_jobs(db):
    return db.query(Job).all()


# --------------------------------------------------
# ROOT AND HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to JobScope API",
        "status": "Running",
        "database": "MySQL"
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.query(Job).limit(1).all()

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection failed: {str(error)}"
        )


# --------------------------------------------------
# JOB EXPLORER
# --------------------------------------------------

@app.get("/api/jobs")
def get_jobs(
    search: str = None,
    role: str = None,
    location: str = None,
    experience: str = None,
    min_salary: float = None,
    max_salary: float = None,
    min_salary_lpa: float = None,
    max_salary_lpa: float = None,
    sort_by: str = "newest",
    sort: str = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db)
):

    query = db.query(Job)

    # Search across job title, company, location and skills
    if search:
        search_term = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Job.title.ilike(search_term),
                Job.company.ilike(search_term),
                Job.location.ilike(search_term),
                Job.skills.ilike(search_term)
            )
        )

    # Role filter
    if role:
        query = query.filter(Job.title.ilike(f"%{role}%"))

    # Location filter
    if location:
        query = query.filter(
            Job.location.ilike(f"%{location}%")
        )

    # Experience filter
    if experience:
        query = query.filter(
            Job.experience.ilike(f"%{experience}%")
        )

    # Salary filters
    # Frontend salary inputs are in LPA.
    # Database salary values are in rupees.

    minimum = min_salary_lpa if min_salary_lpa is not None else min_salary
    maximum = max_salary_lpa if max_salary_lpa is not None else max_salary

    if minimum is not None:
        query = query.filter(
            Job.max_salary >= minimum * 100000
        )

    if maximum is not None:
        query = query.filter(
            Job.min_salary <= maximum * 100000
        )

    # Sorting
    selected_sort = sort or sort_by

    if selected_sort in ["salary_high", "highest_salary"]:
        query = query.order_by(Job.max_salary.desc())

    elif selected_sort in ["salary_low", "lowest_salary"]:
        query = query.order_by(Job.min_salary.asc())

    elif selected_sort == "company":
        query = query.order_by(Job.company.asc())

    elif selected_sort == "title":
        query = query.order_by(Job.title.asc())

    else:
        query = query.order_by(Job.id.desc())

    total = query.count()

    jobs = query.limit(limit).all()

    return {
        "total": total,
        "jobs": [job_to_dict(job) for job in jobs]
    }


# --------------------------------------------------
# JOB DETAILS
# --------------------------------------------------

@app.get("/api/jobs/{job_id}")
def get_job_details(
    job_id: int,
    db: Session = Depends(get_db)
):

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return job_to_dict(job)


# --------------------------------------------------
# DASHBOARD STATISTICS
# --------------------------------------------------

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):

    total_jobs = db.query(Job).count()

    average_salary = db.query(
        func.avg(
            (Job.min_salary + Job.max_salary) / 2
        )
    ).scalar() or 0

    total_companies = db.query(
        func.count(func.distinct(Job.company))
    ).scalar() or 0

    total_locations = db.query(
        func.count(func.distinct(Job.location))
    ).scalar() or 0

    popular_role = db.query(
        Job.title,
        func.count(Job.id).label("job_count")
    ).group_by(
        Job.title
    ).order_by(
        func.count(Job.id).desc()
    ).first()

    return {
        "total_jobs": total_jobs,
        "average_salary": round(float(average_salary)),
        "popular_role": popular_role[0] if popular_role else "N/A",
        "total_companies": total_companies,
        "total_locations": total_locations
    }


# --------------------------------------------------
# SKILLS ANALYTICS
# --------------------------------------------------

@app.get("/api/skills")
def get_skills(db: Session = Depends(get_db)):

    jobs = get_all_jobs(db)

    skill_counts = Counter()

    for job in jobs:
        skill_counts.update(split_skills(job.skills))

    return [
        {
            "skill": skill,
            "count": count
        }
        for skill, count in skill_counts.most_common(20)
    ]


# --------------------------------------------------
# SALARY ANALYTICS
# --------------------------------------------------

@app.get("/api/salaries")
def get_salaries(db: Session = Depends(get_db)):

    results = db.query(
        Job.title,
        func.avg(
            (Job.min_salary + Job.max_salary) / 2
        ).label("average_salary")
    ).group_by(
        Job.title
    ).order_by(
        func.avg(
            (Job.min_salary + Job.max_salary) / 2
        ).desc()
    ).all()

    return [
        {
            "role": role,
            "average_salary": round(float(average_salary))
        }
        for role, average_salary in results
    ]


# --------------------------------------------------
# LOCATION ANALYTICS
# --------------------------------------------------

@app.get("/api/locations")
def get_locations(db: Session = Depends(get_db)):

    results = db.query(
        Job.location,
        func.count(Job.id).label("job_count")
    ).group_by(
        Job.location
    ).order_by(
        func.count(Job.id).desc()
    ).all()

    return [
        {
            "location": location,
            "job_count": count
        }
        for location, count in results
    ]


# --------------------------------------------------
# SKILLS BY ROLE
# --------------------------------------------------

@app.get("/api/skills/by-role")
def get_skills_by_role(db: Session = Depends(get_db)):

    jobs = get_all_jobs(db)

    role_skill_counts = Counter()

    for job in jobs:
        for skill in split_skills(job.skills):
            role_skill_counts[(job.title, skill)] += 1

    return [
        {
            "role": role,
            "skill": skill,
            "count": count
        }
        for (role, skill), count in role_skill_counts.items()
    ]


# --------------------------------------------------
# SKILL COMBINATIONS
# --------------------------------------------------

@app.get("/api/skills/combinations")
def get_skill_combinations(db: Session = Depends(get_db)):

    jobs = get_all_jobs(db)

    combination_counts = Counter()

    for job in jobs:
        skills = sorted(set(split_skills(job.skills)))

        for skill_pair in combinations(skills, 2):
            combination_counts[skill_pair] += 1

    return [
        {
            "skill_1": pair[0],
            "skill_2": pair[1],
            "count": count
        }
        for pair, count in combination_counts.most_common(20)
    ]


# --------------------------------------------------
# SKILL GAP ANALYSIS
# --------------------------------------------------

@app.get("/api/skills/gap")
def get_skill_gap(
    role: str,
    candidate_skills: str = "",
    db: Session = Depends(get_db)
):

    matching_jobs = db.query(Job).filter(
        Job.title.ilike(f"%{role}%")
    ).all()

    if not matching_jobs:
        raise HTTPException(
            status_code=404,
            detail="No jobs found for this role"
        )

    required_skill_counts = Counter()

    for job in matching_jobs:
        required_skill_counts.update(
            set(split_skills(job.skills))
        )

    candidate_skill_set = {
        skill.strip().lower()
        for skill in re.split(r"[,;]", candidate_skills)
        if skill.strip()
    }

    skills = []

    for skill, count in required_skill_counts.most_common():

        status = (
            "Already have"
            if skill.lower() in candidate_skill_set
            else "Missing"
        )

        skills.append({
            "skill": skill,
            "job_count": count,
            "status": status
        })

    return {
        "target_role": role,
        "matching_jobs": len(matching_jobs),
        "skills": skills
    }
# ==========================================
# REAL DATASET ANALYTICS
# ==========================================

@app.get("/api/real/stats")
def real_stats(db: Session = Depends(get_db)):
    return get_real_stats(db)


@app.get("/api/real/roles")
def real_roles(limit: int = 10, db: Session = Depends(get_db)):
    return get_top_roles(db, limit)


@app.get("/api/real/locations")
def real_locations(limit: int = 10, db: Session = Depends(get_db)):
    return get_top_locations(db, limit)


@app.get("/api/real/salaries")
def real_salaries(limit: int = 10, db: Session = Depends(get_db)):
    return get_salary_analysis(db, limit)


@app.get("/api/real/skills")
def real_skills(limit: int = 15, db: Session = Depends(get_db)):
    return get_top_skills(db, limit)


@app.get("/api/real/experience")
def real_experience(db: Session = Depends(get_db)):
    return get_experience_analysis(db)


@app.get("/api/real/companies")
def real_companies(limit: int = 10, db: Session = Depends(get_db)):
    return get_top_companies(db, limit)

# ==========================================
# REAL JOB EXPLORER API
# ==========================================

@app.get("/api/real/jobs")
def get_real_jobs(
    search: str = Query(default="", description="Search job title or company"),
    location: str = Query(default="", description="Filter by location"),
    min_experience: int | None = Query(default=None, ge=0),
    max_experience: int | None = Query(default=None, ge=0),
    min_salary: int | None = Query(default=None, ge=0),
    max_salary: int | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(RealJob)

    # Search by job title or company
    if search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                RealJob.title.ilike(search_term),
                RealJob.company.ilike(search_term)
            )
        )

    # Filter by location
    if location.strip():
        query = query.filter(
            RealJob.location.ilike(f"%{location.strip()}%")
        )

    # Filter by experience range
    if min_experience is not None:
        query = query.filter(
            RealJob.max_experience >= min_experience
        )

    if max_experience is not None:
        query = query.filter(
            RealJob.min_experience <= max_experience
        )

    # Filter by salary range
    # Only INR listings with disclosed salary bounds are included.
    if min_salary is not None or max_salary is not None:
        query = query.filter(
            RealJob.currency == "INR",
            RealJob.min_salary.isnot(None),
            RealJob.max_salary.isnot(None)
        )

    if min_salary is not None:
        query = query.filter(
            RealJob.max_salary >= min_salary
        )

    if max_salary is not None:
        query = query.filter(
            RealJob.min_salary <= max_salary
        )

    # Total matching records before pagination
    total = query.count()

    # Pagination
    offset = (page - 1) * limit

    jobs = (
        query
        .order_by(RealJob.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []

    for job in jobs:
        results.append({
            "id": job.id,
            "source_job_id": job.source_job_id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "currency": job.currency,
            "job_uploaded": job.job_uploaded,
            "experience": job.experience,
            "min_experience": job.min_experience,
            "max_experience": job.max_experience,
            "min_salary": job.min_salary,
            "max_salary": job.max_salary,
            "skills": job.skills,
            "job_description": job.job_description,
            "reviews_count": job.reviews_count,
            "aggregate_rating": job.aggregate_rating
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
        "jobs": results
    }


# ==========================================
# REAL JOB DETAILS API
# ==========================================

@app.get("/api/real/jobs/{job_id}")
def get_real_job_details(
    job_id: int,
    db: Session = Depends(get_db)
):
    job = db.query(RealJob).filter(
        RealJob.id == job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return {
        "id": job.id,
        "source_job_id": job.source_job_id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "currency": job.currency,
        "job_uploaded": job.job_uploaded,
        "experience": job.experience,
        "min_experience": job.min_experience,
        "max_experience": job.max_experience,
        "min_salary": job.min_salary,
        "max_salary": job.max_salary,
        "skills": job.skills,
        "job_description": job.job_description,
        "reviews_count": job.reviews_count,
        "aggregate_rating": job.aggregate_rating
    }
# ==========================================
# AI CAREER ADVISOR API
# ==========================================

@app.post("/api/ai/career-advisor")
def ai_career_advisor(request: CareerAdvisorRequest):

    prompt = f"""
    You are JobScope AI, an expert career advisor specializing
    in technology, data engineering, analytics, and AI/ML careers.

    Analyze the following candidate profile.

    EDUCATION:
    {request.education}

    CURRENT SKILLS:
    {request.skills}

    INTERESTS:
    {request.interests}

    PREFERRED CAREER DOMAIN:
    {request.preferred_domain}

    EXPERIENCE LEVEL:
    {request.experience_level}

    Provide a personalized career analysis using these sections:

    1. CAREER PROFILE
       Summarize the candidate's current position.

    2. RECOMMENDED CAREER ROLES
       Suggest the 3 most suitable career roles.
       Explain why each role is appropriate.

    3. SKILLS GAP
       Identify important missing technical and professional skills.

    4. LEARNING PRIORITIES
       Rank the skills the candidate should learn first.
       Explain their relevance.

    5. CAREER ROADMAP
       Provide a practical 6-month learning roadmap.

    6. INDUSTRY OPPORTUNITIES
       Explain relevant industry opportunities and technologies.

    7. FINAL RECOMMENDATION
       Give one clear recommended career direction.

    Important instructions:
    - Be realistic and specific.
    - Consider the candidate's current skill level.
    - Do not invent qualifications or work experience.
    - Distinguish existing skills from recommended skills.
    - Use clear headings and bullet points.
    - Avoid generic motivational advice.
    """

    try:
        result = generate_ai_response(prompt)

        return {
            "success": True,
            "message": "Career analysis generated successfully",
            "career_analysis": result
        }

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"AI career analysis failed: {str(error)}"
        )
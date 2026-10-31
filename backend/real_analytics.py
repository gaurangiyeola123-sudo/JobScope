
from sqlalchemy import func, case, and_
from sqlalchemy.orm import Session

from models import RealJob


def get_real_stats(db: Session):
    total_jobs = db.query(func.count(RealJob.id)).scalar() or 0

    total_companies = (
        db.query(func.count(func.distinct(RealJob.company))).scalar() or 0
    )

    total_locations = (
        db.query(func.count(func.distinct(RealJob.location))).scalar() or 0
    )

    inr_jobs = (
        db.query(func.count(RealJob.id))
        .filter(RealJob.currency == "INR")
        .scalar() or 0
    )

    disclosed_salary_jobs = (
        db.query(func.count(RealJob.id))
        .filter(
            RealJob.currency == "INR",
            or_salary_available()
        )
        .scalar() or 0
    )

    return {
        "total_jobs": total_jobs,
        "total_companies": total_companies,
        "total_locations": total_locations,
        "inr_jobs": inr_jobs,
        "disclosed_salary_jobs": disclosed_salary_jobs
    }


def or_salary_available():
    return (
        (RealJob.min_salary.isnot(None)) |
        (RealJob.max_salary.isnot(None))
    )


def get_top_roles(db: Session, limit: int = 10):
    results = (
        db.query(
            RealJob.title,
            func.count(RealJob.id).label("total_jobs")
        )
        .group_by(RealJob.title)
        .order_by(func.count(RealJob.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "role": row.title,
            "total_jobs": row.total_jobs
        }
        for row in results
    ]


def get_top_locations(db: Session, limit: int = 10):
    results = (
        db.query(
            RealJob.location,
            func.count(RealJob.id).label("total_jobs")
        )
        .filter(RealJob.location.isnot(None))
        .group_by(RealJob.location)
        .order_by(func.count(RealJob.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "location": row.location,
            "total_jobs": row.total_jobs
        }
        for row in results
    ]


def get_salary_analysis(db: Session, limit: int = 10):
    results = (
        db.query(
            RealJob.title,
            func.count(RealJob.id).label("job_count"),
            func.avg(
                (RealJob.min_salary + RealJob.max_salary) / 2
            ).label("average_salary")
        )
        .filter(
            RealJob.currency == "INR",
            RealJob.min_salary.isnot(None),
            RealJob.max_salary.isnot(None)
        )
        .group_by(RealJob.title)
        .order_by(func.count(RealJob.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "role": row.title,
            "job_count": row.job_count,
            "average_salary": round(float(row.average_salary), 2)
            if row.average_salary is not None else None
        }
        for row in results
    ]


def get_top_skills(db: Session, limit: int = 15):
    jobs = (
        db.query(RealJob.skills)
        .filter(RealJob.skills.isnot(None), RealJob.skills != "")
        .all()
    )

    skill_counts = {}

    for row in jobs:
        for skill in row.skills.split(";"):
            skill = skill.strip()

            if skill:
                normalized = skill.lower()

                if normalized not in skill_counts:
                    skill_counts[normalized] = {
                        "skill": skill,
                        "job_count": 0
                    }

                skill_counts[normalized]["job_count"] += 1

    results = sorted(
        skill_counts.values(),
        key=lambda item: item["job_count"],
        reverse=True
    )

    return results[:limit]


def get_experience_analysis(db: Session):
    results = (
        db.query(
            RealJob.min_experience,
            RealJob.max_experience,
            func.count(RealJob.id).label("total_jobs")
        )
        .filter(
            RealJob.min_experience.isnot(None),
            RealJob.max_experience.isnot(None)
        )
        .group_by(
            RealJob.min_experience,
            RealJob.max_experience
        )
        .order_by(RealJob.min_experience)
        .all()
    )

    return [
        {
            "min_experience": row.min_experience,
            "max_experience": row.max_experience,
            "total_jobs": row.total_jobs
        }
        for row in results
    ]


def get_top_companies(db: Session, limit: int = 10):
    results = (
        db.query(
            RealJob.company,
            func.count(RealJob.id).label("total_jobs")
        )
        .filter(
            RealJob.company.isnot(None),
            RealJob.company != "Unknown"
        )
        .group_by(RealJob.company)
        .order_by(func.count(RealJob.id).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "company": row.company,
            "total_jobs": row.total_jobs
        }
        for row in results
    ]


from sqlalchemy import text


def get_salary_overview(db):
    query = text("""
        SELECT
            COUNT(*) AS total_inr_jobs,
            COUNT(
                CASE
                    WHEN min_salary > 0 AND max_salary > 0
                    THEN 1
                END
            ) AS disclosed_salary_jobs,
            ROUND(
                AVG(
                    CASE
                        WHEN min_salary > 0 AND max_salary > 0
                        THEN (min_salary + max_salary) / 2
                    END
                ), 2
            ) AS average_salary,
            MIN(
                CASE
                    WHEN min_salary > 0 THEN min_salary
                END
            ) AS minimum_salary,
            MAX(
                CASE
                    WHEN max_salary > 0 THEN max_salary
                END
            ) AS maximum_salary
        FROM real_jobs
        WHERE currency = 'INR'
    """)

    return dict(db.execute(query).mappings().one())


def get_salary_distribution(db):
    query = text("""
        SELECT
            CASE
                WHEN midpoint < 300000 THEN 'Below 3 LPA'
                WHEN midpoint < 600000 THEN '3-6 LPA'
                WHEN midpoint < 1000000 THEN '6-10 LPA'
                WHEN midpoint < 1500000 THEN '10-15 LPA'
                WHEN midpoint < 2500000 THEN '15-25 LPA'
                ELSE 'Above 25 LPA'
            END AS salary_range,
            COUNT(*) AS job_count
        FROM (
            SELECT
                (min_salary + max_salary) / 2 AS midpoint
            FROM real_jobs
            WHERE currency = 'INR'
              AND min_salary > 0
              AND max_salary > 0
        ) AS salary_data
        GROUP BY salary_range
        ORDER BY MIN(midpoint)
    """)

    return [dict(row) for row in db.execute(query).mappings().all()]


def get_salary_by_role(db, limit=10):
    query = text("""
        SELECT
            title AS role,
            COUNT(*) AS job_count,
            ROUND(AVG((min_salary + max_salary) / 2), 2)
                AS average_salary,
            MIN(min_salary) AS minimum_salary,
            MAX(max_salary) AS maximum_salary
        FROM real_jobs
        WHERE currency = 'INR'
          AND min_salary > 0
          AND max_salary > 0
        GROUP BY title
        HAVING COUNT(*) >= 5
        ORDER BY average_salary DESC
        LIMIT :limit
    """)

    return [
        dict(row)
        for row in db.execute(query, {"limit": limit}).mappings().all()
    ]


def get_salary_by_city(db):
    cities = [
        "Bengaluru",
        "Pune",
        "Hyderabad",
        "Mumbai",
        "Chennai",
        "Gurugram",
        "Noida",
    ]

    query = text("""
        SELECT
            :city AS city,
            COUNT(*) AS job_count,
            ROUND(AVG((min_salary + max_salary) / 2), 2)
                AS average_salary
        FROM real_jobs
        WHERE currency = 'INR'
          AND min_salary > 0
          AND max_salary > 0
          AND location LIKE :pattern
    """)

    results = []

    for city in cities:
        row = db.execute(
            query,
            {"city": city, "pattern": f"%{city}%"}
        ).mappings().one()

        results.append(dict(row))

    return sorted(
        results,
        key=lambda item: item["average_salary"] or 0,
        reverse=True
    )


def get_salary_percentiles(db):
    query = text("""
        WITH ordered_salaries AS (
            SELECT
                (min_salary + max_salary) / 2 AS midpoint,
                ROW_NUMBER() OVER (
                    ORDER BY (min_salary + max_salary) / 2
                ) AS row_num,
                COUNT(*) OVER () AS total_rows
            FROM real_jobs
            WHERE currency = 'INR'
              AND min_salary > 0
              AND max_salary > 0
        )
        SELECT
            MAX(total_rows) AS disclosed_salary_jobs,

            ROUND(MAX(
                CASE
                    WHEN row_num = FLOOR((total_rows - 1) * 0.25) + 1
                    THEN midpoint
                END
            ), 2) AS p25_salary,

            ROUND(MAX(
                CASE
                    WHEN row_num = FLOOR((total_rows - 1) * 0.50) + 1
                    THEN midpoint
                END
            ), 2) AS median_salary,

            ROUND(MAX(
                CASE
                    WHEN row_num = FLOOR((total_rows - 1) * 0.75) + 1
                    THEN midpoint
                END
            ), 2) AS p75_salary

        FROM ordered_salaries
    """)

    result = db.execute(query).mappings().one()
    return dict(result)


def get_salary_by_experience(db):
    query = text("""
        SELECT
            CASE
                WHEN max_experience <= 2 THEN '0-2 Years'
                WHEN min_experience >= 0 AND max_experience <= 5 THEN '3-5 Years'
                WHEN min_experience >= 0 AND max_experience <= 8 THEN '6-8 Years'
                WHEN min_experience >= 0 AND max_experience <= 12 THEN '9-12 Years'
                ELSE '13+ Years'
            END AS experience_range,

            COUNT(*) AS job_count,

            ROUND(
                AVG((min_salary + max_salary) / 2), 2
            ) AS average_salary,

            ROUND(
                MIN((min_salary + max_salary) / 2), 2
            ) AS minimum_average_salary,

            ROUND(
                MAX((min_salary + max_salary) / 2), 2
            ) AS maximum_average_salary

        FROM real_jobs
        WHERE currency = 'INR'
          AND min_salary > 0
          AND max_salary > 0
          AND min_experience IS NOT NULL
          AND max_experience IS NOT NULL
          AND min_experience >= 0
          AND max_experience >= min_experience

        GROUP BY experience_range
        ORDER BY MIN(min_experience)
    """)

    return [
        dict(row)
        for row in db.execute(query).mappings().all()
    ]
    
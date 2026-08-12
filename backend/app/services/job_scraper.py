"""
Job scraper service — FreshersWorld and Internshala.
Migrated from web_scraping/web_scraping_jobs.py.  
"""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List

import pandas as pd
import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.models import Job, ScrapeStatus

logger = logging.getLogger(__name__)


# ============================================================================
# Classification
# ============================================================================

def classify_job_category(job_title: str) -> str:
    """
    Classify a job into a category based on title keywords.

    Category names are aligned with the ``Role`` column in skills_data.csv so
    that job listings can be matched directly to skill sets.
    """
    title_lower = job_title.lower()

    # Ordered so more-specific patterns match first.
    categories: Dict[str, List[str]] = {
        "Data Analyst": ["data analyst", "analytics"],
        "Data Scientist": ["data scientist", "data science"],
        "Data Engineer": ["data engineer", "etl", "big data"],
        "Machine Learning Engineer": ["machine learning", "ml engineer"],
        "AI Engineer": ["ai engineer", "artificial intelligence"],
        "Web Developer": ["web developer"],
        "Full Stack Developer": ["full stack", "fullstack"],
        "Backend Developer": ["backend", "node.js", "django", "flask", "java", "spring"],
        "Frontend Developer": ["frontend", "react", "angular", "vue", "javascript", "html", "css"],
        "Android Developer": ["android", "mobile developer", "kotlin"],
        "iOS Developer": ["ios", "swift"],
        "Software Development": ["software", "developer", "programmer", "coding", "sde"],
        "DevOps Engineer": ["devops", "cloud", "aws", "azure", "kubernetes", "docker"],
        "Cybersecurity Analyst": ["security", "cyber", "penetration", "infosec"],
        "UI/UX Designer": ["ui/ux", "ui designer", "ux designer", "product designer"],
        "Software Tester": ["qa", "testing", "test engineer", "automation"],
        "Database": ["database", "dba", "sql", "admin"],
        "Scrum Master": ["project manager", "scrum", "product manager"],
        "Business Analyst": ["business analyst", "ba", "system analyst"],
        "Digital Marketer": ["digital marketing", "seo", "sem", "social media"],
    }

    for category, keywords in categories.items():
        if any(keyword in title_lower for keyword in keywords):
            return category

    return "Information Technology"


# ============================================================================
# FreshersWorld Scraper
# ============================================================================

def scrape_freshersworld_jobs(num_pages: int = 3) -> pd.DataFrame:
    """
    Scrape IT job listings from FreshersWorld.com.

    Args:
        num_pages: Number of result pages to scrape.

    Returns:
        DataFrame with standardised columns.
    """
    all_jobs: List[Dict[str, Any]] = []
    base_url = "https://www.freshersworld.com/jobs/category/it-software-job-vacancies"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": "https://www.freshersworld.com/",
    }

    logger.info("Starting FreshersWorld scraper (%d pages)…", num_pages)

    for page in range(1, num_pages + 1):
        try:
            if page == 1:
                url = base_url
            else:
                offset = (page - 1) * 20
                url = f"{base_url}?&limit=20&offset={offset}"

            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code != 200:
                logger.warning("FW page %d returned status %d", page, response.status_code)
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            job_cards = soup.find_all("div", class_="job-container")

            if not job_cards:
                # Fallback selector
                job_cards = soup.find_all("div", {"job_id": True})

            if not job_cards:
                logger.info("FW: no more cards found on page %d — stopping.", page)
                break

            for card in job_cards:
                try:
                    title_elem = card.find("span", class_="wrap-title") or card.find(
                        "span", class_="seo_title"
                    )
                    job_title = title_elem.text.strip() if title_elem else ""

                    company_elem = card.find("h3", class_="latest-jobs-title")
                    company = company_elem.text.strip() if company_elem else ""

                    location_elem = card.find("span", class_="job-location")
                    if location_elem:
                        loc_link = location_elem.find("a")
                        location = loc_link.text.strip() if loc_link else location_elem.text.strip()
                    else:
                        location = "Not specified"

                    # Salary
                    salary = "Not disclosed"
                    for span in card.find_all("span", class_="qualifications"):
                        text = span.text.strip()
                        if "Monthly" in text or "Yearly" in text or "-" in text:
                            salary = text
                            break

                    # Experience
                    exp_elem = card.find("span", class_="experience")
                    experience = exp_elem.text.strip() if exp_elem else "Fresher"

                    # Link
                    link_elem = card.find("a", href=True)
                    if link_elem and "freshersworld.com/jobs/" in link_elem.get("href", ""):
                        job_link = link_elem.get("href", "")
                    else:
                        job_link = card.get("job_display_url", "")

                    if job_title:
                        all_jobs.append({
                            "platform": "FreshersWorld",
                            "title": job_title,
                            "company": company,
                            "location": location,
                            "category": classify_job_category(job_title),
                            "salary": salary,
                            "experience": experience,
                            "job_link": job_link,
                        })
                except Exception:
                    continue

            logger.info("FW page %d scraped (%d jobs so far).", page, len(all_jobs))

            # Respectful delay
            if page < num_pages:
                time.sleep(1)

        except Exception as exc:
            logger.error("Error scraping FW page %d: %s", page, exc)
            continue

    return pd.DataFrame(all_jobs)


# ============================================================================
# Internshala Scraper
# ============================================================================

def scrape_internshala_jobs(num_pages: int = 5) -> pd.DataFrame:
    """
    Scrape IT job listings from Internshala.

    Args:
        num_pages: Number of result pages to scrape.

    Returns:
        DataFrame with standardised columns.
    """
    all_jobs: List[Dict[str, Any]] = []
    logger.info("Starting Internshala scraper (%d pages)…", num_pages)

    for i in range(1, num_pages + 1):
        try:
            url = f"https://internshala.com/jobs/information-technology-jobs/page-{i}"
            response = requests.get(
                url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15
            )

            if response.status_code != 200:
                logger.warning("Internshala page %d returned status %d", i, response.status_code)
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            cards = soup.find_all("div", class_="individual_internship")

            if not cards:
                logger.info("Internshala: no cards on page %d — stopping.", i)
                break

            for card in cards:
                try:
                    title = card.find("a", class_="job-title-href")
                    company = card.find("p", class_="company-name")
                    location = card.find("div", class_="locations")
                    salary = card.find("span", class_="mobile")
                    experience_element = card.select(".row-1-item span")

                    job_title = title.text.strip() if title else ""
                    job_link = ""
                    if title and title.has_attr("href"):
                        job_link = f"https://internshala.com{title['href']}"

                    all_jobs.append({
                        "platform": "Internshala",
                        "title": job_title,
                        "company": company.text.strip() if company else "",
                        "location": location.text.strip() if location else "",
                        "category": classify_job_category(job_title),
                        "salary": salary.text.strip() if salary else "Not disclosed",
                        "experience": (
                            experience_element[-1].text.strip()
                            if experience_element
                            else "Fresher"
                        ),
                        "job_link": job_link,
                    })
                except Exception:
                    continue

            logger.info("Internshala page %d scraped (%d jobs so far).", i, len(all_jobs))

            if i < num_pages:
                time.sleep(1)

        except Exception as exc:
            logger.error("Error scraping Internshala page %d: %s", i, exc)
            continue

    return pd.DataFrame(all_jobs)


# ============================================================================
# Orchestrator — scrape, deduplicate, store in DB
# ============================================================================

def scrape_and_store_jobs(
    db: Session,
    num_pages_internshala: int = 5,
    num_pages_fw: int = 3,
) -> ScrapeStatus:
    """
    Scrape both platforms, deduplicate, and persist to the database.

    Creates a ``ScrapeStatus`` record to track progress.  On success the
    status is updated to ``'completed'``; on failure it is marked
    ``'failed'`` with the error message.

    Args:
        db: An active SQLAlchemy session.
        num_pages_internshala: Pages to scrape from Internshala.
        num_pages_fw: Pages to scrape from FreshersWorld.

    Returns:
        The ``ScrapeStatus`` ORM instance (committed).
    """
    scrape_status = ScrapeStatus(
        started_at=datetime.utcnow(),
        status="running",
    )
    db.add(scrape_status)
    db.commit()
    db.refresh(scrape_status)

    try:
        # 1. Scrape both platforms
        df_internshala = scrape_internshala_jobs(num_pages=num_pages_internshala)
        df_fw = scrape_freshersworld_jobs(num_pages=num_pages_fw)

        # 2. Combine
        frames = []
        if not df_internshala.empty:
            frames.append(df_internshala)
        if not df_fw.empty:
            frames.append(df_fw)

        if not frames:
            scrape_status.status = "completed"
            scrape_status.completed_at = datetime.utcnow()
            scrape_status.job_count = 0
            db.commit()
            logger.warning("Scraping returned 0 jobs from both platforms.")
            return scrape_status

        df_combined = pd.concat(frames, ignore_index=True)

        # 3. Deduplicate by (title, company)
        df_combined.drop_duplicates(subset=["title", "company"], keep="first", inplace=True)

        # 4. Clear old jobs and insert new ones
        db.query(Job).delete()

        jobs_added = 0
        for _, row in df_combined.iterrows():
            job = Job(
                platform=row.get("platform", ""),
                title=row.get("title", ""),
                company=row.get("company", ""),
                location=row.get("location", "Not specified"),
                category=row.get("category", "Information Technology"),
                salary=row.get("salary", "Not disclosed"),
                experience=row.get("experience", "Fresher"),
                link=row.get("job_link", ""),
                scraped_at=datetime.utcnow(),
            )
            db.add(job)
            jobs_added += 1

        # 5. Update status
        scrape_status.status = "completed"
        scrape_status.completed_at = datetime.utcnow()
        scrape_status.job_count = jobs_added
        db.commit()

        logger.info(
            "Scraping completed: %d jobs stored (Internshala=%d, FW=%d).",
            jobs_added,
            len(df_internshala),
            len(df_fw),
        )
        return scrape_status

    except Exception as exc:
        logger.exception("Scraping failed")
        scrape_status.status = "failed"
        scrape_status.completed_at = datetime.utcnow()
        scrape_status.error_message = str(exc)
        db.commit()
        return scrape_status

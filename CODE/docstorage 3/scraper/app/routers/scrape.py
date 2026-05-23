import asyncio
import hashlib
import time
import logging
import re
from typing import Optional
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
import httpx
import meilisearch
import os
from bs4 import BeautifulSoup

router = APIRouter()
log = logging.getLogger("scraper")
MS_URL = os.getenv("MEILISEARCH_URL", "http://meilisearch:7700")
MS_KEY = os.getenv("MEILISEARCH_KEY", "")

task_status: dict[str, dict] = {}


class ScrapeRequest(BaseModel):
    url: str
    source: str
    language: Optional[str] = None
    max_pages: Optional[int] = 50


def detect_language(url: str, source: str) -> str:
    mapping = {
        "react": "JavaScript",
        "vue": "JavaScript",
        "angular": "JavaScript",
        "next": "JavaScript",
        "svelte": "JavaScript",
        "python": "Python",
        "django": "Python",
        "flask": "Python",
        "fastapi": "Python",
        "symfony": "PHP",
        "laravel": "PHP",
        "rust": "Rust",
        "go": "Go",
        "golang": "Go",
        "typescript": "TypeScript",
    }
    combined = (url + source).lower()
    for key, lang in mapping.items():
        if key in combined:
            return lang
    return "Other"


async def scrape_and_index(
    url: str,
    source: str,
    language: str,
    task_id: str,
    max_pages: int = 50,
):
    task_status[task_id] = {"status": "running", "indexed": 0, "errors": 0}
    log.info(f"[{task_id}] Start scraping: {url}")

    client = meilisearch.Client(MS_URL, MS_KEY)
    idx = client.index("docs")
    try:
        idx.update_settings({
            "searchableAttributes": ["title", "content", "source", "language"],
            "filterableAttributes": [
                "language", "source", "docType", "ownerId", "tags",
            ],
            "searchableAttributes": [
                "title", "content", "source", "language", "tags",
            ],
            "typoTolerance": {"enabled": True},
        })
    except Exception:
        pass

    docs = []
    visited = set()
    queue = [url]

    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as http:
        while queue and len(visited) < max_pages:
            current = queue.pop(0)
            if current in visited:
                continue
            visited.add(current)

            try:
                resp = await http.get(
                    current,
                    headers={"User-Agent": "DocStorage/1.0"},
                )
                if resp.status_code != 200:
                    log.warning(
                        f"[{task_id}] HTTP {resp.status_code}: {current}",
                    )
                    continue

                soup = BeautifulSoup(resp.text, "lxml")

                title_tag = soup.find("h1") or soup.find("title")
                if title_tag:
                    title = title_tag.get_text(strip=True)
                else:
                    title = current

                for tag in soup.find_all([
                    "script", "style", "nav", "footer",
                    "header", "aside", "noscript", "iframe",
                ]):
                    tag.decompose()

                body = (
                    soup.find("article")
                    or soup.find("main")
                    or soup.find(id=re.compile(r"content|main|docs", re.I))
                    or soup.find(
                        class_=re.compile(r"content|main|docs|article", re.I),
                    )
                    or soup.body
                    or soup
                )

                if body:
                    raw_html = str(body)[:200000]
                else:
                    raw_html = ""

                if body:
                    plain_text = body.get_text(" ", strip=True)
                else:
                    plain_text = ""
                plain_text = re.sub(r"\s{3,}", " ", plain_text).strip()

                doc_id = hashlib.md5(current.encode()).hexdigest()
                docs.append({
                    "id": doc_id,
                    "url": current,
                    "title": title,
                    "content": plain_text[:10000],
                    "viewContent": raw_html,
                    "source": source,
                    "language": language,
                    "docType": "scraped",
                    "tags": [],
                    "indexedAt": int(time.time()),
                })

                log.info(f"[{task_id}] Scraped: {title[:60]} ({current})")

                if len(docs) >= 10:
                    idx.add_documents(docs)
                    task_status[task_id]["indexed"] += len(docs)
                    log.info(
                        f"[{task_id}] Indexed batch, total: "
                        f"{task_status[task_id]['indexed']}",
                    )
                    docs = []

                base = "/".join(current.split("/")[:3])
                for a in soup.find_all("a", href=True)[:30]:
                    href = a["href"]
                    if href.startswith("/"):
                        href = base + href
                    if href.startswith(base) and href not in visited:
                        queue.append(href)

                await asyncio.sleep(0.3)

            except Exception as e:
                task_status[task_id]["errors"] += 1
                log.warning(f"[{task_id}] Error scraping {current}: {e}")

    if docs:
        idx.add_documents(docs)
        task_status[task_id]["indexed"] += len(docs)

    task_status[task_id]["status"] = "done"
    log.info(
        f"[{task_id}] Done. Indexed: {task_status[task_id]['indexed']}, "
        f"errors: {task_status[task_id]['errors']}",
    )


@router.post("")
async def start_scrape(req: ScrapeRequest, bg: BackgroundTasks):
    lang = req.language or detect_language(req.url, req.source)
    task_id = hashlib.md5(
        f"{req.url}{time.time()}".encode(),
    ).hexdigest()[:12]
    bg.add_task(
        scrape_and_index,
        req.url,
        req.source,
        lang,
        task_id,
        req.max_pages or 50,
    )
    return {"task_id": task_id, "status": "started"}


@router.get("/status/{task_id}")
async def scrape_status(task_id: str):
    return task_status.get(task_id, {"status": "not_found"})

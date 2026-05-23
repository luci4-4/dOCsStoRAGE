import re
import subprocess
import tempfile
import os
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

TEXT_EXT = {
    ".txt", ".md", ".markdown", ".json", ".csv", ".log",
    ".xml", ".yml", ".yaml", ".rst",
}
HTML_EXT = {".html", ".htm"}
PANDOC_EXT = {'.docx', '.doc'}
PDF_EXT = {'.pdf'}


def _decode(data: bytes) -> str:
    for enc in ("utf-8", "cp1251", "latin-1"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def pdf_to_text(data: bytes) -> str:
    import io
    from pdfminer.high_level import extract_text as pdfminer_extract
    return pdfminer_extract(io.BytesIO(data)) or ""


def _html_to_text(raw: str) -> str:
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(raw, "lxml")
        for tag in soup.find_all(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        body = soup.find(["article", "main"]) or soup.body or soup
        text = body.get_text("\n", strip=True)
    except Exception:
        text = re.sub(r"<[^>]+>", " ", raw)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _pandoc_to_text(data: bytes, suffix: str) -> str:
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(data)
        src = tmp.name
    out = src + ".txt"
    try:
        subprocess.run(
            ["pandoc", src, "-t", "plain", "-o", out],
            check=True,
            capture_output=True,
            timeout=45,
        )
        with open(out, encoding="utf-8", errors="replace") as f:
            return f.read().strip()
    finally:
        for p in (src, out):
            if os.path.exists(p):
                os.unlink(p)


@router.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл больше 5 МБ")

    name = file.filename or "file"
    ext = os.path.splitext(name)[1].lower()

    try:
        if ext in TEXT_EXT:
            text = _decode(data)
            fmt = "markdown" if ext in {".md", ".markdown"} else "text"
        elif ext in HTML_EXT:
            text = _html_to_text(_decode(data))
            fmt = "html"
        elif ext in PDF_EXT:
            text = pdf_to_text(data)
            fmt = 'text'
        elif ext in PANDOC_EXT:
            text = _pandoc_to_text(data, ext)
            fmt = "text"
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Формат {ext} не поддерживается",
            )

        if not text.strip():
            raise HTTPException(
                status_code=422,
                detail="Не удалось извлечь текст из файла",
            )

        return {"text": text, "format": fmt, "title": os.path.splitext(name)[0]}
    except HTTPException:
        raise
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Ошибка конвертации: {e.stderr.decode()[:200]}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

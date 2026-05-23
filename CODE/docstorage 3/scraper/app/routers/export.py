import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import markdown
from bs4 import BeautifulSoup
from fpdf import FPDF

router = APIRouter()


def ascii_filename(name: str, default: str = "document") -> str:
    safe = re.sub(
        r"[^\w\-.]",
        "_",
        name or default,
        flags=re.ASCII,
    )
    safe = safe.strip("._") or default
    return safe[:50]


class ExportRequest(BaseModel):
    content: str
    title: str = "Document"


def md_to_plain_blocks(md_text: str) -> list[dict]:
    html = markdown.markdown(
        md_text,
        extensions=["fenced_code", "tables", "nl2br"],
    )
    soup = BeautifulSoup(html, "html.parser")
    blocks = []
    for el in soup.find_all([
        "h1", "h2", "h3", "h4", "p", "li", "pre", "code", "td", "th", "tr",
    ]):
        text = el.get_text(" ", strip=True)
        if not text:
            continue
        tag = el.name
        if tag in ("h1", "h2", "h3", "h4"):
            level = int(tag[1])
            blocks.append({"type": "heading", "text": text, "level": level})
        elif tag == "pre":
            blocks.append({"type": "code", "text": text})
        elif tag == "li":
            blocks.append({"type": "bullet", "text": text})
        else:
            blocks.append({"type": "para", "text": text})
    return blocks


class PDF(FPDF):
    def __init__(self, title: str):
        super().__init__()
        self.doc_title = title
        self.add_font(
            "DejaVu",
            style="",
            fname="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        )
        self.add_font(
            "DejaVu",
            style="B",
            fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        )
        self.add_font(
            "DejaVuMono",
            style="",
            fname="/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        )

    def header(self):
        self.set_font("DejaVu", "B", 9)
        self.set_text_color(150, 150, 150)
        self.cell(
            0,
            8,
            self.doc_title[:80],
            align="L",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        self.set_draw_color(200, 200, 200)
        self.line(
            self.l_margin,
            self.get_y(),
            self.w - self.r_margin,
            self.get_y(),
        )
        self.ln(3)

    def footer(self):
        self.set_y(-15)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"{self.page_no()}", align="C")


def build_pdf(title: str, blocks: list[dict]) -> bytes:
    pdf = PDF(title)
    pdf.set_margins(20, 20, 20)
    pdf.add_page()
    pdf.set_auto_page_break(True, margin=20)

    pdf.set_font("DejaVu", "B", 20)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_draw_color(200, 200, 200)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(6)

    for block in blocks:
        t = block["type"]
        text = block["text"]

        if t == "heading":
            lvl = block["level"]
            sizes = {1: 16, 2: 14, 3: 12, 4: 11}
            pdf.ln(3)
            pdf.set_font("DejaVu", "B", sizes.get(lvl, 11))
            pdf.set_text_color(20, 20, 20)
            pdf.multi_cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
            pdf.ln(1)

        elif t == "code":
            pdf.ln(2)
            pdf.set_fill_color(245, 245, 245)
            pdf.set_font("DejaVuMono", "", 9)
            pdf.set_text_color(40, 40, 40)
            pdf.multi_cell(
                0,
                6,
                text,
                fill=True,
                new_x="LMARGIN",
                new_y="NEXT",
            )
            pdf.ln(2)

        elif t == "bullet":
            pdf.set_font("DejaVu", "", 11)
            pdf.set_text_color(40, 40, 40)
            pdf.cell(6, 7, "•")
            pdf.multi_cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")

        else:
            pdf.set_font("DejaVu", "", 11)
            pdf.set_text_color(40, 40, 40)
            pdf.multi_cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)

    return bytes(pdf.output())


@router.post("/pdf")
async def export_pdf(req: ExportRequest):
    try:
        blocks = md_to_plain_blocks(req.content)
        pdf_bytes = build_pdf(req.title or "Document", blocks)
        filename = ascii_filename(req.title or "document") + ".pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/convert")
async def convert_md(req: ExportRequest):
    html = markdown.markdown(
        req.content,
        extensions=["fenced_code", "tables", "nl2br"],
    )
    return {"html": html}

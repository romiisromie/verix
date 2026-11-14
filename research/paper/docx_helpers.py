# Общие помощники для документов РКНП: оформление по требованиям
# (Times New Roman 14, поля 2,5 / 1 / 2 / 2 см, одинарный интервал, абзацный отступ).
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

FONT = "Times New Roman"


def new_document():
    doc = Document()
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
    sec.left_margin, sec.right_margin = Cm(2.5), Cm(1.0)
    sec.top_margin, sec.bottom_margin = Cm(2.0), Cm(2.0)
    st = doc.styles["Normal"]
    st.font.name, st.font.size = FONT, Pt(14)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    pf = st.paragraph_format
    pf.line_spacing, pf.space_after, pf.space_before = 1.0, Pt(0), Pt(0)
    for name, size in (("Heading 1", 14), ("Heading 2", 14), ("Heading 3", 14)):
        h = doc.styles[name]
        h.font.name, h.font.size, h.font.bold = FONT, Pt(size), True
        h.font.color.rgb = RGBColor(0, 0, 0)
        h.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
        h.element.rPr.rFonts.set(qn("w:ascii"), FONT)
        h.element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
        h.paragraph_format.space_before, h.paragraph_format.space_after = Pt(12), Pt(6)
        h.paragraph_format.keep_with_next = True
    doc.styles["Heading 1"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    # Word сам обновит оглавление и номера страниц при открытии
    upd = OxmlElement("w:updateFields"); upd.set(qn("w:val"), "true")
    doc.settings.element.append(upd)
    return doc


def para(doc, text="", *, bold=False, italic=False, align="justify", indent=True, size=None, space_after=0, keep=False):
    p = doc.add_paragraph()
    p.alignment = {"justify": WD_ALIGN_PARAGRAPH.JUSTIFY, "center": WD_ALIGN_PARAGRAPH.CENTER,
                   "left": WD_ALIGN_PARAGRAPH.LEFT, "right": WD_ALIGN_PARAGRAPH.RIGHT}[align]
    if indent and align == "justify":
        p.paragraph_format.first_line_indent = Cm(1.25)
    p.paragraph_format.space_after = Pt(space_after)
    if keep:
        p.paragraph_format.keep_with_next = True
    add_runs(p, text, bold=bold, italic=italic, size=size)
    return p


def add_runs(p, text, *, bold=False, italic=False, size=None):
    # **жирный** внутри текста
    parts = text.split("**")
    for i, part in enumerate(parts):
        if not part:
            continue
        r = p.add_run(part)
        r.bold = bold or (i % 2 == 1)
        r.italic = italic
        if size:
            r.font.size = Pt(size)
    return p


def bullets(doc, items, numbered=False):
    for i, it in enumerate(items, 1):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.left_indent = Cm(1.25)
        p.paragraph_format.first_line_indent = Cm(-0.6)
        add_runs(p, (f"{i}) " if numbered else "– ") + it)


def heading(doc, text, level=1, page_break=False):
    if page_break:
        doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
    return doc.add_heading(text, level=level)


def page_break(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def table(doc, header, rows, widths=None, size=12, caption=None):
    if caption:
        para(doc, caption, align="left", indent=False, keep=True, size=size + 1)
    t = doc.add_table(rows=1, cols=len(header))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c, h in zip(t.rows[0].cells, header):
        c.text = ""
        add_runs(c.paragraphs[0], h, bold=True, size=size)
        shade(c, "E8EEF9")
    for row in rows:
        cells = t.add_row().cells
        for c, v in zip(cells, row):
            c.text = ""
            add_runs(c.paragraphs[0], str(v), size=size)
    if widths:
        for row in t.rows:
            for c, w in zip(row.cells, widths):
                c.width = Cm(w)
    # повтор шапки на новой странице
    trPr = t.rows[0]._tr.get_or_add_trPr()
    h = OxmlElement("w:tblHeader"); h.set(qn("w:val"), "true"); trPr.append(h)
    doc.add_paragraph()
    return t


def shade(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def figure(doc, path, caption, width_cm=15):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(str(path), width=Cm(width_cm))
    para(doc, caption, align="center", indent=False, size=12, space_after=6)


def placeholder(doc, text):
    # заметный блок «заполнить»: жёлтая заливка
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = p.add_run("[ЗАПОЛНИТЬ] " + text)
    r.italic = True
    rPr = r._r.get_or_add_rPr()
    hl = OxmlElement("w:highlight"); hl.set(qn("w:val"), "yellow"); rPr.append(hl)
    return p


def toc(doc):
    p = doc.add_paragraph()
    run = p.add_run()
    for tag, txt in (("begin", None), (None, 'TOC \\o "1-2" \\h \\z \\u'), ("separate", None), (None, None), ("end", None)):
        if tag:
            fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), tag); run._r.append(fc)
        elif txt:
            it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = txt; run._r.append(it)
        else:
            t = OxmlElement("w:t"); t.text = "Оглавление обновится при открытии файла (или нажмите F9)."; run._r.append(t)


def numbered_section(doc, start=3):
    """Новый раздел с нумерацией страниц внизу по центру, начиная с `start`."""
    sec = doc.add_section(WD_SECTION.NEW_PAGE)
    prev = doc.sections[0]
    sec.left_margin, sec.right_margin = prev.left_margin, prev.right_margin
    sec.top_margin, sec.bottom_margin = prev.top_margin, prev.bottom_margin
    sec.footer.is_linked_to_previous = False
    pg = OxmlElement("w:pgNumType"); pg.set(qn("w:start"), str(start)); sec._sectPr.append(pg)
    fp = sec.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run()
    for tag, txt in (("begin", None), (None, "PAGE"), ("end", None)):
        if tag:
            fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), tag); r._r.append(fc)
        else:
            it = OxmlElement("w:instrText"); it.text = txt; r._r.append(it)
    r.font.size = Pt(12)
    return sec


def figure_row(doc, paths, caption, width_cm=5.1):
    """Несколько скриншотов в ряд (таблица без рамок) с общей подписью."""
    t = doc.add_table(rows=1, cols=len(paths))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c, path in zip(t.rows[0].cells, paths):
        p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(path), width=Cm(width_cm))
    para(doc, caption, align="center", indent=False, size=12, space_after=6)

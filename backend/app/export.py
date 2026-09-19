import io

from .models import Insight, ResearchJob


def to_markdown(job: ResearchJob, insights: list[Insight]) -> str:
    lines = [f"# Research report: {job.topic}", ""]
    if job.demo_mode:
        lines.append("_Generated in demo mode — set ANTHROPIC_API_KEY for a live run._")
        lines.append("")
    for i, item in enumerate(insights, start=1):
        lines.append(f"## {i}. {item.title}")
        lines.append("")
        lines.append(item.summary)
        lines.append("")
        lines.append(f"> {item.evidence_quote}")
        lines.append("")
        lines.append(f"Source: [{item.source_title}]({item.source_url})")
        if item.relevance:
            lines.append(f"Relevance: {item.relevance}")
        lines.append("")
    return "\n".join(lines)


def to_pdf(job: ResearchJob, insights: list[Insight]) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm)
    styles = getSampleStyleSheet()
    quote_style = ParagraphStyle("Quote", parent=styles["Italic"], leftIndent=12, textColor="#555555")

    story = [Paragraph(f"Research report: {job.topic}", styles["Title"]), Spacer(1, 12)]
    if job.demo_mode:
        story.append(Paragraph("Generated in demo mode — set ANTHROPIC_API_KEY for a live run.", styles["Italic"]))
        story.append(Spacer(1, 12))

    for i, item in enumerate(insights, start=1):
        story.append(Paragraph(f"{i}. {item.title}", styles["Heading2"]))
        story.append(Paragraph(item.summary, styles["BodyText"]))
        story.append(Paragraph(f"&ldquo;{item.evidence_quote}&rdquo;", quote_style))
        story.append(Paragraph(f'Source: <a href="{item.source_url}">{item.source_title}</a>', styles["BodyText"]))
        story.append(Spacer(1, 16))

    doc.build(story)
    return buf.getvalue()

import fitz  # PyMuPDF


class PDFParseError(Exception):
    pass


def extract_text(data: bytes) -> str:
    """Return plain text from a PDF's bytes."""
    try:
        with fitz.open(stream=data, filetype="pdf") as doc:
            text = "\n".join(page.get_text("text") for page in doc)
    except Exception as exc:
        raise PDFParseError("File is not a readable PDF.") from exc
    text = text.strip()
    if len(text) < 50:
        raise PDFParseError("No readable text found. Scanned/image PDFs are not supported yet.")
    return text

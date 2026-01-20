"""IBM Docling converter - Advanced document understanding."""

import asyncio
from pathlib import Path
from typing import List

from docling.document_converter import DocumentConverter

from .base import BaseConverter


class DoclingConverter(BaseConverter):
    """
    IBM Docling converter.

    Advanced document understanding with table detection,
    layout analysis, and OCR capabilities.
    """

    name = "Docling (IBM)"
    description = "Advanced document understanding by IBM. Excellent for PDFs with complex layouts, tables, and figures."
    supported_extensions: List[str] = [
        "pdf", "docx", "pptx", "xlsx", "html", "htm",
        "png", "jpg", "jpeg", "tiff", "bmp"
    ]
    requires_api_key = False

    async def convert(self, file_path: Path, output_path: Path) -> str:
        """Convert file using docling."""

        def _convert():
            converter = DocumentConverter()
            result = converter.convert(str(file_path))
            markdown_content = result.document.export_to_markdown()

            # Save to output file
            output_file = output_path / f"{file_path.stem}.md"
            output_file.write_text(markdown_content, encoding="utf-8")

            return str(output_file)

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _convert)

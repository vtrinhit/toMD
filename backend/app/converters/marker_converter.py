"""Marker PDF converter - Best OCR for PDFs."""

import asyncio
from pathlib import Path
from typing import List

from marker.converters.pdf import PdfConverter
from marker.models import create_model_dict
from marker.output import text_from_rendered

from .base import BaseConverter


class MarkerConverter(BaseConverter):
    """
    Marker PDF converter.

    High-quality PDF to markdown with excellent OCR,
    table detection, and equation support.
    """

    name = "Marker"
    description = "Best-in-class PDF to Markdown converter with OCR, table detection, and LaTeX equation support."
    supported_extensions: List[str] = ["pdf"]
    requires_api_key = False

    async def convert(self, file_path: Path, output_path: Path) -> str:
        """Convert PDF using marker."""

        def _convert():
            # Create models
            model_dict = create_model_dict()

            # Convert
            converter = PdfConverter(artifact_dict=model_dict)
            rendered = converter(str(file_path))
            markdown_content, _, _ = text_from_rendered(rendered)

            # Save to output file
            output_file = output_path / f"{file_path.stem}.md"
            output_file.write_text(markdown_content, encoding="utf-8")

            return str(output_file)

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _convert)

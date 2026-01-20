"""Unstructured converter - AI-powered document parsing."""

import asyncio
from pathlib import Path
from typing import List

from unstructured.partition.auto import partition

from .base import BaseConverter


class UnstructuredConverter(BaseConverter):
    """
    Unstructured converter.

    AI-powered document parsing with element detection,
    chunking, and metadata extraction.
    """

    name = "Unstructured"
    description = "AI-powered document parsing with element detection, chunking, and metadata extraction."
    supported_extensions: List[str] = [
        "pdf", "docx", "doc", "pptx", "ppt", "xlsx", "xls",
        "html", "htm", "xml",
        "png", "jpg", "jpeg", "tiff", "bmp", "heic",
        "txt", "md", "rst", "rtf",
        "eml", "msg", "epub",
        "csv", "tsv"
    ]
    requires_api_key = False

    async def convert(self, file_path: Path, output_path: Path) -> str:
        """Convert file using unstructured."""

        def _convert():
            # Partition the document
            elements = partition(str(file_path))

            # Convert elements to markdown
            markdown_lines = []

            for element in elements:
                element_type = type(element).__name__

                if element_type == "Title":
                    markdown_lines.append(f"# {element.text}\n")
                elif element_type == "Header":
                    markdown_lines.append(f"## {element.text}\n")
                elif element_type == "ListItem":
                    markdown_lines.append(f"- {element.text}")
                elif element_type == "Table":
                    if hasattr(element, "metadata") and hasattr(element.metadata, "text_as_html"):
                        markdown_lines.append(element.metadata.text_as_html)
                    else:
                        markdown_lines.append(f"```\n{element.text}\n```")
                elif element_type == "CodeSnippet":
                    markdown_lines.append(f"```\n{element.text}\n```\n")
                elif element_type == "Image":
                    if hasattr(element, "metadata") and element.metadata.image_path:
                        markdown_lines.append(f"![Image]({element.metadata.image_path})\n")
                else:
                    markdown_lines.append(f"{element.text}\n")

            markdown_content = "\n".join(markdown_lines)

            # Save to output file
            output_file = output_path / f"{file_path.stem}.md"
            output_file.write_text(markdown_content, encoding="utf-8")

            return str(output_file)

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _convert)

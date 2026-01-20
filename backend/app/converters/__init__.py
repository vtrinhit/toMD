"""Converters package."""

from typing import Dict, Type, Optional, List
from pathlib import Path
import logging

from .base import BaseConverter

logger = logging.getLogger(__name__)

# Registry of available converters
CONVERTERS: Dict[str, Type[BaseConverter]] = {}

# Track which converters are available
AVAILABLE_CONVERTERS: List[str] = []
UNAVAILABLE_CONVERTERS: Dict[str, str] = {}


def _register_converter(name: str, module_name: str, class_name: str):
    """Try to register a converter, handling import errors gracefully."""
    try:
        module = __import__(f"app.converters.{module_name}", fromlist=[class_name])
        converter_class = getattr(module, class_name)
        CONVERTERS[name] = converter_class
        AVAILABLE_CONVERTERS.append(name)
        logger.info(f"Loaded converter: {name}")
    except ImportError as e:
        UNAVAILABLE_CONVERTERS[name] = str(e)
        logger.warning(f"Converter {name} not available: {e}")
    except Exception as e:
        UNAVAILABLE_CONVERTERS[name] = str(e)
        logger.error(f"Error loading converter {name}: {e}")


# Register all converters - order matters for priority
_register_converter("markitdown", "markitdown_converter", "MarkitdownConverter")
_register_converter("docling", "docling_converter", "DoclingConverter")
_register_converter("marker", "marker_converter", "MarkerConverter")
_register_converter("pypandoc", "pypandoc_converter", "PypandocConverter")
_register_converter("unstructured", "unstructured_converter", "UnstructuredConverter")
_register_converter("mammoth", "mammoth_converter", "MammothConverter")
_register_converter("html2text", "html2text_converter", "Html2textConverter")


def get_converter(
    converter_type: str,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
) -> BaseConverter:
    """Get converter instance by type."""
    if converter_type not in CONVERTERS:
        available = ", ".join(AVAILABLE_CONVERTERS)
        raise ValueError(
            f"Converter '{converter_type}' not available. "
            f"Available converters: {available}"
        )

    return CONVERTERS[converter_type](api_key=api_key, base_url=base_url)


def get_best_converter_for_file(
    file_path: Path,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
) -> BaseConverter:
    """
    Get the best converter for a given file based on extension.

    Priority order:
    1. File-specific converters (marker for PDF, mammoth for DOCX)
    2. Universal converters (markitdown, docling)
    """
    ext = file_path.suffix.lower().lstrip(".")

    # Priority mapping
    priority = {
        "pdf": ["marker", "docling", "markitdown", "pypandoc", "unstructured"],
        "docx": ["mammoth", "markitdown", "docling", "pypandoc", "unstructured"],
        "doc": ["markitdown", "pypandoc", "unstructured"],
        "pptx": ["docling", "markitdown", "unstructured"],
        "ppt": ["markitdown", "unstructured"],
        "xlsx": ["docling", "markitdown", "unstructured"],
        "xls": ["markitdown", "unstructured"],
        "html": ["html2text", "markitdown", "pypandoc", "unstructured"],
        "htm": ["html2text", "markitdown", "pypandoc", "unstructured"],
        "csv": ["markitdown", "unstructured"],
        "json": ["markitdown", "pypandoc"],
        "xml": ["markitdown", "html2text", "unstructured"],
        "tex": ["pypandoc"],
        "latex": ["pypandoc"],
        "rst": ["pypandoc", "unstructured"],
        "epub": ["pypandoc", "markitdown"],
        "ipynb": ["pypandoc"],
    }

    # Image formats - markitdown with OCR
    image_exts = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "tiff", "heic"]
    for img_ext in image_exts:
        priority[img_ext] = ["markitdown", "docling", "unstructured"]

    # Audio formats - markitdown with transcription
    audio_exts = ["mp3", "wav", "m4a", "ogg", "flac"]
    for audio_ext in audio_exts:
        priority[audio_ext] = ["markitdown"]

    # Get priority list or default to available converters
    converter_priority = priority.get(ext, AVAILABLE_CONVERTERS)

    for converter_name in converter_priority:
        if converter_name not in CONVERTERS:
            continue
        try:
            converter = get_converter(converter_name, api_key, base_url)
            if converter.supports_file(file_path):
                return converter
        except Exception:
            continue

    # Fallback to first available converter
    if AVAILABLE_CONVERTERS:
        return get_converter(AVAILABLE_CONVERTERS[0], api_key, base_url)

    raise ValueError("No converters available")


def get_all_converter_info() -> list:
    """Get information about all available converters."""
    return [
        {
            "id": name,
            **converter_class.get_info(),
        }
        for name, converter_class in CONVERTERS.items()
    ]


def get_unavailable_converters() -> Dict[str, str]:
    """Get dict of unavailable converters and their error messages."""
    return UNAVAILABLE_CONVERTERS.copy()


__all__ = [
    "BaseConverter",
    "CONVERTERS",
    "AVAILABLE_CONVERTERS",
    "get_converter",
    "get_best_converter_for_file",
    "get_all_converter_info",
    "get_unavailable_converters",
]

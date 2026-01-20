<div align="center">

### Universal File to Markdown Converter

[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Convert any file to Markdown with 7 powerful conversion engines**

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [API](#api-reference) • [Contributing](#contributing)

</div>

---

## Overview

**toMD** is a modern, production-ready web application that converts various file formats to Markdown. It supports **7 different conversion libraries**, allowing you to choose the best engine for your specific needs.

Whether you're converting PDFs with complex layouts, Word documents, Excel spreadsheets, images with OCR, or audio files with transcription - toMD has you covered.

## Features

### Conversion Libraries

| Library | Provider | Best For | Formats |
|---------|----------|----------|---------|
| **Markitdown** | Microsoft | Universal conversion | PDF, Office, Images, Audio, HTML, CSV, JSON, XML |
| **Docling** | IBM | Complex PDFs with tables | PDF, DOCX, PPTX, XLSX, HTML, Images |
| **Marker** | VikParuchuri | PDF with OCR & LaTeX | PDF (with equation support) |
| **Pypandoc** | Pandoc | Academic documents | 40+ formats including LaTeX, RST, MediaWiki |
| **Unstructured** | Unstructured.io | AI-powered parsing | Documents, Images, Emails |
| **Mammoth** | - | Semantic DOCX | DOCX (preserves structure) |
| **HTML2Text** | - | Fast HTML conversion | HTML, XHTML, XML |

### UI/UX Features

- **Dark/Light Mode** - Automatic system preference detection with manual toggle
- **Fully Responsive** - Mobile-first design, works on all devices
- **Drag & Drop** - Upload multiple files at once
- **Real-time Progress** - Live conversion status updates
- **Markdown Preview** - View converted content with syntax highlighting
- **Batch Processing** - Convert multiple files simultaneously

### Technical Features

- **Async Processing** - Non-blocking file conversion
- **Multi-threading** - Parallel processing for multiple files
- **OpenAI Integration** - Enhanced OCR and audio transcription
- **RESTful API** - Full API access for integration
- **Container Ready** - Docker & Podman support

## Demo

<div align="center">

| Light Mode | Dark Mode |
|:----------:|:---------:|
| ![Light Mode](https://via.placeholder.com/400x300/f8fafc/1e293b?text=Light+Mode) | ![Dark Mode](https://via.placeholder.com/400x300/0f172a/f8fafc?text=Dark+Mode) |

</div>

## Supported Formats

<table>
<tr>
<td width="33%">

### Documents
- PDF
- DOCX / DOC
- PPTX / PPT
- XLSX / XLS
- RTF
- ODT

</td>
<td width="33%">

### Web & Data
- HTML / XHTML
- XML
- JSON
- CSV / TSV
- RSS / Atom

</td>
<td width="33%">

### Media
- PNG / JPG / GIF
- TIFF / BMP / WebP
- MP3 / WAV / M4A
- OGG / FLAC

</td>
</tr>
<tr>
<td>

### Code & Markup
- LaTeX / TeX
- reStructuredText
- Jupyter Notebooks
- Org-mode

</td>
<td>

### Ebooks & Archives
- EPUB
- FB2
- ZIP (with documents)

</td>
<td>

### Others
- TXT / MD
- Email (EML, MSG)
- MediaWiki

</td>
</tr>
</table>

## Installation

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/toMD.git
cd toMD

# Start the application
docker-compose up -d

# Access at http://localhost
```

### Quick Start with Podman

```bash
# Start with Podman
podman-compose up -d

# Access at http://localhost
```

### Development Setup

#### Prerequisites

- Python 3.11+
- Node.js 18+
- Pandoc (for pypandoc)
- Tesseract OCR (for image processing)

#### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

#### Using Makefile

```bash
# Setup everything
./scripts/setup.sh

# Or use make commands
make dev-backend   # Terminal 1
make dev-frontend  # Terminal 2

# Production
make prod          # Build and start with Docker
```

## Usage

### Web Interface

1. **Select Converter** - Choose a conversion library or use "Auto Select"
2. **Upload Files** - Drag & drop or click to browse
3. **Convert** - Click the Convert button
4. **Download** - Preview and download your Markdown files

### Command Line (via API)

```bash
# Upload a file
curl -X POST http://localhost:8000/api/convert/upload \
  -F "files=@document.pdf"

# Start conversion
curl -X POST http://localhost:8000/api/convert/start \
  -F "file_ids=<file-id>" \
  -F "converter=markitdown"

# Download result
curl http://localhost:8000/api/convert/download/<job-id> \
  -o output.md
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for enhanced OCR/transcription | - |
| `OPENAI_BASE_URL` | Custom OpenAI-compatible endpoint | - |
| `MAX_UPLOAD_SIZE` | Maximum file size (bytes) | `104857600` (100MB) |
| `MAX_WORKERS` | Concurrent processing workers | `4` |
| `DEBUG` | Enable debug mode | `false` |

### Using .env File

```bash
cp .env.example .env
# Edit .env with your settings
```

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/convert/converters` | List available converters |
| `POST` | `/api/convert/upload` | Upload files |
| `DELETE` | `/api/convert/upload/{id}` | Remove uploaded file |
| `POST` | `/api/convert/start` | Start conversion |
| `GET` | `/api/convert/jobs` | List all jobs |
| `GET` | `/api/convert/jobs/{id}` | Get job status |
| `DELETE` | `/api/convert/jobs/{id}` | Delete job |
| `GET` | `/api/convert/download/{id}` | Download result |
| `GET` | `/api/convert/preview/{id}` | Preview result |
| `GET` | `/api/settings` | Get settings |
| `PUT` | `/api/settings` | Update settings |

### Example Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "file_info": {
    "id": "file-123",
    "name": "document.pdf",
    "size": 1048576,
    "mime_type": "application/pdf",
    "extension": "pdf"
  },
  "converter": "marker",
  "status": "completed",
  "progress": 100,
  "output_size": 24576,
  "processing_time": 2.5
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React + Vite + TailwindCSS + Shadcn/UI + Zustand           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────────┐
│                        Backend                               │
│  FastAPI + Uvicorn + Async Processing                       │
├─────────────────────────────────────────────────────────────┤
│                     Converters                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Markitdown│ │ Docling  │ │  Marker  │ │ Pypandoc │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │Unstructu.│ │ Mammoth  │ │HTML2Text │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Shadcn/UI, Zustand, React Query, Framer Motion |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic, aiofiles |
| **Converters** | markitdown, docling, marker-pdf, pypandoc, unstructured, mammoth, html2text |
| **Infrastructure** | Docker, Podman, Nginx |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Microsoft Markitdown](https://github.com/microsoft/markitdown)
- [IBM Docling](https://github.com/DS4SD/docling)
- [Marker](https://github.com/VikParuchuri/marker)
- [Pandoc](https://pandoc.org/)
- [Unstructured](https://github.com/Unstructured-IO/unstructured)
- [Mammoth](https://github.com/mwilliamson/python-mammoth)
- [html2text](https://github.com/Alir3z4/html2text)

---

<div align="center">

**[Back to Top](#tomd)**

Made with ❤️ by the toMD Team

</div>

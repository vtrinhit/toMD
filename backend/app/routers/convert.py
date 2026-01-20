"""Conversion API router."""

import io
import zipfile
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from ..models import (
    ConverterType,
    ConversionJob,
    ConverterInfo,
)
from ..converters import get_all_converter_info, CONVERTERS
from ..utils import (
    save_upload_file,
    get_file_info,
    delete_file,
    create_job,
    get_job,
    get_all_jobs,
    delete_job,
    process_multiple_jobs,
)
from ..config import settings


router = APIRouter(prefix="/api/convert", tags=["convert"])


@router.get("/converters", response_model=List[ConverterInfo])
async def list_converters():
    """Get list of available converters."""
    converters = get_all_converter_info()
    return [
        ConverterInfo(
            id=ConverterType(c["id"]),
            name=c["name"],
            description=c["description"],
            supported_extensions=c["supported_extensions"],
            requires_api_key=c.get("requires_api_key", False),
        )
        for c in converters
    ]


@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload files for conversion."""
    uploaded = []

    for file in files:
        if not file.filename:
            continue

        content = await file.read()

        # Check file size
        if len(content) > settings.max_upload_size:
            raise HTTPException(
                status_code=413,
                detail=f"File {file.filename} exceeds maximum size of {settings.max_upload_size // (1024*1024)}MB",
            )

        file_info = await save_upload_file(content, file.filename)
        uploaded.append(file_info)

    return {"files": uploaded, "count": len(uploaded)}


@router.delete("/upload/{file_id}")
async def remove_uploaded_file(file_id: str):
    """Remove an uploaded file."""
    if delete_file(file_id):
        return {"status": "deleted", "file_id": file_id}
    raise HTTPException(status_code=404, detail="File not found")


@router.post("/start")
async def start_conversion(
    file_ids: List[str] = Form(...),
    converter: ConverterType = Form(ConverterType.AUTO),
):
    """Start conversion for uploaded files."""
    from ..utils.file_manager import uploaded_files

    # Get settings for API key
    api_key = settings.openai_api_key
    base_url = settings.openai_base_url

    # Validate file IDs
    file_infos = []
    for file_id in file_ids:
        file_info = get_file_info(file_id)
        if not file_info:
            raise HTTPException(status_code=404, detail=f"File {file_id} not found")
        file_infos.append(file_info)

    # Create jobs
    jobs = await process_multiple_jobs(file_infos, converter, api_key, base_url)

    return {"jobs": jobs, "count": len(jobs)}


@router.get("/jobs", response_model=List[ConversionJob])
async def list_jobs():
    """Get all conversion jobs."""
    return get_all_jobs()


@router.get("/jobs/{job_id}", response_model=ConversionJob)
async def get_job_status(job_id: str):
    """Get status of a specific job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/jobs/{job_id}")
async def remove_job(job_id: str):
    """Remove a conversion job."""
    if delete_job(job_id):
        return {"status": "deleted", "job_id": job_id}
    raise HTTPException(status_code=404, detail="Job not found")


@router.get("/download/{job_id}")
async def download_result(job_id: str):
    """Download the converted markdown file."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.output_file:
        raise HTTPException(status_code=400, detail="Conversion not completed")

    output_path = Path(job.output_file)
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")

    return FileResponse(
        path=output_path,
        media_type="text/markdown",
        filename=f"{job.file_info.name.rsplit('.', 1)[0]}.md",
    )


@router.get("/preview/{job_id}")
async def preview_result(job_id: str):
    """Get preview of converted markdown content."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.output_file:
        raise HTTPException(status_code=400, detail="Conversion not completed")

    output_path = Path(job.output_file)
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")

    content = output_path.read_text(encoding="utf-8")

    # Limit preview to first 10000 characters
    preview = content[:10000]
    truncated = len(content) > 10000

    return {
        "content": preview,
        "truncated": truncated,
        "total_length": len(content),
    }


class MultipleJobIds(BaseModel):
    """Request body for multiple job operations."""
    job_ids: List[str]


@router.post("/download-multiple")
async def download_multiple_results(request: MultipleJobIds):
    """Download multiple converted files as a ZIP archive."""
    if not request.job_ids:
        raise HTTPException(status_code=400, detail="No job IDs provided")

    # Create in-memory ZIP file
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for job_id in request.job_ids:
            job = get_job(job_id)
            if not job:
                continue

            if not job.output_file:
                continue

            output_path = Path(job.output_file)
            if not output_path.exists():
                continue

            # Add file to ZIP with original name
            filename = f"{job.file_info.name.rsplit('.', 1)[0]}.md"
            zip_file.write(output_path, filename)

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": "attachment; filename=tomd-export.zip"
        }
    )


@router.post("/delete-multiple")
async def delete_multiple_jobs(request: MultipleJobIds):
    """Delete multiple conversion jobs."""
    if not request.job_ids:
        raise HTTPException(status_code=400, detail="No job IDs provided")

    deleted = []
    failed = []

    for job_id in request.job_ids:
        if delete_job(job_id):
            deleted.append(job_id)
        else:
            failed.append(job_id)

    return {
        "deleted": deleted,
        "failed": failed,
        "deleted_count": len(deleted),
        "failed_count": len(failed),
    }

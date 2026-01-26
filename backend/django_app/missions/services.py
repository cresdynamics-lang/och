"""
Mission services - File upload, S3 integration, etc.
"""
import os
import logging
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError
    S3_AVAILABLE = True
except ImportError:
    S3_AVAILABLE = False
    logger.warning("boto3 not available, using local storage")


def get_s3_client():
    """Get S3 client if configured."""
    if not S3_AVAILABLE:
        return None
    
    aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
    aws_region = os.environ.get('AWS_REGION', 'us-east-1')
    s3_bucket = os.environ.get('S3_MISSIONS_BUCKET')
    
    if not all([aws_access_key, aws_secret_key, s3_bucket]):
        return None
    
    return boto3.client(
        's3',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    ), s3_bucket


def generate_presigned_upload_url(submission_id: str, filename: str, content_type: str, max_size_mb: int = 10):
    """
    Generate presigned URL for S3 upload.
    Returns (presigned_url, object_key) or (None, None) if S3 not configured.
    """
    s3_client, bucket = get_s3_client()
    if not s3_client:
        return None, None
    
    object_key = f'missions/{submission_id}/{filename}'
    
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket,
                'Key': object_key,
                'ContentType': content_type,
            },
            ExpiresIn=3600,  # 1 hour
        )
        return presigned_url, object_key
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return None, None


def validate_file_type(filename: str, allowed_extensions: list = None) -> bool:
    """Validate file type."""
    if allowed_extensions is None:
        allowed_extensions = ['.pdf', '.zip', '.png', '.jpg', '.jpeg', '.txt', '.log', '.json', '.xml']
    file_ext = os.path.splitext(filename)[1].lower()
    return file_ext in allowed_extensions


def upload_file_to_storage(file: UploadedFile, submission_id: str) -> str:
    """
    Upload file to S3 or local storage.
    Returns the file URL.
    """
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size > max_size:
        raise ValueError(f"File exceeds {max_size / 1024 / 1024}MB limit")
    
    # Check file type (basic validation)
    allowed_extensions = ['.pdf', '.zip', '.png', '.jpg', '.jpeg', '.txt', '.log', '.json', '.xml']
    file_ext = os.path.splitext(file.name)[1].lower()
    if file_ext not in allowed_extensions:
        raise ValueError(f"File type {file_ext} not allowed")
    
    s3_client, bucket = get_s3_client()
    
    if s3_client:
        # Upload to S3
        object_key = f'missions/{submission_id}/{file.name}'
        try:
            s3_client.upload_fileobj(
                file,
                bucket,
                object_key,
                ExtraArgs={
                    'ContentType': file.content_type or 'application/octet-stream',
                    'ACL': 'private',  # Private by default
                }
            )
            # Generate CDN URL or presigned URL
            cdn_domain = os.environ.get('S3_CDN_DOMAIN') or os.environ.get('CDN_DOMAIN')
            if cdn_domain:
                # Use CDN URL for faster access
                file_url = f"https://{cdn_domain}/{object_key}"
            else:
                # Fallback to presigned URL
                file_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket, 'Key': object_key},
                    ExpiresIn=604800  # 7 days
                )
            return file_url
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise ValueError("Failed to upload file to storage")
    else:
        # Fallback to local storage
        upload_path = f'missions/{submission_id}/{file.name}'
        saved_path = default_storage.save(upload_path, file)
        return default_storage.url(saved_path)


def scan_file_for_viruses(file_path: str) -> bool:
    """
    Scan file for viruses (placeholder - integrate with ClamAV or similar).
    Returns True if file is safe.
    """
    # TODO: Integrate with ClamAV or AWS Macie
    # For now, return True (no scanning)
    # In production, integrate with:
    # - ClamAV for on-premise scanning
    # - AWS Macie for cloud-based scanning
    # - VirusTotal API for third-party scanning
    return True


def chunk_upload_file(file: UploadedFile, submission_id: str, chunk_size: int = 5 * 1024 * 1024) -> str:
    """
    Upload large file in chunks for better progress tracking.
    Returns the final file URL.
    """
    # If this is a single chunk, handle it
    if chunk_index is not None and total_chunks:
        # This is a chunk - for now, upload as regular file
        # In production, implement proper chunk assembly
        return upload_file_to_storage(file, submission_id)
    
    # For files larger than chunk_size, upload in chunks
    if file.size <= chunk_size:
        return upload_file_to_storage(file, submission_id)
    
    # Chunked upload implementation
    # This is a simplified version - in production, use resumable uploads
    s3_client, bucket = get_s3_client()
    
    if s3_client:
        # Use multipart upload for large files
        object_key = f'missions/{submission_id}/{file.name}'
        try:
            # Initiate multipart upload
            multipart = s3_client.create_multipart_upload(
                Bucket=bucket,
                Key=object_key,
                ContentType=file.content_type or 'application/octet-stream',
            )
            upload_id = multipart['UploadId']
            
            parts = []
            part_number = 1
            file.seek(0)
            
            while True:
                chunk = file.read(chunk_size)
                if not chunk:
                    break
                
                # Upload part
                part = s3_client.upload_part(
                    Bucket=bucket,
                    Key=object_key,
                    PartNumber=part_number,
                    UploadId=upload_id,
                    Body=chunk,
                )
                parts.append({
                    'ETag': part['ETag'],
                    'PartNumber': part_number
                })
                part_number += 1
            
            # Complete multipart upload
            s3_client.complete_multipart_upload(
                Bucket=bucket,
                Key=object_key,
                UploadId=upload_id,
                MultipartUpload={'Parts': parts}
            )
            
            # Generate CDN URL or presigned URL
            cdn_domain = os.environ.get('S3_CDN_DOMAIN') or os.environ.get('CDN_DOMAIN')
            if cdn_domain:
                file_url = f"https://{cdn_domain}/{object_key}"
            else:
                file_url = s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': bucket, 'Key': object_key},
                    ExpiresIn=604800
                )
            return file_url
        except ClientError as e:
            logger.error(f"Chunked upload failed: {e}")
            raise ValueError("Failed to upload file")
    else:
        # Fallback to regular upload for local storage
        return upload_file_to_storage(file, submission_id)


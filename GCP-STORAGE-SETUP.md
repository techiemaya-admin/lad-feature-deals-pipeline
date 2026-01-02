# GCP Storage Setup Guide

This guide explains how to set up Google Cloud Storage for file attachments in the Deals Pipeline feature.

## Overview

The system now uploads attachments directly to Google Cloud Storage (GCP) instead of storing them locally. This provides:
- ✅ Scalable cloud storage
- ✅ Secure signed URLs for temporary access
- ✅ Better performance and reliability
- ✅ Easy integration with GCP services

## Prerequisites

1. Google Cloud Platform account
2. A GCP project created
3. Billing enabled on the project

## Setup Steps

### 1. Create a GCS Bucket

```bash
# Install gcloud CLI if you haven't already
# Visit: https://cloud.google.com/sdk/docs/install

# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create a bucket (choose a unique name)
gsutil mb -l us-central1 gs://salesmaya-attachments

# Set bucket permissions (private bucket with signed URLs)
gsutil iam ch allUsers:objectViewer gs://salesmaya-attachments
# Or keep it private (recommended) and use signed URLs only
```

### 2. Create a Service Account

```bash
# Create service account
gcloud iam service-accounts create salesmaya-storage \
    --display-name="SalesMaya Storage Service Account"

# Grant storage permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:salesmaya-storage@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Create and download key file
gcloud iam service-accounts keys create ~/salesmaya-key.json \
    --iam-account=salesmaya-storage@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# GCP Storage Configuration
GCP_PROJECT_ID=your-actual-project-id
GCP_BUCKET_NAME=salesmaya-attachments
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/salesmaya-key.json
```

### 4. Test Locally

```bash
# Install dependencies (if not already done)
npm install

# Start the server
npm run dev

# Open the test page
open frontend/test-attachments.html
```

## API Endpoints

### Upload Attachment
```
POST /api/deals-pipeline/leads/:id/attachments
Content-Type: multipart/form-data

Field: file (the file to upload)
```

**Response:**
```json
{
  "success": true,
  "attachment": {
    "id": "uuid",
    "file_url": "gs://bucket/path",
    "file_name": "document.pdf",
    "file_type": "application/pdf",
    "file_size": 12345,
    "signed_url": "https://storage.googleapis.com/...",
    "created_at": "2026-01-02T12:00:00.000Z"
  }
}
```

### List Attachments
```
GET /api/deals-pipeline/leads/:id/attachments
```

**Response:**
```json
[
  {
    "id": "uuid",
    "file_url": "gs://bucket/path",
    "file_name": "document.pdf",
    "file_type": "application/pdf",
    "file_size": 12345,
    "signed_url": "https://storage.googleapis.com/...",
    "created_at": "2026-01-02T12:00:00.000Z"
  }
]
```

### Delete Attachment
```
DELETE /api/deals-pipeline/leads/:id/attachments/:attachmentId
```

## Frontend SDK Usage

```javascript
const sdk = new DealsPipelineSDK();

// Login
await sdk.devLogin();

// Upload file with progress
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

await sdk.uploadAttachment(leadId, file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});

// List attachments
const attachments = await sdk.getAttachments(leadId);

// Download attachment
attachments.forEach(att => {
  // Use the signed_url to download
  window.open(att.signed_url);
});

// Delete attachment
await sdk.deleteAttachment(leadId, attachmentId);
```

## Security Notes

1. **Signed URLs**: URLs expire after 60 minutes by default
2. **Private Bucket**: Recommended to keep bucket private and use signed URLs
3. **Service Account**: Store credentials securely, never commit to version control
4. **File Size Limits**: Current limit is 10MB (configurable in multer settings)
5. **Soft Delete**: Attachments are soft-deleted in DB but remain in GCS

## Production Deployment

### Option 1: Service Account Key (Simple)
1. Upload service account JSON file to server
2. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
3. Ensure file has restricted permissions (chmod 600)

### Option 2: Workload Identity (Recommended for GKE)
1. Configure workload identity for your Kubernetes cluster
2. Bind service account to Kubernetes service account
3. No credential file needed

### Option 3: Compute Engine Default Credentials
1. Attach service account to VM instance
2. No credential file needed
3. Automatic authentication

## Troubleshooting

### Error: "Could not load credentials"
- Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Verify service account JSON file exists and is valid
- Ensure service account has proper permissions

### Error: "Bucket not found"
- Verify `GCP_BUCKET_NAME` matches actual bucket name
- Check bucket exists: `gsutil ls gs://YOUR_BUCKET_NAME`
- Ensure service account has access to bucket

### Error: "Permission denied"
- Verify service account has `roles/storage.objectAdmin` role
- Check bucket IAM permissions
- Ensure project ID is correct

## File Organization in GCS

Files are organized by lead:
```
gs://salesmaya-attachments/
  └── leads/
      └── {leadId}/
          └── attachments/
              ├── 1735826400000-123456789.pdf
              ├── 1735826500000-987654321.jpg
              └── ...
```

## Cost Considerations

- **Storage**: ~$0.02/GB/month (Standard storage)
- **Operations**: Minimal cost for uploads/downloads
- **Network**: Egress charges for downloads outside GCP
- **Estimate**: ~$1-5/month for typical usage with 100GB storage

## Next Steps

1. Set up GCP project and bucket
2. Create service account and download credentials
3. Update .env file with configuration
4. Test upload/download functionality
5. Deploy to production environment

For more information, see:
- [GCS Documentation](https://cloud.google.com/storage/docs)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)

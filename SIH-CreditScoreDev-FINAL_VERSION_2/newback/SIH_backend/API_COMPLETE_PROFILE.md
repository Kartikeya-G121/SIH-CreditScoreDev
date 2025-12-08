# Complete Profile Endpoint - API Documentation

## Overview

The `/complete-profile` endpoint allows beneficiaries to create their profile and upload certificates (caste certificate and identity proof) in a **single multipart form submission**.

## Endpoint Details

**URL**: `POST /api/v1/beneficiaries/complete-profile`

**Content-Type**: `multipart/form-data`

**Authentication**: Required (Bearer Token)

## Request Parameters

### Form Fields (all as form-data)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `fullName` | String | Yes | Full name of the beneficiary | "John Doe" |
| `casteCategory` | String | No | Caste category | "SC", "ST", "OBC", "GEN" |
| `dob` | Date | Yes | Date of birth | "1995-05-15" |
| `gender` | String | No | Gender | "MALE", "FEMALE", "OTHER" |
| `addressLine` | String | Yes | Complete address | "123 Main Street" |
| `district` | String | Yes | District name | "Mumbai" |
| `state` | String | Yes | State name | "Maharashtra" |
| `pincode` | String | Yes | Postal code | "400001" |
| `regionType` | String | Yes | Region type | "RURAL", "URBAN" |
| `geoLat` | Decimal | No | Latitude coordinate | "19.0760" |
| `geoLong` | Decimal | No | Longitude coordinate | "72.8777" |
| `literacyScore` | Integer | No | Literacy score (0-100) | "85" |
| `identityProofType` | String | No | Type of identity proof | "AADHAR", "PAN" |
| `education` | String | No | Education level | "Graduate" |
| `familySize` | Integer | No | Total family members | "4" |
| `dependencyCount` | Integer | No | Number of dependents | "2" |
| `landOwned` | Decimal | No | Land owned in acres | "2.5" |
| `incomeSource` | String | No | Primary income source | "Agriculture" |
| `isGraduate` | Boolean | No | Is beneficiary a graduate | "true" |

### File Uploads (multipart files)

| Field | Type | Required | Description | Accepted Formats |
|-------|------|----------|-------------|------------------|
| `casteCertificate` | File | No | Caste certificate document | PDF, JPG, PNG |
| `identityProof` | File | No | Identity proof document | PDF, JPG, PNG |

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Profile created successfully with files",
  "data": {
    "profileId": 123,
    "userId": 456,
    "fullName": "John Doe",
    "casteCategory": "SC",
    "dob": "1995-05-15",
    "gender": "MALE",
    "addressLine": "123 Main Street",
    "district": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "regionType": "URBAN",
    "geoLat": 19.0760,
    "geoLong": 72.8777,
    "literacyScore": 85,
    "verifiedAnnualIncome": null,
    "isProfileVerified": true,
    "verifiedBy": null,
    "casteCertificateUrl": "https://supabase.storage/beneficiaries/caste/cert_123.pdf",
    "identityProofType": "AADHAR",
    "identityProofUrl": "https://supabase.storage/beneficiaries/identity/aadhar_456.pdf",
    "education": "Graduate",
    "familySize": 4,
    "dependencyCount": 2,
    "landOwned": 2.5,
    "incomeSource": "Agriculture",
    "isGraduate": true,
    "createdAt": "2025-11-26T19:22:00",
    "updatedAt": "2025-11-26T19:22:00"
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Profile already exists for this user",
  "data": null
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Failed to create profile: Failed to upload caste certificate",
  "data": null
}
```

## Example Usage

### Using cURL

```bash
curl -X POST http://localhost:8080/api/v1/beneficiaries/complete-profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "fullName=John Doe" \
  -F "dob=1995-05-15" \
  -F "gender=MALE" \
  -F "addressLine=123 Main Street" \
  -F "district=Mumbai" \
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
4. Body → **form-data**:
   - Add all text fields as **Text** type
   - Add `casteCertificate` and `identityProof` as **File** type
5. Click **Send**

### Using JavaScript (Fetch API)

```javascript
const formData = new FormData();

// Add text fields
formData.append('fullName', 'John Doe');
formData.append('dob', '1995-05-15');
formData.append('gender', 'MALE');
formData.append('addressLine', '123 Main Street');
formData.append('district', 'Mumbai');
formData.append('state', 'Maharashtra');
formData.append('pincode', '400001');
formData.append('regionType', 'URBAN');
formData.append('casteCategory', 'SC');
formData.append('identityProofType', 'AADHAR');
formData.append('literacyScore', '85');
formData.append('education', 'Graduate');
formData.append('familySize', '4');
formData.append('dependencyCount', '2');
formData.append('landOwned', '2.5');
formData.append('incomeSource', 'Agriculture');
formData.append('isGraduate', 'true');

// Add files (from file input)
const casteCertFile = document.getElementById('casteCertInput').files[0];
const identityProofFile = document.getElementById('identityInput').files[0];

if (casteCertFile) {
  formData.append('casteCertificate', casteCertFile);
}

if (identityProofFile) {
  formData.append('identityProof', identityProofFile);
}

// Send request
fetch('http://localhost:8080/api/v1/beneficiaries/complete-profile', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## Notes

- **Files are optional**: You can create a profile without uploading any files
- **Transaction safety**: If file upload fails, the entire operation is rolled back
- **File storage**: Files are uploaded to Supabase S3 storage
- **Backward compatibility**: The original `/api/v1/beneficiaries` endpoint (JSON-only) still works
- **One profile per user**: Users can only create one profile; attempting to create another will result in a 400 error

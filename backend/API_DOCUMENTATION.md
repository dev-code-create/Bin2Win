# Simhastha 2028 Clean & Green API Documentation

## Admin Scan Workflow

### Overview
The admin scan workflow allows booth operators to scan user QR codes and manually enter waste collection details. This streamlines the process for users while giving admins control over data entry.

### User QR Code System

#### 1. Get User QR Code
**Endpoint:** `GET /api/user/qr-code`
**Authentication:** Required (User Token)

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "SIMHASTHA_USER_A1B2C3D4E5F6G7H8",
    "qrData": {
      "userId": "645f1234567890abcdef1234",
      "username": "john_doe",
      "name": "John Doe",
      "greenCredits": 150,
      "memberSince": "2024-01-15T10:30:00Z",
      "qrVersion": "1.0",
      "generatedAt": "2024-02-01T14:30:00Z"
    },
    "structuredData": "{\"type\":\"SIMHASTHA_USER\",\"version\":\"1.0\",\"userId\":\"645f1234567890abcdef1234\",\"username\":\"john_doe\",\"name\":\"John Doe\",\"code\":\"SIMHASTHA_USER_A1B2C3D4E5F6G7H8\",\"timestamp\":1706796600000}",
    "instructions": {
      "title": "Your Simhastha 2028 QR Code",
      "description": "Show this QR code to booth operators for waste collection",
      "steps": [
        "Visit any Simhastha waste collection booth",
        "Show this QR code to the booth operator",
        "The operator will scan your code and weigh your waste",
        "Green credits will be automatically added to your account"
      ]
    }
  }
}
```

#### 2. Regenerate User QR Code
**Endpoint:** `POST /api/user/qr-code/regenerate`
**Authentication:** Required (User Token)

**Response:**
```json
{
  "success": true,
  "message": "QR code regenerated successfully",
  "data": {
    "qrCode": "SIMHASTHA_USER_X9Y8Z7W6V5U4T3S2",
    "qrData": {...},
    "structuredData": "{...}",
    "warning": "Your old QR code is no longer valid. Please use this new QR code for future waste submissions."
  }
}
```

### Admin Scan Workflow

#### 1. Scan User QR Code
**Endpoint:** `POST /api/waste/admin/scan-user`
**Authentication:** Required (Admin Token)

**Request Body:**
```json
{
  "userQRCode": "SIMHASTHA_USER_A1B2C3D4E5F6G7H8"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User QR code validated successfully",
  "data": {
    "user": {
      "id": "645f1234567890abcdef1234",
      "name": "John Doe",
      "username": "john_doe",
      "greenCredits": 150,
      "totalWasteSubmitted": 25.5,
      "currentRank": "Bronze"
    },
    "booth": {
      "id": "645f9876543210fedcba9876",
      "name": "Main Gate Collection Booth",
      "location": {
        "address": "Main Gate, Simhastha Ground",
        "coordinates": [75.8577, 22.7196]
      },
      "acceptedWasteTypes": ["plastic", "paper", "metal", "glass", "organic"]
    },
    "admin": {
      "id": "645fadmin123456789abcdef",
      "name": "Admin Name",
      "role": "booth_operator"
    }
  }
}
```

#### 2. Submit Waste Collection
**Endpoint:** `POST /api/waste/admin/submit-waste`
**Authentication:** Required (Admin Token)

**Request Body:**
```json
{
  "userId": "645f1234567890abcdef1234",
  "boothId": "645f9876543210fedcba9876",
  "wasteType": "plastic",
  "quantity": 2.5,
  "notes": "Clean plastic bottles and containers"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Waste collection recorded successfully! Credits have been added to user account.",
  "data": {
    "submission": {
      "id": "645fsubmission123456789abc",
      "wasteType": "plastic",
      "quantity": 2.5,
      "pointsEarned": 25,
      "status": "approved",
      "collectedAt": "2024-02-01T14:45:00Z",
      "collectedBy": "Admin Name"
    },
    "user": {
      "id": "645f1234567890abcdef1234",
      "name": "John Doe",
      "newCreditsBalance": 175,
      "creditsEarned": 25,
      "totalWasteSubmitted": 28.0
    },
    "transaction": {
      "id": "645ftransaction123456789ab",
      "type": "earned",
      "amount": 25,
      "status": "completed"
    }
  }
}
```

#### 3. Get Admin Collections History
**Endpoint:** `GET /api/waste/admin/collections`
**Authentication:** Required (Admin Token)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `boothId` (optional): Filter by specific booth
- `startDate` (optional): Filter from date (ISO string)
- `endDate` (optional): Filter to date (ISO string)

**Response:**
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": "645fsubmission123456789abc",
        "user": {
          "id": "645f1234567890abcdef1234",
          "name": "John Doe",
          "username": "john_doe"
        },
        "booth": {
          "id": "645f9876543210fedcba9876",
          "name": "Main Gate Collection Booth",
          "location": {...}
        },
        "wasteType": "plastic",
        "quantity": 2.5,
        "pointsEarned": 25,
        "collectedAt": "2024-02-01T14:45:00Z",
        "notes": "Clean plastic bottles and containers"
      }
    ],
    "summary": {
      "totalCollections": 45,
      "totalWeight": 125.5,
      "totalPointsAwarded": 1255,
      "wasteTypeBreakdown": [
        {"type": "plastic", "quantity": 45.5},
        {"type": "paper", "quantity": 30.0},
        {"type": "metal", "quantity": 25.0},
        {"type": "glass", "quantity": 15.0},
        {"type": "organic", "quantity": 10.0}
      ]
    },
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 45,
      "limit": 20
    }
  }
}
```

### Waste Types and Point Values

#### Get Available Waste Types
**Endpoint:** `GET /api/waste/types`
**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "wasteTypes": [
      {
        "type": "plastic",
        "name": "Plastic",
        "description": "Plastic bottles, containers, bags",
        "pointsPerKg": 10,
        "category": "recyclable",
        "icon": "♻️"
      },
      {
        "type": "paper",
        "name": "Paper",
        "description": "Newspapers, cardboard, documents",
        "pointsPerKg": 5,
        "category": "recyclable",
        "icon": "📄"
      },
      {
        "type": "metal",
        "name": "Metal",
        "description": "Aluminum cans, steel containers",
        "pointsPerKg": 15,
        "category": "recyclable",
        "icon": "🥫"
      },
      {
        "type": "glass",
        "name": "Glass",
        "description": "Glass bottles, jars",
        "pointsPerKg": 8,
        "category": "recyclable",
        "icon": "🍶"
      },
      {
        "type": "organic",
        "name": "Organic Waste",
        "description": "Food scraps, garden waste",
        "pointsPerKg": 3,
        "category": "biodegradable",
        "icon": "🍃"
      },
      {
        "type": "electronic",
        "name": "E-Waste",
        "description": "Electronic devices, batteries",
        "pointsPerKg": 25,
        "category": "hazardous",
        "icon": "📱"
      },
      {
        "type": "textile",
        "name": "Textile",
        "description": "Clothes, fabric materials",
        "pointsPerKg": 7,
        "category": "recyclable",
        "icon": "👕"
      }
    ]
  }
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE" // Optional
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

For admin endpoints, the token must be for an admin user with appropriate permissions.

### Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- Admin scan endpoints: 30 requests per minute

### Admin Panel Workflow Summary

1. **Admin Login**: Admin logs in to get authentication token
2. **User Arrives**: User shows their QR code to admin
3. **Scan QR Code**: Admin scans user QR code using `/api/waste/admin/scan-user`
4. **Verify User**: System validates QR code and returns user information
5. **Weigh Waste**: Admin physically weighs the waste
6. **Enter Details**: Admin manually enters waste type, quantity, and notes
7. **Submit**: Admin submits using `/api/waste/admin/submit-waste`
8. **Auto-Credit**: System automatically calculates points and credits user account
9. **Confirmation**: Both admin and user get confirmation of the transaction

This workflow ensures:
- Users don't need to do anything after showing their QR code
- Admins have full control over data entry
- Automatic point calculation and crediting
- Complete audit trail of all transactions
- Real-time updates to user accounts

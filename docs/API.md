# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All authenticated requests require either:
- **Cookie**: `token` (set automatically on login)
- **Header**: `Authorization: Bearer <token>`

---

## Auth Endpoints

### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "VIEWER"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "VIEWER"
  }
}
```

### POST /api/auth/login
Login to get authentication token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": { "id": "user_123", "email": "user@example.com" },
  "token": "eyJhbGc..."
}
```

### POST /api/auth/logout
Logout (clears cookie).

### GET /api/auth/me
Get current user info.

---

## Video Endpoints

### POST /api/upload
Upload video file to R2.

**Auth Required:** ADMIN or EDITOR

**Request:** `multipart/form-data`
- `file`: Video file
- `type`: "video" or "thumbnail"

**Response:** `200 OK`
```json
{
  "message": "File uploaded successfully",
  "url": "https://r2.../video.mp4",
  "filename": "videos/123-abc.mp4"
}
```

### POST /api/videos
Create new video entry.

**Auth Required:** ADMIN or EDITOR

**Request:**
```json
{
  "title": "My Video",
  "description": "Video description",
  "videoUrl": "https://r2.../video.mp4",
  "thumbnailUrl": "https://r2.../thumb.jpg",
  "categoryId": "cat_1",
  "type": "thai_clip",
  "visibility": "PUBLIC"
}
```

`type` is optional. If omitted, default is `thai_clip`.

### GET /api/videos
List videos with filters.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `per_page`: Plugin-compatible alias for `limit`
- `search`: Search in title/description
- `categoryId`: Filter by category
- `visibility`: Filter by visibility
- `type`: `thai_clip` | `av_movie`
- `mode`: Plugin-compatible alias for `type`
- `bucket`: `media` | `jav` (mapped to `thai_clip` | `av_movie`)
- `since`: Filter by updated time (unix seconds/ms or date string)
- `project_id`: Accepted for plugin compatibility
- `sort`: newest | oldest | popular

**Response notes:**
- Includes both `data` and `videos` arrays for compatibility
- `pagination` includes plugin-style keys (`per_page`, `total_pages`, `next_page`, `has_more`)

### GET /api/videos/:id
Get video details.

### PUT /api/videos/:id
Update video.

**Auth Required:** ADMIN or EDITOR (owner)

`type` can be updated via `thai_clip` or `av_movie`.

### DELETE /api/videos/:id
Delete video.

**Auth Required:** ADMIN only

---

## Plugin Compatibility Endpoints

### GET /api/plugin/videos
Alias of `GET /api/videos`.

### POST /api/plugin/videos
Alias of `POST /api/videos`.

### GET /api/plugin/videos/:id
Alias of `GET /api/videos/:id`.

### PUT /api/plugin/videos/:id
Alias of `PUT /api/videos/:id`.

### DELETE /api/plugin/videos/:id
Alias of `DELETE /api/videos/:id`.

### GET/POST /api/plugin/videos/sync
Plugin sync-compatible endpoint.

**Accepted filters:**
- `type` or `mode`: `thai_clip` | `av_movie`
- `bucket`: `media` | `jav`
- `since`: unix seconds/ms or date string
- `limit` or `per_page`: max returned items

**Response:**
- `data` list of matched videos
- `pagination` and `summary`
- each video includes lowercase `type`

---

## Video Type Mapping

| Plugin/API Query | Stored in DB (Prisma enum) |
|---|---|
| `type=thai_clip` | `THAI_CLIP` |
| `type=av_movie` | `AV_MOVIE` |
| `bucket=media` | `THAI_CLIP` |
| `bucket=jav` | `AV_MOVIE` |

---

## Category Endpoints

### GET /api/categories
List all categories.

### POST /api/categories
Create category (ADMIN only).

---

## Domain Endpoints

### GET /api/domains
List allowed domains (ADMIN only).

### POST /api/domains
Add allowed domain (ADMIN only).

### DELETE /api/domains/:id
Remove domain (ADMIN only).

---

## Embed Endpoint

### GET /api/embed/:id
Get video for embedding (checks domain restrictions).

---

## Error Responses

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

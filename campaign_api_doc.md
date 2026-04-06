# Campaign Reward API — Frontend Integration Guide

## Base URL

```
http://<host>/api/v1/raffles
```

---

## Response Format

All endpoints return a consistent JSON envelope.

**Success**
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

**Error**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

---

## Participant Flow (Step-by-Step)

```
Step 1  GET  /campaigns/event/:eventTag        → load campaign + booth list
Step 2  (client scans booths locally — no API call per scan)
Step 3  POST /campaigns/:campaignId/generate-raffle-qr   → get encrypted QR
Step 4  (client presents QR at raffle station)
Step 5  POST /campaigns/:campaignId/validate-raffle      → creates record, get raffleEntryId
Step 6  (wheel spins client-side)
Step 7  POST /campaigns/:campaignId/spin-wheel           → record outcome
```

---

## Step 1 — Load Campaign

### `GET /campaigns/event/:eventTag`

Load the active campaign and the list of booths the participant needs to scan. Call this on app launch.

**URL params**

| Param | Type | Description |
|---|---|---|
| `eventTag` | string | Unique event identifier (e.g. `WORLDBEX2026`) |

**Request**
```
GET /campaigns/event/WORLDBEX2026
```

**Response `200`**
```json
{
  "success": true,
  "message": "Campaign retrieved",
  "data": {
    "campaign": {
      "id": 1,
      "campaignCode": "RFFL-2026-001",
      "campaignName": "Worldbex 2026 Raffle Campaign",
      "eventTag": "WORLDBEX2026",
      "description": "Collect points from all booths and join the grand raffle draw.",
      "thresholdPoints": 300,
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate": "2026-04-05T23:59:59.000Z",
      "status": "active"
    },
    "booths": [
      { "id": 20260001, "boothCode": "BOOTH-MAIN-01", "boothName": "Main Stage",     "points": 100, "maxScanPerUser": 1, "sortOrder": 1 },
      { "id": 20260002, "boothCode": "BOOTH-TECH-01", "boothName": "Tech Zone",      "points": 75,  "maxScanPerUser": 1, "sortOrder": 2 },
      { "id": 20260003, "boothCode": "BOOTH-FOOD-01", "boothName": "Food Court",     "points": 50,  "maxScanPerUser": 1, "sortOrder": 3 },
      { "id": 20260004, "boothCode": "BOOTH-INNO-01", "boothName": "Innovation Hub", "points": 75,  "maxScanPerUser": 1, "sortOrder": 4 },
      { "id": 20260005, "boothCode": "BOOTH-SPON-01", "boothName": "Sponsors Area",  "points": 50,  "maxScanPerUser": 1, "sortOrder": 5 }
    ],
    "thresholdPoints": 300,
    "totalBoothPoints": 350
  }
}
```

**What to store client-side after this call:**
- `data.campaign.id` → `campaignId` (used in all subsequent requests)
- `data.booths` → render the booth list; use `boothCode` to identify each scan
- `data.thresholdPoints` → show progress bar target

**Error responses**

| Status | Meaning |
|---|---|
| `404` | Event tag not found |
| `400` | Campaign exists but is not active |

---

## Step 2 — Booth Scanning (Client-Side)

**No API call is made per scan.** The client handles scanning locally.

When a participant scans a booth QR:
1. Read the `boothCode` from the scanned QR
2. Match it against the `booths` list from Step 1
3. Add `points` to the running local total
4. Track which `boothCode` values have been scanned (array)
5. Enforce `maxScanPerUser` per booth locally (typically `1`)

**Show progress** as `currentPoints / thresholdPoints`. When `currentPoints >= thresholdPoints`, allow the participant to proceed to Step 3.

> The server will independently validate all booth codes and recompute the total in Step 3. Client-side tracking is for UX only.

---

## Step 3 — Generate Raffle QR

### `POST /campaigns/:campaignId/generate-raffle-qr`

Submit the list of scanned booth codes and optional participant info. The server validates the codes, creates the participant record and scan logs, then returns an encrypted QR for the raffle station to scan.

> **Rate limited** — do not call more than once per participant. If the participant already exists (same `participantCode` or `mobileNumber`), the server will reject with `409`.

**URL params**

| Param | Type | Description |
|---|---|---|
| `campaignId` | integer | From Step 1 response |

**Request body**

```json
{
  "boothCodes": ["BOOTH-MAIN-01", "BOOTH-TECH-01", "BOOTH-FOOD-01", "BOOTH-INNO-01", "BOOTH-SPON-01"],
  "participantInfo": {
    "participantCode": "CLIENT-DEVICE-ABC123",
    "fullName": "Juan dela Cruz",
    "mobileNumber": "09171234567",
    "email": "juan@example.com"
  }
}
```

**Fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `boothCodes` | `string[]` | Yes | Min 1 item. All codes must be valid and active for this campaign. |
| `participantInfo` | object | No | Entire object is optional |
| `participantInfo.participantCode` | string | No | Client-generated unique identifier (e.g. device ID, UUID). Stored as the participant's code. Used to prevent duplicate entries. |
| `participantInfo.fullName` | string | No | Max 255 chars |
| `participantInfo.mobileNumber` | string | No | Max 20 chars. Used as duplicate guard — same mobile cannot join the same campaign twice. |
| `participantInfo.email` | string | No | Must be valid email format if provided |

**Response `200`**
```json
{
  "success": true,
  "message": "Raffle QR generated successfully",
  "data": {
    "raffleQrId": 1,
    "encryptedQr": "A1b2C3d4...",
    "participantId": 1,
    "participantCode": "CLIENT-DEVICE-ABC123",
    "totalPoints": 350,
    "thresholdPoints": 300,
    "boothCount": 5,
    "generatedAt": "2026-04-01T08:00:00.000Z"
  }
}
```

**What to do with the response:**
- Render `data.encryptedQr` as a QR code image for the participant to present at the raffle station
- Store `data.participantId` if you need to poll progress later

**Error responses**

| Status | Message | Cause |
|---|---|---|
| `400` | `Insufficient points. Required: X, current: Y` | Scanned booths do not meet threshold |
| `400` | `Invalid or unknown booth code(s): BOOTH-XXX` | One or more codes don't exist in this campaign |
| `400` | `Inactive booth(s): BOOTH-XXX` | One or more booths are disabled |
| `400` | `Campaign is not active` | Campaign was paused/ended |
| `409` | `This participant has already joined this campaign` | `participantCode` already exists for this campaign |
| `409` | `A participant with this mobile number has already joined this campaign` | `mobileNumber` already registered |

---

## Step 4 — Present QR at Raffle Station

The participant shows the QR code (rendered from `encryptedQr`) to the event staff. Staff scan it using the raffle station interface. No client API call is needed for this step.

---

## Step 5 — Validate Raffle QR (Raffle Station)

### `POST /campaigns/:campaignId/validate-raffle`

Called by the **raffle station**, not the participant's device. Decrypts and validates the QR, then returns a `raffleEntryId` needed for the spin.

> **Rate limited** — each QR can only be validated once.

**Request body**

```json
{
  "encryptedQr": "A1b2C3d4..."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `encryptedQr` | string | Yes | The value from Step 3 response |

**Response `200`**
```json
{
  "success": true,
  "message": "Raffle QR validated. Participant is eligible to spin.",
  "data": {
    "raffleEntryId": 1,
    "participantId": 1,
    "participantCode": "CLIENT-DEVICE-ABC123",
    "fullName": "Juan dela Cruz",
    "campaignId": 1,
    "totalPoints": 350,
    "thresholdPoints": 300,
    "status": "pending",
    "dateCreated": "2026-04-01T08:05:00.000Z"
  }
}
```

**What to store after this call:**
- `data.raffleEntryId` → required for Step 7
- `data.participantId` → use if showing participant details
- `data.fullName` → display on wheel screen

**Error responses**

| Status | Message | Cause |
|---|---|---|
| `400` | `Invalid or tampered QR code` | QR could not be decrypted (modified/corrupted) |
| `400` | `QR code does not belong to this campaign` | Campaign mismatch |
| `400` | `QR event tag mismatch` | QR was generated for a different event |
| `400` | `Insufficient points. Required: X, actual: Y` | Points check failed at validation time |
| `403` | `Participant is blocked` | Participant was blocked by admin |
| `404` | `No active raffle QR found for this participant` | QR already used or not found |
| `409` | `Raffle QR has already been used` | QR was already validated |
| `409` | `Raffle entry already exists for this QR` | Duplicate validation attempt |

---

## Step 6 — Wheel Spin (Client-Side)

The wheel animation runs entirely on the client. The server does not determine the prize — the client sends the result.

**Winning spin:** set `prizeName` to the actual prize name (e.g. `"Samsung 65-inch Smart TV"`).

**Losing spin:** set `prizeName` to the sentinel value `"No Prize"`.

---

## Step 7 — Record Spin Result

### `POST /campaigns/:campaignId/spin-wheel`

Send the wheel outcome to the server. On a win, the server creates a claim record and marks the participant as `claimed`.

> **Rate limited.** Each `raffleEntryId` can only be spun once. Subsequent calls return `409`.

**Request body**

```json
{
  "raffleEntryId": "1",
  "prizeName": "Samsung 65-inch Smart TV",
  "wheelResult": "Samsung 65-inch Smart TV",
  "claimedBy": "Event Staff - Maria"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `raffleEntryId` | string | Yes | From Step 5 response |
| `prizeName` | string | Yes | Actual prize name, or `"No Prize"` for a losing spin |
| `wheelResult` | string | Yes | Raw wheel segment label (can match `prizeName`) |
| `claimedBy` | string | No | Name of staff member processing the claim |

**Response `200` — Win**
```json
{
  "success": true,
  "message": "Congratulations! Prize awarded.",
  "data": {
    "raffleEntryId": "1",
    "participantId": 1,
    "outcome": "won",
    "wheelResult": "Samsung 65-inch Smart TV",
    "prize": {
      "claimId": 1,
      "prizeName": "Samsung 65-inch Smart TV",
      "claimedBy": "Event Staff - Maria",
      "claimedAt": "2026-04-01T08:10:00.000Z",
      "status": "won"
    }
  }
}
```

**Response `200` — No Prize**
```json
{
  "success": true,
  "message": "Better luck next time.",
  "data": {
    "raffleEntryId": "1",
    "participantId": 1,
    "outcome": "lost",
    "wheelResult": "No Prize",
    "prize": null
  }
}
```

**Error responses**

| Status | Message | Cause |
|---|---|---|
| `404` | `Raffle entry not found in this campaign` | Invalid `raffleEntryId` |
| `409` | `Raffle entry has already been processed (status: won/lost)` | Spin already recorded |

---

## Error Handling — General

| HTTP Status | When it happens |
|---|---|
| `400` | Invalid input, failed validation, business rule violation |
| `403` | Forbidden (e.g. blocked participant) |
| `404` | Resource not found |
| `409` | Duplicate / already processed |
| `429` | Rate limit exceeded — slow down requests |
| `500` | Unexpected server error |

Always check `success === false` and display `message` to the user or log it for debugging.

---

## Full Flow Example (Code Sketch)

```js
// Step 1 — On app load
const { data } = await api.get('/campaigns/event/WORLDBEX2026');
const { campaign, booths, thresholdPoints } = data;
store.setCampaign(campaign);
store.setBooths(booths);

// Step 2 — As user scans each booth QR
function onBoothScanned(boothCode) {
  const booth = booths.find(b => b.boothCode === boothCode);
  if (!booth) return showError('Invalid booth');
  if (store.scannedCodes.includes(boothCode)) return showError('Already scanned');
  store.scannedCodes.push(boothCode);
  store.currentPoints += booth.points;
  updateProgressBar(store.currentPoints, thresholdPoints);
  if (store.currentPoints >= thresholdPoints) showGenerateQrButton();
}

// Step 3 — User taps "Generate Raffle QR"
const { data: qrData } = await api.post(`/campaigns/${campaign.id}/generate-raffle-qr`, {
  boothCodes: store.scannedCodes,
  participantInfo: {
    participantCode: deviceId,        // unique per device
    fullName: form.fullName,          // optional
    mobileNumber: form.mobileNumber,  // optional
    email: form.email,                // optional
  },
});
renderQrCode(qrData.encryptedQr);  // show QR for staff to scan

// Step 5 — Raffle station validates (staff-side)
const { data: entry } = await api.post(`/campaigns/${campaign.id}/validate-raffle`, {
  encryptedQr: scannedValue,
});
displayParticipantName(entry.fullName);
store.raffleEntryId = entry.raffleEntryId;

// Step 6 — Start wheel animation (client-side)
const prizeResult = await runWheelAnimation();  // returns prize name or 'No Prize'

// Step 7 — Record result
const { data: spinData } = await api.post(`/campaigns/${campaign.id}/spin-wheel`, {
  raffleEntryId: store.raffleEntryId,
  prizeName: prizeResult,
  wheelResult: prizeResult,
  claimedBy: staff.name,
});

if (spinData.outcome === 'won') {
  showPrizeCelebration(spinData.prize.prizeName);
} else {
  showBetterLuckNext();
}
```

---

## Notes for Frontend

- **`boothCode`** is the value embedded in each booth's physical QR. The client reads this raw value and maps it to the booth list from Step 1.
- **`participantCode`** should be a stable unique identifier per device or per session (e.g. a UUID generated once and stored in `localStorage`). It prevents the same device from entering twice.
- **Dates** are returned in ISO 8601 UTC format (`2026-04-01T00:00:00.000Z`). Convert to local time for display.
- **`prize: null`** on the spin-wheel response means a losing spin — no claim was created.
- **Do not retry** generate-raffle-qr or validate-raffle on failure — these are not idempotent. Show the error and let the user take action.
- **Rate limits** are enforced on generate-raffle-qr, validate-raffle, and spin-wheel (`strictLimiter`). On `429`, wait before retrying.

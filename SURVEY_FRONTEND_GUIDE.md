# Survey Frontend Implementation Guide

This document covers everything the frontend needs to implement the survey feature end-to-end — from triggering the survey after a QR scan, to rendering each question type, collecting answers, and submitting them to the API.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Survey Flow](#2-survey-flow)
3. [API Reference](#3-api-reference)
4. [Step-by-Step Implementation](#4-step-by-step-implementation)
5. [Question Type Rendering Guide](#5-question-type-rendering-guide)
6. [Answer Format Reference](#6-answer-format-reference)
7. [Submission Payload Structure](#7-submission-payload-structure)
8. [Error Handling](#8-error-handling)
9. [Edge Cases](#9-edge-cases)
10. [Full Example Payload](#10-full-example-payload)

---

## 1. Overview

After a participant's QR code is validated (booth scan), the system may require them to answer a survey before proceeding. The survey is optional by default but can be marked as required by the admin.

**Supported question types:** 12 formats — single choice, multiple choice, dropdown, yes/no, short text, long text, number, date, rating scale, Likert scale, ranking, and matrix grid.

---

## 2. Survey Flow

```
Participant scans booth QR
        │
        ▼
POST /campaigns/:campaignId/generate-raffle-qr
        │
        ├── Response includes: participantId, scanLogId (from scan logs), encryptedQr
        │
        ▼
GET /campaigns/:campaignId/surveys/active?triggerEvent=booth_scan
        │
        ├── hasSurvey: false  ──────────────────────────────► Proceed to raffle step
        │
        └── hasSurvey: true
                │
                ▼
        GET .../surveys/:surveyId/response-status
          ?participantId=X&scanLogId=Y
                │
                ├── hasResponded: true  ────────────────────► Skip survey, proceed to raffle
                │
                └── hasResponded: false
                        │
                        ▼
                Render survey questions
                        │
                        ▼
                Participant fills in answers
                        │
                        ▼
                POST .../surveys/:surveyId/submit
                        │
                        ├── 201 Created ────────────────────► Proceed to raffle step
                        │
                        └── 400 Validation error ──────────► Show field errors, stay on survey
```

> **Note on `scanLogId`:** When the `generate-raffle-qr` endpoint processes booth scans, it inserts rows into `campaign_scan_logs`. The frontend does **not** receive individual `scanLogId` values directly in that response. Two approaches:
>
> - **Recommended:** Omit `scanLogId` from the submit payload (pass `null`). The unique constraint then becomes `(surveyId, participantId, NULL)` — one response per participant per survey regardless of scan.
> - **Advanced:** Call a separate lookup endpoint or store the scanLogId from the scan logs if your backend exposes it.

---

## 3. API Reference

### 3.1 Get Active Survey

```
GET /api/v1/raffles/campaigns/:campaignId/surveys/active
```

**Query params:**

| Param | Required | Default | Values |
|---|---|---|---|
| `triggerEvent` | No | `booth_scan` | `booth_scan` \| `raffle_entry` \| `prize_claim` |

**Response — survey exists:**
```json
{
  "success": true,
  "data": {
    "hasSurvey": true,
    "survey": {
      "id": 1,
      "surveyName": "Booth Visitor Feedback",
      "description": "Quick feedback after scanning the booth QR",
      "triggerEvent": "booth_scan",
      "isRequired": false,
      "questionCount": 4,
      "questions": [
        {
          "id": 1,
          "questionText": "How did you hear about this event?",
          "questionType": "single_choice",
          "isRequired": true,
          "sortOrder": 0,
          "validationRules": null,
          "conditionalLogic": null,
          "options": [
            { "id": 1, "optionText": "Social Media", "optionValue": "social_media", "sortOrder": 0 },
            { "id": 2, "optionText": "Friend / Colleague", "optionValue": "referral", "sortOrder": 1 },
            { "id": 3, "optionText": "Email Newsletter", "optionValue": "email", "sortOrder": 2 }
          ],
          "matrixRows": []
        },
        {
          "id": 2,
          "questionText": "How would you rate your overall experience?",
          "questionType": "rating",
          "isRequired": true,
          "sortOrder": 1,
          "validationRules": { "min": 1, "max": 5 },
          "options": [],
          "matrixRows": []
        },
        {
          "id": 3,
          "questionText": "How would you rate the following aspects?",
          "questionType": "matrix",
          "isRequired": true,
          "sortOrder": 2,
          "validationRules": null,
          "options": [
            { "id": 10, "optionText": "Excellent", "sortOrder": 0 },
            { "id": 11, "optionText": "Good", "sortOrder": 1 },
            { "id": 12, "optionText": "Fair", "sortOrder": 2 },
            { "id": 13, "optionText": "Poor", "sortOrder": 3 }
          ],
          "matrixRows": [
            { "id": 1, "rowText": "Staff friendliness", "sortOrder": 0 },
            { "id": 2, "rowText": "Event organisation", "sortOrder": 1 },
            { "id": 3, "rowText": "Venue & facilities", "sortOrder": 2 }
          ]
        },
        {
          "id": 4,
          "questionText": "Any comments or suggestions?",
          "questionType": "long_text",
          "isRequired": false,
          "sortOrder": 3,
          "validationRules": { "maxLength": 500 },
          "options": [],
          "matrixRows": []
        }
      ]
    }
  }
}
```

**Response — no survey configured:**
```json
{
  "success": true,
  "data": {
    "hasSurvey": false,
    "survey": null
  }
}
```

---

### 3.2 Check Response Status

```
GET /api/v1/raffles/campaigns/:campaignId/surveys/:surveyId/response-status
    ?participantId=123
    &scanLogId=456        ← optional
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasResponded": true,
    "isComplete": true,
    "responseId": 7,
    "submittedAt": "2026-04-08T10:30:00.000Z"
  }
}
```

---

### 3.3 Submit Survey

```
POST /api/v1/raffles/campaigns/:campaignId/surveys/:surveyId/submit
Content-Type: application/json
```

**Request body:**
```json
{
  "participantId": 123,
  "scanLogId": null,
  "answers": [
    { "questionId": 1, "answerOptionId": 2 },
    { "questionId": 2, "answerNumeric": 4 },
    { "questionId": 3, "answerJson": [
        { "rowId": 1, "optionId": 10 },
        { "rowId": 2, "optionId": 11 },
        { "rowId": 3, "optionId": 10 }
    ]},
    { "questionId": 4, "answerText": "Great event!" }
  ]
}
```

**Response 201 — success:**
```json
{
  "success": true,
  "message": "Survey submitted successfully",
  "data": {
    "responseId": 42,
    "surveyId": 1,
    "participantId": 123,
    "scanLogId": null,
    "answersRecorded": 4,
    "submittedAt": "2026-04-08T10:31:00.000Z"
  }
}
```

**Response 200 — already submitted (idempotent):**
```json
{
  "success": true,
  "message": "Survey already submitted",
  "data": {
    "responseId": 42,
    "alreadySubmitted": true,
    "submittedAt": "2026-04-08T10:30:00.000Z"
  }
}
```

**Response 400 — validation error:**
```json
{
  "success": false,
  "message": "Missing required answers for question ID(s): 1, 2"
}
```

---

## 4. Step-by-Step Implementation

### Step 1 — After QR scan succeeds, check for a survey

```js
// After generate-raffle-qr returns successfully
async function checkForSurvey(campaignId) {
  const res = await fetch(
    `/api/v1/raffles/campaigns/${campaignId}/surveys/active?triggerEvent=booth_scan`
  );
  const json = await res.json();

  if (!json.data.hasSurvey) {
    // No survey configured — skip directly to next step
    proceedToRaffle();
    return;
  }

  return json.data.survey; // { id, surveyName, isRequired, questions, ... }
}
```

---

### Step 2 — Check if participant already answered

```js
async function checkResponseStatus(campaignId, surveyId, participantId) {
  const url = `/api/v1/raffles/campaigns/${campaignId}/surveys/${surveyId}/response-status`
    + `?participantId=${participantId}`;

  const res  = await fetch(url);
  const json = await res.json();

  return json.data; // { hasResponded, isComplete, responseId, submittedAt }
}
```

If `hasResponded && isComplete` → skip survey, proceed to raffle.

---

### Step 3 — Render survey questions

Iterate over `survey.questions` sorted by `sortOrder`. For each question, select the UI component based on `questionType`:

```js
function renderQuestion(question) {
  switch (question.questionType) {
    case 'single_choice': return <RadioGroup question={question} />;
    case 'multiple_choice': return <CheckboxGroup question={question} />;
    case 'dropdown':       return <Select question={question} />;
    case 'boolean':        return <YesNo question={question} />;
    case 'text':           return <ShortText question={question} />;
    case 'long_text':      return <Textarea question={question} />;
    case 'number':         return <NumberInput question={question} />;
    case 'date':           return <DatePicker question={question} />;
    case 'rating':         return <StarRating question={question} />;
    case 'likert':         return <LikertScale question={question} />;
    case 'ranking':        return <RankingList question={question} />;
    case 'matrix':         return <MatrixGrid question={question} />;
  }
}
```

---

### Step 4 — Collect answers into a map

Maintain a state object keyed by `questionId`:

```js
// Initial state — one entry per question, all null
const [answers, setAnswers] = useState(
  Object.fromEntries(survey.questions.map(q => [q.id, null]))
);

// Update when participant answers
function setAnswer(questionId, value) {
  setAnswers(prev => ({ ...prev, [questionId]: value }));
}
```

---

### Step 5 — Validate before submit

```js
function validate(questions, answers) {
  const errors = {};

  for (const q of questions) {
    if (!q.isRequired) continue;

    const answer = answers[q.id];
    if (answer === null || answer === undefined || answer === '') {
      errors[q.id] = 'This question is required.';
      continue;
    }

    // Validate array answers are not empty
    if (Array.isArray(answer) && answer.length === 0) {
      errors[q.id] = 'Please select at least one option.';
      continue;
    }

    // Validate rating within range
    if (q.questionType === 'rating' && q.validationRules) {
      const { min, max } = q.validationRules;
      if (answer < min || answer > max) {
        errors[q.id] = `Please select a value between ${min} and ${max}.`;
      }
    }

    // Validate text max length
    if (['text', 'long_text'].includes(q.questionType) && q.validationRules?.maxLength) {
      if (String(answer).length > q.validationRules.maxLength) {
        errors[q.id] = `Maximum ${q.validationRules.maxLength} characters allowed.`;
      }
    }

    // Validate multiple_choice selection count
    if (q.questionType === 'multiple_choice' && q.validationRules) {
      const { minSelections, maxSelections } = q.validationRules;
      if (minSelections && answer.length < minSelections) {
        errors[q.id] = `Please select at least ${minSelections} option(s).`;
      }
      if (maxSelections && answer.length > maxSelections) {
        errors[q.id] = `Please select no more than ${maxSelections} option(s).`;
      }
    }

    // Validate matrix — all rows must have a selection
    if (q.questionType === 'matrix') {
      const answeredRowIds = new Set((answer || []).map(a => a.rowId));
      const allRowIds = q.matrixRows.map(r => r.id);
      const missing = allRowIds.filter(id => !answeredRowIds.has(id));
      if (missing.length > 0) {
        errors[q.id] = 'Please answer all rows in the grid.';
      }
    }
  }

  return errors; // empty object = valid
}
```

---

### Step 6 — Build and submit the payload

```js
async function submitSurvey(campaignId, surveyId, participantId, questions, answers) {
  // Build answers array — one entry per answered question
  const answersPayload = questions
    .map(q => buildAnswerEntry(q, answers[q.id]))
    .filter(Boolean); // remove nulls (unanswered optional questions)

  const body = {
    participantId,
    scanLogId: null,   // pass scanLogId here if you have it
    answers: answersPayload,
  };

  const res = await fetch(
    `/api/v1/raffles/campaigns/${campaignId}/surveys/${surveyId}/submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const json = await res.json();

  if (res.status === 201 || (res.status === 200 && json.data?.alreadySubmitted)) {
    proceedToRaffle();
  } else {
    showError(json.message);
  }
}
```

---

## 5. Question Type Rendering Guide

### single_choice
Radio buttons. One selection from `question.options`.

```
○ Social Media
● Friend / Colleague
○ Email Newsletter
```

**Store as:** `answers[q.id] = optionId` (integer)

---

### multiple_choice
Checkboxes. One or more selections from `question.options`.

```
☑ Networking
☐ Product demos
☑ Keynote speakers
```

Apply `validationRules.minSelections` / `maxSelections` if present.

**Store as:** `answers[q.id] = [optionId, optionId, ...]` (array of integers)

---

### dropdown
Single select rendered as a `<select>` element. Options from `question.options`.

**Store as:** `answers[q.id] = optionId` (integer)

---

### boolean
Two-button toggle: Yes / No. Options come from `question.options` (exactly 2 rows).

```
[ Yes ]  [ No ]
```

**Store as:** `answers[q.id] = optionId` (the ID of the selected Yes or No option)

---

### text
Single-line text input. Respect `validationRules.maxLength` if set.

**Store as:** `answers[q.id] = "string value"`

---

### long_text
Multi-line `<textarea>`. Respect `validationRules.maxLength` if set. Show character counter.

**Store as:** `answers[q.id] = "string value"`

---

### number
Numeric input. Respect `validationRules.min` and `validationRules.max` if set.

**Store as:** `answers[q.id] = 42` (number)

---

### date
Date picker. Output format must be `YYYY-MM-DD`.

**Store as:** `answers[q.id] = "2026-04-08"` (string)

---

### rating
Star selector or numeric tap targets. Read scale from `validationRules.min` and `validationRules.max`.

```
★ ★ ★ ★ ☆   (4 out of 5)
```

Render `max - min + 1` tappable stars/buttons.

**Store as:** `answers[q.id] = 4` (number)

---

### likert
Horizontal radio scale. Options from `question.options` (typically 5 items).

```
Strongly      Agree    Neutral   Disagree   Strongly
 Agree                                      Disagree
   ○            ○        ●          ○          ○
```

**Store as:** `answers[q.id] = optionId` (integer — treat like `single_choice`)

---

### ranking
Drag-and-drop sortable list. Items from `question.options`. Participant orders from most to least preferred.

```
1. [ Networking ]
2. [ Product demos ]
3. [ Keynote speakers ]
```

**Store as:** `answers[q.id] = [{ optionId: 7, rank: 1 }, { optionId: 8, rank: 2 }, { optionId: 9, rank: 3 }]`

Ranks are 1-based. Every option must be ranked.

---

### matrix
Grid layout. Rows from `question.matrixRows`, columns from `question.options`. One column selected per row.

```
                Excellent   Good   Fair   Poor
Staff             ●          ○      ○      ○
Event org.        ○          ●      ○      ○
Venue             ○          ○      ●      ○
```

Every row must have exactly one column selected (validate on submit).

**Store as:** `answers[q.id] = [{ rowId: 1, optionId: 10 }, { rowId: 2, optionId: 11 }, { rowId: 3, optionId: 12 }]`

---

## 6. Answer Format Reference

| questionType | Answer field | JS type | Example value |
|---|---|---|---|
| `single_choice` | `answerOptionId` | `number` | `3` |
| `dropdown` | `answerOptionId` | `number` | `5` |
| `boolean` | `answerOptionId` | `number` | `1` (Yes option ID) |
| `likert` | `answerOptionId` | `number` | `2` |
| `rating` | `answerNumeric` | `number` | `4` |
| `number` | `answerNumeric` | `number` | `250` |
| `text` | `answerText` | `string` | `"Acme Corp"` |
| `long_text` | `answerText` | `string` | `"Great event overall!"` |
| `date` | `answerDate` | `string` | `"2026-04-08"` |
| `multiple_choice` | `answerJson` | `array` | `[{"optionId":5},{"optionId":8}]` |
| `ranking` | `answerJson` | `array` | `[{"optionId":3,"rank":1},{"optionId":7,"rank":2}]` |
| `matrix` | `answerJson` | `array` | `[{"rowId":1,"optionId":10},{"rowId":2,"optionId":11}]` |

---

## 7. Submission Payload Structure

### `buildAnswerEntry` function

```js
function buildAnswerEntry(question, value) {
  // Skip unanswered optional questions
  if (value === null || value === undefined || value === '') return null;

  const entry = { questionId: question.id };

  switch (question.questionType) {
    // Single option selected
    case 'single_choice':
    case 'dropdown':
    case 'boolean':
    case 'likert':
      entry.answerOptionId = value; // integer optionId
      break;

    // Numeric
    case 'rating':
    case 'number':
      entry.answerNumeric = Number(value);
      break;

    // Free text
    case 'text':
    case 'long_text':
      entry.answerText = String(value).trim();
      break;

    // Date
    case 'date':
      entry.answerDate = value; // "YYYY-MM-DD"
      break;

    // Multiple choice — array of { optionId }
    case 'multiple_choice':
      if (!Array.isArray(value) || value.length === 0) return null;
      entry.answerJson = value.map(id => ({ optionId: id }));
      break;

    // Ranking — array of { optionId, rank }
    case 'ranking':
      if (!Array.isArray(value) || value.length === 0) return null;
      entry.answerJson = value.map((optionId, index) => ({
        optionId,
        rank: index + 1,
      }));
      break;

    // Matrix — array of { rowId, optionId }
    case 'matrix':
      if (!Array.isArray(value) || value.length === 0) return null;
      entry.answerJson = value; // already [{ rowId, optionId }]
      break;

    default:
      return null;
  }

  return entry;
}
```

---

## 8. Error Handling

### HTTP status codes from the submit endpoint

| Status | Meaning | Action |
|---|---|---|
| `201` | Survey submitted | Proceed to next step |
| `200` + `alreadySubmitted: true` | Already answered | Proceed to next step |
| `400` | Validation error (missing required, empty answers, invalid optionId) | Show error message, stay on survey |
| `403` | Participant is blocked | Show blocked message |
| `404` | Campaign or survey not found / inactive | Reload or show error |
| `429` | Rate limit hit | Show retry message with back-off |

### Field-level error display

The server returns a single error message listing the failing `questionId`s. Parse it to highlight the correct fields:

```js
// Server message example: "Missing required answers for question ID(s): 1, 3"
function parseServerErrors(message, questions) {
  const match = message.match(/question ID\(s\): ([\d, ]+)/);
  if (!match) return {};

  const failingIds = new Set(
    match[1].split(',').map(id => parseInt(id.trim(), 10))
  );

  return Object.fromEntries(
    questions
      .filter(q => failingIds.has(q.id))
      .map(q => [q.id, 'This question is required.'])
  );
}
```

---

## 9. Edge Cases

### Survey is required (`isRequired: true`)
If the survey is marked required, the participant must complete it before the raffle step. Block the "Skip" button and do not allow proceeding until `201` or `alreadySubmitted: true` is returned.

```js
if (survey.isRequired) {
  hideSkipButton();
}
```

### No questions in the survey
If `survey.questions` is empty, treat it as no survey:

```js
if (survey.questions.length === 0) {
  proceedToRaffle();
  return;
}
```

### Conditional logic (`conditionalLogic` field)
Some questions may include a `conditionalLogic` object. Use it to show/hide questions dynamically based on prior answers.

```js
// conditionalLogic shape: { "showIf": { "questionId": 3, "optionId": 12 } }
function isQuestionVisible(question, currentAnswers) {
  if (!question.conditionalLogic?.showIf) return true;

  const { questionId, optionId, answerValue } = question.conditionalLogic.showIf;

  if (optionId !== undefined) {
    return currentAnswers[questionId] === optionId;
  }

  if (answerValue !== undefined) {
    return String(currentAnswers[questionId]) === String(answerValue);
  }

  return true;
}
```

Hidden questions should **not** be included in the answers payload and should **not** be validated as required.

### Matrix — partial row answers
Always validate that every active `matrixRow` has a corresponding entry in the answer before submitting. The server will not catch partially filled matrices.

### Re-submission (idempotency)
The server treats `(surveyId, participantId, scanLogId)` as the unique key. If the participant navigates back and hits submit again, the server returns `200 alreadySubmitted: true`. Handle this the same as a fresh `201`.

### Network failure mid-submit
If the request fails (timeout, network error), allow the participant to retry. The endpoint is idempotent if the first attempt succeeded — a second submit with the same data will return `alreadySubmitted: true` safely.

---

## 10. Full Example Payload

A complete submit body covering all answer types:

```json
{
  "participantId": 123,
  "scanLogId": null,
  "answers": [
    {
      "questionId": 1,
      "answerOptionId": 2
    },
    {
      "questionId": 2,
      "answerOptionId": 5
    },
    {
      "questionId": 3,
      "answerOptionId": 8
    },
    {
      "questionId": 4,
      "answerOptionId": 14
    },
    {
      "questionId": 5,
      "answerNumeric": 4
    },
    {
      "questionId": 6,
      "answerNumeric": 1500
    },
    {
      "questionId": 7,
      "answerText": "Acme Corporation"
    },
    {
      "questionId": 8,
      "answerText": "Loved the event! More networking time would be great."
    },
    {
      "questionId": 9,
      "answerDate": "2026-05-01"
    },
    {
      "questionId": 10,
      "answerJson": [
        { "optionId": 20 },
        { "optionId": 23 }
      ]
    },
    {
      "questionId": 11,
      "answerJson": [
        { "optionId": 30, "rank": 1 },
        { "optionId": 31, "rank": 2 },
        { "optionId": 32, "rank": 3 }
      ]
    },
    {
      "questionId": 12,
      "answerJson": [
        { "rowId": 1, "optionId": 40 },
        { "rowId": 2, "optionId": 41 },
        { "rowId": 3, "optionId": 40 }
      ]
    }
  ]
}
```

**Question type mapping for the example above:**

| questionId | Type | Answer field |
|---|---|---|
| 1 | `single_choice` | `answerOptionId` |
| 2 | `dropdown` | `answerOptionId` |
| 3 | `boolean` | `answerOptionId` |
| 4 | `likert` | `answerOptionId` |
| 5 | `rating` | `answerNumeric` |
| 6 | `number` | `answerNumeric` |
| 7 | `text` | `answerText` |
| 8 | `long_text` | `answerText` |
| 9 | `date` | `answerDate` |
| 10 | `multiple_choice` | `answerJson` |
| 11 | `ranking` | `answerJson` |
| 12 | `matrix` | `answerJson` |

---

*Base URL: `http://<host>/api/v1/raffles`*
*All survey endpoints are public — no Authorization header required.*

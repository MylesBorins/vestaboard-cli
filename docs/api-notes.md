# API Notes

## Server
- Server: Vestaboard/v4.3.0

## Confirmed Endpoints

### POST /local-api/enablement
Headers: `X-Vestaboard-Local-Api-Enablement-Token`
Response: `{"message":"Local API enabled","apiKey":"..."}`
⚠️ **Re-enabling invalidates the old key** — new key issued each time

### POST /local-api/message
Headers: `X-Vestaboard-Local-Api-Key` + `Content-Type: application/json`
Body: array of arrays of character codes
- Simple: `[[0,0,...],[0,0,...],...]`
- Animated: `{"characters": [...], "strategy": "column", "step_interval_ms": 3000, "step_size": 2}`

### GET /local-api/message
Headers: `X-Vestaboard-Local-Api-Key`
Response: `{"message": [[0,0,...],...]}`

## API Key Header
All authenticated requests need: `X-Vestaboard-Local-Api-Key: <key>`

## Device Type
**Vestaboard Note** — 3 rows × 15 columns

## Character Codes (discovered)
- `8` = H
- `9` = I
- Full code chart TBD

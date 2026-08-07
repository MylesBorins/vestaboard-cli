# Vestaboard Local API Docs

## 1. Enable Local API
- `POST http://vestaboard:7000/local-api/enablement`
- Header: `X-Vestaboard-Local-Api-Enablement-Token: YOUR_API_ENABLEMENT_TOKEN`
- Response: `{ "message": "Local API enabled", "apiKey": "..." }`
- ⚠️ **Re-enabling revokes old keys** — new key issued each time

## 2. Send a Message
- `POST http://vestaboard:7000/local-api/message`
- Header: `X-Vestaboard-Local-Api-Key: YOUR_API_KEY`
- Body: array of arrays of character codes

### Simple format:
```json
[[0,0,0,...], [0,0,0,...], ...]
```

### With transitions/animations:
```json
{
  "characters": [[...], [...], ...],
  "strategy": "column",        // column | reverse-column | edges-to-center | row | diagonal | random
  "step_interval_ms": 3000,    // optional: delay between animation steps
  "step_size": 2               // optional: how many cols/rows at once
}
```

**Strategy options:**
- `column` → "Wave" in the app
- `reverse-column` → "Drift" in the app
- `edges-to-center` → "Curtain" in the app
- `row` → row-by-row
- `diagonal` → corner-to-corner
- `random` → random cells

## 3. Read Current Message
- `GET http://vestaboard:7000/local-api/message`
- Header: `X-Vestaboard-Local-Api-Key: YOUR_API_KEY`
- Response: `{ "message": [[...], ...] }`

## Character Codes
Character codes are numeric. Examples:
- `8` = H, `9` = I
- `8` = A, `5` = B, `12` = L, `15` = O, `23` = U, `18` = S, `4` = E
- `20` = T, `19` = Y
- `62` = special symbol

Full code chart TBD.

## Device Types
- **Flagship**: 6 rows x 22 columns
- **Note**: 3 rows x 15 columns

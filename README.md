# Vestaboard Local API

Vestaboard IP: `vestaboard` (192.168.50.46)
Port: 7000
Device: **Vestaboard Note** (3 rows × 15 columns)

## Endpoints
| Method | Path | Auth |
|--------|------|------|
| POST | `/local-api/enablement` | Enablement token |
| POST | `/local-api/message` | API Key |
| GET | `/local-api/message` | API Key |

## CLI Tool
```bash
node vestaboard.js "Hello"              # Send text (uses @vestaboard/vbml)
node vestaboard.js --vbml file.json     # Parse a VBML file
node vestaboard.js -r                   # Read current message
node vestaboard.js -c                   # Clear board
node vestaboard.js -l                   # List char codes
node vestaboard.js --charcode 62        # Show heart

# Options
--rows 3    Grid rows (Note: 3, Flagship: 6)
--cols 15   Grid cols (Note: 15, Flagship: 22)
--animate wave|drift|curtain|row|diagonal|random
```

## VBML
Uses the official `@vestaboard/vbml` package for local parsing.
See test-vbml.json, props-example.json for examples.

# Vestaboard Array Configurations

Multiple Notes can be arranged together for larger displays.

## Common Arrangements
| Arrangement | Notes | Grid |
|-------------|-------|------|
| 2 side-by-side | 2 | 3 × 30 |
| 4 side-by-side | 4 | 3 × 60 |
| 2 stacked | 2 | 6 × 15 |
| 4 stacked | 4 | 12 × 15 |
| 2×2 grid | 4 | 6 × 30 |

## Slicing Logic
- **Side-by-side**: split by **column offset** (each board gets a 3×15 slice, `colOffset` += 15)
- **Stacked**: split by **row offset** (each board gets a 3×15 slice, `rowOffset` += 3)
- **2×2 grid**: both row & col offsets (top-left = 0,0; top-right = 0,15; bottom-left = 3,0; bottom-right = 3,15)

## Per-Board Config
Each board needs: `{ host, apiKey, rowOffset?, colOffset? }`
- `NOTE_ROWS = 3`, `NOTE_COLS = 15`

## Tips
- Send in parallel (Promise.all / thread pool) for synchronized display
- All boards should be on same firmware version
- Use static DHCP leases by MAC for stable IP mapping
- Each board enabled independently with its own enablement token

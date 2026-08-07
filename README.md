# Vestaboard

Send messages to a Vestaboard Note (3×15) from the command line or as a library.

## Quick Start

```bash
vb "Hello World"              # Send text
vb "HI" --anim wave           # With animation
vb --quiet "Goodnight"        # Late-night slow mode
vb -r                         # Read current message
vb -c                         # Clear board
vb -l                         # List character codes
vb --vbml file.json           # Parse a VBML file
vb --charcode 62              # Show character by code
vb --noRead                   # Skip auto-read after sending
```

## Library Usage

```js
import { Vestaboard, printGrid, ANIMS, sleep } from 'vestaboard';

const vb = new Vestaboard();

// Parse text to grid
const grid = vb.parseText('Hello');
printGrid(grid);

// Send to board
await vb.send(grid, ANIMS.wave);

// Read current message
const current = await vb.read();
printGrid(current);

// Parse VBML
const vbmlGrid = vb.parseVBML({
  components: [{ template: 'Hello World', style: { justify: 'center' } }]
});
```

## Config

`.env` file (gitignored):

```
VB_API_KEY=your_key_here
VESTABOARD_HOST=vestaboard
VESTABOARD_PORT=7000
```

## Structure

```
lib/vestaboard.js   # Core library (Vestaboard class, animations)
vestaboard.js       # CLI wrapper (yargs arg parsing)
vb                  # Shell wrapper script
docs/               # API docs, char codes, networking, VBML
```

## Animations

| Animation | Speed | Description |
|-----------|-------|-------------|
| `wave` | 0.8s | Column sweep top-to-bottom |
| `drift` | 0.8s | Reverse column sweep |
| `curtain` | 0.8s | Edges to center |
| `row` | 0.8s | Row by row |
| `diagonal` | 0.8s | Corner to corner |
| `random` | 0.8s | Random cells |

`--quiet` doubles the delay to 1.5s per step.

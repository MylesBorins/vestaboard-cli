# Vestaboard

Send messages to a Vestaboard Note (3×15) from the command line or as a library.

## Quick Start

```bash
vestaboard setup            # Initial configuration (stores in keychain)
vestaboard "Hello World"    # Send text
vestaboard "HI" --anim wave # With animation
vestaboard --quiet "Goodnight"  # Late-night slow mode
vestaboard -r               # Read current message
vestaboard -c               # Clear board
vestaboard -l               # List character codes
vestaboard --vbml file.json # Parse a VBML file
vestaboard --charcode 62    # Show character by code
vestaboard --noRead         # Skip auto-read after sending

# Aliases (local shell wrapper):
vb setup                    # Same as vestaboard setup
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

// Parse VBML payload (returns grid without sending)
const vbmlGrid = vb.parseVBML({
  components: [{ template: 'Hello World', style: { justify: 'center' } }]
});

// Send VBML directly
await vb.sendVBML(vbmlPayload, ANIMS.wave);

// Parse character code into grid
const charGrid = vb.parseCharCode(62); // ♥
```

Convenience functions (auto-loads config from keychain/env):

```js
import { sendToBoard, sendVBML, clearBoard, readBoard } from 'vestaboard';

await sendToBoard(grid, ANIMS.wave);
await sendVBML(vbmlPayload, ANIMS.wave);
await clearBoard();
const msg = await readBoard();
```

## Config

Configuration is stored in the **macOS keychain** (via `vb setup`).

Environment variables override keychain values:

```
VB_API_KEY=your_key_here
VESTABOARD_HOST=vestaboard
VESTABOARD_PORT=7000
```

## Structure

```
lib/vestaboard.js   # Core library (Vestaboard class, animations, helpers)
index.js            # CLI wrapper (yargs arg parsing)
vb                  # Shell wrapper script → index.js
test/               # Test suite
vbml/               # VBML example files
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

`--quiet` changes the delay to 1.5s per step.

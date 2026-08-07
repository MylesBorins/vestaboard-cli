# VBML - Vestaboard Markup Language

Cloud API: `POST https://cloud.vestaboard.com/vbml/compose`
Returns: character code arrays

## VBML Features

### Plain Text
```json
{"components": [{"template": "Hello World!"}]}
```

### Styling
- `justify`: "left" | "right" | "center" | "justified"
- `align`: "top" | "bottom" | "center" | "justified"
- `height`: 1-6 (default 6, 3 for Note)
- `width`: 1-22 (default 22, 15 for Note)
- `absolutePosition`: {x, y}

### Character Codes
Use `{code}` syntax:
```json
{"components": [{"template": "Hello {62} World"}]}
```

### Dynamic Props
```json
{
  "props": {"name": "Vestaboard"},
  "components": [{"template": "Hello {{name}}!"}]
}
```

### Multiple Components
```json
{
  "components": [
    {"template": "Line 1", "style": {"height": 2}},
    {"template": "Line 2", "style": {"height": 4}}
  ]
}
```

### Vestaboard Note
Need root style:
```json
{
  "style": {"height": 3, "width": 15},
  "components": [{"template": "Hello World"}]
}
```

### Raw Characters
```json
{"components": [{"rawCharacters": [[1,2,3]]}]}
```

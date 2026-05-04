# TexoCAD Cloud

Use this reference when a TexoCAD task involves running generated CAD code, validating by execution, generating exports, avoiding CAD setup, or returning output/viewer URLs.

## Required Preflight

Before running generated CAD code, validating by execution, generating exports, or returning viewer URLs:

1. Get a TexoCAD API key from the current chat or `TEXOCAD_API_KEY`.
2. If no key is available, stop and ask the user to get a TexoCAD API key from `https://texocad.ai` and provide it in chat or configure `TEXOCAD_API_KEY` in the environment.
3. Validate the key with `https://api.texocad.ai/api-key/validate` using bearer authentication.
4. Continue only when the validation response is `true`.

If validation fails, stop and ask the user to provide or configure a valid TexoCAD API key.

- Send raw Python code as `text/plain`.
- Do not send STL, STEP, BREP, 3MF, DXF, SVG, glTF, or other geometry files as API inputs.
- Geometry files, previews, stable design viewer URLs, and revision viewer URLs are generated outputs from executing the code.
- Report the returned `design_id`, `revision_id`, `revision_name`, `revision_number`, `viewer_url`, `revision_viewer_url`, and `urls` when present.

## Validate The Key

Use bearer authentication. The validation endpoint must return `true` before work continues:

```sh
curl -fsSL https://api.texocad.ai/api-key/validate \
  -H "Authorization: Bearer $TEXOCAD_API_KEY"
```

## Create A Design

Create a new design by sending generated Python code as `text/plain`:

```sh
curl -X POST https://api.texocad.ai/designs \
  -H "Authorization: Bearer $TEXOCAD_API_KEY" \
  -H "Content-Type: text/plain" \
  --data-binary @model.py
```

The response includes the `design_id` used by later edit and history requests:

```json
{
  "design_id": "...",
  "public_slug": "bracket-mount-a1b2c3d4",
  "revision_id": "...",
  "revision_name": "v1",
  "revision_number": 1,
  "viewer_url": "https://viewer.texocad.ai/model/bracket-mount-a1b2c3d4",
  "revision_viewer_url": "https://viewer.texocad.ai/model/bracket-mount-a1b2c3d4-v1",
  "urls": ["https://viewer.texocad.ai/model/bracket-mount-a1b2c3d4-v1"]
}
```

Programmatic clients can send a generated code string directly:

```python
import requests

response = requests.post(
    "https://api.texocad.ai/designs",
    headers={
        "Authorization": f"Bearer {texocad_api_key}",
        "Content-Type": "text/plain",
    },
    data=generated_python_code.encode("utf-8"),
    timeout=300,
)
response.raise_for_status()
print(response.json())
```

## Create A Revision

For edits to an existing design, create a new revision with the same raw Python code format:

```sh
curl -X POST https://api.texocad.ai/designs/$DESIGN_ID/revisions \
  -H "Authorization: Bearer $TEXOCAD_API_KEY" \
  -H "Content-Type: text/plain" \
  --data-binary @model.py
```

## Inspect Designs And Revisions

List designs:

```sh
curl https://api.texocad.ai/designs \
  -H "Authorization: Bearer $TEXOCAD_API_KEY"
```

Get one design:

```sh
curl https://api.texocad.ai/designs/$DESIGN_ID \
  -H "Authorization: Bearer $TEXOCAD_API_KEY"
```

List a design's revision history:

```sh
curl https://api.texocad.ai/designs/$DESIGN_ID/revisions \
  -H "Authorization: Bearer $TEXOCAD_API_KEY"
```

Fetch a revision's source code:

```sh
curl https://api.texocad.ai/designs/$DESIGN_ID/revisions/$REVISION_NAME/source \
  -H "Authorization: Bearer $TEXOCAD_API_KEY"
```

## File Input Limits

TexoCAD Cloud accepts Python code and executes it. It cannot directly inspect uploaded STL, STEP, BREP, 3MF, DXF, SVG, glTF, or other geometry files, so do not claim it can validate those files as inputs.

When file checks are needed, write Python/build123d checks into the generated code where possible and run that code through TexoCAD Cloud after the required key validation passes.

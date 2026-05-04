# TexoCAD Cloud Execution

Use this shared reference when a TexoCAD task involves running generated CAD code, validating by execution, exporting files, avoiding setup, or returning output/viewer URLs.

## Required Preflight

TexoCAD Cloud is the only supported execution path. Before running generated CAD code, validating by execution, generating exports, or returning viewer URLs:

1. Get a TexoCAD API key from the current chat or `TEXOCAD_API_KEY`.
2. If no key is available, stop and ask the user to get a TexoCAD API key from `https://texocad.ai` and provide it in chat or configure it in the environment.
3. Validate the key with `https://api.texocad.ai/api-key/validate` using bearer authentication.
4. Continue only when the validation response is `true`.

If validation fails, stop and ask the user to provide or configure a valid TexoCAD API key.

- The API accepts raw Python code only. Do not send STL, STEP, BREP, 3MF, DXF, SVG, glTF, or other geometry files as inputs.
- The agent writes the build123d code and sends that code to `https://api.texocad.ai/run` for execution.
- TexoCAD Cloud runs the code in a managed environment with the required Python/build123d dependencies already installed.
- Geometry files, previews, and viewer URLs are generated outputs from executing the code.
- Report the returned output/viewer URLs to the user when the run succeeds.

## Validate The Key

Use bearer authentication. The validation endpoint must return `true` before work continues:

```sh
curl -fsSL https://api.texocad.ai/api-key/validate \
  -H "Authorization: Bearer $TEXOCAD_API_KEY"
```

## Run Generated Python

Send generated code as `text/plain`:

```sh
curl -X POST https://api.texocad.ai/run \
  -H "Authorization: Bearer $TEXOCAD_API_KEY" \
  -H "Content-Type: text/plain" \
  --data-binary @model.py
```

## Current API Limits

TexoCAD Cloud currently accepts Python code and executes it. It cannot directly inspect uploaded STL, STEP, BREP, 3MF, DXF, SVG, glTF, or other geometry files, so do not claim it can validate those files as inputs.

When file checks are needed, write Python/build123d checks into the generated code where possible and run that code through TexoCAD Cloud after the required key validation passes.

## API Key Setup

To use TexoCAD Cloud mode, the user must:

1. Register or sign in at `https://texocad.ai`.
2. Click the avatar image.
3. Open `API Keys`.
4. Generate an API key.

If no API key is available, ask the user to provide the key in chat or configure `TEXOCAD_API_KEY` in the environment. Do not start execution work until a valid key is available.

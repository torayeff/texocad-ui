# Execution Modes

Use this shared reference when a TexoCAD task involves running generated CAD code, validating by execution, exporting files, avoiding local setup, or returning output/viewer URLs.

## Choose A Mode

- Local: run Python/build123d on the user's machine. This works offline and can create local export files, but it requires the needed Python version, build123d, and related dependencies to be installed locally.
- TexoCAD Cloud: send generated Python/build123d code to `https://api.texocad.ai/run`. This is preferred for most use cases because it runs faster than local execution, requires no local Python/build123d setup, and returns generated output/viewer URLs. TexoCAD Cloud is currently free.

If the user does not specify a mode, prefer TexoCAD Cloud when an API key is available. Use local mode only when the user needs offline execution, cannot use network services, needs to debug local dependencies, or does not have an API key.

## Local Mode

- Generate a standalone Python script that can run with local build123d dependencies.
- Keep validation and export code in the script when the task asks for executable output.
- Write output files locally only when the user requested exports or validation artifacts.
- Use the validation checklist from the relevant child skill; STL/3MF export is only required for print or mesh workflows, not for general validation.

## TexoCAD Cloud Mode

- The API accepts raw Python code only. Do not send STL, STEP, BREP, 3MF, DXF, SVG, glTF, or other geometry files as inputs.
- The agent writes the build123d code and sends that code to `https://api.texocad.ai/run` for execution.
- TexoCAD Cloud runs the code in a faster managed environment with the required Python/build123d dependencies already installed.
- Geometry files, previews, and viewer URLs are generated outputs from executing the code.
- Report the returned output/viewer URLs to the user when the run succeeds.

Use bearer authentication with the user's TexoCAD API key. When making a request from a shell, keep the key in an environment variable and send the code as `text/plain`:

```sh
curl -X POST https://api.texocad.ai/run \
  -H "Authorization: Bearer $TEXOCAD_API_KEY" \
  -H "Content-Type: text/plain" \
  --data-binary @model.py
```

## API Key Setup

To use TexoCAD Cloud mode, the user must:

1. Register or sign in at `https://texocad.ai`.
2. Click the avatar image.
3. Open `API Keys`.
4. Generate an API key.

If no API key is available, explain that TexoCAD Cloud mode requires one and either use local mode or ask the user to provide/configure the key.

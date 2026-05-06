import { assertSourceByteLength } from "@/app/studio/_components/viewer/geometry-budget";
import { type ModelFormat, type ModelSource } from "@/app/studio/_components/viewer/model-loader-types";

type SourceBufferProgress = (percent: number) => void;

const MAX_MODEL_BYTES = 100 * 1024 * 1024;

function assertNever(value: never, message: string): never {
  throw new Error(`${message}: ${String(value)}`);
}

function extensionFromName(name: string) {
  const cleanName = name.split(/[?#]/)[0];
  const dotIndex = cleanName.lastIndexOf(".");
  return dotIndex >= 0 ? cleanName.slice(dotIndex + 1).toLowerCase() : "";
}

function sourceName(source: ModelSource) {
  switch (source.kind) {
    case "file":
      return source.file.name;
    case "url":
      return new URL(source.url, window.location.href).pathname;
    default:
      return assertNever(source, "Unhandled model source");
  }
}

function readFileBuffer(file: File, onProgress?: SourceBufferProgress, signal?: AbortSignal) {
  assertSourceByteLength(file.size);

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      reader.abort();
    };

    if (signal?.aborted) {
      reject(new Error("Model file read was canceled."));
      return;
    }

    reader.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    reader.addEventListener("load", () => {
      if (reader.result instanceof ArrayBuffer) {
        cleanup();
        try {
          assertSourceByteLength(reader.result.byteLength);
          resolve(reader.result);
        } catch (error) {
          reject(error);
        }
        return;
      }

      cleanup();
      reject(new Error("Failed to read model file."));
    });
    reader.addEventListener("error", () => {
      cleanup();
      reject(new Error("Failed to read model file."));
    });
    reader.addEventListener("abort", () => {
      cleanup();
      reject(new Error("Model file read was canceled."));
    });
    signal?.addEventListener("abort", abort, { once: true });
    reader.readAsArrayBuffer(file);
  });
}

function fetchUrlBuffer(url: string, onProgress?: SourceBufferProgress, signal?: AbortSignal) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const request = new XMLHttpRequest();
    let rejectedAsTooLarge = false;
    const cleanup = () => {
      signal?.removeEventListener("abort", abort);
    };
    const abort = () => {
      request.abort();
    };
    const rejectTooLarge = () => {
      rejectedAsTooLarge = true;
      cleanup();
      reject(new Error("Model files must be 100 MB or smaller."));
      request.abort();
    };

    if (signal?.aborted) {
      reject(new Error("Model download was canceled."));
      return;
    }

    request.open("GET", url);
    request.responseType = "arraybuffer";
    request.addEventListener("progress", (event) => {
      if (event.loaded > MAX_MODEL_BYTES || event.total > MAX_MODEL_BYTES) {
        rejectTooLarge();
        return;
      }

      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300 && request.response instanceof ArrayBuffer) {
        cleanup();
        try {
          assertSourceByteLength(request.response.byteLength);
          resolve(request.response);
        } catch (error) {
          reject(error);
        }
        return;
      }

      cleanup();
      reject(new Error(`Failed to fetch ${url}: ${request.status}`));
    });
    request.addEventListener("error", () => {
      cleanup();
      reject(new Error(`Failed to fetch ${url}.`));
    });
    request.addEventListener("abort", () => {
      cleanup();
      if (!rejectedAsTooLarge) {
        reject(new Error("Model download was canceled."));
      }
    });
    signal?.addEventListener("abort", abort, { once: true });
    request.send();
  });
}

export async function getSourceBuffer(source: ModelSource, onProgress?: SourceBufferProgress, signal?: AbortSignal) {
  switch (source.kind) {
    case "file":
      return readFileBuffer(source.file, onProgress, signal);
    case "url":
      return fetchUrlBuffer(source.url, onProgress, signal);
    default:
      return assertNever(source, "Unhandled model source");
  }
}

export function sourceFormat(source: ModelSource): ModelFormat {
  const extension = extensionFromName(sourceName(source));

  switch (extension) {
    case "step":
    case "stp":
      return "step";
    default:
      throw new Error("Unsupported model format. Use STEP or STP.");
  }
}

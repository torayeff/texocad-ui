import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const publicDir = join(rootDir, "public");
const licensesDir = join(publicDir, "licenses");
const legalFiles = [
  {
    fileName: "occt-import-js-lgpl-2.1.txt",
    source: "license.occt-import-js.txt",
  },
  {
    fileName: "opencascade-technology-lgpl-2.1.txt",
    source: "license.occt.txt",
  },
];

await mkdir(publicDir, { recursive: true });
await mkdir(licensesDir, { recursive: true });
await copyFile(
  join(rootDir, "node_modules", "occt-import-js", "dist", "occt-import-js.wasm"),
  join(publicDir, "occt-import-js.wasm"),
);
await Promise.all(
  legalFiles.map(({ fileName, source }) => copyFile(
    join(rootDir, "node_modules", "occt-import-js", "dist", source),
    join(licensesDir, fileName),
  )),
);

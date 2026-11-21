import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "./out";
const src = join(repoDir, "entry.png");

// Read and validate the image before copying it out.
const bytes = readFileSync(src);
const isPng = bytes.length >= 8 &&
  bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
  bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
const isJpeg = bytes.length >= 3 &&
  bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
if (!isPng && !isJpeg) {
  throw new Error("entry.png is neither a PNG nor a JPEG (bad magic bytes)");
}
if (bytes.length > 1048576) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}
if (isPng) {
  // PNG IHDR: width and height are big-endian uint32 at offsets 16 and 20.
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width > 1024 || height > 1024) {
    throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
  }
}

mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "entry.png"));

// Confirm the copy landed intact.
if (statSync(join(outDir, "entry.png")).size !== bytes.length) {
  throw new Error("copied entry.png does not match the source size");
}

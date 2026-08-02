import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const workspaceRoot = process.cwd();
const spritesDir = path.join(workspaceRoot, "src", "assets", "food sprites");
const backupRootDir = path.join(workspaceRoot, "src", "assets", "food sprites backup");

const validExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const HIGH_LUMA = 245;
const LOW_LUMA = 215;
const SATURATION_TOLERANCE = 38;

function isLikelyExportTempFile(fileName) {
  const lower = fileName.toLowerCase();
  return lower.startsWith("chatgpt image");
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function toTimestampFolderName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}_${hh}-${min}-${sec}`;
}

function computeReplacementAlpha(r, g, b, originalAlpha) {
  const luma = (r + g + b) / 3;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const saturation = max - min;

  if (saturation > SATURATION_TOLERANCE) {
    return originalAlpha;
  }

  if (luma >= HIGH_LUMA) {
    return 0;
  }

  if (luma <= LOW_LUMA) {
    return originalAlpha;
  }

  const ratio = (HIGH_LUMA - luma) / (HIGH_LUMA - LOW_LUMA);
  return Math.round(originalAlpha * ratio);
}

async function removeLightBackgroundFromImage(filePath) {
  const image = sharp(filePath, { failOn: "none" }).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const modified = Buffer.from(data);
  let changedPixels = 0;

  for (let index = 0; index < modified.length; index += channels) {
    const r = modified[index];
    const g = modified[index + 1];
    const b = modified[index + 2];
    const alphaIndex = index + 3;
    const originalAlpha = modified[alphaIndex];

    const nextAlpha = computeReplacementAlpha(r, g, b, originalAlpha);

    if (nextAlpha !== originalAlpha) {
      modified[alphaIndex] = nextAlpha;
      changedPixels += 1;
    }
  }

  await sharp(modified, {
    raw: {
      width: info.width,
      height: info.height,
      channels,
    },
  })
    .png()
    .toFile(filePath);

  return {
    changedPixels,
    pixelCount: info.width * info.height,
  };
}

async function run() {
  const entries = await fs.readdir(spritesDir, { withFileTypes: true });

  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => validExtensions.has(path.extname(fileName).toLowerCase()))
    .filter((fileName) => !isLikelyExportTempFile(fileName));

  if (files.length === 0) {
    console.log("No sprite files found to process.");
    return;
  }

  const backupDir = path.join(backupRootDir, toTimestampFolderName());
  await ensureDirectory(backupDir);

  let processedCount = 0;
  let changedCount = 0;

  for (const fileName of files) {
    const sourcePath = path.join(spritesDir, fileName);
    const backupPath = path.join(backupDir, fileName);

    await fs.copyFile(sourcePath, backupPath);

    const result = await removeLightBackgroundFromImage(sourcePath);
    processedCount += 1;

    if (result.changedPixels > 0) {
      changedCount += 1;
    }

    console.log(
      `${fileName}: adjusted ${result.changedPixels} / ${result.pixelCount} pixels`,
    );
  }

  console.log("");
  console.log(`Processed files: ${processedCount}`);
  console.log(`Files with transparency changes: ${changedCount}`);
  console.log(`Backup created at: ${backupDir}`);
}

run().catch((error) => {
  console.error("Failed to process sprite transparency:", error);
  process.exitCode = 1;
});

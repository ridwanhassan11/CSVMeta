import type { AssetType } from "@/types/image";

const SUPPORTED_EXT_RE = /\.(png|jpe?g|webp|avif|bmp|gif|svg|eps)$/i;

export function getAssetType(file: File): AssetType {
  const name = file.name.toLowerCase();
  if (name.endsWith(".svg") || file.type === "image/svg+xml") return "svg";
  if (
    name.endsWith(".eps") ||
    file.type === "application/postscript" ||
    file.type === "application/eps" ||
    file.type === "image/x-eps"
  ) {
    return "eps";
  }
  return "raster";
}

export function isSupportedAsset(file: File): boolean {
  return file.type.startsWith("image/") || SUPPORTED_EXT_RE.test(file.name);
}

function decodeBase64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s+/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function readAsciiSlice(bytes: Uint8Array, maxBytes = 512_000): string {
  const slice = bytes.subarray(0, Math.min(bytes.length, maxBytes));
  return new TextDecoder("latin1").decode(slice);
}

function extractXmpPreviewBlob(text: string): Blob | null {
  const match = text.match(/<xmpGImg:image>([\s\S]*?)<\/xmpGImg:image>/i);
  if (!match) return null;
  try {
    const raw = match[1].replace(/&#xA;|&#10;/gi, "").replace(/\s+/g, "");
    const jpgBytes = decodeBase64ToBytes(raw);
    if (jpgBytes.length < 100) return null;
    const copy = new Uint8Array(jpgBytes.length);
    copy.set(jpgBytes);
    return new Blob([copy.buffer], { type: "image/jpeg" });
  } catch {
    return null;
  }
}

function extractDosEpsTiffBytes(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 30) return null;
  // DOS EPS magic header: C5 D0 D3 C6
  if (bytes[0] !== 0xc5 || bytes[1] !== 0xd0 || bytes[2] !== 0xd3 || bytes[3] !== 0xc6) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tiffOffset = view.getUint32(20, true);
  const tiffLength = view.getUint32(24, true);
  if (tiffLength > 16 && tiffOffset + tiffLength <= bytes.length) {
    return bytes.subarray(tiffOffset, tiffOffset + tiffLength);
  }
  return null;
}

function parseAsciiBeginPreview(text: string): Blob | null {
  const headerMatch = text.match(/%%BeginPreview:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
  if (!headerMatch) return null;
  const width = Number(headerMatch[1]);
  const height = Number(headerMatch[2]);
  const depth = Number(headerMatch[3]);
  if (!width || !height || width > 2048 || height > 2048 || (depth !== 1 && depth !== 8)) {
    return null;
  }

  const startIdx = (headerMatch.index ?? 0) + headerMatch[0].length;
  const endIdx = text.indexOf("%%EndPreview", startIdx);
  const block = endIdx !== -1 ? text.slice(startIdx, endIdx) : text.slice(startIdx, startIdx + 200_000);
  const hex = block.replace(/[^0-9a-fA-F]/g, "");
  if (!hex.length) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  if (depth === 1) {
    const rowBytes = Math.ceil(width / 8);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const byteIdx = y * rowBytes + (x >> 3);
        const hexPos = byteIdx * 2;
        if (hexPos + 2 > hex.length) break;
        const byteVal = parseInt(hex.slice(hexPos, hexPos + 2), 16);
        const bit = (byteVal >> (7 - (x & 7))) & 1;
        const shade = bit ? 0 : 255;
        const px = (y * width + x) * 4;
        data[px] = shade;
        data[px + 1] = shade;
        data[px + 2] = shade;
        data[px + 3] = 255;
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const hexPos = (y * width + x) * 2;
        if (hexPos + 2 > hex.length) break;
        const shade = parseInt(hex.slice(hexPos, hexPos + 2), 16);
        const px = (y * width + x) * 4;
        data[px] = shade;
        data[px + 1] = shade;
        data[px + 2] = shade;
        data[px + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return dataUrlToBlob(canvas.toDataURL("image/png"));
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);/)?.[1] || "image/png";
    const bytes = decodeBase64ToBytes(b64);
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    return new Blob([copy.buffer], { type: mime });
  } catch {
    return null;
  }
}

function cmykToCss(c: number, m: number, y: number, k: number): string {
  const r = Math.round(255 * (1 - Math.min(1, Math.max(0, c))) * (1 - Math.min(1, Math.max(0, k))));
  const g = Math.round(255 * (1 - Math.min(1, Math.max(0, m))) * (1 - Math.min(1, Math.max(0, k))));
  const b = Math.round(255 * (1 - Math.min(1, Math.max(0, y))) * (1 - Math.min(1, Math.max(0, k))));
  return `rgb(${r},${g},${b})`;
}

function renderEpsVectorPreview(text: string): { blob: Blob | null; colors: string[]; bbox?: [number, number, number, number] } {
  const bboxMatch = text.match(/%%(?:HiRes)?BoundingBox:\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/);
  if (!bboxMatch) return { blob: null, colors: [] };

  const x0 = Number(bboxMatch[1]);
  const y0 = Number(bboxMatch[2]);
  const x1 = Number(bboxMatch[3]);
  const y1 = Number(bboxMatch[4]);
  const w = x1 - x0;
  const h = y1 - y0;
  if (!(w > 0 && h > 0)) return { blob: null, colors: [] };

  const maxSide = 960;
  const scale = maxSide / Math.max(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(120, Math.round(w * scale));
  canvas.height = Math.max(120, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: null, colors: [], bbox: [x0, y0, x1, y1] };

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(0, canvas.height);
  ctx.scale(scale, -scale);
  ctx.translate(-x0, -y0);

  let fillStyle = "#1e293b";
  let strokeStyle = "#1e293b";
  let lineWidth = 1;
  const palette = new Set<string>();
  let drewSomething = false;
  let pathStarted = false;

  const lines = text.slice(0, 450_000).split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("%")) continue;
    const tokens = line.split(/\s+/);
    const op = tokens[tokens.length - 1];

    if ((op === "rg" || op === "RG" || op === "setrgbcolor") && tokens.length >= 4) {
      const r = Math.round(Number(tokens[tokens.length - 4]) * 255);
      const g = Math.round(Number(tokens[tokens.length - 3]) * 255);
      const b = Math.round(Number(tokens[tokens.length - 2]) * 255);
      if ([r, g, b].every((n) => Number.isFinite(n))) {
        const col = `rgb(${r},${g},${b})`;
        palette.add(col);
        if (op === "RG") strokeStyle = col;
        else fillStyle = col;
      }
    } else if ((op === "k" || op === "K" || op === "setcmykcolor") && tokens.length >= 5) {
      const c = Number(tokens[tokens.length - 5]);
      const m = Number(tokens[tokens.length - 4]);
      const y = Number(tokens[tokens.length - 3]);
      const k = Number(tokens[tokens.length - 2]);
      if ([c, m, y, k].every((n) => Number.isFinite(n))) {
        const col = cmykToCss(c, m, y, k);
        palette.add(col);
        if (op === "K") strokeStyle = col;
        else fillStyle = col;
      }
    } else if ((op === "g" || op === "G" || op === "setgray") && tokens.length >= 2) {
      const gray = Math.round(Number(tokens[tokens.length - 2]) * 255);
      if (Number.isFinite(gray)) {
        const col = `rgb(${gray},${gray},${gray})`;
        if (op === "G") strokeStyle = col;
        else fillStyle = col;
      }
    } else if ((op === "w" || op === "setlinewidth") && tokens.length >= 2) {
      const lw = Number(tokens[tokens.length - 2]);
      if (Number.isFinite(lw) && lw > 0) lineWidth = lw;
    } else if ((op === "m" || op === "moveto") && tokens.length >= 3) {
      const x = Number(tokens[tokens.length - 3]);
      const y = Number(tokens[tokens.length - 2]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        if (!pathStarted) {
          ctx.beginPath();
          pathStarted = true;
        }
        ctx.moveTo(x, y);
      }
    } else if ((op === "l" || op === "lineto") && tokens.length >= 3) {
      const x = Number(tokens[tokens.length - 3]);
      const y = Number(tokens[tokens.length - 2]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        if (!pathStarted) {
          ctx.beginPath();
          pathStarted = true;
        }
        ctx.lineTo(x, y);
      }
    } else if ((op === "c" || op === "curveto") && tokens.length >= 7) {
      const nums = tokens.slice(-7, -1).map(Number);
      if (nums.every(Number.isFinite)) {
        if (!pathStarted) {
          ctx.beginPath();
          pathStarted = true;
        }
        ctx.bezierCurveTo(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]);
      }
    } else if (op === "re" && tokens.length >= 5) {
      const nums = tokens.slice(-5, -1).map(Number);
      if (nums.every(Number.isFinite)) {
        if (!pathStarted) {
          ctx.beginPath();
          pathStarted = true;
        }
        ctx.rect(nums[0], nums[1], nums[2], nums[3]);
      }
    } else if (op === "h" || op === "closepath") {
      if (pathStarted) ctx.closePath();
    } else if (op === "f" || op === "F" || op === "f*" || op === "fill") {
      if (pathStarted) {
        ctx.fillStyle = fillStyle;
        ctx.fill(op === "f*" ? "evenodd" : "nonzero");
        drewSomething = true;
        pathStarted = false;
      }
    } else if (op === "S" || op === "s" || op === "stroke") {
      if (pathStarted) {
        if (op === "s") ctx.closePath();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        drewSomething = true;
        pathStarted = false;
      }
    } else if (op === "B" || op === "b" || op === "B*" || op === "b*") {
      if (pathStarted) {
        if (op === "b" || op === "b*") ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.fill(op.includes("*") ? "evenodd" : "nonzero");
        ctx.stroke();
        drewSomething = true;
        pathStarted = false;
      }
    } else if (op === "n" || op === "newpath") {
      pathStarted = false;
    }
  }

  ctx.restore();
  return {
    blob: drewSomething ? dataUrlToBlob(canvas.toDataURL("image/jpeg", 0.85)) : null,
    colors: Array.from(palette).slice(0, 8),
    bbox: [x0, y0, x1, y1],
  };
}

function extractEpsContext(fileName: string, text: string, colors: string[], bbox?: [number, number, number, number]): string {
  const titleMatch = text.match(/%%Title:\s*(.+)/);
  const creatorMatch = text.match(/%%Creator:\s*(.+)/);
  const dcTitle = text.match(/<dc:title>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i)?.[1]?.trim();
  const dcSubjects = Array.from(text.matchAll(/<dc:subject>[\s\S]*?<\/dc:subject>/gi))
    .flatMap((m) => Array.from(m[0].matchAll(/<rdf:li[^>]*>([^<]+)<\/rdf:li>/gi)).map((x) => x[1].trim()))
    .slice(0, 20);

  const textSnippets = Array.from(text.slice(0, 200_000).matchAll(/\(([A-Za-z0-9 ,.&'-]{3,40})\)\s*(?:Tj|TJ|show)/g))
    .map((m) => m[1].trim())
    .filter((s, i, a) => a.indexOf(s) === i)
    .slice(0, 12);

  return [
    `Vector EPS file: ${fileName}`,
    bbox ? `Artboard dimensions: ${Math.round(bbox[2] - bbox[0])} x ${Math.round(bbox[3] - bbox[1])} pt` : "",
    titleMatch?.[1] ? `Embedded EPS Title: ${titleMatch[1].trim()}` : "",
    dcTitle ? `XMP Title: ${dcTitle}` : "",
    dcSubjects.length ? `XMP Keywords: ${dcSubjects.join(", ")}` : "",
    creatorMatch?.[1] ? `Creator: ${creatorMatch[1].trim()}` : "",
    colors.length ? `Detected palette: ${colors.join(", ")}` : "",
    textSnippets.length ? `Text found inside vector: ${textSnippets.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function makeVectorBadgePreview(fileName: string, ext: "EPS" | "SVG", colors: string[], subtitle: string): string {
  const safeName = fileName.replace(/[<>&"]/g, "");
  const safeSub = subtitle.replace(/[<>&"]/g, "");
  const dots = (colors.length ? colors.slice(0, 5) : ["#4f46e5", "#0ea5e9", "#10b981"]).map(
    (c, i) => `<circle cx="${26 + i * 22}" cy="116" r="7" fill="${c}" />`
  ).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160">
    <rect width="320" height="160" rx="14" fill="#f8fafc"/>
    <rect x="14" y="14" width="54" height="24" rx="7" fill="#4f46e5"/>
    <text x="41" y="30" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#ffffff">${ext}</text>
    <text x="16" y="64" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#0f172a">${safeName.slice(0, 30)}</text>
    <text x="16" y="86" font-family="Arial,sans-serif" font-size="11" fill="#64748b">${safeSub.slice(0, 40)}</text>
    ${dots}
  </svg>`;
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}

function normalizeSvgMarkup(rawSvg: string): string {
  let svg = rawSvg.trim();
  if (!/<svg\b/i.test(svg)) return svg;
  const tagMatch = svg.match(/<svg\b([^>]*)>/i);
  if (!tagMatch) return svg;
  const attrs = tagMatch[1];
  const hasWidth = /\bwidth\s*=/i.test(attrs);
  const hasHeight = /\bheight\s*=/i.test(attrs);
  const viewBox = attrs.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1];

  let w = 1024;
  let h = 1024;
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      const scale = 1024 / Math.max(parts[2], parts[3]);
      w = Math.max(64, Math.round(parts[2] * scale));
      h = Math.max(64, Math.round(parts[3] * scale));
    }
  }

  if (!hasWidth || !hasHeight) {
    const extra = `${hasWidth ? "" : ` width="${w}"`}${hasHeight ? "" : ` height="${h}"`}`;
    svg = svg.replace(/<svg\b/i, `<svg${extra}`);
  }
  return svg;
}

async function renderBlobToJpeg(blob: Blob, maxSide = 768): Promise<File> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode image."));
      el.src = url;
    });
    const w = img.naturalWidth || img.width || 768;
    const h = img.naturalHeight || img.height || 768;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const outBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (v) => (v ? resolve(v) : reject(new Error("Compression failed."))),
        "image/jpeg",
        0.74
      );
    });
    return new File([outBlob], "preview.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function fetchDosTiffPreview(tiffBytes: Uint8Array): Promise<Blob | null> {
  try {
    const copy = new Uint8Array(tiffBytes.length);
    copy.set(tiffBytes);
    const res = await fetch("/api/eps-preview", {
      method: "POST",
      headers: { "Content-Type": "image/tiff" },
      body: new Blob([copy.buffer], { type: "image/tiff" }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.size > 100 ? blob : null;
  } catch {
    return null;
  }
}

async function decodeEpsVisual(file: File): Promise<{
  visualBlob: Blob | null;
  vectorContext: string;
  colors: string[];
  bbox?: [number, number, number, number];
}> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = readAsciiSlice(bytes, 750_000);

  let visualBlob: Blob | null = extractXmpPreviewBlob(text);

  if (!visualBlob) {
    const tiffBytes = extractDosEpsTiffBytes(bytes);
    if (tiffBytes) {
      visualBlob = await fetchDosTiffPreview(tiffBytes);
    }
  }

  if (!visualBlob) {
    visualBlob = parseAsciiBeginPreview(text);
  }

  const parsedVector = renderEpsVectorPreview(text);
  if (!visualBlob && parsedVector.blob) {
    visualBlob = parsedVector.blob;
  }

  const vectorContext = extractEpsContext(file.name, text, parsedVector.colors, parsedVector.bbox);
  return {
    visualBlob,
    vectorContext,
    colors: parsedVector.colors,
    bbox: parsedVector.bbox,
  };
}

export async function prepareAssetPreview(file: File): Promise<string> {
  const kind = getAssetType(file);
  if (kind === "raster") return URL.createObjectURL(file);

  if (kind === "svg") {
    try {
      const normalized = normalizeSvgMarkup(await file.text());
      return URL.createObjectURL(new Blob([normalized], { type: "image/svg+xml" }));
    } catch {
      return URL.createObjectURL(file);
    }
  }

  // EPS preview extraction
  try {
    const { visualBlob, colors, bbox } = await decodeEpsVisual(file);
    if (visualBlob) return URL.createObjectURL(visualBlob);
    const dims = bbox ? `${Math.round(bbox[2] - bbox[0])}×${Math.round(bbox[3] - bbox[1])} pt` : "Vector EPS file";
    return makeVectorBadgePreview(file.name, "EPS", colors, dims);
  } catch {
    return makeVectorBadgePreview(file.name, "EPS", [], "Vector EPS file");
  }
}

export async function prepareAssetForUpload(
  file: File,
  maxSide = 768
): Promise<{
  uploadFile?: File;
  vectorContext?: string;
  assetType: AssetType;
}> {
  const assetType = getAssetType(file);

  if (assetType === "svg") {
    const rawText = await file.text();
    const normalized = normalizeSvgMarkup(rawText);
    const svgBlob = new Blob([normalized], { type: "image/svg+xml" });
    try {
      const jpg = await renderBlobToJpeg(svgBlob, maxSide);
      return {
        uploadFile: new File([jpg], file.name.replace(/\.svg$/i, ".jpg"), { type: "image/jpeg" }),
        vectorContext: `Vector SVG file: ${file.name}`,
        assetType,
      };
    } catch {
      return {
        uploadFile: new File([svgBlob], file.name, { type: "image/svg+xml" }),
        vectorContext: `Vector SVG file: ${file.name}\nMarkup summary:\n${rawText.slice(0, 3000)}`,
        assetType,
      };
    }
  }

  if (assetType === "eps") {
    const { visualBlob, vectorContext } = await decodeEpsVisual(file);
    if (visualBlob) {
      try {
        const jpg = await renderBlobToJpeg(visualBlob, maxSide);
        return {
          uploadFile: new File([jpg], file.name.replace(/\.eps$/i, ".jpg"), { type: "image/jpeg" }),
          vectorContext,
          assetType,
        };
      } catch {
        // Fallback to context-only below
      }
    }
    return { vectorContext, assetType };
  }

  // Raster image compression
  let source: (CanvasImageSource & { width: number; height: number }) | null = null;
  let bitmap: ImageBitmap | null = null;
  const objectUrl = URL.createObjectURL(file);

  try {
    try {
      bitmap = await createImageBitmap(file);
      source = bitmap;
    } catch {
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Unsupported or corrupted image file."));
        el.src = objectUrl;
      });
    }

    const encode = async (targetSide: number, quality: number): Promise<Blob> => {
      const scale = Math.min(1, targetSide / Math.max(source!.width, source!.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(source!.width * scale));
      canvas.height = Math.max(1, Math.round(source!.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not prepare image for upload.");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source!, 0, 0, canvas.width, canvas.height);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (v) => (v ? resolve(v) : reject(new Error("Image compression failed."))),
          "image/jpeg",
          quality
        );
      });
    };

    let blob = await encode(maxSide, 0.74);
    if (blob.size > 2_500_000) blob = await encode(512, 0.65);

    const cleanName = file.name.replace(/\.(png|jpe?g|webp|avif|bmp|gif)$/i, "") + ".jpg";
    return {
      uploadFile: new File([blob], cleanName, { type: "image/jpeg", lastModified: Date.now() }),
      assetType,
    };
  } finally {
    bitmap?.close();
    URL.revokeObjectURL(objectUrl);
  }
}

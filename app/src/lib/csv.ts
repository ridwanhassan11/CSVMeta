import type { ImageItem } from "@/types/image";
import type { Platform } from "@/lib/types";

function escapeCell(value: string): string {
  const clean = (value || "").replace(/\r?\n+/g, " ").trim();
  return `"${clean.replace(/"/g, '""')}"`;
}

function formatKeywords(keywords: string[] | undefined, maxCount: number): string {
  return (keywords || [])
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, maxCount)
    .join(", ");
}

type CsvSpec = {
  filename: string;
  delimiter: "," | ";";
  headers: string[];
  toRow: (item: ImageItem) => string[];
};

const PLATFORM_SPECS: Record<Platform, CsvSpec> = {
  general: {
    filename: "metadata-export.csv",
    delimiter: ",",
    headers: ["Filename", "Title", "Description", "Keywords"],
    toRow: (item) => [
      item.file.name,
      item.title || "",
      item.description || "",
      formatKeywords(item.keywords, 50),
    ],
  },
  "adobe-stock": {
    filename: "adobe-stock-metadata.csv",
    delimiter: ",",
    headers: ["Filename", "Title", "Keywords", "Category", "Releases"],
    toRow: (item) => [
      item.file.name,
      item.title || "",
      formatKeywords(item.keywords, 49),
      "",
      "",
    ],
  },
  shutterstock: {
    filename: "shutterstock-metadata.csv",
    delimiter: ",",
    headers: [
      "Filename",
      "Description",
      "Keywords",
      "Categories",
      "Illustration",
      "Mature Content",
      "Editorial",
    ],
    toRow: (item) => [
      item.file.name,
      item.description || item.title || "",
      formatKeywords(item.keywords, 50),
      "",
      "no",
      "no",
      "no",
    ],
  },
  freepik: {
    filename: "freepik-metadata.csv",
    delimiter: ";",
    headers: ["filename", "title", "tags"],
    toRow: (item) => [
      item.file.name,
      item.title || "",
      formatKeywords(item.keywords, 50),
    ],
  },
  vecteezy: {
    filename: "vecteezy-metadata.csv",
    delimiter: ",",
    headers: ["Filename", "Title", "Description", "Keywords"],
    toRow: (item) => [
      item.file.name,
      item.title || "",
      item.description || item.title || "",
      formatKeywords(item.keywords, 50),
    ],
  },
  pond5: {
    filename: "pond5-metadata.csv",
    delimiter: ",",
    headers: [
      "OriginalFilename",
      "Title",
      "Description",
      "Keywords",
      "Category",
      "ClipType",
    ],
    toRow: (item) => [
      item.file.name,
      item.title || "",
      item.description || item.title || "",
      formatKeywords(item.keywords, 50),
      "",
      "",
    ],
  },
};

export function buildCsvContent(images: ImageItem[], platform: Platform): {
  filename: string;
  content: string;
  rowCount: number;
} {
  const rows = images.filter((x) => x.status === "done" && x.prompt === undefined);
  const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS.general;
  const lines = [
    spec.headers.map(escapeCell).join(spec.delimiter),
    ...rows.map((item) => spec.toRow(item).map(escapeCell).join(spec.delimiter)),
  ];
  return {
    filename: spec.filename,
    content: "\uFEFF" + lines.join("\r\n"),
    rowCount: rows.length,
  };
}

export function downloadPlatformCsv(images: ImageItem[], platform: Platform): number {
  const { filename, content, rowCount } = buildCsvContent(images, platform);
  if (!rowCount) return 0;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return rowCount;
}

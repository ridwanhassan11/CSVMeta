export type ImageStatus = "pending" | "loading" | "done" | "error";
export type AssetType = "raster" | "svg" | "eps";

export type ImageItem = {
  id: string;
  file: File;
  previewUrl: string;
  assetType?: AssetType;
  status: ImageStatus;
  title?: string;
  description?: string;
  prompt?: string;
  keywords?: string[];
  error?: string;
  liveOrder?: number;
};

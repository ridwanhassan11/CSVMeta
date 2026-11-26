import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const PLATFORM_LABELS: Record<string, string> = {
  general: "a general stock photography and vector platform",
  "adobe-stock": "Adobe Stock",
  shutterstock: "Shutterstock",
  freepik: "Freepik",
  vecteezy: "Vecteezy",
  pond5: "Pond5",
};

const PLATFORMS_WITH_DESCRIPTION = ["general", "shutterstock", "vecteezy", "pond5"];

class ProviderApiError extends Error {
  status: number;
  code: string;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, code: string, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type AssetInput = {
  index: number;
  buffer: Buffer | null;
  mimeType: string;
  assetType: string;
  assetName: string;
  vectorContext: string;
};

function buildSingleMetadataPrompt(opts: {
  platform: string;
  titleLength: number;
  keywordsCount: number;
  extraInstructions: string;
  includeDescription: boolean;
  asset: AssetInput;
}) {
  const platformLabel = PLATFORM_LABELS[opts.platform] || "a stock platform";
  const isVector = opts.asset.assetType === "eps" || opts.asset.assetType === "svg";

  const jsonShape = opts.includeDescription
    ? `{
  "title": "",
  "description": "",
  "keywords": []
}`
    : `{
  "title": "",
  "keywords": []
}`;

  const vectorNote = isVector
    ? `- This asset is a ${opts.asset.assetType.toUpperCase()} vector graphic (${opts.asset.assetName}). Include appropriate vector/illustration terms where natural.`
    : "";

  const contextSection = opts.asset.vectorContext
    ? `\nAsset Context (${opts.asset.buffer ? "supplemental to image" : "analyze from filename & vector metadata"}):\n${opts.asset.vectorContext}\n`
    : "";

  return `Return ONLY valid JSON in this exact shape:
${jsonShape}

Rules:
- Write a clear, descriptive, commercial stock title suited for ${platformLabel}, max ${opts.titleLength} characters.
${opts.includeDescription ? "- Write a factual description of around 140-180 characters." : ""}
- Provide up to ${opts.keywordsCount} relevant keywords (comma-free individual words or short 2-word phrases), ordered from most relevant to least relevant.
${vectorNote}
- Do not include brand names, trademarks, camera specs, or generic filler unless directly visible.
- Return JSON only. No markdown fences. No explanation.
${opts.extraInstructions ? `- Additional instructions: ${opts.extraInstructions}` : ""}${contextSection}`;
}

function buildBatchMetadataPrompt(opts: {
  platform: string;
  titleLength: number;
  keywordsCount: number;
  extraInstructions: string;
  includeDescription: boolean;
  assets: AssetInput[];
}) {
  const platformLabel = PLATFORM_LABELS[opts.platform] || "a stock platform";
  const itemShape = opts.includeDescription
    ? `{ "index": 0, "title": "", "description": "", "keywords": [] }`
    : `{ "index": 0, "title": "", "keywords": [] }`;

  const assetNotes = opts.assets
    .map((a) => {
      const vec = a.assetType === "eps" || a.assetType === "svg" ? ` [${a.assetType.toUpperCase()} vector]` : "";
      const ctx = a.vectorContext ? ` — ${a.vectorContext.replace(/\n+/g, "; ")}` : "";
      return `Item ${a.index}: ${a.assetName}${vec}${ctx}`;
    })
    .join("\n");

  return `Analyze ALL ${opts.assets.length} assets in order (Item 0 to Item ${opts.assets.length - 1}).
Return ONLY valid JSON in this exact shape:
{
  "items": [
    ${itemShape}
  ]
}

Rules for EACH item:
- Must include exact matching "index" (0..${opts.assets.length - 1}), returning all ${opts.assets.length} items.
- Commercial stock title suited for ${platformLabel}, max ${opts.titleLength} characters.
${opts.includeDescription ? "- Factual description of around 140-180 characters." : ""}
- Up to ${opts.keywordsCount} relevant keywords (comma-free individual words or short 2-word phrases), ordered by relevance.
- For EPS/SVG items, include natural vector/illustration terms.
- Return JSON only. No markdown fences. No explanation.
${opts.extraInstructions ? `- Additional instructions: ${opts.extraInstructions}` : ""}

Assets:
${assetNotes}`;
}

function buildImagePromptPrompt(opts: {
  extraInstructions: string;
  assetType: string;
  vectorContext: string;
}) {
  return `Look at this ${opts.assetType === "eps" || opts.assetType === "svg" ? "vector illustration" : "image"} carefully and write a highly detailed, descriptive prompt that could be used to recreate this exact artwork with an AI generator.

Include details about: subject, composition, lighting, colors, mood, style, and any visually important details.

Return ONLY valid JSON in this exact shape:
{
  "prompt": ""
}

Rules:
- The prompt should be a single detailed paragraph; comma-separated descriptive phrases work well.
- Return JSON only. No markdown fences. No explanation.
${opts.extraInstructions ? `- Additional style guidance: ${opts.extraInstructions}` : ""}
${opts.vectorContext ? `\nContext:\n${opts.vectorContext}` : ""}`;
}

function parseRetryAfterSeconds(message: string, headerVal?: string | null): number | undefined {
  if (headerVal) {
    const parsed = Number(headerVal);
    if (Number.isFinite(parsed) && parsed > 0) return Math.ceil(parsed);
  }
  const match = message.match(/retry\s*(?:in|after)\s*(\d+(?:\.\d+)?)\s*s/i);
  if (match) {
    const secs = Math.ceil(Number(match[1]));
    if (secs > 0) return secs;
  }
  return undefined;
}

function classifyProviderError(err: unknown, provider: string): ProviderApiError {
  if (err instanceof ProviderApiError) return err;
  const anyErr = err as {
    status?: number;
    message?: string;
    retryAfter?: number;
    headers?: { get?: (k: string) => string | null };
  };
  const message = String(anyErr?.message || "Provider error");
  const status = typeof anyErr?.status === "number" ? anyErr.status : 0;
  const retryAfter =
    typeof anyErr?.retryAfter === "number"
      ? anyErr.retryAfter
      : parseRetryAfterSeconds(message, anyErr?.headers?.get?.("retry-after"));

  if (
    status === 401 ||
    status === 403 ||
    /api[_ ]?key[_ ]?invalid|api[_ ]?key not valid|invalid[_ ]?api[_ ]?key|incorrect api key|unauthorized|permission_denied|authentication/i.test(
      message
    )
  ) {
    return new ProviderApiError(
      `${provider} API key সঠিক নয় বা মেয়াদ শেষ হয়েছে। API Keys সেটিংস থেকে key যাচাই করুন।`,
      401,
      "INVALID_API_KEY"
    );
  }

  if (
    status === 404 ||
    /model[_ ]?not[_ ]?found|is not found for API version|does not exist|model.*not supported/i.test(message)
  ) {
    return new ProviderApiError(
      `নির্বাচিত ${provider} মডেলটি পাওয়া যায়নি। API Keys মেনু থেকে অন্য একটি মডেল নির্বাচন করুন। (${message.slice(0, 140)})`,
      404,
      "MODEL_NOT_FOUND"
    );
  }

  const isRateOrQuota =
    status === 429 ||
    /429|quota|resource[_ ]?exhausted|rate.?limit|too many requests|generate_content_free_tier/i.test(message);

  if (isRateOrQuota) {
    // Only mark permanent QUOTA_EXHAUSTED when explicitly daily / zero-limit / insufficient_quota;
    // Gemini's standard per-minute 429 also contains "You exceeded your current quota" & "billing", so treat it as RATE_LIMITED.
    const isHardQuota =
      /limit:\s*0|PerDay|requests_per_day|daily[_ ]?limit|insufficient_quota/i.test(message) &&
      !/PerMinute/i.test(message);

    if (isHardQuota) {
      return new ProviderApiError(
        `${provider} API key-টির দৈনিক/Free Tier quota শেষ হয়েছে (limit reached)। অন্য প্রজেক্ট/অ্যাকাউন্টের API key বা Groq/OpenRouter ব্যবহার করুন। (${message.slice(0, 120)})`,
        429,
        "QUOTA_EXHAUSTED",
        retryAfter
      );
    }

    return new ProviderApiError(
      `${provider} প্রতি মিনিটের rate limit পূর্ণ হয়েছে—অপেক্ষা করে আবার চেষ্টা করা হচ্ছে।`,
      429,
      "RATE_LIMITED",
      retryAfter ?? 20
    );
  }

  if (/safety|prohibited|recitation|blocked/i.test(message)) {
    return new ProviderApiError(
      "Safety ফিল্টারের কারণে এই ফাইলটি স্কিপ করা হয়েছে।",
      422,
      "CONTENT_BLOCKED"
    );
  }

  return new ProviderApiError(
    message.slice(0, 300),
    status >= 400 ? status : 500,
    "PROVIDER_ERROR"
  );
}

async function generateWithGemini(
  apiKey: string,
  modelName: string,
  assets: AssetInput[],
  prompt: string
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

  for (const asset of assets) {
    if (assets.length > 1) {
      parts.push(`--- Asset Item ${asset.index}: ${asset.assetName} ---`);
    }
    if (asset.buffer) {
      parts.push({ inlineData: { data: asset.buffer.toString("base64"), mimeType: asset.mimeType } });
    }
  }
  parts.push(prompt);

  let result;
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });
    result = await model.generateContent(parts);
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message || "");
    if (/json|responseMimeType|generationConfig/i.test(msg)) {
      const fallbackModel = genAI.getGenerativeModel({ model: modelName });
      result = await fallbackModel.generateContent(parts);
    } else {
      throw err;
    }
  }

  const blockReason = result.response.promptFeedback?.blockReason;
  if (blockReason) {
    throw new ProviderApiError(
      `Gemini safety filter blocked this file (${blockReason}).`,
      422,
      "CONTENT_BLOCKED"
    );
  }

  const finishReason = result.response.candidates?.[0]?.finishReason;
  if (finishReason && ["SAFETY", "RECITATION", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(finishReason)) {
    throw new ProviderApiError(
      `Gemini blocked this file (${finishReason}).`,
      422,
      "CONTENT_BLOCKED"
    );
  }

  return result.response.text();
}

function buildMultiModalContent(assets: AssetInput[], prompt: string) {
  const hasAnyImage = assets.some((a) => a.buffer !== null);
  if (!hasAnyImage) return prompt;

  const content: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
  > = [];

  for (const asset of assets) {
    if (assets.length > 1) {
      content.push({ type: "text", text: `Item ${asset.index} (${asset.assetName}):` });
    }
    if (asset.buffer) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${asset.mimeType};base64,${asset.buffer.toString("base64")}` },
      });
    }
  }
  content.push({ type: "text", text: prompt });
  return content;
}

async function generateWithGroq(
  apiKey: string,
  modelName: string,
  assets: AssetInput[],
  prompt: string
) {
  const groq = new Groq({ apiKey });
  const content = buildMultiModalContent(assets, prompt);
  const messages = [{ role: "user" as const, content }];

  try {
    const completion = await groq.chat.completions.create({
      model: modelName,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.4,
    });
    return completion.choices[0]?.message?.content || "";
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message || "");
    if (/response_format|json_object/i.test(msg)) {
      const completion = await groq.chat.completions.create({
        model: modelName,
        messages,
        temperature: 0.4,
      });
      return completion.choices[0]?.message?.content || "";
    }
    throw err;
  }
}

async function generateWithOpenAICompatible(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  assets: AssetInput[];
  prompt: string;
  providerLabel: string;
  extraHeaders?: Record<string, string>;
}) {
  const content = buildMultiModalContent(opts.assets, opts.prompt);

  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      ...(opts.extraHeaders || {}),
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [{ role: "user", content }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const retryAfter = parseRetryAfterSeconds(errText, res.headers.get("retry-after"));
    throw classifyProviderError(
      { status: res.status, message: `${opts.providerLabel} error (${res.status}): ${errText.slice(0, 300)}`, retryAfter },
      opts.providerLabel
    );
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

function extractJsonObject(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Invalid JSON");
  }
}

function clampText(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > Math.floor(maxLength * 0.6) ? sliced.slice(0, lastSpace) : sliced).trim();
}

function normalizeKeywords(raw: unknown, maxCount: number): string[] {
  const list = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === "string"
      ? raw.split(",")
      : [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of list) {
    const tag = entry.replace(/\s+/g, " ").trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
    if (result.length >= maxCount) break;
  }

  return result;
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const provider = (formData.get("provider") as string) || "gemini";
    const geminiModel = (formData.get("geminiModel") as string) || "gemini-3.8-flash";
    const groqModel = (formData.get("groqModel") as string) || "qwen/qwen3.8-27b";
    const mistralModel = (formData.get("mistralModel") as string) || "pixtral-large-latest";
    const openaiModel = (formData.get("openaiModel") as string) || "gpt-4o";
    const openrouterModel = (formData.get("openrouterModel") as string) || "google/gemini-2.5-flash";
    const apiKey = ((formData.get("apiKey") as string) || "").trim();
    const mode = (formData.get("mode") as string) || "metadata";
    const platform = (formData.get("platform") as string) || "general";
    const titleLength = Math.min(200, Math.max(20, Number(formData.get("titleLength")) || 140));
    const keywordsCount = Math.min(50, Math.max(5, Number(formData.get("keywordsCount")) || 43));
    const extraInstructions = ((formData.get("extraInstructions") as string) || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, code: "INVALID_API_KEY", error: `No ${provider} API key provided. Add one via "API Keys".` },
        { status: 401 }
      );
    }

    const batchMetaRaw = formData.get("batchItems") as string | null;
    const assets: AssetInput[] = [];

    if (batchMetaRaw) {
      const metaList = JSON.parse(batchMetaRaw) as Array<{
        index: number;
        assetType?: string;
        assetName?: string;
        vectorContext?: string;
      }>;
      for (const m of metaList) {
        const f = formData.get(`file_${m.index}`) as File | null;
        if (f && f.size > 3_500_000) {
          return NextResponse.json(
            { success: false, error: "File preview is too large." },
            { status: 413 }
          );
        }
        let buffer: Buffer | null = null;
        let mimeType = "image/jpeg";
        if (f && f.type !== "image/svg+xml" && f.type !== "image/tiff") {
          buffer = Buffer.from(await f.arrayBuffer());
          mimeType = f.type || "image/jpeg";
        }
        assets.push({
          index: m.index,
          buffer,
          mimeType,
          assetType: m.assetType || "raster",
          assetName: m.assetName || f?.name || `asset-${m.index}`,
          vectorContext: (m.vectorContext || "").trim(),
        });
      }
    } else {
      const file = formData.get("file") as File | null;
      const vectorContext = ((formData.get("vectorContext") as string) || "").trim();
      const assetType = ((formData.get("assetType") as string) || "raster").trim();
      const assetName = ((formData.get("assetName") as string) || file?.name || "asset").trim();

      if (file && file.size > 4_000_000) {
        return NextResponse.json(
          { success: false, error: "File preview is too large. Please use a file under 4 MB." },
          { status: 413 }
        );
      }

      let buffer: Buffer | null = null;
      let mimeType = "image/jpeg";
      if (file && file.type !== "image/svg+xml" && file.type !== "image/tiff") {
        buffer = Buffer.from(await file.arrayBuffer());
        mimeType = file.type || "image/jpeg";
      }
      if (buffer || vectorContext) {
        assets.push({ index: 0, buffer, mimeType, assetType, assetName, vectorContext });
      }
    }

    if (!assets.length || assets.some((a) => !a.buffer && !a.vectorContext)) {
      return NextResponse.json({ success: false, error: "No image or vector data provided." }, { status: 400 });
    }

    const includeDescription = PLATFORMS_WITH_DESCRIPTION.includes(platform);
    const isBatch = assets.length > 1 && mode === "metadata";

    const prompt =
      mode === "prompt"
        ? buildImagePromptPrompt({
            extraInstructions,
            assetType: assets[0].assetType,
            vectorContext: assets[0].vectorContext,
          })
        : isBatch
          ? buildBatchMetadataPrompt({
              platform,
              titleLength,
              keywordsCount,
              extraInstructions,
              includeDescription,
              assets,
            })
          : buildSingleMetadataPrompt({
              platform,
              titleLength,
              keywordsCount,
              extraInstructions,
              includeDescription,
              asset: assets[0],
            });

    let rawText: string;
    try {
      switch (provider) {
        case "groq":
          rawText = await generateWithGroq(apiKey, groqModel, assets, prompt);
          break;
        case "mistral":
          rawText = await generateWithOpenAICompatible({
            baseUrl: "https://api.mistral.ai/v1",
            apiKey,
            model: mistralModel,
            assets,
            prompt,
            providerLabel: "Mistral",
          });
          break;
        case "openai":
          rawText = await generateWithOpenAICompatible({
            baseUrl: "https://api.openai.com/v1",
            apiKey,
            model: openaiModel,
            assets,
            prompt,
            providerLabel: "OpenAI",
          });
          break;
        case "openrouter":
          rawText = await generateWithOpenAICompatible({
            baseUrl: "https://openrouter.ai/api/v1",
            apiKey,
            model: openrouterModel,
            assets,
            prompt,
            providerLabel: "OpenRouter",
            extraHeaders: {
              "HTTP-Referer": "https://csvmeta-drab.vercel.app",
              "X-Title": "CSVMeta",
            },
          });
          break;
        default:
          rawText = await generateWithGemini(apiKey, geminiModel, assets, prompt);
      }
    } catch (providerError: unknown) {
      const classified = classifyProviderError(providerError, provider);
      const headers: HeadersInit = classified.retryAfterSeconds
        ? { "Retry-After": String(classified.retryAfterSeconds) }
        : {};

      return NextResponse.json(
        {
          success: false,
          code: classified.code,
          retryAfterSeconds: classified.retryAfterSeconds,
          error: classified.message,
        },
        { status: classified.status, headers }
      );
    }

    let data: Record<string, unknown>;
    try {
      data = extractJsonObject(rawText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_JSON",
          error: `${provider} returned unreadable JSON.`,
        },
        { status: 502 }
      );
    }

    if (mode === "prompt") {
      return NextResponse.json({
        success: true,
        prompt: String(data.prompt || "").trim(),
      });
    }

    if (isBatch) {
      const rawItems = Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>) : [];
      if (rawItems.length < assets.length) {
        return NextResponse.json(
          { success: false, code: "INVALID_JSON", error: "Incomplete batch response." },
          { status: 502 }
        );
      }
      const normalized = assets.map((a, idx) => {
        const found =
          rawItems.find((r) => Number(r.index) === a.index) || rawItems[idx] || {};
        return {
          index: a.index,
          title: clampText(String(found.title || ""), titleLength),
          description: includeDescription
            ? clampText(String(found.description || found.title || ""), 200)
            : undefined,
          keywords: normalizeKeywords(found.keywords, keywordsCount),
        };
      });
      return NextResponse.json({ success: true, items: normalized });
    }

    const title = clampText(String(data.title || ""), titleLength);
    const description = includeDescription
      ? clampText(String(data.description || data.title || ""), 200)
      : undefined;
    const keywords = normalizeKeywords(data.keywords, keywordsCount);

    return NextResponse.json({
      success: true,
      title,
      description,
      keywords,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Error";
    console.error("FULL ERROR:", error);
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR", error: message },
      { status: 500 }
    );
  }
}

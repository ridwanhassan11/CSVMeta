import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import sharp from "sharp";

const PLATFORM_LABELS: Record<string, string> = {
  general: "a general stock photography platform",
  "adobe-stock": "Adobe Stock",
  shutterstock: "Shutterstock",
  freepik: "Freepik",
  vecteezy: "Vecteezy",
  pond5: "Pond5",
};

// 👇 কোন প্ল্যাটফর্মে Description থাকবে
const PLATFORMS_WITH_DESCRIPTION = ["general", "shutterstock", "vecteezy", "pond5"];

function buildMetadataPrompt(opts: {
  platform: string;
  titleLength: number;
  keywordsCount: number;
  extraInstructions: string;
  includeDescription: boolean;
}) {
  const platformLabel = PLATFORM_LABELS[opts.platform] || "a stock platform";

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

  return `
Return ONLY valid JSON in this exact shape:
${jsonShape}

Rules:
- Write a title suited for ${platformLabel}, max ${opts.titleLength} characters.
${opts.includeDescription ? "- Write a description of around 150 characters." : ""}
- Provide exactly ${opts.keywordsCount} relevant keywords, ordered by relevance.
- Return JSON only. No markdown. No explanation.
${opts.extraInstructions ? `- Additional instructions: ${opts.extraInstructions}` : ""}
`;
}

function buildImagePromptPrompt(opts: { extraInstructions: string }) {
  return `
Look at this image carefully and write a highly detailed, descriptive prompt that could be used to recreate this exact image with an AI image generator (like Midjourney or DALL-E).

Include details about: subject, composition, lighting, colors, mood, style, camera angle, and any other visually important details.

Return ONLY valid JSON in this exact shape:
{
  "prompt": ""
}

Rules:
- The prompt should be a single detailed paragraph, comma-separated descriptive phrases work well.
- Return JSON only. No markdown. No explanation.
${opts.extraInstructions ? `- Additional style guidance: ${opts.extraInstructions}` : ""}
`;
}

async function generateWithGemini(
  apiKey: string,
  modelName: string,
  buffer: Buffer,
  mimeType: string,
  prompt: string
) {
  if (!apiKey) throw new Error("Gemini API key missing. Please add it via API Keys.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent([
    { inlineData: { data: buffer.toString("base64"), mimeType } },
    prompt,
  ]);

  return result.response.text();
}

async function generateWithGroq(apiKey: string, buffer: Buffer, mimeType: string, prompt: string) {
  if (!apiKey) throw new Error("Groq API key missing. Please add it via API Keys.");

  const groq = new Groq({ apiKey });
  const base64Image = buffer.toString("base64");

  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.6-27b",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  return completion.choices[0]?.message?.content || "";
}

// 👇 Mistral, OpenAI, OpenRouter — সবগুলোই OpenAI-কম্প্যাটিবল chat completions API,
// তাই একটাই জেনেরিক ফাংশন দিয়ে কাজ চলবে
async function generateWithOpenAICompatible(opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  buffer: Buffer;
  mimeType: string;
  prompt: string;
  providerLabel: string;
  extraHeaders?: Record<string, string>;
}) {
  if (!opts.apiKey) throw new Error(`${opts.providerLabel} API key missing. Please add it via API Keys.`);

  const base64Image = opts.buffer.toString("base64");

  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      ...(opts.extraHeaders || {}),
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: opts.prompt },
            { type: "image_url", image_url: { url: `data:${opts.mimeType};base64,${base64Image}` } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`${opts.providerLabel} error (${res.status}): ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const provider = (formData.get("provider") as string) || "gemini";
    const geminiModel = (formData.get("geminiModel") as string) || "gemini-2.5-flash";
    const mistralModel = (formData.get("mistralModel") as string) || "pixtral-large-latest";
    const openaiModel = (formData.get("openaiModel") as string) || "gpt-4o";
    const openrouterModel = (formData.get("openrouterModel") as string) || "google/gemini-2.5-flash";
    const apiKey = (formData.get("apiKey") as string) || "";
    const mode = (formData.get("mode") as string) || "metadata";
    const platform = (formData.get("platform") as string) || "general";
    const titleLength = Number(formData.get("titleLength")) || 150;
    const keywordsCount = Number(formData.get("keywordsCount")) || 45;
    const extraInstructions = (formData.get("extraInstructions") as string) || "";

    if (!file) {
      return NextResponse.json({ success: false, error: "No image selected." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: `No ${provider} API key provided. Add one via "API Keys".` },
        { status: 401 }
      );
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    let buffer: Buffer;
    let mimeType: string;
    try {
      buffer = await sharp(originalBuffer)
        .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      mimeType = "image/jpeg";
    } catch (resizeError: any) {
      return NextResponse.json(
        { success: false, error: `Image processing failed: ${resizeError?.message}` },
        { status: 500 }
      );
    }

    const includeDescription = PLATFORMS_WITH_DESCRIPTION.includes(platform);

    const prompt =
      mode === "prompt"
        ? buildImagePromptPrompt({ extraInstructions })
        : buildMetadataPrompt({ platform, titleLength, keywordsCount, extraInstructions, includeDescription });

    let rawText: string;
    try {
      switch (provider) {
        case "groq":
          rawText = await generateWithGroq(apiKey, buffer, mimeType, prompt);
          break;
        case "mistral":
          rawText = await generateWithOpenAICompatible({
            baseUrl: "https://api.mistral.ai/v1",
            apiKey,
            model: mistralModel,
            buffer,
            mimeType,
            prompt,
            providerLabel: "Mistral",
          });
          break;
        case "openai":
          rawText = await generateWithOpenAICompatible({
            baseUrl: "https://api.openai.com/v1",
            apiKey,
            model: openaiModel,
            buffer,
            mimeType,
            prompt,
            providerLabel: "OpenAI",
          });
          break;
        case "openrouter":
          rawText = await generateWithOpenAICompatible({
            baseUrl: "https://openrouter.ai/api/v1",
            apiKey,
            model: openrouterModel,
            buffer,
            mimeType,
            prompt,
            providerLabel: "OpenRouter",
            extraHeaders: {
              "HTTP-Referer": "https://csvmeta-drab.vercel.app",
              "X-Title": "CSVMeta",
            },
          });
          break;
        default:
          rawText = await generateWithGemini(apiKey, geminiModel, buffer, mimeType, prompt);
      }
    } catch (providerError: any) {
      return NextResponse.json(
        { success: false, error: providerError?.message || "Provider error" },
        { status: 401 }
      );
    }

    const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;
    try {
      data = JSON.parse(cleanText);
    } catch {
      return NextResponse.json(
        { success: false, error: `${provider} returned invalid JSON.`, response: cleanText },
        { status: 500 }
      );
    }

    if (mode === "prompt") {
      return NextResponse.json({
        success: true,
        prompt: data.prompt,
      });
    }

    return NextResponse.json({
      success: true,
      title: data.title,
      description: includeDescription ? data.description : undefined,
      keywords: data.keywords,
    });
  } catch (error: any) {
    console.error("FULL ERROR:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown Error" },
      { status: 500 }
    );
  }
}
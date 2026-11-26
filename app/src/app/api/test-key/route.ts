import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { provider, model, apiKey } = (await req.json()) as {
      provider: string;
      model: string;
      apiKey: string;
    };

    const key = (apiKey || "").trim();
    if (!key) {
      return NextResponse.json({ ok: false, error: "API key খালি আছে।" }, { status: 400 });
    }

    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(key);
      const genModel = genAI.getGenerativeModel({ model: model || "gemini-3.8-flash" });
      await genModel.generateContent("Reply with OK");
      return NextResponse.json({ ok: true, message: "Gemini API key ও মডেল কাজ করছে!" });
    }

    if (provider === "groq") {
      const groq = new Groq({ apiKey: key });
      await groq.chat.completions.create({
        model: model || "qwen/qwen3.8-27b",
        messages: [{ role: "user", content: "Reply with OK" }],
        max_tokens: 5,
      });
      return NextResponse.json({ ok: true, message: "Groq API key ও মডেল কাজ করছে!" });
    }

    const baseUrls: Record<string, string> = {
      mistral: "https://api.mistral.ai/v1",
      openai: "https://api.openai.com/v1",
      openrouter: "https://openrouter.ai/api/v1",
    };

    const baseUrl = baseUrls[provider];
    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "Unsupported provider" }, { status: 400 });
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with OK" }],
        max_tokens: 5,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Error (${res.status}): ${text.slice(0, 200)}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, message: `${provider} API key কাজ করছে!` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Test failed";
    return NextResponse.json({ ok: false, error: msg.slice(0, 220) }, { status: 500 });
  }
}

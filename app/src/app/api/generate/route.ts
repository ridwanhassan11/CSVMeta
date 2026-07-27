import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image selected." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is missing in .env.local",
        },
        { status: 401 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        },
      },
      `
Return ONLY valid JSON.

{
  "title": "",
  "description": "",
  "keywords": []
}

Rules:
- Create an Adobe Stock title.
- Create an Adobe Stock description.
- Create exactly 49 keywords.
- Return JSON only.
- No markdown.
- No explanation.
`,
    ]);

    const rawText = result.response.text();

    console.log("========== GEMINI RESPONSE ==========");
    console.log(rawText);

    const cleanText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let data;

    try {
      data = JSON.parse(cleanText);
    } catch (jsonError) {
      console.error("JSON Parse Error");
      console.error(cleanText);

      return NextResponse.json(
        {
          success: false,
          error: "Gemini returned invalid JSON.",
          response: cleanText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      title: data.title,
      description: data.description,
      keywords: data.keywords,
    });

  } catch (error: any) {
    console.error("========== FULL ERROR ==========");
    console.error(error);
    console.error("Message:", error?.message);
    console.error("Stack:", error?.stack);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown Error",
        stack: error?.stack || "",
      },
      { status: 500 }
    );
  }
}
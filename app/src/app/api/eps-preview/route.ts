import sharp from "sharp";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length || buf.length > 15_000_000) {
      return NextResponse.json({ error: "Invalid preview buffer" }, { status: 400 });
    }

    const jpeg = await sharp(buf)
      .rotate()
      .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toBuffer();

    return new NextResponse(new Uint8Array(jpeg), {
      status: 200,
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch {
    return NextResponse.json({ error: "Could not decode TIFF preview" }, { status: 422 });
  }
}

import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const widthStr = searchParams.get("w");
  const qualityStr = searchParams.get("q");

  if (!imageUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // 1. Path Traversal & Security Validation
  const publicDir = path.join(process.cwd(), "public");
  // Clean URL to prevent escaping the public directory
  const sanitizedUrl = imageUrl.replace(/^\/+/, "").replace(/\.\./g, "");
  const absolutePath = path.resolve(publicDir, sanitizedUrl);

  if (!absolutePath.startsWith(publicDir)) {
    return new Response("Access Denied", { status: 403 });
  }

  // 2. File Check & Metadata for HTTP Caching (304 Not Modified)
  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch {
    return new Response("Image Not Found", { status: 404 });
  }

  const lastModified = stat.mtime.toUTCString();
  const etag = `W/"${stat.size}-${stat.mtimeMs}"`;

  if (
    req.headers.get("if-none-match") === etag ||
    req.headers.get("if-modified-since") === lastModified
  ) {
    return new Response(null, {
      status: 304,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
        "Last-Modified": lastModified,
      },
    });
  }

  // 3. Format Negotiation
  const acceptHeader = req.headers.get("accept") || "";
  let format: "avif" | "webp" | "png" | "jpeg" = "jpeg";
  let contentType = "image/jpeg";

  if (acceptHeader.includes("image/avif")) {
    format = "avif";
    contentType = "image/avif";
  } else if (acceptHeader.includes("image/webp")) {
    format = "webp";
    contentType = "image/webp";
  } else {
    const ext = path.extname(absolutePath).toLowerCase();
    if (ext === ".png") {
      format = "png";
      contentType = "image/png";
    }
  }

  const quality = qualityStr ? Math.max(1, Math.min(100, parseInt(qualityStr, 10))) : 80;
  const width = widthStr ? parseInt(widthStr, 10) : null;

  // 4. Processing Pipeline
  try {
    // Check if we are running in a Bun runtime environment
    if (typeof Bun === "undefined") {
      throw new Error("Bun runtime not detected, falling back to original image delivery");
    }

    const bunFile = (Bun as any).file(absolutePath);
    let imagePipeline = bunFile.image();

    // Apply resize if width is provided
    if (width && width > 0) {
      imagePipeline = imagePipeline.resize(width, undefined, { withoutEnlargement: true });
    }

    let outputBytes: Uint8Array;

    try {
      // Dynamic compression format application
      if (format === "avif") {
        outputBytes = await imagePipeline.avif({ quality }).bytes();
      } else if (format === "webp") {
        outputBytes = await imagePipeline.webp({ quality }).bytes();
      } else if (format === "png") {
        outputBytes = await imagePipeline.png({ compressionLevel: 6 }).bytes();
      } else {
        outputBytes = await imagePipeline.jpeg({ quality }).bytes();
      }
    } catch (err: any) {
      // System backend fallback (e.g. if AVIF encode fails due to lack of AV1 encoders on the host OS)
      if (err.code === "ERR_IMAGE_FORMAT_UNSUPPORTED" && format === "avif") {
        imagePipeline = (Bun as any).file(absolutePath).image();
        if (width && width > 0) {
          imagePipeline = imagePipeline.resize(width, undefined, { withoutEnlargement: true });
        }
        outputBytes = await imagePipeline.webp({ quality }).bytes();
        contentType = "image/webp";
      } else {
        throw err;
      }
    }

    // 5. Response delivery with Cache-Control headers
    return new Response(outputBytes as any, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: etag,
        "Last-Modified": lastModified,
      },
    });
  } catch (error: any) {
    if (typeof Bun !== "undefined") {
      console.error(`[Image Optimizer] Failed to process ${imageUrl}:`, error);
    }
    
    // Safety fallback: serve the original raw file if optimization fails (e.g. on Node.js)
    try {
      const rawBytes = await fs.readFile(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();
      const rawContentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      
      return new Response(rawBytes as any, {
        headers: {
          "Content-Type": rawContentType,
          "Cache-Control": "public, max-age=86400", // Shorter cache for unoptimized fallback
        },
      });
    } catch {
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}

import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// 1. Programmatically fix spelling of Palla Mamidi -> Palle Mamidi in all app/ and db/ files
try {
  const replaceSpellingInDir = (dir: string) => {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        replaceSpellingInDir(filePath);
      } else if (
        file.endsWith(".tsx") ||
        file.endsWith(".ts") ||
        file.endsWith(".json") ||
        file.endsWith(".md")
      ) {
        let content = fs.readFileSync(filePath, "utf8");
        if (content.includes("Palla Mamidi")) {
          content = content.replaceAll("Palla Mamidi", "Palle Mamidi");
          fs.writeFileSync(filePath, content, "utf8");
          console.log(`[SPELLING] Fixed Palla Mamidi -> Palle Mamidi in: ${file}`);
        }
      }
    }
  };
  replaceSpellingInDir(path.join(process.cwd(), "app"));
  replaceSpellingInDir(path.join(process.cwd(), "db"));
} catch (error) {
  console.error("Error fixing spelling:", error);
}

// 2. Programmatically generate crystal-clear, transparent favicons from public/logo.png using sharp
try {
  const sharp = require("sharp");
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const publicDir = path.join(process.cwd(), "public");
  const appDir = path.join(process.cwd(), "app");

  if (fs.existsSync(logoPath)) {
    console.log("[FAVICON] Generating clear transparent favicons from logo.png...");
    // Crop center square (from 1500x1000 to 900x900 centered)
    const baseImage = sharp(logoPath).extract({ left: 300, top: 50, width: 900, height: 900 });

    baseImage
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }: { data: Buffer; info: any }) => {
        // Convert white background to transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If the pixel is pure/almost white, make it transparent
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Alpha channel
          }
        }

        const transparentBase = sharp(data, { raw: info });
        const sizes = [
          { name: "favicon-16x16.png", size: 16, dests: [publicDir] },
          { name: "favicon-32x32.png", size: 32, dests: [publicDir] },
          { name: "apple-touch-icon.png", size: 180, dests: [publicDir] },
          { name: "android-chrome-192x192.png", size: 192, dests: [publicDir] },
          { name: "android-chrome-512x512.png", size: 512, dests: [publicDir] },
          { name: "favicon.ico", size: 48, dests: [publicDir, appDir] }
        ];

        for (const s of sizes) {
          const img = transparentBase.clone().resize(s.size, s.size).png();
          for (const d of s.dests) {
            const destPath = path.join(d, s.name);
            img.toFile(destPath)
              .then(() => console.log(`[FAVICON] Generated: ${s.name} in ${path.basename(d)}`))
              .catch((err: any) => console.error(`[FAVICON] Error writing ${s.name}:`, err));
          }
        }
      })
      .catch((err: any) => console.error("[FAVICON] Transparency conversion error:", err));
  }
} catch (error) {
  console.log("[FAVICON] sharp module not available or error, skipping high-res generation:", error);
}

// 3. Remove vercel.svg
try {
  const vercelSvg = path.join(process.cwd(), "public", "vercel.svg");
  if (fs.existsSync(vercelSvg)) {
    fs.unlinkSync(vercelSvg);
    console.log("Removed vercel.svg");
  }
} catch (error) {}

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://192.168.1.2:4309",
    "http://192.168.1.2:4300",
    "ws://192.168.1.2:4309",
    "ws://192.168.1.2:4300",
    "127.0.0.1:4309",
    "127.0.0.1:4300",
    "localhost:4309",
    "localhost:4300"
  ],
};

export default nextConfig;
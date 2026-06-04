import { SURAH_LIST, SurahMetadata } from "./surahData";

export interface Env {
  QURAN_KV: KVNamespace;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(data: any, status = 200, extraHeaders = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS pre-flight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed. Use GET." }, 405);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Route: Root / Home
    if (path === "/" || path === "/api" || path === "/api/") {
      return jsonResponse({
        name: "WaqfTech KV-Quran API",
        version: "1.0.0",
        description: "A high-performance Cloudflare Worker API serving the complete Holy Quran from Cloudflare KV. Built for the WaqfTech ecosystem.",
        license: "WaqfDPL-Isnad-1.0",
        source_code: "https://github.com/jadmadi/waqftech-packages",
        endpoints: {
          surahs: {
            path: "/api/surahs",
            description: "Get metadata for all 114 Surahs (chapters)"
          },
          surah: {
            path: "/api/surah/:surah",
            description: "Get all verses of a Surah (e.g. /api/surah/1)",
            example: "/api/surah/1"
          },
          ayah: {
            path: "/api/ayah/:surah/:ayah",
            description: "Get a specific verse (ayah) (e.g. /api/ayah/1/1)",
            example: "/api/ayah/1/1"
          }
        }
      }, 200, {
        "Cache-Control": "public, max-age=3600"
      });
    }

    // Route: GET /api/surahs
    if (path === "/api/surahs" || path === "/api/surahs/") {
      return jsonResponse({
        surahs: SURAH_LIST,
        total_surahs: SURAH_LIST.length
      }, 200, {
        "Cache-Control": "public, max-age=86400, immutable"
      });
    }

    // Route: GET /api/ayah/:surah/:ayah
    const ayahMatch = path.match(/^\/api\/ayah\/(\d+)\/(\d+)\/?$/);
    if (ayahMatch) {
      const surahNum = parseInt(ayahMatch[1], 10);
      const ayahNum = parseInt(ayahMatch[2], 10);

      const surahMeta = SURAH_LIST.find(s => s.number === surahNum);
      if (!surahMeta) {
        return jsonResponse({ error: `Invalid surah number: ${surahNum}. Must be between 1 and 114.` }, 404);
      }

      if (ayahNum < 1 || ayahNum > surahMeta.numberOfAyahs) {
        return jsonResponse({ error: `Invalid ayah number: ${ayahNum} for surah ${surahMeta.englishName}. Surah has ${surahMeta.numberOfAyahs} ayahs.` }, 404);
      }

      const key = `${surahNum}:${ayahNum}`;
      try {
        const text = await env.QURAN_KV.get(key);
        if (!text) {
          return jsonResponse({ error: `Ayah ${key} not found in database.` }, 404);
        }

        return jsonResponse({
          surah: {
            number: surahMeta.number,
            name: surahMeta.name,
            englishName: surahMeta.englishName,
            englishNameTranslation: surahMeta.englishNameTranslation
          },
          ayah: ayahNum,
          text: text,
          key
        }, 200, {
          "Cache-Control": "public, max-age=31536000, immutable"
        });
      } catch (err: any) {
        return jsonResponse({ error: "Failed to read from KV", details: err.message }, 500);
      }
    }

    // Route: GET /api/surah/:surah
    const surahMatch = path.match(/^\/api\/surah\/(\d+)\/?$/);
    if (surahMatch) {
      const surahNum = parseInt(surahMatch[1], 10);

      const surahMeta = SURAH_LIST.find(s => s.number === surahNum);
      if (!surahMeta) {
        return jsonResponse({ error: `Invalid surah number: ${surahNum}. Must be between 1 and 114.` }, 404);
      }

      const prefix = `${surahNum}:`;
      try {
        const listResult = await env.QURAN_KV.list({ prefix });
        if (listResult.keys.length === 0) {
          return jsonResponse({ error: `No keys found for surah ${surahNum} in database.` }, 404);
        }

        // We only want exact prefix match (so e.g. "1:" doesn't match "11:")
        const filteredKeys = listResult.keys.filter(k => k.name.startsWith(prefix));

        const sortedKeys = filteredKeys
          .map(k => {
            const parts = k.name.split(":");
            return {
              key: k.name,
              ayah: parseInt(parts[1], 10)
            };
          })
          .sort((a, b) => a.ayah - b.ayah);

        const verses = await Promise.all(
          sortedKeys.map(async (item) => {
            const text = await env.QURAN_KV.get(item.key);
            return {
              ayah: item.ayah,
              text: text || ""
            };
          })
        );

        return jsonResponse({
          surah: surahMeta,
          verses,
          total_verses: verses.length
        }, 200, {
          "Cache-Control": "public, max-age=31536000, immutable"
        });
      } catch (err: any) {
        return jsonResponse({ error: "Failed to read from KV", details: err.message }, 500);
      }
    }

    return jsonResponse({ error: "Endpoint not found." }, 404);
  }
};

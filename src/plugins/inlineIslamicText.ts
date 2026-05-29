import { defineComarkPlugin } from 'comark';

/**
 * inlineIslamicText — pre-processing plugin for natural Islamic typography.
 *
 * Authors use the actual Arabic quotation/bracket characters they already know,
 * and the renderer styles them automatically — no custom syntax to learn.
 *
 * Detected patterns (all inline, flow within paragraphs):
 *
 *   ﴿...﴾  →  <span class="quran-verse">﴿...﴾</span>
 *             Amiri Quran font, green, slightly larger
 *
 *   «...»   →  <span class="hadith-inline">«...»</span>
 *             Amiri serif, bold, amber-brown
 *
 *   ﷺ       →  <span class="prophet-symbol">ﷺ</span>
 *   ﷻ       →  <span class="allah-symbol">ﷻ</span>
 *   ﷲ       →  <span class="allah-symbol">ﷲ</span>
 *   ﷽       →  <span class="bismillah-symbol">﷽</span>
 *   ۞       →  <span class="rub-el-hizb-symbol">۞</span>
 *
 * Also converts simple block tag HTML-like syntax:
 *
 *   <aya ref="...">text</aya>   →  ::ayah{reference="..."}↵text↵::
 *   <aya>text</aya>             →  ::ayah↵text↵::
 *   <hadith grading="...">...</hadith>  →  ::hadith{grading="..."}↵...↵::
 *   <hadith>text</hadith>       →  ::hadith↵text↵::
 */
export const inlineIslamicText: any = defineComarkPlugin(() => ({
  name: 'inlineIslamicText',
  pre: (state: any) => {
    const md = state.markdown;

    const hasInline =
      md.includes('﴿') ||
      md.includes('«') ||
      md.includes('ﷺ') ||
      md.includes('ﷻ') ||
      md.includes('ﷲ') ||
      md.includes('﷽') ||
      md.includes('۞');
    const hasAyaTag = md.includes('<aya') || md.includes('</aya>');
    const hasHadithTag = md.includes('<hadith') || md.includes('</hadith>');

    if (!hasInline && !hasAyaTag && !hasHadithTag) return;

    let result = md;

    // ── Simple block tags: <aya ref="...">...</aya> ─────────────────────────
    if (hasAyaTag) {
      result = result.replace(
        /<aya(?:\s+ref="([^"]*)")?>([\s\S]*?)<\/aya>/g,
        (_: any, ref: string | undefined, body: string) => {
          const content = body.trim();
          return ref
            ? `\n::ayah{reference="${ref}"}\n${content}\n::\n`
            : `\n::ayah\n${content}\n::\n`;
        },
      );
    }

    // ── Simple block tags: <hadith grading="...">...</hadith> ───────────────
    if (hasHadithTag) {
      result = result.replace(
        /<hadith(?:\s+grading="([^"]*)")?>([\s\S]*?)<\/hadith>/g,
        (_: any, grading: string | undefined, body: string) => {
          const content = body.trim();
          return grading
            ? `\n::hadith{grading="${grading}"}\n${content}\n::\n`
            : `\n::hadith\n${content}\n::\n`;
        },
      );
    }

    if (!hasInline) {
      state.markdown = result;
      return;
    }

    // ── Inline: ﴿...﴾ → Quranic verse span ─────────────────────────────────
    result = result.replace(
      /﴿([\s\S]*?)﴾/g,
      '<span class="quran-verse">﴿$1﴾</span>',
    );

    // ── Inline: «...» → Hadith span ─────────────────────────────────────────
    result = result.replace(
      /«([\s\S]*?)»/g,
      '<span class="hadith-inline">«$1»</span>',
    );

    // ── Inline: ﷺ → prophet symbol ──────────────────────────────────────────
    result = result.replace(/ﷺ/g, '<span class="prophet-symbol">ﷺ</span>');

    // ── Inline: ﷻ → Jalla Jalaluh symbol ────────────────────────────────────
    result = result.replace(/ﷻ/g, '<span class="allah-symbol">ﷻ</span>');

    // ── Inline: ﷲ → Allah symbol ────────────────────────────────────────────
    result = result.replace(/ﷲ/g, '<span class="allah-symbol">ﷲ</span>');

    // ── Inline: ﷽ → Bismillah symbol ────────────────────────────────────────
    result = result.replace(/﷽/g, '<span class="bismillah-symbol">﷽</span>');

    // ── Inline: ۞ → Rub el Hizb symbol ──────────────────────────────────────
    result = result.replace(/۞/g, '<span class="rub-el-hizb-symbol">۞</span>');

    state.markdown = result;
  },
}));

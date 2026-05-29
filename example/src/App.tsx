import React, { useState } from 'react';
import { MarkdownField, DefaultMarkdownRenderer } from 'waqftech-markdown-editor';

// Import local editor stylesheet
import '../../src/styles.css';

const DEFAULT_MARKDOWN = `# ﷽ تجربة محرّر الأوقاف الرقميّة

مرحباً بك في محرّر النصوص البرمجية والتعليمية التابع لمنظومة **وقف تك**. يتيح هذا المحرّر تنسيق النصوص والآيات الكريمة والأحاديث الشريفة بطريقة طبيعية ومباشرة.

---

## ١. الآيات القرآنية الكريمة (﴿ ﴾)
عند كتابة الآيات بين الأقواس المخصصة ﴿﴾، يتم تنسيقها تلقائياً بخط قُرآني مميز ولون أخضر لائق بهيبة النص القرآني:
﴿إِنَّ هَذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ﴾

## ٢. الأحاديث النبوية الشريفة (« »)
تُنسق الأحاديث النبوية الموضوعة بين علامتي التنصيص «» بخط أميري عريض دافئ يناسب النصوص الأكاديمية والشريفة:
«الدِّينُ النَّصِيحَةُ»

---

## ٣. الرموز والمنحوتات الإسلامية المباشرة
يمكنك بنقرة واحدة إدراج الرموز والمنحوتات الإسلامية الأكثر استخداماً:
* اسم الجلالة: ﷲ (ﷻ)
* الصلاة على النبي: ﷺ
* البسملة الكاملة: ﷽
* علامة الحزب القرآني: ۞

---

## ٤. الكتل الهيكلية المتقدمة (HTML-like blocks)
يدعم المحرّر أيضاً كتل الآيات والأحاديث المكتوبة بصيغة وسوم مألوفة، والتي يتم تحويلها تلقائياً إلى كتل منسقة مع إمكانية ذكر المرجع أو التخريج:

<aya ref="سورة البقرة: ٢">الم ۞ ذَلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِلْمُتَّقِينَ</aya>

<hadith grading="متفق عليه">إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى</hadith>
`;

export default function App() {
  const [content, setContent] = useState(DEFAULT_MARKDOWN);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header card */}
      <header className="bg-white border-2 border-zinc-200 rounded p-6 mb-8 text-right shadow-sm" style={{ direction: 'rtl' }}>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-800 mb-2">
          محرر وقف تك الرقمي ۞
        </h1>
        <p className="text-sm md:text-base text-zinc-500">
          نسخة تجريبية تفاعلية لتشغيل المحرّر المستقل (Waqftech Markdown Editor) مع التنسيق الإسلامي التلقائي.
        </p>
      </header>

      {/* Editor & Previewer Section */}
      <main className="space-y-8">
        <div className="bg-white border border-zinc-200 rounded p-4 shadow-sm">
          <MarkdownField
            label="محرر المحتوى النصي والدعوي"
            value={content}
            onChange={setContent}
            placeholder="اكتب هنا بالتفصيل..."
            showPreview={true}
            dir="rtl"
            hint="استخدم شريط الأدوات الإسلامي في الصف الثاني لإدراج علامات التشكيل، والآيات، والأحاديث، والمنحوتات الإسلامية الكلاسيكية مباشرة."
          />
        </div>

        {/* Separator / Output Title */}
        <div className="flex items-center gap-4 text-zinc-400" style={{ direction: 'rtl' }}>
          <div className="h-px bg-zinc-200 flex-1"></div>
          <span className="text-xs font-bold uppercase tracking-wider select-none">المعاينة النهائية الكاملة (Output Display)</span>
          <div className="h-px bg-zinc-200 flex-1"></div>
        </div>

        {/* Live Reader Display */}
        <div className="bg-zinc-50 border-2 border-zinc-200 rounded p-8 text-right shadow-inner" style={{ direction: 'rtl' }}>
          <DefaultMarkdownRenderer className="prose prose-zinc max-w-none text-right">
            {content}
          </DefaultMarkdownRenderer>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="mt-12 text-center text-xs text-zinc-400 border-t border-zinc-200 pt-6">
        <p className="mb-1">
          رخصة وقف الرقمية العامة - الإصدار الأول 1447هـ (WaqfDPL-Isnad 1.0)
        </p>
        <p>
          نُشر بواسطة مساهمي **وقف تك** - صدقة جارية لخدمة الأمة.
        </p>
      </footer>
    </div>
  );
}

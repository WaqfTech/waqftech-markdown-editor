# سجل التغييرات | Changelog

جميع التغييرات الجوهرية على هذا المشروع موثقة في هذا الملف.  
All notable changes to this project are documented in this file.

يتبع هذا السجل مواصفات [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)،  
ويلتزم المشروع بمعيار [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions,  
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] — 2026-06-06

### 🇸🇦 العربية

#### ✨ مضاف
- **قائمة سياقية موجَّهة لأمر `/quran`:** بدلاً من النص التعليمي الثابت ("الـ tooltip")، يظهر الآن عند كتابة `/quran` قائمةٌ سياقية تفاعلية ذات خطوات متعاقبة:
  1. **اختيار الوضع:** ثلاثة خيارات قابلة للنقر — *آية واحدة* / *نطاق آيات* / *سورة كاملة*.
  2. **البحث عن السورة:** بعد اختيار الوضع يظهر بحثٌ حيٌّ للسور (بالاسم العربي، الإنجليزي، أو الرقم).
  3. **إدراج الآية أو النطاق:** بعد اختيار السورة يُوجَّه المستخدم لإدخال الآية أو النطاق المطلوب ثم يُدرج النص تلقائياً.
  - زر "← رجوع" يعيد المستخدم إلى الخطوة السابقة في أي مرحلة.
  - **وضع السورة كاملة** يجلب النص ويُدرجه تلقائياً فور اختيار السورة دون خطوات إضافية.
- **موضعة عائمة تتبع مؤشر الكتابة:** القائمة المنبثقة تتتبع موضع القلم داخل منطقة النص (mirror-div technique) وتظهر أسفله مباشرةً بدلاً من الموضع الثابت أعلى يمين المحرر.

#### 🔧 تغييرات
- **`lucide-react` أصبحت `peerDependency`:** لم تعد مضمَّنة داخل حزمة المكتبة لتجنب مشكلة تعدد نسخ React. يجب على المستخدمين تثبيتها بشكل صريح (انظر قسم التثبيت).

#### 🐛 إصلاحات
- إصلاح بيئة التطوير `example/`: استبدال CDN Tailwind بإضافة Vite الرسمية (`@tailwindcss/vite`) للتخلص من تحذير بيئة الإنتاج.
- تثبيت `@vitejs/plugin-react@6.0.1` بدلاً من `6.0.2` التي احتوت على اعتماد `workspace:*` غير مدعوم في npm.
- إضافة `resolve.dedupe` في إعداد Vite للمثال التجريبي لضمان نسخة واحدة من React وتجنب أخطاء الـ hooks.

---

### 🇬🇧 English

#### ✨ Added
- **Guided multi-step context menu for `/quran`:** Typing `/quran` now opens an interactive, step-by-step context menu instead of the previous static help tooltip:
  1. **Mode picker:** Three clickable options — *Single Ayah* / *Range of Ayahs* / *Full Surah*.
  2. **Surah search:** After picking a mode, a live surah search appears (filter by Arabic name, English name, or number).
  3. **Ayah/range input:** After selecting a surah the user is guided to type the ayah or range; text is fetched and inserted automatically.
  - A "← Back" button returns the user to the previous step at any stage.
  - **Full Surah mode** fetches and inserts the entire surah immediately upon surah selection — no extra steps.
- **Cursor-following dropdown positioning:** The autocomplete popover now floats directly below the caret position inside the textarea (computed via the mirror-div technique), instead of being fixed at the top-right of the editor container.

#### 🔧 Changed
- **`lucide-react` is now a `peerDependency`:** It is no longer bundled inside the package, preventing duplicate React instance errors in consuming apps. Consumers must install it explicitly (see Installation).

#### 🐛 Fixed
- `example/` dev environment: replaced the Tailwind CDN `<script>` tag with the official `@tailwindcss/vite` Vite plugin, eliminating the production-use warning.
- Pinned `@vitejs/plugin-react` to `6.0.1` (the `6.0.2` release contained an unresolvable `workspace:*` dependency that broke `npm install`).
- Added `resolve.dedupe` for `react`, `react-dom`, and `lucide-react` in the example Vite config to prevent React hook errors when using `file:` dependencies.

---

## [1.1.0] — 2026-05-31

### 🇸🇦 العربية

#### ✨ مضاف
- **الإكمال التلقائي بالشرطة المائلة الخلفية `\`:** يفتح قائمة بحث السور القرآنية فور الكتابة. الخطوة الأولى للبحث عن السورة، والثانية لإدخال رقم الآية ثم إدراجها.
- **أوامر الشريطة الأمامية `/quran` و `/surah`:** تدعم الصيغ التالية بشكل مباشر دون مراحل بحث:
  - آية واحدة: `/quran 1:2`
  - نطاق آيات: `/quran 1:1-5`
  - سورة كاملة: `/quran 1` أو `/surah 1`
- **واجهة برمجية `kv-quran`:** Cloudflare Worker مستضافة على `kv-quran.waqf.dev` تُعيد نصوص الآيات والسور من مخزن KV مُحسَّن للأداء.
- **إدراج ذكي (سطر جديد مقابل مضمَّن):** يكتشف الأمر إذا كان المؤشر في بداية سطر جديد فيُدرج كتلة `::ayah{...}` كاملة، وإلا أدرج النص مضمَّناً بالأقواس القرآنية `﴿ ﴾`.

#### 🔧 تغييرات
- تحديث `cf-demo` للاعتماد على حزمة npm الرسمية v1.1.0.

---

### 🇬🇧 English

#### ✨ Added
- **Backslash `\` autocomplete:** Opens a live Surah search the moment you type `\`. Step 1 searches surahs; Step 2 accepts the ayah number and inserts the verse.
- **`/quran` and `/surah` slash commands:** Accept fully-specified references directly without a search step:
  - Single ayah: `/quran 1:2`
  - Ayah range: `/quran 1:1-5`
  - Full surah: `/quran 1` or `/surah 1`
- **`kv-quran` API:** A Cloudflare Worker hosted at `kv-quran.waqf.dev` that serves ayah and surah text from a high-performance KV store.
- **Smart block vs. inline insertion:** Detects whether the cursor is at the start of a new line and inserts a full `::ayah{...}` block; otherwise inserts the verse inline with Quranic brackets `﴿ ﴾`.

#### 🔧 Changed
- Updated `cf-demo` to depend on the published npm package v1.1.0.

---

## [1.0.0] — 2026-05-29

### 🇸🇦 العربية

#### ✨ مضاف — الإصدار الأول
- مكون `<MarkdownField>` مع شريط أدوات ثنائي الصف (تنسيق عام + إسلامي).
- مكون `<DefaultMarkdownRenderer>` للعرض الآمن للمحتوى المحفوظ.
- تحليل ومعالجة أنماط النصوص الإسلامية المضمَّنة تلقائياً:
  - الأقواس القرآنية `﴿ ﴾` → خط أميري أخضر.
  - علامات الحديث `« »` → خط أميري عريض دافئ.
  - الرموز: `ﷺ` `ﷲ` `ﷻ` `﷽` `۞`.
- دعم وسوم الكتل `<aya>` و`<hadith>` مع تحويلها لمكونات Comark.
- التمدد التلقائي للارتفاع مع حدود `minHeight` و`maxHeight`.
- دعم الاتجاهين RTL وLTR.
- متغيرات CSS قابلة للتخصيص (`--font-quran`, `--waqf-color-quran`, إلخ).
- صفحة تجريبية مستضافة على Cloudflare Pages.

---

### 🇬🇧 English

#### ✨ Added — Initial Release
- `<MarkdownField>` component with a two-row toolbar (standard + Islamic formatting).
- `<DefaultMarkdownRenderer>` for safe, styled rendering of saved markdown.
- Automatic inline Islamic text pattern processing:
  - Quranic brackets `﴿ ﴾` → green Amiri Quran font.
  - Hadith quotes `« »` → bold warm Amiri font.
  - Ligatures: `ﷺ` `ﷲ` `ﷻ` `﷽` `۞`.
- `<aya>` and `<hadith>` block tag support with Comark component rendering.
- Auto-expanding height with `minHeight` / `maxHeight` bounds.
- RTL and LTR direction support.
- Customisable CSS variables (`--font-quran`, `--waqf-color-quran`, etc.).
- Live demo hosted on Cloudflare Pages.

---

[1.2.0]: https://github.com/jadmadi/waqftech-packages/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/jadmadi/waqftech-packages/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jadmadi/waqftech-packages/releases/tag/v1.0.0

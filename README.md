# محرر وقف تك للنصوص الإسلامية | WaqfTech Islamic Text Editor

[![npm version](https://img.shields.io/npm/v/@waqftech/markdown-editor.svg)](https://www.npmjs.com/package/@waqftech/markdown-editor)
[![License](https://img.shields.io/badge/License-WaqfDPL--Isnad--1.0-emerald.svg)](WaqfDPL-1.0.md)

---

## 🇸🇦 العربية (Arabic)

محرر نصوص ماركداون (Markdown) خفيف، سريع الأداء، ومصمم خصيصاً للبيئات التعليمية والبحثية الإسلامية. يتميز بدعم مدمج و**تنسيق تلقائي فريد للنصوص والخطوط الإسلامية** (مثل الأقواس القرآنية، علامات التنصيص للحديث النبوي، والرموز والمنحوتات الكلاسيكية).

تم تطوير هذا المحرر كجزء من منظومة **وقف تك** لخدمة المحتوى الإسلامي والتعليمي الرقمي، مما يتيح للكتّاب والباحثين صياغة محتواهم بشكل مريح وبدون الحاجة لتعلم أكواد برمجية معقدة.

---

### 📜 الوقف والترخيص

هذا العمل هو **وَقْفٌ لله تعالى** لخدمة الأمة ونشر النفع العام، وهو خاضع لشروط **رُخصة وَقْف الرَّقْمِيَّة العامَّة - المستوى الأول: وَقْفٌ بالإِسْنَادِ (WaqfDPL-Isnad 1.0)**.

* **يُسمح ويُرخص** استخدام هذا العمل، ونسخه، وتعديله، وتوزيعه، وإعادة ترخيصه، واستخدامه تجارياً أو خيرياً بلا قيود.
* **الشرط الوحيد** هو الحفاظ على نسبة العمل إلى مساهمي "وقف تك" الأصليين، وإدراج نسخة من ملف الرخصة (`WaqfDPL-1.0.md`) في أي نسخ أو أعمال مشتقة.

---

### ✨ المميزات الرئيسية

1. **شريط أدوات ثنائي الصف:**
   * **الصف الأول (أدوات عامة):** التنسيقات القياسية للماركداون (عناوين H2–H4، خط عريض، مائل، قوائم مرقمة ونقطية، اقتباسات، روابط، وفواصل) باستخدام أيقونات Lucide الخفيفة.
   * **الصف الثاني (تنسيق إسلامي):** واجهة عربية واضحة مخصصة لإدراج الأقواس والرموز مباشرة بضغطة زر واحدة.
2. **التنسيق التلقائي للأقواس والكُتل:**
   * كتابة النصوص بين أقواس **`﴿ ﴾`** تحولها تلقائياً إلى نص قرآني منسق بخط الرسم العثماني ولون أخضر لائق.
   * كتابة النصوص بين علامات **`« »`** تحولها تلقائياً إلى نصوص أحاديث نبوية بخط أميري عريض دافئ.
   * تحويل وسوم الكتل التلقائي: يحول الكتل المكتوبة بصيغة الوسوم المألوفة `<aya ref="...">` و `<hadith grading="...">` إلى مكونات هيكلية جميلة مع عرض المراجع والتخريج بشكل لائق.
3. **الرموز والمنحوتات الإسلامية المباشرة:**
   * **`ﷺ`** — صلى الله عليه وسلم
   * **`ﷲ`** — جل جلاله (لفظ الجلالة)
   * **`ﷻ`** — جلت قدرته
   * **`﷽`** — البسملة الكاملة
   * **`۞`** — علامة الحزب القرآني
4. **المعاينة الفورية المدمجة:**
   * يتضمن مكون عرض مدمج وآمن (`DefaultMarkdownRenderer`) يعتمد على مكتبة `comark` الفائقة السرعة.
   * يتنقل بسلاسة بين وضعي "التحرير" (تحرير) و"المعاينة" (معاينة) داخل نفس المكون.
5. **تعديل تلقائي مرن للارتفاع (Auto-expanding):**
   * يتمدد صندوق النص تلقائياً مع طول المحتوى لتوفير تجربة كتابة سلسة ومريحة، مع إمكانية تحديد الحد الأدنى والأقصى للارتفاع.

---

### 🎮 تشغيل المثال التفاعلي (Playground)

يحتوي المستودع على بيئة تجريبية تفاعلية مستقلة مبنية باستخدام Vite. يمكنك تشغيلها محلياً لمشاهدة المحرر قيد العمل فوراً:

```bash
# انتقل إلى مجلد المثال التجريبي
cd example

# قم بتثبيت الحزم (يفضل استخدام aube ويُدعم pnpm كذلك)
aube install
# أو: pnpm install

# ابدأ خادم التطوير المحلي
aube run dev
# أو: pnpm dev
```

افتح الرابط `http://localhost:3001` في متصفحك لتجربة المحرر ومشاهدة تنسيق النصوص والخطوط الإسلامية مباشرة!

---

### 🚀 التثبيت

قم بتثبيت المكتبة مع الحزم الصديقة (peer dependencies) عبر مدير الحزم الخاص بك:

```bash
# باستخدام aube (موصى به)
aube add @waqftech/markdown-editor comark @comark/react lucide-react

# باستخدام pnpm
pnpm add @waqftech/markdown-editor comark @comark/react lucide-react
```

---

### 💻 دليل التكامل والبرمجة

#### 1. الاستخدام الأساسي في النماذج (حقل الإدخال)

استورد مكون `<MarkdownField>` والأنماط المصاحبة له في تطبيق React/TypeScript الخاص بك:

```tsx
import React, { useState } from 'react';
import { MarkdownField } from '@waqftech/markdown-editor';

// استيراد ملف الأنماط الخاص بالمحرر والخطوط الإسلامية
import '@waqftech/markdown-editor/styles.css';

export default function CourseContentEditor() {
  const [content, setContent] = useState('اكتب هنا... ﷽ وبشر المشاهدين.');

  return (
    <div className="max-w-4xl mx-auto p-6" style={{ direction: 'rtl' }}>
      <MarkdownField
        label="محتوى الدرس النصي والتعليمي"
        value={content}
        onChange={setContent}
        placeholder="اكتب هنا بالتفصيل واستخدم شريط الأدوات..."
        showPreview={true}
        autoExpand={true}
        minHeight={150}
        maxHeight={700}
        dir="rtl"
      />
    </div>
  );
}
```

#### 2. عرض المخرجات للمستخدم (القارئ)

لعرض محتوى الماركداون المحفوظ للطلاب أو المتصفحين بنفس جودة الخطوط والتنسيقات الإسلامية:

```tsx
import React from 'react';
import { DefaultMarkdownRenderer } from '@waqftech/markdown-editor';
import '@waqftech/markdown-editor/styles.css';

interface LessonViewerProps {
  markdownContent: string;
}

export function LessonViewer({ markdownContent }: LessonViewerProps) {
  return (
    <div className="prose prose-zinc max-w-none text-right" style={{ direction: 'rtl' }}>
      {/* المعاينة آمنة، سريعة ومصممة بأعلى معايير الخطوط الكلاسيكية */}
      <DefaultMarkdownRenderer>
        {markdownContent}
      </DefaultMarkdownRenderer>
    </div>
  );
}
```

---

### 🎨 تخصيص الأنماط والألوان

يمكنك بسهولة تعديل الخطوط، الألوان، وسمك الحدود بما يتناسب مع هويتك البصرية عبر إعادة تعريف متغيرات CSS (CSS Variables) في ملف الأنماط العام للتطبيق:

```css
:root {
  /* عائلات الخطوط المستخدمة */
  --font-quran: "Amiri Quran", "Amiri", serif;
  --font-amiri: "Amiri", serif;

  /* درجات الألوان الإسلامية */
  --waqf-color-quran: #065f46;  /* لون أخضر زمردي للآيات الكريمة ﴿﴾ */
  --waqf-color-hadith: #92400e; /* لون عسلي دافئ للأحاديث الشريفة «» */
  --waqf-color-symbol: #d97706; /* لون ذهبي دافئ للمنحوتات الإسلامية ﷽، ﷺ */
}
```

*تنبيه: لتجربة بصرية مثالية، ننصح بشدة بتحميل خطوط أميري عالية الجودة مثل [Amiri](https://fonts.google.com/specimen/Amiri) أو خط "Amiri Quran" في ملف `index.html` أو مستندات العرض الرئيسية للتطبيق.*

<br />
<br />

---
---

<br />
<br />

## 🇬🇧 English

A lightweight, high-performance, and beautiful React Markdown Editor featuring out-of-the-box **natural Arabic Islamic typography** (automatic Ayah brackets, Hadith quotation rendering, and styled calligraphic symbols). 

Developed as part of the Waqf Tech ecosystem, this editor provides a clean, two-row toolbar designed specifically for content authors, teachers, and developers building modern Islamic, scholarly, and educational platforms.

---

### 📜 Waqf & License

This software is dedicated as **Waqf (endowment) for the sake of Allah** to benefit the community and is licensed under the **Waqf Digital Public License - Level 1: Waqf by Attribution (WaqfDPL-Isnad 1.0)**. 

* **Permission is granted** to use, copy, modify, distribute, sublicense, and even use this work in commercial environments.
* **The sole condition** is maintaining clear attribution to the original WaqfTech contributors and including a copy of the license (`WaqfDPL-1.0.md`) in your distributions.

---

### ✨ Key Features

1. **Two-Row Modular Toolbar:**
   * **Row 1 (Standard controls):** Standard markdown formatting (Headings H2–H4, Bold, Italic, Bulleted and Numbered lists, Quote, Link, and Dividers) with lightweight Lucide icons.
   * **Row 2 (Islamic Typography & Symbols):** Labeled with literal Arabic brackets and symbols for absolute clarity. No confusing markdown component codes required.
2. **Natural Bracket Auto-formatting:**
   * Wrapping text in **`﴿ ﴾`** renders it as a gorgeous, styled Quranic Verse inline span in Amiri Quran font.
   * Wrapping text in **`« »`** renders it as a styled Hadith text inline span in bold Amiri serif.
   * Automatic Block Tag conversion: Translates `<aya ref="...">` and `<hadith grading="...">` blocks into semantic structural layouts with custom citation rendering.
3. **One-Click Classical Ligatures & Symbols:**
   * **`ﷺ`** — Sallallahu alayhi wa sallam (Peace be upon him)
   * **`ﷲ`** — Allah ligature
   * **`ﷻ`** — Jalla Jalaluh
   * **`﷽`** — Bismillah
   * **`۞`** — Rub el Hizb
4. **Real-Time Preview Out-of-the-Box:**
   * Comes with an integrated, lightweight `DefaultMarkdownRenderer` utilizing the lightning-fast `comark` parsing library.
   * Seamlessly toggles between "Edit" (تحرير) and "Preview" (معاينة) states inside the same component.
5. **Auto-Expanding Height:**
   * Dynamically adjusts input height to fit contents as you type, keeping the interface fluid, with customizable height limits (`minHeight` and `maxHeight`).

---

### 🎮 Runnable Example (Playground)

This repository includes a completely self-contained interactive playground powered by Vite. You can run it locally to see the editor in action immediately:

```bash
# Navigate to the example directory
cd example

# Install dependencies (aube is preferred; pnpm is also supported)
aube install
# or: pnpm install

# Start the local development server
aube run dev
# or: pnpm dev
```

Open `http://localhost:3001` in your browser to try out the editor and see real-time Arabic typesetting in action!

---

### 🚀 Installation

Install the package and its peer dependencies via your favorite package manager:

```bash
# Using aube (preferred)
aube add @waqftech/markdown-editor comark @comark/react lucide-react

# Using pnpm
pnpm add @waqftech/markdown-editor comark @comark/react lucide-react
```

---

### 💻 Integration Guide

#### 1. Basic Usage in Forms (The Input)

Import the `<MarkdownField>` component and its styles into your React/TypeScript application:

```tsx
import React, { useState } from 'react';
import { MarkdownField } from '@waqftech/markdown-editor';

// Import editor & custom typography styles
import '@waqftech/markdown-editor/styles.css';

export default function CourseContentEditor() {
  const [content, setContent] = useState('اكتب هنا... ﷽ وبشر المشاهدين.');

  return (
    <div className="max-w-4xl mx-auto p-6" style={{ direction: 'rtl' }}>
      <MarkdownField
        label="Lesson Content"
        value={content}
        onChange={setContent}
        placeholder="Write lesson content here..."
        showPreview={true}
        autoExpand={true}
        minHeight={150}
        maxHeight={700}
        dir="rtl"
      />
    </div>
  );
}
```

#### 2. Rendering the Output (The Reader)

To render the saved markdown content elsewhere in your student-facing app with identical Islamic typography styling:

```tsx
import React from 'react';
import { DefaultMarkdownRenderer } from '@waqftech/markdown-editor';
import '@waqftech/markdown-editor/styles.css';

interface LessonViewerProps {
  markdownContent: string;
}

export function LessonViewer({ markdownContent }: LessonViewerProps) {
  return (
    <div className="prose prose-zinc max-w-none text-right" style={{ direction: 'rtl' }}>
      {/* Output is parsed, secure, and beautiful */}
      <DefaultMarkdownRenderer>
        {markdownContent}
      </DefaultMarkdownRenderer>
    </div>
  );
}
```

---

### 🎨 Customizing Styles

You can easily customize the typography, color themes, and font-families by overriding the CSS variables in your global stylesheet:

```css
:root {
  /* Font Families */
  --font-quran: "Amiri Quran", "Amiri", serif;
  --font-amiri: "Amiri", serif;

  /* Theme Colors */
  --waqf-color-quran: #065f46;  /* Custom emerald green for verses ﴿﴾ */
  --waqf-color-hadith: #92400e; /* Custom deep amber/brown for hadiths «» */
  --waqf-color-symbol: #d97706; /* Custom gold for ligatures like ﷽, ﷺ */
}
```

*Note: For the best visual experience, it is highly recommended to load a high-quality Arabic serif font such as [Amiri](https://fonts.google.com/specimen/Amiri) or "Amiri Quran" in your `index.html` or document headers.*

---

### 🛡️ Credits & Third-Party Licenses

This editor stands on the shoulders of giants. We are deeply grateful to and explicitly acknowledge the licenses of the following open-source dependencies used under the hood:

* **`comark`** & **`@comark/react`** (Published under the **MIT License**): The core high-performance Markdown parser and rendering ecosystem.
* **`lucide-react`** (Published under the **ISC License**): Provides our lightweight vector icons for standard toolbar controls.
* **`React`** (Published under the **MIT License**): Built natively for React 18+ components.

All third-party libraries utilized are fully permissive and legally compatible with the **WaqfDPL-Isnad-1.0** license of this editor.

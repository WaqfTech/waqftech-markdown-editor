# waqftech-markdown-editor

A lightweight, high-performance, and beautiful React Markdown Editor featuring out-of-the-box **natural Arabic Islamic typography** (automatic Ayah brackets, Hadith quotation rendering, and styled calligraphic symbols). 

Developed as part of the Waqf Tech ecosystem, this editor provides a clean, two-row toolbar designed specifically for content authors, teachers, and developers building modern Islamic, scholarly, and educational platforms.

---

## 📜 الوقف والترخيص (Waqf & License)

هذا العمل هو **وَقْفٌ لله تعالى** لخدمة المجتمع ونشر النفع العام، وهو خاضع لشروط **رُخصة وَقْف الرَّقْمِيَّة العامَّة - المستوى الأول: وَقْفٌ بالإِسْنَادِ (WaqfDPL-Isnad 1.0)**.

This software is dedicated as **Waqf (endowment) for the sake of Allah** to benefit the community and is licensed under the **Waqf Digital Public License - Level 1: Waqf by Attribution (WaqfDPL-Isnad 1.0)**. 

* **Permission is granted** to use, copy, modify, distribute, sublicense, and even use this work in commercial environments.
* **The sole condition** is maintaining clear attribution to the original WaqfTech contributors and including a copy of the license (`WaqfDPL-1.0.md`) in your distributions.

---

## ✨ Features (المميزات)

1. **Two-Row Modular Toolbar:**
   * **Row 1 (Standard controls):** Standard markdown formatting (Headings H2–H4, Bold, Italic, Bulleted and Numbered lists, Quote, Link, and Dividers) with lightweight Lucide icons.
   * **Row 2 (Islamic Typography & Symbols):** Labeled with literal Arabic brackets and symbols for absolute clarity. No confusing markdown component codes required.
2. **Natural Bracket Auto-formatting:**
   * Wrapping text in **`﴿ ﴾`** renders it as a gorgeous, styled Quranic Verse inline span.
   * Wrapping text in **`« »`** renders it as a styled Hadith text inline span.
3. **One-Click Classical Ligatures & Symbols:**
   * **`ﷺ`** — صلى الله عليه وسلم (Sallallahu alayhi wa sallam)
   * **`ﷲ`** — الله (Allah ligature)
   * **`ﷻ`** — جل جلاله (Jalla Jalaluh)
   * **`﷽`** — بسم الله الرحمن الرحيم (Bismillah)
   * **`۞`** — ربع الحزب (Rub el Hizb)
4. **Real-Time Preview Out-of-the-Box:**
   * Comes with an integrated, lightweight `DefaultMarkdownRenderer` utilizing the lightning-fast `comark` parsing library.
   * Seamlessly toggles between "Edit" (تحرير) and "Preview" (معاينة) states inside the same component.

---

## 🎮 Runnable Example

This repository includes a completely self-contained interactive playground powered by Vite. You can run it locally to see the editor in action immediately:

```bash
# Navigate to the example directory
cd waqftech-markdown-editor/example

# Install dependencies
aube install # or pnpm install / npm install

# Start the local development server
aubr dev # or pnpm dev / npm run dev
```

Open `http://localhost:3001` in your browser to try out the editor and see real-time Arabic typesetting in action!

---

## 🚀 Installation

Install the package and its peer dependencies via your favorite package manager:

```bash
# Using npm
npm install waqftech-markdown-editor comark @comark/react lucide-react

# Using pnpm
pnpm add waqftech-markdown-editor comark @comark/react lucide-react

# Using yarn
yarn add waqftech-markdown-editor comark @comark/react lucide-react
```

---

## 💻 Integration Guide

### 1. Basic Usage

Import the `<MarkdownField>` component and its styles into your React/TypeScript application:

```tsx
import React, { useState } from 'react';
import { MarkdownField } from 'waqftech-markdown-editor';

// Import editor & custom typography styles
import 'waqftech-markdown-editor/styles.css';

export default function CourseContentEditor() {
  const [content, setContent] = useState('اكتب هنا... ﷽ وبشر المشاهدين.');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <MarkdownField
        label="محتوى الدرس النصي"
        value={content}
        onChange={setContent}
        placeholder="اكتب محتوى الدرس بالتفصيل..."
        showPreview={true}
        dir="rtl"
      />
    </div>
  );
}
```

### 2. Rendering the Output

To render the saved markdown content elsewhere in your student-facing app with identical Islamic typography styling:

```tsx
import React from 'react';
import { DefaultMarkdownRenderer } from 'waqftech-markdown-editor';
import 'waqftech-markdown-editor/styles.css';

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

## 🎨 Customizing Styles

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

## 🛡️ Credits & Third-Party Licenses

This editor stands on the shoulders of giants. We are deeply grateful to and explicitly acknowledge the licenses of the following open-source dependencies used under the hood:

* **`comark`** & **`@comark/react`** (Published under the **MIT License**): The core high-performance Markdown parser and rendering ecosystem.
* **`lucide-react`** (Published under the **ISC License**): Provides our lightweight vector icons for standard toolbar controls.
* **`React`** (Published under the **MIT License**): Built natively for React 18+ components.

All third-party libraries utilized are fully permissive and legally compatible with the **WaqfDPL-Isnad-1.0** license of this editor.

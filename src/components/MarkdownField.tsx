import React, { useRef, useState } from 'react';
import { ComarkClient } from '@comark/react';
import security from '@comark/react/plugins/security';
import breaks from '@comark/react/plugins/breaks';
import { BookOpen, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { MarkdownToolbar, applyMarkdownAction } from './MarkdownToolbar.js';
import { inlineIslamicText } from '../plugins/inlineIslamicText.js';
import { SURAH_LIST } from '../utils/surahData.js';

// Helper to parse the query of backslash command
const parseQuery = (q: string) => {
  const pattern1 = q.match(/^(\d+)(?:[:/](\d*))?$/);
  if (pattern1) {
    const surahNum = parseInt(pattern1[1], 10);
    const ayahStr = pattern1[2] || '';
    const surah = SURAH_LIST.find(s => s.number === surahNum);
    return { surah, ayahStr };
  }

  const pattern2 = q.match(/^([^\d\s:/]+)(?:[:/](\d*))?$/);
  if (pattern2) {
    const surahName = pattern2[1].trim();
    const ayahStr = pattern2[2] || '';
    const surah = SURAH_LIST.find(
      s =>
        s.name.includes(surahName) ||
        s.englishName.toLowerCase().includes(surahName.toLowerCase()) ||
        s.englishNameTranslation.toLowerCase().includes(surahName.toLowerCase())
    );
    return { surah, ayahStr };
  }

  return { surah: null, ayahStr: '' };
};

// ── Block directive components for Comark AST ───────────────────────────────
// Comark parses ::ayah{reference="..."} ... :: into an AST node tagged 'ayah'.
// Without a registered component it falls back to a raw <ayah> HTML tag,
// which React warns about. These components provide proper rendering.

const AyahBlock = ({ reference, children }: { reference?: string; children?: React.ReactNode }) => (
  <div className="quran-verse my-4 p-4 border-r-4 border-emerald-700 bg-emerald-50/40 rounded">
    <div className="leading-loose">{children}</div>
    {reference && (
      <div className="mt-2 text-sm text-emerald-700/80 font-medium">
        — {reference}
      </div>
    )}
  </div>
);

const HadithBlock = ({ grading, children }: { grading?: string; children?: React.ReactNode }) => (
  <div className="hadith-inline my-4 p-4 border-r-4 border-amber-700 bg-amber-50/30 rounded">
    <div className="leading-relaxed">{children}</div>
    {grading && (
      <div className="mt-2 text-sm text-amber-700/80 font-medium">
        — {grading}
      </div>
    )}
  </div>
);

// A lightweight, secure client-safe Comark markdown renderer.
// Uses ComarkClient (not the async Server Component Comark) to stay compatible
// with client-side React 19 where async components are forbidden.
export const DefaultMarkdownRenderer = (props: React.ComponentProps<typeof ComarkClient>) => (
  <ComarkClient
    {...props}
    plugins={[
      security({ blockedTags: ['script', 'iframe'] }),
      breaks(),
      inlineIslamicText(),
    ]}
    components={{
      ayah: AyahBlock,
      hadith: HadithBlock,
      ...(props.components || {}),
    }}
  />
);

export const MarkdownField = ({
  label,
  value,
  onChange,
  placeholder,
  className = '',
  dir = 'rtl',
  hint,
  error,
  showPreview = false,
  customRenderer: CustomRenderer,
  minHeight = 120,
  maxHeight = 600,
  autoExpand = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  dir?: 'rtl' | 'ltr';
  hint?: string;
  error?: boolean | string;
  showPreview?: boolean;
  customRenderer?: React.ComponentType<{ children: string; className?: string }>;
  minHeight?: string | number;
  maxHeight?: string | number;
  autoExpand?: boolean;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    query: string;
    startIndex: number;
    endIndex: number;
    selectedIndex: number;
    isLoading: boolean;
    errorMessage: string;
  }>({
    isOpen: false,
    query: '',
    startIndex: -1,
    endIndex: -1,
    selectedIndex: 0,
    isLoading: false,
    errorMessage: '',
  });

  const parsed = parseQuery(menuState.query);
  const isStep2 = parsed.surah && (menuState.query.includes(':') || menuState.query.includes('/'));

  const filteredSurahs = isStep2
    ? []
    : SURAH_LIST.filter(s => {
        const q = menuState.query.toLowerCase();
        return (
          s.number.toString().startsWith(q) ||
          s.name.includes(q) ||
          s.englishName.toLowerCase().includes(q) ||
          s.englishNameTranslation.toLowerCase().includes(q)
        );
      }).slice(0, 5);

  const getFilteredOptionsCount = () => {
    if (isStep2) {
      const ayahStr = parsed.ayahStr;
      const ayahNum = parseInt(ayahStr, 10);
      if (ayahNum >= 1 && ayahNum <= (parsed.surah?.numberOfAyahs || 0)) {
        return 1;
      }
      return 0;
    }
    return filteredSurahs.length;
  };

  const fetchAndInsertAyah = async (surah: any, ayahNum: number) => {
    setMenuState(prev => ({ ...prev, isLoading: true, errorMessage: '' }));
    try {
      const res = await fetch(`https://kv-quran.waqf.dev/api/ayah/${surah.number}/${ayahNum}`);
      if (!res.ok) {
        throw new Error('فشل جلب الآية من الخادم.');
      }
      const data = await res.json();
      const ayahText = data.text;

      // Determine block vs inline formatting
      const textBefore = value.slice(0, menuState.startIndex);
      const lineStart = textBefore.lastIndexOf('\n') + 1;
      const textOnLineBefore = textBefore.slice(lineStart);
      const isNewLine = textOnLineBefore.trim() === '';

      let replacement = '';
      if (isNewLine) {
        replacement = `::ayah{reference="سورة ${surah.name}: ${ayahNum}"}\n${ayahText}\n::\n`;
      } else {
        replacement = `﴿${ayahText}﴾ (سورة ${surah.name}: ${ayahNum})`;
      }

      const nextValue = value.slice(0, menuState.startIndex) + replacement + value.slice(menuState.endIndex);
      onChange(nextValue);

      const nextCursor = menuState.startIndex + replacement.length;
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(nextCursor, nextCursor);
        }
      });

      setMenuState(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (err: any) {
      setMenuState(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: err.message || 'حدث خطأ غير متوقع.',
      }));
    }
  };

  const handleSelectOption = (indexOverride?: number) => {
    const idx = indexOverride !== undefined ? indexOverride : menuState.selectedIndex;

    if (isStep2) {
      const { surah, ayahStr } = parsed;
      if (surah && ayahStr) {
        const ayahNum = parseInt(ayahStr, 10);
        if (ayahNum >= 1 && ayahNum <= surah.numberOfAyahs) {
          fetchAndInsertAyah(surah, ayahNum);
        }
      }
    } else {
      const surah = filteredSurahs[idx];
      if (surah) {
        const replacement = `${surah.number}:`;
        const nextValue = value.slice(0, menuState.startIndex + 1) + replacement + value.slice(menuState.endIndex);
        onChange(nextValue);

        const nextCursor = menuState.startIndex + 1 + replacement.length;
        setMenuState(prev => ({
          ...prev,
          query: replacement,
          endIndex: nextCursor,
          selectedIndex: 0,
        }));

        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(nextCursor, nextCursor);
          }
        });
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const textBeforeCursor = text.slice(0, cursor);
    const lastBackslashIndex = textBeforeCursor.lastIndexOf('\\');

    if (lastBackslashIndex !== -1) {
      const query = textBeforeCursor.slice(lastBackslashIndex + 1);
      const charBeforeBackslash = lastBackslashIndex > 0 ? textBeforeCursor[lastBackslashIndex - 1] : '';
      const isValidTrigger = lastBackslashIndex === 0 || /\s/.test(charBeforeBackslash);

      if (isValidTrigger && !query.includes('\n')) {
        setMenuState(prev => ({
          ...prev,
          isOpen: true,
          query,
          startIndex: lastBackslashIndex,
          endIndex: cursor,
          selectedIndex: prev.query.includes(':') !== query.includes(':') ? 0 : prev.selectedIndex,
        }));
        return;
      }
    }

    setMenuState(prev => ({ ...prev, isOpen: false, query: '', startIndex: -1, endIndex: -1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!menuState.isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setMenuState(prev => ({ ...prev, isOpen: false }));
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const count = getFilteredOptionsCount();
      if (count > 0) {
        setMenuState(prev => ({
          ...prev,
          selectedIndex: prev.selectedIndex < count - 1 ? prev.selectedIndex + 1 : 0,
        }));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const count = getFilteredOptionsCount();
      if (count > 0) {
        setMenuState(prev => ({
          ...prev,
          selectedIndex: prev.selectedIndex > 0 ? prev.selectedIndex - 1 : count - 1,
        }));
      }
      return;
    }

    if (e.key === 'Enter') {
      const count = getFilteredOptionsCount();
      if (count > 0 || isStep2) {
        e.preventDefault();
        handleSelectOption();
      }
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setMenuState(prev => ({ ...prev, isOpen: false }));
    }, 200);
  };

  // Automatically adjust textarea height based on content length
  React.useEffect(() => {
    if (!autoExpand || previewMode) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value, autoExpand, previewMode]);

  const handleToolbarAction = (action: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const nextEdit = applyMarkdownAction(value, textarea.selectionStart, textarea.selectionEnd, action);
    onChange(nextEdit.value);

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextEdit.selectionStart, nextEdit.selectionEnd);
    });
  };

  const Renderer = CustomRenderer || DefaultMarkdownRenderer;

  const minHeightStyle = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  const maxHeightStyle = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  return (
    <div className="flex flex-col space-y-2 text-right" style={{ direction: dir }}>
      {/* Label and Mode Toggles */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-zinc-700 select-none">
          {label}
        </label>
        {showPreview && (
          <div className="flex items-center gap-1 border border-zinc-200 rounded p-0.5 bg-zinc-50/50">
            <button
              type="button"
              className={`h-7 px-3 rounded text-xs font-bold transition-all focus:outline-none ${
                !previewMode
                  ? 'bg-white text-zinc-800 shadow-sm border border-zinc-200/40'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              onClick={() => setPreviewMode(false)}
            >
              تحرير
            </button>
            <button
              type="button"
              className={`h-7 px-3 rounded text-xs font-bold transition-all focus:outline-none ${
                previewMode
                  ? 'bg-white text-zinc-800 shadow-sm border border-zinc-200/40'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              onClick={() => setPreviewMode(true)}
            >
              معاينة
            </button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div
        className={`relative overflow-hidden rounded border-2 bg-white transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 ${
          error ? 'border-red-500' : 'border-zinc-200'
        }`}
      >
        <MarkdownToolbar onAction={handleToolbarAction} />

        {/* Autocomplete Dropdown Popover */}
        {menuState.isOpen && (
          <div
            className="absolute top-12 right-4 w-80 max-h-72 overflow-y-auto bg-white border border-emerald-100 shadow-xl rounded-lg z-50 p-2 flex flex-col space-y-1 select-none text-right"
            style={{ direction: 'rtl' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5 mb-1 px-1">
              <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                {menuState.isLoading ? (
                  <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
                )}
                {isStep2 ? 'إدراج آية قرآنية - خطوة ٢' : 'إدراج آية قرآنية - خطوة ١'}
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                {isStep2 ? 'رقم الآية' : 'اختر السورة'}
              </span>
            </div>

            {/* Error Message */}
            {menuState.errorMessage && (
              <div className="flex items-start gap-1 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{menuState.errorMessage}</span>
              </div>
            )}

            {/* Step 2 Content */}
            {isStep2 && parsed.surah && (
              <div className="flex flex-col space-y-1.5 p-1">
                <div className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 bg-zinc-50 p-2 rounded justify-start">
                  <BookOpen className="size-4 text-emerald-600 shrink-0" />
                  <span>سورة {parsed.surah.name} ({parsed.surah.numberOfAyahs} آية)</span>
                </div>
                {parsed.ayahStr ? (
                  parseInt(parsed.ayahStr, 10) >= 1 && parseInt(parsed.ayahStr, 10) <= parsed.surah.numberOfAyahs ? (
                    <button
                      type="button"
                      onClick={() => handleSelectOption(0)}
                      className={`w-full text-right px-3 py-2 text-xs rounded-md border font-semibold transition-all ${
                        menuState.selectedIndex === 0
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 border-r-4 shadow-sm'
                          : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      ✨ إدراج الآية {parsed.ayahStr} من سورة {parsed.surah.name} (Enter)
                    </button>
                  ) : (
                    <div className="text-xs text-red-500 font-semibold p-2 bg-red-50/50 rounded flex items-center gap-1 justify-start">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      <span>رقم الآية غير صحيح (الحد الأقصى {parsed.surah.numberOfAyahs})</span>
                    </div>
                  )
                ) : (
                  <div className="text-xs text-zinc-500 font-medium p-2 text-center animate-pulse">
                    أدخل رقم الآية (1 - {parsed.surah.numberOfAyahs}) ثم اضغط Enter
                  </div>
                )}
              </div>
            )}

            {/* Step 1 Content */}
            {!isStep2 && (
              <div className="flex flex-col space-y-0.5 max-h-56 overflow-y-auto">
                {filteredSurahs.length > 0 ? (
                  filteredSurahs.map((surah, idx) => (
                    <button
                      key={surah.number}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-right px-3 py-2 text-xs rounded-md border transition-all flex items-center justify-between font-semibold ${
                        menuState.selectedIndex === idx
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 border-r-4 shadow-sm'
                          : 'bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-100 text-zinc-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-400 font-bold select-none w-5 text-center">
                          {surah.number}
                        </span>
                        <span className="font-bold">{surah.name}</span>
                        <span className="text-zinc-400 text-[10px] font-normal">
                          ({surah.englishName})
                        </span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {surah.numberOfAyahs} آية
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-zinc-400 p-3 text-center">
                    لا توجد سورة تطابق البحث
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {previewMode ? (
          <div className={`p-4 min-h-[200px] overflow-y-auto bg-zinc-50/30 prose prose-zinc max-w-none text-right ${className}`}>
            <Renderer className="prose prose-sm max-w-none">
              {value || placeholder}
            </Renderer>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full p-4 border-0 bg-transparent text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-0 leading-8 text-right ${
              autoExpand ? 'resize-none' : 'resize-y'
            } ${className}`}
            style={{
              minHeight: minHeightStyle,
              maxHeight: maxHeightStyle,
            }}
            dir={dir}
            lang="ar"
          />
        )}
      </div>

      {/* Hint or Error Footer Message */}
      {error && typeof error === 'string' && (
        <p className="text-xs text-red-500 font-medium select-none">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-zinc-400 leading-normal select-none">{hint}</p>
      )}
    </div>
  );
};

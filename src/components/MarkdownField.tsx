import React, { useRef, useState } from 'react';
import { ComarkClient } from '@comark/react';
import security from '@comark/react/plugins/security';
import breaks from '@comark/react/plugins/breaks';
import { BookOpen, Sparkles, AlertTriangle, Loader2, ChevronRight, Hash, ListOrdered, BookMarked } from 'lucide-react';
import { MarkdownToolbar, applyMarkdownAction } from './MarkdownToolbar.js';
import { inlineIslamicText } from '../plugins/inlineIslamicText.js';
import { SURAH_LIST, type SurahMetadata } from '../utils/surahData.js';

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

// Helper to parse explicit slash commands (/quran, /surah)
const parseCommand = (q: string) => {
  const clean = q.replace(/^(quran|surah|قرآن|سورة)\s+/i, '').trim();

  // Pattern A: range (e.g. "1:1-5" or "1/1-5")
  const rangeMatch = clean.match(/^(\d+)[:/](\d+)-(\d+)$/);
  if (rangeMatch) {
    const surahNum = parseInt(rangeMatch[1], 10);
    const startAyah = parseInt(rangeMatch[2], 10);
    const endAyah = parseInt(rangeMatch[3], 10);
    const surah = SURAH_LIST.find(s => s.number === surahNum);
    return { type: 'range' as const, surah, startAyah, endAyah };
  }

  // Pattern B: single ayah (e.g. "1:2" or "1/2")
  const singleMatch = clean.match(/^(\d+)[:/](\d+)$/);
  if (singleMatch) {
    const surahNum = parseInt(singleMatch[1], 10);
    const ayahNum = parseInt(singleMatch[2], 10);
    const surah = SURAH_LIST.find(s => s.number === surahNum);
    return { type: 'single' as const, surah, ayahNum };
  }

  // Pattern C: full surah (e.g. "1")
  const fullMatch = clean.match(/^(\d+)$/);
  if (fullMatch) {
    const surahNum = parseInt(fullMatch[1], 10);
    const surah = SURAH_LIST.find(s => s.number === surahNum);
    return { type: 'full' as const, surah };
  }

  return { type: 'none' as const, surah: null };
};

// ── Caret coordinate helper ────────────────────────────────────────────────
// Uses the mirror-div technique to compute the pixel coordinates of the caret
// inside a textarea, relative to a positioned container element.
// Works correctly for both LTR and RTL text.
const computeCaretCoords = (
  textarea: HTMLTextAreaElement,
  caretPos: number,
  container: HTMLElement
): { top: number; right: number } => {
  const cs = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');

  const copyProps = [
    'font', 'letterSpacing', 'lineHeight',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing', 'direction', 'textAlign', 'wordBreak', 'overflowWrap',
  ] as const;
  copyProps.forEach(p => {
    (mirror.style as any)[p] = cs[p];
  });
  mirror.style.width = `${textarea.offsetWidth}px`;
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.height = 'auto';
  mirror.style.overflow = 'hidden';

  const span = document.createElement('span');
  span.textContent = '\u200b'; // zero-width space sentinel
  mirror.appendChild(document.createTextNode(textarea.value.slice(0, caretPos)));
  mirror.appendChild(span);
  mirror.appendChild(document.createTextNode(textarea.value.slice(caretPos)));
  document.body.appendChild(mirror);

  const mirrorRect = mirror.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  const caretXInContent = spanRect.left - mirrorRect.left;
  const caretBottomInContent = spanRect.bottom - mirrorRect.top;

  document.body.removeChild(mirror);

  const textareaRect = textarea.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // top: position dropdown below the caret line (account for textarea scroll)
  const top = (textareaRect.top - containerRect.top) + caretBottomInContent - textarea.scrollTop + 2;
  // right: for RTL, distance from container's right edge to the caret
  const caretLeftInViewport = textareaRect.left + caretXInContent;
  const right = Math.max(0, containerRect.right - caretLeftInViewport);

  return { top, right };
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
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    query: string;
    startIndex: number;
    endIndex: number;
    selectedIndex: number;
    isLoading: boolean;
    errorMessage: string;
    // Guided context-menu flow state
    guidedMode: null | 'single' | 'range' | 'full';
    guidedSurah: SurahMetadata | null;
    caretCoords: { top: number; right: number } | null;
  }>({
    isOpen: false,
    query: '',
    startIndex: -1,
    endIndex: -1,
    selectedIndex: 0,
    isLoading: false,
    errorMessage: '',
    guidedMode: null,
    guidedSurah: null,
    caretCoords: null,
  });

  const parsed = parseQuery(menuState.query);
  const isStep2 = parsed.surah && (menuState.query.includes(':') || menuState.query.includes('/'));

  // Detect slash/backslash commands (/quran, /surah, etc.)
  const isCommand = menuState.query.toLowerCase().startsWith('q') ||
                    menuState.query.toLowerCase().startsWith('s') ||
                    menuState.query.startsWith('قرآن') ||
                    menuState.query.startsWith('سورة');
  const parsedCmd = parseCommand(menuState.query);

  const filteredSurahs = (isStep2 || isCommand)
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

  // ── Guided context-menu flow derived values ────────────────────────────────

  // showContextMenu: /quran typed but no valid args AND no mode chosen yet
  const showContextMenu =
    isCommand && parsedCmd.type === 'none' && menuState.guidedMode === null;

  // inGuidedSurahSearch: mode picked but surah not yet chosen
  const inGuidedSurahSearch =
    isCommand &&
    parsedCmd.type === 'none' &&
    menuState.guidedMode !== null &&
    menuState.guidedSurah === null;

  // inGuidedAyahHint: surah picked but still waiting for ayah/range input
  const inGuidedAyahHint =
    isCommand &&
    parsedCmd.type === 'none' &&
    menuState.guidedMode !== null &&
    menuState.guidedSurah !== null;

  // Surah query for guided search: text typed after the command keyword
  const guidedSurahQuery = inGuidedSurahSearch
    ? menuState.query.replace(/^(quran|surah|قرآن|سورة)\s*/i, '').trim()
    : '';

  const guidedFilteredSurahs = inGuidedSurahSearch
    ? SURAH_LIST.filter(s => {
        const q = guidedSurahQuery.toLowerCase();
        if (!q) return true;
        return (
          s.number.toString().startsWith(q) ||
          s.name.includes(q) ||
          s.englishName.toLowerCase().includes(q) ||
          s.englishNameTranslation.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  const getFilteredOptionsCount = () => {
    if (showContextMenu) return 3;
    if (inGuidedSurahSearch) return guidedFilteredSurahs.length;
    if (isCommand) {
      if (parsedCmd.type !== 'none' && parsedCmd.surah) return 1;
      return 0;
    }
    if (isStep2) {
      const ayahStr = parsed.ayahStr;
      const ayahNum = parseInt(ayahStr, 10);
      if (ayahNum >= 1 && ayahNum <= (parsed.surah?.numberOfAyahs || 0)) return 1;
      return 0;
    }
    return filteredSurahs.length;
  };

  const closeMenu = () => {
    setMenuState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
      guidedMode: null,
      guidedSurah: null,
    }));
  };

  const fetchAndInsertAyah = async (surah: SurahMetadata, ayahNum: number) => {
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

      closeMenu();
    } catch (err: any) {
      setMenuState(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: err.message || 'حدث خطأ غير متوقع.',
      }));
    }
  };

  const fetchAndInsertRange = async (surah: SurahMetadata, start: number, end: number) => {
    if (start > end) {
      setMenuState(prev => ({ ...prev, errorMessage: 'بداية النطاق يجب أن تكون أصغر من نهايته.' }));
      return;
    }
    if (start < 1 || end > surah.numberOfAyahs) {
      setMenuState(prev => ({ ...prev, errorMessage: `النطاق غير صحيح لهذه السورة (1 - ${surah.numberOfAyahs}).` }));
      return;
    }

    setMenuState(prev => ({ ...prev, isLoading: true, errorMessage: '' }));
    try {
      const res = await fetch(`https://kv-quran.waqf.dev/api/surah/${surah.number}`);
      if (!res.ok) {
        throw new Error('فشل جلب السورة من الخادم.');
      }
      const data = await res.json();
      const allVerses: any[] = data.verses;

      // Filter verses in range
      const rangeVerses = allVerses.filter(v => v.ayah >= start && v.ayah <= end);
      const joinedText = rangeVerses.map(v => v.text).join(' ۞ ');

      // Determine block vs inline formatting
      const textBefore = value.slice(0, menuState.startIndex);
      const lineStart = textBefore.lastIndexOf('\n') + 1;
      const textOnLineBefore = textBefore.slice(lineStart);
      const isNewLine = textOnLineBefore.trim() === '';

      let replacement = '';
      if (isNewLine) {
        replacement = `::ayah{reference="سورة ${surah.name}: ${start}-${end}"}\n${joinedText}\n::\n`;
      } else {
        replacement = `﴿${joinedText}﴾ (سورة ${surah.name}: ${start}-${end})`;
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

      closeMenu();
    } catch (err: any) {
      setMenuState(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: err.message || 'حدث خطأ غير متوقع.',
      }));
    }
  };

  const fetchAndInsertFullSurah = async (surah: SurahMetadata) => {
    setMenuState(prev => ({ ...prev, isLoading: true, errorMessage: '' }));
    try {
      const res = await fetch(`https://kv-quran.waqf.dev/api/surah/${surah.number}`);
      if (!res.ok) {
        throw new Error('فشل جلب السورة من الخادم.');
      }
      const data = await res.json();
      const allVerses: any[] = data.verses;
      const joinedText = allVerses.map(v => v.text).join(' ۞ ');

      // Full surah is always Block format
      const replacement = `::ayah{reference="سورة ${surah.name} كاملة"}\n${joinedText}\n::\n`;

      const nextValue = value.slice(0, menuState.startIndex) + replacement + value.slice(menuState.endIndex);
      onChange(nextValue);

      const nextCursor = menuState.startIndex + replacement.length;
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(nextCursor, nextCursor);
        }
      });

      closeMenu();
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

    // ── Context menu: pick a mode ──────────────────────────────────────────────
    if (showContextMenu) {
      const modes = ['single', 'range', 'full'] as const;
      const picked = modes[idx];
      if (picked) {
        setMenuState(prev => ({
          ...prev,
          guidedMode: picked,
          guidedSurah: null,
          selectedIndex: 0,
          errorMessage: '',
        }));
      }
      return;
    }

    // ── Guided surah search: pick a surah ─────────────────────────────────────
    if (inGuidedSurahSearch) {
      const surah = guidedFilteredSurahs[idx];
      if (!surah) return;

      const mode = menuState.guidedMode!;
      // Update textarea: set command prefix appropriate for the chosen mode
      const cmdSuffix = mode === 'full' ? `${surah.number}` : `${surah.number}:`;
      const triggerChar = value[menuState.startIndex]; // '/' or '\'
      const replacement = `${triggerChar}quran ${cmdSuffix}`;
      const nextValue =
        value.slice(0, menuState.startIndex) + replacement + value.slice(menuState.endIndex);
      onChange(nextValue);

      const nextCursor = menuState.startIndex + replacement.length;

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(nextCursor, nextCursor);
        }
      });

      if (mode === 'full') {
        // For full surah, update state first then auto-fetch
        setMenuState(prev => ({
          ...prev,
          guidedSurah: surah,
          query: `quran ${cmdSuffix}`,
          endIndex: nextCursor,
          selectedIndex: 0,
        }));
        fetchAndInsertFullSurah(surah);
      } else {
        setMenuState(prev => ({
          ...prev,
          guidedSurah: surah,
          query: `quran ${cmdSuffix}`,
          endIndex: nextCursor,
          selectedIndex: 0,
        }));
      }
      return;
    }

    // ── Existing: slash command with fully-parsed args ────────────────────────
    if (isCommand) {
      if (parsedCmd.type === 'single' && parsedCmd.surah && parsedCmd.ayahNum) {
        fetchAndInsertAyah(parsedCmd.surah, parsedCmd.ayahNum);
      } else if (parsedCmd.type === 'range' && parsedCmd.surah && parsedCmd.startAyah && parsedCmd.endAyah) {
        fetchAndInsertRange(parsedCmd.surah, parsedCmd.startAyah, parsedCmd.endAyah);
      } else if (parsedCmd.type === 'full' && parsedCmd.surah) {
        fetchAndInsertFullSurah(parsedCmd.surah);
      }
      return;
    }

    // ── Existing: backslash step 2 (enter ayah number) ───────────────────────
    if (isStep2) {
      const { surah, ayahStr } = parsed;
      if (surah && ayahStr) {
        const ayahNum = parseInt(ayahStr, 10);
        if (ayahNum >= 1 && ayahNum <= surah.numberOfAyahs) {
          fetchAndInsertAyah(surah, ayahNum);
        }
      }
      return;
    }

    // ── Existing: backslash step 1 (pick surah) ───────────────────────────────
    const surah = filteredSurahs[idx];
    if (surah) {
      const replacement = `${surah.number}:`;
      const nextValue =
        value.slice(0, menuState.startIndex + 1) + replacement + value.slice(menuState.endIndex);
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
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(text);

    const textBeforeCursor = text.slice(0, cursor);
    const lastBackslashIndex = textBeforeCursor.lastIndexOf('\\');
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    let triggerIndex = -1;
    let query = '';

    if (lastBackslashIndex !== -1 && lastBackslashIndex >= lastSlashIndex) {
      triggerIndex = lastBackslashIndex;
      query = textBeforeCursor.slice(lastBackslashIndex + 1);
    } else if (lastSlashIndex !== -1) {
      const q = textBeforeCursor.slice(lastSlashIndex + 1);
      const lowercaseQ = q.toLowerCase();
      // For normal slash, only trigger if it starts with 'q', 's', 'قرآن', 'سورة'
      if (
        lowercaseQ.startsWith('q') ||
        lowercaseQ.startsWith('s') ||
        lowercaseQ.startsWith('قرآن') ||
        lowercaseQ.startsWith('سورة')
      ) {
        triggerIndex = lastSlashIndex;
        query = q;
      }
    }

    if (triggerIndex !== -1) {
      const charBeforeTrigger = triggerIndex > 0 ? textBeforeCursor[triggerIndex - 1] : '';
      const isValidTrigger = triggerIndex === 0 || /\s/.test(charBeforeTrigger);

      if (isValidTrigger && !query.includes('\n')) {
        // Compute caret coordinates for cursor-following positioning
        let newCaretCoords: { top: number; right: number } | null = null;
        if (editorContainerRef.current && textareaRef.current) {
          try {
            newCaretCoords = computeCaretCoords(
              textareaRef.current,
              cursor,
              editorContainerRef.current
            );
          } catch {
            // Silently ignore coord computation errors
          }
        }

        const sameTrigger = triggerIndex === menuState.startIndex;
        setMenuState(prev => ({
          ...prev,
          isOpen: true,
          query,
          startIndex: triggerIndex,
          endIndex: cursor,
          caretCoords: newCaretCoords,
          selectedIndex: prev.query.includes(':') !== query.includes(':') ? 0 : prev.selectedIndex,
          // Preserve guided state only when continuing the same trigger
          guidedMode: sameTrigger ? prev.guidedMode : null,
          guidedSurah: sameTrigger ? prev.guidedSurah : null,
        }));
        return;
      }
    }

    setMenuState(prev => ({
      ...prev,
      isOpen: false,
      query: '',
      startIndex: -1,
      endIndex: -1,
      guidedMode: null,
      guidedSurah: null,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!menuState.isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
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
      if (count > 0 || isStep2 || (isCommand && parsedCmd.type !== 'none')) {
        e.preventDefault();
        handleSelectOption();
      }
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setMenuState(prev => ({
        ...prev,
        isOpen: false,
        guidedMode: null,
        guidedSurah: null,
      }));
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

  // ── Dropdown header label ──────────────────────────────────────────────────
  const dropdownTitle = (() => {
    if (menuState.isLoading) return 'جارٍ التحميل…';
    if (showContextMenu) return 'أدوات القرآن الكريم';
    if (inGuidedSurahSearch) {
      const modeLabel = menuState.guidedMode === 'single' ? 'آية واحدة'
        : menuState.guidedMode === 'range' ? 'نطاق آيات'
        : 'سورة كاملة';
      return `اختر السورة — ${modeLabel}`;
    }
    if (inGuidedAyahHint) {
      return menuState.guidedMode === 'single' ? 'أدخل رقم الآية' : 'أدخل نطاق الآيات';
    }
    if (isCommand) return 'أمر إدراج القرآن';
    if (isStep2) return 'إدراج آية قرآنية - خطوة ٢';
    return 'إدراج آية قرآنية - خطوة ١';
  })();

  const dropdownBadge = (() => {
    if (showContextMenu) return 'اختر الوضع';
    if (inGuidedSurahSearch) return 'خطوة ١';
    if (inGuidedAyahHint) return 'خطوة ٢';
    if (isCommand) return 'أمر مخصص';
    if (isStep2) return 'رقم الآية';
    return 'اختر السورة';
  })();

  // ── Dropdown position: cursor-following ────────────────────────────────────
  const containerWidth = editorContainerRef.current?.offsetWidth ?? 640;
  const dropdownWidth = 320; // w-80 = 320px
  const dropdownTop = menuState.caretCoords?.top ?? 48;
  const dropdownRight = menuState.caretCoords
    ? Math.max(0, Math.min(menuState.caretCoords.right, containerWidth - dropdownWidth))
    : 16;

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
        ref={editorContainerRef}
        className={`relative overflow-hidden rounded border-2 bg-white transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 ${
          error ? 'border-red-500' : 'border-zinc-200'
        }`}
      >
        <MarkdownToolbar onAction={handleToolbarAction} />

        {/* Autocomplete Dropdown — cursor-following */}
        {menuState.isOpen && (
          <div
            className="absolute w-80 max-h-80 overflow-y-auto bg-white border border-emerald-100 shadow-xl rounded-lg z-50 p-2 flex flex-col space-y-1 select-none text-right"
            style={{
              direction: 'rtl',
              top: dropdownTop,
              right: dropdownRight,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5 mb-1 px-1">
              <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                {menuState.isLoading ? (
                  <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                ) : (
                  <Sparkles className="size-3.5 text-emerald-600 animate-pulse" />
                )}
                {dropdownTitle}
              </span>
              <div className="flex items-center gap-1">
                {/* Back button when in guided surah search or ayah hint */}
                {(inGuidedSurahSearch || inGuidedAyahHint) && (
                  <button
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault();
                      setMenuState(prev => ({
                        ...prev,
                        guidedMode: null,
                        guidedSurah: null,
                        selectedIndex: 0,
                        errorMessage: '',
                      }));
                    }}
                    className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 px-1.5 py-0.5 rounded hover:bg-zinc-100 transition-colors"
                    title="رجوع"
                  >
                    ← رجوع
                  </button>
                )}
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                  {dropdownBadge}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {menuState.errorMessage && (
              <div className="flex items-start gap-1 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{menuState.errorMessage}</span>
              </div>
            )}

            {/* ── Context Menu: pick a mode ─────────────────────────────────── */}
            {showContextMenu && (
              <div className="flex flex-col space-y-1 p-1">
                {(
                  [
                    {
                      mode: 'single' as const,
                      icon: <Hash className="size-4 text-emerald-600 shrink-0" />,
                      label: 'آية واحدة',
                      desc: 'إدراج آية بعينها',
                      example: '/quran 2:255',
                    },
                    {
                      mode: 'range' as const,
                      icon: <ListOrdered className="size-4 text-emerald-600 shrink-0" />,
                      label: 'نطاق آيات',
                      desc: 'إدراج مجموعة آيات متتالية',
                      example: '/quran 2:1-5',
                    },
                    {
                      mode: 'full' as const,
                      icon: <BookMarked className="size-4 text-emerald-600 shrink-0" />,
                      label: 'سورة كاملة',
                      desc: 'إدراج السورة بأكملها',
                      example: '/quran 1',
                    },
                  ] as const
                ).map((item, idx) => (
                  <button
                    key={item.mode}
                    type="button"
                    onMouseDown={e => {
                      e.preventDefault();
                      handleSelectOption(idx);
                    }}
                    className={`w-full text-right px-3 py-2.5 rounded-md border transition-all flex items-center gap-2.5 ${
                      menuState.selectedIndex === idx
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 border-r-4 shadow-sm'
                        : 'bg-white border-transparent hover:bg-zinc-50 hover:border-zinc-100 text-zinc-700'
                    }`}
                  >
                    {item.icon}
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                      <span className="text-[10px] text-zinc-400 leading-tight">{item.desc}</span>
                    </div>
                    <code className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded font-mono shrink-0">
                      {item.example}
                    </code>
                    <ChevronRight className="size-3.5 text-zinc-300 shrink-0 mr-auto" style={{ transform: 'rotate(180deg)' }} />
                  </button>
                ))}
              </div>
            )}

            {/* ── Guided surah search ───────────────────────────────────────── */}
            {inGuidedSurahSearch && (
              <div className="flex flex-col space-y-0.5 max-h-56 overflow-y-auto">
                {guidedFilteredSurahs.length > 0 ? (
                  guidedFilteredSurahs.map((surah, idx) => (
                    <button
                      key={surah.number}
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault();
                        handleSelectOption(idx);
                      }}
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
                {/* Search hint */}
                <div className="pt-1 pb-0.5 px-1 text-[10px] text-zinc-400 text-center border-t border-zinc-50">
                  اكتب اسم السورة أو رقمها للتصفية
                </div>
              </div>
            )}

            {/* ── Guided ayah / range hint (surah chosen, awaiting input) ─────── */}
            {inGuidedAyahHint && menuState.guidedSurah && (
              <div className="flex flex-col space-y-1.5 p-1">
                <div className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 bg-zinc-50 p-2 rounded justify-start">
                  <BookOpen className="size-4 text-emerald-600 shrink-0" />
                  <span>سورة {menuState.guidedSurah.name} ({menuState.guidedSurah.numberOfAyahs} آية)</span>
                </div>
                <div className="text-xs text-zinc-500 font-medium p-2.5 bg-emerald-50/50 rounded border border-emerald-100/80 text-center leading-relaxed animate-pulse">
                  {menuState.guidedMode === 'single' ? (
                    <>أدخل رقم الآية <span className="font-bold text-emerald-700">(1 - {menuState.guidedSurah.numberOfAyahs})</span> ثم اضغط Enter</>
                  ) : (
                    <>أدخل نطاق الآيات مثال: <span className="font-bold text-emerald-700 font-mono">1-5</span> (1 - {menuState.guidedSurah.numberOfAyahs})</>
                  )}
                </div>
              </div>
            )}

            {/* ── Command mode: fully parsed args → show action button ─────────── */}
            {isCommand && !showContextMenu && !inGuidedSurahSearch && !inGuidedAyahHint && (
              <div className="flex flex-col space-y-1.5 p-1">
                {parsedCmd.type !== 'none' && parsedCmd.surah ? (
                  <div className="flex flex-col space-y-1.5">
                    <div className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 bg-zinc-50 p-2 rounded justify-start">
                      <BookOpen className="size-4 text-emerald-600 shrink-0" />
                      <span>سورة {parsedCmd.surah.name} ({parsedCmd.surah.numberOfAyahs} آية)</span>
                    </div>

                    {parsedCmd.type === 'single' && parsedCmd.ayahNum && (
                      parsedCmd.ayahNum >= 1 && parsedCmd.ayahNum <= parsedCmd.surah.numberOfAyahs ? (
                        <button
                          type="button"
                          onClick={() => handleSelectOption(0)}
                          className={`w-full text-right px-3 py-2 text-xs rounded-md border font-semibold transition-all ${
                            menuState.selectedIndex === 0
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 border-r-4 shadow-sm'
                              : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          ✨ إدراج الآية {parsedCmd.ayahNum} من سورة {parsedCmd.surah.name} (Enter)
                        </button>
                      ) : (
                        <div className="text-xs text-red-500 font-semibold p-2 bg-red-50/50 rounded flex items-center gap-1 justify-start">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span>رقم الآية غير صحيح (الحد الأقصى {parsedCmd.surah.numberOfAyahs})</span>
                        </div>
                      )
                    )}

                    {parsedCmd.type === 'range' && parsedCmd.startAyah && parsedCmd.endAyah && (
                      parsedCmd.startAyah >= 1 && parsedCmd.endAyah <= parsedCmd.surah.numberOfAyahs && parsedCmd.startAyah <= parsedCmd.endAyah ? (
                        <button
                          type="button"
                          onClick={() => handleSelectOption(0)}
                          className={`w-full text-right px-3 py-2 text-xs rounded-md border font-semibold transition-all ${
                            menuState.selectedIndex === 0
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 border-r-4 shadow-sm'
                              : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          ✨ إدراج النطاق {parsedCmd.startAyah}-{parsedCmd.endAyah} من سورة {parsedCmd.surah.name} (Enter)
                        </button>
                      ) : (
                        <div className="text-xs text-red-500 font-semibold p-2 bg-red-50/50 rounded flex items-center gap-1 justify-start">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span>نطاق آيات غير صحيح (الحد الأقصى {parsedCmd.surah.numberOfAyahs})</span>
                        </div>
                      )
                    )}

                    {parsedCmd.type === 'full' && (
                      <button
                        type="button"
                        onClick={() => handleSelectOption(0)}
                        className={`w-full text-right px-3 py-2 text-xs rounded-md border font-semibold transition-all ${
                          menuState.selectedIndex === 0
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 border-r-4 shadow-sm'
                            : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        ✨ إدراج سورة {parsedCmd.surah.name} كاملة (Enter)
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Step 2 Content (backslash flow) ──────────────────────────────── */}
            {!isCommand && isStep2 && parsed.surah && (
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

            {/* ── Step 1 Content (backslash flow) ──────────────────────────────── */}
            {!isCommand && !isStep2 && (
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

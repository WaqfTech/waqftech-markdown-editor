import React from 'react';
import {
  Heading2, Heading3, Heading4, Bold, Italic, List, ListOrdered,
  Quote, Link as LinkIcon, Minus
} from 'lucide-react';

export type MarkdownToolbarAction =
  | 'heading2' | 'heading3' | 'heading4' | 'bold' | 'italic'
  | 'bullet' | 'numbered' | 'quote' | 'link' | 'divider'
  | 'inlineAyah' | 'inlineHadith'
  | 'symbolProphet' | 'symbolAllah' | 'symbolJalla' | 'symbolBismillah' | 'symbolRubElHizb';

export type MarkdownEditResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

const replaceSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  nextSelection: string,
  highlightStart = 0,
  highlightEnd = nextSelection.length,
): MarkdownEditResult => ({
  value: `${value.slice(0, selectionStart)}${nextSelection}${value.slice(selectionEnd)}`,
  selectionStart: selectionStart + highlightStart,
  selectionEnd: selectionStart + highlightEnd,
});

const wrapSelection = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
  placeholder: string,
): MarkdownEditResult => {
  const nextSelection = value.slice(selectionStart, selectionEnd) || placeholder;

  return replaceSelection(
    value,
    selectionStart,
    selectionEnd,
    `${prefix}${nextSelection}${suffix}`,
    prefix.length,
    prefix.length + nextSelection.length,
  );
};

const getBlockSpacing = (before: string, after: string) => ({
  prefix: before.length === 0 ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n',
  suffix: after.length === 0 ? '' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n',
});

const insertBlock = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  blockContent: string,
  highlightStart = blockContent.length,
  highlightEnd = blockContent.length,
): MarkdownEditResult => {
  const { prefix, suffix } = getBlockSpacing(value.slice(0, selectionStart), value.slice(selectionEnd));

  return replaceSelection(
    value,
    selectionStart,
    selectionEnd,
    `${prefix}${blockContent}${suffix}`,
    prefix.length + highlightStart,
    prefix.length + highlightEnd,
  );
};

const applyLinePrefix = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefixLine: (line: string, index: number) => string,
  placeholder: string,
  caretOffset = 0,
): MarkdownEditResult => {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const nextSelection = (selectedText || placeholder)
    .split('\n')
    .map((line, index) => prefixLine(line, index))
    .join('\n');

  if (!selectedText) {
    return replaceSelection(
      value,
      selectionStart,
      selectionEnd,
      nextSelection,
      caretOffset,
      nextSelection.length,
    );
  }

  return replaceSelection(value, selectionStart, selectionEnd, nextSelection);
};

const applyHeadingAction = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  level: number,
): MarkdownEditResult => applyLinePrefix(
  value,
  selectionStart,
  selectionEnd,
  (line) => `${'#'.repeat(level)} ${line.replace(/^#{1,6}\s+/, '').trim() || 'عنوان فرعي'}`,
  'عنوان فرعي',
  level + 1,
);

export const applyMarkdownAction = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: MarkdownToolbarAction,
): MarkdownEditResult => {
  const selectedText = value.slice(selectionStart, selectionEnd);

  switch (action) {
    case 'heading2':
      return applyHeadingAction(value, selectionStart, selectionEnd, 2);
    case 'heading3':
      return applyHeadingAction(value, selectionStart, selectionEnd, 3);
    case 'heading4':
      return applyHeadingAction(value, selectionStart, selectionEnd, 4);
    case 'bold':
      return wrapSelection(value, selectionStart, selectionEnd, '**', '**', 'نص غامق');
    case 'italic':
      return wrapSelection(value, selectionStart, selectionEnd, '*', '*', 'نص مائل');
    case 'bullet':
      return applyLinePrefix(
        value,
        selectionStart,
        selectionEnd,
        (line) => `- ${line.replace(/^\s*[-*+]\s+/, '').replace(/^\s*\d+\.\s+/, '').trim() || 'عنصر جديد'}`,
        'عنصر جديد',
        2,
      );
    case 'numbered':
      return applyLinePrefix(
        value,
        selectionStart,
        selectionEnd,
        (line, index) => `${index + 1}. ${line.replace(/^\s*[-*+]\s+/, '').replace(/^\s*\d+\.\s+/, '').trim() || 'عنصر جديد'}`,
        'عنصر جديد',
        3,
      );
    case 'quote':
      return applyLinePrefix(
        value,
        selectionStart,
        selectionEnd,
        (line) => `> ${line.replace(/^\s*>\s?/, '').trim() || 'نص مقتبس'}`,
        'نص مقتبس',
        2,
      );
    case 'link':
      return replaceSelection(
        value,
        selectionStart,
        selectionEnd,
        `[${selectedText || 'نص الرابط'}](https://example.com)`,
        1,
        1 + (selectedText || 'نص الرابط').length,
      );
    case 'divider':
      return insertBlock(value, selectionStart, selectionEnd, '---');
    case 'inlineAyah':
      return wrapSelection(value, selectionStart, selectionEnd, '﴿', '﴾', 'نص الآية الكريمة');
    case 'inlineHadith':
      return wrapSelection(value, selectionStart, selectionEnd, '«', '»', 'نص الحديث الشريف');
    case 'symbolProphet':
      return replaceSelection(value, selectionStart, selectionEnd, 'ﷺ', 1, 1);
    case 'symbolAllah':
      return replaceSelection(value, selectionStart, selectionEnd, 'ﷲ', 1, 1);
    case 'symbolJalla':
      return replaceSelection(value, selectionStart, selectionEnd, 'ﷻ', 1, 1);
    case 'symbolBismillah':
      return replaceSelection(value, selectionStart, selectionEnd, '﷽', 1, 1);
    case 'symbolRubElHizb':
      return replaceSelection(value, selectionStart, selectionEnd, '۞', 1, 1);
    default:
      return { value, selectionStart, selectionEnd };
  }
};

interface MarkdownToolbarProps {
  onAction: (action: MarkdownToolbarAction) => void;
  className?: string;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ onAction, className = '' }) => {
  const btnCls = 'h-8 min-w-8 px-1.5 rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 flex items-center justify-center';
  const sep = <div className="w-px h-4 bg-zinc-200 mx-0.5 self-center" />;

  return (
    <div className={`flex flex-col border border-zinc-200 bg-zinc-50/50 rounded divide-y divide-zinc-200/60 ${className}`}>
      {/* Row 1: Standard editing */}
      <div className="flex flex-wrap items-center gap-1 p-1">
        <button type="button" className={btnCls} onClick={() => onAction('heading2')} title="عنوان رئيسي (H2)"><Heading2 className="size-4" /></button>
        <button type="button" className={btnCls} onClick={() => onAction('heading3')} title="عنوان فرعي (H3)"><Heading3 className="size-4" /></button>
        <button type="button" className={btnCls} onClick={() => onAction('heading4')} title="عنوان صغير (H4)"><Heading4 className="size-4" /></button>
        {sep}
        <button type="button" className={btnCls} onClick={() => onAction('bold')} title="نص غامق"><Bold className="size-4" /></button>
        <button type="button" className={btnCls} onClick={() => onAction('italic')} title="نص مائل"><Italic className="size-4" /></button>
        {sep}
        <button type="button" className={btnCls} onClick={() => onAction('bullet')} title="قائمة نقطية"><List className="size-4" /></button>
        <button type="button" className={btnCls} onClick={() => onAction('numbered')} title="قائمة مرقمة"><ListOrdered className="size-4" /></button>
        {sep}
        <button type="button" className={btnCls} onClick={() => onAction('quote')} title="اقتباس"><Quote className="size-4" /></button>
        <button type="button" className={btnCls} onClick={() => onAction('link')} title="رابط"><LinkIcon className="size-4" /></button>
        <button type="button" className={btnCls} onClick={() => onAction('divider')} title="خط فاصل"><Minus className="size-4" /></button>
      </div>

      {/* Row 2: Islamic symbols and formatting */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-emerald-50/10">
        <span className="text-xs font-bold text-zinc-500 px-2" style={{ direction: 'rtl' }}>التنسيق الإسلامي:</span>
        <button
          type="button"
          className={`${btnCls} text-emerald-700 font-bold text-base hover:bg-emerald-50 hover:text-emerald-900 min-w-10`}
          onClick={() => onAction('inlineAyah')}
          title="آية قرآنية مضمنة — يضيف ﴿ ﴾ حول النص المحدد"
        >
          ﴿ ﴾
        </button>
        <button
          type="button"
          className={`${btnCls} text-amber-800 font-bold text-base hover:bg-amber-50 hover:text-amber-900 min-w-10`}
          onClick={() => onAction('inlineHadith')}
          title="حديث نبوي مضمن — يضيف « » حول النص المحدد"
        >
          « »
        </button>
        {sep}
        <button
          type="button"
          className={`${btnCls} text-amber-600 text-lg hover:bg-amber-50 min-w-10 font-bold`}
          onClick={() => onAction('symbolProphet')}
          title="صلى الله عليه وسلم"
        >
          ﷺ
        </button>
        <button
          type="button"
          className={`${btnCls} text-amber-600 text-lg hover:bg-amber-50 min-w-10 font-bold`}
          onClick={() => onAction('symbolAllah')}
          title="الله جل جلاله"
        >
          ﷲ
        </button>
        <button
          type="button"
          className={`${btnCls} text-amber-600 text-lg hover:bg-amber-50 min-w-10 font-bold`}
          onClick={() => onAction('symbolJalla')}
          title="جل جلاله"
        >
          ﷻ
        </button>
        <button
          type="button"
          className={`${btnCls} text-amber-600 text-xl hover:bg-amber-50 min-w-14 font-bold`}
          onClick={() => onAction('symbolBismillah')}
          title="بسم الله الرحمن الرحيم"
        >
          ﷽
        </button>
        <button
          type="button"
          className={`${btnCls} text-emerald-700 text-lg hover:bg-emerald-50 min-w-10 font-bold`}
          onClick={() => onAction('symbolRubElHizb')}
          title="ربع الحزب"
        >
          ۞
        </button>
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { ComarkClient } from '@comark/react';
import security from '@comark/react/plugins/security';
import breaks from '@comark/react/plugins/breaks';
import { MarkdownToolbar, applyMarkdownAction } from './MarkdownToolbar.js';
import { inlineIslamicText } from '../plugins/inlineIslamicText.js';

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
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

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
        className={`overflow-hidden rounded border-2 bg-white transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 ${
          error ? 'border-red-500' : 'border-zinc-200'
        }`}
      >
        <MarkdownToolbar onAction={handleToolbarAction} />
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
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full min-h-[120px] p-4 border-0 bg-transparent text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-0 leading-8 text-right resize-y ${className}`}
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

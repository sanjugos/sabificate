import type { DataSaverMode } from '../../../contracts/types';

interface TextBlockProps {
  content: string;
  dataSaverMode: DataSaverMode;
}

/**
 * Renders a text_block content block with data-saver-aware formatting.
 *
 * - ultra_light: plain text only, no rich formatting
 * - data_saver:  reduced formatting (paragraphs, bold only)
 * - full:        full rich text rendering with all formatting
 */
export function TextBlock({ content, dataSaverMode }: TextBlockProps) {
  if (dataSaverMode === 'ultra_light') {
    return (
      <div className="px-4 py-3 text-sm leading-relaxed text-[var(--text)]">
        {stripToPlainText(content)}
      </div>
    );
  }

  if (dataSaverMode === 'data_saver') {
    return (
      <div
        className="px-4 py-3 text-sm leading-relaxed text-[var(--text)] prose-reduced"
        dangerouslySetInnerHTML={{ __html: renderReduced(content) }}
      />
    );
  }

  // full mode
  return (
    <div
      className="px-4 py-3 text-base leading-relaxed text-[var(--text)] prose-full"
      dangerouslySetInnerHTML={{ __html: renderFull(content) }}
    />
  );
}

/** Strip all markdown/html to plain text */
function stripToPlainText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .trim();
}

/** Render with reduced formatting: paragraphs and bold only */
function renderReduced(raw: string): string {
  let html = escapeHtml(raw);
  // bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // strip other markdown
  html = html.replace(/\*(.+?)\*/g, '$1');
  html = html.replace(/`(.+?)`/g, '$1');
  html = html.replace(/#{1,6}\s+(.+)/g, '<p class="font-semibold text-[var(--text-h)]">$1</p>');
  // images removed in data_saver
  html = html.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  // links as text
  html = html.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // paragraphs
  html = html
    .split(/\n{2,}/)
    .map((p) => `<p class="mb-2">${p.trim()}</p>`)
    .join('');
  return html;
}

/** Full rich text rendering */
function renderFull(raw: string): string {
  let html = escapeHtml(raw);
  // headings
  html = html.replace(
    /^#{3}\s+(.+)$/gm,
    '<h3 class="text-lg font-semibold text-[var(--text-h)] mt-4 mb-2">$1</h3>',
  );
  html = html.replace(
    /^#{2}\s+(.+)$/gm,
    '<h2 class="text-xl font-semibold text-[var(--text-h)] mt-4 mb-2">$1</h2>',
  );
  html = html.replace(
    /^#{1}\s+(.+)$/gm,
    '<h1 class="text-2xl font-semibold text-[var(--text-h)] mt-4 mb-2">$1</h1>',
  );
  // bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // code
  html = html.replace(
    /`(.+?)`/g,
    '<code class="bg-[var(--code-bg)] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>',
  );
  // images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" loading="lazy" />',
  );
  // links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-[var(--accent)] underline" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  // unordered lists
  html = html.replace(
    /^[-*]\s+(.+)$/gm,
    '<li class="ml-4 list-disc">$1</li>',
  );
  // paragraphs (split on double newlines, skip already-tagged blocks)
  html = html
    .split(/\n{2,}/)
    .map((segment) => {
      const trimmed = segment.trim();
      if (!trimmed) return '';
      if (/^<(?:h[1-6]|li|img|ul|ol)/.test(trimmed)) return trimmed;
      return `<p class="mb-3">${trimmed}</p>`;
    })
    .join('\n');
  // wrap consecutive <li> in <ul>
  html = html.replace(
    /(<li[^>]*>.*?<\/li>\n?)+/g,
    (match) => `<ul class="mb-3">${match}</ul>`,
  );
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

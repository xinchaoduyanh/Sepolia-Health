/**
 * Convert HTML to Markdown format
 * This helps render HTML content as markdown in React Native
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let markdown = html;

  // Convert headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Convert bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Convert italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Convert links
  markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
  markdown = markdown.replace(/<\/ol>/gi, '\n');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n');

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // Convert line breaks
  markdown = markdown.replace(/<br[^>]*\/?>/gi, '\n');

  // Convert code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```');
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Convert blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');

  // Remove all remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  markdown = markdown
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™');

  // Clean up multiple newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  return markdown;
}

/**
 * Check if content is already markdown (has markdown syntax)
 */
export function isMarkdown(content: string): boolean {
  if (!content) return false;

  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headers
    /\*\*.*?\*\*/, // Bold
    /\*[^*].*?\*/, // Italic (not bold)
    /\[.*?\]\(.*?\)/, // Links
    /^\s*[-*+]\s/m, // Unordered lists
    /^\s*\d+\.\s/m, // Ordered lists
    /```/, // Code blocks
    /`[^`]+`/, // Inline code
  ];

  return markdownPatterns.some((pattern) => pattern.test(content));
}

/**
 * Prepare content for markdown rendering
 * If content is HTML, convert to markdown
 * If content is already markdown, return as is
 */
export function prepareMarkdownContent(content: string): string {
  if (!content) return '';

  // If content is already markdown, return as is
  if (isMarkdown(content)) {
    return content.trim();
  }

  // Otherwise, convert HTML to markdown
  return htmlToMarkdown(content);
}

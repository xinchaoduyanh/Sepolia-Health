/**
 * Simple HTML to text converter
 * Strips HTML tags and converts common HTML entities
 */
export function htmlToText(html: string): string {
  if (!html) return '';

  // Replace common HTML entities
  let text = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Clean up multiple spaces and newlines
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Parse HTML content into structured text with basic formatting
 */
export function parseHtmlContent(html: string): { title?: string; content: string } {
  if (!html) return { content: '' };

  // Try to extract title from h1, h2, h3 tags
  const titleMatch = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
  const title = titleMatch ? htmlToText(titleMatch[1]) : undefined;

  // Remove title from content
  let content = html.replace(/<h[1-3][^>]*>.*?<\/h[1-3]>/gi, '');

  // Convert common HTML elements to readable text
  content = content
    // Convert <p> to double newline
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    // Convert <br> to single newline
    .replace(/<br[^>]*>/gi, '\n')
    // Convert <li> to bullet points
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    // Remove list tags
    .replace(/<\/?[uo]l[^>]*>/gi, '\n')
    // Convert <strong> and <b> to bold markers (will be styled in Text component)
    .replace(/<\/?(strong|b)[^>]*>/gi, '**')
    // Convert <em> and <i> to italic markers
    .replace(/<\/?(em|i)[^>]*>/gi, '_')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, content };
}

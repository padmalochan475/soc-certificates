import html2pdf from 'html2pdf.js';

interface PDFOptions {
  filename: string;
  margin?: number;
  image?: { type: string; quality: number };
  html2canvas?: { scale: number; useCORS: boolean };
  jsPDF?: { unit: string; format: string; orientation: string };
}

/**
 * Generates a PDF from an HTML element.
 */
export async function generatePDF(element: HTMLElement, filename: string): Promise<void> {
  const opt: PDFOptions = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}

/**
 * Replaces placeholders in a template with actual data.
 */
export function renderTemplate(content: string, data: Record<string, any>): string {
  let rendered = content;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(placeholder, value || '');
  });
  return rendered;
}

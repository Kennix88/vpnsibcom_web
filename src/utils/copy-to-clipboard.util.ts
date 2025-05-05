import { toast } from 'react-toastify';
import { getTranslations } from 'next-intl/server';

/**
 * Copies text to clipboard with localized notifications
 * @param text - The text to copy to clipboard
 * @returns Promise<boolean> - True if copying was successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Get translations directly
    const t = await getTranslations('common.clipboard');
    
    await navigator.clipboard.writeText(text);
    toast.success(t('copied'));
    console.log('Text successfully copied to clipboard');
    return true;
  } catch (err) {
    // Try to get translations, but handle case when it fails
    let errorMessage = 'Failed to copy!';
    try {
      const t = await getTranslations('common.clipboard');
      errorMessage = t('failed');
    } catch (translationErr) {
      console.error('Translation error:', translationErr);
    }
    
    toast.error(errorMessage);
    console.error('Failed to copy text to clipboard:', err);
    return false;
  }
}

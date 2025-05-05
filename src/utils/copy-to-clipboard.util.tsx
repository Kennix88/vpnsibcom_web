'use client'
import { useTranslations } from 'next-intl'
import { toast } from 'react-toastify'

/**
 * Custom hook that provides a function to copy text to clipboard with localized notifications
 * @returns Function that copies text to clipboard and returns a Promise<boolean>
 */
export function useCopyToClipboard() {
  const t = useTranslations('common.clipboard')

  /**
   * Copies text to clipboard with localized notifications
   * @param text - The text to copy to clipboard
   * @returns Promise<boolean> - True if copying was successful, false otherwise
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('copied'))
      console.log('Text successfully copied to clipboard')
      return true
    } catch (err) {
      // Handle case when copying fails
      let errorMessage = 'Failed to copy!'
      try {
        errorMessage = t('failed')
      } catch (translationErr) {
        console.error('Translation error:', translationErr)
      }

      toast.error(errorMessage)
      console.error('Failed to copy text to clipboard:', err)
      return false
    }
  }

  return copyToClipboard
}

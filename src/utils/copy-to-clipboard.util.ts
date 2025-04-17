import { toast } from 'react-toastify'

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
    console.log('Copied to clipboard!')
  } catch (err) {
    toast.error('Failed to copy!')
    console.error('Failed to copy!', err)
  }
}

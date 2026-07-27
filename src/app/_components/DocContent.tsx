// app/_components/DocContent.tsx
'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DOC_MD_PATH, DocSlug } from './actionButtons.registry'

interface DocContentProps {
  slug: DocSlug
}

/* ─── Ручные стили под каждый markdown-тег — без зависимости от
 * @tailwindcss/typography, полный контроль над брендингом. ── */
const mdComponents: Components = {
  h1: ({ children }) => (
    <h1
      className="font-mono text-lg font-bold mt-1 mb-3 pb-2"
      style={{
        color: 'var(--on-surface)',
        borderBottom: '1px solid var(--surface-border)',
      }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      className="font-mono text-base font-bold mt-6 mb-2.5"
      style={{ color: 'var(--on-surface)' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      className="font-mono text-sm font-bold mt-4 mb-2"
      style={{ color: 'var(--primary)' }}>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      className="text-[13.5px] leading-relaxed mb-3"
      style={{ color: 'var(--on-surface-variant)' }}>
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold" style={{ color: 'var(--on-surface)' }}>
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 font-medium"
      style={{ color: 'var(--primary)' }}>
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="flex flex-col gap-1.5 mb-3 pl-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex flex-col gap-1.5 mb-3 pl-1 list-decimal list-inside">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li
      className="text-[13.5px] leading-relaxed pl-4 relative"
      style={{ color: 'var(--on-surface-variant)' }}>
      <span
        className="absolute left-0 top-[9px] w-1 h-1 rounded-full"
        style={{ background: 'var(--primary)' }}
      />
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="pl-3 my-3 text-[13px] italic"
      style={{
        borderLeft: '2px solid var(--primary)',
        color: 'var(--on-surface-variant)',
        opacity: 0.85,
      }}>
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code
      className="font-mono text-[12px] px-1.5 py-0.5 rounded-md"
      style={{
        background: 'var(--surface-container-high)',
        color: 'var(--primary)',
      }}>
      {children}
    </code>
  ),
  hr: () => (
    <hr
      className="my-4"
      style={{ border: 'none', borderTop: '1px solid var(--surface-border)' }}
    />
  ),
}

export default function DocContent({ slug }: DocContentProps) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setContent(null)
    setError(false)
    fetch(DOC_MD_PATH[slug])
      .then((res) => {
        if (!res.ok) throw new Error('not ok')
        return res.text()
      })
      .then(setContent)
      .catch(() => setError(true))
  }, [slug])

  if (error) {
    return (
      <p style={{ color: 'var(--error)' }} className="text-sm">
        Не удалось загрузить документ. Попробуйте позже.
      </p>
    )
  }

  if (!content) {
    return (
      <div className="flex flex-col gap-2 animate-pulse">
        <div
          className="h-3 rounded-full w-3/4"
          style={{ background: 'var(--surface-container-high)' }}
        />
        <div
          className="h-3 rounded-full w-1/2"
          style={{ background: 'var(--surface-container-high)' }}
        />
        <div
          className="h-3 rounded-full w-2/3"
          style={{ background: 'var(--surface-container-high)' }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

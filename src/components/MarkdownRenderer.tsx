'use client'

import { ElementType } from 'react'
import Markdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

type StyledTag =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'p'
  | 'ul'
  | 'ol'
  | 'blockquote'
  | 'code'
  | 'pre'
  | 'th'
  | 'td'
  | 'hr'

// react-markdown이 넘기는 node prop은 DOM에 전달하지 않고 Tailwind 클래스만 입힌다
const styled = (tag: StyledTag, className: string) => {
  const Tag = tag as ElementType
  const Styled = ({ children }: { children?: React.ReactNode }) => (
    <Tag className={className}>{children}</Tag>
  )
  return Styled
}

const components: Components = {
  h1: styled('h1', 'text-xl font-bold mt-4 mb-2'),
  h2: styled('h2', 'text-lg font-bold mt-4 mb-2'),
  h3: styled('h3', 'text-base font-semibold mt-3 mb-1'),
  p: styled('p', 'my-2'),
  ul: styled('ul', 'list-disc pl-5 my-2 space-y-1 [&_ul]:my-1 [&_ol]:my-1'),
  ol: styled('ol', 'list-decimal pl-5 my-2 space-y-1 [&_ul]:my-1 [&_ol]:my-1'),
  blockquote: styled(
    'blockquote',
    'border-l-4 border-gray-300 pl-3 my-2 text-gray-500'
  ),
  code: styled('code', 'bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-xs'),
  pre: styled('pre', 'bg-gray-100 rounded-lg p-3 my-2 overflow-x-auto'),
  th: styled('th', 'border border-gray-300 bg-gray-50 px-2 py-1 text-left'),
  td: styled('td', 'border border-gray-300 px-2 py-1'),
  hr: styled('hr', 'my-3 border-gray-200'),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue-600 hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="border-collapse text-sm">{children}</table>
    </div>
  ),
}

export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  return (
    <div
      className={`break-words [&>:first-child]:mt-0 [&>:last-child]:mb-0 ${className}`}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  )
}

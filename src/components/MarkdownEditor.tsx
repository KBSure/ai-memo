'use client'

import dynamic from 'next/dynamic'

// 편집기는 브라우저 전용이므로 SSR 비활성화
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-80 flex items-center justify-center border border-gray-300 rounded-lg text-sm text-gray-500">
      편집기를 불러오는 중...
    </div>
  ),
})

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function MarkdownEditor({
  value,
  onChange,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" data-testid="markdown-editor">
      <MDEditor
        value={value}
        onChange={val => onChange(val ?? '')}
        height={320}
        preview="live"
        textareaProps={{
          id: 'content',
          placeholder: '마크다운으로 메모 내용을 입력하세요',
        }}
      />
    </div>
  )
}

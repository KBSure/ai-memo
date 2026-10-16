'use client'

import { useEffect } from 'react'
import { Memo, MEMO_CATEGORIES, MEMO_CATEGORY_COLORS } from '@/types/memo'
import { useSummarize } from '@/hooks/useSummarize'
import MarkdownRenderer from './MarkdownRenderer'

interface MemoViewerProps {
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function MemoViewer({
  memo,
  onClose,
  onEdit,
  onDelete,
}: MemoViewerProps) {
  const isOpen = memo !== null
  const memoId = memo?.id
  const { status, summary, summarize, loadSaved, reset } = useSummarize()

  // 다른 메모를 열거나 모달을 닫으면 요약 결과 초기화 후, 저장된 요약이 있으면 불러옴
  useEffect(() => {
    reset()
    if (memoId) loadSaved(memoId)
  }, [memoId, reset, loadSaved])

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!memo) return null

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  const hasContent = memo.content.trim().length > 0
  const isLoading = status === 'loading'

  const handleSummarize = () => {
    summarize(memo.id)
  }

  const categoryColor =
    MEMO_CATEGORY_COLORS[memo.category as keyof typeof MEMO_CATEGORY_COLORS] ||
    MEMO_CATEGORY_COLORS.other

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="memo-viewer-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="메모 상세 보기"
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="memo-viewer"
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 break-words">
                {memo.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
                <span className="text-xs text-gray-500">
                  수정: {formatDate(memo.updatedAt)}
                </span>
                <span className="text-xs text-gray-500">
                  작성: {formatDate(memo.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              data-testid="memo-viewer-close-btn"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 내용 */}
          <MarkdownRenderer
            content={memo.content}
            className="text-gray-700 text-sm leading-relaxed mb-4"
          />

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* AI 요약 */}
          <div className="mt-6" data-testid="memo-summary-section">
            <button
              onClick={handleSummarize}
              disabled={!hasContent || isLoading}
              aria-label="AI로 메모 요약"
              data-testid="memo-summarize-btn"
              className="px-4 py-2 text-sm border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? '요약 중...'
                : status === 'idle'
                  ? 'AI 요약'
                  : '다시 요약'}
            </button>

            {status === 'success' && (
              <div
                className="mt-3 p-4 bg-blue-50 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                data-testid="memo-summary-result"
              >
                {summary}
              </div>
            )}

            {status === 'error' && (
              <div
                role="alert"
                className="mt-3 p-4 bg-red-50 rounded-lg text-sm text-red-600"
                data-testid="memo-summary-error"
              >
                요약에 실패했습니다. 다시 시도해 주세요.
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDelete}
              aria-label="메모 삭제"
              data-testid="memo-viewer-delete-btn"
              className="flex-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              삭제
            </button>
            <button
              onClick={() => onEdit(memo)}
              aria-label="메모 편집"
              data-testid="memo-viewer-edit-btn"
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              편집
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

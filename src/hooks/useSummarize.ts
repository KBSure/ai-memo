'use client'

import { useState, useCallback, useRef } from 'react'
import { summarizeMemo, getSummary } from '@/app/actions/summarize'

type SummarizeStatus = 'idle' | 'loading' | 'success' | 'error'

export const useSummarize = () => {
  const [status, setStatus] = useState<SummarizeStatus>('idle')
  const [summary, setSummary] = useState('')
  // reset/재요청 이후 도착한 이전 요청의 응답을 무시하기 위한 요청 식별자
  const requestIdRef = useRef(0)

  // 새로 요약하고 DB에 저장
  const summarize = useCallback(async (memoId: string) => {
    const requestId = ++requestIdRef.current
    setStatus('loading')
    setSummary('')
    try {
      const result = await summarizeMemo(memoId)
      if (requestId !== requestIdRef.current) return
      setSummary(result)
      setStatus('success')
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      console.error('Failed to summarize memo:', error)
      setStatus('error')
    }
  }, [])

  // 저장된 요약 불러오기 (없으면 idle 유지)
  const loadSaved = useCallback(async (memoId: string) => {
    const requestId = ++requestIdRef.current
    try {
      const saved = await getSummary(memoId)
      if (requestId !== requestIdRef.current || !saved) return
      setSummary(saved)
      setStatus('success')
    } catch (error) {
      console.error('Failed to load saved summary:', error)
    }
  }, [])

  const reset = useCallback(() => {
    requestIdRef.current++
    setStatus('idle')
    setSummary('')
  }, [])

  return { status, summary, summarize, loadSaved, reset }
}

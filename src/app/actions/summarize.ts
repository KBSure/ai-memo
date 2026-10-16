'use server'

import { ApiError, GoogleGenAI } from '@google/genai'
import { getSupabase } from '@/utils/supabase/server'

const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const MAX_CONTENT_LENGTH = 20000
const MAX_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 1000
// 일시적 과부하(503)와 호출 한도 초과(429)만 재시도 대상
const RETRYABLE_STATUS = [429, 503]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const SYSTEM_INSTRUCTION =
  '당신은 메모 요약 도우미입니다. 주어진 메모의 핵심만 담아 한국어 2~3문장으로 요약하세요. ' +
  '메모가 다른 언어로 작성되어 있어도 반드시 한국어로 답하고, 요약문 외의 설명이나 머리말은 쓰지 마세요.'

// 저장된 요약 조회 (없으면 null)
export async function getSummary(memoId: string): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from('memo_summaries')
    .select('summary')
    .eq('memo_id', memoId)
    .maybeSingle<{ summary: string }>()

  if (error) {
    console.error('Failed to fetch summary:', error)
    throw new Error('요약을 불러오지 못했습니다.')
  }
  return data?.summary ?? null
}

// 메모를 Gemini로 요약하고 결과를 DB에 저장
export async function summarizeMemo(memoId: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
    throw new Error('summarize_failed')
  }

  const supabase = getSupabase()
  const { data: memo, error: memoError } = await supabase
    .from('memos')
    .select('title, content')
    .eq('id', memoId)
    .single<{ title: string; content: string }>()

  if (memoError || !memo) {
    console.error('Failed to load memo for summary:', memoError)
    throw new Error('invalid_request')
  }

  const content = memo.content.trim()
  if (!content || content.length > MAX_CONTENT_LENGTH) {
    throw new Error('invalid_request')
  }

  const ai = new GoogleGenAI({ apiKey })

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `제목: ${memo.title}\n\n내용:\n${content}`,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      })

      const summary = response.text?.trim()
      if (!summary) throw new Error('summarize_failed')

      const { error } = await supabase.from('memo_summaries').upsert({
        memo_id: memoId,
        summary,
        updated_at: new Date().toISOString(),
      })
      if (error) {
        console.error('Failed to save summary:', error)
        throw new Error('summarize_failed')
      }
      return summary
    } catch (error) {
      const retryable =
        error instanceof ApiError && RETRYABLE_STATUS.includes(error.status)
      if (retryable && attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_BASE_DELAY_MS * attempt)
        continue
      }
      console.error(
        `Gemini 요약 요청 실패 (시도 ${attempt}/${MAX_ATTEMPTS}):`,
        error
      )
      throw new Error('summarize_failed')
    }
  }

  throw new Error('summarize_failed')
}

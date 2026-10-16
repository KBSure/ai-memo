'use server'

import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { getSupabase } from '@/utils/supabase/server'
import { MemoRow, rowToMemo } from '@/utils/memoMapper'

const toRowFields = (formData: MemoFormData) => ({
  title: formData.title,
  content: formData.content,
  category: formData.category,
  tags: formData.tags,
})

export async function getMemos(): Promise<Memo[]> {
  const { data, error } = await getSupabase()
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<MemoRow[]>()

  if (error) {
    console.error('Failed to fetch memos:', error)
    throw new Error('메모를 불러오지 못했습니다.')
  }
  return data.map(rowToMemo)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const now = new Date().toISOString()
  const { data, error } = await getSupabase()
    .from('memos')
    .insert({
      id: uuidv4(),
      ...toRowFields(formData),
      created_at: now,
      updated_at: now,
    })
    .select()
    .single<MemoRow>()

  if (error) {
    console.error('Failed to create memo:', error)
    throw new Error('메모를 저장하지 못했습니다.')
  }
  return rowToMemo(data)
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const { data, error } = await getSupabase()
    .from('memos')
    .update({ ...toRowFields(formData), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<MemoRow>()

  if (error) {
    console.error('Failed to update memo:', error)
    throw new Error('메모를 수정하지 못했습니다.')
  }
  return rowToMemo(data)
}

export async function deleteMemo(id: string): Promise<void> {
  const { error } = await getSupabase().from('memos').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete memo:', error)
    throw new Error('메모를 삭제하지 못했습니다.')
  }
}

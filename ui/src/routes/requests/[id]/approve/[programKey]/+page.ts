import { api } from '$internal'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'
import { getInlineReviewerEditPrompts, coalesceAppRequestPrompts } from '$internal'

export const load: PageLoad = async ({ params, depends }) => {
  const appRequest = await api.getReviewData(params.id, params.programKey)
  if (!appRequest) throw error(404, 'App Request not found')
  const inlinePrompts = getInlineReviewerEditPrompts(appRequest)
  const inlinePromptsWithData = await api.getPromptDataLegion(params.id, (inlinePrompts ?? []).map(prompt => prompt.id))
  const coalescedAppRequest = coalesceAppRequestPrompts(appRequest, inlinePromptsWithData)
  depends('request:approve')
  return { appRequest: coalescedAppRequest, programKey: params.programKey, requestId: params.id }
}

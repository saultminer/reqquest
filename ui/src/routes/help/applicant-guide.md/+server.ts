import { redirect } from '@sveltejs/kit'
import { PUBLIC_API_BASE } from '$env/static/public'

/**
 * The applicant guide is a Markdown document for AI agents, rendered and served by the API (see
 * `appConfig.applicantGuide` in @reqquest/api). This gives it an address on the UI origin.
 *
 * It is an endpoint rather than a page so the root layout, which sends anyone without a token to
 * the login page, never runs. It only exists under the dev server: the static build has no
 * endpoints, so there nginx issues the same redirect (see apply-env.sh).
 */
export const prerender = false

export function GET () {
  redirect(302, `${PUBLIC_API_BASE.replace(/\/$/, '')}/help/applicant-guide.md`)
}

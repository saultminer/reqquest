import { type FastifyInstanceTyped, HttpError } from 'fastify-txstate'
import { getApplicantGuide } from './applicantGuide.js'

/**
 * Deliberately has no authorization: the whole point is that an applicant's AI agent can fetch it
 * with a plain GET. Only install it when `appConfig.applicantGuide` is on.
 */
export function installHelpRoutes (app: FastifyInstanceTyped) {
  app.get('/help/applicant-guide.md', async (req, reply) => {
    const guide = getApplicantGuide()
    if (guide == null) throw new HttpError(404)
    reply.headers({ 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'max-age=300' })
    return guide
  })
}

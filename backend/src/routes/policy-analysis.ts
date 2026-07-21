/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { constants } from 'node:http2'
import { fetchRetry } from '../lib/fetch-retry'
import { jsonPost, jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respond, respondBadRequest, respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'

const AGENTIC_NAMESPACE = 'openshift-lightspeed'
const AGENTIC_API_VERSION = 'agentic.openshift.io/v1alpha1'
const MAX_BODY_BYTES = 1024 * 1024

const REQUEST_PREFIX = `Validate the following ACM Policy resources for correctness. Do NOT apply them.
Check for: syntax errors, correct API versions, proper field references,
valid placement targeting, and whether the policy logic correctly matches
the resources and intent expressed in the submitted policy.

Also verify:
- Do referenced managed clusters, placements, placement rules, and namespaces exist?
- Are the ACM Policy CRDs installed on this cluster?

Policy resources:
`

interface KubeCondition {
  type: string
  status: string
  reason?: string
  message?: string
}

interface StepResultRef {
  name: string
  outcome: string
}

interface ProposalResource {
  apiVersion: string
  kind: string
  metadata: { name?: string; generateName?: string; namespace?: string }
  spec: { request: string; analysis: { agent?: string } }
  status?: {
    conditions?: KubeCondition[]
    steps?: { analysis?: { results?: StepResultRef[] } }
  }
}

interface DiagnosisResult {
  summary: string
  confidence: string
  rootCause: string
}

interface PolicyValidationComponents {
  readyToDeploy: boolean
}

interface RemediationOption {
  title: string
  summary?: string
  diagnosis?: DiagnosisResult
  components?: PolicyValidationComponents
}

interface AnalysisResultResource {
  apiVersion: string
  kind: string
  metadata: { name: string; namespace: string }
  status?: { options?: RemediationOption[]; failureReason?: string }
}

const ANALYSIS_OUTPUT_SCHEMA = {
  type: 'object',
  required: ['readyToDeploy'],
  properties: {
    readyToDeploy: {
      type: 'boolean',
      description:
        'Whether this policy is safe to deploy. Check for: syntax errors, correct API versions, proper field references, valid placement targeting.',
    },
  },
}

type ProposalPhase =
  | 'Pending'
  | 'Analyzing'
  | 'Proposed'
  | 'Executing'
  | 'Verifying'
  | 'Completed'
  | 'Failed'
  | 'Denied'
  | 'Escalating'
  | 'Escalated'
  | 'EmergencyStopped'

// Ported from DerivePhase in lightspeed-agentic-operator/api/v1alpha1/proposal_types.go
function derivePhase(conditions: KubeCondition[]): ProposalPhase {
  const get = (type: string) => conditions.find((c) => c.type === type)

  if (get('EmergencyStopped')?.status === 'True') return 'EmergencyStopped'

  const escalated = get('Escalated')
  if (escalated?.status === 'True') return 'Escalated'
  if (get('Denied')?.status === 'True') return 'Denied'
  if (escalated) return escalated.status === 'Unknown' ? 'Escalating' : 'Failed'

  const verified = get('Verified')
  if (verified) {
    if (verified.status === 'True') return 'Completed'
    if (verified.status === 'Unknown') return 'Verifying'
    if (verified.reason === 'RetryingExecution') return 'Executing'
    return 'Failed'
  }

  const executed = get('Executed')
  if (executed) {
    if (executed.status === 'True') return 'Verifying'
    if (executed.status === 'Unknown') return 'Executing'
    return 'Failed'
  }

  const analyzed = get('Analyzed')
  if (analyzed) {
    if (analyzed.status === 'True') return 'Proposed'
    if (analyzed.status === 'Unknown') return 'Analyzing'
    return 'Failed'
  }

  return 'Pending'
}

const TERMINAL_PHASES = new Set<ProposalPhase>([
  'Proposed',
  'Completed',
  'Failed',
  'Denied',
  'Escalated',
  'EmergencyStopped',
])

function proposalUrl(name?: string): string {
  const base = `${process.env.CLUSTER_API_URL}/apis/${AGENTIC_API_VERSION}/namespaces/${AGENTIC_NAMESPACE}/proposals`
  return name ? `${base}/${name}` : base
}

function analysisResultUrl(name: string): string {
  return `${process.env.CLUSTER_API_URL}/apis/${AGENTIC_API_VERSION}/namespaces/${AGENTIC_NAMESPACE}/analysisresults/${name}`
}

async function deleteProposal(name: string, token: string): Promise<void> {
  try {
    await fetchRetry(proposalUrl(name), {
      method: 'DELETE',
      headers: { [constants.HTTP2_HEADER_AUTHORIZATION]: `Bearer ${token}` },
    })
  } catch (err) {
    logger.warn({
      msg: 'Failed to clean up Proposal CR',
      name,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

interface PolicyAnalysisBody {
  resources: unknown[]
}

export async function policyAnalysisCreate(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const chunks: string[] = []
    let bodyBytes = 0
    let aborted = false
    req.on('data', (chunk: string) => {
      bodyBytes += Buffer.byteLength(chunk)
      if (bodyBytes > MAX_BODY_BYTES) {
        aborted = true
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', async () => {
      if (aborted) {
        respond(res, { error: 'Request body too large' }, 413)
        return
      }

      try {
        let parsedBody: unknown
        try {
          parsedBody = JSON.parse(chunks.join(''))
        } catch {
          respondBadRequest(req, res)
          return
        }

        const body = parsedBody as Partial<PolicyAnalysisBody> | null
        if (!body || typeof body !== 'object' || !Array.isArray(body.resources) || body.resources.length === 0) {
          respondBadRequest(req, res)
          return
        }

        const policyJson = JSON.stringify(body.resources, undefined, 2)
        const request = REQUEST_PREFIX + '```json\n' + policyJson + '\n```'

        const createResult = await jsonPost<ProposalResource>(
          proposalUrl(),
          {
            apiVersion: AGENTIC_API_VERSION,
            kind: 'Proposal',
            metadata: { generateName: 'policy-validation-', namespace: AGENTIC_NAMESPACE },
            spec: {
              request,
              analysisOutput: { schema: ANALYSIS_OUTPUT_SCHEMA },
              analysis: { agent: 'default' },
            },
          },
          token
        )

        if (createResult.statusCode < 200 || createResult.statusCode >= 300) {
          logger.error({ msg: 'Failed to create Proposal CR', statusCode: createResult.statusCode })
          respond(
            res,
            { error: `Failed to create analysis request (HTTP ${createResult.statusCode})` },
            createResult.statusCode
          )
          return
        }

        const proposalName = createResult.body?.metadata?.name
        if (!proposalName) {
          respondInternalServerError(req, res)
          return
        }

        logger.info({ msg: 'policy-analysis: proposal created', proposalName })
        respond(res, { proposalName, phase: 'Analyzing' })
      } catch (err) {
        logger.error({ msg: 'Policy analysis create failed', error: err instanceof Error ? err.message : String(err) })
        if (!res.headersSent) {
          respond(res, { error: err instanceof Error ? err.message : 'Internal server error' }, 500)
        }
      }
    })
  }
}

export async function policyAnalysisStatus(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return

  const parsedUrl = new URL(req.url ?? '', 'http://localhost')
  const name = parsedUrl.searchParams.get('name')
  if (!name) {
    respondBadRequest(req, res)
    return
  }

  try {
    const proposal = await jsonRequest<ProposalResource>(proposalUrl(name), token)
    const phase = derivePhase(proposal.status?.conditions ?? [])

    if (!TERMINAL_PHASES.has(phase)) {
      respond(res, { phase })
      return
    }

    if (phase === 'Proposed' || phase === 'Completed') {
      const resultRefName = proposal.status?.steps?.analysis?.results?.at(-1)?.name
      if (resultRefName) {
        const analysisResult = await jsonRequest<AnalysisResultResource>(analysisResultUrl(resultRefName), token)
        const firstOption = analysisResult.status?.options?.[0]
        const readyToDeploy = firstOption?.components?.readyToDeploy ?? false
        await deleteProposal(name, token)
        respond(res, {
          phase,
          readyToDeploy,
          optionTitle: firstOption?.title,
          diagnosis: firstOption?.diagnosis,
        })
        return
      }
    }

    const failedCondition = proposal.status?.conditions?.find((c) => c.status === 'False' && c.message)
    await deleteProposal(name, token)
    respond(res, {
      phase,
      readyToDeploy: false,
      error: failedCondition?.message ?? `Analysis ended with phase: ${phase}`,
    })
  } catch (err) {
    logger.error({
      msg: 'Policy analysis status check failed',
      name,
      error: err instanceof Error ? err.message : String(err),
    })
    if (!res.headersSent) {
      respond(
        res,
        { phase: 'Failed', readyToDeploy: false, error: err instanceof Error ? err.message : 'Internal server error' },
        500
      )
    }
  }
}

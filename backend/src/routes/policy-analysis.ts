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
const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 120_000
const MAX_BODY_BYTES = 1024 * 1024

// Inlined from validate-acm-policy.yaml — the Rollup build bundles everything into a single
// backend.mjs, so filesystem reads for co-located files don't work in the production image.
const PROPOSAL_TEMPLATE = `apiVersion: agentic.openshift.io/v1alpha1
kind: Proposal
metadata:
  name: validate-acm-policy
  namespace: openshift-lightspeed
spec:
  request: |
    Validate the following ACM Policy YAML for correctness. Do NOT apply it.
    Check for: syntax errors, correct API versions, proper field references,
    valid placement targeting, and whether the policy logic correctly matches
    the resources and intent expressed in the submitted policy.

    \`\`\`yaml
    apiVersion: policy.open-cluster-management.io/v1
    kind: Policy
    metadata:
      name: check-namespace-exists
      namespace: open-cluster-management
    spec:
      disabled: false
      remediationAction: inform
      policy-templates:
        - objectDefinition:
            apiVersion: policy.open-cluster-management.io/v1
            kind: ConfigurationPolicy
            metadata:
              name: check-openshift-lightspeed-ns
            spec:
              remediationAction: inform
              severity: high
              object-templates:
                - complianceType: musthave
                  objectDefinition:
                    apiVersion: v1
                    kind: Namespace
                    metadata:
                      name: openshift-lightspeed
    ---
    apiVersion: apps.open-cluster-management.io/v1
    kind: PlacementRule
    metadata:
      name: check-namespace-exists-placement
      namespace: open-cluster-management
    spec:
      clusterSelector:
        matchExpressions:
          - key: name
            operator: In
            values:
              - local-cluster
    ---
    apiVersion: policy.open-cluster-management.io/v1
    kind: PlacementBinding
    metadata:
      name: check-namespace-exists-binding
      namespace: open-cluster-management
    spec:
      placementRef:
        apiGroup: apps.open-cluster-management.io
        kind: PlacementRule
        name: check-namespace-exists-placement
      subjects:
        - apiGroup: policy.open-cluster-management.io
          kind: Policy
          name: check-namespace-exists
    \`\`\`

    Also verify:
    - Do referenced managed clusters, placements, placement rules, and namespaces exist?
    - Are the ACM Policy CRDs installed on this cluster?
  analysis:
    agent: default
`

function extractRequestFromTemplate(template: string): string {
  const requestMatch = template.match(/^\s+request:\s*\|\s*\n([\s\S]*?)\n\s+analysis:/m)
  if (!requestMatch) throw new Error('Could not extract request from proposal template')
  const lines = requestMatch[1].split('\n')
  const indent = lines[0].match(/^(\s*)/)?.[1].length ?? 0
  return lines.map((line) => line.slice(indent)).join('\n')
}

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

interface RemediationOption {
  title: string
  summary?: string
  diagnosis?: DiagnosisResult
}

interface AnalysisResultResource {
  apiVersion: string
  kind: string
  metadata: { name: string; namespace: string }
  status?: { options?: RemediationOption[]; failureReason?: string }
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

async function pollProposal(name: string, token: string): Promise<ProposalResource> {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    const proposal = await jsonRequest<ProposalResource>(proposalUrl(name), token)
    const phase = derivePhase(proposal.status?.conditions ?? [])
    if (TERMINAL_PHASES.has(phase)) return proposal
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error('Analysis timed out — the agentic operator did not complete within 120 seconds')
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

export async function policyAnalysis(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
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
        respond(res, { phase: 'Failed', error: 'Request body too large' }, 413)
        return
      }

      let proposalName: string | undefined

      try {
        logger.info({ msg: 'policy-analysis: request received' })

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
        const templateRequest = extractRequestFromTemplate(PROPOSAL_TEMPLATE)
        const request = templateRequest.replace(/```yaml[\s\S]*?```/, '```json\n' + policyJson + '\n```')

        const createResult = await jsonPost<ProposalResource>(
          proposalUrl(),
          {
            apiVersion: AGENTIC_API_VERSION,
            kind: 'Proposal',
            metadata: { generateName: 'policy-validation-', namespace: AGENTIC_NAMESPACE },
            spec: { request, analysis: { agent: 'default' } },
          },
          token
        )

        if (createResult.statusCode < 200 || createResult.statusCode >= 300) {
          logger.error({ msg: 'Failed to create Proposal CR', statusCode: createResult.statusCode })
          respond(
            res,
            { phase: 'Failed', error: `Failed to create analysis request (HTTP ${createResult.statusCode})` },
            createResult.statusCode
          )
          return
        }

        proposalName = createResult.body?.metadata?.name
        if (!proposalName) {
          logger.error({
            msg: 'policy-analysis: no proposal name in create response',
            responseKind: createResult.body?.kind,
          })
          respondInternalServerError(req, res)
          return
        }
        logger.info({ msg: 'policy-analysis: proposal created', proposalName })

        const proposal = await pollProposal(proposalName, token)
        const phase = derivePhase(proposal.status?.conditions ?? [])
        logger.info({ msg: 'policy-analysis: poll complete', proposalName, phase })

        if (phase === 'Proposed' || phase === 'Completed') {
          const resultRefName = proposal.status?.steps?.analysis?.results?.at(-1)?.name
          logger.info({
            msg: 'policy-analysis: looking for analysis result',
            resultRefName,
            resultCount: proposal.status?.steps?.analysis?.results?.length ?? 0,
          })
          if (resultRefName) {
            const analysisResult = await jsonRequest<AnalysisResultResource>(analysisResultUrl(resultRefName), token)
            const firstOption = analysisResult.status?.options?.[0]
            await deleteProposal(proposalName, token)
            respond(res, {
              phase,
              optionTitle: firstOption?.title,
              diagnosis: firstOption?.diagnosis,
            })
            return
          }
        }

        const failedCondition = proposal.status?.conditions?.find((c) => c.status === 'False' && c.message)
        await deleteProposal(proposalName, token)
        respond(res, {
          phase,
          error: failedCondition?.message ?? `Analysis ended with phase: ${phase}`,
        })
      } catch (err) {
        if (proposalName) await deleteProposal(proposalName, token)
        logger.error({ msg: 'Policy analysis failed', error: err instanceof Error ? err.message : String(err) })
        if (!res.headersSent) {
          respond(res, { phase: 'Failed', error: err instanceof Error ? err.message : 'Internal server error' }, 500)
        }
      }
    })
  }
}

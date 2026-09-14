/* Copyright Contributors to the Open Cluster Management project */

import {
  type AnsibleJob,
  AnsibleJobApiVersion,
  AnsibleJobKind,
  type AnsibleWorkflow,
  AnsibleWorkflowKind,
  getLatestAnsibleHook,
} from './ansible-job'

function ansibleJob(opts: {
  name?: string
  namespace?: string
  jobtype?: 'prehook' | 'posthook'
  annotate?: boolean
  status?: string
  url?: string
  started?: string
}): AnsibleJob {
  const name = opts.name ?? 'prehookjob-a'
  const annotations =
    opts.annotate === false
      ? undefined
      : {
          jobtype: opts.jobtype ?? 'prehook',
        }
  return {
    apiVersion: AnsibleJobApiVersion,
    kind: AnsibleJobKind,
    metadata: {
      name,
      namespace: opts.namespace ?? 'ns',
      annotations,
    },
    status: {
      ansibleJobResult: {
        changed: false,
        failed: opts.status === 'error',
        status: opts.status ?? 'successful',
        url: opts.url,
        finished: opts.started ?? '',
        started: opts.started as unknown as string,
      },
    },
  }
}

function ansibleWorkflow(opts: {
  name?: string
  namespace?: string
  jobtype?: 'prehook' | 'posthook'
  annotate?: boolean
  status?: string
  url?: string
  started?: string
}): AnsibleWorkflow {
  const name = opts.name ?? 'prehookjob-wf'
  const annotations =
    opts.annotate === false
      ? undefined
      : {
          jobtype: opts.jobtype ?? 'prehook',
        }
  return {
    apiVersion: AnsibleJobApiVersion,
    kind: AnsibleWorkflowKind,
    metadata: {
      name,
      namespace: opts.namespace ?? 'ns',
      annotations,
    },
    status: {
      ansibleWorkflowResult: {
        changed: false,
        failed: opts.status === 'error',
        status: opts.status ?? 'successful',
        url: opts.url,
        started: opts.started,
      },
    },
  }
}

describe('getLatestAnsibleHook', () => {
  it('returns the latest job by started when there are no workflows', () => {
    const older = ansibleJob({ name: 'prehookjob-old', started: '2021-01-01T00:00:00Z', url: '/job/old' })
    const newer = ansibleJob({ name: 'prehookjob-new', started: '2021-06-01T00:00:00Z', url: '/job/new' })
    const latest = getLatestAnsibleHook([older, newer], [], 'ns')
    expect(latest.prehook?.metadata.name).toBe('prehookjob-new')
    expect(latest.prehook?.result?.url).toBe('/job/new')
  })

  it('prefers a failed unstarted run over later started runs', () => {
    const failed = ansibleJob({ name: 'prehookjob-fail', status: 'error', url: undefined })
    const later = ansibleJob({ name: 'prehookjob-later', started: '2021-06-01T00:00:00Z', url: '/job/later' })
    const latest = getLatestAnsibleHook([failed, later], [], 'ns')
    expect(latest.prehook?.metadata.name).toBe('prehookjob-fail')
  })

  it('prefers a workflow with a URL over a job with a URL', () => {
    const job = ansibleJob({ url: '/#/jobs/playbook/1', started: '2021-06-01T00:00:00Z' })
    const workflow = ansibleWorkflow({ url: '/#/jobs/workflow/9', started: '2021-05-01T00:00:00Z' })
    const latest = getLatestAnsibleHook([job], [workflow], 'ns')
    expect(latest.prehook?.kind).toBe('AnsibleWorkflow')
    expect(latest.prehook?.result?.url).toBe('/#/jobs/workflow/9')
  })

  it('falls back to a job URL when the workflow has no URL', () => {
    const job = ansibleJob({ url: '/#/jobs/playbook/1', started: '2021-06-01T00:00:00Z' })
    const workflow = ansibleWorkflow({ status: 'error', started: '2021-06-02T00:00:00Z' })
    const latest = getLatestAnsibleHook([job], [workflow], 'ns')
    expect(latest.prehook?.kind).toBe('AnsibleJob')
    expect(latest.prehook?.result?.url).toBe('/#/jobs/playbook/1')
  })

  it('falls back to a workflow without a URL when no job has a URL', () => {
    const job = ansibleJob({ status: 'error', started: '2021-06-01T00:00:00Z' })
    const workflow = ansibleWorkflow({ status: 'error', started: '2021-06-02T00:00:00Z' })
    const latest = getLatestAnsibleHook([job], [workflow], 'ns')
    expect(latest.prehook?.kind).toBe('AnsibleWorkflow')
  })

  it('matches prehook and posthook by name prefix when jobtype is missing', () => {
    const pre = ansibleJob({ name: 'prehookjob-x', annotate: false, url: '/pre', started: '2021-06-01T00:00:00Z' })
    const post = ansibleWorkflow({
      name: 'posthookjob-y',
      annotate: false,
      url: '/post',
      started: '2021-06-01T00:00:00Z',
    })
    const latest = getLatestAnsibleHook([pre], [post], 'ns')
    expect(latest.prehook?.result?.url).toBe('/pre')
    expect(latest.posthook?.result?.url).toBe('/post')
  })

  it('ignores resources in other namespaces', () => {
    const other = ansibleWorkflow({ namespace: 'other', url: '/other', started: '2021-06-01T00:00:00Z' })
    const latest = getLatestAnsibleHook([], [other], 'ns')
    expect(latest.prehook).toBeUndefined()
    expect(latest.posthook).toBeUndefined()
  })
})

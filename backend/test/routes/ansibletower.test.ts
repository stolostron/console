/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parsePipedJsonBody } from '../../src/lib/body-parser'
import { ansiblePaths } from '../../src/routes/ansibletower'
import nock from 'nock'

const TOWER_HOST = 'https://ansible-tower.com'
const SECRET_NS = 'app-team'
const SECRET_NAME = 'tower-cred'

function nockCredentialSecret(host: string) {
  return nock(process.env.CLUSTER_API_URL)
    .get(`/api/v1/namespaces/${SECRET_NS}/secrets/${SECRET_NAME}`)
    .reply(200, {
      kind: 'Secret',
      apiVersion: 'v1',
      metadata: { name: SECRET_NAME, namespace: SECRET_NS },
      data: {
        host: Buffer.from(host).toString('base64'),
        token: Buffer.from('12345').toString('base64'),
      },
    })
}

describe(`ansibletower Route`, function () {
  it(`should list Ansible Automation controller Jobs`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200)
    nockCredentialSecret(TOWER_HOST)
    nock(TOWER_HOST).get(ansiblePaths[0]).reply(200, response)
    const res = await request('POST', '/ansibletower', {
      secretNamespace: SECRET_NS,
      secretName: SECRET_NAME,
      ansiblePath: ansiblePaths[0],
    })
    expect(res.statusCode).toEqual(200)
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(JSON.stringify(response))
  })

  it(`should reject body-supplied tower hostname`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200)
    const res = await request('POST', '/ansibletower', {
      towerHost: TOWER_HOST + ansiblePaths[0],
      token: '12345',
    })
    expect(res.statusCode).toEqual(400)
  })

  it(`should preserve the query string for paginated requests`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200)
    nockCredentialSecret(TOWER_HOST)
    nock(TOWER_HOST).get(ansiblePaths[0]).query({ page: '2', page_size: '20' }).reply(200, response)
    const res = await request('POST', '/ansibletower', {
      secretNamespace: SECRET_NS,
      secretName: SECRET_NAME,
      ansiblePath: `${ansiblePaths[0]}?page=2&page_size=20`,
    })
    expect(res.statusCode).toEqual(200)
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(JSON.stringify(response))
  })

  it(`should reject an external absolute URL in ansiblePath`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200)
    nockCredentialSecret(TOWER_HOST)
    const res = await request('POST', '/ansibletower', {
      secretNamespace: SECRET_NS,
      secretName: SECRET_NAME,
      ansiblePath: `https://evil.example.com${ansiblePaths[0]}`,
    })
    expect(res.statusCode).toEqual(400)
  })

  it(`should reject a network-path reference in ansiblePath`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200)
    nockCredentialSecret(TOWER_HOST)
    const res = await request('POST', '/ansibletower', {
      secretNamespace: SECRET_NS,
      secretName: SECRET_NAME,
      ansiblePath: `//evil.example.com${ansiblePaths[0]}`,
    })
    expect(res.statusCode).toEqual(400)
  })

  it(`should fail closed when caller cannot read the credential secret`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200)
    nock(process.env.CLUSTER_API_URL)
      .get(`/api/v1/namespaces/${SECRET_NS}/secrets/${SECRET_NAME}`)
      .reply(403, { kind: 'Status', apiVersion: 'v1', status: 'Failure', reason: 'Forbidden', code: 403 })
    const res = await request('POST', '/ansibletower', {
      secretNamespace: SECRET_NS,
      secretName: SECRET_NAME,
      ansiblePath: ansiblePaths[0],
    })
    expect(res.statusCode).toEqual(400)
  })

  it(`when bad things happen to Ansible Automation controller Jobs 1`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200)
    nockCredentialSecret(TOWER_HOST)
    nock(TOWER_HOST).get(ansiblePaths[0]).reply(200, response)
    const res = await request('POST', '/ansibletower', {
      secretNamespace: SECRET_NS,
      secretName: SECRET_NAME,
      ansiblePath: '/badPath',
    })
    expect(res.statusCode).toEqual(400)
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(JSON.stringify({}))
  })

  it(`when bad things happen to Ansible Automation controller Jobs 2`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200)
    nockCredentialSecret(TOWER_HOST)
    nock(TOWER_HOST).get(ansiblePaths[0]).reply(200, response)
    const res = await request('POST', '/ansibletower', {
      secretNamespace: SECRET_NS,
      secretName: SECRET_NAME,
      ansiblePath: '/badPath',
    })
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(JSON.stringify({}))
  })

  it(`when bad things happen to Ansible Automation controller Jobs 3`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(401)
    const res = await request('POST', '/ansibletower')
    expect(res.statusCode).toEqual(401)
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(JSON.stringify({}))
  })
})

const response = {
  count: 1,
  next: {},
  previous: {},
  results: [
    {
      id: 70,
      type: 'workflow_job_template',
      url: '/api/v2/workflow_job_templates/70/',
      related: {
        created_by: '/api/v2/users/2/',
        modified_by: '/api/v2/users/2/',
        last_job: '/api/v2/workflow_jobs/75010/',
        workflow_jobs: '/api/v2/workflow_job_templates/70/workflow_jobs/',
        schedules: '/api/v2/workflow_job_templates/70/schedules/',
        launch: '/api/v2/workflow_job_templates/70/launch/',
        webhook_key: '/api/v2/workflow_job_templates/70/webhook_key/',
        webhook_receiver: '',
        workflow_nodes: '/api/v2/workflow_job_templates/70/workflow_nodes/',
        labels: '/api/v2/workflow_job_templates/70/labels/',
        activity_stream: '/api/v2/workflow_job_templates/70/activity_stream/',
        notification_templates_started: '/api/v2/workflow_job_templates/70/notification_templates_started/',
        notification_templates_success: '/api/v2/workflow_job_templates/70/notification_templates_success/',
        notification_templates_error: '/api/v2/workflow_job_templates/70/notification_templates_error/',
        notification_templates_approvals: '/api/v2/workflow_job_templates/70/notification_templates_approvals/',
        access_list: '/api/v2/workflow_job_templates/70/access_list/',
        object_roles: '/api/v2/workflow_job_templates/70/object_roles/',
        survey_spec: '/api/v2/workflow_job_templates/70/survey_spec/',
        copy: '/api/v2/workflow_job_templates/70/copy/',
      },
      summary_fields: {
        last_job: {
          id: 75010,
          name: 'Demo Workflow Template',
          description: '',
          finished: '2023-01-03T19:57:48.114586Z',
          status: 'successful',
          failed: false,
        },
        last_update: {
          id: 75010,
          name: 'Demo Workflow Template',
          description: '',
          status: 'successful',
          failed: false,
        },
        created_by: { id: 2, username: 'admin', first_name: '', last_name: '' },
        modified_by: { id: 2, username: 'admin', first_name: '', last_name: '' },
        object_roles: {
          admin_role: {
            description: 'Can manage all aspects of the workflow job template',
            name: 'Admin',
            id: 275,
          },
          execute_role: { description: 'May run the workflow job template', name: 'Execute', id: 276 },
          read_role: { description: 'May view settings for the workflow job template', name: 'Read', id: 277 },
          approval_role: { description: 'Can approve or deny a workflow approval node', name: 'Approve', id: 278 },
        },
        user_capabilities: { edit: true, delete: true, start: true, schedule: true, copy: true },
        labels: { count: 0, results: {} },
        recent_jobs: [
          {
            id: 75010,
            status: 'successful',
            finished: '2023-01-03T19:57:48.114586Z',
            canceled_on: {},
            type: 'workflow_job',
          },
          {
            id: 75004,
            status: 'successful',
            finished: '2023-01-03T19:50:27.542857Z',
            canceled_on: {},
            type: 'workflow_job',
          },
          {
            id: 74998,
            status: 'successful',
            finished: '2023-01-03T19:29:12.585016Z',
            canceled_on: {},
            type: 'workflow_job',
          },
        ],
      },
      created: '2022-11-17T18:28:50.547286Z',
      modified: '2022-11-23T20:30:36.652164Z',
      name: 'Demo Workflow Template',
      description: '',
      last_job_run: '2023-01-03T19:57:48.114586Z',
      last_job_failed: false,
      next_job_run: {},
      status: 'successful',
      extra_vars: '',
      organization: {},
      survey_enabled: false,
      allow_simultaneous: false,
      ask_variables_on_launch: true,
      inventory: {},
      limit: {},
      scm_branch: {},
      ask_inventory_on_launch: true,
      ask_scm_branch_on_launch: false,
      ask_limit_on_launch: false,
      webhook_service: '',
      webhook_credential: {},
    },
  ],
}

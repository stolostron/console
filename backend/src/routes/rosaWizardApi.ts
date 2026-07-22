/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { jsonPost, jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getOcmServiceToken } from '../lib/getServiceToken'
import { getAuthenticatedToken } from '../lib/token'

const API_URL = 'https://api.openshift.com'

type OrgType = {
  organization: {
    created_at: string
    ebs_account_id: string
    external_id: string
    id: string
    kind: string
    name: string
  }
  service_account: boolean
  username: string
}

type Payload = {
  service_account_id: string
  service_account_secret: string
}

type WithAwsAccount = Payload & {
  aws_account_id: string
}

type ClusterNameCheck = Payload & {
  cluster_name: string
}

export async function getAwsAccountIds(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    try {
      let data: string = undefined
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })

      req.on('end', async () => {
        try {
          data = chucks.join('')
          const body: Payload = JSON.parse(data) as Payload

          const accessTokenSSO = await getOcmServiceToken(body.service_account_id, body.service_account_secret)
          const orgPath = `${API_URL}/api/accounts_mgmt/v1/current_account`
          const getOrg = (await jsonRequest(orgPath, accessTokenSSO).catch((err: Error) => {
            logger.error({ msg: 'Error gettting account info', error: err.message })
          })) as OrgType
          const orgId = getOrg.organization.id
          const accountPath = `${API_URL}/api/accounts_mgmt/v1/organizations/${orgId}/labels`

          const accReq = await jsonRequest(accountPath, accessTokenSSO).catch((err: Error) => {
            logger.error({ msg: 'Error gettting account info', error: err.message })
          })

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(accReq))
        } catch (err) {
          logger.error(err)
          respondInternalServerError(req, res)
        }
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

export async function getAwsBillingAccountIds(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    try {
      let data: string = undefined
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })

      req.on('end', async () => {
        try {
          data = chucks.join('')
          const body = JSON.parse(data) as Payload

          const accessTokenSSO = await getOcmServiceToken(body.service_account_id, body.service_account_secret)
          const orgPath = `${API_URL}/api/accounts_mgmt/v1/current_account`
          const getOrgID = (await jsonRequest(orgPath, accessTokenSSO).catch((err: Error) => {
            logger.error({ msg: 'Error gettting account info', error: err.message })
          })) as OrgType
          const accountPath = `${API_URL}/api/accounts_mgmt/v1/organizations/${getOrgID.organization.id}/quota_cost?fetchRelatedResources=true&fetchCloudAccounts=true`

          const accReq = await jsonRequest(accountPath, accessTokenSSO).catch((err: Error) => {
            logger.error({ msg: 'Error gettting account info', error: err.message })
          })

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(accReq))
        } catch (err) {
          logger.error(err)
          respondInternalServerError(req, res)
        }
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

export async function getWizardOIDCConfigs(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    try {
      let data: string = undefined
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })

      req.on('end', async () => {
        try {
          data = chucks.join('')
          const body = JSON.parse(data) as WithAwsAccount

          const accessTokenSSO = await getOcmServiceToken(body.service_account_id, body.service_account_secret)

          const accountPath = `${API_URL}/api/clusters_mgmt/v1/oidc_configs?search=aws.account_id=${body.aws_account_id} or aws.account_id=''`
          const request = await jsonRequest(accountPath, accessTokenSSO).catch((err: Error) => {
            logger.error({ msg: 'Failed to fetch account', error: err.message })
            return { error: err.message }
          })

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(request))
        } catch (err) {
          logger.error(err)
          respondInternalServerError(req, res)
        }
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

export async function getWizardCloudProviders(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    try {
      let data: string = undefined
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })

      req.on('end', async () => {
        try {
          data = chucks.join('')
          const body = JSON.parse(data) as Payload
          const accessTokenSSO = await getOcmServiceToken(body.service_account_id, body.service_account_secret)

          const cloudProvidersPath = `${API_URL}/api/clusters_mgmt/v1/cloud_providers?size=-1&fetchRegions=true`
          const request = await jsonRequest(cloudProvidersPath, accessTokenSSO).catch((err: Error) => {
            logger.error({ msg: 'Failed to fetch regions', error: err.message })
            return { error: err.message }
          })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(request))
        } catch (err) {
          logger.error(err)
          respondInternalServerError(req, res)
        }
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

export async function getClusterNameCheck(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    try {
      let data: string = undefined
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })

      req.on('end', async () => {
        try {
          data = chucks.join('')
          const body = JSON.parse(data) as ClusterNameCheck

          const clusterNameRegex = /^[a-z]([a-z0-9-]*[a-z0-9])?$/
          if (!body.cluster_name || !clusterNameRegex.test(body.cluster_name)) {
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Invalid cluster name format' }))
            return
          }

          const accessTokenSSO = await getOcmServiceToken(body.service_account_id, body.service_account_secret)
          const accountPath = `${API_URL}/api/clusters_mgmt/v1/clusters?method=get`
          const accReq = await jsonPost(
            accountPath,
            {
              size: 1,
              search: `name = '${body.cluster_name}'`,
            },
            accessTokenSSO
          ).catch((err: Error) => {
            logger.error({ msg: 'Error getting account info', error: err.message })
          })

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(accReq))
        } catch (err) {
          logger.error(err)
          respondInternalServerError(req, res)
        }
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

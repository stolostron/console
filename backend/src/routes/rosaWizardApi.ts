/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { jsonRequest } from '../lib/json-request'
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
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

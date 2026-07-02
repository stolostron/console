import { Http2ServerRequest, Http2ServerResponse } from "http2"
import { jsonRequest } from "../lib/json-request"
import { logger } from "../lib/logger"
import { respondInternalServerError } from "../lib/respond"
import { getOcmServiceToken } from "../lib/getServiceToken"

const API_URL = 'https://api.openshift.com'

export async function getAwsAccountIds(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  try {
    let data: string = undefined
    const chucks: string[] = []
    req.on('data', (chuck: any) => {
      chucks.push(chuck)
    })

    req.on('end', async () => {
      data = chucks.join()
      const body = JSON.parse(data)

    const accessTokenSSO = await getOcmServiceToken(body.service_account_id, body.service_account_secret);
    const orgPath = `${API_URL}/api/accounts_mgmt/v1/current_account`;
    const getOrgID: any = await jsonRequest(orgPath, accessTokenSSO).catch((err: Error) => {
        logger.error({ msg: 'Error gettting account info', error: err.message })
    });      const accountPath =
        `${API_URL}/api/accounts_mgmt/v1/organizations/${getOrgID.organization.id}/labels`

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

export async function getAwsBillingAccountIds(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  try {
    let data: string = undefined
    const chucks: string[] = []
    req.on('data', (chuck: any) => {
      chucks.push(chuck)
    })

    req.on('end', async () => {
      data = chucks.join()
      const body = JSON.parse(data)

 const accessTokenSSO = await getOcmServiceToken(body.service_account_id, body.service_account_secret);
    const orgPath = `${API_URL}/api/accounts_mgmt/v1/current_account`;
    const getOrgID: any = await jsonRequest(orgPath, accessTokenSSO).catch((err: Error) => {
        logger.error({ msg: 'Error gettting account info', error: err.message })
    });      const accountPath =
        `${API_URL}/api/accounts_mgmt/v1/organizations/${getOrgID.organization.id}/quota_cost?fetchRelatedResources=true&fetchCloudAccounts=true`

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
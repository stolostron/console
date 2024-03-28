/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { jsonPost, jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import { IResource } from '../resources/resource'
import { ResourceList } from '../resources/resource-list'

interface Credential {
  auths: {
    'cloud.openshift.com': {
      auth: string
    }
  }
}

interface Secret extends IResource {
  data?: {
    [key: string]: string
  }
}

interface UpgradeRiskBody {
  clusterIds: string[]
}

export async function upgradeRiskPredictions(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const serviceAccountToken = getServiceAccountToken()

    try {
      // console-mce ClusterRole does not allow for GET on secrets. Have to list in a namespace
      const secretPath = process.env.CLUSTER_API_URL + '/api/v1/namespaces/openshift-config/secrets'
      const crcToken: string = await jsonRequest(secretPath, serviceAccountToken)
        .then((response: ResourceList<Secret>) => {
          const pullSecret = response.items.find((secret) => secret.metadata.name === 'pull-secret')
          const dockerconfigjson = pullSecret.data['.dockerconfigjson'] ?? ''
          const decodedToken = JSON.parse(Buffer.from(dockerconfigjson, 'base64').toString('ascii')) as Credential
          return decodedToken?.auths?.['cloud.openshift.com']?.auth ?? ''
        })
        .catch((err: Error): undefined => {
          logger.error({ msg: 'Error getting pull-secret in namespace openshift-config', error: err.message })
          return undefined
        })

      let data: string = undefined
      const chucks: string[] = []
      req.on('data', (chuck: string) => {
        chucks.push(chuck)
      })
      req.on('end', async () => {
        data = chucks.join()
        const body = JSON.parse(data) as UpgradeRiskBody

        // acm-operator version in User-Agent header doesn't matter - CCX only uses the 'acm-operator' string to identify the product initiating the req
        // https://github.com/RedHatInsights/insights-results-smart-proxy/blob/master/server/router_utils.go#L168
        const userAgent = 'acm-operator/v2.10.0 cluster/acm-hub'
        const insightsPath = 'https://console.redhat.com/api/insights-results-aggregator/v2/upgrade-risks-prediction'
        let proxyAgent: HttpsProxyAgent<string> = undefined
        if (process.env.HTTPS_PROXY) {
          proxyAgent = new HttpsProxyAgent(process.env.HTTPS_PROXY)
        }

        // create array of clusterIds with length of 100
        const clusterIds = body.clusterIds.reduce((resultArray: string[][], item, index) => {
          const chunkIndex = Math.floor(index / 100)
          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
          }
          resultArray[chunkIndex].push(item)
          return resultArray
        }, [])

        // Create req for each 100 id chunk
        const reqs = clusterIds.map((idChunk: string[]) => {
          return jsonPost(insightsPath, { clusters: idChunk }, crcToken, userAgent, proxyAgent).catch(
            (err: Error): undefined => {
              logger.error({ msg: 'Error getting cluster upgrade risk predictions', error: err.message })
              return undefined
            }
          )
        })

        await Promise.all(reqs).then((results) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(results))
        })
      })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  }
}

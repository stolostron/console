/* istanbul ignore file */
import * as Router from 'find-my-way'
import { respondOK } from './lib/respond'
import { kubernetesProxyRoute } from './routes/kubernetes-proxy'

export const router = Router<Router.HTTPVersion.V2>()
router.get('/ping', respondOK)
router.get('/api/*', kubernetesProxyRoute as Router.Handler<Router.HTTPVersion.V2>)
router.get('/apis/*', kubernetesProxyRoute as Router.Handler<Router.HTTPVersion.V2>)

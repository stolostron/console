/* istanbul ignore file */
import * as Router from 'find-my-way'
import { respondOK } from './lib/respond'
import { header } from './routes/header'
import { login, loginCallback } from './routes/oauth'
import { proxy } from './routes/proxy'
import { search } from './routes/search'
import { serve } from './routes/serve'
import { upgrade } from './routes/upgrade'

export const router = Router<Router.HTTPVersion.V2>()
router.get('/readinessProbe', respondOK)
router.get('/ping', respondOK)
router.all(`/api/*`, proxy)
router.all(`/apis/*`, proxy)
router.get(`/login`, login)
router.get(`/login/callback?*`, loginCallback)
router.get(`/header`, header)
router.get(`/multicloud/header/*`, header)
router.post(`/proxy/search`, search)
router.post(`/upgrade`, upgrade)
router.get(`/*`, serve)

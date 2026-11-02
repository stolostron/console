/* Copyright Contributors to the Open Cluster Management project */

import { BACKEND_URL } from '../constants'
import { createSearchClient } from './createSearchClient'

export const searchClient = createSearchClient(() => `${BACKEND_URL}/proxy/search`)

/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { createSearchClient } from '@stolostron/multicluster-sdk/lib/internal/search/createSearchClient'
import { getBackendUrl } from '../../../resources/utils'

export const searchClient = createSearchClient(() => `${getBackendUrl()}/proxy/search`)

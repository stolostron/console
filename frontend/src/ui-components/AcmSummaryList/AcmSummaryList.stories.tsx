/* Copyright Contributors to the Open Cluster Management project */

import { MemoryRouter } from 'react-router-dom-v5-compat'
import { AcmSummaryList } from './AcmSummaryList'

export default {
  title: 'SummaryList',
  component: AcmSummaryList,
}

export const SummaryList = () => {
  const list = [
    { isPrimary: true, description: 'Applications', count: 3, href: '/search?query=apps' },
    { description: 'Clusters', count: 2, href: '/search?query=clusters' },
    { description: 'Kubernetes type', count: 1 },
    { description: 'Region', count: 1 },
    { description: 'Nodes', count: 3, href: '/search?query=nodes' },
    { description: 'Pods', count: 3, href: '/search?query=pods', isLoading: true },
  ]
  return (
    <MemoryRouter>
      <AcmSummaryList title="Summary" list={list} />
    </MemoryRouter>
  )
}

export const SummaryListSkeleton = () => {
  return (
    <MemoryRouter>
      <AcmSummaryList loading={true} title="Summary" list={[]} />
    </MemoryRouter>
  )
}

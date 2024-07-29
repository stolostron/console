/* Copyright Contributors to the Open Cluster Management project */
import { CodeRef } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import * as React from 'react'

export type OverviewTabProps = {
  tabTitle: string
  component: CodeRef<React.ComponentType>
}

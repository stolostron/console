/* Copyright Contributors to the Open Cluster Management project */

import { Fragment } from 'react'
import { AcmDescriptionList } from './AcmDescriptionList'
import { AcmLabels } from '../AcmLabels/AcmLabels'
import { CheckCircleIcon, PencilAltIcon } from '@patternfly/react-icons'
import { Button, ButtonVariant } from '@patternfly/react-core'

export default {
  title: 'DescriptionList',
  component: AcmDescriptionList,
}

const leftItems = [
  { key: 'Cluster ID', value: 'managed-cluster' },
  {
    key: 'Status',
    value: (
      <Fragment>
        <CheckCircleIcon color="var(--pf-global--success-color--100)" /> Ready
      </Fragment>
    ),
  },
  {
    key: 'Distribution version',
    value: (
      <Fragment>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        OpenShift 4.5.11 (<a href="#">Upgrade available</a>)
      </Fragment>
    ),
  },
  {
    key: 'Labels',
    keyAction: (
      <Button variant={ButtonVariant.plain} aria-label="pencil">
        <PencilAltIcon color="var(--pf-global--primary-color--100)" />
      </Button>
    ),
    value: (
      <AcmLabels labels={['cloud=Amazon', 'clusterID=1b1asdfd8c-1a94-4fd3-a05c-f34easfe5f3', 'vendor=OpenShift']} />
    ),
  },
]

const rightItems = [
  { key: 'Cluster API address', value: 'https://api.managed-cluster.dev.foobar.com:6443' },
  {
    key: 'Console URL',
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    value: <a href="#">https://console-openshift-console.apps.managed-cluster.dev.foobar.com</a>,
  },
  { key: 'Username/password', value: undefined },
]

export const DescriptionList = () => {
  return <AcmDescriptionList title="Details" leftItems={leftItems} rightItems={rightItems} />
}

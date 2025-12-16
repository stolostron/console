/* Copyright Contributors to the Open Cluster Management project */

import { Button, ButtonVariant, Icon } from '@patternfly/react-core'
import { CheckCircleIcon, PencilAltIcon } from '@patternfly/react-icons'
import { Fragment } from 'react'
import { AcmLabels } from '../AcmLabels/AcmLabels'
import { AcmDescriptionList } from './AcmDescriptionList'

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
        <Icon status="success">
          <CheckCircleIcon />
        </Icon>{' '}
        Ready
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
      <Button
        icon={<PencilAltIcon color="var(--pf-t--color--blue--50)" />}
        variant={ButtonVariant.plain}
        aria-label="pencil"
      />
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

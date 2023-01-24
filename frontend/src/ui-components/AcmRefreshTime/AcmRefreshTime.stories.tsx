/* Copyright Contributors to the Open Cluster Management project */

import { Meta } from '@storybook/react'

import { AcmPageCard } from '../AcmPage/AcmPage'
import { AcmRefreshTime } from './AcmRefreshTime'

const meta: Meta = {
  title: 'RefreshTime',
  component: AcmRefreshTime,
  argTypes: {},
}
export default meta

const timestamp = 'Wed Jan 06 2021 00:00:00 GMT+0000 (Coordinated Universal Time)'

export const RefreshTime = () => (
  <AcmPageCard>
    <AcmRefreshTime timestamp={timestamp} />
  </AcmPageCard>
)
export const RefreshTimeReloading = () => (
  <AcmPageCard>
    <AcmRefreshTime timestamp={timestamp} reloading={true} />
  </AcmPageCard>
)

/* Copyright Contributors to the Open Cluster Management project */

import { AcmPageCard } from '../AcmPage/AcmPage'
import { AcmLabels } from './AcmLabels'

export default {
  title: 'Labels',
  component: AcmLabels,
}

export const Labels = () => (
  <AcmPageCard>
    <AcmLabels
      labels={{
        abc: '123',
        empty: '',
        test: 'this is a test of a really long label. it is really long. abcdefghijklmnopqrstuvwxyz',
        hidden: 'this is a hidden label',
        hidden2: 'this is another hidden label',
      }}
      collapse={['hidden', 'hidden2']}
    />
  </AcmPageCard>
)

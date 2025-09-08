// Copyright Contributors to the Open Cluster Management project

import { getLabels } from './ControlDataPlacement'

describe('getLabels normal operation', () => {
  const clusterSelector = {
    matchExpressions: [
      {
        key: 'name',
        operator: 'In',
        values: ['local-cluster'],
      },
      {
        operator: 'In',
        values: ['Amazon'],
      },
      {
        key: 'cloud',
        values: ['Amazon'],
      },
      {
        key: 'cloud',
        operator: 'In',
      },
      {
        key: 'local-cluster',
        operator: 'DoesNotExist',
      },
      {
        key: 'app',
        operator: 'Exists',
      },
    ],
  }

  it('should get labels from clusterselector', () => {
    expect(getLabels(clusterSelector)).toEqual(
      'name "In" local-cluster; #invalidExpr; #invalidExpr; #invalidExpr; local-cluster "DoesNotExist"; app "Exists"'
    )
  })
})

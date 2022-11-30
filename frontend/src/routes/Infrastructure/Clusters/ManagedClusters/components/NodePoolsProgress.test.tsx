/* Copyright Contributors to the Open Cluster Management project */

import { Spinner } from '@patternfly/react-core'
import { CheckCircleIcon, InProgressIcon } from '@patternfly/react-icons'
import { getNodePoolsStatus, getNodePoolStatus } from './NodePoolsProgress'

const t = (string: string) => {
    return string
}

const resultPending = {
    icon: <InProgressIcon color="currentColor" noVerticalAlign={false} size="sm" />,
    text: 'Not ready',
    type: 'pending',
}

const resultOK = {
    icon: <CheckCircleIcon color="#3e8635" noVerticalAlign={false} size="sm" />,
    text: 'Ready',
    type: 'ok',
}

describe('NodePoolsProgress getNodePoolStatus no status', () => {
    it('should call getNodePoolStatus no status', async () => {
        expect(
            getNodePoolStatus(
                {
                    spec: {
                        clusterName: 'myNodePool',
                        replicas: 1,
                        management: { upgradeType: 'InPlace' },
                        platform: { type: 'Agent' },
                        release: {
                            image: 'somerandomimage',
                        },
                    },
                },
                t
            )
        ).toEqual(resultPending)
    })
})

describe('NodePoolsProgress getNodePoolStatus no conditions', () => {
    it('should call getNodePoolStatus no conditions', async () => {
        expect(
            getNodePoolStatus(
                {
                    spec: {
                        clusterName: 'myNodePool',
                        replicas: 1,
                        management: { upgradeType: 'InPlace' },
                        platform: { type: 'Agent' },
                        release: {
                            image: 'somerandomimage',
                        },
                    },
                    status: {},
                },
                t
            )
        ).toEqual(resultPending)
    })
})

describe('NodePoolsProgress getNodePoolStatus conditions empty array', () => {
    it('should call getNodePoolStatus empty array', async () => {
        expect(
            getNodePoolStatus(
                {
                    spec: {
                        clusterName: 'myNodePool',
                        replicas: 1,
                        management: { upgradeType: 'InPlace' },
                        platform: { type: 'Agent' },
                        release: {
                            image: 'somerandomimage',
                        },
                    },
                    status: { conditions: [] },
                },
                t
            )
        ).toEqual(resultPending)
    })
})

describe('NodePoolsProgress getNodePoolStatus no Ready condition', () => {
    it('should call getNodePoolStatus no Ready condition', async () => {
        expect(
            getNodePoolStatus(
                {
                    spec: {
                        clusterName: 'myNodePool',
                        replicas: 1,
                        management: { upgradeType: 'InPlace' },
                        platform: { type: 'Agent' },
                        release: {
                            image: 'somerandomimage',
                        },
                    },
                    status: {
                        conditions: [
                            {
                                lastTransitionTime: '2022-08-31T18:55:05Z',
                                observedGeneration: 3,
                                reason: 'AsExpected',
                                message: '',
                                status: 'False',
                                type: 'AutoscalingEnabled',
                            },
                        ],
                    },
                },
                t
            )
        ).toEqual(resultPending)
    })
})

describe('NodePoolsProgress getNodePoolStatus Ready false', () => {
    it('should call getNodePoolStatus Ready false', async () => {
        expect(
            getNodePoolStatus(
                {
                    spec: {
                        clusterName: 'myNodePool',
                        replicas: 1,
                        management: { upgradeType: 'InPlace' },
                        platform: { type: 'Agent' },
                        release: {
                            image: 'somerandomimage',
                        },
                    },
                    status: {
                        conditions: [
                            {
                                lastTransitionTime: '2022-08-31T18:55:05Z',
                                observedGeneration: 3,
                                reason: 'AsExpected',
                                message: '',
                                status: 'False',
                                type: 'Ready',
                            },
                        ],
                    },
                },
                t
            )
        ).toEqual(resultPending)
    })
})

describe('NodePoolsProgress getNodePoolStatus Ready true', () => {
    it('should call getNodePoolStatus Ready true', async () => {
        expect(
            getNodePoolStatus(
                {
                    spec: {
                        clusterName: 'myNodePool',
                        replicas: 1,
                        management: { upgradeType: 'InPlace' },
                        platform: { type: 'Agent' },
                        release: {
                            image: 'somerandomimage',
                        },
                    },
                    status: {
                        conditions: [
                            {
                                lastTransitionTime: '2022-08-31T18:55:05Z',
                                observedGeneration: 3,
                                reason: 'AsExpected',
                                message: '',
                                status: 'True',
                                type: 'Ready',
                            },
                        ],
                    },
                },
                t
            )
        ).toEqual(resultOK)
    })
})

describe('NodePoolsProgress getNodePoolsStatus pending', () => {
    const nps: any = [
        {
            metadata: {
                uid: '53d85cf8-ad72-4464-892a-f3b8be5162cb',
                name: 'np1',
                namespace: 'np1',
            },
            status: {
                conditions: [
                    {
                        lastTransitionTime: '2022-08-31T18:55:05Z',
                        observedGeneration: 3,
                        reason: 'AsExpected',
                        status: 'False',
                        type: 'Ready',
                    },
                ],
            },
        },
        {
            metadata: {
                name: 'np2',
                namespace: 'np2',
            },
            status: {
                conditions: [
                    {
                        lastTransitionTime: '2022-08-31T18:55:05Z',
                        observedGeneration: 3,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'Ready',
                    },
                ],
            },
        },
        {
            status: {
                conditions: [
                    {
                        lastTransitionTime: '2022-08-31T18:55:05Z',
                        observedGeneration: 3,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'Ready',
                    },
                ],
            },
        },
    ]
    it('should process nodepools', async () => {
        expect(getNodePoolsStatus(nps, t)).toEqual(<Spinner size="md" />)
    })
})

describe('NodePoolsProgress getNodePoolsStatus ready', () => {
    const nps: any = [
        {
            metadata: {
                name: 'np2',
                namespace: 'np2',
            },
            status: {
                conditions: [
                    {
                        lastTransitionTime: '2022-08-31T18:55:05Z',
                        observedGeneration: 3,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'Ready',
                    },
                ],
            },
        },
    ]
    it('should process nodepools', async () => {
        expect(getNodePoolsStatus(nps, t)).toEqual(<CheckCircleIcon color="#3e8635" />)
    })
})

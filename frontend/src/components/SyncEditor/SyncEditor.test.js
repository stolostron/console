/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import { SyncEditor } from './SyncEditor'
import { render } from '@testing-library/react'
import schema from '../../routes/Governance/policies/schema.json'

describe('SyncEditor component', () => {
    afterAll(() => {
        jest.resetAllMocks()
    })

    it('renders as expected', () => {
        const update = jest.fn()
        const Component = (props) => {
            return <SyncEditor {...props} />
        }
        const { asFragment } = render(
            <Component
                editorTitle={'Policy YAML'}
                variant="toolbar"
                resources={[
                    {
                        apiVersion: 'policy.open-cluster-management.io/v1',
                        kind: 'Policy',
                        metadata: {
                            name: 'policy-pod',
                            namespace: 'default',
                        },
                        spec: {
                            dependencies: [
                                {
                                    apiVersion: 'policy.open-cluster-management.io/v1',
                                    compliance: 'Compliant',
                                    kind: 'Policy',
                                    name: 'case-test-policy',
                                    namespace: 'default',
                                },
                            ],
                            disabled: false,
                            'policy-templates': [
                                {
                                    objectDefinition: {
                                        apiVersion: 'policy.open-cluster-management.io/v1',
                                        kind: 'ConfigurationPolicy',
                                        metadata: {
                                            name: 'policy-pod-1',
                                        },
                                        spec: {},
                                    },
                                },
                            ],
                        },
                    },
                ]}
                schema={schema}
                onEditorChange={(changes) => {
                    update(changes?.resources)
                }}
                mock={true}
                readonly={true}
            />
        )

        expect(asFragment()).toMatchSnapshot()
    })
    it('renders as expected when a dependency compliance is invalid', () => {
        const update = jest.fn()
        const Component = (props) => {
            return <SyncEditor {...props} />
        }
        const { asFragment } = render(
            <Component
                editorTitle={'Policy YAML'}
                variant="toolbar"
                resources={[
                    {
                        apiVersion: 'policy.open-cluster-management.io/v1',
                        kind: 'Policy',
                        metadata: {
                            name: 'policy-pod',
                            namespace: 'default',
                        },
                        spec: {
                            dependencies: [
                                {
                                    apiVersion: 'policy.open-cluster-management.io/v1',
                                    compliance: 'notAComplianceType',
                                    kind: 'Policy',
                                    name: 'case-test-policy',
                                    namespace: 'default',
                                },
                            ],
                            disabled: false,
                            'policy-templates': [
                                {
                                    objectDefinition: {
                                        apiVersion: 'policy.open-cluster-management.io/v1',
                                        kind: 'ConfigurationPolicy',
                                        metadata: {
                                            name: 'policy-pod-1',
                                        },
                                        spec: {},
                                    },
                                },
                            ],
                        },
                    },
                ]}
                schema={schema}
                onEditorChange={(changes) => {
                    update(changes?.resources)
                }}
                mock={true}
                readonly={true}
            />
        )

        expect(asFragment()).toMatchSnapshot()
    })
    it('renders as expected when a dependency namespace is invalid', () => {
        const update = jest.fn()
        const Component = (props) => {
            return <SyncEditor {...props} />
        }
        const { asFragment } = render(
            <Component
                editorTitle={'Policy YAML'}
                variant="toolbar"
                resources={[
                    {
                        apiVersion: 'policy.open-cluster-management.io/v1',
                        kind: 'Policy',
                        metadata: {
                            name: 'policy-pod',
                            namespace: 'default',
                        },
                        spec: {
                            dependencies: [
                                {
                                    apiVersion: 'policy.open-cluster-management.io/v1',
                                    compliance: 'Compliant',
                                    kind: 'ConfigurationPolicy',
                                    name: 'case-test-policy',
                                    namespace: 'default',
                                },
                            ],
                            disabled: false,
                            'policy-templates': [
                                {
                                    objectDefinition: {
                                        apiVersion: 'policy.open-cluster-management.io/v1',
                                        kind: 'ConfigurationPolicy',
                                        metadata: {
                                            name: 'policy-pod-1',
                                        },
                                        spec: {},
                                    },
                                },
                            ],
                        },
                    },
                ]}
                schema={schema}
                onEditorChange={(changes) => {
                    update(changes?.resources)
                }}
                mock={true}
                readonly={true}
            />
        )

        expect(asFragment()).toMatchSnapshot()
    })
})

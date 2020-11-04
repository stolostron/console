import React from 'react'
import { Route, MemoryRouter } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportClusterPage } from './ImportCluster'
import { Project, ProjectRequest, projectRequests } from '../../../lib/Project'
import { ManagedCluster, managedClusters } from '../../../lib/ManagedCluster'
import { KlusterletAddonConfig, klusterletAddonConfigs } from '../../../lib/KlusterletAddonConfig'
import { nockCreate } from '../../../lib/nock-util'
import * as nock from 'nock'

const mockProject: ProjectRequest = {"metadata":{"name":"foobar"}}
const mockManagedCluster: ManagedCluster = {"apiVersion":"cluster.open-cluster-management.io/v1","kind":"ManagedCluster","metadata":{"name":"foobar","labels":{"cloud":"auto-detect","vendor":"auto-detect","name":"foobar","environment":""}},"spec":{"hubAcceptsClient":true}}
const mockKAC: KlusterletAddonConfig = {"apiVersion":"agent.open-cluster-management.io/v1","kind":"KlusterletAddonConfig","metadata":{"name":"foobar","namespace":"foobar"},"spec":{"clusterName":"foobar","clusterNamespace":"foobar","clusterLabels":{"cloud":"auto-detect","vendor":"auto-detect","name":"foobar","environment":""},"applicationManager":{"enabled":true},"policyController":{"enabled":true},"searchCollector":{"enabled":true},"certPolicyController":{"enabled":true},"iamPolicyController":{"enabled":true},"version":"2.1.0"}}

const mockProjectResponse: Project = {"kind":"Project","apiVersion":"project.openshift.io/v1","metadata":{"name":"foobar","selfLink":"/apis/project.openshift.io/v1/projectrequests/foobar","uid":"f628792b-79d2-4c41-a07a-c7f1afac5e8a","resourceVersion":"16251055","creationTimestamp":"2020-11-04T15:26:07Z","annotations":{"openshift.io/description":"","openshift.io/display-name":"","openshift.io/requester":"kube:admin","openshift.io/sa.scc.mcs":"s0:c25,c15","openshift.io/sa.scc.supplemental-groups":"1000630000/10000","openshift.io/sa.scc.uid-range":"1000630000/10000"},"managedFields":[{"manager":"cluster-policy-controller","operation":"Update","apiVersion":"v1","time":"2020-11-04T15:26:07Z","fieldsType":"FieldsV1","fieldsV1":{"f:metadata":{"f:annotations":{"f:openshift.io/sa.scc.mcs":{},"f:openshift.io/sa.scc.supplemental-groups":{},"f:openshift.io/sa.scc.uid-range":{}}}}},{"manager":"openshift-apiserver","operation":"Update","apiVersion":"v1","time":"2020-11-04T15:26:07Z","fieldsType":"FieldsV1","fieldsV1":{"f:metadata":{"f:annotations":{".":{},"f:openshift.io/description":{},"f:openshift.io/display-name":{},"f:openshift.io/requester":{}}},"f:status":{"f:phase":{}}}},{"manager":"openshift-controller-manager","operation":"Update","apiVersion":"v1","time":"2020-11-04T15:26:07Z","fieldsType":"FieldsV1","fieldsV1":{"f:spec":{"f:finalizers":{}}}}]},"spec":{"finalizers":["kubernetes"]},"status":{"phase":"Active"}}
const mockManagedClusterResponse: ManagedCluster = {"apiVersion":"cluster.open-cluster-management.io/v1","kind":"ManagedCluster","metadata":{"creationTimestamp":"2020-11-04T15:26:08Z","generation":1,"labels":{"cloud":"auto-detect","environment":"","name":"foobar","vendor":"auto-detect"},"managedFields":[{"apiVersion":"cluster.open-cluster-management.io/v1","fieldsType":"FieldsV1","fieldsV1":{"f:metadata":{"f:labels":{".":{},"f:cloud":{},"f:environment":{},"f:name":{},"f:vendor":{}}},"f:spec":{".":{},"f:hubAcceptsClient":{}}},"manager":"axios","operation":"Update","time":"2020-11-04T15:26:07Z"}],"name":"foobar","resourceVersion":"16251075","selfLink":"/apis/cluster.open-cluster-management.io/v1/managedclusters/foobar","uid":"e60ef618-324b-49d4-8a28-48839c546565"},"spec":{"hubAcceptsClient":true,"leaseDurationSeconds":60}}
const mockKACResponse: KlusterletAddonConfig = {"apiVersion":"agent.open-cluster-management.io/v1","kind":"KlusterletAddonConfig","metadata":{"creationTimestamp":"2020-11-04T15:26:08Z","generation":1,"managedFields":[{"apiVersion":"agent.open-cluster-management.io/v1","fieldsType":"FieldsV1","fieldsV1":{"f:spec":{".":{},"f:applicationManager":{".":{},"f:enabled":{}},"f:certPolicyController":{".":{},"f:enabled":{}},"f:clusterLabels":{".":{},"f:cloud":{},"f:environment":{},"f:name":{},"f:vendor":{}},"f:clusterName":{},"f:clusterNamespace":{},"f:iamPolicyController":{".":{},"f:enabled":{}},"f:policyController":{".":{},"f:enabled":{}},"f:searchCollector":{".":{},"f:enabled":{}},"f:version":{}}},"manager":"axios","operation":"Update","time":"2020-11-04T15:26:08Z"}],"name":"foobar","namespace":"foobar","resourceVersion":"16251082","selfLink":"/apis/agent.open-cluster-management.io/v1/namespaces/foobar/klusterletaddonconfigs/foobar","uid":"fba00095-386b-4d68-b2da-97003bc6a987"},"spec":{"applicationManager":{"enabled":true},"certPolicyController":{"enabled":true},"clusterLabels":{"cloud":"auto-detect","environment":"","name":"foobar","vendor":"auto-detect"},"clusterName":"foobar","clusterNamespace":"foobar","iamPolicyController":{"enabled":true},"policyController":{"enabled":true},"searchCollector":{"enabled":true},"version":"2.1.0"}}

describe('ImportCluster', () => {
    const Component = () => {
        return (
            <MemoryRouter initialEntries={['/cluster-management/clusters/import']}>
                <Route path='/cluster-management/clusters/import'>
                    <ImportClusterPage />
                </Route>
            </MemoryRouter>
        )
    }
    test('renders', () => {
        const { getByTestId } = render(<Component />)
        expect(getByTestId('import-cluster-form')).toBeInTheDocument()
        expect(getByTestId('clusterName-label')).toBeInTheDocument()
        expect(getByTestId('cloudLabel-label')).toBeInTheDocument()
        expect(getByTestId('environmentLabel-label')).toBeInTheDocument()
        expect(getByTestId('additionalLabels-label')).toBeInTheDocument()
    })
    // test('can create resources', async () => {
    //     const projectNock = nockCreate(projectRequests, mockProject, mockProjectResponse)
    //     const managedClusterNock = nockCreate(managedClusters, mockManagedCluster, mockManagedClusterResponse)
    //     const kacNock = nockCreate(klusterletAddonConfigs, mockKAC, mockKACResponse)

    //     const { getByTestId } = render(<Component />)
    //     userEvent.type(getByTestId('clusterName-label'), 'foobar')
    //     userEvent.click(getByTestId('submit'))

    //     await waitFor(() => expect(projectNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(managedClusterNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(kacNock.isDone()).toBeTruthy())
    // })
})

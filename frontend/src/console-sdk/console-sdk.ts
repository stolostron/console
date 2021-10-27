/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import * as Apollo from '@apollo/client'
import { gql } from '@apollo/client'
export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string
    String: string
    Boolean: boolean
    Int: number
    Float: number
    /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
    JSON: any
    /** The `Upload` scalar type represents a file upload. */
    Upload: any
}

export type Application = K8sObject & {
    metadata?: Maybe<Metadata>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    app?: Maybe<Scalars['JSON']>
    subscriptions?: Maybe<Array<Maybe<Scalars['JSON']>>>
}

export type ApplicationNamespace = {
    metadata?: Maybe<Metadata>
    raw?: Maybe<Scalars['JSON']>
}

export type PlacementPolicy = K8sObject & {
    clusterLabels?: Maybe<Scalars['JSON']>
    metadata?: Maybe<Metadata>
    raw?: Maybe<Scalars['JSON']>
    clusterReplicas?: Maybe<Scalars['Int']>
    resourceSelector?: Maybe<Scalars['JSON']>
    status?: Maybe<Scalars['JSON']>
}

export type PlacementBinding = K8sObject & {
    metadata?: Maybe<Metadata>
    raw?: Maybe<Scalars['JSON']>
    placementRef?: Maybe<Subject>
    subjects?: Maybe<Array<Maybe<Subject>>>
}

export type Subject = {
    apiGroup?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
}

export type Secret = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type Channel = K8sObject & {
    namespace?: Maybe<Scalars['String']>
    type?: Maybe<Scalars['String']>
    objectPath?: Maybe<Scalars['String']>
    secretRef?: Maybe<Scalars['String']>
    configRef?: Maybe<Scalars['String']>
    metadata?: Maybe<Metadata>
    raw?: Maybe<Scalars['JSON']>
    selector?: Maybe<Scalars['JSON']>
    gates?: Maybe<Scalars['JSON']>
    sourceNamespaces?: Maybe<Scalars['JSON']>
}

export type Subscription = K8sObject & {
    namespace?: Maybe<Scalars['String']>
    sourceNamespace?: Maybe<Scalars['String']>
    source?: Maybe<Scalars['String']>
    channel?: Maybe<Scalars['String']>
    package?: Maybe<Scalars['String']>
    packageFilter?: Maybe<Scalars['JSON']>
    packageOverrides?: Maybe<Scalars['JSON']>
    placement?: Maybe<Scalars['JSON']>
    metadata?: Maybe<Metadata>
    raw?: Maybe<Scalars['JSON']>
}

export type PlacementRule = K8sObject & {
    namespace?: Maybe<Scalars['String']>
    metadata?: Maybe<Metadata>
    raw?: Maybe<Scalars['JSON']>
}

export type Cluster = K8sObject & {
    availableVersions?: Maybe<Array<Maybe<Scalars['String']>>>
    clusterip?: Maybe<Scalars['String']>
    consoleURL?: Maybe<Scalars['String']>
    desiredVersion?: Maybe<Scalars['String']>
    distributionVersion?: Maybe<Scalars['String']>
    isHive?: Maybe<Scalars['Boolean']>
    isManaged?: Maybe<Scalars['Boolean']>
    metadata?: Maybe<Metadata>
    nodes?: Maybe<Scalars['Int']>
    serverAddress?: Maybe<Scalars['String']>
    status?: Maybe<Scalars['String']>
    k8sVersion?: Maybe<Scalars['String']>
    upgradeFailed?: Maybe<Scalars['Boolean']>
    adminKubeconfigSecret?: Maybe<Scalars['String']>
    adminPasswordSecret?: Maybe<Scalars['String']>
    installConfigSecret?: Maybe<Scalars['String']>
}

export type ClusterImageSet = {
    name?: Maybe<Scalars['String']>
    releaseImage?: Maybe<Scalars['String']>
    channel?: Maybe<Scalars['String']>
    visible?: Maybe<Scalars['String']>
    platformAws?: Maybe<Scalars['String']>
    platformGcp?: Maybe<Scalars['String']>
    platformAzure?: Maybe<Scalars['String']>
    platformBmc?: Maybe<Scalars['String']>
    platformVmware?: Maybe<Scalars['String']>
}

export type ClusterAddon = {
    addOnResource?: Maybe<AddOnResource>
    metadata?: Maybe<Metadata>
    status?: Maybe<AddOnStatus>
}

export type AddOnResource = {
    name?: Maybe<Scalars['String']>
    group?: Maybe<Scalars['String']>
    resource?: Maybe<Scalars['String']>
    description?: Maybe<Scalars['String']>
}

export type AddOnStatus = {
    message?: Maybe<Scalars['String']>
    reason?: Maybe<Scalars['String']>
    status?: Maybe<Scalars['String']>
    type?: Maybe<Scalars['String']>
}

export type Compliance = K8sObject & {
    clusterCompliant?: Maybe<Scalars['String']>
    compliancePolicies?: Maybe<Array<Maybe<CompliancePolicies>>>
    compliancePolicy?: Maybe<Array<Maybe<CompliancePolicyDetail>>>
    complianceStatus?: Maybe<Array<Maybe<CompliantStatus>>>
    metadata?: Maybe<Metadata>
    policyCompliant?: Maybe<Scalars['String']>
    raw?: Maybe<Scalars['JSON']>
    apiVersion?: Maybe<Scalars['String']>
    placementPolicies?: Maybe<Array<Maybe<PlacementPolicy>>>
    placementBindings?: Maybe<Array<Maybe<PlacementBinding>>>
}

export type CompliantStatus = {
    clusterNamespace?: Maybe<Scalars['String']>
    localCompliantStatus?: Maybe<Scalars['String']>
    localValidStatus?: Maybe<Scalars['String']>
}

export type CompliancePolicies = {
    name?: Maybe<Scalars['String']>
    complianceName?: Maybe<Scalars['String']>
    complianceNamespace?: Maybe<Scalars['String']>
    clusterCompliant?: Maybe<Array<Maybe<Scalars['String']>>>
    clusterNotCompliant?: Maybe<Array<Maybe<Scalars['String']>>>
    policies?: Maybe<Array<Maybe<CompliancePolicy>>>
}

export type CompliancePolicyDetail = {
    name?: Maybe<Scalars['String']>
    complianceName?: Maybe<Scalars['String']>
    complianceNamespace?: Maybe<Scalars['String']>
    complianceSelfLink?: Maybe<Scalars['String']>
    raw?: Maybe<Scalars['JSON']>
    message?: Maybe<Scalars['String']>
    detail?: Maybe<Scalars['JSON']>
    status?: Maybe<Scalars['String']>
    enforcement?: Maybe<Scalars['String']>
    rules?: Maybe<Array<Maybe<PolicyRules>>>
    roleTemplates?: Maybe<Array<Maybe<PolicyTemplates>>>
    roleBindingTemplates?: Maybe<Array<Maybe<PolicyTemplates>>>
    objectTemplates?: Maybe<Array<Maybe<PolicyTemplates>>>
}

export type CompliancePolicy = K8sObject & {
    cluster?: Maybe<Scalars['String']>
    complianceName?: Maybe<Scalars['String']>
    detail?: Maybe<Scalars['JSON']>
    complianceNamespace?: Maybe<Scalars['String']>
    compliant?: Maybe<Scalars['String']>
    enforcement?: Maybe<Scalars['String']>
    metadata?: Maybe<Metadata>
    /** @deprecated Use metadata.name field. */
    name?: Maybe<Scalars['String']>
    rules?: Maybe<Array<Maybe<PolicyRules>>>
    status?: Maybe<Scalars['String']>
    templates?: Maybe<Array<Maybe<PolicyTemplates>>>
    valid?: Maybe<Scalars['String']>
    violations?: Maybe<Array<Maybe<Violations>>>
    roleTemplates?: Maybe<Array<Maybe<PolicyTemplates>>>
    roleBindingTemplates?: Maybe<Array<Maybe<PolicyTemplates>>>
    objectTemplates?: Maybe<Array<Maybe<PolicyTemplates>>>
    raw?: Maybe<Scalars['JSON']>
    message?: Maybe<Scalars['String']>
}

export type PolicyTemplates = {
    apiVersion?: Maybe<Scalars['String']>
    complianceType?: Maybe<Scalars['String']>
    compliant?: Maybe<Scalars['String']>
    status?: Maybe<Scalars['String']>
    lastTransition?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    validity?: Maybe<Scalars['String']>
    raw?: Maybe<Scalars['JSON']>
}

export type PolicyRules = {
    apiGroups?: Maybe<Array<Maybe<Scalars['String']>>>
    complianceType?: Maybe<Scalars['String']>
    resources?: Maybe<Array<Maybe<Scalars['String']>>>
    ruleUID?: Maybe<Scalars['String']>
    templateType?: Maybe<Scalars['String']>
    verbs?: Maybe<Array<Maybe<Scalars['String']>>>
}

export type Violations = {
    cluster?: Maybe<Scalars['String']>
    message?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    reason?: Maybe<Scalars['String']>
    selector?: Maybe<Scalars['JSON']>
    status?: Maybe<Scalars['String']>
}

export type Filters = {
    clusterLabels?: Maybe<Array<Maybe<FilterItem>>>
    clusterNames?: Maybe<Array<Maybe<FilterItem>>>
}

export type FilterItem = {
    name?: Maybe<Scalars['String']>
    id?: Maybe<Scalars['String']>
    type?: Maybe<Scalars['String']>
    key?: Maybe<Scalars['String']>
    value?: Maybe<Scalars['String']>
}

export type FilterItemInput = {
    type?: Maybe<Scalars['String']>
    key?: Maybe<Scalars['String']>
    value?: Maybe<Scalars['String']>
}

export type Filter = {
    cluster?: Maybe<Array<Maybe<Scalars['String']>>>
    label?: Maybe<Array<Maybe<LabelInput>>>
    namespace?: Maybe<Array<Maybe<Scalars['String']>>>
    type?: Maybe<Array<Maybe<Scalars['String']>>>
    resourceFilter?: Maybe<Array<Maybe<FilterItemInput>>>
}

export type Overview = {
    clusters?: Maybe<Array<Maybe<ClusterOverview>>>
    applications?: Maybe<Array<Maybe<ApplicationOverview>>>
    compliances?: Maybe<Array<Maybe<ComplianceOverview>>>
    timestamp?: Maybe<Scalars['String']>
}

export type ClusterOverview = K8sObject & {
    metadata?: Maybe<Metadata>
    capacity?: Maybe<ClusterCapacity>
    allocatable?: Maybe<ClusterAllocatable>
    consoleURL?: Maybe<Scalars['String']>
    status?: Maybe<Scalars['String']>
}

export type ClusterCapacity = {
    cpu?: Maybe<Scalars['String']>
    memory?: Maybe<Scalars['String']>
}

export type ClusterAllocatable = {
    cpu?: Maybe<Scalars['String']>
    memory?: Maybe<Scalars['String']>
}

export type ApplicationOverview = K8sObject & {
    metadata?: Maybe<Metadata>
    raw?: Maybe<Scalars['JSON']>
    selector?: Maybe<Scalars['JSON']>
}

export type ComplianceOverview = K8sObject & {
    metadata?: Maybe<Metadata>
    raw?: Maybe<Scalars['JSON']>
}

export type Occurrence = {
    name?: Maybe<Scalars['String']>
    noteName?: Maybe<Scalars['String']>
    updateTime?: Maybe<Scalars['String']>
    createTime?: Maybe<Scalars['String']>
    shortDescription?: Maybe<Scalars['String']>
    context?: Maybe<Scalars['JSON']>
    reportedBy?: Maybe<Scalars['JSON']>
    finding?: Maybe<Scalars['JSON']>
    securityClassification?: Maybe<Scalars['JSON']>
}

export type Query = {
    application?: Maybe<Application>
    channels?: Maybe<Array<Maybe<Channel>>>
    gitChannelBranches?: Maybe<Array<Maybe<Scalars['String']>>>
    gitChannelPaths?: Maybe<Array<Maybe<Scalars['String']>>>
    cluster?: Maybe<Array<Maybe<Cluster>>>
    clusters?: Maybe<Array<Maybe<Cluster>>>
    clusterImageSets?: Maybe<Array<Maybe<ClusterImageSet>>>
    clusterAddons?: Maybe<Array<Maybe<ClusterAddon>>>
    bareMetalAsset?: Maybe<Array<Maybe<BareMetalAsset>>>
    bareMetalAssets?: Maybe<Array<Maybe<BareMetalAsset>>>
    bareMetalAssetSubresources?: Maybe<BareMetalAssetSubresources>
    /** @deprecated Compliances are deprecated from OCM. Use policies instead. */
    compliances?: Maybe<Array<Maybe<Compliance>>>
    occurrences?: Maybe<Array<Maybe<Occurrence>>>
    connections?: Maybe<Array<Maybe<Connection>>>
    connectionDetails?: Maybe<Array<Maybe<ConnectionDetail>>>
    getResource?: Maybe<Scalars['JSON']>
    overview?: Maybe<Overview>
    placementPolicies?: Maybe<Array<Maybe<PlacementPolicy>>>
    placementrules?: Maybe<Array<Maybe<PlacementRule>>>
    secrets?: Maybe<Array<Maybe<Secret>>>
    subscriptions?: Maybe<Array<Maybe<Subscription>>>
    subscriptionsForCluster?: Maybe<Array<Maybe<Subscription>>>
    updateResource?: Maybe<Scalars['JSON']>
    applicationNamespaces?: Maybe<Array<Maybe<ApplicationNamespace>>>
    filters?: Maybe<Filters>
    labels?: Maybe<Array<Maybe<Label>>>
    resourceTypes?: Maybe<Array<Maybe<Scalars['String']>>>
    topology?: Maybe<Topology>
    getAutomatedImportStatus?: Maybe<Scalars['JSON']>
}

export type QueryApplicationArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryChannelsArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryGitChannelBranchesArgs = {
    gitUrl: Scalars['String']
    namespace?: Maybe<Scalars['String']>
    secretRef?: Maybe<Scalars['String']>
    user?: Maybe<Scalars['String']>
    accessToken?: Maybe<Scalars['String']>
}

export type QueryGitChannelPathsArgs = {
    gitUrl: Scalars['String']
    branch: Scalars['String']
    path?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    secretRef?: Maybe<Scalars['String']>
    user?: Maybe<Scalars['String']>
    accessToken?: Maybe<Scalars['String']>
}

export type QueryClusterArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryClusterAddonsArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryBareMetalAssetArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryBareMetalAssetsArgs = {
    fetchSecrets?: Maybe<Scalars['Boolean']>
}

export type QueryBareMetalAssetSubresourcesArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryCompliancesArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryConnectionDetailsArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryGetResourceArgs = {
    apiVersion?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    cluster?: Maybe<Scalars['String']>
    selfLink?: Maybe<Scalars['String']>
    updateInterval?: Maybe<Scalars['Int']>
    deleteAfterUse?: Maybe<Scalars['Boolean']>
}

export type QueryOverviewArgs = {
    demoMode?: Maybe<Scalars['Boolean']>
}

export type QueryPlacementPoliciesArgs = {
    selector?: Maybe<Scalars['JSON']>
}

export type QueryPlacementrulesArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QuerySecretsArgs = {
    namespace?: Maybe<Scalars['String']>
}

export type QuerySubscriptionsArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QuerySubscriptionsForClusterArgs = {
    clusterName: Scalars['String']
    clusterNamespace: Scalars['String']
}

export type QueryUpdateResourceArgs = {
    selfLink?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    body?: Maybe<Scalars['JSON']>
    cluster?: Maybe<Scalars['String']>
}

export type QueryApplicationNamespacesArgs = {
    namespace?: Maybe<Scalars['String']>
}

export type QueryTopologyArgs = {
    filter?: Maybe<TopologyFilter>
}

export type QueryGetAutomatedImportStatusArgs = {
    namespace?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
}

export type Mutation = {
    createApplication?: Maybe<Scalars['JSON']>
    createChannel?: Maybe<Scalars['JSON']>
    createPolicy?: Maybe<Scalars['JSON']>
    createSubscription?: Maybe<Scalars['JSON']>
    createPlacementRule?: Maybe<Scalars['JSON']>
    createResources?: Maybe<Scalars['JSON']>
    createCloudConnection?: Maybe<Scalars['JSON']>
    deleteCloudConnection?: Maybe<Scalars['JSON']>
    editCloudConnection?: Maybe<Scalars['JSON']>
    updateResource?: Maybe<Scalars['JSON']>
    updateResourceLabels?: Maybe<Scalars['JSON']>
    updateApplication?: Maybe<Scalars['JSON']>
    deleteHelm?: Maybe<Scalars['JSON']>
    deleteResource?: Maybe<Scalars['JSON']>
    deleteManagedClusterView?: Maybe<Scalars['JSON']>
    createCluster?: Maybe<Scalars['JSON']>
    automatedImport?: Maybe<Scalars['JSON']>
    detachCluster?: Maybe<Scalars['JSON']>
    updateClusterResource?: Maybe<Scalars['JSON']>
    createBareMetalAsset?: Maybe<Scalars['JSON']>
    updateBareMetalAsset?: Maybe<Scalars['JSON']>
    deleteBareMetalAssets?: Maybe<Scalars['JSON']>
    /** @deprecated Compliances are deprecated from MCM. Use policies instead. */
    createCompliance?: Maybe<Scalars['JSON']>
}

export type MutationCreateApplicationArgs = {
    application: Array<Maybe<Scalars['JSON']>>
}

export type MutationCreateChannelArgs = {
    resources?: Maybe<Array<Maybe<Scalars['JSON']>>>
}

export type MutationCreatePolicyArgs = {
    resources?: Maybe<Array<Maybe<Scalars['JSON']>>>
}

export type MutationCreateSubscriptionArgs = {
    resources?: Maybe<Array<Maybe<Scalars['JSON']>>>
}

export type MutationCreatePlacementRuleArgs = {
    resources?: Maybe<Array<Maybe<Scalars['JSON']>>>
}

export type MutationCreateResourcesArgs = {
    resources?: Maybe<Array<Maybe<Scalars['JSON']>>>
    clusterInfo?: Maybe<Scalars['JSON']>
}

export type MutationCreateCloudConnectionArgs = {
    body?: Maybe<Scalars['JSON']>
}

export type MutationDeleteCloudConnectionArgs = {
    namespace: Scalars['String']
    name: Scalars['String']
}

export type MutationEditCloudConnectionArgs = {
    body?: Maybe<Scalars['JSON']>
    namespace: Scalars['String']
    name: Scalars['String']
}

export type MutationUpdateResourceArgs = {
    resourceType: Scalars['String']
    apiVersion?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    namespace: Scalars['String']
    name: Scalars['String']
    body?: Maybe<Scalars['JSON']>
    selfLink?: Maybe<Scalars['String']>
    resourcePath?: Maybe<Scalars['String']>
}

export type MutationUpdateResourceLabelsArgs = {
    resourceType: Scalars['String']
    apiVersion?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    namespace: Scalars['String']
    name: Scalars['String']
    body?: Maybe<Scalars['JSON']>
    selfLink?: Maybe<Scalars['String']>
    resourcePath?: Maybe<Scalars['String']>
}

export type MutationUpdateApplicationArgs = {
    application: Array<Maybe<Scalars['JSON']>>
}

export type MutationDeleteHelmArgs = {
    name: Scalars['String']
    namespace: Scalars['String']
    cluster: Scalars['String']
}

export type MutationDeleteResourceArgs = {
    selfLink?: Maybe<Scalars['String']>
    apiVersion?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    cluster?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    childResources?: Maybe<Scalars['JSON']>
}

export type MutationDeleteManagedClusterViewArgs = {
    managedClusterNamespace?: Maybe<Scalars['String']>
    managedClusterViewName?: Maybe<Scalars['String']>
}

export type MutationCreateClusterArgs = {
    cluster: Scalars['JSON']
}

export type MutationAutomatedImportArgs = {
    namespace?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    body?: Maybe<Scalars['JSON']>
}

export type MutationDetachClusterArgs = {
    namespace: Scalars['String']
    cluster: Scalars['String']
    destroy?: Maybe<Scalars['Boolean']>
}

export type MutationUpdateClusterResourceArgs = {
    namespace?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    body?: Maybe<Scalars['String']>
}

export type MutationCreateBareMetalAssetArgs = {
    namespace?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    bmcAddress?: Maybe<Scalars['String']>
    username?: Maybe<Scalars['String']>
    password?: Maybe<Scalars['String']>
    bootMac?: Maybe<Scalars['String']>
}

export type MutationUpdateBareMetalAssetArgs = {
    namespace?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    bmcAddress?: Maybe<Scalars['String']>
    username?: Maybe<Scalars['String']>
    password?: Maybe<Scalars['String']>
    bootMac?: Maybe<Scalars['String']>
}

export type MutationDeleteBareMetalAssetsArgs = {
    bmas?: Maybe<Array<Maybe<Scalars['JSON']>>>
}

export type MutationCreateComplianceArgs = {
    resources?: Maybe<Array<Maybe<Scalars['JSON']>>>
}

export type K8sObject = {
    metadata?: Maybe<Metadata>
}

export type Metadata = {
    annotations?: Maybe<Scalars['JSON']>
    creationTimestamp?: Maybe<Scalars['String']>
    labels?: Maybe<Scalars['JSON']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    resourceVersion?: Maybe<Scalars['String']>
    selfLink?: Maybe<Scalars['String']>
    status?: Maybe<Scalars['String']>
    uid?: Maybe<Scalars['String']>
}

export type ConnectionObject = {
    metadata?: Maybe<ConnectionMetadata>
}

export type ConnectionMetadata = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    provider?: Maybe<Scalars['String']>
    name_namespace?: Maybe<Scalars['String']>
}

export type Resource = {
    cluster?: Maybe<Scalars['String']>
    clusterName?: Maybe<Scalars['String']>
    labels?: Maybe<Array<Maybe<Label>>>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    relationships?: Maybe<Array<Maybe<Relationship>>>
    topology?: Maybe<Scalars['String']>
    type?: Maybe<Scalars['String']>
    specs?: Maybe<Scalars['JSON']>
    uid?: Maybe<Scalars['String']>
    id?: Maybe<Scalars['String']>
}

export type Relationship = {
    type?: Maybe<Scalars['String']>
    to?: Maybe<Resource>
    from?: Maybe<Resource>
    specs?: Maybe<Scalars['JSON']>
}

export type Topology = {
    resources?: Maybe<Array<Maybe<Resource>>>
    relationships?: Maybe<Array<Maybe<Relationship>>>
}

export type Label = {
    name?: Maybe<Scalars['String']>
    value?: Maybe<Scalars['String']>
}

export type LabelInput = {
    name?: Maybe<Scalars['String']>
    value?: Maybe<Scalars['String']>
}

export type TopologyFilter = {
    application?: Maybe<Array<Maybe<Scalars['JSON']>>>
    cluster?: Maybe<Array<Maybe<Scalars['JSON']>>>
    policy?: Maybe<Array<Maybe<Scalars['JSON']>>>
    namespace?: Maybe<Array<Maybe<Scalars['String']>>>
    type?: Maybe<Array<Maybe<Scalars['String']>>>
}

export type Connection = ConnectionObject & {
    metadata?: Maybe<ConnectionMetadata>
    statusCode?: Maybe<Scalars['Int']>
    errorMsg?: Maybe<Scalars['String']>
}

export type ConnectionDetail = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    provider?: Maybe<Scalars['String']>
    metadata?: Maybe<Scalars['JSON']>
}

export type BmcType = {
    address?: Maybe<Scalars['String']>
    credentialsName?: Maybe<Scalars['String']>
    username?: Maybe<Scalars['String']>
    password?: Maybe<Scalars['String']>
}

export type BmcClusterDeploymentType = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type BareMetalAsset = K8sObject & {
    metadata?: Maybe<Metadata>
    bmc?: Maybe<BmcType>
    bootMACAddress?: Maybe<Scalars['String']>
    clusterDeployment?: Maybe<BmcClusterDeploymentType>
    hardwareProfile?: Maybe<Scalars['String']>
    role?: Maybe<Scalars['String']>
    status?: Maybe<Scalars['String']>
}

export type BareMetalAssetSubresources = {
    namespaces?: Maybe<Array<Maybe<Scalars['String']>>>
    bareMetalAsset?: Maybe<Array<Maybe<BareMetalAsset>>>
}

export enum CacheControlScope {
    Public = 'PUBLIC',
    Private = 'PRIVATE',
}

export type GetResourceQueryVariables = Exact<{
    apiVersion?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    cluster?: Maybe<Scalars['String']>
    selfLink?: Maybe<Scalars['String']>
    updateInterval?: Maybe<Scalars['Int']>
    deleteAfterUse?: Maybe<Scalars['Boolean']>
}>

export type GetResourceQuery = Pick<Query, 'getResource'>

export type UpdateResourceQueryVariables = Exact<{
    selfLink?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    body?: Maybe<Scalars['JSON']>
    cluster?: Maybe<Scalars['String']>
}>

export type UpdateResourceQuery = Pick<Query, 'updateResource'>

export type DeleteResourceMutationVariables = Exact<{
    selfLink?: Maybe<Scalars['String']>
    apiVersion?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    cluster?: Maybe<Scalars['String']>
    kind?: Maybe<Scalars['String']>
    childResources?: Maybe<Scalars['JSON']>
}>

export type DeleteResourceMutation = Pick<Mutation, 'deleteResource'>

export type GetOverviewQueryVariables = Exact<{
    demoMode?: Maybe<Scalars['Boolean']>
}>

export type GetOverviewQuery = {
    overview?: Maybe<
        Pick<Overview, 'timestamp'> & {
            clusters?: Maybe<
                Array<
                    Maybe<
                        Pick<ClusterOverview, 'consoleURL' | 'status'> & {
                            metadata?: Maybe<Pick<Metadata, 'name' | 'namespace' | 'labels' | 'uid'>>
                        }
                    >
                >
            >
            applications?: Maybe<
                Array<
                    Maybe<
                        Pick<ApplicationOverview, 'raw' | 'selector'> & {
                            metadata?: Maybe<Pick<Metadata, 'name' | 'namespace'>>
                        }
                    >
                >
            >
            compliances?: Maybe<
                Array<
                    Maybe<Pick<ComplianceOverview, 'raw'> & { metadata?: Maybe<Pick<Metadata, 'name' | 'namespace'>> }>
                >
            >
        }
    >
}

export const GetResourceDocument = gql`
    query getResource(
        $apiVersion: String
        $kind: String
        $name: String
        $namespace: String
        $cluster: String
        $selfLink: String
        $updateInterval: Int
        $deleteAfterUse: Boolean
    ) {
        getResource(
            apiVersion: $apiVersion
            kind: $kind
            name: $name
            namespace: $namespace
            cluster: $cluster
            selfLink: $selfLink
            updateInterval: $updateInterval
            deleteAfterUse: $deleteAfterUse
        )
    }
`

/**
 * __useGetResourceQuery__
 *
 * To run a query within a React component, call `useGetResourceQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetResourceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetResourceQuery({
 *   variables: {
 *      apiVersion: // value for 'apiVersion'
 *      kind: // value for 'kind'
 *      name: // value for 'name'
 *      namespace: // value for 'namespace'
 *      cluster: // value for 'cluster'
 *      selfLink: // value for 'selfLink'
 *      updateInterval: // value for 'updateInterval'
 *      deleteAfterUse: // value for 'deleteAfterUse'
 *   },
 * });
 */
export function useGetResourceQuery(
    baseOptions?: Apollo.QueryHookOptions<GetResourceQuery, GetResourceQueryVariables>
) {
    return Apollo.useQuery<GetResourceQuery, GetResourceQueryVariables>(GetResourceDocument, baseOptions)
}
export function useGetResourceLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<GetResourceQuery, GetResourceQueryVariables>
) {
    return Apollo.useLazyQuery<GetResourceQuery, GetResourceQueryVariables>(GetResourceDocument, baseOptions)
}
export type GetResourceQueryHookResult = ReturnType<typeof useGetResourceQuery>
export type GetResourceLazyQueryHookResult = ReturnType<typeof useGetResourceLazyQuery>
export type GetResourceQueryResult = Apollo.QueryResult<GetResourceQuery, GetResourceQueryVariables>
export const UpdateResourceDocument = gql`
    query updateResource(
        $selfLink: String
        $namespace: String
        $kind: String
        $name: String
        $body: JSON
        $cluster: String
    ) {
        updateResource(
            selfLink: $selfLink
            namespace: $namespace
            kind: $kind
            name: $name
            body: $body
            cluster: $cluster
        )
    }
`

/**
 * __useUpdateResourceQuery__
 *
 * To run a query within a React component, call `useUpdateResourceQuery` and pass it any options that fit your needs.
 * When your component renders, `useUpdateResourceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUpdateResourceQuery({
 *   variables: {
 *      selfLink: // value for 'selfLink'
 *      namespace: // value for 'namespace'
 *      kind: // value for 'kind'
 *      name: // value for 'name'
 *      body: // value for 'body'
 *      cluster: // value for 'cluster'
 *   },
 * });
 */
export function useUpdateResourceQuery(
    baseOptions?: Apollo.QueryHookOptions<UpdateResourceQuery, UpdateResourceQueryVariables>
) {
    return Apollo.useQuery<UpdateResourceQuery, UpdateResourceQueryVariables>(UpdateResourceDocument, baseOptions)
}
export function useUpdateResourceLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<UpdateResourceQuery, UpdateResourceQueryVariables>
) {
    return Apollo.useLazyQuery<UpdateResourceQuery, UpdateResourceQueryVariables>(UpdateResourceDocument, baseOptions)
}
export type UpdateResourceQueryHookResult = ReturnType<typeof useUpdateResourceQuery>
export type UpdateResourceLazyQueryHookResult = ReturnType<typeof useUpdateResourceLazyQuery>
export type UpdateResourceQueryResult = Apollo.QueryResult<UpdateResourceQuery, UpdateResourceQueryVariables>
export const DeleteResourceDocument = gql`
    mutation deleteResource(
        $selfLink: String
        $apiVersion: String
        $name: String
        $namespace: String
        $cluster: String
        $kind: String
        $childResources: JSON
    ) {
        deleteResource(
            selfLink: $selfLink
            apiVersion: $apiVersion
            name: $name
            namespace: $namespace
            cluster: $cluster
            kind: $kind
            childResources: $childResources
        )
    }
`
export type DeleteResourceMutationFn = Apollo.MutationFunction<DeleteResourceMutation, DeleteResourceMutationVariables>

/**
 * __useDeleteResourceMutation__
 *
 * To run a mutation, you first call `useDeleteResourceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteResourceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteResourceMutation, { data, loading, error }] = useDeleteResourceMutation({
 *   variables: {
 *      selfLink: // value for 'selfLink'
 *      apiVersion: // value for 'apiVersion'
 *      name: // value for 'name'
 *      namespace: // value for 'namespace'
 *      cluster: // value for 'cluster'
 *      kind: // value for 'kind'
 *      childResources: // value for 'childResources'
 *   },
 * });
 */
export function useDeleteResourceMutation(
    baseOptions?: Apollo.MutationHookOptions<DeleteResourceMutation, DeleteResourceMutationVariables>
) {
    return Apollo.useMutation<DeleteResourceMutation, DeleteResourceMutationVariables>(
        DeleteResourceDocument,
        baseOptions
    )
}
export type DeleteResourceMutationHookResult = ReturnType<typeof useDeleteResourceMutation>
export type DeleteResourceMutationResult = Apollo.MutationResult<DeleteResourceMutation>
export type DeleteResourceMutationOptions = Apollo.BaseMutationOptions<
    DeleteResourceMutation,
    DeleteResourceMutationVariables
>

export const GetOverviewDocument = gql`
    query getOverview($demoMode: Boolean) {
        overview(demoMode: $demoMode) {
            clusters {
                metadata {
                    name
                    namespace
                    labels
                    uid
                }
                consoleURL
                status
            }
            applications {
                metadata {
                    name
                    namespace
                }
                raw
                selector
            }
            compliances {
                metadata {
                    name
                    namespace
                }
                raw
            }
            timestamp
        }
    }
`

/**
 * __useGetOverviewQuery__
 *
 * To run a query within a React component, call `useGetOverviewQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOverviewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOverviewQuery({
 *   variables: {
 *      demoMode: // value for 'demoMode'
 *   },
 * });
 */
export function useGetOverviewQuery(
    baseOptions?: Apollo.QueryHookOptions<GetOverviewQuery, GetOverviewQueryVariables>
) {
    return Apollo.useQuery<GetOverviewQuery, GetOverviewQueryVariables>(GetOverviewDocument, baseOptions)
}
export function useGetOverviewLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<GetOverviewQuery, GetOverviewQueryVariables>
) {
    return Apollo.useLazyQuery<GetOverviewQuery, GetOverviewQueryVariables>(GetOverviewDocument, baseOptions)
}
export type GetOverviewQueryHookResult = ReturnType<typeof useGetOverviewQuery>
export type GetOverviewLazyQueryHookResult = ReturnType<typeof useGetOverviewLazyQuery>
export type GetOverviewQueryResult = Apollo.QueryResult<GetOverviewQuery, GetOverviewQueryVariables>

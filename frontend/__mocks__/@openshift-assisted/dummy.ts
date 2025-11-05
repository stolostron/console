/* Copyright Contributors to the Open Cluster Management project */
// This dummy file is used to resolve @Console imports from @openshift-console and @openshift-assisted for development
// You can add any exports needed by your tests here
// Check "moduleNameMapper" in package.json and webpack alias configuration

// ===== Mock exports for @openshift-assisted/ui-lib/cim =====

// update with claude as needed

// K8s Resource Types - mock as empty objects with K8sResourceCommon structure
export type AgentClusterInstallK8sResource = any
export type AgentK8sResource = any
export type AgentMachineK8sResource = any
export type AgentServiceConfigK8sResource = any
export type BareMetalHostK8sResource = any
export type ClusterVersionK8sResource = any
export type HostedClusterK8sResource = any
export type InfraEnvK8sResource = any
export type InfrastructureK8sResource = any
export type NMStateK8sResource = any
export type NodePoolK8sResource = any
export type StorageClassK8sResource = any
export type ClusterImageSetK8sResource = any
export type SecretK8sResource = any
export type ConfigMapK8sResource = any
export type ClusterDeploymentK8sResource = any

// React Components - mock as simple function components
export const HostedClusterNetworkStep = (): any => null
export const LoadingState = (): any => null
export const LogsDownloadButton = (): any => null
export const ScaleUpModal = (): any => null
export const ClusterCredentials = (): any => null
export const ClusterInstallationProgress = (): any => null
export const AgentTable = (): any => null
export const Alerts = (): any => null
export const AlertsContextProvider = ({ children }: any): any => children
export const ClusterDeploymentCredentials = (): any => null
export const ClusterDeploymentKubeconfigDownload = (): any => null
export const ClusterDeploymentProgress = (): any => null
export const ClusterDeploymentValidationsOverview = (): any => null
export const ClusterInstallationError = (): any => null
export const EventsModal = (): any => null
export const PostInstallAlert = (): any => null
export const ACMClusterDeploymentDetailsStep = (): any => null
export const ACMFeatureSupportLevelProvider = ({ children }: any): any => children
export const FeatureGateContextProvider = ({ children }: any): any => children
export const ClusterDeploymentWizard = (): any => null
export const EditAgentModal = (): any => null
export const HostedClusterHostsStep = (): any => null
export const EnvironmentDetails = (): any => null
export const EnvironmentErrors = (): any => null
export const CimConfigurationModal = (): any => null
export const CimStorageMissingAlert = (): any => null
export const CimConfigProgressAlert = (): any => null

// Utility Functions - mock with simple return values
export const getVersionFromReleaseImage = (image: string): string => '4.14.0'
export const getSupportedCM = (): any => ({})
export const getAgentStatusKey = (): string => 'ready'
export const isCIMConfigured = (): boolean => true
export const isDraft = (): boolean => true
export const isStorageConfigured = (): boolean => true
export const getCurrentClusterVersion = (): string => '4.14.0'
export const getMajorMinorVersion = (version: string): string => '4.14'
export const getAICluster = (): any => ({})
export const getClusterStatus = (): string => 'ready'
export const getConsoleUrl = (): string => 'https://console.example.com'
export const getClusterApiUrl = (): string => 'https://api.example.com:6443'
export const getIsSNOCluster = (): boolean => false
export const getOnFetchEventsHandler = (): any => () => Promise.resolve([])
export const shouldShowClusterCredentials = (): boolean => true
export const shouldShowClusterDeploymentValidationOverview = (): boolean => true
export const shouldShowClusterInstallationError = (): boolean => false
export const shouldShowClusterInstallationProgress = (): boolean => true
export const getAnnotationsFromAgentSelector = (): any => ({})
export const getBareMetalHostCredentialsSecret = (): any => ({})
export const getBareMetalHost = (): any => ({})
export const isAgentOfCluster = (): boolean => true
export const getOCPVersions = (): any[] => []
export const isValidImageSet = (): boolean => true
export const getAgentsForSelection = (): any[] => []
export const getAgentsHostsNames = (): string[] => []
export const isAgentOfInfraEnv = (): boolean => true
export const onAgentChangeHostname = (): void => {}
export const getClusterProperties = (): any => ({})
export const labelsToArray = (labels: any): any[] => []

// Types
export type NetworkFormValues = any
export type CreateResourceFuncType = any
export type GetResourceFuncType = any
export type ListResourcesFuncType = any
export type PatchResourceFuncType = any
export type ClusterDetailsValues = any
export type ClusterDeploymentDetailsValues = any
export type ClusterDeploymentWizardStepsType = any
export type ClusterDeploymentNetworkingValues = any
export type AddBmcValues = any
export type DiscoveryImageFormValues = any
export type OpenshiftVersionOptionType = any
export type FetchSecret = any

// Constants
export const AGENT_LOCATION_LABEL_KEY = 'agentclusterinstalls.extensions.hive.openshift.io/location'
export const ACM_ENABLED_FEATURES = 'ACM_ENABLED_FEATURES'
export const AGENT_BMH_NAME_LABEL_KEY = 'bmac.agent-install.openshift.io/bmh'
export const BMH_HOSTNAME_ANNOTATION = 'bmac.agent-install.openshift.io/hostname'

/**
 * HypershiftDeployment is the Schema for the hypershiftDeployments API
 */
export interface IHypershiftDeployment {
    apiVersion: 'cluster.open-cluster-management.io/v1alpha1'
    kind: 'HypershiftDeployment'

    metadata?: {
        [k: string]: unknown
    }
    /**
     * HypershiftDeploymentSpec defines the desired state of HypershiftDeployment
     */
    spec?: {
        /**
         * Credentials are ARN's that are used for standing up the resources in the cluster.
         */
        credentials?: {
            aws?: {
                controlPlaneOperatorARN: string
                kubeCloudControllerARN: string
                nodePoolManagementARN: string
                [k: string]: unknown
            }
            [k: string]: unknown
        }
        /**
         * Reference to a HostedCluster on the HyperShift deployment namespace that will be applied to the ManagementCluster by ACM, if omitted, it will be generated required if InfraSpec.Configure is false
         */
        hostedClusterReference?: {
            /**
             * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
             */
            name?: string
            [k: string]: unknown
        }
        /**
         * HostedCluster that will be applied to the ManagementCluster by ACM, if omitted, it will be generated
         */
        hostedClusterSpec?: {
            /**
             * AdditionalTrustBundle is a reference to a ConfigMap containing a PEM-encoded X.509 certificate bundle that will be added to the hosted controlplane and nodes
             */
            additionalTrustBundle?: {
                /**
                 * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                 */
                name?: string
                [k: string]: unknown
            }
            /**
             * AuditWebhook contains metadata for configuring an audit webhook endpoint for a cluster to process cluster audit events. It references a secret that contains the webhook information for the audit webhook endpoint. It is a secret because if the endpoint has mTLS the kubeconfig will contain client keys. The kubeconfig needs to be stored in the secret with a secret key name that corresponds to the constant AuditWebhookKubeconfigKey.
             *  This field is currently only supported on the IBMCloud platform.
             */
            auditWebhook?: {
                /**
                 * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                 */
                name?: string
                [k: string]: unknown
            }
            /**
             * Autoscaling specifies auto-scaling behavior that applies to all NodePools associated with the control plane.
             */
            autoscaling?: {
                /**
                 * MaxNodeProvisionTime is the maximum time to wait for node provisioning before considering the provisioning to be unsuccessful, expressed as a Go duration string. The default is 15 minutes.
                 */
                maxNodeProvisionTime?: string
                /**
                 * MaxNodesTotal is the maximum allowable number of nodes across all NodePools for a HostedCluster. The autoscaler will not grow the cluster beyond this number.
                 */
                maxNodesTotal?: number
                /**
                 * MaxPodGracePeriod is the maximum seconds to wait for graceful pod termination before scaling down a NodePool. The default is 600 seconds.
                 */
                maxPodGracePeriod?: number
                /**
                 * PodPriorityThreshold enables users to schedule "best-effort" pods, which shouldn't trigger autoscaler actions, but only run when there are spare resources available. The default is -10.
                 *  See the following for more details: https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md#how-does-cluster-autoscaler-work-with-pod-priority-and-preemption
                 */
                podPriorityThreshold?: number
                [k: string]: unknown
            }
            /**
             * ClusterID uniquely identifies this cluster. This is expected to be an RFC4122 UUID value (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx in hexadecimal values). As with a Kubernetes metadata.uid, this ID uniquely identifies this cluster in space and time. This value identifies the cluster in metrics pushed to telemetry and metrics produced by the control plane operators. If a value is not specified, an ID is generated. After initial creation, the value is immutable.
             */
            clusterID?: string
            /**
             * Configuration specifies configuration for individual OCP components in the cluster, represented as embedded resources that correspond to the openshift configuration API.
             */
            configuration?: {
                /**
                 * ConfigMapRefs holds references to any configmaps referenced by configuration entries. Entries can reference the configmaps using local object references.
                 */
                configMapRefs?: {
                    /**
                     * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                     */
                    name?: string
                    [k: string]: unknown
                }[]
                /**
                 * Items embeds the serialized configuration resources.
                 */
                items?: {
                    [k: string]: unknown
                }[]
                /**
                 * SecretRefs holds references to any secrets referenced by configuration entries. Entries can reference the secrets using local object references.
                 */
                secretRefs?: {
                    /**
                     * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                     */
                    name?: string
                    [k: string]: unknown
                }[]
                [k: string]: unknown
            }
            /**
             * ControllerAvailabilityPolicy specifies the availability policy applied to critical control plane components. The default value is SingleReplica.
             */
            controllerAvailabilityPolicy?: string
            /**
             * DNS specifies DNS configuration for the cluster.
             */
            dns?: {
                /**
                 * BaseDomain is the base domain of the cluster.
                 */
                baseDomain: string
                /**
                 * PrivateZoneID is the Hosted Zone ID where all the DNS records that are only available internally to the cluster exist.
                 */
                privateZoneID?: string
                /**
                 * PublicZoneID is the Hosted Zone ID where all the DNS records that are publicly accessible to the internet exist.
                 */
                publicZoneID?: string
                [k: string]: unknown
            }
            /**
             * Etcd specifies configuration for the control plane etcd cluster. The default ManagementType is Managed. Once set, the ManagementType cannot be changed.
             */
            etcd?: {
                /**
                 * Managed specifies the behavior of an etcd cluster managed by HyperShift.
                 */
                managed?: {
                    /**
                     * Storage specifies how etcd data is persisted.
                     */
                    storage: {
                        /**
                         * PersistentVolume is the configuration for PersistentVolume etcd storage. With this implementation, a PersistentVolume will be allocated for every etcd member (either 1 or 3 depending on the HostedCluster control plane availability configuration).
                         */
                        persistentVolume?: {
                            /**
                             * Size is the minimum size of the data volume for each etcd member.
                             */
                            size?: number | string
                            /**
                             * StorageClassName is the StorageClass of the data volume for each etcd member.
                             *  See https://kubernetes.io/docs/concepts/storage/persistent-volumes#class-1.
                             */
                            storageClassName?: string
                            [k: string]: unknown
                        }
                        /**
                         * Type is the kind of persistent storage implementation to use for etcd.
                         */
                        type: 'PersistentVolume'
                        [k: string]: unknown
                    }
                    [k: string]: unknown
                }
                /**
                 * ManagementType defines how the etcd cluster is managed.
                 */
                managementType: 'Managed' | 'Unmanaged'
                /**
                 * Unmanaged specifies configuration which enables the control plane to integrate with an eternally managed etcd cluster.
                 */
                unmanaged?: {
                    /**
                     * Endpoint is the full etcd cluster client endpoint URL. For example:
                     *      https://etcd-client:2379
                     *  If the URL uses an HTTPS scheme, the TLS field is required.
                     */
                    endpoint: string
                    /**
                     * TLS specifies TLS configuration for HTTPS etcd client endpoints.
                     */
                    tls: {
                        /**
                         * ClientSecret refers to a secret for client mTLS authentication with the etcd cluster. It may have the following key/value pairs:
                         *      etcd-client-ca.crt: Certificate Authority value     etcd-client.crt: Client certificate value     etcd-client.key: Client certificate key value
                         */
                        clientSecret: {
                            /**
                             * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                             */
                            name?: string
                            [k: string]: unknown
                        }
                        [k: string]: unknown
                    }
                    [k: string]: unknown
                }
                [k: string]: unknown
            }
            /**
             * FIPS indicates whether this cluster's nodes will be running in FIPS mode. If set to true, the control plane's ignition server will be configured to expect that nodes joining the cluster will be FIPS-enabled.
             */
            fips?: boolean
            /**
             * ImageContentSources specifies image mirrors that can be used by cluster nodes to pull content.
             */
            imageContentSources?: {
                /**
                 * Mirrors are one or more repositories that may also contain the same images.
                 */
                mirrors?: string[]
                /**
                 * Source is the repository that users refer to, e.g. in image pull specifications.
                 */
                source: string
                [k: string]: unknown
            }[]
            /**
             * InfraID is a globally unique identifier for the cluster. This identifier will be used to associate various cloud resources with the HostedCluster and its associated NodePools.
             */
            infraID?: string
            /**
             * InfrastructureAvailabilityPolicy specifies the availability policy applied to infrastructure services which run on cluster nodes. The default value is SingleReplica.
             */
            infrastructureAvailabilityPolicy?: string
            /**
             * IssuerURL is an OIDC issuer URL which is used as the issuer in all ServiceAccount tokens generated by the control plane API server. The default value is kubernetes.default.svc, which only works for in-cluster validation.
             */
            issuerURL?: string
            /**
             * Networking specifies network configuration for the cluster.
             */
            networking: {
                /**
                 * APIServer contains advanced network settings for the API server that affect how the APIServer is exposed inside a cluster node.
                 */
                apiServer?: {
                    /**
                     * AdvertiseAddress is the address that nodes will use to talk to the API server. This is an address associated with the loopback adapter of each node. If not specified, 172.20.0.1 is used.
                     */
                    advertiseAddress?: string
                    /**
                     * Port is the port at which the APIServer is exposed inside a node. Other pods using host networking cannot listen on this port. If not specified, 6443 is used.
                     */
                    port?: number
                    [k: string]: unknown
                }
                /**
                 * MachineCIDR is...
                 *  TODO(dan): document it
                 */
                machineCIDR: string
                /**
                 * NetworkType specifies the SDN provider used for cluster networking.
                 */
                networkType: 'OpenShiftSDN' | 'Calico' | 'OVNKubernetes' | 'Other'
                /**
                 * PodCIDR is...
                 *  TODO(dan): document it
                 */
                podCIDR: string
                /**
                 * ServiceCIDR is...
                 *  TODO(dan): document it
                 */
                serviceCIDR: string
                [k: string]: unknown
            }
            /**
             * OLMCatalogPlacement specifies the placement of OLM catalog components. By default, this is set to management and OLM catalog components are deployed onto the management cluster. If set to guest, the OLM catalog components will be deployed onto the guest cluster.
             */
            olmCatalogPlacement?: 'management' | 'guest'
            /**
             * PausedUntil is a field that can be used to pause reconciliation on a resource. Either a date can be provided in RFC3339 format or a boolean. If a date is provided: reconciliation is paused on the resource until that date. If the boolean true is provided: reconciliation is paused on the resource until the field is removed.
             */
            pausedUntil?: string
            /**
             * Platform specifies the underlying infrastructure provider for the cluster and is used to configure platform specific behavior.
             */
            platform: {
                /**
                 * Agent specifies configuration for agent-based installations.
                 */
                agent?: {
                    /**
                     * AgentNamespace is the namespace where to search for Agents for this cluster
                     */
                    agentNamespace: string
                    [k: string]: unknown
                }
                /**
                 * AWS specifies configuration for clusters running on Amazon Web Services.
                 */
                aws?: {
                    /**
                     * CloudProviderConfig specifies AWS networking configuration for the control plane.
                     *  TODO(dan): should this be named AWSNetworkConfig?
                     */
                    cloudProviderConfig?: {
                        /**
                         * Subnet is the subnet to use for control plane cloud resources.
                         */
                        subnet?: {
                            /**
                             * ARN of resource
                             */
                            arn?: string
                            /**
                             * Filters is a set of key/value pairs used to identify a resource They are applied according to the rules defined by the AWS API: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_Filtering.html
                             */
                            filters?: {
                                /**
                                 * Name of the filter. Filter names are case-sensitive.
                                 */
                                name: string
                                /**
                                 * Values includes one or more filter values. Filter values are case-sensitive.
                                 */
                                values: string[]
                                [k: string]: unknown
                            }[]
                            /**
                             * ID of resource
                             */
                            id?: string
                            [k: string]: unknown
                        }
                        /**
                         * VPC is the VPC to use for control plane cloud resources.
                         */
                        vpc: string
                        /**
                         * Zone is the availability zone where control plane cloud resources are created.
                         */
                        zone?: string
                        [k: string]: unknown
                    }
                    /**
                     * ControlPlaneOperatorCreds is a reference to a secret containing cloud credentials with permissions matching the control-plane-operator policy. The secret should have exactly one key, `credentials`, whose value is an AWS credentials file.
                     *  TODO(dan): document the "control plane operator policy"
                     */
                    controlPlaneOperatorCreds: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    /**
                     * EndpointAccess specifies the publishing scope of cluster endpoints. The default is Public.
                     */
                    endpointAccess?: 'Public' | 'PublicAndPrivate' | 'Private'
                    /**
                     * KubeCloudControllerCreds is a reference to a secret containing cloud credentials with permissions matching the cloud controller policy. The secret should have exactly one key, `credentials`, whose value is an AWS credentials file.
                     *  TODO(dan): document the "cloud controller policy"
                     */
                    kubeCloudControllerCreds: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    /**
                     * NodePoolManagementCreds is a reference to a secret containing cloud credentials with permissions matching the node pool management policy. The secret should have exactly one key, `credentials`, whose value is an AWS credentials file.
                     *  TODO(dan): document the "node pool management policy"
                     */
                    nodePoolManagementCreds: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    /**
                     * Region is the AWS region in which the cluster resides. This configures the OCP control plane cloud integrations, and is used by NodePool to resolve the correct boot AMI for a given release.
                     */
                    region: string
                    /**
                     * ResourceTags is a list of additional tags to apply to AWS resources created for the cluster. See https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html for information on tagging AWS resources. AWS supports a maximum of 50 tags per resource. OpenShift reserves 25 tags for its use, leaving 25 tags available for the user.
                     */
                    resourceTags?: {
                        /**
                         * Key is the key of the tag.
                         */
                        key: string
                        /**
                         * Value is the value of the tag.
                         *  Some AWS service do not support empty values. Since tags are added to resources in many services, the length of the tag value must meet the requirements of all services.
                         */
                        value: string
                        [k: string]: unknown
                    }[]

                    /**
                     * Roles must contain exactly 4 entries representing the locators for roles supporting the following OCP services:
                     *  - openshift-ingress-operator/cloud-credentials - openshift-image-registry/installer-cloud-credentials - openshift-cluster-csi-drivers/ebs-cloud-credentials - cloud-network-config-controller/cloud-credentials
                     *  Each role has unique permission requirements whose documentation is TBD.
                     *  TODO(dan): revisit this field; it's really 3 required fields with specific content requirements
                     */
                    roles?: {
                        arn: string
                        name: string
                        namespace: string
                        [k: string]: unknown
                    }[]
                    /**
                     * ServiceEndpoints specifies optional custom endpoints which will override the default service endpoint of specific AWS Services.
                     *  There must be only one ServiceEndpoint for a given service name.
                     */
                    serviceEndpoints?: {
                        /**
                         * Name is the name of the AWS service. This must be provided and cannot be empty.
                         */
                        name: string
                        /**
                         * URL is fully qualified URI with scheme https, that overrides the default generated endpoint for a client. This must be provided and cannot be empty.
                         */
                        url: string
                        [k: string]: unknown
                    }[]
                    [k: string]: unknown
                }
                /**
                 * Azure defines azure specific settings
                 */
                azure?: {
                    /**
                     * LocalObjectReference contains enough information to let you locate the referenced object inside the same namespace.
                     */
                    credentials: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    location: string
                    machineIdentityID: string
                    resourceGroup: string
                    securityGroupName: string
                    subnetName: string
                    subscriptionID: string
                    vnetID: string
                    vnetName: string
                    [k: string]: unknown
                }
                /**
                 * IBMCloud defines IBMCloud specific settings for components
                 */
                ibmcloud?: {
                    /**
                     * ProviderType is a specific supported infrastructure provider within IBM Cloud.
                     */
                    providerType?: string
                    [k: string]: unknown
                }
                /**
                 * PowerVS specifies configuration for clusters running on IBMCloud Power VS Service. This field is immutable. Once set, It can't be changed.
                 */
                powervs?: {
                    /**
                     * ControlPlaneOperatorCreds is a reference to a secret containing cloud credentials with permissions matching the control-plane-operator policy. The secret should have exactly one key, `credentials`, whose value is an AWS credentials file. This field is immutable. Once set, It can't be changed.
                     *  TODO(dan): document the "control plane operator policy"
                     */
                    controlPlaneOperatorCreds: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    /**
                     * KubeCloudControllerCreds is a reference to a secret containing cloud credentials with permissions matching the cloud controller policy. The secret should have exactly one key, `credentials`, whose value is an AWS credentials file. This field is immutable. Once set, It can't be changed.
                     *  TODO(dan): document the "cloud controller policy"
                     */
                    kubeCloudControllerCreds: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    /**
                     * NodePoolManagementCreds is a reference to a secret containing cloud credentials with permissions matching the node pool management policy. The secret should have exactly one key, `credentials`, whose value is an AWS credentials file. This field is immutable. Once set, It can't be changed.
                     *  TODO(dan): document the "node pool management policy"
                     */
                    nodePoolManagementCreds: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    /**
                     * Region is the IBMCloud region in which the cluster resides. This configures the OCP control plane cloud integrations, and is used by NodePool to resolve the correct boot image for a given release. This field is immutable. Once set, It can't be changed.
                     */
                    region: string
                    /**
                     * ResourceGroup is the IBMCloud Resource Group in which the cluster resides. This field is immutable. Once set, It can't be changed.
                     */
                    resourceGroup: string
                    /**
                     * ServiceInstance is the reference to the Power VS service on which the server instance(VM) will be created. Power VS service is a container for all Power VS instances at a specific geographic region. serviceInstance can be created via IBM Cloud catalog or CLI. ServiceInstanceID is the unique identifier that can be obtained from IBM Cloud UI or IBM Cloud cli.
                     *  More detail about Power VS service instance. https://cloud.ibm.com/docs/power-iaas?topic=power-iaas-creating-power-virtual-server
                     *  This field is immutable. Once set, It can't be changed.
                     */
                    serviceInstanceID: string
                    /**
                     * Subnet is the subnet to use for control plane cloud resources. This field is immutable. Once set, It can't be changed.
                     */
                    subnet: {
                        /**
                         * ID of resource
                         */
                        id?: string
                        /**
                         * Name of resource
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    /**
                     * VPC specifies IBM Cloud PowerVS Load Balancing configuration for the control plane. This field is immutable. Once set, It can't be changed.
                     */
                    vpc: {
                        /**
                         * Name for VPC to used for all the service load balancer. This field is immutable. Once set, It can't be changed.
                         */
                        name: string
                        /**
                         * Region is the IBMCloud region in which VPC gets created, this VPC used for all the ingress traffic into the OCP cluster. This field is immutable. Once set, It can't be changed.
                         */
                        region: string
                        /**
                         * Subnet is the subnet to use for load balancer. This field is immutable. Once set, It can't be changed.
                         */
                        subnet?: string
                        /**
                         * Zone is the availability zone where load balancer cloud resources are created. This field is immutable. Once set, It can't be changed.
                         */
                        zone?: string
                        [k: string]: unknown
                    }
                    /**
                     * Zone is the availability zone where control plane cloud resources are created. This field is immutable. Once set, It can't be changed.
                     */
                    zone: string
                    [k: string]: unknown
                }
                /**
                 * Type is the type of infrastructure provider for the cluster.
                 */
                type: 'AWS' | 'None' | 'IBMCloud' | 'Agent' | 'KubeVirt' | 'Azure' | 'PowerVS'
                [k: string]: unknown
            }
            /**
             * PullSecret references a pull secret to be injected into the container runtime of all cluster nodes. The secret must have a key named ".dockerconfigjson" whose value is the pull secret JSON.
             */
            pullSecret: {
                /**
                 * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                 */
                name?: string
                [k: string]: unknown
            }
            /**
             * Release specifies the desired OCP release payload for the hosted cluster.
             *  Updating this field will trigger a rollout of the control plane. The behavior of the rollout will be driven by the ControllerAvailabilityPolicy and InfrastructureAvailabilityPolicy.
             */
            release: {
                /**
                 * Image is the image pullspec of an OCP release payload image.
                 */
                image: string
                [k: string]: unknown
            }
            /**
             * SecretEncryption specifies a Kubernetes secret encryption strategy for the control plane.
             */
            secretEncryption?: {
                /**
                 * AESCBC defines metadata about the AESCBC secret encryption strategy
                 */
                aescbc?: {
                    /**
                     * ActiveKey defines the active key used to encrypt new secrets
                     */
                    activeKey: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    /**
                     * BackupKey defines the old key during the rotation process so previously created secrets can continue to be decrypted until they are all re-encrypted with the active key.
                     */
                    backupKey?: {
                        /**
                         * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                         */
                        name?: string
                        [k: string]: unknown
                    }
                    [k: string]: unknown
                }
                /**
                 * KMS defines metadata about the kms secret encryption strategy
                 */
                kms?: {
                    /**
                     * AWS defines metadata about the configuration of the AWS KMS Secret Encryption provider
                     */
                    aws?: {
                        /**
                         * ActiveKey defines the active key used to encrypt new secrets
                         */
                        activeKey: {
                            /**
                             * ARN is the Amazon Resource Name for the encryption key
                             */
                            arn: string
                            [k: string]: unknown
                        }
                        /**
                         * Auth defines metadata about the management of credentials used to interact with AWS KMS
                         */
                        auth: {
                            /**
                             * Credentials contains the name of the secret that holds the aws credentials that can be used to make the necessary KMS calls. It should at key AWSCredentialsFileSecretKey contain the aws credentials file that can be used to configure AWS SDKs
                             */
                            credentials: {
                                /**
                                 * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                                 */
                                name?: string
                                [k: string]: unknown
                            }
                            [k: string]: unknown
                        }
                        /**
                         * BackupKey defines the old key during the rotation process so previously created secrets can continue to be decrypted until they are all re-encrypted with the active key.
                         */
                        backupKey?: {
                            /**
                             * ARN is the Amazon Resource Name for the encryption key
                             */
                            arn: string
                            [k: string]: unknown
                        }
                        /**
                         * Region contains the AWS region
                         */
                        region: string
                        [k: string]: unknown
                    }
                    /**
                     * IBMCloud defines metadata for the IBM Cloud KMS encryption strategy
                     */
                    ibmcloud?: {
                        /**
                         * Auth defines metadata for how authentication is done with IBM Cloud KMS
                         */
                        auth: {
                            /**
                             * Managed defines metadata around the service to service authentication strategy for the IBM Cloud KMS system (all provider managed).
                             */
                            managed?: {
                                [k: string]: unknown
                            }
                            /**
                             * Type defines the IBM Cloud KMS authentication strategy
                             */
                            type: 'Managed' | 'Unmanaged'
                            /**
                             * Unmanaged defines the auth metadata the customer provides to interact with IBM Cloud KMS
                             */
                            unmanaged?: {
                                /**
                                 * Credentials should reference a secret with a key field of IBMCloudIAMAPIKeySecretKey that contains a apikey to call IBM Cloud KMS APIs
                                 */
                                credentials: {
                                    /**
                                     * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                                     */
                                    name?: string
                                    [k: string]: unknown
                                }
                                [k: string]: unknown
                            }
                            [k: string]: unknown
                        }
                        /**
                         * KeyList defines the list of keys used for data encryption
                         */
                        keyList: {
                            /**
                             * CorrelationID is an identifier used to track all api call usage from hypershift
                             */
                            correlationID: string
                            /**
                             * CRKID is the customer rook key id
                             */
                            crkID: string
                            /**
                             * InstanceID is the id for the key protect instance
                             */
                            instanceID: string
                            /**
                             * KeyVersion is a unique number associated with the key. The number increments whenever a new key is enabled for data encryption.
                             */
                            keyVersion: number
                            /**
                             * URL is the url to call key protect apis over
                             */
                            url: string
                            [k: string]: unknown
                        }[]
                        /**
                         * Region is the IBM Cloud region
                         */
                        region: string
                        [k: string]: unknown
                    }
                    /**
                     * Provider defines the KMS provider
                     */
                    provider: 'IBMCloud' | 'AWS'
                    [k: string]: unknown
                }
                /**
                 * Type defines the type of kube secret encryption being used
                 */
                type: 'kms' | 'aescbc'
                [k: string]: unknown
            }
            /**
             * ServiceAccountSigningKey is a reference to a secret containing the private key used by the service account token issuer. The secret is expected to contain a single key named "key". If not specified, a service account signing key will be generated automatically for the cluster. When specifying a service account signing key, a IssuerURL must also be specified.
             */
            serviceAccountSigningKey?: {
                /**
                 * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                 */
                name?: string
                [k: string]: unknown
            }
            /**
             * Services specifies how individual control plane services are published from the hosting cluster of the control plane.
             *  If a given service is not present in this list, it will be exposed publicly by default.
             */
            services: {
                /**
                 * Service identifies the type of service being published.
                 */
                service: 'APIServer' | 'OAuthServer' | 'OIDC' | 'Konnectivity' | 'Ignition' | 'OVNSbDb'
                /**
                 * ServicePublishingStrategy specifies how to publish Service.
                 */
                servicePublishingStrategy: {
                    /**
                     * LoadBalancer configures exposing a service using a LoadBalancer.
                     */
                    loadBalancer?: {
                        /**
                         * Hostname is the name of the DNS record that will be created pointing to the LoadBalancer.
                         */
                        hostname?: string
                        [k: string]: unknown
                    }
                    /**
                     * NodePort configures exposing a service using a NodePort.
                     */
                    nodePort?: {
                        /**
                         * Address is the host/ip that the NodePort service is exposed over.
                         */
                        address: string
                        /**
                         * Port is the port of the NodePort service. If <=0, the port is dynamically assigned when the service is created.
                         */
                        port?: number
                        [k: string]: unknown
                    }
                    /**
                     * Route configures exposing a service using a Route.
                     */
                    route?: {
                        /**
                         * Hostname is the name of the DNS record that will be created pointing to the Route.
                         */
                        hostname?: string
                        [k: string]: unknown
                    }
                    /**
                     * Type is the publishing strategy used for the service.
                     */
                    type: 'LoadBalancer' | 'NodePort' | 'Route' | 'None' | 'S3'
                    [k: string]: unknown
                }
                [k: string]: unknown
            }[]
            /**
             * SSHKey references an SSH key to be injected into all cluster node sshd servers. The secret must have a single key "id_rsa.pub" whose value is the public part of an SSH key.
             */
            sshKey: {
                /**
                 * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                 */
                name?: string
                [k: string]: unknown
            }
            [k: string]: unknown
        }
        /**
         * HostingCluster only applies to ManifestWork, and specifies which managedCluster's namespace the manifestwork will be applied to. If not specified, the controller will flag an error condition. The HostingCluster would be the management cluster of the hostedcluster and nodepool generated by the hypershiftDeployment
         */
        hostingCluster: string
        /**
         * HostingNamespace specify the where the children resouces(hostedcluster, nodepool) to sit in if not provided, the default is "clusters"
         */
        hostingNamespace?: string
        /**
         * Infrastructure ID, this is used to tag resources in the Cloud Provider, it will be generated if not provided
         */
        'infra-id'?: string
        /**
         * Infrastructure instructions and pointers so either ClusterDeployment generates what is needed or skips it when the user provides the infrastructure values
         */
        infrastructure: {
            /**
             * CloudProvider secret, contains the Cloud credenetial, Pull Secret and Base Domain
             */
            cloudProvider?: {
                /**
                 * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                 */
                name?: string
                [k: string]: unknown
            }
            /**
             * Configure the infrastructure using the provided CloudProvider, or user provided
             */
            configure: boolean
            /**
             * Region is the AWS region in which the cluster resides. This configures the OCP control plane cloud integrations, and is used by NodePool to resolve the correct boot AMI for a given release.
             */
            platform?: {
                aws?: {
                    /**
                     * Region is the AWS region in which the cluster resides. This configures the OCP control plane cloud integrations, and is used by NodePool to resolve the correct boot AMI for a given release.
                     */
                    region: string
                    /**
                     * Zones are availability zones in the AWS region. NodePool resource is created in each zone and the NodePool name is suffixed by the zone name.
                     */
                    zones?: string[]
                    [k: string]: unknown
                }
                azure?: {
                    /**
                     * Region is the Azure region(location) in which the cluster resides. This configures the OCP control plane cloud integrations, and is used by NodePool to resolve the correct boot image for a given release.
                     */
                    location: string
                    [k: string]: unknown
                }
                [k: string]: unknown
            }
            [k: string]: unknown
        }
        /**
         * Reference to an array of NodePool resources on the HyperShift deployment namespace that will be applied to the ManagementCluster by ACM, required if InfraSpec.Configure is false
         */
        nodePoolReferences?: {
            /**
             * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
             */
            name?: string
            [k: string]: unknown
        }[]
        /**
         * NodePools is an array of NodePool resources that will be applied to the ManagementCluster by ACM, if omitted, a default NodePool will be generated
         */
        nodePools?: {
            /**
             * Name is the name to give this NodePool
             */
            name: string
            /**
             * Spec stores the NodePoolSpec you wan to use. If omitted, it will be generated
             */
            spec: {
                /**
                 * Autoscaling specifies auto-scaling behavior for the NodePool.
                 */
                autoScaling?: {
                    /**
                     * Max is the maximum number of nodes allowed in the pool. Must be >= 1.
                     */
                    max: number
                    /**
                     * Min is the minimum number of nodes to maintain in the pool. Must be >= 1.
                     */
                    min: number
                    [k: string]: unknown
                }
                /**
                 * ClusterName is the name of the HostedCluster this NodePool belongs to.
                 *  TODO(dan): Should this be a LocalObjectReference?
                 */
                clusterName: string
                /**
                 * Config is a list of references to ConfigMaps containing serialized MachineConfig resources to be injected into the ignition configurations of nodes in the NodePool. The MachineConfig API schema is defined here:
                 *  https://github.com/openshift/machine-config-operator/blob/master/pkg/apis/machineconfiguration.openshift.io/v1/types.go#L172
                 *  Each ConfigMap must have a single key named "config" whose value is the JSON or YAML of a serialized MachineConfig.
                 */
                config?: {
                    /**
                     * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
                     */
                    name?: string
                    [k: string]: unknown
                }[]
                /**
                 * Management specifies behavior for managing nodes in the pool, such as upgrade strategies and auto-repair behaviors.
                 */
                management: {
                    /**
                     * AutoRepair specifies whether health checks should be enabled for machines in the NodePool. The default is false.
                     */
                    autoRepair?: boolean
                    /**
                     * InPlace is the configuration for in-place upgrades.
                     */
                    inPlace?: {
                        [k: string]: unknown
                    }
                    /**
                     * Replace is the configuration for rolling upgrades.
                     */
                    replace?: {
                        /**
                         * RollingUpdate specifies a rolling update strategy which upgrades nodes by creating new nodes and deleting the old ones.
                         */
                        rollingUpdate?: {
                            /**
                             * MaxSurge is the maximum number of nodes that can be provisioned above the desired number of nodes.
                             *  Value can be an absolute number (ex: 5) or a percentage of desired nodes (ex: 10%).
                             *  Absolute number is calculated from percentage by rounding up.
                             *  This can not be 0 if MaxUnavailable is 0.
                             *  Defaults to 1.
                             *  Example: when this is set to 30%, new nodes can be provisioned immediately when the rolling update starts, such that the total number of old and new nodes do not exceed 130% of desired nodes. Once old nodes have been deleted, new nodes can be provisioned, ensuring that total number of nodes running at any time during the update is at most 130% of desired nodes.
                             */
                            maxSurge?: number | string
                            /**
                             * MaxUnavailable is the maximum number of nodes that can be unavailable during the update.
                             *  Value can be an absolute number (ex: 5) or a percentage of desired nodes (ex: 10%).
                             *  Absolute number is calculated from percentage by rounding down.
                             *  This can not be 0 if MaxSurge is 0.
                             *  Defaults to 0.
                             *  Example: when this is set to 30%, old nodes can be deleted down to 70% of desired nodes immediately when the rolling update starts. Once new nodes are ready, more old nodes be deleted, followed by provisioning new nodes, ensuring that the total number of nodes available at all times during the update is at least 70% of desired nodes.
                             */
                            maxUnavailable?: number | string
                            [k: string]: unknown
                        }
                        /**
                         * Strategy is the node replacement strategy for nodes in the pool.
                         */
                        strategy?: 'RollingUpdate' | 'OnDelete'
                        [k: string]: unknown
                    }
                    /**
                     * UpgradeType specifies the type of strategy for handling upgrades.
                     */
                    upgradeType: 'Replace' | 'InPlace'
                    [k: string]: unknown
                }
                /**
                 * Deprecated: Use Replicas instead. NodeCount will be dropped in the next api release.
                 */
                nodeCount?: number
                /**
                 * NodeDrainTimeout is the total amount of time that the controller will spend on draining a node. The default value is 0, meaning that the node can be drained without any time limitations. NOTE: NodeDrainTimeout is different from `kubectl drain --timeout` TODO (alberto): Today changing this field will trigger a recreate rolling update, which kind of defeats the purpose of the change. In future we plan to propagate this field in-place. https://github.com/kubernetes-sigs/cluster-api/issues/5880
                 */
                nodeDrainTimeout?: string
                /**
                 * Platform specifies the underlying infrastructure provider for the NodePool and is used to configure platform specific behavior.
                 */
                platform: {
                    /**
                     * Agent specifies the configuration used when using Agent platform.
                     */
                    agent?: {
                        /**
                         * AgentLabelSelector contains labels that must be set on an Agent in order to be selected for a Machine.
                         */
                        agentLabelSelector?: {
                            /**
                             * matchExpressions is a list of label selector requirements. The requirements are ANDed.
                             */
                            matchExpressions?: {
                                /**
                                 * key is the label key that the selector applies to.
                                 */
                                key: string
                                /**
                                 * operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist.
                                 */
                                operator: string
                                /**
                                 * values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.
                                 */
                                values?: string[]
                                [k: string]: unknown
                            }[]
                            /**
                             * matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.
                             */
                            matchLabels?: {
                                [k: string]: string
                            }
                            [k: string]: unknown
                        }
                        [k: string]: unknown
                    }
                    /**
                     * AWS specifies the configuration used when operating on AWS.
                     */
                    aws?: {
                        /**
                         * AMI is the image id to use for node instances. If unspecified, the default is chosen based on the NodePool release payload image.
                         */
                        ami?: string
                        /**
                         * InstanceProfile is the AWS EC2 instance profile, which is a container for an IAM role that the EC2 instance uses.
                         */
                        instanceProfile?: string
                        /**
                         * InstanceType is an ec2 instance type for node instances (e.g. m5.large).
                         */
                        instanceType: string
                        /**
                         * ResourceTags is an optional list of additional tags to apply to AWS node instances.
                         *  These will be merged with HostedCluster scoped tags, and HostedCluster tags take precedence in case of conflicts.
                         *  See https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html for information on tagging AWS resources. AWS supports a maximum of 50 tags per resource. OpenShift reserves 25 tags for its use, leaving 25 tags available for the user.
                         */
                        resourceTags?: {
                            /**
                             * Key is the key of the tag.
                             */
                            key: string
                            /**
                             * Value is the value of the tag.
                             *  Some AWS service do not support empty values. Since tags are added to resources in many services, the length of the tag value must meet the requirements of all services.
                             */
                            value: string
                            [k: string]: unknown
                        }[]

                        /**
                         * RootVolume specifies configuration for the root volume of node instances.
                         */
                        rootVolume?: {
                            /**
                             * IOPS is the number of IOPS requested for the disk. This is only valid for type io1.
                             */
                            iops?: number
                            /**
                             * Size specifies size (in Gi) of the storage device.
                             *  Must be greater than the image snapshot size or 8 (whichever is greater).
                             */
                            size: number
                            /**
                             * Type is the type of the volume.
                             */
                            type: string
                            [k: string]: unknown
                        }
                        /**
                         * SecurityGroups is an optional set of security groups to associate with node instances.
                         */
                        securityGroups?: {
                            /**
                             * ARN of resource
                             */
                            arn?: string
                            /**
                             * Filters is a set of key/value pairs used to identify a resource They are applied according to the rules defined by the AWS API: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_Filtering.html
                             */
                            filters?: {
                                /**
                                 * Name of the filter. Filter names are case-sensitive.
                                 */
                                name: string
                                /**
                                 * Values includes one or more filter values. Filter values are case-sensitive.
                                 */
                                values: string[]
                                [k: string]: unknown
                            }[]
                            /**
                             * ID of resource
                             */
                            id?: string
                            [k: string]: unknown
                        }[]
                        /**
                         * Subnet is the subnet to use for node instances.
                         */
                        subnet?: {
                            /**
                             * ARN of resource
                             */
                            arn?: string
                            /**
                             * Filters is a set of key/value pairs used to identify a resource They are applied according to the rules defined by the AWS API: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_Filtering.html
                             */
                            filters?: {
                                /**
                                 * Name of the filter. Filter names are case-sensitive.
                                 */
                                name: string
                                /**
                                 * Values includes one or more filter values. Filter values are case-sensitive.
                                 */
                                values: string[]
                                [k: string]: unknown
                            }[]
                            /**
                             * ID of resource
                             */
                            id?: string
                            [k: string]: unknown
                        }
                        [k: string]: unknown
                    }
                    azure?: {
                        /**
                         * AvailabilityZone of the nodepool. Must not be specified for clusters in a location that does not support AvailabilityZone.
                         */
                        availabilityZone?: string
                        diskSizeGB?: number
                        /**
                         * ImageID is the id of the image to boot from. If unset, the default image at the location below will be used: subscription/$subscriptionID/resourceGroups/$resourceGroupName/providers/Microsoft.Compute/images/rhcos.x86_64.vhd
                         */
                        imageID?: string
                        vmsize: string
                        [k: string]: unknown
                    }
                    /**
                     * IBMCloud defines IBMCloud specific settings for components
                     */
                    ibmcloud?: {
                        /**
                         * ProviderType is a specific supported infrastructure provider within IBM Cloud.
                         */
                        providerType?: string
                        [k: string]: unknown
                    }
                    /**
                     * Kubevirt specifies the configuration used when operating on KubeVirt platform.
                     */
                    kubevirt?: {
                        /**
                         * Compute contains values representing the virtual hardware requested for the VM
                         */
                        compute?: {
                            /**
                             * Cores represents how many cores the guest VM should have
                             */
                            cores?: number
                            /**
                             * Memory represents how much guest memory the VM should have
                             */
                            memory?: number | string
                            [k: string]: unknown
                        }
                        /**
                         * RootVolume represents values associated with the VM volume that will host rhcos
                         */
                        rootVolume: {
                            /**
                             * Image represents what rhcos image to use for the node pool
                             */
                            diskImage?: {
                                /**
                                 * ContainerDiskImage is a string representing the container image that holds the root disk
                                 */
                                containerDiskImage?: string
                                [k: string]: unknown
                            }
                            /**
                             * Persistent volume type means the VM's storage is backed by a PVC VMs that use persistent volumes can survive disruption events like restart and eviction This is the default type used when no storage type is defined.
                             */
                            persistent?: {
                                /**
                                 * Size is the size of the persistent storage volume
                                 */
                                size?: number | string
                                /**
                                 * StorageClass is the storageClass used for the underlying PVC that hosts the volume
                                 */
                                storageClass?: string
                                [k: string]: unknown
                            }
                            /**
                             * Type represents the type of storage to associate with the kubevirt VMs.
                             */
                            type?: 'Persistent'
                            [k: string]: unknown
                        }
                        [k: string]: unknown
                    }
                    /**
                     * PowerVS specifies the configuration used when using IBMCloud PowerVS platform.
                     */
                    powervs?: {
                        /**
                         * Image used for deploying the nodes. If unspecified, the default is chosen based on the NodePool release payload image.
                         */
                        image?: {
                            /**
                             * ID of resource
                             */
                            id?: string
                            /**
                             * Name of resource
                             */
                            name?: string
                            [k: string]: unknown
                        }
                        /**
                         * ImageDeletePolicy is policy for the image deletion.
                         *  delete: delete the image from the infrastructure. retain: delete the image from the openshift but retain in the infrastructure.
                         *  The default is delete
                         */
                        imageDeletePolicy?: 'delete' | 'retain'
                        /**
                         * MemoryGiB is the size of a virtual machine's memory, in GiB. maximum value for the MemoryGiB depends on the selected SystemType. when SystemType is set to e880 maximum MemoryGiB value is 7463 GiB. when SystemType is set to e980 maximum MemoryGiB value is 15307 GiB. when SystemType is set to s922 maximum MemoryGiB value is 942 GiB. The minimum memory is 32 GiB.
                         *  When omitted, this means the user has no opinion and the platform is left to choose a reasonable default. The current default is 32.
                         */
                        memoryGiB?: number
                        /**
                         * ProcessorType is the VM instance processor type. It must be set to one of the following values: Dedicated, Capped or Shared.
                         *  Dedicated: resources are allocated for a specific client, The hypervisor makes a 1:1 binding of a partition’s processor to a physical processor core. Shared: Shared among other clients. Capped: Shared, but resources do not expand beyond those that are requested, the amount of CPU time is Capped to the value specified for the entitlement.
                         *  if the processorType is selected as Dedicated, then Processors value cannot be fractional. When omitted, this means that the user has no opinion and the platform is left to choose a reasonable default. The current default is Shared.
                         */
                        processorType?: 'dedicated' | 'shared' | 'capped'
                        /**
                         * Processors is the number of virtual processors in a virtual machine. when the processorType is selected as Dedicated the processors value cannot be fractional. maximum value for the Processors depends on the selected SystemType. when SystemType is set to e880 or e980 maximum Processors value is 143. when SystemType is set to s922 maximum Processors value is 15. minimum value for Processors depends on the selected ProcessorType. when ProcessorType is set as Shared or Capped, The minimum processors is 0.5. when ProcessorType is set as Dedicated, The minimum processors is 1. When omitted, this means that the user has no opinion and the platform is left to choose a reasonable default. The default is set based on the selected ProcessorType. when ProcessorType selected as Dedicated, the default is set to 1. when ProcessorType selected as Shared or Capped, the default is set to 0.5.
                         */
                        processors?: number | string
                        /**
                         * StorageType for the image and nodes, this will be ignored if Image is specified. The storage tiers in PowerVS are based on I/O operations per second (IOPS). It means that the performance of your storage volumes is limited to the maximum number of IOPS based on volume size and storage tier. Although, the exact numbers might change over time, the Tier 3 storage is currently set to 3 IOPS/GB, and the Tier 1 storage is currently set to 10 IOPS/GB.
                         *  The default is tier1
                         */
                        storageType?: 'tier1' | 'tier3'
                        /**
                         * SystemType is the System type used to host the instance. systemType determines the number of cores and memory that is available. Few of the supported SystemTypes are s922,e880,e980. e880 systemType available only in Dallas Datacenters. e980 systemType available in Datacenters except Dallas and Washington. When omitted, this means that the user has no opinion and the platform is left to choose a reasonable default. The current default is s922 which is generally available.
                         */
                        systemType?: string
                        [k: string]: unknown
                    }
                    /**
                     * Type specifies the platform name.
                     */
                    type: 'AWS' | 'None' | 'IBMCloud' | 'Agent' | 'KubeVirt' | 'Azure' | 'PowerVS'
                    [k: string]: unknown
                }
                /**
                 * Release specifies the OCP release used for the NodePool. This informs the ignition configuration for machines, as well as other platform specific machine properties (e.g. an AMI on the AWS platform).
                 */
                release: {
                    /**
                     * Image is the image pullspec of an OCP release payload image.
                     */
                    image: string
                    [k: string]: unknown
                }
                /**
                 * Replicas is the desired number of nodes the pool should maintain. If unset, the default value is 0.
                 */
                replicas?: number
                [k: string]: unknown
            }
            [k: string]: unknown
        }[]
        /**
         * InfrastructureOverride allows support for special cases   OverrideDestroy = "ORPHAN"   InfraConfigureOnly = "INFRA-ONLY"   DeleteHostingNamespace = "DELETE-HOSTING-NAMESPACE"
         */
        override?: 'ORPHAN' | 'INFRA-ONLY' | 'DELETE-HOSTING-NAMESPACE'
        [k: string]: unknown
    }
    /**
     * HypershiftDeploymentStatus defines the observed state of HypershiftDeployment
     */
    status?: {
        /**
         * Track the conditions for each step in the desired curation that is being executed as a job
         */
        conditions?: {
            /**
             * lastTransitionTime is the last time the condition transitioned from one status to another. This should be when the underlying condition changed.  If that is not known, then using the time when the API field changed is acceptable.
             */
            lastTransitionTime: string
            /**
             * message is a human readable message indicating details about the transition. This may be an empty string.
             */
            message: string
            /**
             * observedGeneration represents the .metadata.generation that the condition was set based upon. For instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date with respect to the current state of the instance.
             */
            observedGeneration?: number
            /**
             * reason contains a programmatic identifier indicating the reason for the condition's last transition. Producers of specific condition types may define expected values and meanings for this field, and whether the values are considered a guaranteed API. The value should be a CamelCase string. This field may not be empty.
             */
            reason: string
            /**
             * status of the condition, one of True, False, Unknown.
             */
            status: 'True' | 'False' | 'Unknown'
            /**
             * type of condition in CamelCase or in foo.example.com/CamelCase. --- Many .condition.type values are consistent across resources like Available, but because arbitrary conditions can be useful (see .node.status.conditions), the ability to deconflict is important. The regex it matches is (dns1123SubdomainFmt/)?(qualifiedNameFmt)
             */
            type: string
            [k: string]: unknown
        }[]
        /**
         * Show which phase of curation is currently being processed
         */
        phase?: string
        [k: string]: unknown
    }
    [k: string]: unknown
}

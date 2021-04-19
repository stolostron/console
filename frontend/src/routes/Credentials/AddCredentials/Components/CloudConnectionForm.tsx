/* Copyright Contributors to the Open Cluster Management project */

import { makeStyles } from '@material-ui/styles'
import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmForm,
    AcmInlineProvider,
    AcmSelect,
    AcmSubmit,
    AcmTextInput,
    Provider,
} from '@open-cluster-management/ui-components'
import { AcmTextArea } from '@open-cluster-management/ui-components/lib/AcmTextArea/AcmTextArea'
import {
    ActionGroup,
    Button,
    Grid,
    GridItem,
    SelectOption,
    Text,
    TextContent,
    TextVariants,
    Title,
} from '@patternfly/react-core'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ProviderID, providers } from '../../../../lib/providers'
import {
    validateCertificate,
    validateGCProjectID,
    validateImageMirror,
    validateJSON,
    validateKubernetesDnsName,
    validateLibvirtURI,
    validatePrivateSshKey,
    validatePublicSshKey,
} from '../../../../lib/validation'
import { NavigationPath } from '../../../../NavigationPath'
import { AnsibleTowerSecret } from '../../../../resources/ansible-tower-secret'
import { FeatureGate } from '../../../../resources/feature-gate'
import {
    getProviderConnectionProviderID,
    ProviderConnection,
    replaceProviderConnection,
    setProviderConnectionProviderID,
} from '../../../../resources/provider-connection'

export default function CloudConnectionForm(props: {
    providerConnection: ProviderConnection
    projects: string[]
    discoveryFeatureGate: FeatureGate | undefined
    isEditing: boolean
}) {
    const { t } = useTranslation(['connection'])
    const history = useHistory()
    const discoveryFeatureGate = props.discoveryFeatureGate
    const alertContext = useContext(AcmAlertContext)

    const [providerConnection, setProviderConnection] = useState<ProviderConnection>(props.providerConnection)

    function updateProviderConnection(update: (providerConnection: ProviderConnection) => void) {
        const copy = { ...providerConnection }
        update(copy)
        setProviderConnection(copy)
    }

    const useStyles = makeStyles({
        providerSelect: {
            '& .pf-c-select__toggle-text': {
                padding: '4px 0',
            },
        },
    })

    const classes = useStyles()

    return (
        <AcmForm>
            <Title headingLevel="h4" size="xl">
                Select a provider and enter basic information
            </Title>
            <AcmSelect
                className={classes.providerSelect}
                id="providerName"
                label={t('addConnection.providerName.label')}
                placeholder={t('addConnection.providerName.placeholder')}
                labelHelp={t('addConnection.providerName.labelHelp')}
                value={getProviderConnectionProviderID(providerConnection)}
                onChange={(providerID) => {
                    updateProviderConnection((providerConnection) => {
                        setProviderConnectionProviderID(providerConnection, providerID as ProviderID)
                    })
                }}
                isDisabled={props.isEditing}
                isRequired
            >
                {providers
                    .filter((provider) => {
                        if (!discoveryFeatureGate && provider.key === ProviderID.RHOCM) {
                            return false // skip
                        }
                        return true
                    })
                    .map((provider) => {
                        let mappedProvider
                        switch (provider.key) {
                            case ProviderID.GCP:
                                mappedProvider = Provider.gcp
                                break
                            case ProviderID.AWS:
                                mappedProvider = Provider.aws
                                break
                            case ProviderID.AZR:
                                mappedProvider = Provider.azure
                                break
                            case ProviderID.VMW:
                                mappedProvider = Provider.vmware
                                break
                            case ProviderID.BMC:
                                mappedProvider = Provider.baremetal
                                break
                            case ProviderID.RHOCM:
                                mappedProvider = Provider.redhatcloud
                                break
                            case ProviderID.OST:
                                mappedProvider = Provider.openstack
                                break
                            case ProviderID.UKN:
                            default:
                                mappedProvider = Provider.other
                        }
                        return (
                            <SelectOption key={provider.key} value={provider.key}>
                                {/* {provider.name} */}
                                <AcmInlineProvider provider={mappedProvider} />
                            </SelectOption>
                        )
                    })}
            </AcmSelect>
            <AcmTextInput
                id="connectionName"
                label={t('addConnection.connectionName.label')}
                placeholder={t('addConnection.connectionName.placeholder')}
                labelHelp={t('addConnection.connectionName.labelHelp')}
                value={providerConnection.metadata.name}
                onChange={(name) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.metadata.name = name
                    })
                }}
                validation={(value) => validateKubernetesDnsName(value, 'Connection name', t)}
                isRequired
                isDisabled={props.isEditing}
            />
            <AcmSelect
                id="namespaceName"
                label={t('addConnection.namespaceName.label')}
                placeholder={t('addConnection.namespaceName.placeholder')}
                labelHelp={t('addConnection.namespaceName.labelHelp')}
                value={providerConnection.metadata.namespace}
                onChange={(namespace) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.metadata.namespace = namespace
                    })
                }}
                isRequired
                isDisabled={props.isEditing}
                variant="typeahead"
            >
                {props.projects.map((project) => (
                    <SelectOption key={project} value={project}>
                        {project}
                    </SelectOption>
                ))}
            </AcmSelect>
            <Title headingLevel="h4" size="xl" hidden={!getProviderConnectionProviderID(providerConnection)}>
                Configure your provider connection
            </Title>
            <AcmTextInput
                id="baseDomain"
                label={t('addConnection.baseDomain.label')}
                placeholder={t('addConnection.baseDomain.placeholder')}
                labelHelp={t('addConnection.baseDomain.labelHelp')}
                value={providerConnection.spec?.baseDomain}
                onChange={(baseDomain) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.baseDomain = baseDomain as string
                    })
                }}
                hidden={
                    !getProviderConnectionProviderID(providerConnection) ||
                    getProviderConnectionProviderID(providerConnection) === ProviderID.RHOCM
                }
                validation={(value) => {
                    const VALID_DNS_NAME_TESTER = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/
                    if (value) {
                        if (value.startsWith('.') && VALID_DNS_NAME_TESTER.test(value.substr(1))) {
                            return t('addConnection.baseDomain.baseDNSPeriod')
                        }
                        if (!VALID_DNS_NAME_TESTER.test(value)) {
                            return t('addConnection.valid.name')
                        }
                    }
                }}
            />
            <AcmTextInput
                id="awsAccessKeyID"
                label={t('addConnection.awsAccessKeyID.label')}
                placeholder={t('addConnection.awsAccessKeyID.placeholder')}
                labelHelp={t('addConnection.awsAccessKeyID.labelHelp')}
                value={providerConnection.spec?.awsAccessKeyID}
                onChange={(awsAccessKeyID) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.awsAccessKeyID = awsAccessKeyID
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AWS}
                isRequired
            />
            <AcmTextInput
                id="awsSecretAccessKeyID"
                label={t('addConnection.awsSecretAccessKeyID.label')}
                placeholder={t('addConnection.awsSecretAccessKeyID.placeholder')}
                labelHelp={t('addConnection.awsSecretAccessKeyID.labelHelp')}
                value={providerConnection.spec?.awsSecretAccessKeyID}
                onChange={(awsSecretAccessKeyID) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.awsSecretAccessKeyID = awsSecretAccessKeyID
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AWS}
                type="password"
                isRequired
            />
            <AcmTextInput
                id="baseDomainResourceGroupName"
                label={t('addConnection.baseDomainResourceGroupName.label')}
                placeholder={t('addConnection.baseDomainResourceGroupName.placeholder')}
                labelHelp={t('addConnection.baseDomainResourceGroupName.labelHelp')}
                value={providerConnection.spec?.baseDomainResourceGroupName}
                onChange={(baseDomainResourceGroupName) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.baseDomainResourceGroupName = baseDomainResourceGroupName
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                isRequired
            />
            <AcmTextInput
                id="clientId"
                label={t('addConnection.clientId.label')}
                placeholder={t('addConnection.clientId.placeholder')}
                labelHelp={t('addConnection.clientId.labelHelp')}
                value={providerConnection.spec?.clientId}
                onChange={(clientId) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.clientId = clientId
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                isRequired
            />
            <AcmTextInput
                id="clientSecret"
                label={t('addConnection.clientSecret.label')}
                placeholder={t('addConnection.clientSecret.placeholder')}
                labelHelp={t('addConnection.clientSecret.labelHelp')}
                value={providerConnection.spec?.clientSecret}
                onChange={(clientSecret) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.clientSecret = clientSecret
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                type="password"
                isRequired
            />
            <AcmTextInput
                id="subscriptionId"
                label={t('addConnection.subscriptionId.label')}
                placeholder={t('addConnection.subscriptionId.placeholder')}
                labelHelp={t('addConnection.subscriptionId.labelHelp')}
                value={providerConnection.spec?.subscriptionId}
                onChange={(subscriptionId) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.subscriptionId = subscriptionId
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                isRequired
            />
            <AcmTextInput
                id="tenantId"
                label={t('addConnection.tenantId.label')}
                placeholder={t('addConnection.tenantId.placeholder')}
                labelHelp={t('addConnection.tenantId.labelHelp')}
                value={providerConnection.spec?.tenantId}
                onChange={(tenantId) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.tenantId = tenantId
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.AZR}
                isRequired
            />
            <AcmTextInput
                id="gcProjectID"
                label={t('addConnection.gcProjectID.label')}
                placeholder={t('addConnection.gcProjectID.placeholder')}
                labelHelp={t('addConnection.gcProjectID.labelHelp')}
                value={providerConnection.spec?.gcProjectID}
                onChange={(gcProjectID) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.gcProjectID = gcProjectID
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.GCP}
                isRequired
                validation={(value) => validateGCProjectID(value, t)}
            />
            <AcmTextArea
                id="gcServiceAccountKey"
                label={t('addConnection.gcServiceAccountKey.label')}
                placeholder={t('addConnection.gcServiceAccountKey.placeholder')}
                labelHelp={t('addConnection.gcServiceAccountKey.labelHelp')}
                value={providerConnection.spec?.gcServiceAccountKey}
                onChange={(gcServiceAccountKey) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.gcServiceAccountKey = gcServiceAccountKey
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.GCP}
                isRequired
                validation={(value) => validateJSON(value, t)}
            />
            <AcmTextInput
                id="vcenter"
                label={t('addConnection.vcenter.label')}
                placeholder={t('addConnection.vcenter.placeholder')}
                labelHelp={t('addConnection.vcenter.labelHelp')}
                value={providerConnection.spec?.vcenter}
                onChange={(vcenter) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.vcenter = vcenter
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                isRequired
            />
            <AcmTextInput
                id="username"
                label={t('addConnection.username.label')}
                placeholder={t('addConnection.username.placeholder')}
                labelHelp={t('addConnection.username.labelHelp')}
                value={providerConnection.spec?.username}
                onChange={(username) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.username = username
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                isRequired
            />
            <AcmTextInput
                id="password"
                label={t('addConnection.password.label')}
                placeholder={t('addConnection.password.placeholder')}
                labelHelp={t('addConnection.password.labelHelp')}
                value={providerConnection.spec?.password}
                onChange={(password) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.password = password
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                type="password"
                isRequired
            />
            <AcmTextArea
                id="cacertificate"
                label={t('addConnection.cacertificate.label')}
                placeholder={t('addConnection.cacertificate.placeholder')}
                labelHelp={t('addConnection.cacertificate.labelHelp')}
                value={providerConnection.spec?.cacertificate}
                onChange={(cacertificate) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.cacertificate = cacertificate
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                isRequired
                validation={(value) => validateCertificate(value, t)}
            />
            <AcmTextInput
                id="vmClusterName"
                label={t('addConnection.vmClusterName.label')}
                placeholder={t('addConnection.vmClusterName.placeholder')}
                labelHelp={t('addConnection.vmClusterName.labelHelp')}
                value={providerConnection.spec?.vmClusterName}
                onChange={(vmClusterName) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.vmClusterName = vmClusterName
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                isRequired
            />
            <AcmTextInput
                id="datacenter"
                label={t('addConnection.datacenter.label')}
                placeholder={t('addConnection.datacenter.placeholder')}
                labelHelp={t('addConnection.datacenter.labelHelp')}
                value={providerConnection.spec?.datacenter}
                onChange={(datacenter) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.datacenter = datacenter
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                isRequired
            />
            <AcmTextInput
                id="datastore"
                label={t('addConnection.datastore.label')}
                placeholder={t('addConnection.datastore.placeholder')}
                labelHelp={t('addConnection.datastore.labelHelp')}
                value={providerConnection.spec?.datastore}
                onChange={(datastore) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.datastore = datastore
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.VMW}
                isRequired
            />
            <AcmTextArea
                id="openstackCloudsYaml"
                label={t('addConnection.openstackCloudsYaml.label')}
                placeholder={t('addConnection.openstackCloudsYaml.placeholder')}
                labelHelp={t('addConnection.openstackCloudsYaml.labelHelp')}
                value={providerConnection.spec?.openstackCloudsYaml}
                onChange={(openstackCloudsYaml) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.openstackCloudsYaml = openstackCloudsYaml
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.OST}
                isRequired
            />
            <AcmTextInput
                id="openstackCloud"
                label={t('addConnection.openstackCloud.label')}
                placeholder={t('addConnection.openstackCloud.placeholder')}
                labelHelp={t('addConnection.openstackCloud.labelHelp')}
                value={providerConnection.spec?.openstackCloud}
                onChange={(openstackCloud) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.openstackCloud = openstackCloud
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.OST}
                isRequired
            />

            <AcmTextInput
                id="libvirtURI"
                label={t('addConnection.libvirtURI.label')}
                placeholder={t('addConnection.libvirtURI.placeholder')}
                labelHelp={t('addConnection.libvirtURI.labelHelp')}
                value={providerConnection.spec?.libvirtURI}
                onChange={(libvirtURI) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.libvirtURI = libvirtURI
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
                isRequired
                validation={(value) => validateLibvirtURI(value, t)}
            />
            <AcmTextArea
                id="sshKnownHosts"
                label={t('addConnection.sshKnownHosts.label')}
                placeholder={t('addConnection.sshKnownHosts.placeholder')}
                labelHelp={t('addConnection.sshKnownHosts.labelHelp')}
                value={providerConnection.spec?.sshKnownHosts?.join?.('\n')}
                onChange={(sshKnownHosts) => {
                    updateProviderConnection((providerConnection) => {
                        const knownSSHs = sshKnownHosts
                            .trim()
                            .split(/[\r\n]+/g)
                            .map((ssh) => {
                                ssh = ssh.trim()
                                if (ssh.startsWith('-')) {
                                    ssh = ssh.substr(1).trim()
                                }
                                if (ssh.startsWith('"')) {
                                    ssh = ssh.substr(1)
                                }
                                if (ssh.endsWith('"')) {
                                    ssh = ssh.slice(0, -1)
                                }
                                return ssh
                            })
                        providerConnection.spec!.sshKnownHosts = knownSSHs
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
                isRequired
            />
            <AcmTextArea
                id="pullSecret"
                label={t('addConnection.pullSecret.label')}
                placeholder={t('addConnection.pullSecret.placeholder')}
                labelHelp={t('addConnection.pullSecret.labelHelp')}
                value={providerConnection.spec?.pullSecret}
                onChange={(pullSecret) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.pullSecret = pullSecret as string
                    })
                }}
                hidden={
                    !getProviderConnectionProviderID(providerConnection) ||
                    getProviderConnectionProviderID(providerConnection) === ProviderID.RHOCM
                }
                isRequired
                validation={(value) => validateJSON(value, t)}
            />
            <AcmTextArea
                id="sshPrivateKey"
                label={t('addConnection.sshPrivateKey.label')}
                placeholder={t('addConnection.sshPrivateKey.placeholder')}
                labelHelp={t('addConnection.sshPrivateKey.labelHelp')}
                resizeOrientation="vertical"
                value={providerConnection.spec?.sshPrivatekey}
                onChange={(sshPrivatekey) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.sshPrivatekey = sshPrivatekey as string
                    })
                }}
                hidden={
                    !getProviderConnectionProviderID(providerConnection) ||
                    getProviderConnectionProviderID(providerConnection) === ProviderID.RHOCM
                }
                validation={(value) => validatePrivateSshKey(value, t)}
                isRequired
            />
            <AcmTextArea
                id="sshPublicKey"
                label={t('addConnection.sshPublicKey.label')}
                placeholder={t('addConnection.sshPublicKey.placeholder')}
                labelHelp={t('addConnection.sshPublicKey.labelHelp')}
                resizeOrientation="vertical"
                value={providerConnection.spec?.sshPublickey}
                onChange={(sshPublickey) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.sshPublickey = sshPublickey as string
                    })
                }}
                hidden={
                    !getProviderConnectionProviderID(providerConnection) ||
                    getProviderConnectionProviderID(providerConnection) === ProviderID.RHOCM
                }
                validation={(value) => validatePublicSshKey(value, t)}
                isRequired
            />
            <Title
                headingLevel="h4"
                size="xl"
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
            >
                {t('addConnection.configureDisconnectedInstall.label')}
            </Title>
            <AcmTextInput
                id="imageMirror"
                label={t('addConnection.imageMirror.label')}
                placeholder={t('addConnection.imageMirror.placeholder')}
                labelHelp={t('addConnection.imageMirror.labelHelp')}
                value={providerConnection.spec?.imageMirror}
                onChange={(imageMirror) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.imageMirror = imageMirror as string
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
                validation={(value) => validateImageMirror(value, t)}
            />
            <AcmTextInput
                id="bootstrapOSImage"
                label={t('addConnection.bootstrapOSImage.label')}
                placeholder={t('addConnection.bootstrapOSImage.placeholder')}
                labelHelp={t('addConnection.bootstrapOSImage.labelHelp')}
                value={providerConnection.spec?.bootstrapOSImage}
                onChange={(bootstrapOSImage) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.bootstrapOSImage = bootstrapOSImage as string
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
            />
            <AcmTextInput
                id="clusterOSImage"
                label={t('addConnection.clusterOSImage.label')}
                placeholder={t('addConnection.clusterOSImage.placeholder')}
                labelHelp={t('addConnection.clusterOSImage.labelHelp')}
                value={providerConnection.spec?.clusterOSImage}
                onChange={(clusterOSImage) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.clusterOSImage = clusterOSImage as string
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
            />
            <AcmTextArea
                id="additionalTrustBundle"
                label={t('addConnection.additionalTrustBundle.label')}
                placeholder={t('addConnection.additionalTrustBundle.placeholder')}
                labelHelp={t('addConnection.additionalTrustBundle.labelHelp')}
                value={providerConnection.spec?.additionalTrustBundle}
                onChange={(additionalTrustBundle) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.additionalTrustBundle = additionalTrustBundle as string
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.BMC}
                validation={(value) => (value ? validateCertificate(value, t) : undefined)}
            />
            <AcmTextInput
                id="ocmAPIToken"
                label={t('addConnection.ocmapitoken.label')}
                placeholder={t('addConnection.ocmapitoken.placeholder')}
                labelHelp={t('addConnection.ocmapitoken.labelHelp')}
                value={providerConnection.spec?.ocmAPIToken}
                onChange={(ocmAPIToken) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.ocmAPIToken = ocmAPIToken as string
                    })
                }}
                hidden={getProviderConnectionProviderID(providerConnection) !== ProviderID.RHOCM}
                isRequired
                type="password"
            />

            <AcmAlertGroup isInline canClose padTop />
            {props.isEditing && (
                <ActionGroup>
                    <AcmSubmit
                        id="submit"
                        variant="primary"
                        onClick={() => {
                            const data = JSON.parse(JSON.stringify(providerConnection)) as ProviderConnection

                            const providerID = getProviderConnectionProviderID(data)
                            if (providerID !== ProviderID.AWS) {
                                delete data.spec!.awsAccessKeyID
                                delete data.spec!.awsSecretAccessKeyID
                            }
                            if (providerID !== ProviderID.AZR) {
                                delete data.spec!.baseDomainResourceGroupName
                                delete data.spec!.clientId
                                delete data.spec!.clientSecret
                                delete data.spec!.subscriptionId
                                delete data.spec!.tenantId
                            }
                            if (providerID !== ProviderID.BMC) {
                                delete data.spec!.libvirtURI
                                delete data.spec!.sshKnownHosts
                                delete data.spec!.imageMirror
                                delete data.spec!.bootstrapOSImage
                                delete data.spec!.clusterOSImage
                                delete data.spec!.additionalTrustBundle
                            }
                            if (providerID !== ProviderID.GCP) {
                                delete data.spec!.gcProjectID
                                delete data.spec!.gcServiceAccountKey
                            }
                            if (providerID !== ProviderID.VMW) {
                                delete data.spec!.username
                                delete data.spec!.password
                                delete data.spec!.vcenter
                                delete data.spec!.cacertificate
                                delete data.spec!.vmClusterName
                                delete data.spec!.datacenter
                                delete data.spec!.datastore
                            }
                            if (providerID !== ProviderID.RHOCM) {
                                delete data.spec!.ocmAPIToken
                            }
                            if (providerID !== ProviderID.OST) {
                                delete data.spec!.openstackCloudsYaml
                                delete data.spec!.openstackCloud
                            }

                            delete data.data

                            alertContext.clearAlerts()

                            return replaceProviderConnection(data)
                                .promise.then(() => {
                                    history.push(NavigationPath.credentials)
                                })
                                .catch((err) => {
                                    /* istanbul ignore else */
                                    if (err instanceof Error) {
                                        alertContext.addAlert({
                                            type: 'danger',
                                            title: t('common:request.failed'),
                                            message: err.message,
                                        })
                                    }
                                })
                        }}
                        label={t('addConnection.saveButton.label')}
                        processingLabel={t('addConnection.savingButton.label')}
                    />
                    <Button
                        variant="link"
                        onClick={
                            /* istanbul ignore next */ () => {
                                history.push(NavigationPath.credentials)
                            }
                        }
                    >
                        {t('addConnection.cancelButton.label')}
                    </Button>
                </ActionGroup>
            )}
        </AcmForm>
    )
}

export function CloudConnectionIntegrationForm(props: {
    ansibleSecrets: AnsibleTowerSecret[]
    providerConnection: ProviderConnection
}) {
    const { t } = useTranslation(['connection'])
    const [providerConnection, setProviderConnection] = useState<ProviderConnection>(props.providerConnection)
    function updateProviderConnection(update: (providerConnection: ProviderConnection) => void) {
        const copy = { ...providerConnection }
        update(copy)
        setProviderConnection(copy)
    }
    return (
        <AcmForm>
            <TextContent>
                <Grid>
                    <Text component={TextVariants.p}>Link to an integration's credential</Text>
                    <GridItem span={6}>
                        <Text component={TextVariants.small}>
                            Integrations allow you to bring in external tools to enable additional features. If you
                            don’t have a credential type for an integration tool, go back and add that credential before
                            you link it here.
                        </Text>
                    </GridItem>
                </Grid>
            </TextContent>

            <AcmSelect
                id="ansibleSecrets"
                label={t('addConnection.ansibleConnection.label')}
                placeholder={t('addConnection.ansibleConnection.placeholder')}
                value={providerConnection.spec?.anisibleSecretName}
                onChange={(name) => {
                    updateProviderConnection((providerConnection) => {
                        providerConnection.spec!.anisibleSecretName = name as string
                    })
                }}
            >
                {props.ansibleSecrets.map((secret) => (
                    <SelectOption key={secret.metadata.name} value={secret.metadata.name}>
                        {secret.metadata.name}
                    </SelectOption>
                ))}
            </AcmSelect>
        </AcmForm>
    )
}

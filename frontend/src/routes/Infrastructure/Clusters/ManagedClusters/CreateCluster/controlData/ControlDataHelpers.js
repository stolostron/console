/* Copyright Contributors to the Open Cluster Management project */

import {
  getValue,
  getCIDRValidator,
  getNumericValidator,
  VALIDATE_BASE_DNS_NAME_REQUIRED,
  VALID_DNS_LABEL,
  getURLValidator,
  getNoProxyValidator,
  getSourcePath,
} from '../../../../../../components/TemplateEditor'
import { getControlByID } from '../../../../../../lib/temptifly-utils'
import { listClusterImageSets } from '../../../../../../resources'
import { unpackProviderConnection } from '../../../../../../resources'
import { NavigationPath } from '../../../../../../NavigationPath'
import jsYaml from 'js-yaml'
import _ from 'lodash'
import { TemplateSummaryControl, TemplateLinkOutControl } from '../../../../../../components/TemplateSummaryModal'
import { ExternalLinkAltIcon } from '@patternfly/react-icons'
import { AutomationProviderHint } from '../../../../../../components/AutomationProviderHint.tsx'

const createAutomationTemplate = (t) => ({
  prompt: t('creation.ocp.cloud.add.template'),
  type: 'link',
  url: NavigationPath.addAnsibleAutomation,
  positionBottomRight: true,
  id: 'add-automation-template',
  icon: <ExternalLinkAltIcon />,
})
export const LOAD_OCP_IMAGES = (provider, t) => {
  return {
    query: () => {
      return listClusterImageSets().promise
    },
    emptyDesc: t('creation.ocp.cloud.no.ocp.images'),
    loadingDesc: t('creation.ocp.cloud.loading.ocp.images'),
    setAvailable: setAvailableOCPImages.bind(null, provider),
    setAvailableMap: setAvailableOCPMap.bind(null),
  }
}

const getImageName = (image) => {
  return `img${image
    .split(':')
    .pop()
    .replace(/[^\w.]|_/g, '-')}`
}

const getImageVersion = (image) => {
  const match = /(\d+.\d+.\d+)-/gm.exec(image)
  return _.get(match, '1', '')
}

export const getSimplifiedImageName = (image) => {
  const match = /.+:(.*)-/gm.exec(image)
  if (match && match[1]) {
    return `OpenShift ${match[1]}`
  }
}

export const numberedControlNameFunction = (i18nFunc) => (control, controlData, i18n) => {
  const { grpNum } = control
  return i18nFunc(i18n, [grpNum + 1])
}

export const getWorkerName = numberedControlNameFunction((i18n, num) =>
  i18n('creation.ocp.node.worker.pool.title', num)
)

export const setAvailableOCPImages = (provider, control, result) => {
  const { loading } = result
  const { data } = result
  const imageSets = data
  control.isLoading = false
  const error = imageSets ? null : result.error
  if (!control.available) {
    control.available = []
    control.availableMap = {}
  }
  if (control.available.length === 0 && (error || imageSets)) {
    if (error) {
      control.hasReplacements = true
      control.noHandlebarReplacements = true
      control.isFailed = true
    } else if (imageSets) {
      control.isLoaded = true
      control.hasReplacements = true
      control.noHandlebarReplacements = true
      imageSets.forEach((item) => {
        const { metadata, spec } = item
        const name = metadata?.name
        const visible = metadata?.labels?.visible
        const releaseImage = spec?.releaseImage
        // We only hide when visible is false. We consider visible the default
        if (visible !== 'false') {
          switch (provider) {
            case 'bmc':
              if (name.includes('img4.3')) {
                return
              }
              break
            case 'vmw':
              if (name.includes('img4.3') || name.includes('img4.4')) {
                return
              }
              break
            default:
              break
          }
          control.available.push(releaseImage)
          control.availableMap[releaseImage] = {
            replacements: {
              releaseImageReference: name,
              clusterImageSetComment: releaseImage,
              releaseImageVersion: getImageVersion(name),
            },
          }
        }
      })
      control.available.reverse()
    }
  } else {
    control.isLoading = loading
  }
}

export const setAvailableOCPMap = (control) => {
  const { active, availableMap, isFailed } = control
  if (active && !availableMap[active]) {
    availableMap[active] = !isFailed
      ? {
          replacements: {
            clusterReleaseImage: active,
            clusterImageSetName: getImageName(active),
            releaseImageVersion: getImageVersion(active),
          },
        }
      : {
          replacements: {
            releaseImage: active,
          },
        }
  }
}

export const setAvailableConnections = (control, secrets) => {
  const connections = secrets.filter((secret) => {
    const cedentalsType = secret.metadata.labels?.['cluster.open-cluster-management.io/type']
    return Array.isArray(control.providerId)
      ? control.providerId.includes(cedentalsType)
      : control.providerId === cedentalsType
  })
  control.availableMap = {}
  connections?.forEach?.((c) => {
    const unpackedSecret = unpackProviderConnection(c)
    const replacements = { ...(unpackedSecret.stringData ?? {}) }
    if (replacements['sshKnownHosts']) {
      replacements['sshKnownHosts'] = replacements['sshKnownHosts'].split('\n')
    }
    // handlebars don't like periods in ids, so use a substitute tag - OpenStack
    if (replacements['clouds.yaml']) {
      replacements['cloudsYaml'] = replacements['clouds.yaml']
    }
    // handlebars don't like periods in ids, so use a substitute tag - Azure
    if (replacements['osServicePrincipal.json']) {
      replacements['osServicePrincipalJson'] = replacements['osServicePrincipal.json']
    }
    // handlebars don't like periods in ids, so use a substitute tag - GCP
    if (replacements['osServiceAccount.json']) {
      replacements['osServiceAccountJson'] = replacements['osServiceAccount.json']
    }
    // RHV
    if (replacements['ovirt_ca_bundle']) {
      replacements['ovirtCaBundle'] = replacements['ovirt_ca_bundle']
    }
    if (!replacements['additionalTrustBundle']) {
      delete replacements['additionalTrustBundle']
    }
    if (!replacements['disconnectedAdditionalTrustBundle']) {
      delete replacements['disconnectedAdditionalTrustBundle']
    }
    control.availableMap[c.metadata.name] = { replacements }
    control.hasReplacements = true
    control.noHandlebarReplacements = true
    control.isLoaded = true
  })
  control.available = connections.map((secret) => secret.metadata.name).sort((a, b) => a.localeCompare(b))
  const perPostSection = control.groupControlData?.find(({ id }) => id === 'perPostSection')
  if (
    Array.isArray(control.providerId)
      ? !control.providerId.includes('hostinventory')
      : control.providerId !== 'hostinventory'
  ) {
    // unset default ansible secret for subscription wizard as it's not required
    if (control.setActive && !control.active && !perPostSection) {
      control.setActive(control.available[0])
    }
  }
}

export const setAvailableTemplates = (control, templates) => {
  control.available = templates.map((template) => template.metadata.name)
}

const PROXY_CONTROLS = ['httpProxy', 'httpsProxy', 'noProxy', 'additionalTrustBundle']

const onChangeProxy = (control, controlData) => {
  const infrastructure = getControlByID(controlData, 'connection')
  const { active, availableMap = {} } = infrastructure
  const replacements = _.get(availableMap[active], 'replacements')
  const useProxy = control.active
  PROXY_CONTROLS.forEach((pid) => {
    const ctrl = getControlByID(controlData, pid)
    if (ctrl) {
      ctrl.disabled = !useProxy
      if (ctrl.disabled) {
        ctrl.saveActive = ctrl.active
        ctrl.active = undefined
        if (replacements) {
          delete replacements[ctrl.id]
        }
      } else {
        ctrl.active = ctrl.saveActive
        if (replacements) {
          replacements[ctrl.id] = ctrl.saveActive
        }
      }
    }
  })
}

const someControlsHaveReplacements = (controls, replacements) => controls.some((control) => !!replacements[control])
const enableControls = (controls, controlData) =>
  controls.forEach((control) => {
    const controlObject = getControlByID(controlData, control)
    if (controlObject) {
      controlObject.disabled = false
    }
  })

export const onChangeConnection = (control, controlData) => {
  const { active, availableMap = {} } = control
  const replacements = _.get(availableMap[active], 'replacements')
  if (replacements) {
    controlData.forEach((control) => {
      switch (control.id) {
        case 'hasProxy':
          control.active = someControlsHaveReplacements(PROXY_CONTROLS, replacements)
          if (control.active) {
            enableControls(PROXY_CONTROLS, controlData) // enable all controls; values will be set in default case block
          } else {
            onChangeProxy(control, controlData) // new connection does not specify proxy; stash current values
          }
          break
        case 'isDisconnected':
          control.active = someControlsHaveReplacements(DISCONNECTED_CONTROLS, replacements)
          if (control.active) {
            enableControls(DISCONNECTED_CONTROLS, controlData) // enable all controls; values will be set in default case block
          } else {
            onChangeDisconnect(control, controlData) // new connection does not specify disconnected; stash current values
          }
          break
        default:
          if (replacements[control.id]) {
            switch (control.type) {
              case 'values':
                control.active = replacements[control.id].split(',')
                break
              default:
                control.active = replacements[control.id]
                break
            }
          }
          break
      }
    })
  }
}

const DISCONNECTED_CONTROLS = ['clusterOSImage', 'imageContentSources', 'disconnectedAdditionalTrustBundle']

export const onChangeDisconnect = (control, controlData) => {
  const infrastructure = getControlByID(controlData, 'connection')
  const { active, availableMap = {} } = infrastructure
  const replacements = _.get(availableMap[active], 'replacements')
  const isDisconnected = control.active
  DISCONNECTED_CONTROLS.forEach((pid) => {
    const ctrl = getControlByID(controlData, pid)
    if (ctrl) {
      ctrl.disabled = !isDisconnected
      if (ctrl.disabled) {
        ctrl.saveActive = ctrl.active
        ctrl.active = undefined
        if (replacements) {
          delete replacements[ctrl.id]
        }
      } else {
        ctrl.active = ctrl.saveActive
        if (replacements) {
          replacements[ctrl.id] = ctrl.saveActive
        }
      }
    }
  })
}
export function getOSTNetworkingControlData(t) {
  // Kuryr should only be available for Openstack
  const networkData = networkingControlData(t)
  const modifiedData = networkData.find((object) => object.id == 'networkType')
  modifiedData.available.push('Kuryr')
  return networkData
}

export const onImageChange = (control, controlData) => {
  const networkDefault = getControlByID(controlData, 'networkType')
  if (networkDefault) {
    const { setActive } = networkDefault
    const { active: version } = control

    if (versionGreater(version, 4, 11)) {
      setActive('OVNKubernetes')
    } else {
      setActive('OpenShiftSDN')
    }
  }
}

export const reverseImageSet = (control, templateObject) => {
  const active = _.get(templateObject, getSourcePath('ClusterDeployment[0].spec.provisioning.imageSetRef.name'))
  if (active && !control.active) {
    control.active = active.$v
  }
  return control
}

export const clusterDetailsControlData = (t) => {
  return [
    {
      name: t('creation.ocp.name'),
      tooltip: t('tooltip.creation.ocp.name'),
      placeholder: t('creation.ocp.name.placeholder'),
      id: 'name',
      type: 'text',
      validation: {
        constraint: VALID_DNS_LABEL,
        notification: t('import.form.invalid.dns.label'),
        required: true,
      },
      reverse: 'ClusterDeployment[0].metadata.name',
    },
    {
      name: t('creation.ocp.clusterSet'),
      tooltip: t('tooltip.creation.ocp.clusterSet'),
      id: 'clusterSet',
      type: 'singleselect',
      placeholder: t('placeholder.creation.ocp.clusterSet'),
      validation: {
        required: false,
      },
      available: [],
    },
    {
      name: t('creation.ocp.baseDomain'),
      tooltip: t('tooltip.creation.ocp.baseDomain'),
      placeholder: t('placeholder.creation.ocp.baseDomain'),
      id: 'baseDomain',
      type: 'text',
      validation: VALIDATE_BASE_DNS_NAME_REQUIRED,
      tip: t(
        'All DNS records must be subdomains of this base and include the cluster name. This cannot be changed after cluster installation.'
      ),
    },
    {
      name: t('cluster.create.ocp.fips'),
      id: 'fips',
      type: 'checkbox',
      active: false,
      tip: t(
        'Use the Federal Information Processing Standards (FIPS) modules provided with Red Hat Enterprise Linux CoreOS instead of the default Kubernetes cryptography suite.'
      ),
    },
    {
      id: 'showSecrets',
      type: 'hidden',
      active: false,
    },
  ]
}

export const clusterPoolDetailsControlData = (t) => {
  return [
    {
      name: t('creation.ocp.name'),
      tooltip: t('tooltip.creation.ocp.name'),
      placeholder: t('creation.ocp.name.placeholder'),
      id: 'name',
      type: 'text',
      validation: {
        constraint: VALID_DNS_LABEL,
        notification: t('import.form.invalid.dns.label'),
        required: true,
      },
      reverse: 'ClusterPool[0].metadata.name',
    },
    {
      name: t('creation.ocp.clusterSet'),
      tooltip: t('tooltip.creation.ocp.clusterSet'),
      id: 'clusterSet',
      type: 'singleselect',
      placeholder: t('placeholder.creation.ocp.clusterSet'),
      validation: {
        required: false,
      },
      available: [],
    },
    {
      name: t('creation.ocp.baseDomain'),
      tooltip: t('tooltip.creation.ocp.baseDomain'),
      placeholder: t('placeholder.creation.ocp.baseDomain'),
      id: 'baseDomain',
      type: 'text',
      validation: VALIDATE_BASE_DNS_NAME_REQUIRED,
      tip: t(
        'All DNS records must be subdomains of this base and include the cluster name. This cannot be changed after cluster installation.'
      ),
    },
    {
      name: t('cluster.create.ocp.fips'),
      id: 'fips',
      type: 'checkbox',
      active: false,
      tip: t(
        'Use the Federal Information Processing Standards (FIPS) modules provided with Red Hat Enterprise Linux CoreOS instead of the default Kubernetes cryptography suite.'
      ),
    },
  ]
}

export const networkingControlData = (t) => {
  return [
    ///////////////////////  networking  /////////////////////////////////////
    {
      id: 'networkInfo',
      type: 'title',
      info: t('Configure network access for your cluster. One network is created by default.'),
    },
    {
      id: 'networkType',
      name: t('creation.ocp.cluster.network.type'),
      tooltip: t('tooltip.creation.ocp.cluster.network.type'),
      type: 'singleselect',
      active: 'OVNKubernetes',
      available: ['OpenShiftSDN', 'OVNKubernetes'],
      validation: {
        notification: t('creation.ocp.cluster.valid.key'),
        required: true,
      },
    },
    {
      id: 'networks',
      type: 'group',
      prompts: {
        addPrompt: t('creation.ocp.cluster.add.network'),
        deletePrompt: t('creation.ocp.cluster.delete.network'),
      },
      controlData: [
        {
          id: 'networkGroup',
          type: 'section',
          collapsable: true,
          subtitle: numberedControlNameFunction((i18n, num) => i18n('creation.ocp.node.network.title', num)),
          info: t('creation.ocp.node.network.info'),
        },
        {
          id: 'clusterNetwork',
          type: 'text',
          name: t('creation.ocp.cluster.network'),
          tooltip: t('tooltip.creation.ocp.cluster.network'),
          placeholder: t('creation.ocp.cluster.network.placeholder'),
          active: '10.128.0.0/14',
          validation: getCIDRValidator(t),
        },
        {
          id: 'hostPrefix',
          type: 'text',
          name: t('creation.ocp.cluster.network.host.prefix'),
          tooltip: t('tooltip.creation.ocp.cluster.network.host.prefix'),
          placeholder: t('creation.ocp.cluster.network.host.prefix.placeholder'),
          active: '23',
          validation: getNumericValidator(t),
        },
        {
          id: 'serviceNetwork',
          type: 'text',
          name: t('creation.ocp.service.network'),
          tooltip: t('tooltip.creation.ocp.service.network'),
          placeholder: t('creation.ocp.service.network.placeholder'),
          active: '172.30.0.0/16',
          validation: getCIDRValidator(t),
        },
        {
          id: 'machineCIDR',
          type: 'text',
          name: t('creation.ocp.machine.cidr'),
          tooltip: t('tooltip.creation.ocp.machine.cidr'),
          placeholder: t('creation.ocp.machine.cidr.placeholder'),
          active: '10.0.0.0/16',
          validation: getCIDRValidator(t),
        },
      ],
    },
  ]
}

export const proxyControlData = (t) => {
  return [
    {
      id: 'proxyStep',
      type: 'step',
      title: t('Proxy'),
    },
    {
      id: 'proxyInfo',
      type: 'title',
      info: t(
        'Production environments can deny direct access to the Internet and instead have an HTTP or HTTPS proxy available. You can configure a new OpenShift Container Platform cluster to use a proxy by configuring the proxy settings.'
      ),
    },
    {
      name: t('Use proxy'),
      id: 'hasProxy',
      type: 'checkbox',
      active: false,
      onSelect: onChangeProxy,
    },
    {
      id: 'httpProxy',
      type: 'text',
      name: t('HTTP proxy'),
      disabled: true,
      tip: t('Requires this format: http://<username>:<pswd>@<ip>:<port>'),
      validation: getURLValidator(t),
    },
    {
      id: 'httpsProxy',
      type: 'text',
      name: t('HTTPS proxy'),
      tip: t('Requires this format: https://<username>:<pswd>@<ip>:<port>'),
      disabled: true,
      validation: getURLValidator(t),
    },
    {
      active: [],
      id: 'noProxy',
      type: 'values',
      name: t('No proxy'),
      disabled: true,
      tip: t('noProxyTip'),
      validation: getNoProxyValidator(t),
    },
    {
      id: 'additionalTrustBundle',
      type: 'textarea',
      name: t('Additional trust bundle'),
      disabled: true,
      placeholder: '-----BEGIN CERTIFICATE-----\n<MY_TRUSTED_CA_CERT>\n-----END CERTIFICATE-----',
    },
  ]
}

export const onChangeAutomationTemplate = (control, controlData) => {
  const clusterCuratorSpec = getControlByID(controlData, 'clusterCuratorSpec')
  const reconcilePause = getControlByID(controlData, 'reconcilePause')
  // TODO: include namespace in key
  const clusterCuratorTemplate = control.availableData.find((cc) => cc.metadata.name === control.active)
  const curations = getControlByID(controlData, 'supportedCurations')?.active
  if (control.active && clusterCuratorTemplate) {
    const clusterCurator = _.cloneDeep(clusterCuratorTemplate)
    if (clusterCurator.spec?.install?.prehook?.length || clusterCurator.spec?.install?.posthook?.length) {
      clusterCurator.spec.desiredCuration = 'install'
    }
    if (clusterCurator.spec?.install?.prehook?.length) {
      reconcilePause.active = 'true'
    }
    curations.forEach((curation) => {
      if (clusterCurator?.spec?.[curation]?.towerAuthSecret) {
        // Create copies of each Ansible secret
        const secretName = `toweraccess-${curation}`
        const secretControl = getControlByID(controlData, secretName)
        const matchingSecret = control.availableSecrets.find(
          (s) =>
            s.metadata.name === clusterCurator.spec[curation].towerAuthSecret &&
            s.metadata.namespace === clusterCuratorTemplate.metadata.namespace
        )
        secretControl.active = _.cloneDeep(matchingSecret)
        clusterCurator.spec[curation].towerAuthSecret = secretName
      }
    })
    clusterCuratorSpec.active = jsYaml.dump({ spec: clusterCurator.spec })
  } else {
    // Clear Ansible secrets
    curations.forEach((curation) => {
      const secretName = `toweraccess-${curation}`
      const secretControl = getControlByID(controlData, secretName)
      secretControl.active = ''
    })
    clusterCuratorSpec.active = ''
    reconcilePause.active = ''
  }
}

const reverseClusterCuratorSpec = (control, templateObject) => {
  // preserve user modifications to ClusterCurator if valid YAML
  const active = getValue(templateObject, 'ClusterCurator[0].spec')
  if (active) {
    control.active = jsYaml.dump({ spec: active })
  }
}

export const automationControlData = (t) => {
  return [
    ///////////////////////  automation  /////////////////////////////////////
    {
      id: 'automationStep',
      type: 'step',
      title: t('template.clusterCreate.title'),
    },
    {
      id: 'chooseTemplate',
      type: 'title',
      info: t('template.clusterCreate.info'),
    },
    {
      type: 'custom',
      id: 'automationProviderHint',
      component: <AutomationProviderHint component="hint" className="creation-view-controls-hint" />,
    },
    {
      name: t('template.clusterCreate.name'),
      id: 'templateName',
      type: 'singleselect',
      tooltip: t('template.clusterCreate.tooltip'),
      placeholder: t('template.clusterCreate.select.placeholder'),
      onSelect: onChangeAutomationTemplate,
      validation: {
        required: false,
      },
      prompts: createAutomationTemplate(t),
    },
    {
      type: 'custom',
      id: 'curatorLinkOut',
      component: <TemplateLinkOutControl />,
    },
    {
      type: 'custom',
      id: 'curatorSummary',
      component: <TemplateSummaryControl />,
    },
    {
      id: 'clusterCuratorSpec',
      type: 'hidden',
      active: '',
      reverse: reverseClusterCuratorSpec,
    },
    {
      id: 'supportedCurations',
      type: 'values',
      hidden: true,
      active: [],
    },
    {
      id: 'toweraccess-install',
      type: 'hidden',
      active: '',
    },
    {
      id: 'toweraccess-upgrade',
      type: 'hidden',
      active: '',
    },
    {
      id: 'toweraccess-scale',
      type: 'hidden',
      active: '',
    },
    {
      id: 'toweraccess-destroy',
      type: 'hidden',
      active: '',
    },
    {
      active: '',
      id: 'reconcilePause',
      type: 'hidden',
    },
  ]
}

export const architectureData = (t) => {
  return [
    {
      name: t('CPU architecture'),
      placeholder: t('Enter CPU architecture'),
      tooltip: t('tooltip.architecture'),
      id: 'architecture',
      type: 'singleselect',
      available: ['amd64', 'arm64', 's390x', 'ppc64le'],
      cacheUserValueKey: 'create.cluster.architecture',
    },
  ]
}

const versionRegex = /release:([\d]{1,5})\.([\d]{1,5})\.([\d]{1,5})/
function versionGreater(version, x, y) {
  const matches = version.match(versionRegex)
  return matches && parseInt(matches[1], 10) >= x && parseInt(matches[2], 10) > y
}

export const isHidden_lt_OCP48 = (control, controlData) => {
  const singleNodeFeatureFlag = getControlByID(controlData, 'singleNodeFeatureFlag')
  const imageSet = getControlByID(controlData, 'imageSet')
  if (singleNodeFeatureFlag && singleNodeFeatureFlag.active && imageSet && imageSet.active) {
    return !versionGreater(imageSet.active, 4, 7)
  }
  return true
}

export const isHidden_gt_OCP46 = (control, controlData) => {
  const imageSet = getControlByID(controlData, 'imageSet')
  return imageSet && imageSet.active && versionGreater(imageSet.active, 4, 6)
}

export const isHidden_SNO = (control, controlData) => {
  const singleNode = getControlByID(controlData, 'singleNode')
  return singleNode && singleNode.active && !isHidden_lt_OCP48(control, controlData)
}

export const onChangeSNO = (control, controlData) => {
  const groupDataArray = getControlByID(controlData, 'workerPools').active
  groupDataArray.forEach((group) => {
    var computeNodeCount = group.find(({ id }) => id === 'computeNodeCount')
    if (!control.active) {
      if (computeNodeCount) {
        computeNodeCount.active = '3'
      }
    }
  })
}

export const addSnoText = (controlData, t) => {
  const masterPool = controlData.find((object) => object.id == 'masterPool')
  const poolControlData = masterPool.controlData.find((object) => object.id == 'masterPool')
  poolControlData.info = t('creation.ocp.node.controlplane.pool.info.sno_enabled')
}

export const arrayItemHasKey = (options, key) => {
  return options && options.some((o) => o[key])
}

export const append = (...args) => Array.prototype.slice.call(args, 0, -1).join('')

export const appendKlusterletAddonConfig = (includeKlusterletAddonConfig, controlData) => {
  const klusterletAddonConfigIdx = controlData.findIndex((control) => control.id === 'includeKlusterletAddonConfig')
  if (klusterletAddonConfigIdx > -1) {
    controlData[klusterletAddonConfigIdx].active = includeKlusterletAddonConfig
    return
  }
  controlData.push({
    id: 'includeKlusterletAddonConfig',
    type: 'hidden',
    active: includeKlusterletAddonConfig,
  })
}

export const appendWarning = (warning, controlData) => {
  const warningIdx = controlData.findIndex((control) => control.id === 'warning')
  if (warningIdx > -1) {
    controlData[warningIdx].active = warning
  }
  controlData.push({
    id: 'warning',
    type: 'custom',
    component: warning,
  })
}

export const disabledForFirstInGroup = (control) => {
  return control.grpNum === 0
}

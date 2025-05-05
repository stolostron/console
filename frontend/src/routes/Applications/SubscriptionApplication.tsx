/* Copyright Contributors to the Open Cluster Management project */
import { Modal, ModalVariant, PageSection } from '@patternfly/react-core'
import {
  AcmErrorBoundary,
  AcmPage,
  AcmPageContent,
  AcmPageHeader,
  AcmToastContext,
  Provider,
} from '../../ui-components'
import Handlebars from 'handlebars'
import _ from 'lodash'
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
// include monaco editor
import MonacoEditor from 'react-monaco-editor'
import { useLocation, useNavigate, Location, generatePath } from 'react-router-dom-v5-compat'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import TemplateEditor from '../../components/TemplateEditor'
import { getErrorInfo } from '../../components/ErrorPage'
import { useTranslation } from '../../lib/acm-i18next'
import { useSearchParams } from '../../lib/search'
import { NavigationPath } from '../../NavigationPath'
import {
  ApplicationKind,
  Channel,
  IResource,
  ProviderConnection,
  ProviderConnectionApiVersion,
  ProviderConnectionKind,
  Secret,
  SubscriptionKind,
  unpackProviderConnection,
} from '../../resources'
import { reconcileResources, updateAppResources } from '../../resources/utils'
import './style.css'
import { getApplicationResources } from '../Applications/CreateApplication/Subscription/transformers/transform-data-to-resources'
import { getApplication } from './ApplicationDetails/ApplicationTopology/model/application'
// Template Data
import { controlData as getControlData } from './CreateApplication/Subscription/controlData/ControlData'
import createTemplate from './CreateApplication/Subscription/templates/template.hbs'
import gitTemplate from './CreateApplication/Subscription/templates/templateGit.hbs'
import helmTemplate from './CreateApplication/Subscription/templates/templateHelm.hbs'
import ObjTemplate from './CreateApplication/Subscription/templates/templateObjectStore.hbs'
import otherTemplate from './CreateApplication/Subscription/templates/templateOther.hbs'
import placementTemplate from './CreateApplication/Subscription/templates/templatePlacement.hbs'
import { CredentialsForm } from '../Credentials/CredentialsForm'
import { useProjects } from '../../hooks/useProjects'
import { setAvailableConnections } from '../Infrastructure/Clusters/ManagedClusters/CreateCluster/controlData/ControlDataHelpers'
import { LoadingPage } from '../../components/LoadingPage'
import { PluginContext } from '../../lib/PluginContext'
import { useIsHubSelfManaged, useLocalHubName } from '../../hooks/use-local-hub'

interface CreationStatus {
  status: string
  messages: any[] | null
}

// where to put Create/Cancel buttons
const Portals = Object.freeze({
  editBtn: 'edit-button-portal-id',
  createBtn: 'create-button-portal-id',
  cancelBtn: 'cancel-button-portal-id',
})

export default function CreateSubscriptionApplicationPage() {
  const { t } = useTranslation()
  const [title, setTitle] = useState<string>(t('Create application'))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toggledControl, setToggledControl] = useState<any>()
  const [newSecret, setNewSecret] = useState<Secret>()
  const { secretsState } = useSharedAtoms()
  const secrets = useRecoilValue(secretsState)
  const { projects } = useProjects()

  const [connectionControl, setConnectionControl] = useState<any>()
  const onControlChange = useCallback(
    (control: any) => {
      if (control.id === 'connection') {
        if (newSecret && toggledControl?.setActive && toggledControl.newSecretNew !== newSecret.metadata.name) {
          toggledControl.setActive(newSecret.metadata.name)
          toggledControl.newSecretNew = newSecret.metadata.name
        }
      }
    },
    [newSecret, toggledControl]
  )

  // if a connection is added outside of wizard, add it to connection selection
  useEffect(() => {
    if (connectionControl) {
      setAvailableConnections(
        connectionControl,
        secrets.filter(
          (secret) =>
            !secret.metadata.labels?.['cluster.open-cluster-management.io/copiedFromNamespace'] ||
            !secret.metadata.labels?.['cluster.open-cluster-management.io/copiedFromSecretName']
        )
      )
      onControlChange(connectionControl)
    }
  }, [connectionControl, onControlChange, secrets])

  // create portals for buttons in header
  const switches = (
    <div className="switch-controls">
      <div id={Portals.editBtn} />
    </div>
  )

  const portals = (
    <div className="portal-controls">
      <div id={Portals.cancelBtn} />
      <div id={Portals.createBtn} />
    </div>
  )

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  const handleModalToggleWithContext = (control: any) => {
    setToggledControl(control)
    handleModalToggle()
  }

  return (
    <AcmPage
      header={
        <AcmPageHeader
          title={title}
          breadcrumb={[{ text: t('Applications'), to: NavigationPath.applications }, { text: title }]}
          switches={switches}
          actions={portals}
        />
      }
    >
      <AcmErrorBoundary>
        <AcmPageContent id="subscription-application-editor">
          <PageSection variant="light" type="wizard">
            <Modal
              variant={ModalVariant.large}
              showClose={false}
              isOpen={isModalOpen}
              aria-labelledby="modal-wizard-label"
              aria-describedby="modal-wizard-description"
              onClose={handleModalToggle}
              hasNoBodyWrapper
            >
              <CredentialsForm
                namespaces={projects}
                isEditing={false}
                isViewing={false}
                credentialsType={Provider.ansible}
                handleModalToggle={handleModalToggle}
                hideYaml={true}
                newCredentialCallback={setNewSecret}
              />
            </Modal>
            {CreateSubscriptionApplication(
              setTitle,
              handleModalToggleWithContext,
              setConnectionControl,
              onControlChange
            )}
          </PageSection>
        </AcmPageContent>
      </AcmErrorBoundary>
    </AcmPage>
  )
}

export function CreateSubscriptionApplication(
  setTitle: Dispatch<SetStateAction<string>>,
  handleModalToggleWithContext: (affectedControl: any) => void,
  setConnectionControl: Dispatch<SetStateAction<undefined>>,
  onControlChange: (control: any) => void
) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [createdResource, setCreatedResource] = useState<any>()
  const {
    ansibleJobState,
    applicationsState,
    channelsState,
    placementRulesState,
    secretsState,
    subscriptionsState,
    placementsState,
  } = useSharedAtoms()
  const toastContext = useContext(AcmToastContext)
  const secrets = useRecoilValue(secretsState)
  const providerConnections = secrets.map(unpackProviderConnection)
  const ansibleCredentials = providerConnections.filter(
    (providerConnection) => providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
  )

  const isLocalCluster = !!useIsHubSelfManaged()
  const localHubName = useLocalHubName()

  // create button
  const [creationStatus, setCreationStatus] = useState<CreationStatus>()
  const createResource = async (resourceJSON: { createResources: any[] }) => {
    if (resourceJSON) {
      const { createResources } = resourceJSON
      setCreationStatus({ status: 'IN_PROGRESS', messages: [] })
      // change create cluster to create application
      const applicationResourceJSON = _.find(createResources, { kind: ApplicationKind })
      reconcileResources(createResources as IResource[], [])
        .then(() => {
          toastContext.addAlert({
            title: t('Application created'),
            message: t('{{name}} was successfully created.', {
              name: _.get(applicationResourceJSON, 'metadata.name', ''),
            }),
            type: 'success',
            autoClose: true,
          })
          setCreatedResource(applicationResourceJSON)
        })
        .catch((err) => {
          const errorInfo = getErrorInfo(err, t)
          toastContext.addAlert({
            type: 'danger',
            title: errorInfo.title,
            message: errorInfo.message,
          })
        })
    }
  }
  function handleCreate(resourceJSON: { createResources: IResource[] }) {
    if (resourceJSON) {
      // create ansible secrets if any are used and not yet available in the app ns
      // get all subscriptions using an ansible provider
      const { createResources } = resourceJSON
      const applicationResourceJSON = _.find(createResources, { kind: ApplicationKind })
      const subsUsingAnsible = resourceJSON.createResources.filter(
        (resource) => resource.kind === SubscriptionKind && _.get(resource, 'spec.hooksecretref.name')
      )
      if (subsUsingAnsible) {
        const uniqueAnsibleSecretNames = Array.from(new Set([..._.map(subsUsingAnsible, 'spec.hooksecretref.name')]))
        uniqueAnsibleSecretNames.forEach((name) => {
          // check if a secret with this name already exists in the app ns
          const existingSecret = ansibleCredentials.find((ac) => {
            return ac.metadata.name === name && ac.metadata.namespace === applicationResourceJSON?.metadata?.namespace
          })
          if (!existingSecret) {
            const originalAnsibleSecret = ansibleCredentials.find((ac) => ac.metadata.name === name)
            const ansibleSecret: ProviderConnection = {
              apiVersion: ProviderConnectionApiVersion,
              kind: ProviderConnectionKind,
              metadata: {
                name,
                namespace: applicationResourceJSON?.metadata?.namespace,
                labels: {
                  'cluster.open-cluster-management.io/type': 'ans',
                  'cluster.open-cluster-management.io/copiedFromNamespace': originalAnsibleSecret?.metadata.namespace!,
                  'cluster.open-cluster-management.io/copiedFromSecretName': originalAnsibleSecret?.metadata.name!,
                },
              },
              stringData: _.get(originalAnsibleSecret, 'stringData', {}),
              type: 'Opaque',
            }
            // add resource
            createResources.push(ansibleSecret)
          }
        })
      }

      if (editApplication) {
        // set resourceVersion
        createResources.forEach((resource) => {
          const name = resource.metadata?.name
          const namespace = resource.metadata?.namespace
          let resourceVersion
          if (name && namespace) {
            switch (resource.kind) {
              case 'Application':
                resourceVersion = getResourceVersion(applications, name, namespace)
                break
              case 'Subscription':
                resourceVersion = getResourceVersion(subscriptions, name, namespace)
                break
              case 'PlacementRule':
                resourceVersion = getResourceVersion(placementRules, name, namespace)
                break
              case 'Placement':
                resourceVersion = getResourceVersion(placements, name, namespace)
                break
            }
            _.set(resource, 'metadata.resourceVersion', resourceVersion)
          }
        })

        updateAppResources(createResources)
          .then(() => {
            toastContext.addAlert({
              title: t('Application updated'),
              message: t('{{name}} was successfully updated.', {
                name: _.get(applicationResourceJSON, 'metadata.name', ''),
              }),
              type: 'success',
              autoClose: true,
            })
            redirectRoute()
          })
          .catch((err) => {
            const errorInfo = getErrorInfo(err, t)
            toastContext.addAlert({
              type: 'danger',
              title: errorInfo.title,
              message: errorInfo.message,
            })
          })
      } else {
        createResource(resourceJSON).catch((err) => {
          const errorInfo = getErrorInfo(err, t)
          toastContext.addAlert({
            type: 'danger',
            title: errorInfo.title,
            message: errorInfo.message,
          })
        })
      }
    }
  }

  function getResourceVersion(resources: IResource[], name: string, namespace: string) {
    const selectedResource = resources.find((resource: IResource) => {
      return resource?.metadata?.name === name && resource?.metadata?.namespace === namespace
    })
    const resourceVersion = _.get(selectedResource, 'metadata.resourceVersion')
    return resourceVersion
  }

  // cancel button
  const cancelCreate = () => {
    redirectRoute()
  }

  const redirectRoute = () => {
    if (searchParams.get('context') === 'applications') {
      navigate(NavigationPath.applications)
    } else {
      navigate(
        generatePath(NavigationPath.applicationOverview, {
          namespace: editApplication?.selectedAppNamespace ?? '',
          name: editApplication?.selectedAppName ?? '',
        })
      )
    }
  }

  function getEditApplication(location: Location) {
    const pathname = location.pathname
    if (pathname.includes('/edit/subscription')) {
      const params = pathname.replace(/(.*)edit\/subscription\//, '')
      const [namespace, name] = params.split('/')
      if (name && namespace) {
        return {
          selectedAppName: name,
          selectedAppNamespace: namespace,
        }
      }
    }
    return null
  }

  //compile template
  const template = Handlebars.compile(createTemplate)
  Handlebars.registerPartial('templateGit', Handlebars.compile(gitTemplate))
  Handlebars.registerPartial('templateHelm', Handlebars.compile(helmTemplate))
  Handlebars.registerPartial('templateObjectStore', Handlebars.compile(ObjTemplate))
  Handlebars.registerPartial('templatePlacement', Handlebars.compile(placementTemplate))
  Handlebars.registerPartial('templateOther', Handlebars.compile(otherTemplate))
  const [fetchControl, setFetchControl] = useState<any>(null)
  const applications = useRecoilValue(applicationsState)
  const ansibleJob = useRecoilValue(ansibleJobState)
  const subscriptions = useRecoilValue(subscriptionsState)
  const channels = useRecoilValue(channelsState)
  const placementRules = useRecoilValue(placementRulesState)
  const placements = useRecoilValue(placementsState)
  const location = useLocation()
  const editApplication = getEditApplication(location)
  const searchParams = useSearchParams()

  const { dataContext } = useContext(PluginContext)
  const { backendUrl } = useContext(dataContext)

  // don't navigate to details page until application exists in recoil
  useEffect(() => {
    if (createdResource) {
      if (
        applications.findIndex(
          (app) =>
            app.metadata.name === createdResource.metadata.name! &&
            app.metadata.namespace === createdResource.metadata.namespace!
        ) !== -1
      ) {
        navigate({
          pathname: generatePath(NavigationPath.applicationOverview, {
            namespace: createdResource.metadata.namespace!,
            name: createdResource.metadata.name!,
          }),
          search: location.search,
        })
      }
    }
  }, [applications, createdResource, location, navigate])

  useEffect(() => {
    if (editApplication) {
      const { selectedAppName, selectedAppNamespace } = editApplication
      const allChannels = '__ALL__/__ALL__//__ALL__/__ALL__'
      const fetchApplication = async () => {
        // get application object from recoil states
        const application = await getApplication(selectedAppNamespace, selectedAppName, backendUrl, allChannels, {
          applications,
          ansibleJob,
          subscriptions,
          channels,
          placementRules,
          placements,
        })

        setFetchControl({
          resources: getApplicationResources(application),
          isLoaded: true,
        })
      }
      fetchApplication()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onControlInitialize(control: any) {
    const specPathname = 'spec.pathname'
    const keyFn = (channel: Channel) => {
      return `${_.get(channel, specPathname, '')} [${_.get(channel, 'metadata.namespace', 'ns')}/${_.get(
        channel,
        'metadata.name',
        'name'
      )}]`
    }
    const loadExistingChannels = (type: string) => {
      control.availableData = _.keyBy(
        _.filter(channels, (channel) => {
          return channel.spec.type.toLowerCase().startsWith(type)
        }),
        keyFn
      )
      control.available = _.map(Object.values(control.availableData), keyFn).sort()
    }
    switch (control.id) {
      case 'connection':
        setConnectionControl(control)
        break
      case 'githubURL':
        loadExistingChannels('git')
        break
      case 'helmURL':
        loadExistingChannels('helmrepo')
        break
      case 'objectstoreURL':
        loadExistingChannels('objectbucket')
        break
    }

    control.hubClusterName = localHubName
  }

  useEffect(() => {
    if (editApplication) {
      const { selectedAppName } = editApplication
      setTitle(selectedAppName)
    }
  }, [editApplication, setTitle])

  const createControl = {
    createResource: handleCreate,
    cancelCreate,
    pauseCreate: () => {},
    creationStatus: creationStatus?.status,
    creationMsg: creationStatus?.messages,
  }

  const isFetchControl = editApplication ? fetchControl : true

  return createdResource ? (
    <LoadingPage />
  ) : (
    isFetchControl && (
      <TemplateEditor
        type={'application'}
        title={t('application.create.yaml')}
        monacoEditor={<MonacoEditor />}
        controlData={getControlData(isLocalCluster, handleModalToggleWithContext, t)}
        template={template}
        portals={Portals}
        fetchControl={fetchControl}
        createControl={createControl}
        onControlInitialize={onControlInitialize}
        onControlChange={onControlChange}
        logging={process.env.NODE_ENV !== 'production'}
        i18n={t}
      />
    )
  )
}

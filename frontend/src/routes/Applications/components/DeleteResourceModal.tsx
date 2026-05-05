/* Copyright Contributors to the Open Cluster Management project */

import { Button, Checkbox, Stack, StackItem } from '@patternfly/react-core'
import { ModalVariant } from '@patternfly/react-core/deprecated'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmAlert, AcmModal } from '../../../ui-components'
import { TFunction } from 'react-i18next'
import { Fragment, ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { Trans } from '../../../lib/acm-i18next'
import { deleteApplication } from '../../../lib/delete-application'
import { ApplicationKind, ApplicationSetKind, IResource, PlacementApiVersionBeta } from '../../../resources'
import '../css/DeleteResourceModal.css'

export interface IDeleteResourceModalProps {
  open: boolean
  canRemove: boolean
  resource: IResource
  warnings?: ReactNode
  loading: boolean
  selected?: any[]
  shared?: any[]
  appSetPlacement?: string
  appSetsSharingPlacement?: string[]
  appKind: string
  appSetApps?: string[]
  deleted?: (resource: IResource) => void
  close: () => void
  t: TFunction
  redirect?: string
}

export function DeleteResourceModal(props: IDeleteResourceModalProps | { open: false }) {
  const [removeAppResources, setRemoveAppResources] = useState<boolean>(false)
  const [removeAppSetResource, setRemoveAppSetResource] = useState<boolean>(false)
  const [deleteResourceError, setDeleteResourceError] = useState<string | undefined>(undefined)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const navigate = useNavigate()

  if (props.open === false) {
    return <></>
  }

  const toggleRemoveAppRsources = () => {
    setRemoveAppResources(!removeAppResources)
  }

  const toggleRemoveAppSetResources = () => {
    setRemoveAppSetResource(!removeAppSetResource)
  }

  const handleSubmit = () => {
    setDeleteResourceError(undefined)
    setIsDeleting(true)

    let childResources: any[] = []
    if (props.resource.kind === ApplicationKind && removeAppResources && props.selected) {
      childResources = props.selected
    } else if (
      props.resource.kind === ApplicationSetKind &&
      removeAppSetResource &&
      !props.appSetsSharingPlacement?.length
    ) {
      childResources = [
        {
          apiVersion: PlacementApiVersionBeta,
          kind: 'Placement',
          name: props.appSetPlacement,
          namespace: props.resource.metadata?.namespace,
        },
      ]
    }

    deleteApplication(props.resource, childResources, props.deleted)
      .promise.then(() => {
        setIsDeleting(false)
        setRemoveAppResources(false)
        setRemoveAppSetResource(false)
        props.close()
        if (props.redirect) {
          navigate(props.redirect)
        }
      })
      .catch((err: unknown) => {
        setIsDeleting(false)
        let message: string
        if (err instanceof Error) {
          message = err.message
        } else if (typeof err === 'string') {
          message = err
        } else {
          message = props.t('An unknown error occurred.')
        }
        setDeleteResourceError(message)
      })
  }

  const renderConfirmCheckbox = () => {
    const isAppKind = props.appKind === ApplicationKind
    const appTypeMsg = isAppKind
      ? props.t('Remove Application related resources')
      : props.t('Remove ApplicationSet related resources')

    return (
      <Fragment>
        <div className="remove-app-modal-content-text">
          <p>
            <Trans
              i18nKey="Select <italic>{{appType}}</italic> to delete {{name}} and all related resources."
              values={{ appType: appTypeMsg, name: props.resource.metadata?.name! }}
              components={{ italic: <span className="italic-font" /> }}
            />
          </p>
        </div>
        <div className="remove-app-modal-content-data">
          <Checkbox
            id={'remove-app-resources'}
            isChecked={isAppKind ? removeAppResources : removeAppSetResource}
            onChange={isAppKind ? toggleRemoveAppRsources : toggleRemoveAppSetResources}
            label={appTypeMsg}
          />
        </div>
      </Fragment>
    )
  }

  const renderSharedResources = () => {
    return (
      props.shared &&
      props.shared.length > 0 && (
        <div className="shared-resource-content">
          <div>
            <ExclamationTriangleIcon />
          </div>
          <div>
            <p>{props.t('This application uses the following shared resources, which are not removable:')}</p>
            <div>
              <ul>
                {props.shared.map((child) => {
                  const siblingResources = child.siblingApps || child.siblingSubs || []
                  return (
                    <div className="sibling-resource-content" key={child.id}>
                      <li>
                        {child.label}
                        {siblingResources.length > 0 && (
                          <span>
                            <span className="italic-font">&nbsp;{props.t('Shared with:')}&nbsp;</span>
                            {siblingResources.join(', ')}
                          </span>
                        )}
                      </li>
                    </div>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )
    )
  }

  const renderAppSetSharedResources = () => {
    return props.appSetsSharingPlacement && props.appSetPlacement && props.appSetsSharingPlacement.length > 0 ? (
      <div className="shared-resource-content">
        <div>
          <ExclamationTriangleIcon />
        </div>
        <div>
          <p>
            {props.t(
              'This application set uses placement "{{placement}}", which is not removable. This placement is shared by the following application set:',
              { placement: props.appSetPlacement, count: props.appSetsSharingPlacement.length }
            )}
          </p>
          <div>
            <ul>
              {props.appSetsSharingPlacement.map((appSet) => {
                return (
                  <div className="sibling-resource-content" key={appSet}>
                    <li>{appSet}</li>
                  </div>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    ) : (
      props.appSetPlacement && (
        <Fragment>
          {renderConfirmCheckbox()}
          <div className="remove-app-modal-content-data">{props.appSetPlacement} [Placement]</div>
        </Fragment>
      )
    )
  }

  const modalBody = () => {
    if (props.appKind === ApplicationKind) {
      return props.selected && props.selected.length > 0 ? (
        <div className="remove-app-modal-content">
          {renderConfirmCheckbox()}
          <div>
            <ul>
              {props.selected.map((child) => {
                const filteredChildren: any[] = []
                if (child.subChildResources) {
                  child.subChildResources.forEach((sub: any) => {
                    if (!sub.includes(child.name)) {
                      filteredChildren.push(sub)
                    }
                  })
                }

                return (
                  <div className="remove-app-modal-content-data" key={child.id}>
                    <li>
                      {child.label}
                      {filteredChildren.length > 0 && (
                        <div className="sub-child-resource-content">
                          <div>
                            <ExclamationTriangleIcon />
                          </div>
                          <div>
                            <p>
                              {props.t('This subscription deploys the following resources, which will be removed:')}
                            </p>
                            <p>{filteredChildren.join(', ')}</p>
                          </div>
                        </div>
                      )}
                    </li>
                  </div>
                )
              })}
            </ul>
          </div>
          {renderSharedResources()}
        </div>
      ) : (
        <div className="remove-app-modal-content">
          {props.t('Are you sure that you want to continue?')}
          {renderSharedResources()}
        </div>
      )
    } else if (props.appKind === ApplicationSetKind) {
      return (
        props.appSetApps &&
        props.appSetApps.length > 0 && (
          <div className="remove-app-modal-content">
            <div className="remove-app-modal-content-text">
              <p
                dangerouslySetInnerHTML={{
                  __html: `${props.t(
                    'The following Argo application(s) deployed by the application set will also be deleted:'
                  )}`,
                }}
              />
            </div>
            <div>
              <ul>
                {props.appSetApps.map((app) => {
                  return (
                    <div className="remove-app-modal-content-data" key={app}>
                      <li>{app}</li>
                    </div>
                  )
                })}
              </ul>
            </div>
            <br />
            {renderAppSetSharedResources()}
          </div>
        )
      )
    } else {
      return props.t('Are you sure that you want to continue?')
    }
  }
  const modalTitle = props.t('Permanently delete {{type}} {{name}}?', {
    name: props.resource.metadata?.name!,
    type: props.appKind,
  })
  return (
    <AcmModal
      id="remove-resource-modal"
      isOpen={props.open}
      title={modalTitle}
      aria-label={modalTitle}
      showClose={true}
      onClose={() => {
        setRemoveAppResources(false)
        setRemoveAppSetResource(false)
        setDeleteResourceError(undefined)
        props.close()
      }}
      variant={ModalVariant.medium}
      titleIconVariant="warning"
      position="top"
      actions={[
        <Button
          key="confirm"
          variant="danger"
          isDisabled={!props.canRemove || isDeleting}
          isLoading={isDeleting}
          onClick={() => handleSubmit()}
        >
          {props.t('Delete')}
        </Button>,
        <Button
          key="cancel"
          variant="link"
          isDisabled={isDeleting}
          onClick={() => {
            setRemoveAppResources(false)
            setRemoveAppSetResource(false)
            setDeleteResourceError(undefined)
            props.close()
          }}
        >
          {props.t('Cancel')}
        </Button>,
      ]}
    >
      <Stack hasGutter>
        {props.warnings && (
          <StackItem>
            <AcmAlert variant="warning" title={props.warnings} isInline />
          </StackItem>
        )}
        {deleteResourceError && (
          <StackItem>
            <AcmAlert
              data-testid={'delete-resource-error'}
              variant="danger"
              title={deleteResourceError}
              isInline
              noClose
            />
          </StackItem>
        )}
        <StackItem>{modalBody()}</StackItem>
      </Stack>
    </AcmModal>
  )
}

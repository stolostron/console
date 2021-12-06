/* Copyright Contributors to the Open Cluster Management project */

import { AcmAlert, AcmModal } from '@open-cluster-management/ui-components'
import { Button, Checkbox, ModalVariant } from '@patternfly/react-core'
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import { TFunction } from 'i18next'
import React, { ReactNode, useState } from 'react'
import { ApplicationKind, ApplicationSetKind, IResource } from '../../../resources'
import { deleteApplication } from '../../../lib/delete-application'
import '../css/DeleteResourceModal.css'

export interface IDeleteResourceModalProps {
    open: boolean
    canRemove: boolean
    resource: IResource
    errors: ReactNode
    warnings: ReactNode
    loading: boolean
    selected: any[]
    shared: any[]
    appSetPlacement: string
    appSetsSharingPlacement: string[]
    appKind: string
    appSetApps: string[]
    close: () => void
    t: TFunction
}

export function DeleteResourceModal(props: IDeleteResourceModalProps | { open: false }) {
    if (props.open === false) {
        return <></>
    }

    const [removeAppResources, setRemoveAppResources] = useState<boolean>(false)
    const [removeAppSetResource, setRemoveAppSetResource] = useState<boolean>(false)

    const toggleRemoveAppRsources = () => {
        setRemoveAppResources(!removeAppResources)
    }

    const toggleRemoveAppSetResources = () => {
        setRemoveAppSetResource(!removeAppSetResource)
    }

    const getItalicSpan = (text: string) => {
        return `<span class="italic-font">${text}</span>`
    }

    const handleSubmit = () => {
        props.close()
        if (props.resource.kind === ApplicationKind) {
            return deleteApplication(props.resource, removeAppResources ? props.selected : [])
        }
        return deleteApplication(
            props.resource,
            props.appSetsSharingPlacement.length === 0 && removeAppSetResource
                ? [
                      {
                          apiVersion: 'cluster.open-cluster-management.io/v1alpha1', // replace when placement type is available
                          kind: 'Placement',
                          name: props.appSetPlacement,
                          namespace: props.resource.metadata?.namespace,
                      },
                  ]
                : []
        )
    }

    const renderConfirmCheckbox = () => {
        const isAppKind = props.appKind === ApplicationKind
        const appTypeMsg = isAppKind
            ? 'Remove application related resources'
            : 'Remove applicationset related resources'

        return (
            <React.Fragment>
                <div className="remove-app-modal-content-text">
                    <p
                        dangerouslySetInnerHTML={{
                            __html: `
                    ${props
                        .t('Select {0} to delete {1} and all related resources.')
                        .replace('{0}', getItalicSpan(props.t(appTypeMsg)))
                        .replace('{1}', props.resource.metadata?.name!)}
                    `,
                        }}
                    />
                </div>
                <div className="remove-app-modal-content-data">
                    <Checkbox
                        id={'remove-app-resources'}
                        isChecked={isAppKind ? removeAppResources : removeAppSetResource}
                        onChange={isAppKind ? toggleRemoveAppRsources : toggleRemoveAppSetResources}
                        label={props.t(appTypeMsg)}
                    />
                </div>
            </React.Fragment>
        )
    }

    const renderSharedResources = () => {
        return (
            props.shared.length > 0 && (
                <div className="shared-resource-content">
                    <div>
                        <ExclamationTriangleIcon />
                    </div>
                    <div>
                        <p>
                            {props.t('This application uses the following shared resources, which are not removable:')}
                        </p>
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
                                                        <span className="italic-font">
                                                            &nbsp;{props.t('Shared with:')}&nbsp;
                                                        </span>
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
        return props.appSetsSharingPlacement.length > 0 ? (
            <div className="shared-resource-content">
                <div>
                    <ExclamationTriangleIcon />
                </div>
                <div>
                    <p>
                        {props
                            .t(
                                'This applicationset uses placement "{0}", which is not removable. This placement is shared by the following applicationset(s):'
                            )
                            .replace('{0}', props.appSetPlacement)}
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
                <React.Fragment>
                    {renderConfirmCheckbox()}
                    <div className="remove-app-modal-content-data">{props.appSetPlacement} [Placement]</div>
                </React.Fragment>
            )
        )
    }

    const modalBody = () => {
        if (props.appKind === ApplicationKind) {
            return props.selected.length > 0 ? (
                <div className="remove-app-modal-content">
                    {renderConfirmCheckbox()}
                    <div>
                        <ul>
                            {props.selected.map((child) => {
                                return (
                                    <div className="remove-app-modal-content-data" key={child.id}>
                                        <li>
                                            {child.label}
                                            {child.subChildResources && child.subChildResources.length > 0 && (
                                                <div className="sub-child-resource-content">
                                                    <div>
                                                        <ExclamationTriangleIcon />
                                                    </div>
                                                    <div>
                                                        <p>
                                                            {props.t(
                                                                'This subscription deploys the following resources, which will be removed:'
                                                            )}
                                                        </p>
                                                        <p>{child.subChildResources.join(', ')}</p>
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
                props.appSetApps.length > 0 && (
                    <div className="remove-app-modal-content">
                        <div className="remove-app-modal-content-text">
                            <p
                                dangerouslySetInnerHTML={{
                                    __html: `${props.t(
                                        'The following Argo application(s) deployed by the applicationset will also be deleted:'
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

    const modalTitle =
        props.appKind === ApplicationKind
            ? props.t('Permanently delete {0} application?').replace('{0}', props.resource.metadata?.name!)
            : props.t('Permanently delete {0} applicationset?').replace('{0}', props.resource.metadata?.name!)
    return (
        <AcmModal
            id="remove-resource-modal"
            isOpen={props.open}
            title={modalTitle}
            aria-label={modalTitle}
            showClose={true}
            onClose={props.close}
            variant={ModalVariant.large}
            titleIconVariant="warning"
            position="top"
            positionOffset="225px"
            actions={[
                <Button key="confirm" variant="danger" isDisabled={!props.canRemove} onClick={() => handleSubmit()}>
                    {props.t('Delete')}
                </Button>,
                <Button key="cancel" variant="link" onClick={props.close}>
                    {props.t('Cancel')}
                </Button>,
            ]}
        >
            <div className="delete-app-modal-alert">
                {props.errors !== undefined ? (
                    <AcmAlert variant="danger" title={props.errors} isInline noClose />
                ) : null}
                {props.warnings !== undefined ? <AcmAlert variant="warning" title={props.warnings} isInline /> : null}
            </div>
            {modalBody()}
        </AcmModal>
    )
}

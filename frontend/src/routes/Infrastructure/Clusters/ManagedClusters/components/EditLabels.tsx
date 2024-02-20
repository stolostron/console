/* Copyright Contributors to the Open Cluster Management project */

import { IResource, patchResource } from '../../../../../resources'
import {
  AcmAlertContext,
  AcmAlertGroup,
  AcmForm,
  AcmKubernetesLabelsInput,
  AcmModal,
  AcmSubmit,
} from '../../../../../ui-components'
import { ActionGroup, Button, ModalVariant } from '@patternfly/react-core'
import { useLayoutEffect, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { getErrorInfo } from '../../../../../components/ErrorPage'

export function EditLabels(props: { resource?: IResource; displayName?: string; close: () => void }) {
  const { t } = useTranslation()
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [modifiedLabelKeys, setModifiedLabelKeys] = useState<string[]>([])

  useLayoutEffect(() => {
    /* istanbul ignore next */
    // TODO: review best way to handle re-renders due to reference changes in props.resource?.metadata?.labels
    // adding JSON.stringify to dependency array results in:
    /*
      34:6  warning  React Hook useLayoutEffect has a missing dependency: 'props.resource?.metadata?.labels'. 
              Either include it or remove the dependency array       react-hooks/exhaustive-deps
      34:7  warning  React Hook useLayoutEffect has a complex expression in the dependency array. 
              Extract it to a separate variable so it can be statically checked
     */
    const updatedBackendLabels: Record<string, string> = { ...props.resource?.metadata?.labels } ?? {}
    let newLabels = { ...labels }

    // modify backend copy to avoid overwriting current changes
    modifiedLabelKeys.forEach((key) => {
      if (updatedBackendLabels[key]) {
        delete updatedBackendLabels[key]
      }
    })

    // remove labels from modal copy that were deleted from the backend, and are not being modified
    if (labels) {
      for (const key in labels) {
        if (!updatedBackendLabels[key] && !modifiedLabelKeys.includes(key)) {
          delete newLabels[key]
        }
      }
    }
    newLabels = { ...updatedBackendLabels, ...newLabels }

    // check if new changes are different from current state
    if (JSON.stringify(labels) !== JSON.stringify(newLabels)) {
      setLabels({ ...newLabels })
    }
  }, [props.resource?.metadata?.labels, modifiedLabelKeys, labels])

  return (
    <AcmModal
      title={t('labels.edit.title')}
      isOpen={props.resource !== undefined}
      variant={ModalVariant.medium}
      onClose={props.close}
    >
      <AcmAlertContext.Consumer>
        {(alertContext) => (
          <AcmForm style={{ gap: 0 }}>
            <div>{t('labels.description')}</div>
            &nbsp;
            <AcmKubernetesLabelsInput
              id="labels-input"
              label={t('labels.lower', {
                resourceName: props.displayName ?? props.resource?.metadata?.name,
              })}
              value={labels}
              onChange={(labels, inputKey) => {
                setLabels(labels!)
                if (!modifiedLabelKeys.includes(inputKey)) {
                  setModifiedLabelKeys([...modifiedLabelKeys, inputKey])
                }
              }}
              placeholder={t('labels.edit.placeholder')}
            />
            <AcmAlertGroup isInline canClose />
            <ActionGroup>
              <AcmSubmit
                id="add-labels"
                variant="primary"
                onClick={() => {
                  alertContext.clearAlerts()
                  const resource: IResource = {
                    apiVersion: props.resource!.apiVersion,
                    kind: props.resource!.kind,
                    metadata: {
                      name: props.resource!.metadata!.name,
                      labels: props.resource!.metadata!.labels,
                    },
                  }
                  let patch: { op: string; path: string; value?: unknown }[] = []

                  /* istanbul ignore else */
                  if (resource!.metadata!.labels) {
                    patch = [
                      ...patch,
                      ...Object.keys(resource!.metadata!.labels).map((key) => {
                        key = key.replace(/\//g, '~1')
                        return {
                          op: 'remove',
                          path: `/metadata/labels/${key}`,
                        }
                      }),
                    ]
                  }
                  patch = [
                    ...patch,
                    ...Object.keys(labels).map((key) => {
                      const keyPath = key.replace(/\//g, '~1')
                      return {
                        op: 'add',
                        path: `/metadata/labels/${keyPath}`,
                        value: labels[key],
                      }
                    }),
                  ]

                  if (resource!.metadata?.labels === undefined) {
                    patch.unshift({
                      op: 'add',
                      path: '/metadata/labels',
                      value: {},
                    })
                  }

                  return patchResource(resource!, patch)
                    .promise.then(() => {
                      props.close()
                    })
                    .catch((err) => {
                      alertContext.addAlert(getErrorInfo(err, t))
                    })
                }}
                label={t('save')}
                processingLabel={t('saving')}
              />
              <Button variant="link" onClick={props.close}>
                {t('cancel')}
              </Button>
            </ActionGroup>
          </AcmForm>
        )}
      </AcmAlertContext.Consumer>
    </AcmModal>
  )
}

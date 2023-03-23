/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from '../../../../../lib/acm-i18next'
import { canUser } from '../../../../../lib/rbac-util'
import { fireManagedClusterAction } from '../../../../../resources/managedclusteraction'
import { useSharedAtoms } from '../../../../../shared-recoil'
import { AcmAlert, AcmButton, AcmModal } from '../../../../../ui-components'
import { convertStringToQuery } from '../../search-helper'
import { searchClient } from '../../search-sdk/search-client'
import {
  SearchResultItemsDocument,
  SearchResultRelatedCountDocument,
  SearchResultRelatedItemsDocument,
} from '../../search-sdk/search-sdk'

export interface IDeleteModalProps {
  open: boolean
  close: () => void
  resource: any
  currentQuery: string
  relatedResource: boolean
}

export const ClosedDeleteModalProps: IDeleteModalProps = {
  open: false,
  close: () => {},
  resource: undefined,
  currentQuery: '',
  relatedResource: false,
}

export const DeleteResourceModal = (props: any) => {
  const { t } = useTranslation()
  const { open, close, resource, currentQuery, relatedResource } = props
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const [canDelete, setCanDelete] = useState<boolean>(false)
  const [loadingAccessRequest, setLoadingAccessRequest] = useState<boolean>(true)
  const [accessError, setAccessError] = useState(null)
  const [deleteResourceError, setDeleteResourceError] = useState(undefined)
  let apiGroup = ''
  if (resource) {
    apiGroup = resource.apigroup ? `${resource.apigroup}/${resource.apiversion}` : resource.apiversion
  }
  useEffect(() => {
    if (!resource) {
      return
    }
    const { cluster, kind, name, namespace } = resource
    const canDeleteResource = canUser(
      'delete',
      {
        apiVersion: apiGroup,
        kind: kind,
        metadata: {
          name: name,
          namespace: namespace,
        },
      },
      cluster === 'local-cluster' ? namespace : cluster,
      name
    )

    canDeleteResource.promise
      .then((result) => {
        setLoadingAccessRequest(false)
        setCanDelete(result.status?.allowed!)
      })
      .catch((err) => {
        console.error(err)
        setLoadingAccessRequest(false)
        setAccessError(err)
      })
    return () => canDeleteResource.abort()
  }, [apiGroup, resource])

  function deleteResourceFn() {
    fireManagedClusterAction('Delete', resource.cluster, resource.kind, apiGroup, resource.name, resource.namespace)
      .then(async (actionResponse) => {
        if (actionResponse.actionDone === 'ActionDone') {
          if (relatedResource) {
            searchClient
              .query({
                query: SearchResultRelatedItemsDocument,
                variables: {
                  input: [
                    {
                      ...convertStringToQuery(currentQuery, searchResultLimit),
                      relatedKinds: [resource.kind],
                    },
                  ],
                },
                fetchPolicy: 'cache-first',
              })
              .then((res) => {
                searchClient.writeQuery({
                  query: SearchResultRelatedItemsDocument,
                  variables: {
                    input: [
                      {
                        ...convertStringToQuery(currentQuery, searchResultLimit),
                        relatedKinds: [resource.kind],
                      },
                    ],
                  },
                  data: {
                    searchResult: [
                      {
                        __typename: 'SearchResult',
                        related: res.data.searchResult[0].related.map((item: any) => {
                          if (item.kind === resource.kind) {
                            return {
                              items: item.items.filter((i: any) => {
                                return (
                                  i.cluster !== resource.cluster ||
                                  i.namespace !== resource.namespace ||
                                  i.kind !== resource.kind ||
                                  i.name !== resource.name
                                )
                              }),
                              kind: item.kind,
                            }
                          }
                          return item
                        }),
                      },
                    ],
                  },
                })
              })
            searchClient
              .query({
                query: SearchResultRelatedCountDocument,
                variables: {
                  input: [convertStringToQuery(currentQuery, searchResultLimit)],
                },
                fetchPolicy: 'cache-first',
              })
              .then((res) => {
                if (res.data) {
                  searchClient.writeQuery({
                    query: SearchResultRelatedCountDocument,
                    variables: {
                      input: [convertStringToQuery(currentQuery, searchResultLimit)],
                    },
                    data: {
                      searchResult: [
                        {
                          __typename: 'SearchResult',
                          related: res.data.searchResult[0].related
                            // eslint-disable-next-line array-callback-return
                            .map((item: any) => {
                              if (item.kind === resource.kind) {
                                if (item.count > 1) {
                                  return { ...item, count: item.count - 1 }
                                }
                              } else {
                                return item
                              }
                            })
                            .filter((i: any) => i !== undefined), // not returning items that now have 0 count - need to filter them out
                        },
                      ],
                    },
                  })
                }
              })
          } else {
            searchClient
              .query({
                query: SearchResultItemsDocument,
                variables: {
                  input: [convertStringToQuery(currentQuery, searchResultLimit)],
                },
                fetchPolicy: 'cache-first',
              })
              .then((res) => {
                if (res.data) {
                  // Remove deleted resource from search query results - this removes the resource from UI
                  searchClient.writeQuery({
                    query: SearchResultItemsDocument,
                    variables: {
                      input: [convertStringToQuery(currentQuery, searchResultLimit)],
                    },
                    data: {
                      searchResult: [
                        {
                          __typename: 'SearchResult',
                          items: res.data.searchResult[0].items.filter((item: any) => {
                            return item._uid !== resource._uid
                          }),
                        },
                      ],
                    },
                  })
                }
              })
          }
          close()
        } else {
          setDeleteResourceError(actionResponse.message)
        }
      })
      .catch((err) => {
        console.error('Error deleting resource: ', err)
        setDeleteResourceError(err)
      })
  }

  return (
    <Fragment>
      <AcmModal
        variant={ModalVariant.medium}
        isOpen={open}
        // TODO - Handle interpolation
        title={t('Delete {{resourceKind}}?', { resourceKind: resource?.kind })}
        titleIconVariant={'warning'}
        onClose={close}
        actions={[
          <AcmButton
            isDisabled={loadingAccessRequest || !canDelete}
            key="confirm"
            variant={ButtonVariant.danger}
            onClick={() => deleteResourceFn()}
          >
            {t('Delete')}
          </AcmButton>,
          <AcmButton key="cancel" variant={ButtonVariant.secondary} onClick={close}>
            {t('Cancel')}
          </AcmButton>,
        ]}
      >
        {accessError ? (
          <AcmAlert data-testid={'user-access-error'} noClose={true} variant={'danger'} title={accessError} />
        ) : null}
        {!accessError && !canDelete && !loadingAccessRequest ? (
          <AcmAlert noClose={true} variant={'danger'} title={t('You are not authorized to delete this resource.')} />
        ) : null}
        {deleteResourceError ? (
          <AcmAlert
            data-testid={'delete-resource-error'}
            noClose={true}
            variant={'danger'}
            title={deleteResourceError}
          />
        ) : null}
        <div style={{ paddingTop: '1rem' }}>
          {/* TODO - Handle interpolation */}
          {t('Are you sure that you want to delete {{resourceName}}?', { resourceName: resource?.name })}
        </div>
      </AcmModal>
    </Fragment>
  )
}

/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { AcmAlert, AcmButton, AcmModal } from '@open-cluster-management/ui-components'
import { ButtonVariant, ModalVariant } from '@patternfly/react-core'
import '@patternfly/react-core/dist/styles/base.css'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { consoleClient } from '../../../../console-sdk/console-client'
import { useDeleteResourceMutation, useUserAccessQuery } from '../../../../console-sdk/console-sdk'
import { searchClient } from '../../../../search-sdk/search-client'
import {
    SearchResultItemsDocument,
    SearchResultRelatedCountDocument,
    SearchResultRelatedItemsDocument,
} from '../../../../search-sdk/search-sdk'
import { convertStringToQuery } from '../../search-helper'

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
    const { t } = useTranslation(['search'])
    const { open, close, resource, currentQuery, relatedResource } = props
    const [deleteResourceMutation, deleteResourceResults] = useDeleteResourceMutation({
        client: process.env.NODE_ENV === 'test' ? undefined : consoleClient,
    })
    let apiGroup = ''
    if (resource) {
        apiGroup = resource.apigroup ? `${resource.apigroup}/${resource.apiversion}` : resource.apiversion
    }
    const userAccessResponse = useUserAccessQuery({
        skip: !resource,
        client: process.env.NODE_ENV === 'test' ? undefined : consoleClient,
        variables: {
            kind: resource?.kind,
            action: 'delete',
            namespace: resource?._hubClusterResource === 'true' ? resource?.namespace : resource?.cluster,
            apiGroup: resource?.apigroup ?? '',
            version: resource?.apiversion,
        },
    })

    function deleteResourceFn() {
        deleteResourceMutation({
            variables: {
                apiVersion: apiGroup,
                name: resource.name,
                namespace: resource.namespace,
                cluster: resource.cluster,
                kind: resource.kind,
                // childResources: // TODO look how app team is getting the correct child resources
            },
            // If console-api queries are moved to search-api -> need to look in to using refetchQueries instead of update
            // We currently have to use update b/c the data that need to be updated is queried from a different apollo client
            update: () => {
                if (relatedResource) {
                    // if related resource is being removed the table & related card count need to be updated
                    process.env.NODE_ENV === 'test'
                        ? null
                        : searchClient
                              .query({
                                  query: SearchResultRelatedItemsDocument,
                                  variables: {
                                      input: [
                                          {
                                              ...convertStringToQuery(currentQuery),
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
                                                  ...convertStringToQuery(currentQuery),
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
                    process.env.NODE_ENV === 'test'
                        ? null
                        : searchClient
                              .query({
                                  query: SearchResultRelatedCountDocument,
                                  variables: {
                                      input: [convertStringToQuery(currentQuery)],
                                  },
                                  fetchPolicy: 'cache-first',
                              })
                              .then((res) => {
                                  if (res.data) {
                                      searchClient.writeQuery({
                                          query: SearchResultRelatedCountDocument,
                                          variables: {
                                              input: [convertStringToQuery(currentQuery)],
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
                    close()
                } else {
                    process.env.NODE_ENV === 'test'
                        ? null
                        : searchClient
                              .query({
                                  query: SearchResultItemsDocument,
                                  variables: {
                                      input: [convertStringToQuery(currentQuery)],
                                  },
                                  fetchPolicy: 'cache-first',
                              })
                              .then((res) => {
                                  if (res.data) {
                                      // Remove deleted resource from search query results - this removes the resource from UI
                                      searchClient.writeQuery({
                                          query: SearchResultItemsDocument,
                                          variables: {
                                              input: [convertStringToQuery(currentQuery)],
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
                    close()
                }
            },
        })
    }

    return (
        <Fragment>
            <AcmModal
                variant={ModalVariant.medium}
                isOpen={open}
                title={t('search.modal.delete.resource.title', { resourceKind: resource?.kind })}
                titleIconVariant={'warning'}
                onClose={close}
                actions={[
                    <AcmButton
                        isDisabled={
                            userAccessResponse.loading ||
                            (userAccessResponse.data && !userAccessResponse.data.userAccess.allowed)
                        }
                        key="confirm"
                        variant={ButtonVariant.danger}
                        onClick={() => deleteResourceFn()}
                    >
                        {t('search.modal.delete.resource.action.delete')}
                    </AcmButton>,
                    <AcmButton key="cancel" variant={ButtonVariant.secondary} onClick={close}>
                        {t('search.modal.delete.resource.action.cancel')}
                    </AcmButton>,
                ]}
            >
                {userAccessResponse.error ? (
                    <AcmAlert
                        data-testid={'user-access-error'}
                        noClose={true}
                        variant={'danger'}
                        title={userAccessResponse.error}
                    />
                ) : null}
                {!userAccessResponse.loading && !userAccessResponse?.data?.userAccess.allowed ? (
                    <AcmAlert
                        noClose={true}
                        variant={'danger'}
                        title={t('search.modal.delete.resource.unauthorized.error')}
                    />
                ) : null}
                {deleteResourceResults.error ? (
                    <AcmAlert
                        data-testid={'delete-resource-error'}
                        noClose={true}
                        variant={'danger'}
                        title={deleteResourceResults.error.message}
                    />
                ) : null}
                <div style={{ paddingTop: '1rem' }}>
                    {t('search.modal.delete.resource.text', { resourceName: resource?.name })}
                </div>
            </AcmModal>
        </Fragment>
    )
}

/* Copyright Contributors to the Open Cluster Management project */
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import {
  Card,
  CardBody,
  CardTitle,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Skeleton,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core'
import { CogIcon, ExclamationCircleIcon } from '@patternfly/react-icons'
import { Fragment, useEffect, useState } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, listResources, SavedSearch } from '../../../resources'
import { useSharedAtoms } from '../../../shared-recoil'
import { convertStringToQuery } from '../Search/search-helper'
import { searchClient } from '../Search/search-sdk/search-client'
import { useSearchResultCountQuery } from '../Search/search-sdk/search-sdk'

const CardHeader = (props: { isSearchDisabled: boolean }) => {
  const { isSearchDisabled } = props
  const { t } = useTranslation()
  return (
    <CardTitle>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{t('Saved searches')}</span>
        {!isSearchDisabled && (
          <Link style={{ display: 'flex', alignItems: 'center' }} to={NavigationPath.search}>
            <CogIcon />
            <Text style={{ paddingLeft: '.25rem' }} component={TextVariants.small}>
              {t('Manage')}
            </Text>
          </Link>
        )}
      </div>
    </CardTitle>
  )
}

export default function SavedSearchesCard(
  props: Readonly<{ isUserPreferenceLoading: boolean; savedSearches: SavedSearch[] }>
) {
  const { isUserPreferenceLoading, savedSearches } = props
  const { t } = useTranslation()
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const [isSearchDisabledLoading, setIsSearchDisabledLoading] = useState<boolean>(false)
  const [isSearchDisabled, setIsSearchDisabled] = useState<boolean>()

  const { data, error, loading } = useSearchResultCountQuery({
    variables: { input: savedSearches.map((query) => convertStringToQuery(query.searchText, searchResultLimit)) },
    skip: isUserPreferenceLoading || savedSearches.length === 0,
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })

  useEffect(() => {
    if (error) {
      setIsSearchDisabledLoading(true)
      listResources<IResource>({
        apiVersion: 'search.open-cluster-management.io/v1alpha1',
        kind: 'Search',
      })
        .promise.then((response) => {
          const operatorConditions: V1CustomResourceDefinitionCondition[] = response[0]?.status?.conditions ?? []
          const searchApiCondition = operatorConditions.find((c: V1CustomResourceDefinitionCondition) => {
            return c.type.toLowerCase() === 'ready--search-api' && c.status === 'False'
          })
          if (searchApiCondition) {
            setIsSearchDisabled(true)
          }
          setIsSearchDisabledLoading(false)
        })
        .catch((err) => {
          console.error('Error getting resource: ', err)
          setIsSearchDisabledLoading(false)
        })
    }
  }, [error])

  if (isUserPreferenceLoading || loading || isSearchDisabledLoading) {
    return (
      <div>
        <Card isRounded>
          <CardHeader isSearchDisabled={false} />
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="45%" />
              <Skeleton width="45%" />
            </div>
            <br />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="45%" />
              <Skeleton width="45%" />
            </div>
          </CardBody>
        </Card>
      </div>
    )
  } else if (error) {
    const searchDisabledTitle = 'This view is disabled with the current configuration.'
    const searchDisabledMessage = 'Enable the search service to see this view.'
    return (
      <Card isRounded>
        <CardHeader isSearchDisabled />
        <EmptyState style={{ paddingTop: 0, marginTop: 'auto' }}>
          {!isSearchDisabled && (
            <EmptyStateIcon
              style={{ fontSize: '36px', marginBottom: '1rem' }}
              icon={ExclamationCircleIcon}
              color={'var(--pf-global--danger-color--100)'}
            />
          )}
          <Title size="md" headingLevel="h4">
            {isSearchDisabled ? searchDisabledTitle : t('Error occurred while getting the result count.')}
          </Title>
          <EmptyStateBody>{isSearchDisabled ? searchDisabledMessage : error.message}</EmptyStateBody>
        </EmptyState>
      </Card>
    )
  } else if (!isUserPreferenceLoading && savedSearches.length === 0) {
    return (
      <Card isRounded>
        <CardBody>
          <EmptyState>
            <Title size="lg" headingLevel="h4">
              {t('Personalize this view')}
            </Title>
            <EmptyStateBody>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                {t('Use search to query your resources. When you save a search query, this view will show your data.')}
                <Link to={NavigationPath.search}>
                  <Text component={TextVariants.small}>{t('Go to search')}</Text>
                </Link>
              </span>
            </EmptyStateBody>
          </EmptyState>
        </CardBody>
      </Card>
    )
  }

  return (
    <div>
      <Card isRounded>
        <CardHeader isSearchDisabled={false} />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto auto', columnGap: 16 }}>
            {savedSearches.map((savedSearch: SavedSearch, index: number) => {
              const resultCount = data?.searchResult?.[index]?.count ?? 0
              return (
                <Fragment key={savedSearch.id}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      paddingBottom: '1rem',
                    }}
                  >
                    <span>{savedSearch.name}</span>
                    {savedSearch?.description && (
                      <TextContent>
                        <Text component={TextVariants.small}>{savedSearch.description ?? ''}</Text>
                      </TextContent>
                    )}
                  </div>
                  {resultCount > 0 ? (
                    <Link
                      style={{ display: 'flex' }}
                      to={`${NavigationPath.search}?filters={"textsearch":${encodeURIComponent(
                        JSON.stringify(savedSearch.searchText)
                      )}}`}
                    >
                      {resultCount}
                    </Link>
                  ) : (
                    0
                  )}
                  {index % 2 === 0 && savedSearches.length !== 1 && <Divider orientation={{ default: 'vertical' }} />}
                </Fragment>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

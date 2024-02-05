/* Copyright Contributors to the Open Cluster Management project */
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
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { SavedSearch } from '../../../resources'
import { useSharedAtoms } from '../../../shared-recoil'
import { convertStringToQuery } from '../Search/search-helper'
import { searchClient } from '../Search/search-sdk/search-client'
import { useSearchResultCountQuery } from '../Search/search-sdk/search-sdk'

const CardHeader = () => {
  const { t } = useTranslation()
  return (
    <CardTitle>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{t('Saved searches')}</span>
        <Link style={{ display: 'flex', alignItems: 'center' }} to={NavigationPath.search}>
          <CogIcon />
          <Text style={{ paddingLeft: '.25rem' }} component={TextVariants.small}>
            {t('Manage')}
          </Text>
        </Link>
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

  const { data, error, loading } = useSearchResultCountQuery({
    variables: { input: savedSearches.map((query) => convertStringToQuery(query.searchText, searchResultLimit)) },
    skip: isUserPreferenceLoading || savedSearches.length === 0,
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
  })

  if (loading) {
    return (
      <div>
        <Card isRounded>
          <CardHeader />
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
    return (
      <Card isRounded>
        <CardHeader />
        <EmptyState style={{ paddingTop: 0, marginTop: 'auto' }}>
          <EmptyStateIcon
            style={{ fontSize: '36px', marginBottom: '1rem' }}
            icon={ExclamationCircleIcon}
            color={'var(--pf-global--danger-color--100)'}
          />
          <Title size="md" headingLevel="h4">
            {t('Error occurred while getting the result count.')}
          </Title>
          <EmptyStateBody>{error.message}</EmptyStateBody>
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
        <CardHeader />
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

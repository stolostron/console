/* Copyright Contributors to the Open Cluster Management project */
import {
  PageSection,
  Pagination,
  PaginationVariant,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom-v5-compat'
import { AcmMasonry } from '../../../components/AcmMasonry'
import { useTranslation } from '../../../lib/acm-i18next'
import { usePaginationTitles } from '../../../lib/paginationStrings'
import { checkPermission, rbacCreate, rbacDelete, rbacUpdate } from '../../../lib/rbac-util'
import { transformBrowserUrlToFilterPresets } from '../../../lib/urlQuery'
import { NavigationPath } from '../../../NavigationPath'
import { PolicySet, PolicySetDefinition } from '../../../resources/policy-set'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmButton, AcmEmptyState } from '../../../ui-components'
import { GovernanceCreatePolicysetEmptyState } from '../components/GovernanceEmptyState'
import CardViewToolbarFilter from './components/CardViewToolbarFilter'
import CardViewToolbarSearch from './components/CardViewToolbarSearch'
import PolicySetCard from './components/PolicySetCard'

function violationFilterFn(policySet: PolicySet) {
  if (!policySet.status) {
    return false
  }
  return policySet.status.compliant === 'NonCompliant'
}
function nonViolationFilterFn(policySet: PolicySet) {
  if (!policySet.status) {
    return false
  }
  return policySet.status.compliant === 'Compliant'
}
function pendingFilterFn(policySet: PolicySet) {
  if (!policySet.status) {
    return false
  }
  return policySet.status.compliant === 'Pending'
}
function unknownStatusFilterFn(policySet: PolicySet) {
  if (!policySet.status) {
    return true
  }
  return !policySet.status.compliant
}

function getPresetURIFilters(initialSearch: string | undefined) {
  let presetNames: string[] = [],
    presetNs: string[] = []
  const urlParams = initialSearch?.replace('?', '')?.split('&') ?? []
  if (urlParams[0] !== '') {
    const parsed = JSON.parse(urlParams[0])
    presetNames = parsed.name
    presetNs = parsed.namespace
  }
  return { presetNames, presetNs }
}

export default function PolicySetsPage() {
  const { t } = useTranslation()
  const presets = transformBrowserUrlToFilterPresets(window.location.search)
  const { presetNames, presetNs } = getPresetURIFilters(presets.initialSearch)
  const { namespacesState, policySetsState } = useSharedAtoms()
  const policySets = useRecoilValue(policySetsState)
  const namespaces = useRecoilValue(namespacesState)
  const [searchFilter, setSearchFilter] = useState<Record<string, string[]>>({
    Name: presetNames,
    Namespace: presetNs,
  })
  const [violationFilters, setViolationFilters] = useState<string[]>(presets.initialFilters?.violation ?? [])
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(10)
  const [filteredPolicySets, setFilteredPolicySets] = useState<PolicySet[]>(policySets)
  const [selectedCardID, setSelectedCardID] = useState<string>('')
  const [canCreatePolicySet, setCanCreatePolicySet] = useState<boolean>(false)
  const [canEditPolicySet, setCanEditPolicySet] = useState<boolean>(false)
  const [canDeletePolicySet, setCanDeletePolicySet] = useState<boolean>(false)

  const translatedPaginationTitles = usePaginationTitles()

  useEffect(() => {
    checkPermission(rbacCreate(PolicySetDefinition), setCanCreatePolicySet, namespaces)
    checkPermission(rbacUpdate(PolicySetDefinition), setCanEditPolicySet, namespaces)
    checkPermission(rbacDelete(PolicySetDefinition), setCanDeletePolicySet, namespaces)
  }, [namespaces])

  const updatePerPage = useCallback(
    (newPerPage: number) => {
      // keep the first item in view on pagination size change
      const newPage = Math.floor(((page - 1) * perPage) / newPerPage) + 1
      setPage(newPage)
      setPerPage(newPerPage)
    },
    [page, perPage, setPage, setPerPage]
  )

  useEffect(() => {
    setPage(1)
    const filteredByViolation: PolicySet[] = policySets.filter((policySet: PolicySet) => {
      // Return all if no filters
      if (violationFilters.length === 0) {
        return true
      }
      let filterMatch =
        violationFilters.includes('violations') ||
        violationFilters.includes('no-violations') ||
        violationFilters.includes('pending') ||
        violationFilters.includes('no-status')
          ? false
          : true

      for (const filter of violationFilters) {
        switch (filter) {
          case 'violations':
            if (violationFilterFn(policySet)) {
              filterMatch = true
            }
            break
          case 'no-violations':
            if (nonViolationFilterFn(policySet)) {
              filterMatch = true
            }
            break
          case 'pending':
            if (pendingFilterFn(policySet)) {
              filterMatch = true
            }
            break
          case 'no-status':
            if (unknownStatusFilterFn(policySet)) {
              filterMatch = true
            }
            break
        }
      }

      return filterMatch
    })

    // multi values are OR, multi attributes are AND
    const filteredBySearch: PolicySet[] = filteredByViolation.filter((policySet: PolicySet) => {
      let match = true
      if (searchFilter['Name'] && searchFilter['Name'].length > 0) {
        match = searchFilter['Name'].indexOf(policySet.metadata.name) > -1
        if (!match) return false
      }
      if (searchFilter['Namespace'] && searchFilter['Namespace'].length > 0) {
        match = searchFilter['Namespace'].indexOf(policySet.metadata.namespace) > -1
        if (!match) return false
      }
      return true
    })
    setFilteredPolicySets(
      // Always keep the Policysets sorted alphabetically
      filteredBySearch.sort((a, b) => {
        if (a.metadata.name < b.metadata.name) {
          return -1
        }
        if (a.metadata.name > b.metadata.name) {
          return 1
        }
        return 0
      })
    )
  }, [searchFilter, violationFilters, policySets])

  const actualPage = useMemo<number>(() => {
    const start = (page - 1) * perPage
    let actualPage = page
    if (start >= filteredPolicySets.length) {
      actualPage = Math.max(1, Math.ceil(filteredPolicySets.length / perPage))
    }
    return actualPage
  }, [filteredPolicySets, page, perPage])

  useEffect(() => {
    if (page !== actualPage) {
      setPage(actualPage)
    }
  }, [page, actualPage])

  const uniquePolicySetNames: string[] = useMemo(() => {
    const policySetNames = policySets.map((policySet: PolicySet) => policySet.metadata.name)
    return policySetNames.filter((p, idx) => {
      return policySetNames.indexOf(p) === idx
    })
  }, [policySets])

  const uniqueNs: string[] = useMemo(() => {
    const policySetNamespaces: string[] = policySets.map((policySet: PolicySet) => policySet.metadata.namespace)
    return policySetNamespaces.filter((p, idx) => {
      return policySetNamespaces.indexOf(p) === idx
    })
  }, [policySets])

  const searchData: any = {
    Name: uniquePolicySetNames,
    Namespace: uniqueNs,
  }
  const searchDataKeyNames: string[] = ['Name', 'Namespace']

  if (!policySets || policySets.length === 0) {
    return (
      <PageSection isFilled>
        <GovernanceCreatePolicysetEmptyState rbac={canCreatePolicySet} />
      </PageSection>
    )
  }

  return (
    <Fragment>
      <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%' }}>
        <Toolbar id="toolbar-group-types" isSticky>
          <ToolbarContent>
            <Fragment>
              <ToolbarGroup variant="filter-group">
                <ToolbarItem variant="search-filter">
                  <CardViewToolbarFilter
                    setViolationFilters={setViolationFilters}
                    preSelectedFilters={violationFilters}
                  />
                </ToolbarItem>
                <ToolbarItem variant="search-filter">
                  <CardViewToolbarSearch
                    searchData={searchData}
                    dataKeyNames={searchDataKeyNames}
                    searchFilter={searchFilter}
                    setSearchFilter={setSearchFilter}
                  />
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarItem key={`create-policy-set-toolbar-item`}>
                <AcmButton
                  isDisabled={!canCreatePolicySet}
                  tooltip={!canCreatePolicySet ? t('rbac.unauthorized') : ''}
                  component={Link}
                  variant="primary"
                  to={NavigationPath.createPolicySet}
                >
                  {t('Create policy set')}
                </AcmButton>
              </ToolbarItem>
              <ToolbarItem variant="pagination">
                <Pagination
                  titles={translatedPaginationTitles}
                  itemCount={filteredPolicySets.length}
                  perPage={perPage}
                  page={page}
                  variant={PaginationVariant.top}
                  onSetPage={(_event, page) => setPage(page)}
                  onPerPageSelect={(_event, perPage) => updatePerPage(perPage)}
                  aria-label={t('Pagination top')}
                  isCompact
                />
              </ToolbarItem>
            </Fragment>
          </ToolbarContent>
        </Toolbar>
        {filteredPolicySets.length === 0 ? (
          <AcmEmptyState title={t('No resources match the current filter')} showSearchIcon={true} />
        ) : (
          <PageSection isFilled>
            <AcmMasonry minSize={400}>
              {/* Need to compute all cards here then slice. The PolicySet card render uses react hooks.
                        So paging to a page with less cards than the previous causes a react hook error if rendered in time. */}
              {filteredPolicySets
                .map((policyset: PolicySet) => {
                  return (
                    <PolicySetCard
                      key={`${policyset.metadata.name}-${policyset.metadata.namespace}`}
                      policySet={policyset}
                      selectedCardID={selectedCardID}
                      setSelectedCardID={setSelectedCardID}
                      canEditPolicySet={canEditPolicySet}
                      canDeletePolicySet={canDeletePolicySet}
                    />
                  )
                })
                .slice((actualPage - 1) * perPage, (actualPage - 1) * perPage + perPage)}
            </AcmMasonry>
          </PageSection>
        )}
      </div>
      <Pagination
        titles={translatedPaginationTitles}
        itemCount={filteredPolicySets.length}
        perPage={perPage}
        page={page}
        variant={PaginationVariant.bottom}
        onSetPage={/* istanbul ignore next */ (_event, page) => setPage(page)}
        onPerPageSelect={/* istanbul ignore next */ (_event, perPage) => updatePerPage(perPage)}
        aria-label={t('Pagination bottom')}
        isSticky
      />
    </Fragment>
  )
}

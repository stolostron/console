// Copyright Contributors to the Open Cluster Management project
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Alert,
  Skeleton,
  Stack,
  StackItem,
} from '@patternfly/react-core'
import _ from 'lodash'
import { Fragment, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'
import { useTranslation } from '../../../lib/acm-i18next'
import { PluginContext } from '../../../lib/PluginContext'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { AcmLoadingPage, AcmTable, compareStrings } from '../../../ui-components'
import { useAllClusters } from '../../Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { IVMActionModalProps } from '../../Infrastructure/VirtualMachines/modals/VMActionModal'
import { IDeleteExternalResourceModalProps } from '../components/Modals/DeleteExternalResourceModal'
import { IDeleteModalProps } from '../components/Modals/DeleteResourceModal'
import { convertStringToQuery, federatedErrorText } from '../search-helper'
import { searchClient } from '../search-sdk/search-client'
import { useSearchResultRelatedCountQuery, useSearchResultRelatedItemsQuery } from '../search-sdk/search-sdk'
import { useSearchDefinitions } from '../searchDefinitions'
import { getRowActions } from './utils'

export function RenderItemContent(
  props: Readonly<{
    currentQuery: string
    relatedKind: string
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
    setDeleteExternalResource: React.Dispatch<React.SetStateAction<IDeleteExternalResourceModalProps>>
    setVMAction: React.Dispatch<React.SetStateAction<IVMActionModalProps>>
    hasFederatedError: boolean
    setPluginModal: React.Dispatch<React.SetStateAction<JSX.Element | undefined>>
  }>
) {
  const {
    currentQuery,
    relatedKind,
    setDeleteResource,
    setDeleteExternalResource,
    setVMAction,
    hasFederatedError,
    setPluginModal,
  } = props
  const { t } = useTranslation()
  const navigate = useNavigate()
  const allClusters = useAllClusters(true)
  const { useVirtualMachineActionsEnabled } = useSharedAtoms()
  const vmActionsEnabled = useVirtualMachineActionsEnabled()
  const { useSearchResultLimit } = useSharedAtoms()
  const searchResultLimit = useSearchResultLimit()
  const { acmExtensions } = useContext(PluginContext)
  const rowActions = useCallback(
    (item: any) =>
      getRowActions(
        item,
        relatedKind,
        currentQuery,
        false,
        allClusters,
        setDeleteResource,
        setDeleteExternalResource,
        vmActionsEnabled,
        setVMAction,
        acmExtensions,
        setPluginModal,
        navigate,
        t
      ),
    [
      relatedKind,
      currentQuery,
      allClusters,
      setDeleteResource,
      setDeleteExternalResource,
      vmActionsEnabled,
      setVMAction,
      acmExtensions,
      setPluginModal,
      navigate,
      t,
    ]
  )
  const { data, loading, error } = useSearchResultRelatedItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [{ ...convertStringToQuery(currentQuery, searchResultLimit), relatedKinds: [relatedKind] }],
    },
  })

  const searchDefinitions = useSearchDefinitions()
  const colDefs = _.get(
    searchDefinitions,
    `['${relatedKind.toLowerCase()}'].columns`,
    searchDefinitions['genericresource'].columns
  )
  const relatedResultItems = useMemo(() => data?.searchResult?.[0]?.related?.[0]?.items || [], [data])

  if (error && !hasFederatedError) {
    return (
      <Alert variant={'danger'} isInline title={t('Query error related to the search results.')}>
        <Stack>
          <StackItem>{error ? error.message : ''}</StackItem>
        </Stack>
      </Alert>
    )
  }

  if (loading) {
    return <AcmLoadingPage />
  }

  return (
    <AcmTable
      items={relatedResultItems}
      emptyState={undefined} // table only shown for kinds with related resources
      columns={colDefs}
      keyFn={(item: any) => item?._uid.toString() ?? `${item.name}-${item.namespace}-${item.cluster}`}
      rowActionResolver={rowActions}
    />
  )
}

export default function RelatedResults(
  props: Readonly<{
    currentQuery: string
    selectedRelatedKinds: string[]
    setSelectedRelatedKinds: React.Dispatch<React.SetStateAction<string[]>>
    setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
    setDeleteExternalResource: React.Dispatch<React.SetStateAction<IDeleteExternalResourceModalProps>>
    setVMAction: React.Dispatch<React.SetStateAction<IVMActionModalProps>>
  }>
) {
  const {
    currentQuery,
    selectedRelatedKinds,
    setSelectedRelatedKinds,
    setDeleteResource,
    setDeleteExternalResource,
    setVMAction,
  } = props
  const { t } = useTranslation()
  const [pluginModal, setPluginModal] = useState<JSX.Element>()
  const { useSearchResultLimit, isGlobalHubState, settingsState } = useSharedAtoms()
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const settings = useRecoilValue(settingsState)
  const searchResultLimit = useSearchResultLimit()
  // Related count should not have limit
  const queryFilters = convertStringToQuery(currentQuery, searchResultLimit)
  const { data, error, loading } = useSearchResultRelatedCountQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [queryFilters],
    },
  })

  const hasFederatedError = useMemo(() => {
    if (
      isGlobalHub &&
      settings.globalSearchFeatureFlag === 'enabled' &&
      error?.graphQLErrors.find((error: any) => error?.includes(federatedErrorText))
    ) {
      return true
    }
    return false
  }, [isGlobalHub, settings.globalSearchFeatureFlag, error?.graphQLErrors])

  const relatedCounts = useMemo(() => {
    const dataArray = data?.searchResult?.[0]?.related || []
    const tmpArray = [...dataArray] // use new array so we are not manipulating the memo deps
    return tmpArray.sort((a, b) => compareStrings(a!.kind, b!.kind))
  }, [data])

  if (loading) {
    return (
      <Accordion isBordered asDefinitionList={true}>
        <AccordionItem>
          <AccordionToggle id={'loading-acc-item-1'}>
            <Skeleton width={'250px'} />
          </AccordionToggle>
        </AccordionItem>
        <AccordionItem>
          <AccordionToggle id={'loading-acc-item-2'}>
            <Skeleton width={'250px'} />
          </AccordionToggle>
        </AccordionItem>
        <AccordionItem>
          <AccordionToggle id={'loading-acc-item-3'}>
            <Skeleton width={'250px'} />
          </AccordionToggle>
        </AccordionItem>
      </Accordion>
    )
  } else if ((error && !hasFederatedError) || !data?.searchResult) {
    return (
      <Alert variant={'danger'} isInline title={t('Query error related to the search results.')}>
        <Stack>
          <StackItem>{t('Error occurred while contacting the search service.')}</StackItem>
          <StackItem>{error ? error.message : ''}</StackItem>
        </Stack>
      </Alert>
    )
  }

  if (relatedCounts.length === 0) {
    return <Alert variant={'info'} isInline title={t('There are no resources related to your search results.')} />
  }

  return (
    <Fragment>
      {pluginModal}
      <Accordion isBordered asDefinitionList={true}>
        {relatedCounts.map((count: any, idx: number) => {
          const currentKind = count!.kind
          const accordionItemKey = `${currentKind}-${idx}`
          const isExpanded = selectedRelatedKinds.indexOf(currentKind.toLowerCase()) > -1
          return (
            <AccordionItem key={`${currentKind}-accordion-item`}>
              <AccordionToggle
                onClick={() => {
                  const updatedKinds = isExpanded
                    ? selectedRelatedKinds.filter((kind) => kind !== currentKind.toLowerCase())
                    : [currentKind.toLowerCase(), ...selectedRelatedKinds]
                  setSelectedRelatedKinds(updatedKinds)
                }}
                isExpanded={isExpanded}
                id={accordionItemKey}
              >
                <span style={{ flexDirection: 'row' }}>
                  <span style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    {currentKind}
                    <div
                      style={{
                        marginLeft: '10px',
                        fontSize: 'var(--pf-v5-global--FontSize--sm)',
                        color: 'var(--pf-v5-global--Color--200)',
                      }}
                    >
                      {`(${count!.count})`}
                    </div>
                  </span>
                </span>
              </AccordionToggle>
              <AccordionContent isHidden={!isExpanded}>
                {isExpanded && (
                  <RenderItemContent
                    currentQuery={currentQuery}
                    relatedKind={currentKind}
                    setDeleteResource={setDeleteResource}
                    setDeleteExternalResource={setDeleteExternalResource}
                    setVMAction={setVMAction}
                    hasFederatedError={hasFederatedError}
                    setPluginModal={setPluginModal}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </Fragment>
  )
}

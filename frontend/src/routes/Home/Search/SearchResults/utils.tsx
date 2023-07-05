/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardHeader, ExpandableSection } from '@patternfly/react-core'
import { ReactNode, useEffect, useState } from 'react'
import { TFunction } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { NavigationPath } from '../../../../NavigationPath'
import { ClosedDeleteModalProps, IDeleteModalProps } from '../components/Modals/DeleteResourceModal'
import { GetUrlSearchParam } from '../searchDefinitions'

export interface ISearchResult {
  kind: string
  apiversion: string
  apigroup?: string
  __type: string
}

export function SearchResultExpandableCard(props: {
  title: string
  renderContent: () => ReactNode
  defaultExpanded?: boolean
}) {
  const [open, setOpen] = useState(props.defaultExpanded !== undefined ? props.defaultExpanded : false)

  useEffect(() => {
    setOpen(props.defaultExpanded !== undefined ? props.defaultExpanded : false)
    return () => {
      setOpen(false)
    }
  }, [props.defaultExpanded])

  return (
    <Card isRounded isExpanded={open}>
      <CardHeader>
        <ExpandableSection toggleText={props.title} onToggle={() => setOpen(!open)} isExpanded={open} />
      </CardHeader>
      {open && <CardBody>{props.renderContent()}</CardBody>}
    </Card>
  )
}

export function GetRowActions(
  kind: string,
  currentQuery: string,
  relatedResource: boolean,
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>,
  t: TFunction
) {
  const history = useHistory()
  return kind !== 'cluster' &&
    kind !== 'release' &&
    kind !== 'policyreport' &&
    kind !== 'application' &&
    kind !== 'policy'
    ? [
        {
          id: 'edit',
          title: t('Edit {{resourceKind}}', { resourceKind: kind }),
          click: (item: any) => {
            const searchParams = GetUrlSearchParam(item)
            return history.push({
              pathname: NavigationPath.resourceYAML,
              search: searchParams,
              state: {
                from: NavigationPath.search,
                fromSearch: window.location.search,
              },
            })
          },
        },
        {
          id: 'view-related',
          title: t('View related resources'),
          click: (item: any) => {
            const searchParams = GetUrlSearchParam(item)
            return history.push({
              pathname: NavigationPath.resourceRelated,
              search: searchParams,
              state: {
                from: NavigationPath.search,
                fromSearch: window.location.search,
              },
            })
          },
        },
        {
          id: 'delete',
          title: t('Delete {{resourceKind}}', { resourceKind: kind }),
          click: (item: any) => {
            setDeleteResource({
              open: true,
              close: () => setDeleteResource(ClosedDeleteModalProps),
              resource: item,
              currentQuery,
              relatedResource,
            })
          },
        },
      ]
    : []
}

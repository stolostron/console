/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardHeader, ExpandableSection } from '@patternfly/react-core'
import { TFunction } from 'i18next'
import { ReactNode, useEffect, useState } from 'react'
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
  return kind !== 'cluster' && kind !== 'release' && kind !== 'policyreport'
    ? [
        {
          id: 'edit',
          title: t('Edit {{resourceKind}}', { resourceKind: kind }),
          click: (item: any) => {
            const searchParams = GetUrlSearchParam(item)
            return history.push(`${NavigationPath.resourceYAML}${searchParams}`)
          },
        },
        {
          id: 'view-related',
          title: t('View related resources'),
          click: (item: any) => {
            const searchParams = GetUrlSearchParam(item)
            return history.push(`${NavigationPath.resourceRelated}${searchParams}`)
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

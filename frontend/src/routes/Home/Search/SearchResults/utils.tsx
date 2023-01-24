/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardHeader, ExpandableSection } from '@patternfly/react-core'
import { ReactNode, useEffect, useState } from 'react'
import { ClosedDeleteModalProps, IDeleteModalProps } from '../components/Modals/DeleteResourceModal'

export interface ISearchResult {
  kind: string
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
  rowTitle: string,
  currentQuery: string,
  relatedResource: boolean,
  setDeleteResource: React.Dispatch<React.SetStateAction<IDeleteModalProps>>
) {
  return kind !== 'cluster' && kind !== 'release' && kind !== 'policyreport'
    ? [
        {
          id: 'delete',
          title: rowTitle,
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

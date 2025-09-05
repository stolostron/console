import { DualListSelector, DualListSelectorTreeItemData } from '@patternfly/react-core'
import React, { useCallback, useEffect } from 'react'

type ClustersDualListSelectorProps = {
  onChoseOptions: (values: { id: string; value: string }[]) => void
}

const ClustersDualListSelector = ({ onChoseOptions }: ClustersDualListSelectorProps) => {
  const [availableOptions, setAvailableOptions] = React.useState<DualListSelectorTreeItemData[]>([
    {
      id: 'cluster set 1',
      text: 'cluster set 1',
      isChecked: false,
      checkProps: { 'aria-label': 'cluster set 1' },
      hasBadge: true,
      badgeProps: { isRead: true },
      children: [
        {
          id: 'cluster 1',
          text: 'cluster 1',
          isChecked: false,
          hasBadge: true,
          checkProps: { 'aria-label': 'cluster 1' },
          children: [
            {
              id: 'Namespace1',
              text: 'Namespace1',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace1' },
            },
            {
              id: 'Namespace2',
              text: 'Namespace2',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace2' },
            },
            {
              id: 'Namespace3',
              text: 'Namespace3',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace3' },
            },
            {
              id: 'Namespace4',
              text: 'Namespace4',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace4' },
            },
            {
              id: 'Namespace5',
              text: 'Namespace5',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace5' },
            },
            {
              id: 'Namespace6',
              text: 'Namespace6',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace6' },
            },
            {
              id: 'Namespace7',
              text: 'Namespace7',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace7' },
            },
            {
              id: 'Namespace8',
              text: 'Namespace8',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace8' },
            },
          ],
        },
        {
          id: 'cluster 2',
          text: 'cluster 2',
          hasBadge: true,
          isChecked: false,
          checkProps: { 'aria-label': 'cluster 2' },
          children: [
            {
              id: 'NamespaceB6',
              text: 'NamespaceB6',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceB6' },
            },
            {
              id: 'NamespaceB7',
              text: 'NamespaceB7',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceB7' },
            },
            {
              id: 'NamespaceB8',
              text: 'NamespaceB8',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceB8' },
            },
            {
              id: 'NamespaceB9',
              text: 'NamespaceB9',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceB9' },
            },
            {
              id: 'NamespaceB10',
              text: 'NamespaceB10',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceB10' },
            },
          ],
        },
      ],
    },
    {
      id: 'cluster set 2',
      text: 'cluster set 2',
      isChecked: false,
      checkProps: { 'aria-label': 'cluster set 2' },
      hasBadge: true,
      badgeProps: { isRead: true },
      children: [
        {
          id: 'cluster 1',
          text: 'cluster 1',
          hasBadge: true,
          isChecked: false,
          checkProps: { 'aria-label': 'cluster 1' },
          children: [
            {
              id: 'Namespace1',
              text: 'Namespace1',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace1' },
            },
            {
              id: 'Namespace2',
              text: 'Namespace2',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace2' },
            },
            {
              id: 'Namespace3',
              text: 'Namespace3',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace3' },
            },
            {
              id: 'Namespace4',
              text: 'Namespace4',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace4' },
            },
            {
              id: 'Namespace5',
              text: 'Namespace5',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace5' },
            },
            {
              id: 'Namespace6',
              text: 'Namespace6',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace6' },
            },
            {
              id: 'Namespace7',
              text: 'Namespace7',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace7' },
            },
            {
              id: 'Namespace8',
              text: 'Namespace8',
              isChecked: false,
              checkProps: { 'aria-label': 'Namespace8' },
            },
          ],
        },
        {
          id: 'cluster 3',
          text: 'cluster 3',
          hasBadge: true,
          isChecked: false,
          checkProps: { 'aria-label': 'cluster 2' },
          children: [
            {
              id: 'NamespaceC3',
              text: 'NamespaceC3',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceC3' },
            },
            {
              id: 'NamespaceC4',
              text: 'NamespaceC4',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceC4' },
            },
            {
              id: 'NamespaceC5',
              text: 'NamespaceC5',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceC5' },
            },
            {
              id: 'NamespaceC8',
              text: 'NamespaceC8',
              isChecked: false,
              checkProps: { 'aria-label': 'NamespaceC8' },
            },
          ],
        },
      ],
    },
  ])

  const [chosenOptions, setChosenOptions] = React.useState<DualListSelectorTreeItemData[]>([])

  const onListChange = useCallback(
    (
      event: React.MouseEvent<HTMLElement>,
      newAvailableOptions: DualListSelectorTreeItemData[],
      newChosenOptions: DualListSelectorTreeItemData[]
    ) => {
      setAvailableOptions(newAvailableOptions.sort())
      setChosenOptions(newChosenOptions.sort())
      onChoseOptions(chosenOptions.filter((e) => e.isChecked).map((e) => ({ id: e.id, value: e.text })))
    },
    [chosenOptions, onChoseOptions]
  )

  useEffect(
    () => onChoseOptions(chosenOptions.filter((e) => e.isChecked).map((e) => ({ id: e.id, value: e.text }))),
    [chosenOptions, onChoseOptions]
  )

  return (
    <DualListSelector
      isSearchable
      isTree
      availableOptions={availableOptions}
      chosenOptions={chosenOptions}
      onListChange={onListChange as any}
      onOptionCheck={() =>
        onChoseOptions(chosenOptions.filter((e) => e.isChecked).map((e) => ({ id: e.id, value: e.text })))
      }
      id="clusters-dual-list-selector-tree"
    />
  )
}

export { ClustersDualListSelector }

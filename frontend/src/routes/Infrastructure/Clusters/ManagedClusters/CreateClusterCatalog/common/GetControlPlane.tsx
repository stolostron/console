/* Copyright Contributors to the Open Cluster Management project */

import { DataViewStringContext, ICatalogCard, ItemView } from '@stolostron/react-data-view'
import { useCallback } from 'react'
import { useDataViewStrings } from '../../../../../../lib/dataViewStrings'
import { AcmPage } from '../../../../../../ui-components'

type ControlPlaneProps = {
  pageHeader: any
  cards: ICatalogCard[]
  onBack: () => void
  onCancel: () => void
  customCatalogSection?: any
}

export const GetControlPlane = (props: ControlPlaneProps) => {
  const { pageHeader, cards, onBack, onCancel, customCatalogSection } = props
  const dataViewStrings = useDataViewStrings()
  const keyFn = useCallback((card: ICatalogCard) => card.id, [])
  return (
    <AcmPage header={pageHeader}>
      <DataViewStringContext.Provider value={dataViewStrings}>
        <ItemView
          items={cards}
          itemKeyFn={keyFn}
          itemToCardFn={(card) => card}
          onBack={onBack}
          onCancel={onCancel}
          customCatalogSection={customCatalogSection}
        />
      </DataViewStringContext.Provider>
    </AcmPage>
  )
}

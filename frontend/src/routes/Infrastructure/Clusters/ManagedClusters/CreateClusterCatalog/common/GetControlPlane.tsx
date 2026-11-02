/* Copyright Contributors to the Open Cluster Management project */

import { ICatalogCard, AcmCatalogView } from '~/ui-components/AcmCatalog'
import { useCallback } from 'react'
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
  const keyFn = useCallback((card: ICatalogCard) => card.id, [])
  return (
    <AcmPage header={pageHeader}>
      <AcmCatalogView
        items={cards}
        itemKeyFn={keyFn}
        itemToCardFn={(card) => card}
        onBack={onBack}
        onCancel={onCancel}
        customCatalogSection={customCatalogSection}
      />
    </AcmPage>
  )
}

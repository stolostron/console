/* Copyright Contributors to the Open Cluster Management project */

import { AcmHelperText } from '~/ui-components/AcmHelperText/AcmHelperText'
import { useDynamicPropertyValues } from '../helpers/dynamicProperties'
import type { TFunction } from 'i18next'

export const ControlPanelHelperText = (props: {
  control: any
  controlData: any
  controlId: string
  i18n: TFunction
}) => {
  const { controlId, control, controlData, i18n } = props
  const { exception, tip } = control
  const { info } = useDynamicPropertyValues(control, controlData, i18n, ['info'])

  if (exception) {
    return <AcmHelperText controlId={controlId} helperText={undefined} validated="error" error={exception} />
  }

  if (info) {
    return (
      <p id={`${controlId}-helper`} className="creation-view-hint creation-view-hint--field">
        {info}
      </p>
    )
  }

  return <AcmHelperText controlId={controlId} helperText={tip} validated={undefined} error={undefined} />
}

/* Copyright Contributors to the Open Cluster Management project */

import { AcmHelperText } from '~/ui-components/AcmHelperText/AcmHelperText'
import { useDynamicPropertyValues } from '../helpers/dynamicProperties'
import { TFunction } from 'react-i18next'

export const ControlPanelHelperText = (props: {
  control: any
  controlData: any
  controlId: string
  i18n: TFunction
}) => {
  const { controlId, control, controlData, i18n } = props
  const { exception, tip } = control
  const { info } = useDynamicPropertyValues(control, controlData, i18n, ['info'])
  return (
    <AcmHelperText
      controlId={controlId}
      helperText={info ?? tip}
      validated={exception ? 'error' : info ? 'default' : undefined}
      error={exception}
    />
  )
}

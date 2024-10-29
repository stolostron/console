/* Copyright Contributors to the Open Cluster Management project */
import { PopoverIcon } from '@openshift-assisted/ui-lib/common'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { FormGroup, Radio } from '@patternfly/react-core'
import { AcmForm } from '../../../../../../ui-components'
import { css } from '@emotion/css'
import _ from 'lodash'

const formWrapper = css({
  paddingBottom: '25px',
  '& .pf-c-form__group-label': {
    padding: `0px 0px 6px 0px !important`,
  },
})

const AvailabilityOptionsForm = (props: any) => {
  const { control } = props
  const { t } = useTranslation()

  // Set default option to "Highly Available"
  if (_.isEmpty(control.active)) {
    props.control.active = {
      controller: 'HighlyAvailable',
      infra: 'HighlyAvailable',
    }
  }
  const { controller, infra } = props.control.active
  const handleChange = (_: any, event: any) => {
    const { control, handleChange } = props

    let targetName = ''
    try {
      targetName = event.target.name
    } catch (event) {
      targetName = ''
    }

    if (targetName) {
      if (targetName === 'controllerAvailabilityPolicy') {
        control.active.controller = event.target.value
      } else if (targetName === 'infraAvailabilityPolicy') {
        control.active.infra = event.target.value
      }
    }
    handleChange(control)
  }

  const labelHA = () => {
    return (
      <>
        {t('Highly available')}{' '}
        <PopoverIcon
          bodyContent={t(
            'Highly available means components should be resilient to problems across fault boundaries as defined by the component to which the policy is attached. This usually means running critical workloads with 3 replicas and with little or no toleration of disruption of the component.'
          )}
        />
      </>
    )
  }

  const labelSingle = () => {
    return (
      <>
        {t('Single replica')}{' '}
        <PopoverIcon
          bodyContent={t(
            'Single replica means components are not expected to be resilient to problems across most fault boundaries associated with high availability. This usually means running critical workloads with just 1 replica and with toleration of full disruption of the component.'
          )}
        />
      </>
    )
  }

  return (
    <AcmForm className={formWrapper}>
      <FormGroup role="radiogroup" isInline fieldId="controller" label={t('Controller availability policy')} isRequired>
        <Radio
          id={'controller-ha'}
          name={'controllerAvailabilityPolicy'}
          label={labelHA()}
          value={'HighlyAvailable'}
          defaultChecked={controller === 'HighlyAvailable'}
          onChange={handleChange}
        />
        <Radio
          id={'controller-single'}
          name={'controllerAvailabilityPolicy'}
          label={labelSingle()}
          value={'SingleReplica'}
          defaultChecked={controller === 'SingleReplica'}
          onChange={handleChange}
        />
      </FormGroup>
      <FormGroup
        role="radiogroup"
        isInline
        fieldId="infrastructure"
        label={t('Infrastructure availability policy')}
        isRequired
      >
        <Radio
          id={'infra-ha'}
          name={'infraAvailabilityPolicy'}
          label={labelHA()}
          value={'HighlyAvailable'}
          defaultChecked={infra === 'HighlyAvailable'}
          onChange={handleChange}
        />
        <Radio
          id={'infra-single'}
          name={'infraAvailabilityPolicy'}
          label={labelSingle()}
          value={'SingleReplica'}
          defaultChecked={infra === 'SingleReplica'}
          onChange={handleChange}
        />
      </FormGroup>
    </AcmForm>
  )
}

export default AvailabilityOptionsForm

//
export const summarize = (control: any, controlData: any, summary: string[]) => {
  const { controller, infra } = control.active || {}
  // console.log('controller', controller)
  // console.log('infra', infra)
  controller && summary.push(controller)
  infra && summary.push(infra)
  // console.log('summary', summary)
}

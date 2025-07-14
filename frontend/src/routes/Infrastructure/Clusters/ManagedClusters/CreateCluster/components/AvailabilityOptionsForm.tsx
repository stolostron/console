/* Copyright Contributors to the Open Cluster Management project */
import { PopoverIcon } from '@openshift-assisted/ui-lib/common'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { FormGroup, Radio } from '@patternfly/react-core'
import { AcmForm } from '../../../../../../ui-components'
import { css } from '@emotion/css'
import { TFunction } from 'i18next'
import { FormEvent } from 'react'

const formWrapper = css({
  paddingBottom: '25px',
  '& .pf-c-form__group-label': {
    padding: `0px 0px 6px 0px !important`,
  },
})

type FormControl = {
  active: {
    controllerAvailabilityPolicy: 'HighlyAvailable' | 'SingleReplica'
    infrastructureAvailabilityPolicy: 'HighlyAvailable' | 'SingleReplica'
  }
}

type AvailabilityOptionsFormProps = {
  control: FormControl
  handleChange: (control: FormControl) => void
}

const AvailabilityOptionsForm = ({ control, handleChange }: AvailabilityOptionsFormProps) => {
  const { t } = useTranslation()

  const handleRadioChange = (event: FormEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement
    const { name, value } = target

    control.active = {
      ...control.active,
      [name]: value,
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
          data-testid="controller-ha"
          name={'controllerAvailabilityPolicy'}
          label={labelHA()}
          value={'HighlyAvailable'}
          isChecked={control.active?.controllerAvailabilityPolicy === 'HighlyAvailable'}
          onChange={handleRadioChange}
        />
        <Radio
          id={'controller-single'}
          data-testid="controller-single"
          name={'controllerAvailabilityPolicy'}
          label={labelSingle()}
          value={'SingleReplica'}
          isChecked={control.active.controllerAvailabilityPolicy === 'SingleReplica'}
          onChange={handleRadioChange}
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
          data-testid="infra-ha"
          name={'infrastructureAvailabilityPolicy'}
          label={labelHA()}
          value={'HighlyAvailable'}
          isChecked={control.active?.infrastructureAvailabilityPolicy === 'HighlyAvailable'}
          onChange={handleRadioChange}
        />
        <Radio
          data-testid="infra-single"
          id={'infra-single'}
          name={'infrastructureAvailabilityPolicy'}
          label={labelSingle()}
          value={'SingleReplica'}
          isChecked={control.active.infrastructureAvailabilityPolicy === 'SingleReplica'}
          onChange={handleRadioChange}
        />
      </FormGroup>
    </AcmForm>
  )
}

export default AvailabilityOptionsForm

export const summary = (control: any, t: TFunction) => {
  const { controllerAvailabilityPolicy, infrastructureAvailabilityPolicy } = control.active || {}
  const getDesc = (value: string) => (value === 'HighlyAvailable' ? t('Highly available') : t('Single replica'))

  const controllerDesc = getDesc(controllerAvailabilityPolicy)
  const infraDesc = getDesc(infrastructureAvailabilityPolicy)

  return [
    { term: t('Controller availability policy'), desc: controllerDesc },
    { term: t('Infrastructure availability policy'), desc: infraDesc },
  ]
}

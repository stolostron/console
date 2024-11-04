/* Copyright Contributors to the Open Cluster Management project */
import { PopoverIcon } from '@openshift-assisted/ui-lib/common'
import { useTranslation } from '../../../../../../lib/acm-i18next'
import { FormGroup, Radio } from '@patternfly/react-core'
import { AcmForm } from '../../../../../../ui-components'
import { css } from '@emotion/css'
import { TFunction } from 'i18next'

const formWrapper = css({
  paddingBottom: '25px',
  '& .pf-c-form__group-label': {
    padding: `0px 0px 6px 0px !important`,
  },
})

type FormControl = {
  active: any
}

type AvailabilityOptionsFormProps = {
  control: FormControl
  handleChange: (control: FormControl) => void
}

const AvailabilityOptionsForm: React.FC<AvailabilityOptionsFormProps> = (props: any) => {
  const { control } = props
  const { t } = useTranslation()

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
          data-testid="controller-ha"
          name={'controllerAvailabilityPolicy'}
          label={labelHA()}
          value={'HighlyAvailable'}
          defaultChecked={control.active.controller === 'HighlyAvailable'}
          onChange={handleChange}
        />
        <Radio
          id={'controller-single'}
          data-testid="controller-single"
          name={'controllerAvailabilityPolicy'}
          label={labelSingle()}
          value={'SingleReplica'}
          defaultChecked={control.active.controller === 'SingleReplica'}
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
          data-testid="infra-ha"
          name={'infraAvailabilityPolicy'}
          label={labelHA()}
          value={'HighlyAvailable'}
          defaultChecked={control.active.infra === 'HighlyAvailable'}
          onChange={handleChange}
        />
        <Radio
          data-testid="infra-single"
          id={'infra-single'}
          name={'infraAvailabilityPolicy'}
          label={labelSingle()}
          value={'SingleReplica'}
          defaultChecked={control.active.infra === 'SingleReplica'}
          onChange={handleChange}
        />
      </FormGroup>
    </AcmForm>
  )
}

export default AvailabilityOptionsForm

export const summary = (control: any, t: TFunction) => {
  const { controller, infra } = control.active || {}
  const getDesc = (ctrl: string) => (ctrl === 'HighlyAvailable' ? t('Highly available') : t('Single replica'))

  const controllerDesc = getDesc(controller)
  const infraDesc = getDesc(infra)

  return [
    { term: t('Controller availability policy'), desc: controllerDesc },
    { term: t('Infrastructure availability policy'), desc: infraDesc },
  ]
}

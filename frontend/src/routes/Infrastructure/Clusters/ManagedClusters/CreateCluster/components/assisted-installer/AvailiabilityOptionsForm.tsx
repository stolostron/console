/* Copyright Contributors to the Open Cluster Management project */
import { PopoverIcon } from '@openshift-assisted/ui-lib/common'
import { useTranslation } from '../../../../../../../lib/acm-i18next'
import { FormGroup, Radio } from '@patternfly/react-core'
import { AcmForm } from '../../../../../../../ui-components'

export function AvailabilityOptionsForm() {
  const { t } = useTranslation()

  return (
    <AcmForm>
      <FormGroup fieldId="1" isInline label={<>{t('Controller availability policy')}</>} isRequired>
        <Radio
          name={'controllerAvailabilityPolicy'}
          id={'controller-ha'}
          label={
            <>
              {t('Highly available')}{' '}
              <PopoverIcon
                bodyContent={t(
                  'Highly available means components should be resilient to problems across fault boundaries as defined by the component to which the policy is attached. This usually means running critical workloads with 3 replicas and with little or no toleration of disruption of the component.'
                )}
              />
            </>
          }
          value={'HighlyAvailable'}
          // defaultChecked={isChecked}
        />
        <Radio
          name={'controllerAvailabilityPolicy'}
          id={'controller-single'}
          label={
            <>
              {t('Single replica')}{' '}
              <PopoverIcon
                bodyContent={t(
                  'Single replica means components are not expected to be resilient to problems across most fault boundaries associated with high availability. This usually means running critical workloads with just 1 replica and with toleration of full disruption of the component.'
                )}
              />
            </>
          }
          value={'SingleReplica'}
        />
      </FormGroup>
      <FormGroup fieldId="2" isInline label={<>{t('Infrastructure availability policy')}</>} isRequired>
        <Radio
          name={'infrastructureAvailabilityPolicy'}
          id={'infra-ha'}
          label={
            <>
              {t('Highly available')}{' '}
              <PopoverIcon
                bodyContent={t(
                  'Highly available means components should be resilient to problems across fault boundaries as defined by the component to which the policy is attached. This usually means running critical workloads with 3 replicas and with little or no toleration of disruption of the component.'
                )}
              />
            </>
          }
          value={'HighlyAvailable'}
        />
        <Radio
          id={'infra-single'}
          name={'infrastructureAvailabilityPolicy'}
          label={
            <>
              {t('Single replica')}{' '}
              <PopoverIcon
                bodyContent={t(
                  'Single replica means components are not expected to be resilient to problems across most fault boundaries associated with high availability. This usually means running critical workloads with just 1 replica and with toleration of full disruption of the component.'
                )}
              />
            </>
          }
          value={'SingleReplica'}
        />
      </FormGroup>
    </AcmForm>
  )
}

export default AvailabilityOptionsForm

/* Copyright Contributors to the Open Cluster Management project */
import { useParams, useNavigate } from 'react-router-dom-v5-compat'
import { AcmModal, AcmButton } from '../../../ui-components'
import { NavigationPath } from '../../../NavigationPath'
import { useTranslation } from '../../../lib/acm-i18next'

export default function MigrateVirtualMachinePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <AcmModal
      title="Migrate Virtual Machine"
      isOpen={true}
      width={'80%'}
      onClose={() => navigate(NavigationPath.virtualMachines)}
      actions={[
        <AcmButton
          key="migrate"
          onClick={() => {
            console.log('trigger migration')
          }}
        >
          Migrate {id}
        </AcmButton>,
        <AcmButton key="cancel" variant="secondary" onClick={() => navigate(NavigationPath.virtualMachines)}>
          {t('Cancel')}
        </AcmButton>,
      ]}
    >
      <p>Proceed with migration of VM {id} ?</p>
    </AcmModal>
  )
}

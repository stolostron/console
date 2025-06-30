/* Copyright Contributors to the Open Cluster Management project */
import { useNavigate } from 'react-router-dom-v5-compat'
import { AcmModal } from '../../../ui-components'
import { NavigationPath } from '../../../NavigationPath'
import { VMWizardPage } from '../../../wizards/Migration/VMWizardPage'

export default function MigrateVirtualMachinePage() {
  const navigate = useNavigate()

  return (
    <AcmModal
      hasNoBodyWrapper={true}
      isOpen={true}
      width={'80%'}
      showClose={false}
      onClose={() => navigate(NavigationPath.virtualMachines)}
    >
      <VMWizardPage />
    </AcmModal>
  )
}

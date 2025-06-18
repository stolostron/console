import { useHistory } from 'react-router-dom'
import { onCancel, onSubmit } from '../common/utils'
import { AppWizard } from './AppWizard'

export function AppExample() {
    const history = useHistory()
    return <AppWizard onSubmit={onSubmit} onCancel={() => onCancel(history)} />
}

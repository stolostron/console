import { useHistory } from 'react-router-dom'
import { onCancel, onSubmit } from '../common/utils'
import { RosaWizard } from './RosaWizard'

export function RosaExample() {
    const history = useHistory()
    return <RosaWizard onSubmit={onSubmit} onCancel={() => onCancel(history)} />
}

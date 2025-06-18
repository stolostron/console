import { Button, Tooltip } from '@patternfly/react-core'
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons'
import { useStringContext } from '../contexts/StringContext'

export function ShowSecretsButton(props: { showSecrets: boolean; setShowSecrets: (value: boolean) => void }) {
    const { showSecrets, setShowSecrets } = props
    const { showSecretTooltip, hideSecretTooltip } = useStringContext()
    return (
        <Tooltip content={showSecrets ? hideSecretTooltip : showSecretTooltip}>
            <Button variant="control" onClick={() => setShowSecrets(!showSecrets)}>
                {showSecrets ? <EyeIcon /> : <EyeSlashIcon />}
            </Button>
        </Tooltip>
    )
}

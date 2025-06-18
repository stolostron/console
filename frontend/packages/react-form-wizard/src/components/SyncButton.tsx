import { Button, Tooltip } from '@patternfly/react-core'
import { SyncAltIcon } from '@patternfly/react-icons'
import { useStringContext } from '../contexts/StringContext'

export function SyncButton(props: { onClick: () => void }) {
    const { syncButtonTooltip } = useStringContext()
    return (
        <Tooltip content={syncButtonTooltip}>
            <Button variant="control" onClick={props.onClick}>
                <SyncAltIcon />
            </Button>
        </Tooltip>
    )
}

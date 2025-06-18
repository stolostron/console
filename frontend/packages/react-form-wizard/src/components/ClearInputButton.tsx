import { Button, Tooltip } from '@patternfly/react-core'
import { TimesCircleIcon } from '@patternfly/react-icons'
import { useStringContext } from '../contexts/StringContext'

export function ClearInputButton(props: { onClick: () => void }) {
    const { onClick } = props
    const { clearButtonTooltip } = useStringContext()
    return (
        <Tooltip content={clearButtonTooltip}>
            <Button variant="control" onClick={onClick} tabIndex={-1}>
                <TimesCircleIcon />
            </Button>
        </Tooltip>
    )
}

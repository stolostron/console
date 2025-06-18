import { Button, Spinner, Tooltip } from '@patternfly/react-core'
import { useStringContext } from '../contexts/StringContext'

export function SpinnerButton() {
    const { spinnerButtonTooltip } = useStringContext()
    return (
        <Tooltip content={spinnerButtonTooltip}>
            <Button variant="control" isDisabled>
                <Spinner size="md" style={{ margin: -1, marginBottom: -3 }} />
            </Button>
        </Tooltip>
    )
}

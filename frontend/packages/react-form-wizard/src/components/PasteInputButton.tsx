import { Button, Tooltip } from '@patternfly/react-core'
import { PasteIcon } from '@patternfly/react-icons'
import { useStringContext } from '../contexts/StringContext'

export function PasteInputButton(props: { setValue: (value: string) => void; setShowSecrets?: (value: boolean) => void }) {
    const { setValue, setShowSecrets } = props
    const { pasteButtonTooltip } = useStringContext()
    return (
        <Tooltip content={pasteButtonTooltip}>
            <Button
                variant="control"
                onClick={() => {
                    void navigator.clipboard.readText().then((value) => {
                        setValue(value)
                        if (value && setShowSecrets) setShowSecrets(false)
                    })
                }}
                tabIndex={-1}
            >
                <PasteIcon />
            </Button>
        </Tooltip>
    )
}

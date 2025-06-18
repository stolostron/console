import { Button, Divider, List, ListItem, TextInput } from '@patternfly/react-core'
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons'
import { Fragment } from 'react'
import { WizHelperText } from '../components/WizHelperText'
import { Indented } from '../components/Indented'
import { LabelHelp } from '../components/LabelHelp'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useStringContext } from '../contexts/StringContext'
import { getAddPlaceholder, InputCommonProps, useInput } from './Input'

type KeyValueProps = InputCommonProps & { placeholder?: string; summaryList?: boolean }

export function WizKeyValue(props: KeyValueProps) {
    const { displayMode: mode, value, setValue, hidden, id } = useInput(props)
    const pairs: { key: string; value: string }[] =
        value instanceof Object ? Object.keys(value).map((key) => ({ key, value: value[key] })) : []

    const onKeyChange = (index: number, newKey: string) => {
        pairs[index].key = newKey
        setValue(
            pairs.reduce((result, pair) => {
                result[pair.key] = pair.value
                return result
            }, {} as Record<string, string>)
        )
    }

    const onValueChange = (index: number, newValue: string) => {
        pairs[index].value = newValue
        setValue(
            pairs.reduce((result, pair) => {
                result[pair.key] = pair.value
                return result
            }, {} as Record<string, string>)
        )
    }

    const onNewKey = () => {
        pairs.push({ key: '', value: '' })
        setValue(
            pairs.reduce((result, pair) => {
                result[pair.key] = pair.value
                return result
            }, {} as Record<string, string>)
        )
    }

    const onDeleteKey = (index: number) => {
        pairs.splice(index, 1)
        setValue(
            pairs.reduce((result, pair) => {
                result[pair.key] = pair.value
                return result
            }, {} as Record<string, string>)
        )
    }

    const { removeItemAriaLabel, actionAriaLabel } = useStringContext()

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!pairs.length) return <Fragment />
        return (
            <Fragment>
                <div className="pf-v5-c-description-list__term">{props.label}</div>
                <Indented id={id}>
                    <List style={{ marginTop: -4 }} isPlain={props.summaryList !== true}>
                        {pairs.map((pair, index) => (
                            <ListItem key={index} style={{ paddingBottom: 4 }}>
                                {pair.key} {pair.value !== undefined && <span> = {pair.value}</span>}
                            </ListItem>
                        ))}
                    </List>
                </Indented>
            </Fragment>
        )
    }

    return (
        <div id={id} style={{ display: 'flex', flexDirection: 'column', rowGap: pairs.length ? 8 : 4 }}>
            <div>
                <span className="pf-v5-c-form__label pf-v5-c-form__label-text">{props.label}</span>
                {props.labelHelp && <LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />}
            </div>
            <WizHelperText {...props} />
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'fit-content(200px) fit-content(0) auto fit-content(0)',
                    alignItems: 'center',
                    columnGap: 8,
                    rowGap: 8,
                }}
            >
                {pairs.map((pair, index) => {
                    return (
                        <Fragment key={index}>
                            <TextInput
                                id={`key-${index + 1}`}
                                value={pair.key}
                                spellCheck="false"
                                onChange={(_event, value) => onKeyChange(index, value)}
                            />
                            <span>=</span>
                            <TextInput
                                id={`value-${index + 1}`}
                                value={pair.value}
                                spellCheck="false"
                                onChange={(_event, value) => onValueChange(index, value)}
                            />
                            <Button variant="plain" aria-label={removeItemAriaLabel} onClick={() => onDeleteKey(index)}>
                                <TrashIcon />
                            </Button>
                        </Fragment>
                    )
                })}
            </div>
            {!Object.keys(pairs).length && <Divider />}
            <div>
                <Button id="add-button" variant="link" size="sm" aria-label={actionAriaLabel} onClick={onNewKey} icon={<PlusCircleIcon />}>
                    {getAddPlaceholder(props)}
                </Button>
            </div>
        </div>
    )
}

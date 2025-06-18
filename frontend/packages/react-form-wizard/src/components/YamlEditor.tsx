import useResizeObserver from '@react-hook/resize-observer'
import { useEffect, useRef, useState } from 'react'
import YAML from 'yaml'
import { useData } from '../contexts/DataContext'
import { useItem } from '../contexts/ItemContext'
import { useStringContext } from '../contexts/StringContext'

const color = {
    background: 'rgb(21, 21, 21)',
    divider: 'rgb(212, 212, 212)',
    colon: 'rgb(212, 212, 212)',
    variable: 'rgb(115, 188, 247)',
    value: 'rgb(240, 171, 0)',
}

export function YamlToObject(yaml: string, isYamlArray?: boolean) {
    if (isYamlArray === true) {
        try {
            return YAML.parseAllDocuments(yaml, { prettyErrors: true })
                .map((doc) => doc.toJSON())
                .filter((doc) => !!doc)
        } catch {
            return []
        }
    } else {
        try {
            return YAML.parse(yaml, { prettyErrors: true })
        } catch {
            return {}
        }
    }
}

export function ObjectToYaml(data: any, isYamlArray: boolean) {
    if (isYamlArray) {
        return (data as unknown[]).map((doc) => YAML.stringify(doc)).join('---\n')
    } else {
        return YAML.stringify(data)
    }
}

export function YamlEditor(props: { data: any; setData?: (data: any) => void; isYamlArray: boolean }) {
    const [hasFocus, setHasFocus] = useState(false)
    const [, setError] = useState('')
    const [errorLine, setErrorLine] = useState(-1)
    const [yaml, setYaml] = useState(() => {
        return ObjectToYaml(props.data, props.isYamlArray) ?? ''
    })
    useEffect(() => {
        if (!hasFocus) {
            setYaml(ObjectToYaml(props.data, props.isYamlArray))
            setError('')
            setErrorLine(-1)
        }
    }, [props.data, hasFocus, props.isYamlArray])
    const ref = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(10)
    useResizeObserver(ref, (entry) => setWidth(entry.contentRect.width + 1))

    const smallRef = useRef<HTMLDivElement>(null)
    const [textWidth, setTextWidth] = useState(10)
    useResizeObserver(smallRef, (entry) => setTextWidth(entry.contentRect.width + 48))

    const { unknownError } = useStringContext()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, maxHeight: '100%' }} ref={ref}>
            <div style={{ display: 'flex', flexGrow: 1, overflow: 'auto' }}>
                <div style={{ width: '100%' }}>
                    <pre
                        style={{
                            display: 'flex',
                            flexGrow: 1,
                            justifySelf: 'stretch',
                            alignSelf: 'stretch',
                            position: 'relative',
                            padding: 24,
                            minHeight: '100%',
                            background: 'unset',
                        }}
                        onFocus={() => setHasFocus(true)}
                        onBlur={() => setHasFocus(false)}
                    >
                        <small ref={smallRef}>
                            {yaml.split('\n').map((line, index) => {
                                const backgroundColor = index === errorLine ? '#F203' : undefined
                                if (line === '---') {
                                    return (
                                        <div key={index} style={{ color: color.divider, backgroundColor }}>
                                            {line}
                                        </div>
                                    )
                                }
                                const parts = line.split(':')
                                if (parts[0] === '') return <div key={index}>&nbsp;</div>
                                if (parts.length === 1) {
                                    return (
                                        <div key={index} style={{ color: color.variable, backgroundColor }}>
                                            {parts[0]}
                                        </div>
                                    )
                                }
                                return (
                                    <div key={index} style={{ color: color.variable, backgroundColor }}>
                                        {parts[0]}
                                        <span style={{ color: color.colon }}>:</span>
                                        <span style={{ color: color.value }}>{parts.slice(1).join(':')}</span>
                                    </div>
                                )
                            })}
                            <textarea
                                id="yaml-editor"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    height: '100%',
                                    width: Math.max(textWidth, width),
                                    padding: 24,
                                    border: 0,
                                    backgroundColor: 'transparent',
                                    whiteSpace: 'pre',
                                    overflowWrap: 'normal',
                                    overflowX: 'hidden',
                                    overflowY: 'hidden',
                                    color: 'transparent',
                                    caretColor: 'white',
                                    resize: 'none',
                                    boxShadow: 'none',
                                }}
                                value={yaml}
                                onChange={(e) => {
                                    if (!e.target.value) {
                                        setYaml('')
                                        props.setData?.(props.isYamlArray ? [] : {})
                                    } else {
                                        setYaml(e.target.value)
                                        try {
                                            const data = YamlToObject(e.target.value, props.isYamlArray)
                                            props.setData?.(data)
                                            setError('')
                                            setErrorLine(-1)
                                        } catch (err: any) {
                                            let message: string = err.message ?? unknownError
                                            const index = message.indexOf('at line')
                                            if (index !== -1) {
                                                let lineString = message.substring(index).split(' ')[2]
                                                lineString = lineString.slice(0, lineString.length - 1)
                                                const line = Number(lineString)
                                                if (Number.isInteger(line)) setErrorLine(line - 1)
                                                message = message.substring(0, index)
                                            }
                                            setError(message)
                                        }
                                    }
                                }}
                                spellCheck="false"
                            />
                        </small>
                    </pre>
                </div>
            </div>
        </div>
    )
}

export function WizardYamlEditor() {
    const data = useItem() // Wizard framework sets this context
    const { update } = useData() // Wizard framework sets this context
    const [isYamlArray] = useState(() => Array.isArray(data))
    return <YamlEditor data={data} setData={update} isYamlArray={isYamlArray} />
}

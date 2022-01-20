/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line no-use-before-define
import React, { useCallback } from 'react'
import { Button } from '@patternfly/react-core'
import { Tooltip } from 'temptifly'
import { useTranslation } from '../../../../../../lib/acm-i18next'

export default function WrappedImportBareMetalAssetsButton({ appendTable }) {
    const importCSV = useCallback(() => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.csv, .txt'
        input.onchange = (e) => {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.readAsText(file, 'UTF-8')
            reader.onload = (readerEvent) => {
                const content = readerEvent.target.result

                // parse csv
                const allTextLines = content.split(/\r\n|\n/)
                const headers = allTextLines.shift().split(',')
                if (headers.length > 3) {
                    const lines = []
                    allTextLines.forEach((line) => {
                        const data = line.split(',')
                        if (data.length === headers.length) {
                            const arr = []
                            headers.forEach((header, inx) => {
                                arr.push(`"${header.trim()}": "${data[inx].trim()}"`)
                            })
                            arr.push(`"id": "${Math.random().toString()}"`)
                            lines.push(`{${arr.join(',')}}`)
                        }
                    })

                    try {
                        const bmas = JSON.parse(`[${lines.join(',')}]`)
                        bmas.map((bma) => {
                            if (!bma.role) {
                                bma.role = 'worker'
                            }
                            return bma
                        })
                        appendTable(bmas)
                    } catch (err) {
                        // handle exception
                    }
                }
            }
        }
        input.click()
    }, [appendTable])

    const { t } = useTranslation()
    return (
        <div>
            <Button id={t('modal.import-acmbaremetalasset.button.key')} onClick={importCSV} variant="secondary">
                {t('modal.import-acmbaremetalasset.button.text')}
            </Button>
            <Tooltip control={{ tooltip: t('modal.import-acmbaremetalasset.button.tooltip') }} />
        </div>
    )
}

import React from 'react'
import PropTypes from 'prop-types'
import { Button } from '@patternfly/react-core'
import { Tooltip } from 'temptifly'

class WrappedImportBareMetalAssetsButton extends React.Component {
    static propTypes = {
        appendTable: PropTypes.func,
    }

    render() {
        const { t } = this.props
        return (
            <div>
                <Button
                    id={t('modal.import-acmbaremetalasset.button.key')}
                    onClick={this.importCSV.bind(this)}
                    variant="secondary"
                >
                    {t('modal.import-acmbaremetalasset.button.text')}
                </Button>
                <Tooltip control={{ tooltip: t('modal.import-acmbaremetalasset.button.tooltip') }} />
            </div>
        )
    }

    importCSV() {
        const { appendTable } = this.props
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
    }
}

export default WrappedImportBareMetalAssetsButton

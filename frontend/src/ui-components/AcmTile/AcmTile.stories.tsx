/* Copyright Contributors to the Open Cluster Management project */

import { Meta } from '@storybook/react'
import { useState } from 'react'
import { AcmTile } from './AcmTile'

const meta: Meta = {
    title: 'Tile',
    component: AcmTile,
    argTypes: {
        title: { type: 'string' },
        message: { type: 'string' },
    },
}
export default meta

export const Tile = () => {
    const [selected, toggleSelected] = useState<boolean>(false)

    return (
        <div>
            <AcmTile
                loading={false}
                isSelected={selected}
                title={''}
                onClick={() => toggleSelected(!selected)}
                relatedResourceData={{ count: 99999, kind: 'veryLongKindNameForTestingPurposes' }}
            />
            <AcmTile
                loading={false}
                isSelected={selected}
                title={''}
                onClick={() => toggleSelected(!selected)}
                relatedResourceData={{ count: 1, kind: 'veryShort' }}
            />
        </div>
    )
}

export const LoadingTile = () => {
    const [selected, toggleSelected] = useState<boolean>(false)

    return (
        <AcmTile
            loading={true}
            isSelected={selected}
            title={'testing'}
            onClick={() => toggleSelected(!selected)}
            relatedResourceData={{ count: 1, kind: 'veryLongKindNameForTestingPurposes' }}
        />
    )
}

/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import { AcmForm } from '../AcmForm/AcmForm'
import { AcmNumberInput } from './AcmNumberInput'

export default {
    title: 'NumberInput',
    component: AcmNumberInput,
}

export const NumberInput = () => {
    const [value, setValue] = useState<number>(0)
    const [value2, setValue2] = useState<number>(10)

    return (
        <AcmForm>
            <AcmNumberInput
                label="Number input with no min or max"
                id="normal"
                value={value}
                onChange={(event) => setValue(Number((event.target as HTMLInputElement).value))}
                onMinus={() => setValue(value - 1)}
                onPlus={() => setValue(value + 1)}
            />
            <AcmNumberInput
                label="Number input with min (0) and max (10)"
                id="minMax"
                min={0}
                max={10}
                value={value2}
                onChange={(event) => setValue2(Number((event.target as HTMLInputElement).value))}
                onMinus={() => setValue2(value2 - 1)}
                onPlus={() => setValue2(value2 + 1)}
            />
        </AcmForm>
    )
}

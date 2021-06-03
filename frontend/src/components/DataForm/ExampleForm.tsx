/* Copyright Contributors to the Open Cluster Management project */
import { useState } from 'react'
import { AcmDataFormPage } from '../AcmDataForm'
import { FormData, SelectGroup } from '../AcmFormData'

export default function ExampleForm() {
    const [textValue, setTextValue] = useState('')
    const [textAreaValue, setTextAreaValue] = useState('')
    const [secretTextValue, setSecretTextValue] = useState('')
    const [secretTextAreaValue, setSecretTextAreaValue] = useState('')
    const [numberValue, setNumberValue] = useState(0)
    const [numberText, setNumberText] = useState(0)
    const [selection, setSelection] = useState('')
    const [selections, setSelections] = useState<string[]>([])
    const [tile, setTile] = useState('')
    const [orderedItems, setOrderedItems] = useState(['One', 'Two', 'Three'])

    const options = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'].map((name) => {
        return {
            id: name,
            value: name,
        }
    })
    const groupedOptions: SelectGroup[] = [
        {
            group: 'even',
            options: options.filter((value, index) => index % 2 === 0),
        },
        {
            group: 'odd',
            options: options.filter((value, index) => index % 2 === 1),
        },
    ]

    function stateToData() {
        const data = {
            textValue,
            textAreaValue,
            secretTextValue,
            secretTextAreaValue,
            numberValue,
            numberText,
            selection,
            selections,
            tile,
            orderedItems,
        }
        return data
    }
    const formData: FormData = {
        title: 'Title',
        titleTooltip: 'Title tooltip',
        breadcrumb: [{ text: 'Title' }],
        sections: [
            {
                type: 'SectionGroup',
                title: 'Text Examples',
                sections: [
                    {
                        type: 'Section',
                        title: 'Text Input',
                        wizardTitle: 'Text input',
                        inputs: [
                            {
                                id: 'Text',
                                type: 'Text',
                                label: 'Text input',
                                placeholder: 'Enter your text',
                                value: textValue,
                                onChange: setTextValue,
                                isRequired: true,
                            },
                            {
                                id: 'SecretText',
                                type: 'Text',
                                label: 'Secret text input',
                                placeholder: 'Enter your secret text',
                                value: secretTextValue,
                                onChange: setSecretTextValue,
                                isRequired: true,
                                isSecret: true,
                            },
                        ],
                    },
                    {
                        type: 'Section',
                        title: 'Text Area Input',
                        wizardTitle: 'Text input',
                        inputs: [
                            {
                                id: 'TextArea',
                                type: 'TextArea',
                                label: 'Text area input',
                                placeholder: 'Enter your text',
                                value: textAreaValue,
                                onChange: setTextAreaValue,
                                isRequired: true,
                            },
                            {
                                id: 'SecretTextArea',
                                type: 'TextArea',
                                label: 'Secret text area input',
                                placeholder: 'Enter your secret text',
                                value: secretTextAreaValue,
                                onChange: setSecretTextAreaValue,
                                isRequired: true,
                                isSecret: true,
                            },
                        ],
                    },
                    {
                        type: 'Section',
                        title: 'Ordered String Array Input',
                        wizardTitle: 'Text input',
                        inputs: [
                            {
                                id: 'OrderedItems',
                                type: 'OrderedItems',
                                label: 'OrderedItems',
                                placeholder: 'Add a string',
                                value: orderedItems,
                                onChange: setOrderedItems,
                                isRequired: true,
                                keyFn: (item) => item,
                                cellsFn: (item) => [item],
                            },
                        ],
                    },
                ],
            },
            {
                type: 'Section',
                title: 'Number input',
                wizardTitle: 'Number input',
                description: 'Examples of different types of number input.',
                inputs: [
                    {
                        id: 'Number',
                        type: 'Number',
                        label: 'Number input',
                        placeholder: 'Enter your number',
                        value: numberValue,
                        onChange: setNumberValue,
                        isRequired: true,
                        min: 0,
                        max: 100,
                        step: 5,
                    },
                    {
                        id: 'NumberText',
                        type: 'TextNumber',
                        label: 'Number text input',
                        placeholder: 'Enter your number',
                        value: numberText,
                        onChange: setNumberText,
                        isRequired: true,
                        min: 0,
                        max: 100,
                        step: 5,
                    },
                ],
            },
            {
                type: 'Section',
                title: 'Select input',
                wizardTitle: 'Select input',
                description: 'Examples of different types of select input.',
                inputs: [
                    {
                        id: 'Select',
                        type: 'Select',
                        label: 'Select input',
                        placeholder: 'Make your selection',
                        value: selection,
                        onChange: setSelection,
                        isRequired: true,
                        options,
                    },
                    {
                        id: 'Multiselect',
                        type: 'Multiselect',
                        label: 'Multi-select variant typeahead',
                        placeholder: 'Make your selections',
                        value: selections,
                        onChange: setSelections,
                        isRequired: true,
                        options,
                    },
                    {
                        id: 'Multiselect3',
                        type: 'GroupedSelect',
                        label: 'Grouped select',
                        placeholder: 'Make your selections',
                        value: selection,
                        onChange: setSelection,
                        isRequired: true,
                        groups: groupedOptions,
                    },
                    {
                        id: 'Multiselect5',
                        type: 'GroupedMultiselect',
                        label: 'Grouped multi-select',
                        placeholder: 'Make your selections',
                        value: selections,
                        onChange: setSelections,
                        isRequired: true,
                        groups: groupedOptions,
                        variant: 'typeaheadmulti',
                    },
                ],
            },
            {
                type: 'Section',
                title: 'Tiles',
                wizardTitle: 'Number input',
                description: 'Examples of different types of number input.',
                inputs: [
                    {
                        id: 'Tiles',
                        type: 'Tiles',
                        label: 'Tiles input',
                        placeholder: 'Select your tile',
                        value: tile,
                        onChange: setTile,
                        options,
                        isRequired: true,
                    },
                ],
            },
        ],
        submit: () => {},
        submitText: 'Submit',
        submittingText: 'Submitting',
        reviewTitle: 'Review',
        reviewDescription: 'Review description',
        nextLabel: 'Next',
        backLabel: 'Back',
        cancelLabel: 'Cancel',
        cancel: () => {},
        stateToData,
    }
    return <AcmDataFormPage formData={formData} mode={'wizard'} />
}

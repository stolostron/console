import { useHistory } from 'react-router-dom'
import {
    WizKeyValue,
    WizMultiSelect,
    Radio,
    WizRadioGroup,
    Section,
    WizSelect,
    WizSingleSelect,
    Step,
    WizStringsInput,
    WizTableSelect,
    WizTextArea,
    Tile,
    WizTiles,
    WizardPage,
    WizArrayInput,
    WizCheckbox,
    WizTextInput,
    WizSwitch,
} from '../../src'
import { onCancel, onSubmit } from '../common/utils'

export function InputsWizard() {
    const history = useHistory()
    return (
        <WizardPage title="Inputs" onSubmit={onSubmit} onCancel={() => onCancel(history)}>
            <Step label="Text Input" id="text-input">
                <Section label="Text Input">
                    <WizTextInput label="Text input" path="textInput.text" />
                    <WizTextInput label="Text input required" path="textInput.required" required />
                    <WizTextInput label="Text input secret" path="textInput.secret" secret />
                </Section>
            </Step>

            <Step label="Text Area" id="text-area">
                <Section label="Text Area">
                    <WizTextArea label="Text area" path="textArea.text" />
                    <WizTextArea label="Text area required" path="textArea.required" required />
                    <WizTextArea label="Text area secret" path="textArea.secret" secret />
                </Section>
            </Step>

            <Step label="Select" id="select">
                <Section label="Select">
                    <WizSelect label="Select" path="select.value" options={['Option 1', 'Option 2']} />
                    <WizSelect label="Select required" path="select.required" options={['Option 1', 'Option 2']} required />
                    <WizSelect
                        label="Select with prompt"
                        path="select.value"
                        options={['Option 1', 'Option 2']}
                        prompt={{ label: 'See selection', href: '/?route=inputs' }}
                        required
                    />
                </Section>
                <Section label="MultiSelect">
                    <WizMultiSelect label="MultiSelect" path="multiSelect.value" isCreatable options={['Option 1', 'Option 2']} />
                </Section>
                <Section label="SingleSelect">
                    <WizSingleSelect
                        label="SingleSelect"
                        path="singleSelect.value"
                        isCreatable
                        options={['Option 1', 'Option 2']}
                        helperText="isCreatable"
                    />
                </Section>
                <Section label="SingleSelect with prompt">
                    <WizSingleSelect
                        label="SingleSelect"
                        path="singleSelect.value"
                        options={['Option 1', 'Option 2']}
                        helperText="isCreatable"
                        prompt={{ label: 'See selection', href: '/?route=inputs' }}
                    />
                </Section>
            </Step>

            <Step label="Tiles" id="tiles">
                <Section label="Tiles">
                    <WizTiles id="tiles" path="tile" label="Tiles">
                        <Tile id="tile1" value="tile1" label="Tile 1" />
                        <Tile id="tile2" value="tile2" label="Tile 2" />
                        <Tile id="tile3" value="tile3" label="Tile 3" />
                    </WizTiles>
                </Section>
            </Step>

            <Step label="Radio" id="radio-step">
                <Section label="Radio">
                    <WizRadioGroup id="group-1" path="radios.group1.value" label="Radio">
                        <Radio id="radio-1" label="Radio 1" value="radio-1" />
                        <Radio id="radio-2" label="Radio 2" value="radio-2" />
                        <Radio id="radio-3" label="Undefined" value={undefined} />
                    </WizRadioGroup>
                    <WizRadioGroup id="group-2" path="radios.group2.value" label="Radio with sub-inputs">
                        <Radio id="radio-1" label="Radio 1" value="radio-1">
                            <WizTextInput label="Name" path="radios.group2.name" required />
                        </Radio>
                        <Radio id="radio-2" label="Radio 2" value="radio-2">
                            <WizTextInput label="Name" path="radios.group2.name" required />
                        </Radio>
                    </WizRadioGroup>
                    <WizRadioGroup
                        id="group-3"
                        path="radios.group3.value"
                        label="Radio with descriptions"
                        helperText="Description goes here."
                    >
                        <Radio id="radio-1" label="Radio 1" value="radio-1" description="Radio 1 description" />
                        <Radio id="radio-2" label="Radio 2" value="radio-2" description="Radio 2 description" />
                    </WizRadioGroup>
                    <WizRadioGroup
                        id="group-4"
                        path="radios.group4.value"
                        label="Radio with descriptions and sub-inputs"
                        helperText="Description goes here."
                    >
                        <Radio id="radio-1" label="Radio 1" value="radio-1" description="Radio 1 description">
                            <WizTextInput label="Name" path="radios.group4.name" required />
                        </Radio>
                        <Radio id="radio-2" label="Radio 2" value="radio-2" description="Radio 2 description">
                            <WizTextInput label="Name" path="radios.group4.name" required />
                        </Radio>
                    </WizRadioGroup>
                    <WizRadioGroup id="group-5" path="radios.group5.value" label="Radio (Required)" required>
                        <Radio id="radio-1" label="Radio 1" value="radio-1" />
                        <Radio id="radio-2" label="Radio 2" value="radio-2" />
                    </WizRadioGroup>
                </Section>
            </Step>

            <Step label="Switch" id="switch-step">
                <Section label="Switch">
                    <WizSwitch id="switch-1" label="Switch" path="switch.switch1.value" />
                    <WizSwitch id="switch-2" label="Switch with label help" path="switch.switch2.value" labelHelp="Switch help" />
                    <WizSwitch
                        id="switch-3"
                        label="Switch with label help and description"
                        path="switch.switch3.value"
                        labelHelp="Switch hel["
                        helperText="Switch description"
                    />
                </Section>
            </Step>

            <Step label="Checkbox" id="checkbox-step">
                <Section label="Checkbox">
                    <WizCheckbox label="Checkbox" path="checkboxes.checkbox1.value" id="checkbox-1" />
                    <WizCheckbox label="Checkbox with inputs" path="checkboxes.checkbox2.value" id="checkbox-2">
                        <WizTextInput label="Text input" path="checkboxes.checkbox2.textInput" required id="checkbox-2-text" />
                    </WizCheckbox>
                    <WizCheckbox
                        label="Checkbox with description"
                        helperText="Description goes here."
                        path="checkboxes.checkbox3.value"
                        id="checkbox-3"
                    />
                    <WizCheckbox
                        label="Checkbox with both"
                        path="checkboxes.checkbox4.value"
                        helperText="Description goes here."
                        id="checkbox-4"
                    >
                        <WizTextInput label="Text input" path="checkboxes.checkbox4.textInput" required />
                    </WizCheckbox>
                </Section>
            </Step>

            <Step label="Key Value" id="key-value">
                <Section label="Key Value">
                    <WizKeyValue id="key-values" path="key-values" label="Key Value" />
                </Section>
            </Step>

            <Step label="Strings Input" id="strings-input">
                <Section label="Strings Input">
                    <WizStringsInput id="string" path="strings" label="Strings" />
                </Section>
            </Step>

            <Step label="Array Input" id="array-input">
                <Section label="Array Input">
                    <WizArrayInput
                        id="resources"
                        label="Resources"
                        path="resources"
                        placeholder="Add resource"
                        collapsedContent="metadata.name"
                        sortable
                    >
                        <WizTextInput label="Name" path="metadata.name" required />
                        <WizSelect label="Namespace" path="metadata.namespace" required options={['namespace-1', 'namespace-2']} />
                        <WizKeyValue id="labels" path="metadata.labels" label="Labels" />
                        <WizKeyValue id="labels" path="metadata.annotations" label="Annotations" />
                    </WizArrayInput>
                </Section>
            </Step>

            <Step label="Table Select" id="table-select">
                <Section label="Table Select" description="Table select is used when many selections can be made from many options.">
                    <WizTableSelect
                        id="string"
                        path="tableSelect"
                        label="Strings"
                        columns={[{ name: 'Name', cellFn: (item: { name: string }) => item.name }]}
                        items={new Array(100).fill(0).map((_, i) => ({ name: `Item ${i + 1}` }))}
                        itemToValue={(item: unknown) => (item as any).name}
                        valueMatchesItem={(value: unknown, item: { name: string }) => value === item.name}
                        emptyTitle="Nothing available for selection."
                        emptyMessage="Nothing available for selection."
                    />
                </Section>
            </Step>

            <Step label="Section" id="section-step">
                <Section label="Section 1 with description" description="Description goes here">
                    <WizTextInput label="Text 1" path="section1.text1" id="text-1" required />
                    <WizTextInput label="Text 2" path="section1.text2" id="text-2" />
                </Section>
                <Section label="Section 2 (Collapsable)" collapsable>
                    <WizTextInput label="Text 3" path="section2.text3" id="text-3" required />
                    <WizTextInput label="Text 4" path="section2.text4" id="text-4" />
                </Section>
                <Section label="Hide Settings">
                    <WizCheckbox label="Hide section" path="hideSection" id="hide-section" />
                </Section>
                <Section
                    label="Section 3 (Hideable)"
                    description="This section is hidden using a function to determine if it should be hidden."
                    hidden={(item) => item.hideSection}
                >
                    <WizTextInput label="Text input" path="hideableSection.text" required />
                </Section>
            </Step>

            <Step label="Hidden" id="hidden-step">
                <Section label="Hide Settings" description="This sets a flag which inputs are using to hide themselves.">
                    <WizCheckbox label="Show hidden" path="showHidden" id="show-hidden" />
                </Section>

                <Section label="Automatically hidden" description="A section will automatically hide itelf if all child inputs are hidden.">
                    <WizTextInput label="Text input hidden" path="hidden.textInput" hidden={(item) => !item.showHidden} required />
                    <WizTextArea label="Text area hidden" path="hidden.textArea" hidden={(item) => !item.showHidden} required />
                    <WizSelect
                        label="Select hidden"
                        path="hidden.select"
                        options={['Option 1', 'Option 2']}
                        required
                        hidden={(item) => !item.showHidden}
                    />
                    <WizRadioGroup
                        id="group-hidden"
                        path="hidden.radio"
                        label="Radio (Required)"
                        required
                        hidden={(item) => !item.showHidden}
                    >
                        <Radio id="radio-1" label="Radio 1" value="radio-1" />
                        <Radio id="radio-2" label="Radio 2" value="radio-2" />
                    </WizRadioGroup>
                    <WizCheckbox label="Checkbox conditionally hidden" path="hidden.checkbox" hidden={(item) => !item.showHidden} />
                </Section>
            </Step>
        </WizardPage>
    )
}

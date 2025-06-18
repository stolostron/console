import {
    CodeBlock,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    List,
    ListItem,
} from '@patternfly/react-core'
import { useHistory } from 'react-router-dom'
import { Section, Step, WizardPage } from '../../src'
import { Indented } from '../../src/components/Indented'

export function HomeWizard() {
    const history = useHistory()
    return (
        <WizardPage
            title="Welcome"
            onSubmit={() => Promise.resolve(undefined)}
            onCancel={() => history.push('.')}
            yaml={false}
            hasButtons={false}
        >
            <Step label="Introduction" id="introduction">
                <Section
                    label="Welcome to the React Form Wizard by PatternFly Labs"
                    description="A framework for building wizards using PatternFly."
                    autohide={false}
                ></Section>

                <Section
                    label="React Example"
                    description="Wizards contain steps which contain sections which contain inputs."
                    autohide={false}
                >
                    <CodeBlock>
                        <pre style={{ fontSize: 'medium' }}>
                            <div>{`<WizardPage title="My Wizard">`}</div>
                            <div>{`    <Step label="Details" id="details-step">`}</div>
                            <div>{`        <Section label="Details">`}</div>
                            <div>{`            <TextInput label="Name" path="name" required />`}</div>
                            <div>{`            <Select label="Namespace" path="namespace" options={['default', 'namespace-1']} />`}</div>
                            <div>{`        </Section>`}</div>
                            <div>{`    </Step>`}</div>
                            <div>{`</WizardPage>`}</div>
                        </pre>
                    </CodeBlock>
                </Section>
            </Step>

            <Step label="Steps" id="steps">
                <Section label="Steps" autohide={false}>
                    <List>
                        <ListItem>A step is automatically hidden if all the sections and inputs in the step are hidden.</ListItem>
                    </List>
                </Section>
            </Step>

            <Step label="Sections" id="sections">
                <Section label="Sections" autohide={false}>
                    <List>
                        <ListItem>A section must have a unique ID.</ListItem>
                        <ListItem>A section is automatically hidden if all the inputs in the section are hidden.</ListItem>
                        <ListItem>
                            In the review step of the wizard, a section is hidden if there are no inputs with value in the section.
                        </ListItem>
                        <ListItem>
                            A section also has a hidden function that can be used to hide the section and all the sections inputs.
                        </ListItem>
                    </List>
                </Section>
            </Step>

            <Step label="Inputs" id="inputs">
                <Section
                    label="Inputs"
                    description="The wizard works by setting an item context which inputs use as a data source.
Inputs have a path prop that is used to get value or set value in the item contex."
                    autohide={false}
                ></Section>
                <Section label="Input common properties" autohide={false}>
                    <Indented>
                        <DescriptionList isHorizontal isCompact>
                            <DescriptionListGroup>
                                <DescriptionListTerm>label</DescriptionListTerm>
                                <DescriptionListDescription>The label for the input.</DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>path</DescriptionListTerm>
                                <DescriptionListDescription>
                                    The <a href="https://github.com/jonschlinkert/set-value#object-paths">path</a> the input is getting and
                                    setting value to, in the current item context.
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>id</DescriptionListTerm>
                                <DescriptionListDescription>
                                    Optional id of the input control. Used for testing. If not set, defaults to a sanitized version of the
                                    path.
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>validation</DescriptionListTerm>
                                <DescriptionListDescription>
                                    Optional validation function that takes in the current item context and input value. It should return an
                                    error string if there is an error.
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                                <DescriptionListTerm>hidden</DescriptionListTerm>
                                <DescriptionListDescription>
                                    Optional hidden function that takes in the current item context and returns true if the input should be
                                    hidden.
                                </DescriptionListDescription>
                            </DescriptionListGroup>
                        </DescriptionList>
                    </Indented>
                </Section>
            </Step>
        </WizardPage>
    )
}

/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody } from '@patternfly/react-core'
import { AcmProgressTracker, ProgressTrackerStep } from '@open-cluster-management/ui-components'

export function ProgressStepBar(props: {
    title: string
    subtitle: string
    isCentered: boolean
    steps: ProgressTrackerStep[]
}) {
    const { title, subtitle, isCentered, steps } = props
    return (
        <div style={{ marginBottom: '24px' }}>
            <Card>
                <CardBody>
                    <AcmProgressTracker
                        Title={title}
                        Subtitle={subtitle}
                        isStacked={false}
                        steps={steps}
                        isCentered={isCentered}
                    ></AcmProgressTracker>
                </CardBody>
            </Card>
        </div>
    )
}

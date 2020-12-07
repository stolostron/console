import { render, waitFor } from '@testing-library/react'
import { IResource } from '../resources/resource'
import { EditLabelsModal } from './EditLabelsModal'

describe('edit labels modal', () => {
    test('should render the table with cluster details', async () => {
        const resource: IResource = {
            apiVersion: 'APIVERSION',
            kind: 'KIND',
            metadata: {
                labels: { abc: '123' },
            },
        }
        const { getByText } = render(<EditLabelsModal resource={resource} close={() => {}} />)
        await waitFor(() => expect(getByText('edit.labels.title')).toBeInTheDocument())
        await waitFor(() => expect(getByText('abc=123')).toBeInTheDocument())
    })
})

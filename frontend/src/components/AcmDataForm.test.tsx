/* Copyright Contributors to the Open Cluster Management project */
import i18next from 'i18next'
const t = i18next.t.bind(i18next)
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => i18next.t(key),
    }),
}))
import { generalValidationMessage, requiredValidationMessage } from './AcmDataForm'

describe('ACMDataForm', () => {
    describe('generalValidationMessage', () => {
        test('generalValidationMessage should render the expected string', () => {
            expect(generalValidationMessage(t)).toEqual('You must fix the issues with fields before you can proceed.')
        })
    })

    describe('requiredValidationMessage', () => {
        test('requiredValidationMessage should render the expected string', () => {
            expect(requiredValidationMessage(t)).toEqual(
                'You must fill out all required fields before you can proceed.'
            )
        })
    })
})

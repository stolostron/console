// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect"
import { configure } from '@testing-library/dom'

configure({
    testIdAttribute: 'id',
})

jest.mock('react-i18next', () => ({
    useTranslation: () => ({t: key => key})
}))
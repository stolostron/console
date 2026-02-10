/* Copyright Contributors to the Open Cluster Management project */
import {
  getIsChangingSubjectForKindChange,
  getIsChangingSubjectForUserChange,
  getIsChangingSubjectForGroupChange,
} from './isChangingSubject'
import {
  isChangingSubjectKindCases,
  isChangingSubjectUserCases,
  isChangingSubjectGroupCases,
} from './isChangingSubject.fixtures'

describe('isChangingSubject helpers', () => {
  describe('getIsChangingSubjectForKindChange', () => {
    it.each(isChangingSubjectKindCases)(
      '$description',
      ({ preselected, newKind, expected }) => {
        expect(getIsChangingSubjectForKindChange(preselected, newKind)).toBe(expected)
      }
    )
  })

  describe('getIsChangingSubjectForUserChange', () => {
    it.each(isChangingSubjectUserCases)(
      '$description',
      ({ preselected, users, expected }) => {
        expect(getIsChangingSubjectForUserChange(preselected, users)).toBe(expected)
      }
    )
  })

  describe('getIsChangingSubjectForGroupChange', () => {
    it.each(isChangingSubjectGroupCases)(
      '$description',
      ({ preselected, groups, expected }) => {
        expect(getIsChangingSubjectForGroupChange(preselected, groups)).toBe(expected)
      }
    )
  })
})

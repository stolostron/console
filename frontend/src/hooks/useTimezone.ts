/* Copyright Contributors to the Open Cluster Management project */

/**
 * Custom hook that provides timezone information using the native Intl API
 *
 * @returns {Object} An object containing timezone information
 * @property {string} localTimezone - The local timezone of the user's system
 * @property {string[]} timeZones - Array of all available IANA timezone names, with local timezone first
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { localTimezone, timeZones } = useTimezones()
 *   return (
 *     <Select>
 *       {timeZones.map(tz => (
 *         <SelectOption key={tz} value={tz}>{tz}</SelectOption>
 *       ))}
 *     </Select>
 *   )
 * }
 * ```
 */

export function useTimezones() {
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timeZones = localTimezone
    ? [localTimezone, ...Intl.supportedValuesOf('timeZone').filter((tz) => tz !== localTimezone)]
    : Intl.supportedValuesOf('timeZone')

  return { localTimezone, timeZones }
}

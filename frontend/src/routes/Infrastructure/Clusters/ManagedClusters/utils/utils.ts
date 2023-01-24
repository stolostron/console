/* Copyright Contributors to the Open Cluster Management project */

export const onToggle = (acmCardID: string, open: boolean, setOpen: (open: boolean) => void) => {
  setOpen(!open)
  if (localStorage.getItem(acmCardID) === 'show') {
    localStorage.setItem(acmCardID, 'hide')
  } else {
    localStorage.setItem(acmCardID, 'show')
  }
}

/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'

/**
 * Custom hook for calculating and managing YAML editor height with responsive resizing
 * Handles global notification headers and window resize events
 */
export function useYamlEditorHeight() {
  const [editorHeight, setEditorHeight] = useState<number>(500)

  useEffect(() => {
    function handleResize() {
      const editorHeight = window.innerHeight - 260
      const globalHeader = document.getElementsByClassName('co-global-notification')
      setEditorHeight(globalHeader.length ? editorHeight - globalHeader.length * 33 : editorHeight)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return editorHeight
}

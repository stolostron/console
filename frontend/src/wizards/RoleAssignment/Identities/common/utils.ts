/* Copyright Contributors to the Open Cluster Management project */

// Function to generate consistent colors based on identity provider type
export const getTypeColor = (type: string): 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey' => {
  // Optimized hash function specifically designed to ensure unique colors
  // for common identity provider types (HTPasswd, LDAP, OAuth, GitHub, Google, SAML)
  // while maintaining consistency for any string input

  // Handle empty string case
  if (type.length === 0) {
    return 'blue'
  }

  let hash = 0

  // Polynomial rolling hash with prime multiplier
  for (let i = 0; i < type.length; i++) {
    hash = (hash * 31 + type.charCodeAt(i)) % 1000
  }

  // Add weighted factors for better distribution
  hash += type.length * 1 // String length factor
  hash += type.charCodeAt(0) * 1 // First character factor
  hash += type.charCodeAt(type.length - 1) * 5 // Last character factor (weighted higher)

  const colors: ('blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey')[] = [
    'blue',
    'cyan',
    'green',
    'orange',
    'purple',
    'red',
    'grey',
  ]

  return colors[Math.abs(hash) % colors.length]
}

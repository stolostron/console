/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'

export interface SVGIconProps extends Omit<React.HTMLProps<SVGElement>, 'ref'> {
  title?: string
  className?: string
}

export default function TerraformLogo(props: SVGIconProps) {
  return (
    <svg
      width="1.75em"
      height="1.5em"
      viewBox="20, 15, 50, 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#000000"
      strokeWidth="0.00064"
      {...(props as Omit<React.SVGProps<SVGElement>, 'ref'>)}
    >
      <g id="SVGRepo_iconCarrier">
        <path d="M38.06 26.151v11.473L48 31.891V20.406l-9.94 5.745z" fill="#0066cc" />
        <path
          d="m27.03 20.406 9.94 5.745v11.473l-9.94-5.74V20.407zM16 14v11.479l9.94 5.74v-11.48L16 14zm11.03 30.624 9.94 5.74v-11.48l-9.94-5.739v11.48z"
          fill="#0066cc"
        />
      </g>
    </svg>
  )
}

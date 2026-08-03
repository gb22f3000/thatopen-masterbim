import * as React from 'react'
import { useEffect, useRef } from 'react'

interface Props {
  onChange: (value: string) => void
}

export function SearchBox(props: Props) {
  const inputRef = useRef<any>(null)

  useEffect(() => {
    const el = inputRef.current as HTMLElement & { value?: string } | null
    if (!el) return
    const handler = () => {
      props.onChange((el as any).value ?? '')
    }
    el.addEventListener('input', handler)
    return () => el.removeEventListener('input', handler)
  }, [props.onChange])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        columnGap: 10,
        width: '40%',
      }}
    >
      <bim-text-input
        ref={inputRef}
        id="search-input"
        placeholder="Search projects"
        style={{ width: '100%' }}
      ></bim-text-input>
    </div>
  )
}

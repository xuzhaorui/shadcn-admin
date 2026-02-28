import { useMemo } from 'react'
import { useApiMode } from '@/lib/api-mode'

export function ApiModeSwitcher() {
  const mode = useApiMode()

  const helperText = useMemo(() => {
    return mode === 'api' ? '当前使用后端 API（api -> http://127.0.0.1:8081）。' : '当前使用后端 API。'
  }, [mode])

  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-3'>
        <h3 className='text-sm font-semibold'>数据模式</h3>
        <p className='text-xs text-muted-foreground'>{helperText}</p>
      </div>

      <div className='rounded-md border p-3 text-sm'>Backend API</div>
    </div>
  )
}

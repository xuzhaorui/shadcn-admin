import { Download, RefreshCw, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/use-permission'
import { USER_PERMISSIONS } from '../constants/permissions'
import { useUsers } from './users-provider'

type UsersPrimaryButtonsProps = {
  onRefresh: () => void
  onExport: () => void
  isExporting?: boolean
}

export function UsersPrimaryButtons({
  onRefresh,
  onExport,
  isExporting = false,
}: UsersPrimaryButtonsProps) {
  const { setOpen } = useUsers()
  const { can } = usePermission()
  const canCreate = can(USER_PERMISSIONS.CREATE)
  const canExport = can(USER_PERMISSIONS.EXPORT)

  return (
    <div className='flex gap-2'>
      {canExport ? (
        <Button variant='outline' className='space-x-1' onClick={onExport} disabled={isExporting}>
          <span>{isExporting ? '导出中...' : '导出用户'}</span> <Download size={18} />
        </Button>
      ) : null}
      <Button variant='outline' className='space-x-1' onClick={onRefresh}>
        <span>刷新</span> <RefreshCw size={18} />
      </Button>
      {canCreate ? (
        <Button className='space-x-1' onClick={() => setOpen('add')}>
          <span>新增用户</span> <UserPlus size={18} />
        </Button>
      ) : null}
    </div>
  )
}

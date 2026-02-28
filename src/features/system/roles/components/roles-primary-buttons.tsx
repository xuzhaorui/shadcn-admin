import { Plus, Trash2, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/use-permission'
import { useRoles } from './roles-provider'

interface RolesPrimaryButtonsProps {
    selectedCount?: number
    onBatchDelete?: () => void
    onExport?: () => void
    onRefresh?: () => void
    isExporting?: boolean
}

export function RolesPrimaryButtons({
    selectedCount = 0,
    onBatchDelete,
    onExport,
    onRefresh,
    isExporting = false,
}: RolesPrimaryButtonsProps) {
    const { setOpen } = useRoles()
    const { can } = usePermission()
    const canCreate = can('system:roles:create')
    const canDelete = can('system:roles:delete')
    const canExport = can('system:roles:export')

    return (
        <div className='flex gap-2'>
            {canCreate ? (
                <Button onClick={() => setOpen('add')}>
                    <Plus className='mr-2 h-4 w-4' />
                    新增角色
                </Button>
            ) : null}
            {canDelete && selectedCount > 0 ? (
                <Button variant='destructive' onClick={onBatchDelete}>
                    <Trash2 className='mr-2 h-4 w-4' />
                    批量删除 ({selectedCount})
                </Button>
            ) : null}
            {canExport ? (
                <Button variant='outline' onClick={onExport} disabled={isExporting}>
                    <Download className='mr-2 h-4 w-4' />
                    {isExporting ? '导出中...' : '导出'}
                </Button>
            ) : null}
            <Button variant='outline' size='icon' onClick={onRefresh}>
                <RefreshCw className='h-4 w-4' />
            </Button>
        </div>
    )
}

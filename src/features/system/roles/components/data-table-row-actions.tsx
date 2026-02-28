import { MoreHorizontal, Pencil, Shield, Trash2, Database, Users } from 'lucide-react'
import type { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePermission } from '@/hooks/use-permission'
import { type Role } from '../data/schema'
import { useRoles } from './roles-provider'

interface DataTableRowActionsProps {
    row: Row<Role>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
    const { setOpen, setCurrentRow } = useRoles()
    const { can } = usePermission()
    const role = row.original
    const isSystemRole = role.code === 'admin'
    const canEdit = can('system:roles:edit')
    const canAssignPerms = can('system:roles:assign-perms')
    const canAssignDataScope = can('system:roles:assign-data-scope')
    const canAssignUsers = can('system:roles:assign-users')
    const canDelete = can('system:roles:delete')
    const hasAnyAction = canEdit || canAssignPerms || canAssignDataScope || canAssignUsers || canDelete

    if (isSystemRole || !hasAnyAction) return null

    const handleEdit = () => {
        setCurrentRow(role)
        setOpen('edit')
    }

    const handlePermission = () => {
        setCurrentRow(role)
        setOpen('permission')
    }

    const handleDataScope = () => {
        setCurrentRow(role)
        setOpen('dataScope')
    }

    const handleAssignUsers = () => {
        setCurrentRow(role)
        setOpen('assignUsers')
    }

    const handleDelete = () => {
        setCurrentRow(role)
        setOpen('delete')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant='ghost'
                    className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
                >
                    <MoreHorizontal className='h-4 w-4' />
                    <span className='sr-only'>打开菜单</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-[160px]'>
                {canEdit ? (
                    <DropdownMenuItem onClick={handleEdit}>
                        <Pencil className='mr-2 h-4 w-4' />
                        编辑
                    </DropdownMenuItem>
                ) : null}
                {canAssignPerms ? (
                    <DropdownMenuItem onClick={handlePermission}>
                        <Shield className='mr-2 h-4 w-4' />
                        菜单权限
                    </DropdownMenuItem>
                ) : null}
                {canAssignDataScope ? (
                    <DropdownMenuItem onClick={handleDataScope}>
                        <Database className='mr-2 h-4 w-4' />
                        数据权限
                    </DropdownMenuItem>
                ) : null}
                {canAssignUsers ? (
                    <DropdownMenuItem onClick={handleAssignUsers}>
                        <Users className='mr-2 h-4 w-4' />
                        分配用户
                    </DropdownMenuItem>
                ) : null}
                {canDelete ? <DropdownMenuSeparator /> : null}
                {canDelete ? (
                    <DropdownMenuItem onClick={handleDelete} className='text-destructive'>
                        <Trash2 className='mr-2 h-4 w-4' />
                        删除
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

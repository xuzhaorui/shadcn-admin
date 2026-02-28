import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { DepartmentTreeSelect } from '@/components/department-tree-select'
import { useRoles } from './roles-provider'
import { useAssignDataScope } from '../hooks/usePermissionTree'
import { dataScopeOptions } from '../data/data'
import { type DataScope } from '../data/schema'

export function DataScopeModal() {
    const { open, setOpen, currentRow } = useRoles()
    const assignMutation = useAssignDataScope()

    const [dataScopeDraft, setDataScopeDraft] = useState<DataScope | null>(null)
    const [customDeptIdsDraft, setCustomDeptIdsDraft] = useState<string[] | null>(null)

    const isOpen = open === 'dataScope'

    const dataScope = dataScopeDraft ?? currentRow?.dataScope ?? 'all'
    const customDeptIds = customDeptIdsDraft ?? currentRow?.customDeptIds ?? []

    const handleClose = () => {
        setDataScopeDraft(null)
        setCustomDeptIdsDraft(null)
        setOpen(null)
    }

    const handleSubmit = () => {
        if (!currentRow) return
        if (dataScope === 'custom' && customDeptIds.length === 0) {
            toast.error('自定义数据权限必须选择至少一个部门')
            return
        }

        assignMutation.mutate(
            {
                roleId: currentRow.id,
                params: {
                    dataScope,
                    customDeptIds: dataScope === 'custom' ? customDeptIds : undefined,
                },
            },
            {
                onSuccess: () => {
                    handleClose()
                },
            }
        )
    }

    const showDeptSelector = dataScope === 'custom'

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className='sm:max-w-[500px]'>
                <DialogHeader>
                    <DialogTitle>数据权限设置</DialogTitle>
                    <DialogDescription>
                        为角色 "{currentRow?.name}" 设置数据访问范围
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-4'>
                    <RadioGroup
                        value={dataScope}
                        onValueChange={(v) => setDataScopeDraft(v as DataScope)}
                    >
                        {dataScopeOptions.map((option) => (
                            <div key={option.value} className='flex items-center space-x-2'>
                                <RadioGroupItem value={option.value} id={`scope-${option.value}`} />
                                <Label
                                    htmlFor={`scope-${option.value}`}
                                    className='font-normal cursor-pointer'
                                >
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>

                    {showDeptSelector && (
                        <div className='space-y-2 rounded-md border p-4'>
                            <DepartmentTreeSelect
                                multiple
                                value={customDeptIds}
                                onValueChange={(value) =>
                                    setCustomDeptIdsDraft(
                                        Array.isArray(value) ? value : value ? [value] : []
                                    )
                                }
                                placeholder='选择可访问部门'
                            />
                            <p className='text-muted-foreground text-xs'>
                                当前选中: {customDeptIds.length} 个部门
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={handleClose}
                        disabled={assignMutation.isPending}
                    >
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={assignMutation.isPending}>
                        {assignMutation.isPending ? '保存中...' : '保存'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

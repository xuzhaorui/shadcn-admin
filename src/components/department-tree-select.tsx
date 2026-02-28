'use client'

import { TreeSelect } from '@/components/tree-select'
import { useDeptTree } from '@/features/system/depts/hooks/useDeptTree'

interface DepartmentTreeSelectProps {
    value?: string | string[]
    onValueChange?: (value: string | string[]) => void
    placeholder?: string
    className?: string
    multiple?: boolean
}

export function DepartmentTreeSelect({
    value,
    onValueChange,
    placeholder = '选择部门',
    className,
    multiple = false,
}: DepartmentTreeSelectProps) {
    const { data: depts = [] } = useDeptTree()

    return (
        <TreeSelect
            data={depts}
            value={value}
            onChange={onValueChange}
            multiple={multiple}
            placeholder={placeholder}
            className={className}
            searchPlaceholder='搜索部门...'
            emptyText='未找到部门。'
        />
    )
}

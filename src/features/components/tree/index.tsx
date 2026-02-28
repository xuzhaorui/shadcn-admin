import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TreeSelect } from '@/components/tree-select'
import { TreeDataTable } from '@/components/tree-data-table'
import { type ColumnDef } from '@tanstack/react-table'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { arrayMove } from '@dnd-kit/sortable'

type TreeNode = {
    id: string
    name: string
    children?: TreeNode[]
}

// Mock Data
const initialTreeData: TreeNode[] = [
    {
        id: '1',
        name: 'Electronics',
        children: [
            {
                id: '1-1',
                name: 'Computers',
                children: [
                    { id: '1-1-1', name: 'Laptops' },
                    { id: '1-1-2', name: 'Desktops' },
                ],
            },
            {
                id: '1-2',
                name: 'Phones',
                children: [
                    { id: '1-2-1', name: 'Smartphones' },
                    { id: '1-2-2', name: 'Tablets' },
                ],
            },
        ],
    },
    {
        id: '2',
        name: 'Clothing',
        children: [
            { id: '2-1', name: 'Men' },
            { id: '2-2', name: 'Women' },
        ],
    },
]

const columns: ColumnDef<TreeNode>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
            <div
                className='flex items-center gap-2'
                style={{ paddingLeft: `${row.depth * 2}rem` }}
            >
                {row.getCanExpand() && (
                    <button
                        onClick={row.getToggleExpandedHandler()}
                        className='cursor-pointer'
                    >
                        {row.getIsExpanded() ? (
                            <ChevronDown className='h-4 w-4' />
                        ) : (
                            <ChevronRight className='h-4 w-4' />
                        )}
                    </button>
                )}
                {!row.getCanExpand() && <span className='w-4' />}
                <span>{row.original.name}</span>
            </div>
        ),
    },
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        id: 'drag-handle',
        header: 'Move',
        enableHiding: false,
        cell: () => null,
    },
]

export function TreeDemo() {
    const [val1, setVal1] = useState('')
    const [val2, setVal2] = useState<string[]>([])
    const [data, setData] = useState(initialTreeData)

    const handleReorder = ({
        activeId,
        overId,
    }: {
        activeId: string
        overId: string
    }) => {
        setData((prev) => {
            // Helper to clone and update tree
            const newData = JSON.parse(JSON.stringify(prev))

            // Better Finder: returns { parent: any | null, children: any[] }
            const findContainer = (
                items: TreeNode[],
                parent: TreeNode | null = null
            ): { parent: TreeNode | null; children: TreeNode[] } | undefined => {
                if (items.some(i => i.id === activeId)) {
                    return { parent, children: items }
                }
                for (const item of items) {
                    if (item.children) {
                        const found = findContainer(item.children, item)
                        if (found) return found
                    }
                }
                return undefined
            }

            const activeContainer = findContainer(newData)
            if (!activeContainer) return prev; // Should not happen

            const { children: activeChildren, parent: activeParent } = activeContainer

            const overIndex = activeChildren.findIndex(i => i.id === overId)

            if (overIndex !== -1) {
                // Both in same container
                const activeIndex = activeChildren.findIndex(i => i.id === activeId)
                const newChildren = arrayMove(activeChildren, activeIndex, overIndex)

                if (activeParent) {
                    activeParent.children = newChildren
                } else {
                    return newChildren // Root
                }
                return newData
            }

            return prev
        })
    }

    return (
        <>
            <Header fixed>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
                <div className='flex flex-wrap items-end justify-between gap-2'>
                    <div>
                        <h2 className='text-2xl font-bold tracking-tight'>树组件演示</h2>
                        <p className='text-muted-foreground'>
                            展示 TreeSelect 和 TreeDataTable 组件
                        </p>
                    </div>
                </div>

                <div className='grid gap-6 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle>树形下拉框 (单选)</CardTitle>
                            <CardDescription>TreeSelect - Single Selection</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TreeSelect
                                data={data}
                                value={val1}
                                onChange={(v) => setVal1(v as string)}
                                placeholder='选择分类...'
                            />
                            <div className='mt-4 text-sm text-muted-foreground'>
                                Selected ID: {val1 || 'None'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>树形下拉框 (多选)</CardTitle>
                            <CardDescription>TreeSelect - Multi Selection</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TreeSelect
                                data={data}
                                value={val2}
                                onChange={(v) => setVal2(v as string[])}
                                multiple
                                placeholder='选择分类...'
                            />
                            <div className='mt-4 text-sm text-muted-foreground'>
                                Selected IDs: {val2.join(', ') || 'None'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>树形表格</CardTitle>
                        <CardDescription>TreeDataTable with Drag and Drop</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='overflow-hidden rounded-md border'>
                            <TreeDataTable
                                data={data}
                                columns={columns}
                                getRowCanExpand={(row) => !!row.original.children?.length}
                                getRowId={(row) => row.id}
                                onReorder={handleReorder}
                            />
                        </div>
                    </CardContent>
                </Card>
            </Main>
        </>
    )
}

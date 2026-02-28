import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { type ExpandedState, type Row } from '@tanstack/react-table'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TreeDataTable } from '@/components/tree-data-table'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/use-permission'
import { deptApi } from './api/dept-api'
import { DeptDrawer } from './components/DeptDrawer'
import { columns } from './components/depts-columns'
import { DeptSelectionToolbar } from './components/dept-selection-toolbar'
import { DeptRowActions } from './components/dept-row-actions'
import { type Dept, type DeptFormData } from './data/schema'
import { useCreateDept, useUpdateDept } from './hooks/useDeptMutations'
import { useDeptReorder } from './hooks/useDeptReorder'
import { useDeptTree } from './hooks/useDeptTree'

export function Depts() {
  const { can } = usePermission()
  const canCreate = can('system:departments:create')
  const canEdit = can('system:departments:edit')
  const canDelete = can('system:departments:delete')
  const queryClient = useQueryClient()
  const { data: tree = [], isLoading } = useDeptTree()
  const reorderMutation = useDeptReorder()
  const createMutation = useCreateDept()
  const updateMutation = useUpdateDept()

  const [data, setData] = useState<Dept[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Dept | null>(null)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ExpandedState>({})

  useEffect(() => {
    setData(tree)
  }, [tree])

  const handleReorder = ({ activeId, overId }: { activeId: string; overId: string }) => {
    setData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev))

      const findContainer = (
        items: Dept[],
        parent: Dept | null = null
      ): { parent: Dept | null; children: Dept[] } | undefined => {
        if (items.some((i) => i.id === activeId)) return { parent, children: items }
        for (const item of items) {
          if (item.children) {
            const found = findContainer(item.children, item)
            if (found) return found
          }
        }
        return undefined
      }

      const activeContainer = findContainer(newData)
      if (!activeContainer) return prev

      const { children: activeChildren, parent: activeParent } = activeContainer
      const overIndex = activeChildren.findIndex((i) => i.id === overId)
      if (overIndex === -1) return prev

      const activeIndex = activeChildren.findIndex((i) => i.id === activeId)
      const newChildren = arrayMove(activeChildren, activeIndex, overIndex)
      reorderMutation.mutate({
        parentId: activeParent?.id || null,
        orderedIds: newChildren.map((item) => item.id),
      })

      if (activeParent) {
        activeParent.children = newChildren
        return newData
      }
      return newChildren
    })
  }

  const handleAdd = () => {
    setEditingDept(null)
    setCreateParentId(null)
    setDrawerOpen(true)
  }

  const handleAddChild = (dept: Dept) => {
    setEditingDept(null)
    setCreateParentId(dept.id)
    setDrawerOpen(true)
  }

  const handleEdit = (dept: Dept) => {
    setEditingDept(dept)
    setCreateParentId(null)
    setDrawerOpen(true)
  }

  const handleSubmit = (values: DeptFormData) => {
    if (editingDept) {
      updateMutation.mutate(
        { id: editingDept.id, data: values },
        { onSuccess: () => setDrawerOpen(false) }
      )
      return
    }
    createMutation.mutate(values, { onSuccess: () => setDrawerOpen(false) })
  }

  const updateDeptStatusInBatch = async (selectedDepts: Dept[], status: 'active' | 'inactive') => {
    if (!selectedDepts.length) return
    await Promise.all(selectedDepts.map((dept) => deptApi.updateDeptStatus(dept.id, status)))
    await queryClient.invalidateQueries({ queryKey: ['depts', 'tree'] })
    toast.success(`已${status === 'active' ? '启用' : '禁用'} ${selectedDepts.length} 个部门`)
  }

  const deleteDeptsInBatch = async (selectedDepts: Dept[]) => {
    if (!selectedDepts.length) return
    await Promise.all(selectedDepts.map((dept) => deptApi.deleteDept(dept.id)))
    await queryClient.invalidateQueries({ queryKey: ['depts', 'tree'] })
    toast.success(`已删除 ${selectedDepts.length} 个部门`)
  }

  const collectDeptWithDescendants = (dept: Dept, map: Map<string, Dept>) => {
    if (map.has(dept.id)) return
    map.set(dept.id, dept)
    for (const child of dept.children ?? []) {
      collectDeptWithDescendants(child, map)
    }
  }

  const expandSelectedDepts = (selectedDepts: Dept[]) => {
    const deptMap = new Map<string, Dept>()
    for (const dept of selectedDepts) {
      collectDeptWithDescendants(dept, deptMap)
    }
    return Array.from(deptMap.values())
  }

  const enhancedColumns = columns.map((col) => {
    if (col.id !== 'actions') return col
    return {
      ...col,
      cell: ({ row }: { row: Row<Dept> }) => (
        <DeptRowActions row={row} onEdit={handleEdit} onAddChild={handleAddChild} />
      ),
    }
  })

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>部门管理</h2>
            <p className='text-muted-foreground'>管理组织部门和架构</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={() => setExpanded(true)} disabled={data.length === 0}>
              全部展开
            </Button>
            <Button variant='outline' onClick={() => setExpanded({})} disabled={data.length === 0}>
              全部折叠
            </Button>
            {canCreate ? (
              <Button onClick={handleAdd}>
                <Plus className='mr-2 h-4 w-4' />
                新增部门
              </Button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className='flex h-64 items-center justify-center'>
            <p className='text-muted-foreground'>加载中...</p>
          </div>
        ) : (
          <TreeDataTable
            data={data}
            columns={enhancedColumns}
            getRowCanExpand={(row) => !!row.original.children?.length}
            getRowId={(row) => row.id}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onReorder={handleReorder}
            renderSelectionToolbar={({ table, selectedCount, clearSelection }) => {
              const selectedDepts = table
                .getFilteredSelectedRowModel()
                .rows.map((row) => row.original as Dept)
              const selectedDeptsWithDescendants = expandSelectedDepts(selectedDepts)

              return (
                <DeptSelectionToolbar
                  selectedCount={selectedCount}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onClearSelection={clearSelection}
                  onBatchEnable={async () => {
                    await updateDeptStatusInBatch(selectedDeptsWithDescendants, 'active')
                    clearSelection()
                  }}
                  onBatchDisable={async () => {
                    await updateDeptStatusInBatch(selectedDeptsWithDescendants, 'inactive')
                    clearSelection()
                  }}
                  onBatchDelete={async () => {
                    await deleteDeptsInBatch(selectedDeptsWithDescendants)
                    clearSelection()
                  }}
                />
              )
            }}
          />
        )}
      </Main>

      <DeptDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        dept={editingDept}
        defaultParentId={createParentId}
        depts={tree}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  )
}

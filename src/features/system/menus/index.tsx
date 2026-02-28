import { useState } from 'react'
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
import { menuApi } from './api/menu-api'
import { MenuDrawer } from './components/MenuDrawer'
import { MenuSelectionToolbar } from './components/menu-selection-toolbar'
import { MenuRowActions } from './components/menu-row-actions'
import { columns } from './components/menus-columns'
import { type Menu, type MenuFormData } from './data/schema'
import { useMenuList } from './hooks/useMenuList'
import { useCreateMenu, useUpdateMenu } from './hooks/useMenuMutations'
import { useMenuReorder } from './hooks/useMenuReorder'

export function Menus() {
  const { can } = usePermission()
  const canCreate = can('system:menus:create')
  const canEdit = can('system:menus:edit')
  const canDelete = can('system:menus:delete')
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const { data: menus = [], isLoading } = useMenuList()
  const createMutation = useCreateMenu()
  const updateMutation = useUpdateMenu()
  const reorderMutation = useMenuReorder()

  const handleReorder = ({ activeId, overId }: { activeId: string; overId: string }) => {
    const findContainer = (
      items: Menu[],
      parent: Menu | null = null
    ): { parent: Menu | null; children: Menu[] } | undefined => {
      if (items.some((item) => item.id === activeId)) {
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

    const activeContainer = findContainer(menus)
    if (!activeContainer) return

    const { children: activeChildren } = activeContainer
    const overIndex = activeChildren.findIndex((item) => item.id === overId)
    if (overIndex === -1) return

    const activeIndex = activeChildren.findIndex((item) => item.id === activeId)
    const newChildren = arrayMove(activeChildren, activeIndex, overIndex)

    reorderMutation.mutate({
      parentId: activeContainer.parent?.id || null,
      sortedIds: newChildren.map((item) => item.id),
    })
  }

  const handleAdd = () => {
    setEditingMenu(null)
    setCreateParentId(null)
    setDrawerOpen(true)
  }

  const handleAddChild = (menu: Menu) => {
    setEditingMenu(null)
    setCreateParentId(menu.id)
    setDrawerOpen(true)
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setCreateParentId(null)
    setDrawerOpen(true)
  }

  const handleSubmit = (data: MenuFormData) => {
    if (editingMenu) {
      updateMutation.mutate({ id: editingMenu.id, data })
    } else {
      createMutation.mutate(data)
    }
    setDrawerOpen(false)
  }

  const enhancedColumns = columns.map((col) => {
    if (col.id !== 'actions') return col
    return {
      ...col,
      cell: ({ row }: { row: Row<Menu> }) => (
        <MenuRowActions row={row} onEdit={handleEdit} onAddChild={handleAddChild} />
      ),
    }
  })

  const collectMenuWithDescendants = (menu: Menu, map: Map<string, Menu>) => {
    if (map.has(menu.id)) return
    map.set(menu.id, menu)
    for (const child of menu.children ?? []) {
      collectMenuWithDescendants(child, map)
    }
  }

  const expandSelectedMenus = (selectedMenus: Menu[]) => {
    const menuMap = new Map<string, Menu>()
    for (const menu of selectedMenus) {
      collectMenuWithDescendants(menu, menuMap)
    }
    return Array.from(menuMap.values())
  }

  const updateMenuVisibility = async (menusToUpdate: Menu[], visible: boolean) => {
    if (!menusToUpdate.length) return
    await Promise.all(
      menusToUpdate.map((menu) =>
        menuApi.updateMenu(menu.id, {
          parentId: menu.parentId,
          type: menu.type,
          name: menu.name,
          code: menu.code,
          path: menu.path,
          icon: menu.icon,
          sort: menu.sort,
          visible,
        })
      )
    )
    await queryClient.invalidateQueries({ queryKey: ['menus'] })
    toast.success(`已${visible ? '显示' : '隐藏'} ${menusToUpdate.length} 个菜单项`)
  }

  const batchDeleteMenus = async (menusToDelete: Menu[]) => {
    if (!menusToDelete.length) return
    await Promise.all(menusToDelete.map((menu) => menuApi.deleteMenu(menu.id)))
    await queryClient.invalidateQueries({ queryKey: ['menus'] })
    toast.success(`已删除 ${menusToDelete.length} 个菜单项`)
  }

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
            <h2 className='text-2xl font-bold tracking-tight'>菜单管理</h2>
            <p className='text-muted-foreground'>管理系统菜单与权限配置</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={() => setExpanded(true)} disabled={menus.length === 0}>
              全部展开
            </Button>
            <Button variant='outline' onClick={() => setExpanded({})} disabled={menus.length === 0}>
              全部折叠
            </Button>
            {canCreate ? (
              <Button onClick={handleAdd}>
                <Plus className='mr-2 h-4 w-4' />
                新增菜单
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
            data={menus}
            columns={enhancedColumns}
            getRowCanExpand={(row) => !!row.original.children?.length}
            getRowId={(row) => row.id}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onReorder={handleReorder}
            renderSelectionToolbar={({ table, selectedCount, clearSelection }) => {
              const selectedMenus = table
                .getFilteredSelectedRowModel()
                .rows.map((row) => row.original as Menu)
              const selectedMenusWithDescendants = expandSelectedMenus(selectedMenus)

              return (
                <MenuSelectionToolbar
                  selectedCount={selectedCount}
                  onClearSelection={clearSelection}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onBatchShow={async () => {
                    await updateMenuVisibility(selectedMenusWithDescendants, true)
                    clearSelection()
                  }}
                  onBatchHide={async () => {
                    await updateMenuVisibility(selectedMenusWithDescendants, false)
                    clearSelection()
                  }}
                  onBatchDelete={async () => {
                    await batchDeleteMenus(selectedMenus)
                    clearSelection()
                  }}
                />
              )
            }}
          />
        )}
      </Main>

      <MenuDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        menu={editingMenu}
        defaultParentId={createParentId}
        menus={menus}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  )
}

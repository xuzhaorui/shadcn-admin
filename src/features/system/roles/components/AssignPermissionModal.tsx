import { useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRoles } from './roles-provider'
import {
  useAssignPermissions,
  usePermissionTree,
  useRolePermissions,
} from '../hooks/usePermissionTree'
import { type PermissionNode } from '../types/permission'

export function AssignPermissionModal() {
  const { open, setOpen, currentRow } = useRoles()
  const { data: permissionTree, isLoading: treeLoading } = usePermissionTree()
  const { data: rolePermissions } = useRolePermissions(currentRow?.id || null)
  const assignMutation = useAssignPermissions()

  const [selectedIdsDraft, setSelectedIdsDraft] = useState<string[] | null>(null)
  const [keyword, setKeyword] = useState('')
  const [expandedIdsDraft, setExpandedIdsDraft] = useState<string[] | null>(null)

  const isOpen = open === 'permission'

  const collectNodeIds = (node: PermissionNode): string[] => {
    const children = node.children ?? []
    return [node.id, ...children.flatMap((child) => collectNodeIds(child))]
  }

  const collectExpandableIds = (nodes: PermissionNode[]): string[] => {
    return nodes.flatMap((node) => {
      const children = node.children ?? []
      if (children.length === 0) return []
      return [node.id, ...collectExpandableIds(children)]
    })
  }

  const baseSelectedIds = rolePermissions
    ? [...rolePermissions.menuIds, ...rolePermissions.permissionCodes]
    : []
  const selectedIds = selectedIdsDraft ?? baseSelectedIds

  const defaultExpandedIds = collectExpandableIds(permissionTree ?? [])
  const expandedIds = expandedIdsDraft ?? defaultExpandedIds

  const handleClose = () => {
    setSelectedIdsDraft(null)
    setKeyword('')
    setExpandedIdsDraft(null)
    setOpen(null)
  }

  const handleSubmit = () => {
    if (!currentRow) return

    assignMutation.mutate(
      {
        roleId: currentRow.id,
        params: { permissionNodeIds: selectedIds },
      },
      {
        onSuccess: handleClose,
      }
    )
  }

  const handleExpandAll = () => {
    setExpandedIdsDraft(defaultExpandedIds)
  }

  const handleCollapseAll = () => {
    if (keyword.trim()) {
      setKeyword('')
    }
    setExpandedIdsDraft([])
  }

  const filterTree = (nodes: PermissionNode[], term: string): PermissionNode[] => {
    const q = term.trim().toLowerCase()
    if (!q) return nodes

    return nodes.reduce<PermissionNode[]>((acc, node) => {
      const children = node.children ?? []
      const filteredChildren = filterTree(children, q)
      const selfMatched =
        node.name.toLowerCase().includes(q) || node.code?.toLowerCase().includes(q)

      if (selfMatched || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren,
        })
      }

      return acc
    }, [])
  }

  const visibleTree = filterTree(permissionTree ?? [], keyword)

  const toggleNode = (node: PermissionNode) => {
    const targetIds = collectNodeIds(node)

    setSelectedIdsDraft((prevDraft) => {
      const prevSet = new Set(prevDraft ?? selectedIds)
      const allSelected = targetIds.every((id) => prevSet.has(id))

      if (allSelected) {
        return Array.from(prevSet).filter((id) => !targetIds.includes(id))
      }

      const next = new Set(prevSet)
      targetIds.forEach((id) => next.add(id))
      return Array.from(next)
    })
  }

  const toggleExpand = (nodeId: string) => {
    setExpandedIdsDraft((prevDraft) => {
      const current = prevDraft ?? expandedIds
      return current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId]
    })
  }

  const renderTreeNode = (node: PermissionNode, level = 0) => {
    const selectedSet = new Set(selectedIds)
    const nodeIds = collectNodeIds(node)
    const selectedCount = nodeIds.filter((id) => selectedSet.has(id)).length
    const isChecked =
      selectedCount === 0 ? false : selectedCount === nodeIds.length ? true : 'indeterminate'
    const hasChildren = (node.children?.length ?? 0) > 0
    const isExpanded = keyword.trim() ? true : expandedIds.includes(node.id)

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className='flex items-center gap-2 py-2'>
          <button
            type='button'
            className='inline-flex h-4 w-4 items-center justify-center text-muted-foreground'
            onClick={() => hasChildren && toggleExpand(node.id)}
            aria-label={isExpanded ? '收起节点' : '展开节点'}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className='h-4 w-4' />
              ) : (
                <ChevronRight className='h-4 w-4' />
              )
            ) : null}
          </button>
          <Checkbox id={node.id} checked={isChecked} onCheckedChange={() => toggleNode(node)} />
          <label
            htmlFor={node.id}
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
          >
            {node.name}
            {node.type === 'button' && node.code && (
              <span className='ml-2 text-xs text-muted-foreground'>({node.code})</span>
            )}
          </label>
        </div>
        {hasChildren && isExpanded
          ? node.children!.map((child) => renderTreeNode(child, level + 1))
          : null}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className='max-h-[85vh] sm:max-w-[900px] lg:max-w-[1100px]'>
        <DialogHeader>
          <DialogTitle>权限分配</DialogTitle>
          <DialogDescription>
            为角色“{currentRow?.name}”分配菜单和按钮权限。
          </DialogDescription>
        </DialogHeader>

        <div className='flex items-center gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='搜索菜单名称或权限编码'
              className='pl-8'
            />
          </div>
          <Button type='button' variant='outline' onClick={handleExpandAll}>
            全部展开
          </Button>
          <Button type='button' variant='outline' onClick={handleCollapseAll}>
            全部收起
          </Button>
        </div>

        <ScrollArea className='h-[60vh] w-full rounded-md border p-4'>
          {treeLoading ? (
            <div className='text-center text-muted-foreground'>加载中...</div>
          ) : visibleTree.length > 0 ? (
            visibleTree.map((node) => renderTreeNode(node))
          ) : (
            <div className='text-center text-muted-foreground'>
              {keyword.trim() ? '未匹配到结果' : '暂无权限数据'}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={handleClose} disabled={assignMutation.isPending}>
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
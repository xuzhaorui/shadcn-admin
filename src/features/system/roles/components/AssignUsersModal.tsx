import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { useRoles } from './roles-provider'
import {
    useRoleUsers,
    useAvailableUsers,
    useAddUsersToRole,
    useRemoveUsersFromRole,
} from '../hooks/useRoleUsers'

export function AssignUsersModal() {
    const { open, setOpen, currentRow } = useRoles()
    const [assignedKeyword, setAssignedKeyword] = useState('')
    const [availableKeyword, setAvailableKeyword] = useState('')
    const [selectedAssigned, setSelectedAssigned] = useState<string[]>([])
    const [selectedAvailable, setSelectedAvailable] = useState<string[]>([])

    const { data: assignedData } = useRoleUsers(currentRow?.id || null, {
        page: 1,
        pageSize: 50,
        keyword: assignedKeyword,
    })

    const { data: availableData } = useAvailableUsers(currentRow?.id || null, {
        page: 1,
        pageSize: 50,
        keyword: availableKeyword,
    })

    const addMutation = useAddUsersToRole()
    const removeMutation = useRemoveUsersFromRole()

    const isOpen = open === 'assignUsers'

    const handleClose = () => {
        setAssignedKeyword('')
        setAvailableKeyword('')
        setSelectedAssigned([])
        setSelectedAvailable([])
        setOpen(null)
    }

    const handleAddUsers = () => {
        if (!currentRow || selectedAvailable.length === 0) return

        addMutation.mutate(
            {
                roleId: currentRow.id,
                params: { userIds: selectedAvailable },
            },
            {
                onSuccess: () => {
                    setSelectedAvailable([])
                },
            }
        )
    }

    const handleRemoveUsers = () => {
        if (!currentRow || selectedAssigned.length === 0) return

        removeMutation.mutate(
            {
                roleId: currentRow.id,
                params: { userIds: selectedAssigned },
            },
            {
                onSuccess: () => {
                    setSelectedAssigned([])
                },
            }
        )
    }

    const assignedUsers = assignedData?.list || []
    const availableUsers = availableData?.list || []

    return (
        <Sheet open={isOpen} onOpenChange={(v) => !v && handleClose()}>
            <SheetContent className="sm:max-w-[800px] overflow-y-auto pl-8">
                <SheetHeader>
                    <SheetTitle>分配用户</SheetTitle>
                    <SheetDescription>
                        为角色 "{currentRow?.name}" 添加或移除用户
                    </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* 已分配用户 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            已分配用户 ({assignedUsers.length})
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索用户..."
                                value={assignedKeyword}
                                onChange={(e) => setAssignedKeyword(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <ScrollArea className="h-[300px] rounded-md border p-2">
                            {assignedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center space-x-2 py-2"
                                >
                                    <Checkbox
                                        id={`assigned-${user.id}`}
                                        checked={selectedAssigned.includes(user.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedAssigned((prev) =>
                                                checked
                                                    ? [...prev, user.id]
                                                    : prev.filter((id) => id !== user.id)
                                            )
                                        }}
                                    />
                                    <label
                                        htmlFor={`assigned-${user.id}`}
                                        className="text-sm cursor-pointer flex-1"
                                    >
                                        {user.name || user.username}
                                        {user.phone && (
                                            <span className="text-muted-foreground text-xs ml-2">
                                                ({user.phone})
                                            </span>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </ScrollArea>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveUsers}
                            disabled={
                                selectedAssigned.length === 0 || removeMutation.isPending
                            }
                            className="w-full"
                        >
                            移除选中 ({selectedAssigned.length})
                        </Button>
                    </div>

                    {/* 可分配用户 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">
                            可分配用户 ({availableUsers.length})
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索用户..."
                                value={availableKeyword}
                                onChange={(e) => setAvailableKeyword(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <ScrollArea className="h-[300px] rounded-md border p-2">
                            {availableUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center space-x-2 py-2"
                                >
                                    <Checkbox
                                        id={`available-${user.id}`}
                                        checked={selectedAvailable.includes(user.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedAvailable((prev) =>
                                                checked
                                                    ? [...prev, user.id]
                                                    : prev.filter((id) => id !== user.id)
                                            )
                                        }}
                                    />
                                    <label
                                        htmlFor={`available-${user.id}`}
                                        className="text-sm cursor-pointer flex-1"
                                    >
                                        {user.name || user.username}
                                        {user.phone && (
                                            <span className="text-muted-foreground text-xs ml-2">
                                                ({user.phone})
                                            </span>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </ScrollArea>
                        <Button
                            size="sm"
                            onClick={handleAddUsers}
                            disabled={selectedAvailable.length === 0 || addMutation.isPending}
                            className="w-full"
                        >
                            添加选中 ({selectedAvailable.length})
                        </Button>
                    </div>
                </div>

                <SheetFooter className="mt-4">
                    <Button variant="outline" onClick={handleClose}>
                        关闭
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

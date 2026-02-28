import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteRole } from '../hooks/useRoleMutations'
import { useRoles } from './roles-provider'

export function RolesDeleteDialog() {
  const { open, setOpen, currentRow, setCurrentRow } = useRoles()
  const deleteRoleMutation = useDeleteRole()
  const isOpen = open === 'delete'

  const handleDelete = async () => {
    if (!currentRow?.id) return
    await deleteRoleMutation.mutateAsync(currentRow.id)
    handleClose()
  }

  const handleClose = () => {
    setCurrentRow(null)
    setOpen(null)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm role deletion?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. It will permanently delete role{' '}
            <span className='font-medium'>"{currentRow?.name}"</span>
            {' '}and its related permission bindings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (event) => {
              // Prevent auto-close; close only after server confirms success.
              event.preventDefault()
              await handleDelete()
            }}
            disabled={deleteRoleMutation.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

import { RoleDrawer } from './RoleDrawer'
import { RolesDeleteDialog } from './roles-delete-dialog'
import { AssignPermissionModal } from './AssignPermissionModal'
import { AssignUsersModal } from './AssignUsersModal'
import { DataScopeModal } from './DataScopeModal'

export function RolesDialogs() {
    return (
        <>
            <RoleDrawer />
            <RolesDeleteDialog />
            <AssignPermissionModal />
            <DataScopeModal />
            <AssignUsersModal />
        </>
    )
}

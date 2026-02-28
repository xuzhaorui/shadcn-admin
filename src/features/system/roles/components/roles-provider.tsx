import { createContext, useContext, useState } from 'react'
import { type Role } from '../data/schema'

type RolesDialogType =
    | 'add'
    | 'edit'
    | 'delete'
    | 'permission'
    | 'dataScope'
    | 'assignUsers'

interface RolesContextType {
    open: RolesDialogType | null
    setOpen: (type: RolesDialogType | null) => void
    currentRow: Role | null
    setCurrentRow: (row: Role | null) => void
}

const RolesContext = createContext<RolesContextType | null>(null)

interface Props {
    children: React.ReactNode
}

export function RolesProvider({ children }: Props) {
    const [open, setOpen] = useState<RolesDialogType | null>(null)
    const [currentRow, setCurrentRow] = useState<Role | null>(null)

    return (
        <RolesContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
            {children}
        </RolesContext.Provider>
    )
}

export function useRoles() {
    const context = useContext(RolesContext)
    if (!context) {
        throw new Error('useRoles must be used within a RolesProvider')
    }
    return context
}

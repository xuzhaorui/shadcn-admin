import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<_TData, _TValue> {
    className?: string
    title?: string
    tdClassName?: string
    thClassName?: string
  }

  interface TableMeta<_TData> {
    roleNameMap?: Record<string, string>
  }
}

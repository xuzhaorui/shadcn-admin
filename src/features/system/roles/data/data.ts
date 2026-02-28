export const roleStatuses = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
] as const

export const dataScopeOptions = [
  { label: '全部数据权限', value: 'all' },
  { label: '自定义数据权限', value: 'custom' },
  { label: '本部门数据权限', value: 'dept' },
  { label: '本部门及以下数据权限', value: 'dept_down' },
  { label: '仅本人数据权限', value: 'self' },
] as const
import { Shield, UserCheck, Users, CreditCard } from 'lucide-react'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
])

export const userStatuses = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' },
] as const

export const roles = [
  {
    label: '超级管理员',
    value: 'superadmin',
    icon: Shield,
  },
  {
    label: '管理员',
    value: 'admin',
    icon: UserCheck,
  },
  {
    label: '经理',
    value: 'manager',
    icon: Users,
  },
  {
    label: '收银员',
    value: 'cashier',
    icon: CreditCard,
  },
] as const

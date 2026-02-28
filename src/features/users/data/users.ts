import { type User } from './schema'

const rolePool = ['superadmin', 'admin', 'manager', 'cashier']
const deptPool = ['1', '1-1', '1-1-1', '1-1-2', '1-1-3', '1-2', '1-3', '1-4']
const firstNames = ['明', '华', '杰', '娜', '伟', '洋', '晨', '婷'] as const
const lastNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '周'] as const

export const users: User[] = Array.from({ length: 200 }, (_, index) => {
  const firstName = firstNames[index % firstNames.length]
  const lastName = lastNames[index % lastNames.length]
  const realName = `${lastName}${firstName}`
  const username = `${lastName.toLowerCase()}${firstName.toLowerCase()}${1000 + index}`
  const roleHead = rolePool[index % rolePool.length]
  const roleTail = rolePool[(index + 1) % rolePool.length]
  const roleIds = index % 3 === 0 ? [roleHead, roleTail] : [roleHead]

  return {
    id: `user-${index + 1}`,
    username,
    realName,
    email: `${username}@example.com`,
    phone: index % 5 === 0 ? undefined : `1${String(3000000000 + index).padStart(10, '0')}`,
    departmentId: deptPool[index % deptPool.length],
    roleIds,
    status: index % 6 === 0 ? 'inactive' : 'active',
  }
})

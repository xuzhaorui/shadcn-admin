import { type User } from '../data/schema'

export function isProtectedUser(user: User): boolean {
  const username = (user.username || '').toLowerCase()
  const email = (user.email || '').toLowerCase()
  const roleIds = user.roleIds || []

  return (
    username === 'admin' ||
    username === 'admin@example.com' ||
    email === 'admin@example.com' ||
    roleIds.includes('admin')
  )
}

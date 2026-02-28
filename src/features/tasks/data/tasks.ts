const statuses = ['todo', 'in progress', 'done', 'canceled', 'backlog'] as const
const labels = ['bug', 'feature', 'documentation'] as const
const priorities = ['low', 'medium', 'high'] as const
const verbs = ['修复', '优化', '重构', '补充', '排查', '更新'] as const
const subjects = ['登录流程', '权限校验', '菜单渲染', '用户导入', '接口超时', '监控看板'] as const
const names = ['王涛', '李雪', '陈晨', '赵杰', '周楠', '孙航'] as const

const baseDate = new Date('2026-01-01T08:00:00.000Z').getTime()

export const tasks = Array.from({ length: 100 }, (_, index) => {
  const status = statuses[index % statuses.length]
  const label = labels[index % labels.length]
  const priority = priorities[index % priorities.length]
  const createdAt = new Date(baseDate + index * 86_400_000)
  const updatedAt = new Date(createdAt.getTime() + 3_600_000 * ((index % 12) + 1))
  const dueDate = new Date(createdAt.getTime() + 86_400_000 * ((index % 10) + 3))

  return {
    id: `TASK-${1000 + index}`,
    title: `${verbs[index % verbs.length]}${subjects[index % subjects.length]}`,
    status,
    label,
    priority,
    createdAt,
    updatedAt,
    assignee: names[index % names.length],
    description: `${subjects[index % subjects.length]}相关任务，优先级为${priority}。`,
    dueDate,
  }
})

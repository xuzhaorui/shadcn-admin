import { z } from 'zod'

// 用户状态枚举 (按 agend 规范: 仅 active/inactive)
const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

// 用户实体 (按 agend 规范)
const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  realName: z.string(), // 真实姓名 (替代 firstName + lastName)
  email: z.string(),
  phone: z.string().optional(), // 手机号 (可选)
  status: userStatusSchema,
  departmentId: z.string(), // 部门 ID
  roleIds: z.array(z.string()), // 角色 ID 列表
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)

// 表单校验 Schema (按 agend 规范)
export const userFormSchema = z.object({
  username: z.string()
    .min(4, '用户名至少4个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '仅支持字母、数字、下划线'),

  realName: z.string()
    .min(2, '真实姓名至少2个字符')
    .max(20, '真实姓名最多20个字符'),

  email: z.string()
    .email('邮箱格式不正确'),

  phone: z.string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
    .optional()
    .or(z.literal('')),

  departmentId: z.string()
    .min(1, '请选择部门'),

  roleIds: z.array(z.string())
    .min(1, '至少选择一个角色'),

  status: z.enum(['active', 'inactive']),

  // 密码字段 (新增时必填,编辑时可选)
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
})
  .refine(
    (data) => {
      // 如果填写了密码,则必须至少 8 位
      if (data.password && data.password.length > 0) {
        return data.password.length >= 8 && data.password.length <= 20
      }
      return true
    },
    {
      message: '密码长度为 8-20 位',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      // 如果填写了密码,必须包含字母
      if (data.password && data.password.length > 0) {
        return /[a-zA-Z]/.test(data.password)
      }
      return true
    },
    {
      message: '密码必须包含字母',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      // 如果填写了密码,必须包含数字
      if (data.password && data.password.length > 0) {
        return /\d/.test(data.password)
      }
      return true
    },
    {
      message: '密码必须包含数字',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      // 如果填写了密码,确认密码必须一致
      if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword
      }
      return true
    },
    {
      message: '两次密码输入不一致',
      path: ['confirmPassword'],
    }
  )

export type UserFormData = z.infer<typeof userFormSchema>

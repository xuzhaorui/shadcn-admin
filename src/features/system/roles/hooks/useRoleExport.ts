import { useState } from 'react'
import { toast } from 'sonner'
import { roleApi, type RoleListParams } from '../api/role-api'

export function useRoleExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportRoles = async (params: RoleListParams) => {
    try {
      setIsExporting(true)
      await roleApi.exportRoles(params)
      toast.success('导出接口已连通，后端当前返回占位结果')
    } catch {
      toast.error('导出失败，请稍后重试')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportRoles,
    isExporting,
  }
}


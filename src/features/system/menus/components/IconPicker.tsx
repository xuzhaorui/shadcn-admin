import { useState } from 'react'
import {
  Activity,
  BarChart,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Edit,
  Eye,
  EyeOff,
  File,
  FileText,
  Folder,
  Home,
  LayoutDashboard,
  Mail,
  Menu,
  Monitor,
  Package,
  PieChart,
  Plus,
  Search,
  Server,
  Settings,
  Shield,
  Trash,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

const ICON_COMPONENTS = {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  Menu,
  FileText,
  Monitor,
  Database,
  Clock,
  Activity,
  Server,
  Bell,
  Mail,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Home,
  Folder,
  File,
  Building2,
  Package,
  BarChart,
  PieChart,
  TrendingUp,
} as const satisfies Record<string, LucideIcon>

const ICON_LIST = Object.keys(ICON_COMPONENTS) as (keyof typeof ICON_COMPONENTS)[]

interface IconPickerProps {
  value?: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredIcons = ICON_LIST.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()))
  const SelectedIcon = value ? ICON_COMPONENTS[value as keyof typeof ICON_COMPONENTS] : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' role='combobox' aria-expanded={open} className='w-full justify-start'>
          {SelectedIcon ? (
            <div className='flex items-center gap-2'>
              <SelectedIcon className='h-4 w-4' />
              <span>{value}</span>
            </div>
          ) : (
            <span className='text-muted-foreground'>选择图标...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[320px] p-0' align='start'>
        <div className='border-b p-2'>
          <Input
            placeholder='搜索图标...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-8'
          />
        </div>
        <ScrollArea className='h-[240px]'>
          <div className='grid grid-cols-5 gap-2 p-2'>
            {filteredIcons.map((iconName) => {
              const Icon = ICON_COMPONENTS[iconName]
              return (
                <Button
                  key={iconName}
                  variant={value === iconName ? 'default' : 'ghost'}
                  size='sm'
                  className='h-12 w-12 p-0'
                  onClick={() => {
                    onChange(iconName)
                    setOpen(false)
                    setSearch('')
                  }}
                  title={iconName}
                >
                  <Icon className='h-5 w-5' />
                </Button>
              )
            })}
          </div>
          {filteredIcons.length === 0 ? (
            <div className='p-4 text-center text-sm text-muted-foreground'>未找到匹配的图标</div>
          ) : null}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

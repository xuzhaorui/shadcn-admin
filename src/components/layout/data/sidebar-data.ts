import {
  Activity,
  AudioWaveform,
  Bell,
  Bug,
  Building2,
  Clock,
  Command,
  Construction,
  Database,
  FileText,
  FileX,
  GalleryVerticalEnd,
  HelpCircle,
  LayoutDashboard,
  List,
  ListTodo,
  Lock,
  Menu,
  MessagesSquare,
  Monitor,
  Package,
  Palette,
  Server,
  ServerOff,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
  UserX,
  Users,
  Wrench,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: Package,
        },
        {
          title: 'Chats',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sign In',
              url: '/sign-in',
            },
            {
              title: 'Sign In (2 Col)',
              url: '/sign-in-2',
            },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: Bug,
          items: [
            {
              title: 'Unauthorized',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: 'Forbidden',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: 'Not Found',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: 'Internal Server Error',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Users',
          url: '/system/users',
          icon: Users,
        },
        {
          title: 'Roles',
          url: '/system/roles',
          icon: Shield,
        },
        {
          title: 'Menus',
          url: '/system/menus',
          icon: Menu,
        },
        {
          title: 'Departments',
          url: '/system/depts',
          icon: Building2,
        },
        {
          title: 'Logs',
          icon: FileText,
          items: [
            {
              title: 'Operation Logs',
              url: '/system/logs/operation',
            },
            {
              title: 'Login Logs',
              url: '/system/logs/login',
            },
          ],
        },
      ],
    },
    {
      title: 'Monitor',
      items: [
        {
          title: 'Online Users',
          url: '/monitor/online',
          icon: Activity,
        },
        {
          title: 'Scheduled Jobs',
          url: '/monitor/jobs',
          icon: Clock,
        },
        {
          title: 'Server Status',
          url: '/monitor/server',
          icon: Server,
        },
        {
          title: 'Cache Monitor',
          url: '/monitor/cache',
          icon: Database,
        },
      ],
    },
    {
      title: 'Components',
      items: [
        {
          title: 'Tree Table',
          url: '/components/tree',
          icon: List,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}

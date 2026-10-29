import {
  LayoutDashboard,
  FlaskConical,
  BarChart3,
  Bug,
  Variable,
  Container,
  CalendarClock,
  Database,
  Settings,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'QA Engineer',
    email: 'qa@agrimpex.local',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'RunLab Agrimpex',
      logo: FlaskConical,
      plan: 'QA Automation',
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
      ],
    },
    {
      title: 'Ejecución',
      items: [
        {
          title: 'Tests',
          url: '/tests',
          icon: FlaskConical,
        },
        {
          title: 'Reportes',
          url: '/reports',
          icon: BarChart3,
        },
        {
          title: 'Evidencia de fallos',
          url: '/errors',
          icon: Bug,
        },
      ],
    },
    {
      title: 'Configuración',
      items: [
        {
          title: 'Entornos',
          url: '/env',
          icon: Variable,
        },
        {
          title: 'Docker',
          url: '/docker',
          icon: Container,
        },
        {
          title: 'Calendarización',
          url: '/schedules',
          icon: CalendarClock,
        },
        {
          title: 'Datos de prueba',
          url: '/data',
          icon: Database,
        },
      ],
    },
    {
      title: 'Sistema',
      items: [
        {
          title: 'Ajustes',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, FileText, Megaphone, LogOut,
  Settings, ChevronRight, Bug, BarChart, ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') {
      return true;
    }
    
    if (path !== '/admin' && pathname?.startsWith(path)) {
      return true;
    }
    
    return false;
  };
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Utilisateurs',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Projets',
      href: '/admin/projects',
      icon: FileText,
    },
    {
      name: 'Freelancers',
      href: '/admin/freelancers',
      icon: BarChart,
    },
    {
      name: 'Annonces',
      href: '/admin/announcements',
      icon: Megaphone,
    },
    {
      name: 'Debug',
      href: '/admin/debug',
      icon: Bug,
    },
    {
      name: 'Paramètres',
      href: '/admin/settings',
      icon: Settings,
    },
  ];
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col text-gray-800">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm">Admin Panel</span>
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isItemActive = isActive(item.href);
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors ${
                    isItemActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => onClose && onClose()}
                >
                  <item.icon className={`h-3 w-3 ${isItemActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span>{item.name}</span>
                  {isItemActive && <ChevronRight className="h-3 w-3 ml-auto" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-3 border-t border-gray-200">
        <Link 
          href="/api/auth/signout"
          className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-3 w-3" />
          <span>Déconnexion</span>
        </Link>
        
        <div className="mt-3 text-xxs text-gray-500 px-2">
          <p>Vynal Admin v1.0</p>
        </div>
      </div>
    </aside>
  );
} 
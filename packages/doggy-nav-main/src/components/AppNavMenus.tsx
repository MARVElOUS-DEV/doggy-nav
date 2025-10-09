import Link from 'next/link';
import MenuStack from './MenuStack';

export default function AppNavMenus({ showMenuType }: { showMenuType: boolean, onShowMenus?: () => void }) {
  const isCollapse = !showMenuType;
  return (
    <div className="h-full flex flex-col overflow-hidden bg-theme-sidebar text-theme-sidebar-foreground">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-theme-border flex items-center justify-center">
        <Link href="/" className="flex items-center space-x-3 text-lg font-bold hover:text-theme-primary transition-colors">
          <div className="bg-theme-primary p-2 rounded-lg shadow-sm text-theme-primary-foreground">
            <span className="text-white font-bold">DN</span>
          </div>
          {!isCollapse && <span className="text-xl text-theme-sidebar-foreground font-semibold">DoggyNav</span>}
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <MenuStack collapse={isCollapse} />
      </div>

      {/* Sidebar Footer */}
      {!isCollapse && (
        <div className="p-4 border-t border-theme-border text-xs text-theme-muted-foreground">
          <p className="text-center">© {new Date().getFullYear()} DoggyNav</p>
        </div>
      )}
    </div>
  );
}

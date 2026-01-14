import React from 'react';

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}

/**
 * Navigation item for the sidebar
 */
const SidebarNavItem: React.FC<SidebarNavItemProps> = React.memo(({
  icon,
  label,
  active,
  collapsed,
  onClick
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active
        ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-sm'
        : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
      }`}
  >
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </button>
));

SidebarNavItem.displayName = 'SidebarNavItem';

export default SidebarNavItem;

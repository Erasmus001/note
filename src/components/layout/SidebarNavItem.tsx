import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  to?: string;
  onClick?: () => void;
  actions?: Array<{
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    title?: string;
    className?: string;
  }>;
}

/**
 * Navigation item for the sidebar
 */
const SidebarNavItem: React.FC<SidebarNavItemProps> = React.memo(({
  icon,
  label,
  active,
  collapsed,
  to,
  onClick,
  actions
}) => {
  const content = (
    <div
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active
        ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-sm'
        : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate pr-8">{label}</span>}
    </div>
  );

  return (
    <div className="group/nav-item relative">
      {to ? (
        <Link to={to} className="block w-full" onClick={onClick}>
          {content}
        </Link>
      ) : (
        <button onClick={onClick} className="block w-full text-left">
          {content}
        </button>
      )}

      {!collapsed && actions && actions.length > 0 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/nav-item:opacity-100 transition-opacity">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(e);
              }}
              title={action.title}
              className={`p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ${action.className || ''}`}
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

SidebarNavItem.displayName = 'SidebarNavItem';

export default SidebarNavItem;

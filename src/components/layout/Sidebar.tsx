import React from "react";
import {
  FileText,
  Star,
  Trash2,
  Settings as SettingsIcon,
  Plus,
  Tag,
  Menu,
  Pencil,
  Users,
} from "lucide-react";
import { Folder, ViewMode } from "../../../types";
import SidebarNavItem from "./SidebarNavItem";
import { UserButton } from "@clerk/clerk-react";

interface SidebarProps {
  folders: Folder[];
  allTags: string[];
  tagUsage: Record<string, number>;
  currentView: { mode: ViewMode; id?: string };
  isCollapsed: boolean;
  onSetCollapsed: (collapsed: boolean) => void;
  onSetView: (view: { mode: ViewMode; id?: string }) => void;
  onOpenSettings: (
    tab?: "appearance" | "editor" | "tags" | "sync" | "data",
  ) => void;
  onCreateFolder: () => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
}

/**
 * Main sidebar with navigation, folders, and tags
 */
const Sidebar: React.FC<SidebarProps> = ({
  folders,
  allTags,
  tagUsage,
  currentView,
  isCollapsed,
  onSetCollapsed,
  onSetView,
  onOpenSettings,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}) => {
  return (
    <aside
      className={`${isCollapsed ? "w-16" : "w-64"} hidden md:flex flex-col border-r border-zinc-200 transition-all duration-200 shrink-0 bg-white`}
    >
      <div className="p-4 flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <div className="font-black text-lg tracking-tighter italic">
            JAM<span className="text-zinc-500"></span>
          </div>
        )}
        <button
          onClick={() => onSetCollapsed(!isCollapsed)}
          className="p-1 hover:bg-zinc-100 rounded text-zinc-500"
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        <SidebarNavItem
          icon={<FileText size={18} />}
          label="All Notes"
          active={currentView.mode === ViewMode.All}
          collapsed={isCollapsed}
          to="/notes"
        />
        <SidebarNavItem
          icon={<Star size={18} />}
          label="Starred"
          active={currentView.mode === ViewMode.Starred}
          collapsed={isCollapsed}
          to="/starred"
        />
        <SidebarNavItem
          icon={<Trash2 size={18} />}
          label="Trash"
          active={currentView.mode === ViewMode.Trash}
          collapsed={isCollapsed}
          to="/trash"
        />
        <SidebarNavItem
          icon={<Users size={18} />}
          label="Shared with me"
          active={currentView.mode === ViewMode.Shared}
          collapsed={isCollapsed}
          to="/shared"
        />

        {!isCollapsed && (
          <>
            {/* Folders Section */}
            <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between group">
              <span>Folders</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFolder();
                }}
                className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Create New Folder"
              >
                <Plus size={14} />
              </button>
            </div>
            {folders.map((f) => (
              <SidebarNavItem
                key={f.id}
                icon={<span>{f.icon}</span>}
                label={f.name}
                active={currentView.mode === ViewMode.Folder && currentView.id === f.id}
                to={`/folders/${f.id}`}
                actions={[
                  {
                    icon: <Pencil size={12} />,
                    onClick: () => onRenameFolder(f),
                    title: "Rename",
                  },
                  {
                    icon: <Trash2 size={12} />,
                    onClick: () => onDeleteFolder(f),
                    title: "Delete",
                    className: "hover:text-red-500",
                  },
                ]}
              />
            ))}

            {/* Tags Section */}
            <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
              <span>Tags</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings("tags");
                }}
                className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Manage Tags"
              >
                <SettingsIcon size={14} />
              </button>
            </div>
            <div className="px-2 space-y-1">
              {allTags.map((tag) => (
                <SidebarNavItem
                  key={tag}
                  icon={<Tag size={14} />}
                  label={`${tag} (${tagUsage[tag]})`}
                  active={
                    currentView.mode === ViewMode.Tag && currentView.id === tag
                  }
                  to={`/tags/${encodeURIComponent(tag)}`}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-zinc-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenSettings("appearance")}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
            title="Open Settings"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
        <div className="pl-2 border-l border-zinc-200">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 rounded-lg",
              },
            }}
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

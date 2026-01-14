import React from 'react';
import { X, Type, Maximize2, Check } from 'lucide-react';
import { AppSettings } from '../../../types';

type SettingsTab = 'appearance' | 'editor' | 'tags' | 'sync' | 'data';

interface SettingsModalProps {
  isOpen: boolean;
  activeTab: SettingsTab;
  settings: AppSettings;
  onClose: () => void;
  onTabChange: (tab: SettingsTab) => void;
  onSetFontSize: (size: AppSettings['fontSize']) => void;
  onSetEditorWidth: (width: AppSettings['editorWidth']) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  activeTab,
  settings,
  onClose,
  onTabChange,
  onSetFontSize,
  onSetEditorWidth,
}) => {
  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'appearance', label: 'Appearance' },
    { id: 'editor', label: 'Editor' },
  ];

  const fontSizes: { value: AppSettings['fontSize']; label: string }[] = [
    { value: 'sm', label: 'Small' },
    { value: 'base', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ];

  const editorWidths: { value: AppSettings['editorWidth']; label: string }[] = [
    { value: 'narrow', label: 'Narrow' },
    { value: 'standard', label: 'Standard' },
    { value: 'full', label: 'Full Width' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-bold text-zinc-900">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                  ? 'text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'appearance' && (
            <>
              {/* Font Size */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700">
                  <Type size={16} className="inline mr-2" />
                  Font Size
                </label>
                <div className="flex gap-2">
                  {fontSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => onSetFontSize(size.value)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${settings.fontSize === size.value
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'editor' && (
            <>
              {/* Editor Width */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700">
                  <Maximize2 size={16} className="inline mr-2" />
                  Editor Width
                </label>
                <div className="flex gap-2">
                  {editorWidths.map((width) => (
                    <button
                      key={width.value}
                      onClick={() => onSetEditorWidth(width.value)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${settings.editorWidth === width.value
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                    >
                      {width.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  Controls the maximum width of the note editor area.
                </p>
              </div>
            </>
          )}

          {activeTab === 'tags' && (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">Tag management coming soon.</p>
              <p className="text-xs mt-2">You can add and remove tags directly from notes.</p>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">Sync settings coming soon.</p>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">Data management coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

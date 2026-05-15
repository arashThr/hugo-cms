import React from 'react';
import { Check } from 'lucide-react';

interface SettingsViewProps {
  repos: any[];
  loadingRepos: boolean;
  settings: any;
  updateSettings: (settings: any) => void;
  setShowSettings: (show: boolean) => void;
  isInitialSetup?: boolean;
}

export function SettingsView({
  repos,
  loadingRepos,
  settings,
  updateSettings,
  setShowSettings,
  isInitialSetup = false,
}: SettingsViewProps) {
  return (
    <div className={`w-full max-w-[600px] bg-surface-container-lowest rounded-xl p-[24px] border border-outline-variant shadow-sm flex flex-col gap-[16px] ${isInitialSetup ? '' : 'mx-auto'}`}>
      {!isInitialSetup && (
        <div className="flex items-center gap-2 mb-2 md:hidden">
          <button onClick={() => setShowSettings(false)} className="text-on-surface-variant hover:text-on-surface flex items-center p-1 -ml-1 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined text-[20px]" data-icon="arrow_back">arrow_back</span>
          </button>
          <span className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Back to Contents</span>
        </div>
      )}
      <h2 className="font-headline-md text-[24px] text-primary">{isInitialSetup ? 'Select Repository' : 'Settings'}</h2>
      <p className="font-body-md text-on-surface-variant mb-4">Choose the GitHub repository where your Hugo site is hosted.</p>
      
      {loadingRepos ? (
        <div className="flex justify-center py-8 text-on-surface-variant">Loading your repositories...</div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 mb-4">
          {repos.map((repo) => (
            <button
              key={repo.id}
              className={`flex justify-between items-center p-4 rounded-lg border transition-all text-left ${settings.repository === repo.full_name ? 'border-primary bg-surface-container-low' : 'border-outline-variant hover:border-primary/50'}`}
              onClick={() => {
                updateSettings({ repository: repo.full_name });
                if (isInitialSetup) setShowSettings(false);
              }}
            >
              <span className="font-body-md font-medium text-on-surface">{repo.full_name}</span>
              {settings.repository === repo.full_name && <Check size={18} className="text-primary" />}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-outline-variant pt-6 mt-2 flex flex-col gap-[16px]">
        <h3 className="font-headline-md text-[18px] text-primary">Advanced Configuration</h3>
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Content Path</label>
          <input 
            type="text" 
            value={settings.contentPath}
            onChange={(e) => updateSettings({ contentPath: e.target.value })}
            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Image Path</label>
          <input 
            type="text" 
            value={settings.imagePath}
            onChange={(e) => updateSettings({ imagePath: e.target.value })}
            className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
}

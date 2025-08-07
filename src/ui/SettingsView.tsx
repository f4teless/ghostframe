import React from "react";
import { Save } from "lucide-react";

export interface AppSettings {
  provider: "gemini" | "openai" | "claude";
  apiKey: string;
  screenshotInterval: number;
  customInstructions: string;
  profileType: "default" | "custom";
}

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export const SettingsView = ({ settings, setSettings }: SettingsViewProps) => {
  const handleSave = async () => {
    await window.ghostframe.settings?.save(settings);
    await window.ghostframe.ai?.initialize?.({
      provider: settings.provider,
      apiKey: settings.apiKey,
      customPrompt: settings.customInstructions,
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          🧠 AI Configuration
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 items-center">
            <label htmlFor="provider" className="text-sm text-gray-300">
              Provider
            </label>
            <select
              id="provider"
              name="provider"
              value={settings.provider}
              onChange={handleInputChange}
              className="input-field col-span-2"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI GPT-4</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>
          <div className="grid grid-cols-3 items-center">
            <label htmlFor="apiKey" className="text-sm text-gray-300">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              name="apiKey"
              value={settings.apiKey}
              onChange={handleInputChange}
              placeholder="Enter your API key"
              className="input-field col-span-2"
            />
          </div>
          <div className="grid grid-cols-3 items-start">
            <label
              htmlFor="customInstructions"
              className="text-sm text-gray-300 pt-2"
            >
              Custom Instructions
            </label>
            <textarea
              id="customInstructions"
              name="customInstructions"
              value={settings.customInstructions}
              onChange={handleInputChange}
              rows={4}
              className="input-field col-span-2"
              placeholder="e.g., Respond in a formal tone."
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          ⚙️ Capture & Automation Config
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 items-center">
            <label
              htmlFor="screenshotInterval"
              className="text-sm text-gray-300"
            >
              Screenshot Interval (ms)
            </label>
            <input
              type="number"
              id="screenshotInterval"
              name="screenshotInterval"
              value={settings.screenshotInterval}
              onChange={handleInputChange}
              min="1000"
              step="500"
              className="input-field col-span-2"
            />
            <div className="col-span-3 flex space-x-2 mt-2">
              <button
                className="btn-secondary flex-1"
              >
                Start Auto Screenshots
              </button>
              <button
                className="btn-secondary flex-1"
              >
                Stop Auto Screenshots
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center">
            <label htmlFor="profileType" className="text-sm text-gray-300">
              Browser Profile
            </label>
            <select
              id="profileType"
              name="profileType"
              value={settings.profileType}
              onChange={handleInputChange}
              className="input-field col-span-2"
            >
              <option value="default">Default (Clean Profile)</option>
              <option value="custom">Custom (Use My Profile)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn-primary"
        >
          <Save className="w-5 h-5 mr-2" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
};

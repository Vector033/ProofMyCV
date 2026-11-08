import { SettingsTabs } from "./tabs";

export default function SettingsLayout({ children }: LayoutProps<"/app/settings">) {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-medium tracking-tight text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-600">Your sign-in, security and the data FactFit keeps about you.</p>
      <div className="mt-6">
        <SettingsTabs />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

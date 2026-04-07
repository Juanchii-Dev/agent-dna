import type { NavTab } from "./data";

type AppHeaderProps = {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  tabs: { id: NavTab; label: string }[];
};

export function AppHeader({ activeTab, onTabChange, tabs }: AppHeaderProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Agent DNA</p>
        <h1>Identidad portable entre IAs</h1>
      </div>
      <nav className="nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === activeTab ? "navButton active" : "navButton"}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

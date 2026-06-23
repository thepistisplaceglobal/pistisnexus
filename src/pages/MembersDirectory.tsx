import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Users, Filter } from "lucide-react";
import { UnitMembersManager } from "@/components/UnitMembersManager";

type UnitType = "department" | "cell" | "interest_group";

export function MembersDirectory() {
  const user = useAppStore((state) => state.user);
  
  // Default to CELL if the user is a cell leader or coordinator
  const defaultTab: UnitType = 
    (user?.role === "CELL_LEADER" || user?.role === "HOME_CELL_COORD") ? "cell" : 
    (user?.role === "INTEREST_GROUP_LEADER") ? "interest_group" : "department";

  const [activeTab, setActiveTab] = useState<UnitType>(defaultTab);

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
            Members Directory
          </h1>
          <p className="text-lilac/80 font-medium">Manage members and volunteers across units</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#120524] p-1.5 rounded-xl border border-white/10 overflow-x-auto w-full md:w-auto">
          {[
            { id: "department", label: "Departments" },
            { id: "cell", label: "Home Cells" },
            { id: "interest_group", label: "Interest Groups" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as UnitType)}
              className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-royal-purple text-white shadow-lg shadow-royal-purple/25"
                  : "text-lilac/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <section>
        <UnitMembersManager key={activeTab} unitType={activeTab} />
      </section>
    </div>
  );
}

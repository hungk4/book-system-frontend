import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === value);
  const filteredOptions = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 focus-within:ring-2 focus-within:ring-blue-500 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 cursor-pointer flex items-center justify-between transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate text-sm">
          {selectedOption ? selectedOption.name : placeholder}
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl flex flex-col overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-gray-200 dark:border-slate-600 flex items-center gap-2 bg-gray-50/50 dark:bg-slate-700/50">
            <Search size={14} className="text-gray-400 ml-2" />
            <input
              type="text"
              className="w-full py-1.5 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Gõ để tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${value === opt.id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-4 text-sm text-gray-500 text-center italic">
                Không tìm thấy kết quả phù hợp
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

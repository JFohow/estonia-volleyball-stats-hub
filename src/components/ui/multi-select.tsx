import { useEffect, useRef, useState } from "react";

export default function MultiSelect<T extends { value: string; label: string }>({
    options,
    value,
    onChange,
    placeholder,
    maxDisplay = 3,
    className = "",
    maxHeight = 200,
    searchable = true,
}: {
    options: T[];
    value: string[];
    onChange: (vals: string[]) => void;
    placeholder?: string;
    maxDisplay?: number;
    className?: string;
    maxHeight?: number;
    searchable?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const toggleValue = (v: string) => {
        if (value.includes(v)) {
            onChange(value.filter((x) => x !== v));
        } else {
            onChange([...value.filter((x) => x !== "all"), v]);
        }
    };

    const clear = () => onChange([]);

    const filtered = options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((s) => !s)}
                className="w-full text-left rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm"
            >
                <div className="flex items-center gap-2">
                    <div className="flex-1 truncate text-slate-700">
                        {value.length === 0 || (value.length === 1 && value[0] === "all") ? (
                            <span className="text-slate-400">{placeholder ?? "Select..."}</span>
                        ) : (
                            <span className="inline-flex items-center gap-2">
                                {options
                                    .filter((o) => value.includes(o.value))
                                    .slice(0, maxDisplay)
                                    .map((o) => (
                                        <span key={o.value} className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">
                                            {o.label}
                                        </span>
                                    ))}
                                {value.length > maxDisplay && <span className="text-[11px] text-slate-500">+{value.length - maxDisplay}</span>}
                            </span>
                        )}
                    </div>
                    <div className="text-slate-400 text-xs">▾</div>
                </div>
            </button>

            {open && (
                <div className="absolute left-0 right-0 z-50 mt-2 rounded-md border border-slate-200 bg-white shadow-lg">
                    <div className="p-2">
                        {searchable && (
                            <input
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Search"
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm outline-none"
                            />
                        )}

                        <div className="mt-2 max-h-48 overflow-auto">
                            <div className="p-1">
                                <button
                                    type="button"
                                    onClick={() => onChange(["all"])}
                                    className="w-full rounded-md px-2 py-1 text-left text-[12px] text-slate-600 hover:bg-slate-50"
                                >
                                    All
                                </button>
                            </div>

                            {filtered.map((o) => (
                                <label key={o.value} className="flex w-full cursor-pointer items-center gap-2 px-2 py-1 hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={value.includes(o.value)}
                                        onChange={() => toggleValue(o.value)}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm text-slate-700">{o.label}</span>
                                </label>
                            ))}

                            {filtered.length === 0 && <div className="p-2 text-sm text-slate-400">No options</div>}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                            <button type="button" onClick={() => { setFilter(""); clear(); }} className="text-xs text-slate-500">Clear</button>
                            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

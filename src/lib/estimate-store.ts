import { useSyncExternalStore } from "react";

export type BillLine = {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  qty: number;
  unit?: string;
  custom?: boolean;
};

export type BillMeta = {
  billNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  received: number;
};

export type SavedBill = {
  id: string;
  savedAt: string;
  meta: BillMeta;
  lines: BillLine[];
};

/** Pure total math so it can be tested and reused. */
export function computeTotals(
  subtotal: number,
  mode: "percent" | "amount",
  value: number,
): { discount: number; total: number } {
  const safeValue = Math.max(value, 0);
  const discount =
    mode === "percent"
      ? Math.min(subtotal, (subtotal * Math.min(safeValue, 100)) / 100)
      : Math.min(subtotal, safeValue);
  return { discount, total: subtotal - discount };
}

const LINES_KEY = "plaza-estimate-v1";
const META_KEY = "plaza-estimate-meta-v1";
const BILLS_KEY = "plaza-bills-v1";

function makeBillNo(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  return `PLZ-${stamp}-${Math.floor(100 + Math.random() * 900)}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const emptyMeta: BillMeta = {
  billNo: "",
  date: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  notes: "",
  received: 0,
};

type Store<T> = {
  get: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
};

function createStore<T>(key: string, initial: T): Store<T> {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      /* keep initial */
    }
  }

  return {
    get() {
      load();
      return value;
    },
    set(next) {
      value = next;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      load();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const linesStore = createStore<BillLine[]>(LINES_KEY, []);
const metaStore = createStore<BillMeta>(META_KEY, emptyMeta);
const billsStore = createStore<SavedBill[]>(BILLS_KEY, []);

// Generate a bill number / date once, on the client, and keep it persisted.
let metaInitialised = false;
function ensureMeta() {
  const meta = metaStore.get();
  if (metaInitialised || (meta.billNo && meta.date)) {
    metaInitialised = true;
    return;
  }
  metaInitialised = true;
  metaStore.set({ ...meta, billNo: meta.billNo || makeBillNo(), date: meta.date || todayISO() });
}

const emptyLines: BillLine[] = [];
const emptyMetaSnapshot: BillMeta = { ...emptyMeta };
const emptyBills: SavedBill[] = [];

export function useBill(): BillLine[] {
  return useSyncExternalStore(linesStore.subscribe, linesStore.get, () => emptyLines);
}

export function useBillMeta(): BillMeta {
  return useSyncExternalStore(metaStore.subscribe, metaStore.get, () => emptyMetaSnapshot);
}

export function useSavedBills(): SavedBill[] {
  return useSyncExternalStore(billsStore.subscribe, billsStore.get, () => emptyBills);
}

let customCounter = 0;

export function getBillLines(): BillLine[] {
  return linesStore.get();
}

export const bill = {
  add(item: { id: string; code: string; name: string; rate: number }, qty = 1) {
    const lines = linesStore.get();
    const existing = lines.find((line) => line.id === item.id);
    linesStore.set(
      existing
        ? lines.map((line) => (line.id === item.id ? { ...line, qty: line.qty + qty } : line))
        : [
            ...lines,
            {
              id: item.id,
              code: item.code,
              name: item.name,
              unitPrice: item.rate,
              qty,
            },
          ],
    );
  },
  addCustom(name: string, unitPrice: number, qty: number) {
    customCounter += 1;
    linesStore.set([
      ...linesStore.get(),
      {
        id: `custom-${Date.now()}-${customCounter}`,
        code: "",
        name,
        unitPrice,
        qty,
        custom: true,
      },
    ]);
  },
  update(
    id: string,
    patch: Partial<Pick<BillLine, "qty" | "unitPrice" | "name" | "unit">>,
  ) {
    linesStore.set(
      linesStore.get().map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  },
  remove(id: string) {
    linesStore.set(linesStore.get().filter((line) => line.id !== id));
  },
  clear() {
    linesStore.set([]);
    metaInitialised = false;
    metaStore.set({ ...emptyMeta, billNo: makeBillNo(), date: todayISO() });
  },
  setMeta(patch: Partial<BillMeta>) {
    metaStore.set({ ...metaStore.get(), ...patch });
  },
  saveCurrent(): SavedBill {
    const saved: SavedBill = {
      id: `saved-${Date.now()}`,
      savedAt: new Date().toISOString(),
      meta: { ...metaStore.get() },
      lines: [...linesStore.get()],
    };
    const rest = billsStore.get().filter((entry) => entry.id !== saved.id);
    billsStore.set([saved, ...rest].slice(0, 50));
    return saved;
  },
  loadSaved(id: string) {
    const found = billsStore.get().find((entry) => entry.id === id);
    if (!found) return;
    linesStore.set(found.lines.map((line) => ({ ...line })));
    metaStore.set({ ...found.meta });
    metaInitialised = true;
  },
  deleteSaved(id: string) {
    billsStore.set(billsStore.get().filter((entry) => entry.id !== id));
  },
};

// Kick off client-side bill number generation on first read.
ensureMeta();

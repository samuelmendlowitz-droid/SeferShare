import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

export type DetailEntityType = 'campaign' | 'institution' | 'neshama' | 'sefer';

export interface DetailStackEntry {
  type: DetailEntityType;
  id: string;
}

interface DetailStackContextValue {
  stack: DetailStackEntry[];
  /** Opens a popup for the given entity. If the current frontmost popup is a
   *  campaign, this stacks on top of it (the campaign stays frozen behind). If
   *  the frontmost popup is anything else (institution/neshama/sefer), this
   *  replaces it instead — see DetailStackProvider for the full rule. */
  open: (type: DetailEntityType, id: string) => void;
  /** Closes the frontmost popup, revealing whatever was behind it (or nothing). */
  closeTop: () => void;
  /** Closes every popup at once. */
  closeAll: () => void;
}

const DetailStackContext = createContext<DetailStackContextValue | undefined>(undefined);

const PARAM_KEY = 'popup';
const VALID_TYPES: DetailEntityType[] = ['campaign', 'institution', 'neshama', 'sefer'];

function isValidType(value: string): value is DetailEntityType {
  return (VALID_TYPES as string[]).includes(value);
}

function parseStack(raw: string | null): DetailStackEntry[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((part): DetailStackEntry | null => {
      const [type, id] = part.split(':');
      return type && id && isValidType(type) ? { type, id } : null;
    })
    .filter((entry): entry is DetailStackEntry => entry !== null);
}

function serializeStack(stack: DetailStackEntry[]): string {
  return stack.map((entry) => `${entry.type}:${entry.id}`).join(',');
}

/**
 * Backs the full-screen Campaign/Institution/Neshama/Sefer popups (see
 * src/components/details/). The whole stack lives in a single `?popup=` query
 * param (comma-separated `type:id` pairs) written with `{ replace: true }` —
 * refreshing or sharing a URL reopens the same stack, but the browser's own
 * Back button is not wired to pop it (only the popup's own X button does; see
 * the redesign plan for why this scope was chosen).
 *
 * Stacking rule: opening a new popup while a campaign is frontmost pushes on
 * top of it (freezing the campaign behind); opening one while anything else is
 * frontmost replaces it. This one rule reproduces both behaviors from the
 * spec, including chained cases (campaign -> institution -> neshama: the
 * neshama replaces the institution, while the original campaign stays frozen
 * underneath both).
 */
export function DetailStackProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const stack = useMemo(() => parseStack(searchParams.get(PARAM_KEY)), [searchParams]);

  function writeStack(next: DetailStackEntry[]) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next.length === 0) {
          params.delete(PARAM_KEY);
        } else {
          params.set(PARAM_KEY, serializeStack(next));
        }
        return params;
      },
      { replace: true },
    );
  }

  function open(type: DetailEntityType, id: string) {
    const top = stack[stack.length - 1];
    const next = !top || top.type === 'campaign' ? [...stack, { type, id }] : [...stack.slice(0, -1), { type, id }];
    writeStack(next);
  }

  function closeTop() {
    writeStack(stack.slice(0, -1));
  }

  function closeAll() {
    writeStack([]);
  }

  return <DetailStackContext.Provider value={{ stack, open, closeTop, closeAll }}>{children}</DetailStackContext.Provider>;
}

export function useDetailStack(): DetailStackContextValue {
  const ctx = useContext(DetailStackContext);
  if (!ctx) throw new Error('useDetailStack must be used within DetailStackProvider');
  return ctx;
}

// Response-related state atoms

import { atom } from 'jotai';
import { HttpResponse } from '@/types';

// Current response data
export const currentResponseAtom = atom<HttpResponse | null>(null);

// Response history (last N responses)
export const responseHistoryAtom = atom<HttpResponse[]>([]);

// Add response to history
export const addResponseToHistoryAtom = atom(
  null,
  (get, set, response: HttpResponse) => {
    const history = get(responseHistoryAtom);
    // Keep last 50 responses
    const newHistory = [response, ...history].slice(0, 50);
    set(responseHistoryAtom, newHistory);
  }
);

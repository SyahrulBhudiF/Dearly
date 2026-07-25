const key = (date: string) => `dearly:draft:${date}`;

export const readDraft = (date: string) => localStorage.getItem(key(date));
export const writeDraft = (date: string, text: string) => localStorage.setItem(key(date), text);
export const removeDraft = (date: string) => localStorage.removeItem(key(date));

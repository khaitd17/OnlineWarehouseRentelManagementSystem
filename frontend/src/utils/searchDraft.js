const SEARCH_DRAFT_KEY = 'warehouseSearchDraft';

export const readSearchDraft = () => {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(SEARCH_DRAFT_KEY)) || {};
  } catch {
    return {};
  }
};

export const writeSearchDraft = (partial) => {
  if (typeof localStorage === 'undefined') return {};
  const current = readSearchDraft();
  const next = { ...current, ...partial };
  Object.keys(next).forEach((key) => {
    if (next[key] === undefined) delete next[key];
  });
  localStorage.setItem(SEARCH_DRAFT_KEY, JSON.stringify(next));
  return next;
};

let _token: string | null = null;
let _clearAuth: (() => void) | null = null;

export const tokenStore = {
  get: () => _token,
  set: (t: string | null) => { _token = t; },
  setClearAuth: (fn: () => void) => { _clearAuth = fn; },
  clear: () => { _clearAuth?.(); _token = null; },
};

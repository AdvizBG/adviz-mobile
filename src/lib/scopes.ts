export const hasScope = (scopes: string[], scope: string): boolean =>
  scopes.includes(scope);

export const isMentor = (scopes: string[]): boolean =>
  hasScope(scopes, 'mentor:me');

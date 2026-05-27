export const hasScope = (scopes: string[] | undefined | null, scope: string): boolean =>
  scopes?.includes(scope) ?? false;

export const isMentor = (scopes: string[]): boolean =>
  hasScope(scopes, 'mentor:me');

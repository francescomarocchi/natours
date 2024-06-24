export class ForCookie<T> {
  constructor(
    public readonly payload: T,
    public readonly token: string,
    public readonly expiration: number
  ) { }
}

export function isForCookie(obj: unknown): boolean {
  return obj instanceof ForCookie;
}

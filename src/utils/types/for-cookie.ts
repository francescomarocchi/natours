export class ForCookie<T> {
  constructor(
    public readonly payload: T,
    public readonly token: string,
  ) { }
}

export function isForCookie(obj: unknown) {
  return obj instanceof ForCookie;
}

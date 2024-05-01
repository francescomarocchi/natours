export class PugTemplate {
  constructor(
    public readonly template: string,
    public readonly data?: unknown,
  ) { }
}

export const isPugTemplate = (obj: unknown) => obj instanceof PugTemplate;

export abstract class AppAPIError extends Error {
  abstract readonly status: number;
  protected result: unknown = null;

  constructor(msg?: string, result?: unknown) {
    super(msg);
    this.result = result;
    Object.setPrototypeOf(this, AppAPIError.prototype);
    this.name = this.constructor.name;
  }

  public getStatus(): number {
    return this.status;
  }

  public getResult(): unknown {
    return this.result;
  }
}

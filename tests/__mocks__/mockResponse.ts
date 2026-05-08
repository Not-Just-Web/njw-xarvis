// Shared mock Response for Node/vitest environments
export class MockResponse {
  status: number;
  private _json: any;
  constructor(body: string | object, opts: { status: number }) {
    this.status = opts.status;
    if (typeof body === 'string') {
      try {
        this._json = JSON.parse(body);
      } catch {
        this._json = body;
      }
    } else {
      this._json = body;
    }
  }
  get ok() { return this.status === 200; }
  async json() { return this._json; }
}

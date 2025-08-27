// A dedicated file for custom error classes that can be shared
// between the client and the server.

export class HttpError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'HttpError';
  }
}
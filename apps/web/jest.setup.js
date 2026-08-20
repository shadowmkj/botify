require('@testing-library/jest-dom');

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url;
      this.headers = new Headers(init.headers || {});
      this.method = init.method || 'GET';
      this.body = init.body;
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.headers = new Headers(init.headers || {});
    }
    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
    async text() {
      return String(this._body);
    }
  };
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {};
      if (init) {
        Object.entries(init).forEach(([k, v]) => {
          this._headers[k.toLowerCase()] = String(v);
        });
      }
    }
    get(name) {
      return this._headers[name.toLowerCase()] || null;
    }
    set(name, value) {
      this._headers[name.toLowerCase()] = String(value);
    }
  };
}
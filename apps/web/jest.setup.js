require('@testing-library/jest-dom');

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (typeof global.Headers === 'undefined' || !global.Headers.prototype.get) {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {};
      if (init) {
        if (init instanceof Headers) {
          Object.assign(this._headers, init._headers);
        } else if (Array.isArray(init)) {
          init.forEach(([k, v]) => {
            this._headers[String(k).toLowerCase()] = String(v);
          });
        } else {
          Object.entries(init).forEach(([k, v]) => {
            this._headers[String(k).toLowerCase()] = String(v);
          });
        }
      }
    }
    get(name) {
      return this._headers[String(name).toLowerCase()] || null;
    }
    set(name, value) {
      this._headers[String(name).toLowerCase()] = String(value);
    }
    has(name) {
      return String(name).toLowerCase() in this._headers;
    }
  };
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url;
      this.headers = new Headers(init.headers || {});
      this.method = init.method || 'GET';
      this.body = init.body;
    }
    async text() {
      return typeof this.body === 'string' ? this.body : (this.body ? this.body.toString() : '');
    }
    async arrayBuffer() {
      const str = await this.text();
      const buf = Buffer.from(str);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    async json() {
      const str = await this.text();
      return JSON.parse(str);
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

if (!global.Response.json) {
  global.Response.json = function (data, init = {}) {
    const res = new global.Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.headers || {}),
      },
    });
    res._data = data;
    res.json = async () => data;
    return res;
  };
}
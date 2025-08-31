import { createServer } from 'http';
import { Server } from 'socket.io';

jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn(),
  })),
}));

jest.mock('socket.io');

describe('Socket Server', () => {
  it('should create an http server and a socket.io server', () => {
    require('../server');
    expect(createServer).toHaveBeenCalled();
    expect(Server).toHaveBeenCalled();
  });
});

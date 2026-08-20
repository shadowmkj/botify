import fs from 'fs';
import path from 'path';
import logger, { logToFile } from '../src/utils/logger';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  appendFileSync: jest.fn(),
}));

describe('wserver logger utils', () => {
  it('should export a valid pino logger', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should append log message to file with timestamp', () => {
    logToFile({ message: 'Test log message' });
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.stringContaining('logs.txt'),
      expect.stringContaining('Test log message\n')
    );
  });
});

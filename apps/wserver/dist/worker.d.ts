import NodeCache from 'node-cache';

declare const sessions: Map<any, any>;
declare const msgRetryCounterCache: NodeCache;

export { msgRetryCounterCache, sessions };

import {
  DEFAULT_TRPC_PATH,
  DEFAULT_TRPC_TRACE_HEADER,
} from './common/trpc-context';

export default () => ({
  trpc: {
    path: process.env.TRPC_PATH ?? DEFAULT_TRPC_PATH,
    traceHeader: process.env.TRPC_TRACE_HEADER ?? DEFAULT_TRPC_TRACE_HEADER,
  },
});

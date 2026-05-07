import app from '../connector-api/src/index';

type MutableRequest = {
  url?: string;
};

type AppHandler = (req: MutableRequest, res: unknown) => unknown;

export default function handler(req: MutableRequest, res: unknown): unknown {
  const originalUrl = req.url ?? '/';
  req.url = originalUrl.replace(/^\/api/, '') || '/';
  const expressHandler = app as unknown as AppHandler;
  return expressHandler(req, res);
}

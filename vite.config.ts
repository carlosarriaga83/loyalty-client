import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Local API Serverless Middleware Plugin for local testing
function localApiPlugin() {
  return {
    name: 'local-api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
          const query = Object.fromEntries(urlObj.searchParams);

          let body = req.body;
          if (!body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
            const chunks: any[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            if (chunks.length > 0) {
              const rawBody = Buffer.concat(chunks).toString();
              try {
                body = JSON.parse(rawBody);
              } catch {
                body = rawBody;
              }
            } else {
              body = {};
            }
          }

          const customRes: any = res;
          customRes.status = (code: number) => {
            res.statusCode = code;
            return customRes;
          };
          customRes.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };
          customRes.send = (data: any) => {
            res.end(data);
          };
          customRes.redirect = (a: any, b?: any) => {
            const statusCode = typeof a === 'number' ? a : 302;
            const redirectUrl = typeof a === 'string' ? a : b;
            res.statusCode = statusCode;
            res.setHeader('Location', redirectUrl);
            res.end();
          };

          const customReq = {
            method: req.method,
            headers: req.headers,
            query,
            body: body || {},
            url: req.url
          };

          if (urlObj.pathname.startsWith('/api/generate-pass')) {
            const { default: handler } = await server.ssrLoadModule('./api/generate-pass.ts');
            await handler(customReq, customRes);
            return;
          }

          if (urlObj.pathname.startsWith('/api/v1/')) {
            const { default: handler } = await server.ssrLoadModule('./api/v1/apple.ts');
            await handler(customReq, customRes);
            return;
          }

          if (urlObj.pathname.startsWith('/api/generate-google-pass') || urlObj.pathname.startsWith('/api/google-wallet')) {
            const { default: handler } = await server.ssrLoadModule('./api/generate-google-pass.ts');
            await handler(customReq, customRes);
            return;
          }

          if (urlObj.pathname.startsWith('/api/broadcast-google-push')) {
            const { default: handler } = await server.ssrLoadModule('./api/broadcast-google-push.ts');
            await handler(customReq, customRes);
            return;
          }

          if (urlObj.pathname.startsWith('/api/broadcast-push')) {
            const { default: handler } = await server.ssrLoadModule('./api/broadcast-push.ts');
            await handler(customReq, customRes);
            return;
          }

          if (urlObj.pathname.startsWith('/api/push-update')) {
            const { default: handler } = await server.ssrLoadModule('./api/push-update.ts');
            await handler(customReq, customRes);
            return;
          }

          next();
        } catch (err: any) {
          console.error('Local API middleware error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message, stack: err.stack }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load local env files into process.env for API handlers
  const env = loadEnv(mode, process.cwd(), '');
  const rootEnv = loadEnv(mode, path.resolve(process.cwd(), './'), '');
  Object.assign(process.env, rootEnv, env);

  return {
    plugins: [
      react(),
      localApiPlugin()
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
    }
  };
});


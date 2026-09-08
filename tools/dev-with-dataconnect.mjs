import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

function terminate(child) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  if (process.platform === 'win32' && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }
  child.kill('SIGTERM');
}

export function createDevStack({
  spawnProcess = spawn,
  terminateProcess = terminate,
  cwd = root,
  env = process.env,
  backendPort = Number(env.BACKEND_PORT ?? 3000),
  previewPort = Number(env.PREVIEW_PORT ?? 8080),
} = {}) {
  const sharedEnv = {
    ...env,
    DATA_CONNECT_EMULATOR_HOST: '127.0.0.1:9399',
    FIREBASE_DATA_CONNECT_EMULATOR_HOST: 'http://127.0.0.1:9399',
    NEXT_PUBLIC_DATA_CONNECT_EMULATOR_HOST: '127.0.0.1',
    ITI_IA_DATASET: env.ITI_IA_DATASET ?? 'amazon-bestsellers-500',
  };
  const children = [];
  const start = (command, args, extraEnv = {}) => {
    const child = spawnProcess(command, args, {
      cwd,
      env: { ...sharedEnv, ...extraEnv },
      stdio: 'inherit',
      windowsHide: true,
    });
    children.push(child);
    return child;
  };

  start(process.execPath, ['scripts/local-stack.mjs'], { LOCAL_STACK_KEEP: '1' });
  start(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--turbopack', '--hostname', '127.0.0.1', '--port', String(backendPort)]);
  start(process.execPath, ['tools/static-server.mjs', String(previewPort)], {
    ITI_IA_BACKEND_ORIGIN: `http://127.0.0.1:${backendPort}`,
  });

  let stopped = false;
  return {
    children,
    shutdown() {
      if (stopped) return;
      stopped = true;
      children.forEach(terminateProcess);
    },
  };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const stack = createDevStack();
  let stopping = false;
  const shutdown = (code = 0) => {
    if (stopping) return;
    stopping = true;
    stack.shutdown();
    process.exitCode = code;
  };

  process.once('SIGINT', () => shutdown());
  process.once('SIGTERM', () => shutdown());
  stack.children.forEach((child) => {
    child.once('error', () => shutdown(1));
    child.once('exit', (code, signal) => {
      if (!stopping) shutdown(signal ? 1 : code ?? 1);
    });
  });
  const origin = `http://127.0.0.1:${process.env.PREVIEW_PORT ?? 8080}`;
  console.log('Iniciando emulador, catálogo e Iti IA…');
  const deadline = Date.now() + 180_000;
  while (!stopping && Date.now() < deadline) {
    try {
      const catalog = await fetch(`${origin}/api/catalog?limit=1`, { signal: AbortSignal.timeout(90_000) });
      if (!catalog.ok) throw new Error('Catálogo pendiente');
      const catalogData = await catalog.json();
      if (!Array.isArray(catalogData.books)) throw new Error('Respuesta de catálogo inválida');
      const ai = await fetch(`${origin}/api/ai/iti-ia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { messages: [{ role: 'user', content: [{ text: '?' }] }] } }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!ai.ok || !Array.isArray((await ai.json()).result)) throw new Error('Iti IA pendiente');
      const mode = catalogData.mode === 'test' ? 'datos de prueba, no inventario' : 'inventario configurado';
      console.log(`Vista local lista: ${origin} · catálogo e Iti IA disponibles · ${mode}.`);
      break;
    } catch {
      if (Date.now() >= deadline) {
        console.error('El arranque local no completó la comprobación de catálogo e Iti IA. Revisa el error del servicio antes de abrir la vista.');
        shutdown(1);
      } else await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

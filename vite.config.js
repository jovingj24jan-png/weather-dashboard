import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

// Builds dist/sw.js from pwa/service-worker.template.js with the exact list of
// files this build produced, and a version derived from them (so a new
// deployment always installs a new worker and drops the old cache).
function serviceWorker() {
  let publicDir = 'public';
  return {
    name: 'weather-dashboard-service-worker',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      // .woff fallbacks are skipped: every browser with service workers uses .woff2.
      const built = Object.keys(bundle).filter(
        (file) => file !== 'index.html' && !file.endsWith('.map') && !file.endsWith('.woff'),
      );
      const copied = listFiles(publicDir).map((file) => relative(publicDir, file).replaceAll('\\', '/'));
      const precache = ['./', ...built, ...copied];
      const template = readFileSync('pwa/service-worker.template.js', 'utf8');
      const version = createHash('sha256').update(JSON.stringify(precache)).update(template).digest('hex').slice(0, 12);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache, null, 2)),
      });
    },
  };
}

// GitHub Pages serves the site from /weather-dashboard/; dev stays at /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/weather-dashboard/' : '/',
  plugins: [react(), serviceWorker()],
}));

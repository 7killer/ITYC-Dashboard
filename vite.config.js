import { defineConfig, loadEnv } from 'vite';
import { access, copyFile, mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const BACKGROUND_FILES = ['backGroundLight.png', 'backGroundDark.png'];

function getBrandingProfile(mode) {
  return /(^|[-_])pve($|[-_])/.test(mode) ? 'pve' : 'ityc';
}

function extensionBrandingPlugin(mode) {
  const profile = getBrandingProfile(mode);
  const profileEnv = loadEnv(profile, process.cwd(), '');
  const modeEnv = loadEnv(mode, process.cwd(), '');
  const env = { ...profileEnv, ...modeEnv };
  const brandingDir = env.VITE_BRANDING_DIR || 'branding/ityc';

  return {
    name: 'ityc-extension-branding',
    apply: 'build',
    async closeBundle() {
      const outDir = path.resolve(process.cwd(), 'dist');
      const manifestPath = path.join(outDir, 'manifest.json');
      try {
        await access(manifestPath);
      } catch {
        this.warn('dist/manifest.json missing; branding manifest patch skipped.');
        return;
      }

      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

      manifest.name = env.VITE_EXTENSION_NAME || manifest.name;
      manifest.short_name = env.VITE_EXTENSION_SHORT_NAME || manifest.short_name;
      manifest.description = env.VITE_EXTENSION_DESCRIPTION || manifest.description;

      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

      const srcDir = path.resolve(process.cwd(), brandingDir);
      const destDir = path.join(outDir, 'img');
      await mkdir(destDir, { recursive: true });

      for (const fileName of BACKGROUND_FILES) {
        const src = path.join(srcDir, fileName);
        const dest = path.join(destDir, fileName);

        try {
          await access(src);
          await copyFile(src, dest);
        } catch {
          this.warn(`Branding background missing: ${path.relative(process.cwd(), src)}`);
        }
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  return {
    base: '',
    plugins: [
      extensionBrandingPlugin(mode),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@background': path.resolve(__dirname, 'src/background'),
        '@webapp': path.resolve(__dirname, 'src/dashboard'),
        'leaflet-velocity': path.resolve(
          __dirname,
          'vendor/leaflet-velocity'
        ),
      }
    },
    build: {
      minify: mode === 'production',
      sourcemap: mode !== 'production',
      rollupOptions: {
        input: {
          app: '/dashboard.html',
          worker: 'src/background/worker.js',
          offscreen: '/offscreen.html'
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'worker') return 'assets/background.js';
            return 'assets/[name].js';
          },
        }
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
  };
});

import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import * as path from 'node:path';

const config: ForgeConfig = {
  packagerConfig: {
    appBundleId: 'com.gkaragkiaouris.popaway',
    asar: {
      unpack: '**/{.**,**}/**/popaway-cli',
    },
    icon: 'images/icon',
    osxSign: {
      optionsForFile: (filePath) => {
        if (filePath.endsWith('PopAway.app')) {
          return {
            entitlements: path.resolve(__dirname, './entitlements.plist'),
            hardenedRuntime: true,
          }
        }
        if (filePath.endsWith('PopAway Helper (GPU).app')) {
          return {
            entitlements: path.resolve(__dirname, './entitlements.gpu.plist'),
            hardenedRuntime: true,
          }
        }
        if (filePath.endsWith('PopAway Helper (Plugin).app')) {
          return {
            entitlements: path.resolve(__dirname, './entitlements.plugin.plist'),
            hardenedRuntime: true,
          }
        }
        if (filePath.endsWith('PopAway Helper (Renderer).app')) {
          return {
            entitlements: path.resolve(__dirname, './entitlements.renderer.plist'),
            hardenedRuntime: true,
          }
        }
        if (filePath.endsWith('PopAway Helper.app')) {
          return {
            entitlements: path.resolve(__dirname, './entitlements.renderer.plist'),
            hardenedRuntime: true,
          }
        }
        return {
          entitlements: path.resolve(__dirname, './entitlements.plist'),
          hardenedRuntime: true,
        }
      },
    },
    osxNotarize: {
      keychainProfile: 'gkaragkiaouris'
    }
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.mjs',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'karaggeorge',
          name: 'PopAway',
        },
        prerelease: true,
      },
    }
  ]
};

export default config;

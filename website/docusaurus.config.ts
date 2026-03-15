import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'nest-trpc-native',
  tagline: 'Decorator-first tRPC integration for NestJS with full Nest lifecycle support',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://rodrigobnogueira.github.io',
  baseUrl: '/nest-trpc-native/',

  organizationName: 'rodrigobnogueira',
  projectName: 'nest-trpc-native',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/rodrigobnogueira/nest-trpc-native/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'nest-trpc-native',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.npmjs.com/package/nest-trpc-native',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/rodrigobnogueira/nest-trpc-native',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Getting Started', to: '/docs/introduction'},
            {label: 'Quick Start', to: '/docs/quick-start'},
            {label: 'Decorators', to: '/docs/decorators/router'},
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/rodrigobnogueira/nest-trpc-native',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/nest-trpc-native',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} nest-trpc-native contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

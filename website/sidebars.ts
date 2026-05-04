import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'introduction',
    'installation',
    'quick-start',
    {
      type: 'category',
      label: 'Support & Reference',
      items: [
        'support-policy',
        'reference/public-api',
        'reference/claims-matrix',
      ],
    },
    {
      type: 'category',
      label: 'Samples',
      items: [
        'samples/index',
        'samples/catalog',
        'samples/angular-showcase',
        'samples/architecture',
        'samples/how-to-review',
      ],
    },
    {
      type: 'category',
      label: 'Module Setup',
      items: ['module-setup/for-root', 'module-setup/for-root-async', 'module-setup/typed-context'],
    },
    {
      type: 'category',
      label: 'Decorators',
      items: [
        'decorators/router',
        'decorators/query-mutation',
        'decorators/subscription',
        'decorators/input',
        'decorators/ctx',
      ],
    },
    {
      type: 'category',
      label: 'Enhancers',
      items: [
        'enhancers/guards',
        'enhancers/interceptors',
        'enhancers/pipes',
        'enhancers/filters',
      ],
    },
    {
      type: 'category',
      label: 'Validation',
      items: ['validation/zod', 'validation/class-validator'],
    },
    {
      type: 'category',
      label: 'Testing & Errors',
      items: ['testing/router-testing', 'errors/idiomatic-errors'],
    },
    'schema-generation',
    'client-consumption',
    'express-and-fastify',
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/request-scope',
        'advanced/monorepo',
        'advanced/microservices',
        'advanced/middleware',
        'advanced/migration-from-rest-or-graphql',
        'advanced/transport-pattern-parallels',
        'advanced/error-handling',
        'advanced/production-practices',
        'advanced/security-responsibilities',
        'advanced/benchmark-methodology',
        'advanced/nest-internals',
      ],
    },
  ],
};

export default sidebars;

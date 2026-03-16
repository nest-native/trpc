import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'introduction',
    'installation',
    'quick-start',
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
    'express-and-fastify',
    {
      type: 'category',
      label: 'Advanced',
      items: [
        'advanced/request-scope',
        'advanced/monorepo',
        'advanced/microservices',
        'advanced/middleware',
        'advanced/error-handling',
        'advanced/nest-internals',
      ],
    },
  ],
};

export default sidebars;

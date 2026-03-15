import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Decorator-First',
    icon: '🎯',
    description: (
      <>
        Define routers, queries, mutations, and subscriptions using familiar
        NestJS decorators. No manual wiring needed.
      </>
    ),
  },
  {
    title: 'Full Nest Lifecycle',
    icon: '🔄',
    description: (
      <>
        Guards, interceptors, pipes, and filters work exactly as they do
        with HTTP controllers. Request scope included.
      </>
    ),
  },
  {
    title: 'Adapter-Agnostic',
    icon: '🔌',
    description: (
      <>
        Works with both Express and Fastify out of the box. Switch adapters
        without changing a single line of router code.
      </>
    ),
  },
  {
    title: 'Type-Safe End to End',
    icon: '🛡️',
    description: (
      <>
        Auto-generated AppRouter types with Zod schema inference. Full
        compile-time safety from server to client.
      </>
    ),
  },
  {
    title: 'Zero Dependencies',
    icon: '📦',
    description: (
      <>
        No hidden runtime dependencies. Pure bridge between NestJS and tRPC
        using only peer dependencies you already have.
      </>
    ),
  },
  {
    title: 'Zod Optional',
    icon: '✅',
    description: (
      <>
        Use tRPC-style Zod schemas or Nest-style class-validator DTOs.
        Choose what fits your project best.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md feature-card">
        <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>{icon}</div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

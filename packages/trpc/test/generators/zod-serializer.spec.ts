import { expect } from 'chai';
import { z } from 'zod';
import { serializeZodSchema } from '../../generators/zod-serializer';

describe('serializeZodSchema', () => {
  it('should serialize primitive types', () => {
    expect(serializeZodSchema(z.string())).to.equal('z.string()');
    expect(serializeZodSchema(z.number())).to.equal('z.number()');
    expect(serializeZodSchema(z.boolean())).to.equal('z.boolean()');
    expect(serializeZodSchema(z.bigint())).to.equal('z.bigint()');
    expect(serializeZodSchema(z.date())).to.equal('z.date()');
    expect(serializeZodSchema(z.undefined())).to.equal('z.undefined()');
    expect(serializeZodSchema(z.null())).to.equal('z.null()');
    expect(serializeZodSchema(z.void())).to.equal('z.void()');
    expect(serializeZodSchema(z.any())).to.equal('z.any()');
    expect(serializeZodSchema(z.unknown())).to.equal('z.unknown()');
    expect(serializeZodSchema(z.never())).to.equal('z.never()');
  });

  it('should serialize z.object()', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    expect(serializeZodSchema(schema)).to.equal(
      'z.object({ name: z.string(), age: z.number() })',
    );
  });

  it('should serialize nested objects', () => {
    const schema = z.object({
      user: z.object({ id: z.string() }),
    });
    expect(serializeZodSchema(schema)).to.equal(
      'z.object({ user: z.object({ id: z.string() }) })',
    );
  });

  it('should serialize object schemas when shape is exposed as a function', () => {
    const schema = {
      _def: {
        type: 'object',
        shape: () => ({ id: z.string(), count: z.number() }),
      },
    };

    expect(serializeZodSchema(schema)).to.equal(
      'z.object({ id: z.string(), count: z.number() })',
    );
  });

  it('should serialize z.array()', () => {
    expect(serializeZodSchema(z.array(z.string()))).to.equal(
      'z.array(z.string())',
    );
  });

  it('should serialize .optional()', () => {
    expect(serializeZodSchema(z.string().optional())).to.equal(
      'z.string().optional()',
    );
  });

  it('should serialize .nullable()', () => {
    expect(serializeZodSchema(z.string().nullable())).to.equal(
      'z.string().nullable()',
    );
  });

  it('should serialize z.enum()', () => {
    expect(serializeZodSchema(z.enum(['A', 'B', 'C']))).to.equal(
      'z.enum(["A","B","C"])',
    );
  });

  it('should serialize z.literal()', () => {
    expect(serializeZodSchema(z.literal('hello'))).to.equal(
      'z.literal("hello")',
    );
    expect(serializeZodSchema(z.literal(42))).to.equal('z.literal(42)');
    expect(serializeZodSchema(z.literal(true))).to.equal('z.literal(true)');
    expect(serializeZodSchema(z.literal(['red', 'green', 'blue']))).to.equal(
      'z.literal(["red","green","blue"])'
    );
  });

  it('should serialize z.union()', () => {
    expect(serializeZodSchema(z.union([z.string(), z.number()]))).to.equal(
      'z.union([z.string(), z.number()])',
    );
  });

  it('should serialize z.intersection()', () => {
    const a = z.object({ a: z.string() });
    const b = z.object({ b: z.number() });
    expect(serializeZodSchema(z.intersection(a, b))).to.equal(
      'z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() }))',
    );
  });

  it('should serialize z.tuple()', () => {
    expect(serializeZodSchema(z.tuple([z.string(), z.number()]))).to.equal(
      'z.tuple([z.string(), z.number()])',
    );
  });

  it('should serialize z.record()', () => {
    expect(serializeZodSchema(z.record(z.string(), z.number()))).to.equal(
      'z.record(z.string(), z.number())',
    );
  });

  it('should serialize z.default()', () => {
    const schema = z.string().default('hello');
    expect(serializeZodSchema(schema)).to.equal('z.string().default("hello")');
  });

  it('should serialize z.set()', () => {
    expect(serializeZodSchema(z.set(z.string()))).to.equal('z.set(z.string())');
  });

  it('should unwrap z.refine() effects to inner schema', () => {
    const schema = z.string().refine(val => val.length > 0);
    expect(serializeZodSchema(schema)).to.equal('z.string()');
  });

  it('should unwrap z.transform() effects to inner schema', () => {
    const schema = z.string().transform(val => parseInt(val, 10));
    expect(serializeZodSchema(schema)).to.equal('z.string()');
  });

  it('should fall back to z.any() for null/undefined input', () => {
    expect(serializeZodSchema(null)).to.equal('z.any()');
    expect(serializeZodSchema(undefined)).to.equal('z.any()');
  });

  it('should fall back to z.any() for z.lazy()', () => {
    const schema = z.lazy(() => z.string());
    expect(serializeZodSchema(schema)).to.equal('z.any()');
  });

  it('should quote non-identifier-safe object keys', () => {
    const schema = z.object({ 'my-key': z.string() });
    expect(serializeZodSchema(schema)).to.equal(
      'z.object({ "my-key": z.string() })',
    );
  });

  it('should serialize z.discriminatedUnion()', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('a'), value: z.string() }),
      z.object({ type: z.literal('b'), count: z.number() }),
    ]);
    const result = serializeZodSchema(schema);
    expect(result).to.include('z.discriminatedUnion("type"');
    expect(result).to.include('z.object({');
  });

  it('should serialize legacy discriminatedUnion schema nodes', () => {
    const schema = {
      _def: {
        type: 'discriminatedUnion',
        discriminator: 'type',
        options: [
          z.object({ type: z.literal('a'), value: z.string() }),
          z.object({ type: z.literal('b'), count: z.number() }),
        ],
      },
    };

    expect(serializeZodSchema(schema)).to.include('z.discriminatedUnion("type"');
  });

  it('should serialize z.tuple() with .rest()', () => {
    const schema = z.tuple([z.string(), z.number()]).rest(z.boolean());
    expect(serializeZodSchema(schema)).to.equal(
      'z.tuple([z.string(), z.number()]).rest(z.boolean())',
    );
  });

  it('should serialize z.map()', () => {
    expect(serializeZodSchema(z.map(z.string(), z.number()))).to.equal(
      'z.map(z.string(), z.number())',
    );
  });

  it('should serialize z.promise()', () => {
    expect(serializeZodSchema(z.promise(z.string()))).to.equal(
      'z.promise(z.string())',
    );
  });

  it('should serialize z.pipeline()', () => {
    const schema = z.string().pipe(z.coerce.number());
    expect(serializeZodSchema(schema)).to.equal('z.number()');
  });

  it('should serialize legacy pipeline schema nodes', () => {
    const schema = {
      _def: {
        type: 'pipeline',
        in: z.string(),
        out: z.number(),
      },
    };
    expect(serializeZodSchema(schema)).to.equal('z.number()');
  });

  it('should unwrap transform pipelines when out schema only exposes def', () => {
    const schema = {
      _def: {
        type: 'pipeline',
        in: z.string(),
        out: {
          def: { type: 'transform' },
        },
      },
    };
    expect(serializeZodSchema(schema)).to.equal('z.string()');
  });

  it('should serialize legacy effects schema nodes', () => {
    const schema = { _def: { type: 'effects', schema: z.string() } };
    expect(serializeZodSchema(schema)).to.equal('z.string()');
  });

  it('should serialize z.branded()', () => {
    const schema = z.string().brand<'UserId'>();
    expect(serializeZodSchema(schema)).to.equal('z.string()');
  });

  it('should serialize legacy branded schema nodes with innerType', () => {
    const schema = { _def: { type: 'branded', innerType: z.string() } };
    expect(serializeZodSchema(schema)).to.equal('z.string()');
  });

  it('should serialize legacy branded schema nodes with schema', () => {
    const schema = { _def: { type: 'branded', schema: z.string() } };
    expect(serializeZodSchema(schema)).to.equal('z.string()');
  });

  it('should fall back to z.any() for unsupported branded schema nodes', () => {
    const schema = { _def: { type: 'branded' } };
    expect(serializeZodSchema(schema)).to.equal('z.any()');
  });

  it('should serialize z.catch()', () => {
    const schema = z.string().catch('fallback');
    expect(serializeZodSchema(schema)).to.equal('z.string()');
  });

  it('should serialize .readonly()', () => {
    const schema = z.array(z.string()).readonly();
    expect(serializeZodSchema(schema)).to.equal(
      'z.array(z.string()).readonly()',
    );
  });

  it('should fall back to z.any() for unknown schema type', () => {
    const fakeSchema = { _def: { type: 'customfuturething' } };
    expect(serializeZodSchema(fakeSchema)).to.equal('z.any()');
  });

  it('should serialize legacy nativeEnum schema nodes as z.any()', () => {
    const schema = { _def: { type: 'nativeEnum' } };
    expect(serializeZodSchema(schema)).to.equal('z.any()');
  });
});

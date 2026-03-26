/**
 * Serializes a Zod schema runtime object back to its source-code representation.
 *
 * This is used by the schema generator to reconstruct `z.xxx()` calls
 * in the auto-generated AppRouter file.
 *
 * @internal
 */
export function serializeZodSchema(schema: any): string {
  if (!schema || !schema._def) {
    return 'z.any()';
  }

  const { type, typeName } = schema._def;
  const v4 = typeName === undefined;

  switch (v4 ? type : typeName) {
    case 'ZodString':
    case 'string':
      return 'z.string()';
    case 'ZodNumber':
    case 'number':
      return 'z.number()';
    case 'ZodBoolean':
    case 'boolean':
      return 'z.boolean()';
    case 'ZodBigInt':
    case 'bigint':
      return 'z.bigint()';
    case 'ZodDate':
    case 'date':
      return 'z.date()';
    case 'ZodUndefined':
    case 'undefined':
      return 'z.undefined()';
    case 'ZodNull':
    case 'null':
      return 'z.null()';
    case 'ZodVoid':
    case 'void':
      return 'z.void()';
    case 'ZodAny':
    case 'any':
      return 'z.any()';
    case 'ZodUnknown':
    case 'unknown':
      return 'z.unknown()';
    case 'ZodNever':
    case 'never':
      return 'z.never()';

    case 'ZodObject':
    case 'object': {
      const shape =
        typeof schema._def.shape === 'function'
          ? schema._def.shape()
          : schema._def.shape;
      const entries = Object.entries(shape)
        .map(([key, value]) => {
          const serialized = serializeZodSchema(value);
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
            ? key
            : JSON.stringify(key);
          return `${safeKey}: ${serialized}`;
        })
        .join(', ');
      return `z.object({ ${entries} })`;
    }

    case 'ZodArray':
    case 'array':
      return `z.array(${serializeZodSchema(v4 ? schema._def.element : schema._def.type)})`;

    case 'ZodOptional':
    case 'optional':
      return `${serializeZodSchema(schema._def.innerType)}.optional()`;

    case 'ZodNullable':
    case 'nullable':
      return `${serializeZodSchema(schema._def.innerType)}.nullable()`;

    case 'ZodDefault':
    case 'default': {
      const defaultValue = v4 ? schema._def.defaultValue : schema._def.defaultValue();
      return `${serializeZodSchema(schema._def.innerType)}.default(${JSON.stringify(defaultValue)})`;
    }

    case 'ZodEnum':
    case 'enum':
      return `z.enum(${JSON.stringify(v4 ? Object.values(schema._def.entries) : schema._def.values)})`;

    case 'ZodLiteral':
    case 'literal':
      return `z.literal(${JSON.stringify(
        v4
          ? schema._def.values.length > 1
            ? schema._def.values
            : schema._def.values[0]
          : schema._def.value,
      )})`;

    case 'ZodUnion':
    case 'union': {
      const options = schema._def.options
        .map((opt: any) => serializeZodSchema(opt))
        .join(', ');

      if (schema._def.discriminator !== undefined) {
        const discriminator = JSON.stringify(schema._def.discriminator);
        return `z.discriminatedUnion(${discriminator}, [${options}])`;
      }

      return `z.union([${options}])`;
    }

    case 'ZodDiscriminatedUnion':
    case 'discriminatedUnion': {
      const discriminator = JSON.stringify(schema._def.discriminator);
      const options = schema._def.options
        .map((opt: any) => serializeZodSchema(opt))
        .join(', ');
      return `z.discriminatedUnion(${discriminator}, [${options}])`;
    }

    case 'ZodIntersection':
    case 'intersection':
      return `z.intersection(${serializeZodSchema(schema._def.left)}, ${serializeZodSchema(schema._def.right)})`;

    case 'ZodTuple':
    case 'tuple': {
      const items = schema._def.items
        .map((item: any) => serializeZodSchema(item))
        .join(', ');
      const rest = schema._def.rest
        ? `.rest(${serializeZodSchema(schema._def.rest)})`
        : '';
      return `z.tuple([${items}])${rest}`;
    }

    case 'ZodRecord':
    case 'record':
      return `z.record(${serializeZodSchema(schema._def.keyType)}, ${serializeZodSchema(schema._def.valueType)})`;

    case 'ZodMap':
    case 'map':
      return `z.map(${serializeZodSchema(schema._def.keyType)}, ${serializeZodSchema(schema._def.valueType)})`;

    case 'ZodSet':
    case 'set':
      return `z.set(${serializeZodSchema(schema._def.valueType)})`;

    case 'ZodPromise':
    case 'promise':
      return `z.promise(${serializeZodSchema(v4 ? schema._def.innerType : schema._def.type)})`;

    case 'ZodEffects':
    case 'effects':
      // Effects (transform, refine, preprocess) — serialize the inner schema.
      // The effect itself is runtime-only and doesn't affect the type used for inference.
      return serializeZodSchema(schema._def.schema);

    case 'ZodLazy':
    case 'lazy':
      // Lazy schemas can't be serialized; fall back.
      return 'z.any()';

    case 'ZodPipeline':
    case 'pipeline':
    case 'pipe':
      // For type inference, use the output schema.
      if (v4 && schema._def.out.def.type === 'transform') {
        return serializeZodSchema(schema._def.in);
      }

      return serializeZodSchema(schema._def.out);

    case 'ZodBranded':
    case 'branded':
      return serializeZodSchema(schema._def.type);

    case 'ZodCatch':
    case 'catch':
      return serializeZodSchema(schema._def.innerType);

    case 'ZodReadonly':
    case 'readonly':
      return `${serializeZodSchema(schema._def.innerType)}.readonly()`;

    case 'ZodNativeEnum':
      // Native enums reference runtime values that can't be reconstructed.
      return 'z.any()';

    default:
      return 'z.any()';
  }
}

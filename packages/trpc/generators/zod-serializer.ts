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

  const { type } = schema._def;

  switch (type) {
    case 'string':
      return 'z.string()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'bigint':
      return 'z.bigint()';
    case 'date':
      return 'z.date()';
    case 'undefined':
      return 'z.undefined()';
    case 'null':
      return 'z.null()';
    case 'void':
      return 'z.void()';
    case 'any':
      return 'z.any()';
    case 'unknown':
      return 'z.unknown()';
    case 'never':
      return 'z.never()';

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

    case 'array':
      return `z.array(${serializeZodSchema(schema._def.element)})`;

    case 'optional':
      return `${serializeZodSchema(schema._def.innerType)}.optional()`;

    case 'nullable':
      return `${serializeZodSchema(schema._def.innerType)}.nullable()`;

    case 'default': {
      const defaultValue = schema._def.defaultValue;
      return `${serializeZodSchema(schema._def.innerType)}.default(${JSON.stringify(defaultValue)})`;
    }

    case 'enum':
      return `z.enum(${JSON.stringify(Object.values(schema._def.entries))})`;

    case 'literal': {
      const values = schema._def.values as any[];
      return `z.literal(${JSON.stringify(
        values.length > 1 ? values : values[0],
      )})`;
    }

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

    case 'discriminatedUnion': {
      const discriminator = JSON.stringify(schema._def.discriminator);
      const options = schema._def.options
        .map((opt: any) => serializeZodSchema(opt))
        .join(', ');
      return `z.discriminatedUnion(${discriminator}, [${options}])`;
    }

    case 'intersection':
      return `z.intersection(${serializeZodSchema(schema._def.left)}, ${serializeZodSchema(schema._def.right)})`;

    case 'tuple': {
      const items = schema._def.items
        .map((item: any) => serializeZodSchema(item))
        .join(', ');
      const rest = schema._def.rest
        ? `.rest(${serializeZodSchema(schema._def.rest)})`
        : '';
      return `z.tuple([${items}])${rest}`;
    }

    case 'record':
      return `z.record(${serializeZodSchema(schema._def.keyType)}, ${serializeZodSchema(schema._def.valueType)})`;

    case 'map':
      return `z.map(${serializeZodSchema(schema._def.keyType)}, ${serializeZodSchema(schema._def.valueType)})`;

    case 'set':
      return `z.set(${serializeZodSchema(schema._def.valueType)})`;

    case 'promise':
      return `z.promise(${serializeZodSchema(schema._def.innerType)})`;

    case 'effects':
      // Effects (transform, refine, preprocess) — serialize the inner schema.
      // The effect itself is runtime-only and doesn't affect the type used for inference.
      return serializeZodSchema(schema._def.schema);

    case 'lazy':
      // Lazy schemas can't be serialized; fall back.
      return 'z.any()';

    case 'pipeline':
    case 'pipe':
      // For type inference, use the output schema.
      // If the output side is a pure transform, preserve the input type schema.
      const outSchema = schema._def.out;
      const outDef = outSchema?._def ?? outSchema?.def;
      if (outDef?.type === 'transform') {
        return serializeZodSchema(schema._def.in);
      }

      return serializeZodSchema(outSchema);

    case 'branded':
      return serializeZodSchema(
        schema._def.innerType ?? schema._def.schema ?? schema._def.type,
      );

    case 'catch':
      return serializeZodSchema(schema._def.innerType);

    case 'readonly':
      return `${serializeZodSchema(schema._def.innerType)}.readonly()`;

    case 'nativeEnum':
      // Native enums reference runtime values that can't be reconstructed.
      return 'z.any()';

    default:
      return 'z.any()';
  }
}

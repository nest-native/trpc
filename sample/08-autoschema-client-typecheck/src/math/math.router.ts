import { Input, Query, Router } from 'nest-trpc-native';
import { parseSumInput, parseSumOutput } from './math.schema';

@Router('math')
export class MathRouter {
  @Query({ input: parseSumInput, output: parseSumOutput })
  sum(@Input() input: { a: number; b: number }) {
    return { result: input.a + input.b };
  }
}

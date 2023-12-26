declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface RecursiveHave extends RecursiveInclude {}

    interface RecursiveInclude {
      (pattern: ChaiRecursivePattern): Assertion;
      members(pattern: ChaiRecursivePattern): Assertion;
    }

    interface Recursive {
      equal(pattern: ChaiRecursivePattern): Assertion;
      equals(pattern: ChaiRecursivePattern): Assertion;
      eq(pattern: ChaiRecursivePattern): Assertion;
      eql(pattern: ChaiRecursivePattern): Assertion;
      eqls(pattern: ChaiRecursivePattern): Assertion;
      include: RecursiveInclude;
      includes: RecursiveInclude;
      have: RecursiveHave;
      has: RecursiveHave;
    }

    interface Assertion {
      recursive: Recursive;
    }
  }
}

export type ChaiRecursiveSinglePattern = {
  [key: string | number | symbol]:
    | ChaiRecursivePatternVal
    | ChaiRecursivePatternVal[]
    | ChaiRecursiveMathFn;
};

export type ChaiRecursivePattern = ChaiRecursiveSinglePattern | ChaiRecursiveSinglePattern[];

export type ChaiRecursiveMathFn = (to: Chai.Assertion) => Chai.Assertion;

type ChaiRecursivePatternVal =
  | string
  | number
  | boolean
  | symbol
  | bigint
  | undefined
  | null
  | object;

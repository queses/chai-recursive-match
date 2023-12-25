declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Assertion {
      recursive: {
        equal(pattern: ChaiMathPattern): Assertion;
        include(pattern: ChaiMathPattern): Assertion;
      };
    }
  }
}

export type ChaiMathSinglePattern = {
  [key: string | number | symbol]: ChaiMatchPatternVal | ChaiMatchPatternVal[] | ChaiMathFn;
};

export type ChaiMathPattern = ChaiMathSinglePattern | ChaiMathSinglePattern[];

export type ChaiMathFn = (to: Chai.Assertion) => Chai.Assertion;

type ChaiMatchPatternVal = string | number | boolean | symbol | bigint | undefined | null | object;

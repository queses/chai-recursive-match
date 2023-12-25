declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chai {
    interface Recursive {
      equal(pattern: ChaiMathPattern): Assertion;
      equals(pattern: ChaiMathPattern): Assertion;
      eq(pattern: ChaiMathPattern): Assertion;
      eql(pattern: ChaiMathPattern): Assertion;
      eqls(pattern: ChaiMathPattern): Assertion;
      include(pattern: ChaiMathPattern): Assertion;
      includes(pattern: ChaiMathPattern): Assertion;
    }

    interface Assertion {
      recursive: Recursive;
      rec: Recursive;
    }
  }
}

export type ChaiMathSinglePattern = {
  [key: string | number | symbol]: ChaiMatchPatternVal | ChaiMatchPatternVal[] | ChaiMathFn;
};

export type ChaiMathPattern = ChaiMathSinglePattern | ChaiMathSinglePattern[];

export type ChaiMathFn = (to: Chai.Assertion) => Chai.Assertion;

type ChaiMatchPatternVal = string | number | boolean | symbol | bigint | undefined | null | object;

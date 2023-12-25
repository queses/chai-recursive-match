import { AssertionError, expect, util } from 'chai';
import { ChaiMathPattern, ChaiMathSinglePattern } from './types';

export { ChaiMathPattern, ChaiMathFn } from './types';

export const chaiRecursive: Chai.ChaiPlugin = (chai, utils) => {
  const check = (
    obj: Record<string, unknown>,
    pattern: ChaiMathSinglePattern,
    path: string,
    baseMsg: string,
    partial: boolean
  ): Chai.AssertionError | null => {
    const keys = new Set(Object.keys(pattern).concat(Object.keys(obj)));

    try {
      keys.forEach(key => {
        const val = obj[key];

        // Skip if no key is in the pattern, and either the checked value is method or the pattern is partial:
        if (!(key in pattern) && (typeof val === 'function' || partial)) {
          return;
        }

        const keyPath = path ? `${path}.${key}` : key;
        const msg = (baseMsg ? `${baseMsg} ` : '') + `(at ${keyPath})`;

        const ptn = pattern[key];
        if (typeof ptn === 'function') {
          const assertion = expect(val, msg).to;
          utils.flag(assertion, 'chaiRecursiveBasePath', keyPath);
          utils.flag(assertion, 'chaiRecursiveBaseMsg', baseMsg || '');
          ptn(assertion);
          return;
        }

        return expect(val, msg).to.deep.eq(ptn);
      });
    } catch (err) {
      if (err instanceof AssertionError) {
        return err;
      }

      throw err;
    }

    return null;
  };

  function matchObject(this: Chai.AssertionStatic, pattern: ChaiMathPattern, partial: boolean) {
    const obj: Record<string, unknown> = util.flag(this, 'object');
    const negate: boolean = util.flag(this, 'negate') || false;
    const operation = partial ? 'include' : 'equal';

    const basePath: string = util.flag(this, 'chaiRecursiveBasePath') || 'root';
    const baseMsg: string = util.flag(this, 'chaiRecursiveBaseMsg') ?? util.flag(this, 'message');
    const objMsg = (baseMsg ? `${baseMsg} ` : '') + `(at ${basePath})`;
    const patternMsg = (baseMsg ? `${baseMsg} ` : '') + `(pattern at ${basePath})`;

    expect(obj, objMsg).not.to.be.a('null');
    expect(pattern, patternMsg).not.to.be.a('null');

    if (Array.isArray(obj) && partial) {
      const objs = obj as Record<string, unknown>[];

      expect(pattern, patternMsg).to.be.an('object');
      const matchIx = objs.findIndex((obj, i) => {
        const path = `${basePath}[${i}]`;
        const err = check(obj, pattern as ChaiMathSinglePattern, path, baseMsg, partial);
        return !err;
      });

      if (matchIx < 0 && !negate) {
        expect.fail(`${objMsg}: expected to recursive ${operation} the pattern`);
      } else if (matchIx >= 0 && negate) {
        expect.fail(`${objMsg}: expected to not recursive ${operation} the pattern`);
      }

      return;
    } else if (Array.isArray(obj)) {
      const objs = obj as Record<string, unknown>[];

      expect(pattern, patternMsg).to.be.an('array');
      const patterns = pattern as ChaiMathSinglePattern[];
      expect(obj).to.have.length(patterns.length);

      const err = objs.find((obj, i) => {
        return check(obj, patterns[i], `${basePath}[${i}]`, baseMsg, partial);
      });

      if (err && !negate) {
        throw err;
      }
      if (negate && !err) {
        expect.fail(`${objMsg}: expected to not recursive ${operation} the pattern`);
      }

      return;
    }

    expect(obj, objMsg).to.be.an('object');
    expect(pattern, patternMsg).to.be.an('object');

    const err = check(obj, pattern as ChaiMathSinglePattern, basePath, baseMsg, partial);

    if (err && !negate) {
      throw err;
    }
    if (negate && !err) {
      expect.fail(`${objMsg}: expected to not recursive ${operation} the pattern`);
    }
  }

  chai.Assertion.addProperty('recursive', function () {
    const fullMatch = (pattern: ChaiMathPattern) => matchObject.call(this, pattern, false);
    const partialMath = (pattern: ChaiMathPattern) => matchObject.call(this, pattern, true);

    return {
      equal: fullMatch,
      include: partialMath,
      equals: fullMatch,
      includes: partialMath,
    };
  });
};

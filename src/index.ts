import { AssertionError, expect, util } from 'chai';
import { ChaiMathPattern, ChaiMathSinglePattern } from './types';

export { ChaiMathPattern, ChaiMathFn } from './types';

type Operation = 'equal' | 'include' | 'have' | 'includeMembers' | 'haveMembers';

export const chaiRecursive: Chai.ChaiPlugin = (chai, utils) => {
  function match(this: Chai.AssertionStatic, pattern: ChaiMathPattern, op: Operation) {
    const obj: Record<string, unknown> = util.flag(this, 'object');
    const negate: boolean = util.flag(this, 'negate') || false;
    const basePath: string = util.flag(this, 'chaiRecursiveBasePath') || 'root';
    const baseMsg: string = util.flag(this, 'chaiRecursiveBaseMsg') ?? util.flag(this, 'message');

    const partial = op === 'include' || op === 'includeMembers';
    const onMembers = op === 'includeMembers' || op === 'haveMembers';

    const objMsgPrefix = (baseMsg ? `${baseMsg} ` : '') + `(at ${basePath})`;
    const patternMsgPrefix = (baseMsg ? `${baseMsg} ` : '') + `(pattern at ${basePath})`;
    expect(obj, objMsgPrefix).not.to.be.a('null');
    expect(pattern, patternMsgPrefix).not.to.be.a('null');

    if (Array.isArray(obj) && op === 'equal') {
      expect(pattern, patternMsgPrefix).to.be.an('array');
      const patterns = pattern as ChaiMathSinglePattern[];
      expect(obj, objMsgPrefix).to.have.length(patterns.length);

      const err = obj.find((o: Record<string, unknown>, i) =>
        checkObject(o, patterns[i], false, `${basePath}[${i}]`, baseMsg)
      );

      if (err && !negate) {
        throw err;
      }
      if (negate && !err) {
        expect.fail(getFailMessage(objMsgPrefix, obj, op, negate));
      }

      return this;
    } else if (Array.isArray(obj) && !onMembers) {
      expect(pattern, patternMsgPrefix).to.be.an('object');

      const matchIx = obj.findIndex((o: Record<string, unknown>) => {
        const err = checkObject(o, pattern as ChaiMathSinglePattern, partial, '', '');
        return !err;
      });

      if (matchIx < 0 && !negate) {
        expect.fail(getFailMessage(objMsgPrefix, obj, op, negate));
      } else if (matchIx >= 0 && negate) {
        expect.fail(getFailMessage(objMsgPrefix, obj, op, negate));
      }

      return this;
    } else if (Array.isArray(obj)) {
      expect(pattern, patternMsgPrefix).to.be.an('array');
      const patterns = pattern as ChaiMathSinglePattern[];
      expect(obj, objMsgPrefix).to.have.length.gte(patterns.length);

      const matchedObjIndexes = new Set<number>();

      const failIx = patterns.findIndex(pattern => {
        const matchIx = obj.findIndex((o: Record<string, unknown>, i) => {
          if (matchedObjIndexes.has(i)) {
            return false;
          }

          const err = checkObject(o, pattern, partial, '', '');
          return !err;
        });

        if (matchIx >= 0) {
          matchedObjIndexes.add(matchIx);
          return false;
        }

        return true;
      });

      if (failIx >= 0 && !negate) {
        expect.fail(getFailMessage(objMsgPrefix, obj, op, negate));
      } else if (failIx < 0 && negate) {
        expect.fail(getFailMessage(objMsgPrefix, obj, op, negate));
      }

      return this;
    }

    expect(obj, objMsgPrefix).to.be.an('object');
    expect(pattern, patternMsgPrefix).to.be.an('object');

    const err = checkObject(obj, pattern as ChaiMathSinglePattern, partial, basePath, baseMsg);

    if (err && !negate) {
      throw err;
    }
    if (negate && !err) {
      expect.fail(getFailMessage(objMsgPrefix, obj, op, negate));
    }

    return this;
  }

  const getFailMessage = (
    prefix: string,
    obj: Record<string, unknown>,
    op: Operation,
    negate: boolean
  ) => {
    const expectedTo =
      `${prefix ? `${prefix}: ` : ''}` +
      `expected ${utils.inspect(obj, true, 4)} to ` +
      `${negate ? 'not' : ''}`;

    switch (op) {
      case 'include':
        return Array.isArray(obj)
          ? `${expectedTo} recursive include the pattern`
          : `${expectedTo} contain a member recursive including the pattern`;
      case 'have':
        return `${expectedTo} contain a member that recursive matches the pattern`;
      case 'includeMembers':
        return `${expectedTo} contain members recursive including the pattern`;
      case 'haveMembers':
        return `${expectedTo} contain members that recursive match the pattern`;
      default:
        return `${expectedTo} recursive match the pattern`;
    }
  };

  const checkObject = (
    obj: Record<string, unknown>,
    pattern: ChaiMathSinglePattern,
    partial: boolean,
    path: string,
    baseMsg: string
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

        expect(val, msg).to.deep.eq(ptn);
      });
    } catch (err) {
      if (err instanceof AssertionError) {
        return err;
      }

      throw err;
    }

    return null;
  };

  chai.Assertion.addProperty('recursive', function () {
    const equal = (pattern: ChaiMathPattern) => match.call(this, pattern, 'equal');

    const include = (pattern: ChaiMathPattern) => match.call(this, pattern, 'include');
    include['members'] = (pattern: ChaiMathPattern) => match.call(this, pattern, 'includeMembers');

    const have = (pattern: ChaiMathPattern) => match.call(this, pattern, 'have');
    have['members'] = (pattern: ChaiMathPattern) => match.call(this, pattern, 'haveMembers');

    return {
      equal,
      equals: equal,
      eq: equal,
      eql: equal,
      eqls: equal,
      include,
      includes: include,
      have,
      has: have,
    };
  });
};

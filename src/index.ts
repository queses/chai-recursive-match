import { AssertionError, expect, util } from 'chai';
import { ChaiRecursivePattern, ChaiRecursiveSinglePattern } from './types';

export { ChaiRecursivePattern, ChaiRecursiveMathFn } from './types';

type Operation = 'equal' | 'include' | 'have' | 'includeMembers' | 'haveMembers';

type AssertionCtx = {
  op: Operation;
  obj: Record<string, unknown> | Record<string, unknown>[];
  pattern: ChaiRecursivePattern;
  negate: boolean;
  basePath: string;
  baseMsg: string;
  objMsg: string;
  patternMsg: string;
  isPartial: boolean;
  isMembers: boolean;
};

export const chaiRecursive: Chai.ChaiPlugin = (chai, utils) => {
  const FLAG_BASE_PATH = 'chaiRecursiveBasePath';
  const FLAG_BASE_MSG = 'chaiRecursiveBaseMsg';

  const match = (
    assertion: Chai.AssertionStatic,
    pattern: ChaiRecursivePattern,
    op: Operation
  ): Chai.AssertionStatic => {
    const basePath = util.flag(assertion, FLAG_BASE_PATH) || 'root';
    const baseMsg = util.flag(assertion, FLAG_BASE_MSG) ?? util.flag(assertion, 'message');

    const ctx: AssertionCtx = {
      pattern,
      op,
      basePath,
      baseMsg,
      obj: util.flag(assertion, 'object'),
      negate: util.flag(assertion, 'negate') || false,
      objMsg: joinNonEmpty([baseMsg, `(at ${basePath})`]),
      patternMsg: joinNonEmpty([baseMsg, `(pattern at ${basePath})`]),
      isPartial: op === 'include' || op === 'includeMembers',
      isMembers: op === 'includeMembers' || op === 'haveMembers',
    };

    let matcher: (ctx: AssertionCtx) => void | never = matchers.objectEqual;
    if (Array.isArray(ctx.obj)) {
      matcher = ctx.op === 'equal' ? matchers.arrayEqual : matchers.arrayHaveOrInclude;
    }

    matcher(ctx);

    return assertion;
  };

  const matchers = {
    objectEqual: (ctx: AssertionCtx) => {
      expect(ctx.obj, ctx.objMsg).to.be.an('object');
      const obj = ctx.obj as Record<string, unknown>;

      expect(ctx.pattern, ctx.patternMsg).to.be.an('object');
      const pattern = ctx.pattern as ChaiRecursiveSinglePattern;

      const err = checkObj(obj, pattern, ctx.isPartial, ctx.basePath, ctx.baseMsg);

      if (err && !ctx.negate) {
        throw err;
      }
      if (ctx.negate && !err) {
        expect.fail(getFailMessage(ctx));
      }
    },

    arrayEqual: (ctx: AssertionCtx) => {
      expect(ctx.pattern, ctx.patternMsg).to.be.an('array');
      const patterns = ctx.pattern as ChaiRecursiveSinglePattern[];

      const objs = ctx.obj as Record<string, unknown>[];
      expect(objs, ctx.objMsg).to.have.length(patterns.length);

      let err: Chai.AssertionError | null = null;
      for (let i = 0; i < objs.length && !err; i++) {
        err = checkObj(objs[i], patterns[i], false, `${ctx.basePath}[${i}]`, ctx.baseMsg);
      }

      if (err && !ctx.negate) {
        throw err;
      }
      if (ctx.negate && !err) {
        expect.fail(getFailMessage(ctx));
      }
    },

    arrayHaveOrInclude: (ctx: AssertionCtx) => {
      let patterns: ChaiRecursiveSinglePattern[];
      if (ctx.isMembers) {
        expect(ctx.pattern, ctx.patternMsg).to.be.an('array');
        patterns = ctx.pattern as ChaiRecursiveSinglePattern[];
      } else {
        expect(ctx.pattern, ctx.patternMsg).to.be.an('object');
        patterns = [ctx.pattern as ChaiRecursiveSinglePattern];
      }

      const objs = ctx.obj as Record<string, unknown>[];
      expect(objs, ctx.objMsg).to.have.length.gte(patterns.length);

      const matchedObjIndexes = new Set<number>();
      const failIx = patterns.findIndex(pattern => {
        const matchIx = objs.findIndex((o, i) => {
          if (matchedObjIndexes.has(i)) {
            return false;
          }

          const err = checkObj(o, pattern, ctx.isPartial, '', '');
          return !err;
        });

        if (matchIx >= 0) {
          matchedObjIndexes.add(matchIx);
          return false;
        }

        return true;
      });

      if (failIx >= 0 && !ctx.negate) {
        expect.fail(getFailMessage(ctx));
      } else if (failIx < 0 && ctx.negate) {
        expect.fail(getFailMessage(ctx));
      }
    },
  };

  const checkObj = (
    obj: Record<string, unknown>,
    pattern: ChaiRecursiveSinglePattern,
    partial: boolean,
    path: string,
    baseMsg: string | undefined
  ): Chai.AssertionError | null => {
    const keys = new Set([...Object.keys(pattern), ...Object.keys(obj)]);

    try {
      keys.forEach(key => {
        const val = obj[key];

        // Skip if no key is in the pattern, and either the checked value is method or the pattern is partial:
        if (!(key in pattern) && (typeof val === 'function' || partial)) {
          return;
        }

        const ptn = pattern[key];
        const keyPath = path ? `${path}.${key}` : key;
        const msg = joinNonEmpty([baseMsg, `(at ${keyPath})`]);

        if (typeof ptn === 'function') {
          const assertion = expect(val, msg).to;
          utils.flag(assertion, FLAG_BASE_PATH, keyPath);
          utils.flag(assertion, FLAG_BASE_MSG, baseMsg || '');
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

  const getFailMessage = (ctx: AssertionCtx) => {
    const expectedTo = joinNonEmpty([
      ctx.objMsg && `${ctx.objMsg}:`,
      `expected ${utils.inspect(ctx.obj, true, 4)} to`,
      ctx.negate && 'not',
    ]);

    switch (ctx.op) {
      case 'include':
        return Array.isArray(ctx.obj)
          ? `${expectedTo} contain a member recursively including the pattern`
          : `${expectedTo} recursively include the pattern`;
      case 'have':
        return `${expectedTo} contain a member that recursively matches the pattern`;
      case 'includeMembers':
        return `${expectedTo} contain members recursively including the pattern`;
      case 'haveMembers':
        return `${expectedTo} contain members that recursively match the pattern`;
      default:
        return `${expectedTo} recursively match the pattern`;
    }
  };

  const joinNonEmpty = (str: unknown[]) => str.filter(Boolean).join(' ');

  chai.Assertion.addProperty('recursive', function () {
    const equal = (p: ChaiRecursivePattern) => match(this, p, 'equal');

    const include = (p: ChaiRecursivePattern) => match(this, p, 'include');
    include['members'] = (p: ChaiRecursivePattern) => match(this, p, 'includeMembers');

    const have = (p: ChaiRecursivePattern) => match(this, p, 'have');
    have['members'] = (p: ChaiRecursivePattern) => match(this, p, 'haveMembers');

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

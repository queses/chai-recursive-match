# chai-recursive-match

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Issues][issues-img]][issues-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

> Easily perform recursive comparisons in your Chai assertions

## Key features:

This Chai plugin extends Chai's assertion capabilities to allow for seamless recursive comparisons of objects and arrays.

It enables you to write concise and expressive tests for nested structures, ensuring the integrity of your data at every level.

- **🔎 Recursive equality**: Assert that two objects or arrays are recursively equal, taking into account nested values and their types.
- **📦 Recursive inclusion**: Verify that a nested value is present within an object or array, even if it's located deep within the structure.
- **🔧 Customizable matchers**: Use matchers from Chai's rich library to define specific conditions for nested values, such as type checks, string patterns, or numerical ranges.
- **ℹ️ Informative error messages**: Receive clear and detailed error messages when assertions fail, pinpointing the exact path of the discrepancy within the nested structure.

## Install

Give it a try to enhance your testing experience with Chai.

```bash
npm install -D chai-recursive-match
```

> **Note:** No need to install types for TypeScript separately – they are included.

## Usage

```ts
import { use } from 'chai';
import { chaiRecursive } from 'chai-recursive-match';

use(chaiRecursive);
```

## API

### Recursively equality

An object or an array is checked against a pattern.
See [`types.ts`](https://github.com/queses/chai-recursive-match/blob/main/src/types.ts) for pattern's type definition.

#### A simple example:

```ts
expect({ foo: { bar: 'baz' } }).to.recursive.equal({
  foo: to => to.recursive.equal({ bar: to => to.be.a('string') }),
});
```

#### An array example:

```ts
expect([{ foo: { bar: 'baz' } }, { foo: { bar: 'foobar' } }]).to.recursive.equal([
  { foo: to => to.recursive.equal({ bar: to.be.a('string') }) },
  { foo: to => to.recursive.equal({ bar: to.match(/^foo/) }) },
]);
```

#### A complete example:

```ts
expect({
  num1: 1,
  num2: 2,
  arr1: [1, 2, 3],
  arr2: [{ id: 1 }, { id: 2 }],
  str1: 'hello 1',
  str2: 'hello 2',
  obj1: { key: 'a', value: 'A' },
  obj2: { key: 'b', value: 'B' },
  method1() {},
}).to.recursive.equal({
  num1: 1,
  num2: to => to.be.gt(1),
  arr1: [1, 2, 3],
  arr2: to => to.deep.contain({ id: 2 }),
  str1: 'hello 1',
  str2: to => to.match(/^hello/),
  obj1: { key: 'a', value: 'A' },
  obj2: to => to.recursive.equal({ key: 'b', value: to => to.be.a('string') }),
});
```

#### With negation:

```ts
expect({ foo: { bar: 'baz' } }).to.not.recursive.equal({
  foo: to => to.recursive.equal({ bar: to => to.be.a('number') }),
});
```

#### Check if an array has a member:

This is similar to `recursive.include`, but the value is expected to fully match the pattern:

```ts
expect([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]).to.recursive.equal({ id: 1, name: to => to.contain('A') });
```

#### Check if an array has members:

This is similar to `recursive.have()` with several members to be compared:

```ts
expect([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 2, name: 'Carol' },
]).to.recursive.have.members([
  { id: 1, name: to => to.contain('A') },
  { id: 3, name: to => to.contain('C') },
]);
```

### Recursively inclusion

#### An object example:

```ts
expect({ foo: { bar: 'baz' }, num: 123 }).to.recursive.include({
  num: to => to.be.gt(100),
});
```

#### An array example:

```ts
expect([{ foo: { bar: 'baz' } }, { foo: { bar: 'foobar' } }]).to.recursive.include({
  foo: to => to.recursive.equal({ bar: to.match(/^foo/) }),
});
```

#### With negation:

```ts
expect([{ foo: { bar: 'baz' } }, { foo: { bar: 'foobar' } }]).to.not.recursive.include({
  foo: to => to.recursive.equal({ bar: to.match(/^baz/) }),
});
```

#### Check if an array includes members:

```ts
expect([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 2, name: 'Carol' },
]).to.recursive.include.members([
  {
    name: to => to.contain('A')
  },
  {
    name: to => to.contain('C')
  }
]);
```

## TBD

- 🚧 Show diff in error message
- 🚧 Support `chai.assert` interface
- 🚧 Support more array methods (e.g. `to.recursive.have.ordered.members`)

[build-img]: https://github.com/queses/chai-recursive-match/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/queses/chai-recursive-match/actions/workflows/release.yml
[downloads-img]: https://img.shields.io/npm/dt/chai-recursive-match
[downloads-url]: https://www.npmtrends.com/chai-recursive-match
[npm-img]: https://img.shields.io/npm/v/chai-recursive-match
[npm-url]: https://www.npmjs.com/package/chai-recursive-match
[issues-img]: https://img.shields.io/github/issues/queses/chai-recursive-match
[issues-url]: https://github.com/queses/chai-recursive-match/issues
[codecov-img]: https://codecov.io/gh/queses/chai-recursive-match/branch/main/graph/badge.svg
[codecov-url]: https://codecov.io/gh/queses/chai-recursive-match
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release

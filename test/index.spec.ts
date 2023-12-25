import { expect } from 'chai';

describe('chai recursive', () => {
  describe('on an object', () => {
    const value = {
      num1: 1,
      num2: 2,
      arr1: [1, 2, 3],
      arr2: [{ id: 1 }, { id: 2 }],
      str1: 'hello 1',
      str2: 'hello 2',
      obj1: { key: 'a', value: 'A' },
      obj2: { key: 'b', value: 'B' },
      empty1: null,
      empty2: undefined,
      date1: new Date(0),
      method1() {},
    };

    it('should succeed if it equals the pattern', () => {
      expect(value).to.recursive.equal({
        num1: 1,
        num2: to => to.be.gt(1),
        arr1: [1, 2, 3],
        arr2: to => to.deep.contain({ id: 2 }),
        str1: 'hello 1',
        str2: to => to.match(/^hello/),
        obj1: { key: 'a', value: 'A' },
        obj2: to => to.recursive.equal({ key: 'b', value: to => to.be.a('string') }),
        date1: new Date(0),
        empty1: null,
        empty2: undefined,
      });
    });

    it('should succeed if it includes the pattern', () => {
      expect(value).to.recursive.include({
        obj2: to => to.recursive.include({ value: to => to.be.a('string') }),
      });
    });

    it('should succeed if does not include the pattern', () => {
      expect(value).to.not.recursive.include({
        obj2: to => to.recursive.include({ value: to => to.be.a('number') }),
      });
    });

    it('should succeed on a nested value', () => {
      expect({
        obj1: { a: 'a', b: { c: 'c' } },
        obj2: { a: 1, b: { c: 2 } },
      }).to.recursive.equal({
        obj1: to => to.recursive.equal({ a: 'a', b: to => to.recursive.equal({ c: 'c' }) }),
        obj2: to =>
          to.recursive.equal({ a: 1, b: to => to.recursive.equal({ c: to => to.be.gt(1) }) }),
      });
    });

    it('should succeed if it does not equal the pattern', () => {
      expect(value).to.not.recursive.equal({
        obj2: to => to.recursive.equal({ key: 'b', value: to => to.be.a('string') }),
      });
    });

    it('should succeed if it does not include the pattern', () => {
      expect(value).to.not.recursive.include({
        obj2: to => to.recursive.equal({ key: 'b', value: to => to.be.a('number') }),
      });
    });

    it('should include path in the error message', () => {
      const act = () => {
        expect(value).to.recursive.include({
          obj2: to => to.recursive.equal({ key: 'b', value: to => to.be.a('number') }),
        });
      };

      expect(act)
        .to.throw()
        .recursive.include({ message: to => to.contain('(at root.obj2.value):') });
    });

    it('should include custom text in the error message', () => {
      const act = () => {
        expect(value, 'my text').to.recursive.include({
          obj2: to => to.recursive.equal({ key: 'b', value: to => to.be.a('number') }),
        });
      };

      expect(act)
        .to.throw()
        .recursive.include({ message: to => to.contain('my text (at root.obj2.value):') });
    });

    it('should succeed with a short alias', () => {
      expect({ obj1: value.obj1 }).to.rec.eq({
        obj1: to => to.rec.eq({ key: 'a', value: to => to.be.a('string') }),
      });
    });
  });

  describe('on an array', () => {
    const value = [
      {
        num: 1,
        arr: [1, 2, 3],
        str: 'hello 1',
        obj: { key: 'a', value: 'A' },
        empty: null,
        date: new Date(0),
        method() {},
      },
      {
        num: 2,
        arr: [{ id: 1 }, { id: 2 }],
        str: 'hello 2',
        obj: { key: 'b', value: 'B' },
        empty: undefined,
        method() {},
      },
    ];

    it('should succeed if it equals the pattern', () => {
      expect(value).to.recursive.equal([
        {
          num: 1,
          arr: [1, 2, 3],
          str: 'hello 1',
          obj: { key: 'a', value: 'A' },
          date: new Date(0),
          empty: null,
        },
        {
          num: to => to.be.gt(1),
          arr: to => to.deep.contain({ id: 2 }),
          str: to => to.match(/^hello/),
          obj: to => to.recursive.equal({ key: 'b', value: to => to.be.a('string') }),
          empty: undefined,
        },
      ]);
    });

    it('should succeed if it includes the pattern', () => {
      expect(value).to.recursive.include({
        obj: to => to.recursive.include({ value: to => to.be.a('string') }),
      });
    });

    it('should succeed on a nested value', () => {
      expect([
        { a: 'a', b: { c: 'c' } },
        { a: 1, b: { c: 2 } },
      ]).to.recursive.equal([
        { a: 'a', b: to => to.recursive.equal({ c: 'c' }) },
        { a: 1, b: to => to.recursive.equal({ c: to => to.be.gt(1) }) },
      ]);
    });

    it('should succeed if it does not equal the pattern', () => {
      expect(value).to.not.recursive.equal([{ num: 1 }, { num: to => to.be.gt(1) }]);
    });

    it('should succeed if it does not include the pattern', () => {
      expect(value).to.not.recursive.include({ num: to => to.be.gt(10) });
    });
  });
});

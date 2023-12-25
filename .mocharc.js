'use strict';

module.exports = {
  recursive: true,
  require: 'ts-node/register',
  timeout: 5000,
  file: ['./test/mocha.setup.ts'],
  extension: ['.spec.ts'],
};

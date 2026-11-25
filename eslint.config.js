import neostandard from 'neostandard'
import jsdoc from 'eslint-plugin-jsdoc'

export default [
  ...neostandard(),
  jsdoc.configs['flat/recommended'],
  {
    rules: {
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-jsdoc': 'off'
    }
  },
  {
    ignores: ['node_modules/', 'package-lock.json', 'openapi.json']
  }
]

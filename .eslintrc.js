'use strict';


const fs = require('fs');
const path = require('path');

/**
 * 判断目录是否存在，如果不存在则创建
 */
function mkdirIfNotExists(relativePath) {
    const dir = path.join(__dirname, relativePath);
    let stat;
    try {
        stat = fs.statSync(dir);
    } catch (e) {
        fs.mkdirSync(dir);
    }
}

// 初始化build目录
mkdirIfNotExists('./build');

// 初始化eslint目录
mkdirIfNotExists('./build/eslint');

module.exports = {
    //extends: 'eslint:recommended'.//'eslint-config-airbnb',//'eslint:recommended',

    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module',
        ecmaFeatures: {
            globalReturn: false,
            impliedStrict: true
        }
    },

    root: true,
    parser: "babel-eslint",

    // http://eslint.cn/docs/rules/${规则名字}

    rules: {
        'comma-dangle': ['error', 'never'],
        'no-cond-assign': ['error', 'except-parens'],
        //'no-console': 'error',
        'no-constant-condition': ['error', { checkLoops: false }],
        'no-control-regex': 'error',
        'no-debugger': 'error',
        'no-dupe-args': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-empty': 'error',
        'no-ex-assign': 'error',
        'no-extra-boolean-cast': 'error',
        //'no-extra-parens': 'error',
        'no-extra-semi': 'error',
        'no-func-assign': 'error',
        'no-inner-declarations': 'error',
        'no-invalid-regexp': 'error',
        'no-irregular-whitespace': 'error',
        'no-negated-in-lhs': 'error',
        'no-obj-calls': 'error',
        'no-prototype-builtins': 'error',
        'no-regex-spaces': 'error',
        'no-sparse-arrays': 'error',
        'no-unexpected-multiline': "error",
        'no-unreachable': "error",
        'no-unsafe-finally': 'error',
        'use-isnan': "error",
        //'valid-jsdoc': "error",
        'valid-typeof': "error",
        'accessor-pairs': "error",
        'array-callback-return': "error",
        'block-scoped-var': "error",
        "complexity": ["error", { "max": 16 }],
        //'consistent-return': 'error',
        'curly': ["error", "multi-line"],
        'default-case': "error",
        //'dot-notation': "error",
        'eqeqeq': "error",
        'no-alert': "error",
        'no-caller': "error",
        'no-case-declarations': 'error',
        'no-div-regex': "error",
        'no-else-return': "error",
        'no-empty-function': "off",
        'no-empty-pattern': 'error',
        'no-eq-null': "error",
        //'no-eval': "error",
        'no-extend-native': "error",
        'no-extra-bind': "error",
        'no-extra-label': "error",
        'no-fallthrough': "error",
        'no-floating-decimal': "error",
        'no-implicit-coercion': ['error', { 'string': false }],
        'no-implicit-globals': "error",
        'no-implied-eval': "error",
        'no-invalid-this': "error",
        'no-iterator': "error",
        'no-labels': "error",
        'no-lone-blocks': "error",
        'no-loop-func': "error",
        'no-magic-numbers': "off",
        'no-multi-spaces': "off",
        'no-multi-str': "off",
        'no-native-reassign': "error",
        'no-new-func': "error",
        'no-new-wrappers': "error",
        'no-octal': "error",
        'no-octal-escape': "error",
        'no-param-reassign': "off",
        'no-proto': "error",
        'no-redeclare': "error",
        'no-return-assign': ["error", "always"],
        'no-script-url': "error",
        'no-self-assign': "error",
        'no-self-compare': "error",
        'no-sequences': "error",
        'no-throw-literal': "error",
        'no-unmodified-loop-condition': 'error',
        'no-unused-expressions': "error",
        'no-unused-labels': "error",
        'no-useless-call': "error",
        'no-useless-concat': "error",
        'no-useless-escape': "error",
        'no-void': "error",
        //'no-warning-comments': "error",//TODO: uncomment this for uat/product
        'no-with': "error",
        'radix': "error",
        'vars-on-top': "off",
        'wrap-iife': ["error", "outside"],
        'yoda': "off",
        //'strict': 'error',
        'init-declarations': 'off',
        'no-catch-shadow': 'off',
        'no-delete-var': "error",
        'no-label-var': "error",
        'no-use-before-define': "error",
        'callback-return': ["error", ['callback']],
        'global-require': "error", //eslint global-require: "error"
        'handle-callback-err': ["error", 'err'],
        'no-mixed-requires': "error",
        'no-new-require': "error",
        'no-path-concat': "error",
        'no-process-env': "off",
        'no-process-exit': "off",
        'no-sync': "error",

        'array-bracket-spacing': 'error',
        'block-spacing': 'error',
        'brace-style': 'error',
        //'camelcase': 'error',
        'comma-spacing': 'off',
        'comma-style': 'error',
        'computed-property-spacing': 'error',
        //'consistent-this': 'error',
        'eol-last': 'off',
        //'func-names': 'error',
        'func-style': ['error', 'declaration'],
        //"id-blacklist": ["error", "data", "err", "e", "cb", "callback"],
        'id-length': ['error', { min: 1 }],
        //"indent": ["error", 4],
        //'key-spacing': ['error', {align: 'value'}],
        //'linebreak-style': ["error", "unix"],
        //'lines-around-comment': ["error", { beforeBlockComment: true, beforeLineComment: true }],
        'max-depth': ["error", 4],
        //'max-len': ["error", 120],
        //'max-lines': ["error", {max: 300, skipBlankLines: true, skipComment: true}],
        'max-nested-callbacks': ["error", 10],
        'max-params': ["error", 20],
        'max-statements': ["error", 60],
        'max-statements-per-line': ["error", { max: 1 }],
        'new-parens': 'error',
        'no-array-constructor': "error",
        'no-bitwise': "error",
        'no-mixed-operators': "off",
        'no-mixed-spaces-and-tabs': 'error',
        'no-nested-ternary': "error",
        'no-new-object': 'error',
        //'no-trailing-spaces': ["error", { "skipBlankLines": true }],
        //'no-underscore-dangle': 'error',
        'no-unneeded-ternary': 'off',
        'no-whitespace-before-property': 'error',
        'object-curly-spacing': 'off',
        'operator-assignment': ["error", "always"],
        //"require-jsdoc": ["error", { "require": { "FunctionDeclaration": true, "MethodDefinition": true, "ClassDeclaration": true },

        "arrow-body-style": "off",
        "arrow-parens": ["error", "as-needed"],
        'constructor-super': "error",
        'no-class-assign': 'error',
        'no-confusing-arrow': 'error',
        'no-const-assign': 'error',
        'no-dupe-class-members': "error",
        'no-duplicate-imports': 'error',
        'no-new-symbol': 'error',
        'no-this-before-super': 'error',
        'no-useless-computed-key': "error",
        'no-useless-constructor': 'error',
        'no-useless-rename': 'error',
        'no-var': 'error',
        //'prefer-const': "error",
        'require-yield': "error",

        'no-undef': "error",
        "no-undef-init": "error",
        "no-unused-vars": "error"
    },
    env: {
        node: true,
        es6: true,
        mocha: true,
        mongo: true
    },
    globals: {
        bearcat: false
    }
};


//"watch": "npm run eslint && ./node_modules/.bin/babel ./ --out-dir ./build --watch",

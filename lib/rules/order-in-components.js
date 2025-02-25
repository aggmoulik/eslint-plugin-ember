'use strict';

const ember = require('../utils/ember');
const propOrder = require('../utils/property-order');
const { getImportIdentifier } = require('../utils/import');

const reportUnorderedProperties = propOrder.reportUnorderedProperties;
const addBackwardsPosition = propOrder.addBackwardsPosition;

const ORDER = [
  'spread',
  'service',
  'property',
  'empty-method',
  'single-line-function',
  'multi-line-function',
  'observer',
  'init',
  'didReceiveAttrs',
  'willRender',
  'willInsertElement',
  'didInsertElement',
  'didRender',
  'didUpdateAttrs',
  'willUpdate',
  'didUpdate',
  'willDestroyElement',
  'willClearRender',
  'didDestroyElement',
  'actions',
  'method',
];

//------------------------------------------------------------------------------
// Organizing - Organize your components and keep order in objects
//------------------------------------------------------------------------------

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'enforce proper order of properties in components',
      category: 'Stylistic Issues',
      recommended: false,
      url: 'https://github.com/ember-cli/eslint-plugin-ember/tree/master/docs/rules/order-in-components.md',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          order: {
            type: 'array',
            uniqueItems: true,
            minItems: 1,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    let order = options.order
      ? addBackwardsPosition(options.order, 'empty-method', 'method')
      : ORDER;
    order = [...order];
    const indexOfLifecycleHook = order.indexOf('lifecycle-hook');

    if (indexOfLifecycleHook !== -1) {
      order.splice(indexOfLifecycleHook, 1, [
        'init',
        'didReceiveAttrs',
        'willRender',
        'willInsertElement',
        'didInsertElement',
        'didRender',
        'didUpdateAttrs',
        'willUpdate',
        'didUpdate',
        'willDestroyElement',
        'willClearRender',
        'didDestroyElement',
      ]);
    }

    let importedInjectName;
    let importedEmberName;
    let importedObserverName;
    let importedControllerName;

    const sourceCode = context.getSourceCode();
    const { scopeManager } = sourceCode;

    return {
      ImportDeclaration(node) {
        if (node.source.value === 'ember') {
          importedEmberName = importedEmberName || getImportIdentifier(node, 'ember');
        }
        if (node.source.value === '@ember/service') {
          importedInjectName =
            importedInjectName || getImportIdentifier(node, '@ember/service', 'inject');
        }
        if (node.source.value === '@ember/object') {
          importedObserverName =
            importedObserverName || getImportIdentifier(node, '@ember/object', 'observer');
        }
        if (node.source.value === '@ember/controller') {
          importedControllerName =
            importedControllerName || getImportIdentifier(node, '@ember/controller', 'inject');
        }
      },
      CallExpression(node) {
        if (!ember.isEmberComponent(context, node)) {
          return;
        }

        reportUnorderedProperties(
          node,
          context,
          'component',
          order,
          importedEmberName,
          importedInjectName,
          importedObserverName,
          importedControllerName,
          scopeManager
        );
      },
    };
  },
};

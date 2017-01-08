'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _cssSyntaxError = require('./css-syntax-error');

var _cssSyntaxError2 = _interopRequireDefault(_cssSyntaxError);

var _stringifier = require('./stringifier');

var _stringifier2 = _interopRequireDefault(_stringifier);

var _stringify = require('./stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _warnOnce = require('./warn-once');

var _warnOnce2 = _interopRequireDefault(_warnOnce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @typedef {object} position
 * @property {number} line   - source line in file
 * @property {number} column - source column in file
 */

/**
 * @typedef {object} source
 * @property {Input} input    - {@link Input} with input file
 * @property {position} start - The starting position of the node’s source
 * @property {position} end   - The ending position of the node’s source
 */

var cloneNode = function cloneNode(obj, parent) {
    var cloned = new obj.constructor();

    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        var value = obj[i];
        var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);

        if (i === 'parent' && type === 'object') {
            if (parent) cloned[i] = parent;
        } else if (i === 'source') {
            cloned[i] = value;
        } else if (value instanceof Array) {
            cloned[i] = value.map(function (j) {
                return cloneNode(j, cloned);
            });
        } else if (i !== 'before' && i !== 'after' && i !== 'between' && i !== 'semicolon') {
            if (type === 'object' && value !== null) value = cloneNode(value);
            cloned[i] = value;
        }
    }

    return cloned;
};

/**
 * All node classes inherit the following common methods.
 *
 * @abstract
 * @ignore
 */

var Node = function () {

    /**
     * @param {object} [defaults] - value for node properties
     */

    function Node() {
        var defaults = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, Node);

        this.raws = {};
        for (var name in defaults) {
            this[name] = defaults[name];
        }
    }

    /**
     * Returns a CssSyntaxError instance containing the original position
     * of the node in the source, showing line and column numbers and also
     * a small excerpt to facilitate debugging.
     *
     * If present, an input source map will be used to get the original position
     * of the source, even from a previous compilation step
     * (e.g., from Sass compilation).
     *
     * This method produces very useful error messages.
     *
     * @param {string} message     - error description
     * @param {object} [opts]      - options
     * @param {string} opts.plugin - plugin name that created this error.
     *                               PostCSS will set it automatically.
     * @param {string} opts.word   - a word inside a node’s string that should
     *                               be highlighted as the source of the error
     * @param {number} opts.index  - an index inside a node’s string that should
     *                               be highlighted as the source of the error
     *
     * @return {CssSyntaxError} error object to throw it
     *
     * @example
     * if ( !variables[name] ) {
     *   throw decl.error('Unknown variable ' + name, { word: name });
     *   // CssSyntaxError: postcss-vars:a.sass:4:3: Unknown variable $black
     *   //   color: $black
     *   // a
     *   //          ^
     *   //   background: white
     * }
     */


    Node.prototype.error = function error(message) {
        var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        if (this.source) {
            var pos = this.positionBy(opts);
            return this.source.input.error(message, pos.line, pos.column, opts);
        } else {
            return new _cssSyntaxError2.default(message);
        }
    };

    /**
     * This method is provided as a convenience wrapper for {@link Result#warn}.
     *
     * @param {Result} result      - the {@link Result} instance
     *                               that will receive the warning
     * @param {string} text        - warning message
     * @param {object} [opts]      - options
     * @param {string} opts.plugin - plugin name that created this warning.
     *                               PostCSS will set it automatically.
     * @param {string} opts.word   - a word inside a node’s string that should
     *                               be highlighted as the source of the warning
     * @param {number} opts.index  - an index inside a node’s string that should
     *                               be highlighted as the source of the warning
     *
     * @return {Warning} created warning object
     *
     * @example
     * const plugin = postcss.plugin('postcss-deprecated', () => {
     *   return (css, result) => {
     *     css.walkDecls('bad', decl => {
     *       decl.warn(result, 'Deprecated property bad');
     *     });
     *   };
     * });
     */


    Node.prototype.warn = function warn(result, text, opts) {
        var data = { node: this };
        for (var i in opts) {
            data[i] = opts[i];
        }return result.warn(text, data);
    };

    /**
     * Removes the node from its parent and cleans the parent properties
     * from the node and its children.
     *
     * @example
     * if ( decl.prop.match(/^-webkit-/) ) {
     *   decl.remove();
     * }
     *
     * @return {Node} node to make calls chain
     */


    Node.prototype.remove = function remove() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.parent = undefined;
        return this;
    };

    /**
     * Returns a CSS string representing the node.
     *
     * @param {stringifier|syntax} [stringifier] - a syntax to use
     *                                             in string generation
     *
     * @return {string} CSS string of this node
     *
     * @example
     * postcss.rule({ selector: 'a' }).toString() //=> "a {}"
     */


    Node.prototype.toString = function toString() {
        var stringifier = arguments.length <= 0 || arguments[0] === undefined ? _stringify2.default : arguments[0];

        if (stringifier.stringify) stringifier = stringifier.stringify;
        var result = '';
        stringifier(this, function (i) {
            result += i;
        });
        return result;
    };

    /**
     * Returns a clone of the node.
     *
     * The resulting cloned node and its (cloned) children will have
     * a clean parent and code style properties.
     *
     * @param {object} [overrides] - new properties to override in the clone.
     *
     * @example
     * const cloned = decl.clone({ prop: '-moz-' + decl.prop });
     * cloned.raws.before  //=> undefined
     * cloned.parent       //=> undefined
     * cloned.toString()   //=> -moz-transform: scale(0)
     *
     * @return {Node} clone of the node
     */


    Node.prototype.clone = function clone() {
        var overrides = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var cloned = cloneNode(this);
        for (var name in overrides) {
            cloned[name] = overrides[name];
        }
        return cloned;
    };

    /**
     * hortcut to clone the node and insert the resulting cloned node
     * before the current node.
     *
     * @param {object} [overrides] - new properties to override in the clone.
     *
     * @example
     * decl.cloneBefore({ prop: '-moz-' + decl.prop });
     *
     * @return {Node} - new node
     */


    Node.prototype.cloneBefore = function cloneBefore() {
        var overrides = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var cloned = this.clone(overrides);
        this.parent.insertBefore(this, cloned);
        return cloned;
    };

    /**
     * hortcut to clone the node and insert the resulting cloned node
     * after the current node.
     *
     * @param {object} [overrides] - new properties to override in the clone.
     *
     * @return {Node} - new node
     */


    Node.prototype.cloneAfter = function cloneAfter() {
        var overrides = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var cloned = this.clone(overrides);
        this.parent.insertAfter(this, cloned);
        return cloned;
    };

    /**
     * Inserts node(s) before the current node and removes the current node.
     *
     * @param {...Node} nodes - node(s) to replace current one
     *
     * @example
     * if ( atrule.name == 'mixin' ) {
     *   atrule.replaceWith(mixinRules[atrule.params]);
     * }
     *
     * @return {Node} current node to methods chain
     */


    Node.prototype.replaceWith = function replaceWith() {
        if (this.parent) {
            for (var _len = arguments.length, nodes = Array(_len), _key = 0; _key < _len; _key++) {
                nodes[_key] = arguments[_key];
            }

            for (var _iterator = nodes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                var _ref;

                if (_isArray) {
                    if (_i >= _iterator.length) break;
                    _ref = _iterator[_i++];
                } else {
                    _i = _iterator.next();
                    if (_i.done) break;
                    _ref = _i.value;
                }

                var node = _ref;

                this.parent.insertBefore(this, node);
            }

            this.remove();
        }

        return this;
    };

    /**
     * Removes the node from its current parent and inserts it
     * at the end of `newParent`.
     *
     * This will clean the `before` and `after` code {@link Node#raws} data
     * from the node and replace them with the indentation style of `newParent`.
     * It will also clean the `between` property
     * if `newParent` is in another {@link Root}.
     *
     * @param {Container} newParent - container node where the current node
     *                                will be moved
     *
     * @example
     * atrule.moveTo(atrule.root());
     *
     * @return {Node} current node to methods chain
     */


    Node.prototype.moveTo = function moveTo(newParent) {
        this.cleanRaws(this.root() === newParent.root());
        this.remove();
        newParent.append(this);
        return this;
    };

    /**
     * Removes the node from its current parent and inserts it into
     * a new parent before `otherNode`.
     *
     * This will also clean the node’s code style properties just as it would
     * in {@link Node#moveTo}.
     *
     * @param {Node} otherNode - node that will be before current node
     *
     * @return {Node} current node to methods chain
     */


    Node.prototype.moveBefore = function moveBefore(otherNode) {
        this.cleanRaws(this.root() === otherNode.root());
        this.remove();
        otherNode.parent.insertBefore(otherNode, this);
        return this;
    };

    /**
     * Removes the node from its current parent and inserts it into
     * a new parent after `otherNode`.
     *
     * This will also clean the node’s code style properties just as it would
     * in {@link Node#moveTo}.
     *
     * @param {Node} otherNode - node that will be after current node
     *
     * @return {Node} current node to methods chain
     */


    Node.prototype.moveAfter = function moveAfter(otherNode) {
        this.cleanRaws(this.root() === otherNode.root());
        this.remove();
        otherNode.parent.insertAfter(otherNode, this);
        return this;
    };

    /**
     * Returns the next child of the node’s parent.
     * Returns `undefined` if the current node is the last child.
     *
     * @return {Node|undefined} next node
     *
     * @example
     * if ( comment.text === 'delete next' ) {
     *   const next = comment.next();
     *   if ( next ) {
     *     next.remove();
     *   }
     * }
     */


    Node.prototype.next = function next() {
        var index = this.parent.index(this);
        return this.parent.nodes[index + 1];
    };

    /**
     * Returns the previous child of the node’s parent.
     * Returns `undefined` if the current node is the first child.
     *
     * @return {Node|undefined} previous node
     *
     * @example
     * const annotation = decl.prev();
     * if ( annotation.type == 'comment' ) {
     *  readAnnotation(annotation.text);
     * }
     */


    Node.prototype.prev = function prev() {
        var index = this.parent.index(this);
        return this.parent.nodes[index - 1];
    };

    Node.prototype.toJSON = function toJSON() {
        var fixed = {};

        for (var name in this) {
            if (!this.hasOwnProperty(name)) continue;
            if (name === 'parent') continue;
            var value = this[name];

            if (value instanceof Array) {
                fixed[name] = value.map(function (i) {
                    if ((typeof i === 'undefined' ? 'undefined' : _typeof(i)) === 'object' && i.toJSON) {
                        return i.toJSON();
                    } else {
                        return i;
                    }
                });
            } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.toJSON) {
                fixed[name] = value.toJSON();
            } else {
                fixed[name] = value;
            }
        }

        return fixed;
    };

    /**
     * Returns a {@link Node#raws} value. If the node is missing
     * the code style property (because the node was manually built or cloned),
     * PostCSS will try to autodetect the code style property by looking
     * at other nodes in the tree.
     *
     * @param {string} prop          - name of code style property
     * @param {string} [defaultType] - name of default value, it can be missed
     *                                 if the value is the same as prop
     *
     * @example
     * const root = postcss.parse('a { background: white }');
     * root.nodes[0].append({ prop: 'color', value: 'black' });
     * root.nodes[0].nodes[1].raws.before   //=> undefined
     * root.nodes[0].nodes[1].raw('before') //=> ' '
     *
     * @return {string} code style value
     */


    Node.prototype.raw = function raw(prop, defaultType) {
        var str = new _stringifier2.default();
        return str.raw(this, prop, defaultType);
    };

    /**
     * Finds the Root instance of the node’s tree.
     *
     * @example
     * root.nodes[0].nodes[0].root() === root
     *
     * @return {Root} root parent
     */


    Node.prototype.root = function root() {
        var result = this;
        while (result.parent) {
            result = result.parent;
        }return result;
    };

    Node.prototype.cleanRaws = function cleanRaws(keepBetween) {
        delete this.raws.before;
        delete this.raws.after;
        if (!keepBetween) delete this.raws.between;
    };

    Node.prototype.positionInside = function positionInside(index) {
        var string = this.toString();
        var column = this.source.start.column;
        var line = this.source.start.line;

        for (var i = 0; i < index; i++) {
            if (string[i] === '\n') {
                column = 1;
                line += 1;
            } else {
                column += 1;
            }
        }

        return { line: line, column: column };
    };

    Node.prototype.positionBy = function positionBy(opts) {
        var pos = this.source.start;
        if (opts.index) {
            pos = this.positionInside(opts.index);
        } else if (opts.word) {
            var index = this.toString().indexOf(opts.word);
            if (index !== -1) pos = this.positionInside(index);
        }
        return pos;
    };

    Node.prototype.removeSelf = function removeSelf() {
        (0, _warnOnce2.default)('Node#removeSelf is deprecated. Use Node#remove.');
        return this.remove();
    };

    Node.prototype.replace = function replace(nodes) {
        (0, _warnOnce2.default)('Node#replace is deprecated. Use Node#replaceWith');
        return this.replaceWith(nodes);
    };

    Node.prototype.style = function style(own, detect) {
        (0, _warnOnce2.default)('Node#style() is deprecated. Use Node#raw()');
        return this.raw(own, detect);
    };

    Node.prototype.cleanStyles = function cleanStyles(keepBetween) {
        (0, _warnOnce2.default)('Node#cleanStyles() is deprecated. Use Node#cleanRaws()');
        return this.cleanRaws(keepBetween);
    };

    _createClass(Node, [{
        key: 'before',
        get: function get() {
            (0, _warnOnce2.default)('Node#before is deprecated. Use Node#raws.before');
            return this.raws.before;
        },
        set: function set(val) {
            (0, _warnOnce2.default)('Node#before is deprecated. Use Node#raws.before');
            this.raws.before = val;
        }
    }, {
        key: 'between',
        get: function get() {
            (0, _warnOnce2.default)('Node#between is deprecated. Use Node#raws.between');
            return this.raws.between;
        },
        set: function set(val) {
            (0, _warnOnce2.default)('Node#between is deprecated. Use Node#raws.between');
            this.raws.between = val;
        }

        /**
         * @memberof Node#
         * @member {string} type - String representing the node’s type.
         *                         Possible values are `root`, `atrule`, `rule`,
         *                         `decl`, or `comment`.
         *
         * @example
         * postcss.decl({ prop: 'color', value: 'black' }).type //=> 'decl'
         */

        /**
         * @memberof Node#
         * @member {Container} parent - the node’s parent node.
         *
         * @example
         * root.nodes[0].parent == root;
         */

        /**
         * @memberof Node#
         * @member {source} source - the input source of the node
         *
         * The property is used in source map generation.
         *
         * If you create a node manually (e.g., with `postcss.decl()`),
         * that node will not have a `source` property and will be absent
         * from the source map. For this reason, the plugin developer should
         * consider cloning nodes to create new ones (in which case the new node’s
         * source will reference the original, cloned node) or setting
         * the `source` property manually.
         *
         * ```js
         * // Bad
         * const prefixed = postcss.decl({
         *   prop: '-moz-' + decl.prop,
         *   value: decl.value
         * });
         *
         * // Good
         * const prefixed = decl.clone({ prop: '-moz-' + decl.prop });
         * ```
         *
         * ```js
         * if ( atrule.name == 'add-link' ) {
         *   const rule = postcss.rule({ selector: 'a', source: atrule.source });
         *   atrule.parent.insertBefore(atrule, rule);
         * }
         * ```
         *
         * @example
         * decl.source.input.from //=> '/home/ai/a.sass'
         * decl.source.start      //=> { line: 10, column: 2 }
         * decl.source.end        //=> { line: 10, column: 12 }
         */

        /**
         * @memberof Node#
         * @member {object} raws - Information to generate byte-to-byte equal
         *                         node string as it was in the origin input.
         *
         * Every parser saves its own properties,
         * but the default CSS parser uses:
         *
         * * `before`: the space symbols before the node. It also stores `*`
         *   and `_` symbols before the declaration (IE hack).
         * * `after`: the space symbols after the last child of the node
         *   to the end of the node.
         * * `between`: the symbols between the property and value
         *   for declarations, selector and `{` for rules, or last parameter
         *   and `{` for at-rules.
         * * `semicolon`: contains true if the last child has
         *   an (optional) semicolon.
         * * `afterName`: the space between the at-rule name and its parameters.
         * * `left`: the space symbols between `/*` and the comment’s text.
         * * `right`: the space symbols between the comment’s text
         *   and <code>*&#47;</code>.
         * * `important`: the content of the important statement,
         *   if it is not just `!important`.
         *
         * PostCSS cleans selectors, declaration values and at-rule parameters
         * from comments and extra spaces, but it stores origin content in raws
         * properties. As such, if you don’t change a declaration’s value,
         * PostCSS will use the raw value with comments.
         *
         * @example
         * const root = postcss.parse('a {\n  color:black\n}')
         * root.first.first.raws //=> { before: '\n  ', between: ':' }
         */

    }]);

    return Node;
}();

exports.default = Node;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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VCxFQUFjLE1BQWQsQ0FBUDtBQUNILEs7O21CQUVELFcsd0JBQVksVyxFQUFhO0FBQ3JCLGdDQUFTLHdEQUFUO0FBQ0EsZUFBTyxLQUFLLFNBQUwsQ0FBZSxXQUFmLENBQVA7QUFDSCxLOzs7OzRCQUVZO0FBQ1Qsb0NBQVMsaURBQVQ7QUFDQSxtQkFBTyxLQUFLLElBQUwsQ0FBVSxNQUFqQjtBQUNILFM7MEJBRVUsRyxFQUFLO0FBQ1osb0NBQVMsaURBQVQ7QUFDQSxpQkFBSyxJQUFMLENBQVUsTUFBVixHQUFtQixHQUFuQjtBQUNIOzs7NEJBRWE7QUFDVixvQ0FBUyxtREFBVDtBQUNBLG1CQUFPLEtBQUssSUFBTCxDQUFVLE9BQWpCO0FBQ0gsUzswQkFFVyxHLEVBQUs7QUFDYixvQ0FBUyxtREFBVDtBQUNBLGlCQUFLLElBQUwsQ0FBVSxPQUFWLEdBQW9CLEdBQXBCO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQkE2RlUsSSIsImZpbGUiOiJub2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENzc1N5bnRheEVycm9yIGZyb20gJy4vY3NzLXN5bnRheC1lcnJvcic7XG5pbXBvcnQgU3RyaW5naWZpZXIgICAgZnJvbSAnLi9zdHJpbmdpZmllcic7XG5pbXBvcnQgc3RyaW5naWZ5ICAgICAgZnJvbSAnLi9zdHJpbmdpZnknO1xuaW1wb3J0IHdhcm5PbmNlICAgICAgIGZyb20gJy4vd2Fybi1vbmNlJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7b2JqZWN0fSBwb3NpdGlvblxuICogQHByb3BlcnR5IHtudW1iZXJ9IGxpbmUgICAtIHNvdXJjZSBsaW5lIGluIGZpbGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjb2x1bW4gLSBzb3VyY2UgY29sdW1uIGluIGZpbGVcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IHNvdXJjZVxuICogQHByb3BlcnR5IHtJbnB1dH0gaW5wdXQgICAgLSB7QGxpbmsgSW5wdXR9IHdpdGggaW5wdXQgZmlsZVxuICogQHByb3BlcnR5IHtwb3NpdGlvbn0gc3RhcnQgLSBUaGUgc3RhcnRpbmcgcG9zaXRpb24gb2YgdGhlIG5vZGXigJlzIHNvdXJjZVxuICogQHByb3BlcnR5IHtwb3NpdGlvbn0gZW5kICAgLSBUaGUgZW5kaW5nIHBvc2l0aW9uIG9mIHRoZSBub2Rl4oCZcyBzb3VyY2VcbiAqL1xuXG5sZXQgY2xvbmVOb2RlID0gZnVuY3Rpb24gKG9iaiwgcGFyZW50KSB7XG4gICAgbGV0IGNsb25lZCA9IG5ldyBvYmouY29uc3RydWN0b3IoKTtcblxuICAgIGZvciAoIGxldCBpIGluIG9iaiApIHtcbiAgICAgICAgaWYgKCAhb2JqLmhhc093blByb3BlcnR5KGkpICkgY29udGludWU7XG4gICAgICAgIGxldCB2YWx1ZSA9IG9ialtpXTtcbiAgICAgICAgbGV0IHR5cGUgID0gdHlwZW9mIHZhbHVlO1xuXG4gICAgICAgIGlmICggaSA9PT0gJ3BhcmVudCcgJiYgdHlwZSA9PT0gJ29iamVjdCcgKSB7XG4gICAgICAgICAgICBpZiAocGFyZW50KSBjbG9uZWRbaV0gPSBwYXJlbnQ7XG4gICAgICAgIH0gZWxzZSBpZiAoIGkgPT09ICdzb3VyY2UnICkge1xuICAgICAgICAgICAgY2xvbmVkW2ldID0gdmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgKSB7XG4gICAgICAgICAgICBjbG9uZWRbaV0gPSB2YWx1ZS5tYXAoIGogPT4gY2xvbmVOb2RlKGosIGNsb25lZCkgKTtcbiAgICAgICAgfSBlbHNlIGlmICggaSAhPT0gJ2JlZm9yZScgICYmIGkgIT09ICdhZnRlcicgJiZcbiAgICAgICAgICAgICAgICAgICAgaSAhPT0gJ2JldHdlZW4nICYmIGkgIT09ICdzZW1pY29sb24nICkge1xuICAgICAgICAgICAgaWYgKCB0eXBlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCApIHZhbHVlID0gY2xvbmVOb2RlKHZhbHVlKTtcbiAgICAgICAgICAgIGNsb25lZFtpXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lZDtcbn07XG5cbi8qKlxuICogQWxsIG5vZGUgY2xhc3NlcyBpbmhlcml0IHRoZSBmb2xsb3dpbmcgY29tbW9uIG1ldGhvZHMuXG4gKlxuICogQGFic3RyYWN0XG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIE5vZGUge1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkZWZhdWx0c10gLSB2YWx1ZSBmb3Igbm9kZSBwcm9wZXJ0aWVzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZGVmYXVsdHMgPSB7IH0pIHtcbiAgICAgICAgdGhpcy5yYXdzID0geyB9O1xuICAgICAgICBmb3IgKCBsZXQgbmFtZSBpbiBkZWZhdWx0cyApIHtcbiAgICAgICAgICAgIHRoaXNbbmFtZV0gPSBkZWZhdWx0c1tuYW1lXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBDc3NTeW50YXhFcnJvciBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBvcmlnaW5hbCBwb3NpdGlvblxuICAgICAqIG9mIHRoZSBub2RlIGluIHRoZSBzb3VyY2UsIHNob3dpbmcgbGluZSBhbmQgY29sdW1uIG51bWJlcnMgYW5kIGFsc29cbiAgICAgKiBhIHNtYWxsIGV4Y2VycHQgdG8gZmFjaWxpdGF0ZSBkZWJ1Z2dpbmcuXG4gICAgICpcbiAgICAgKiBJZiBwcmVzZW50LCBhbiBpbnB1dCBzb3VyY2UgbWFwIHdpbGwgYmUgdXNlZCB0byBnZXQgdGhlIG9yaWdpbmFsIHBvc2l0aW9uXG4gICAgICogb2YgdGhlIHNvdXJjZSwgZXZlbiBmcm9tIGEgcHJldmlvdXMgY29tcGlsYXRpb24gc3RlcFxuICAgICAqIChlLmcuLCBmcm9tIFNhc3MgY29tcGlsYXRpb24pLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgcHJvZHVjZXMgdmVyeSB1c2VmdWwgZXJyb3IgbWVzc2FnZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAgICAgLSBlcnJvciBkZXNjcmlwdGlvblxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0c10gICAgICAtIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0cy5wbHVnaW4gLSBwbHVnaW4gbmFtZSB0aGF0IGNyZWF0ZWQgdGhpcyBlcnJvci5cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQb3N0Q1NTIHdpbGwgc2V0IGl0IGF1dG9tYXRpY2FsbHkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdHMud29yZCAgIC0gYSB3b3JkIGluc2lkZSBhIG5vZGXigJlzIHN0cmluZyB0aGF0IHNob3VsZFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJlIGhpZ2hsaWdodGVkIGFzIHRoZSBzb3VyY2Ugb2YgdGhlIGVycm9yXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG9wdHMuaW5kZXggIC0gYW4gaW5kZXggaW5zaWRlIGEgbm9kZeKAmXMgc3RyaW5nIHRoYXQgc2hvdWxkXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmUgaGlnaGxpZ2h0ZWQgYXMgdGhlIHNvdXJjZSBvZiB0aGUgZXJyb3JcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Nzc1N5bnRheEVycm9yfSBlcnJvciBvYmplY3QgdG8gdGhyb3cgaXRcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogaWYgKCAhdmFyaWFibGVzW25hbWVdICkge1xuICAgICAqICAgdGhyb3cgZGVjbC5lcnJvcignVW5rbm93biB2YXJpYWJsZSAnICsgbmFtZSwgeyB3b3JkOiBuYW1lIH0pO1xuICAgICAqICAgLy8gQ3NzU3ludGF4RXJyb3I6IHBvc3Rjc3MtdmFyczphLnNhc3M6NDozOiBVbmtub3duIHZhcmlhYmxlICRibGFja1xuICAgICAqICAgLy8gICBjb2xvcjogJGJsYWNrXG4gICAgICogICAvLyBhXG4gICAgICogICAvLyAgICAgICAgICBeXG4gICAgICogICAvLyAgIGJhY2tncm91bmQ6IHdoaXRlXG4gICAgICogfVxuICAgICAqL1xuICAgIGVycm9yKG1lc3NhZ2UsIG9wdHMgPSB7IH0pIHtcbiAgICAgICAgaWYgKCB0aGlzLnNvdXJjZSApIHtcbiAgICAgICAgICAgIGxldCBwb3MgPSB0aGlzLnBvc2l0aW9uQnkob3B0cyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2UuaW5wdXQuZXJyb3IobWVzc2FnZSwgcG9zLmxpbmUsIHBvcy5jb2x1bW4sIG9wdHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDc3NTeW50YXhFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHByb3ZpZGVkIGFzIGEgY29udmVuaWVuY2Ugd3JhcHBlciBmb3Ige0BsaW5rIFJlc3VsdCN3YXJufS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UmVzdWx0fSByZXN1bHQgICAgICAtIHRoZSB7QGxpbmsgUmVzdWx0fSBpbnN0YW5jZVxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQgd2lsbCByZWNlaXZlIHRoZSB3YXJuaW5nXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgICAgICAgIC0gd2FybmluZyBtZXNzYWdlXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRzXSAgICAgIC0gb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLnBsdWdpbiAtIHBsdWdpbiBuYW1lIHRoYXQgY3JlYXRlZCB0aGlzIHdhcm5pbmcuXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUG9zdENTUyB3aWxsIHNldCBpdCBhdXRvbWF0aWNhbGx5LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRzLndvcmQgICAtIGEgd29yZCBpbnNpZGUgYSBub2Rl4oCZcyBzdHJpbmcgdGhhdCBzaG91bGRcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZSBoaWdobGlnaHRlZCBhcyB0aGUgc291cmNlIG9mIHRoZSB3YXJuaW5nXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IG9wdHMuaW5kZXggIC0gYW4gaW5kZXggaW5zaWRlIGEgbm9kZeKAmXMgc3RyaW5nIHRoYXQgc2hvdWxkXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmUgaGlnaGxpZ2h0ZWQgYXMgdGhlIHNvdXJjZSBvZiB0aGUgd2FybmluZ1xuICAgICAqXG4gICAgICogQHJldHVybiB7V2FybmluZ30gY3JlYXRlZCB3YXJuaW5nIG9iamVjdFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBwbHVnaW4gPSBwb3N0Y3NzLnBsdWdpbigncG9zdGNzcy1kZXByZWNhdGVkJywgKCkgPT4ge1xuICAgICAqICAgcmV0dXJuIChjc3MsIHJlc3VsdCkgPT4ge1xuICAgICAqICAgICBjc3Mud2Fsa0RlY2xzKCdiYWQnLCBkZWNsID0+IHtcbiAgICAgKiAgICAgICBkZWNsLndhcm4ocmVzdWx0LCAnRGVwcmVjYXRlZCBwcm9wZXJ0eSBiYWQnKTtcbiAgICAgKiAgICAgfSk7XG4gICAgICogICB9O1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHdhcm4ocmVzdWx0LCB0ZXh0LCBvcHRzKSB7XG4gICAgICAgIGxldCBkYXRhID0geyBub2RlOiB0aGlzIH07XG4gICAgICAgIGZvciAoIGxldCBpIGluIG9wdHMgKSBkYXRhW2ldID0gb3B0c1tpXTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC53YXJuKHRleHQsIGRhdGEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIG5vZGUgZnJvbSBpdHMgcGFyZW50IGFuZCBjbGVhbnMgdGhlIHBhcmVudCBwcm9wZXJ0aWVzXG4gICAgICogZnJvbSB0aGUgbm9kZSBhbmQgaXRzIGNoaWxkcmVuLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBpZiAoIGRlY2wucHJvcC5tYXRjaCgvXi13ZWJraXQtLykgKSB7XG4gICAgICogICBkZWNsLnJlbW92ZSgpO1xuICAgICAqIH1cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge05vZGV9IG5vZGUgdG8gbWFrZSBjYWxscyBjaGFpblxuICAgICAqL1xuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgaWYgKCB0aGlzLnBhcmVudCApIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnJlbW92ZUNoaWxkKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgQ1NTIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG5vZGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ2lmaWVyfHN5bnRheH0gW3N0cmluZ2lmaWVyXSAtIGEgc3ludGF4IHRvIHVzZVxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW4gc3RyaW5nIGdlbmVyYXRpb25cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQ1NTIHN0cmluZyBvZiB0aGlzIG5vZGVcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogcG9zdGNzcy5ydWxlKHsgc2VsZWN0b3I6ICdhJyB9KS50b1N0cmluZygpIC8vPT4gXCJhIHt9XCJcbiAgICAgKi9cbiAgICB0b1N0cmluZyhzdHJpbmdpZmllciA9IHN0cmluZ2lmeSkge1xuICAgICAgICBpZiAoIHN0cmluZ2lmaWVyLnN0cmluZ2lmeSApIHN0cmluZ2lmaWVyID0gc3RyaW5naWZpZXIuc3RyaW5naWZ5O1xuICAgICAgICBsZXQgcmVzdWx0ICA9ICcnO1xuICAgICAgICBzdHJpbmdpZmllcih0aGlzLCBpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgY2xvbmUgb2YgdGhlIG5vZGUuXG4gICAgICpcbiAgICAgKiBUaGUgcmVzdWx0aW5nIGNsb25lZCBub2RlIGFuZCBpdHMgKGNsb25lZCkgY2hpbGRyZW4gd2lsbCBoYXZlXG4gICAgICogYSBjbGVhbiBwYXJlbnQgYW5kIGNvZGUgc3R5bGUgcHJvcGVydGllcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3ZlcnJpZGVzXSAtIG5ldyBwcm9wZXJ0aWVzIHRvIG92ZXJyaWRlIGluIHRoZSBjbG9uZS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3QgY2xvbmVkID0gZGVjbC5jbG9uZSh7IHByb3A6ICctbW96LScgKyBkZWNsLnByb3AgfSk7XG4gICAgICogY2xvbmVkLnJhd3MuYmVmb3JlICAvLz0+IHVuZGVmaW5lZFxuICAgICAqIGNsb25lZC5wYXJlbnQgICAgICAgLy89PiB1bmRlZmluZWRcbiAgICAgKiBjbG9uZWQudG9TdHJpbmcoKSAgIC8vPT4gLW1vei10cmFuc2Zvcm06IHNjYWxlKDApXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOb2RlfSBjbG9uZSBvZiB0aGUgbm9kZVxuICAgICAqL1xuICAgIGNsb25lKG92ZXJyaWRlcyA9IHsgfSkge1xuICAgICAgICBsZXQgY2xvbmVkID0gY2xvbmVOb2RlKHRoaXMpO1xuICAgICAgICBmb3IgKCBsZXQgbmFtZSBpbiBvdmVycmlkZXMgKSB7XG4gICAgICAgICAgICBjbG9uZWRbbmFtZV0gPSBvdmVycmlkZXNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBob3J0Y3V0IHRvIGNsb25lIHRoZSBub2RlIGFuZCBpbnNlcnQgdGhlIHJlc3VsdGluZyBjbG9uZWQgbm9kZVxuICAgICAqIGJlZm9yZSB0aGUgY3VycmVudCBub2RlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvdmVycmlkZXNdIC0gbmV3IHByb3BlcnRpZXMgdG8gb3ZlcnJpZGUgaW4gdGhlIGNsb25lLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBkZWNsLmNsb25lQmVmb3JlKHsgcHJvcDogJy1tb3otJyArIGRlY2wucHJvcCB9KTtcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge05vZGV9IC0gbmV3IG5vZGVcbiAgICAgKi9cbiAgICBjbG9uZUJlZm9yZShvdmVycmlkZXMgPSB7IH0pIHtcbiAgICAgICAgbGV0IGNsb25lZCA9IHRoaXMuY2xvbmUob3ZlcnJpZGVzKTtcbiAgICAgICAgdGhpcy5wYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMsIGNsb25lZCk7XG4gICAgICAgIHJldHVybiBjbG9uZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogaG9ydGN1dCB0byBjbG9uZSB0aGUgbm9kZSBhbmQgaW5zZXJ0IHRoZSByZXN1bHRpbmcgY2xvbmVkIG5vZGVcbiAgICAgKiBhZnRlciB0aGUgY3VycmVudCBub2RlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvdmVycmlkZXNdIC0gbmV3IHByb3BlcnRpZXMgdG8gb3ZlcnJpZGUgaW4gdGhlIGNsb25lLlxuICAgICAqXG4gICAgICogQHJldHVybiB7Tm9kZX0gLSBuZXcgbm9kZVxuICAgICAqL1xuICAgIGNsb25lQWZ0ZXIob3ZlcnJpZGVzID0geyB9KSB7XG4gICAgICAgIGxldCBjbG9uZWQgPSB0aGlzLmNsb25lKG92ZXJyaWRlcyk7XG4gICAgICAgIHRoaXMucGFyZW50Lmluc2VydEFmdGVyKHRoaXMsIGNsb25lZCk7XG4gICAgICAgIHJldHVybiBjbG9uZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5zZXJ0cyBub2RlKHMpIGJlZm9yZSB0aGUgY3VycmVudCBub2RlIGFuZCByZW1vdmVzIHRoZSBjdXJyZW50IG5vZGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gey4uLk5vZGV9IG5vZGVzIC0gbm9kZShzKSB0byByZXBsYWNlIGN1cnJlbnQgb25lXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGlmICggYXRydWxlLm5hbWUgPT0gJ21peGluJyApIHtcbiAgICAgKiAgIGF0cnVsZS5yZXBsYWNlV2l0aChtaXhpblJ1bGVzW2F0cnVsZS5wYXJhbXNdKTtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOb2RlfSBjdXJyZW50IG5vZGUgdG8gbWV0aG9kcyBjaGFpblxuICAgICAqL1xuICAgIHJlcGxhY2VXaXRoKC4uLm5vZGVzKSB7XG4gICAgICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgICAgICAgZm9yIChsZXQgbm9kZSBvZiBub2Rlcykge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLCBub2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIG5vZGUgZnJvbSBpdHMgY3VycmVudCBwYXJlbnQgYW5kIGluc2VydHMgaXRcbiAgICAgKiBhdCB0aGUgZW5kIG9mIGBuZXdQYXJlbnRgLlxuICAgICAqXG4gICAgICogVGhpcyB3aWxsIGNsZWFuIHRoZSBgYmVmb3JlYCBhbmQgYGFmdGVyYCBjb2RlIHtAbGluayBOb2RlI3Jhd3N9IGRhdGFcbiAgICAgKiBmcm9tIHRoZSBub2RlIGFuZCByZXBsYWNlIHRoZW0gd2l0aCB0aGUgaW5kZW50YXRpb24gc3R5bGUgb2YgYG5ld1BhcmVudGAuXG4gICAgICogSXQgd2lsbCBhbHNvIGNsZWFuIHRoZSBgYmV0d2VlbmAgcHJvcGVydHlcbiAgICAgKiBpZiBgbmV3UGFyZW50YCBpcyBpbiBhbm90aGVyIHtAbGluayBSb290fS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Q29udGFpbmVyfSBuZXdQYXJlbnQgLSBjb250YWluZXIgbm9kZSB3aGVyZSB0aGUgY3VycmVudCBub2RlXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGwgYmUgbW92ZWRcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogYXRydWxlLm1vdmVUbyhhdHJ1bGUucm9vdCgpKTtcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge05vZGV9IGN1cnJlbnQgbm9kZSB0byBtZXRob2RzIGNoYWluXG4gICAgICovXG4gICAgbW92ZVRvKG5ld1BhcmVudCkge1xuICAgICAgICB0aGlzLmNsZWFuUmF3cyh0aGlzLnJvb3QoKSA9PT0gbmV3UGFyZW50LnJvb3QoKSk7XG4gICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgIG5ld1BhcmVudC5hcHBlbmQodGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIG5vZGUgZnJvbSBpdHMgY3VycmVudCBwYXJlbnQgYW5kIGluc2VydHMgaXQgaW50b1xuICAgICAqIGEgbmV3IHBhcmVudCBiZWZvcmUgYG90aGVyTm9kZWAuXG4gICAgICpcbiAgICAgKiBUaGlzIHdpbGwgYWxzbyBjbGVhbiB0aGUgbm9kZeKAmXMgY29kZSBzdHlsZSBwcm9wZXJ0aWVzIGp1c3QgYXMgaXQgd291bGRcbiAgICAgKiBpbiB7QGxpbmsgTm9kZSNtb3ZlVG99LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOb2RlfSBvdGhlck5vZGUgLSBub2RlIHRoYXQgd2lsbCBiZSBiZWZvcmUgY3VycmVudCBub2RlXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOb2RlfSBjdXJyZW50IG5vZGUgdG8gbWV0aG9kcyBjaGFpblxuICAgICAqL1xuICAgIG1vdmVCZWZvcmUob3RoZXJOb2RlKSB7XG4gICAgICAgIHRoaXMuY2xlYW5SYXdzKHRoaXMucm9vdCgpID09PSBvdGhlck5vZGUucm9vdCgpKTtcbiAgICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICAgICAgb3RoZXJOb2RlLnBhcmVudC5pbnNlcnRCZWZvcmUob3RoZXJOb2RlLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbm9kZSBmcm9tIGl0cyBjdXJyZW50IHBhcmVudCBhbmQgaW5zZXJ0cyBpdCBpbnRvXG4gICAgICogYSBuZXcgcGFyZW50IGFmdGVyIGBvdGhlck5vZGVgLlxuICAgICAqXG4gICAgICogVGhpcyB3aWxsIGFsc28gY2xlYW4gdGhlIG5vZGXigJlzIGNvZGUgc3R5bGUgcHJvcGVydGllcyBqdXN0IGFzIGl0IHdvdWxkXG4gICAgICogaW4ge0BsaW5rIE5vZGUjbW92ZVRvfS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Tm9kZX0gb3RoZXJOb2RlIC0gbm9kZSB0aGF0IHdpbGwgYmUgYWZ0ZXIgY3VycmVudCBub2RlXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOb2RlfSBjdXJyZW50IG5vZGUgdG8gbWV0aG9kcyBjaGFpblxuICAgICAqL1xuICAgIG1vdmVBZnRlcihvdGhlck5vZGUpIHtcbiAgICAgICAgdGhpcy5jbGVhblJhd3ModGhpcy5yb290KCkgPT09IG90aGVyTm9kZS5yb290KCkpO1xuICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICBvdGhlck5vZGUucGFyZW50Lmluc2VydEFmdGVyKG90aGVyTm9kZSwgdGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5leHQgY2hpbGQgb2YgdGhlIG5vZGXigJlzIHBhcmVudC5cbiAgICAgKiBSZXR1cm5zIGB1bmRlZmluZWRgIGlmIHRoZSBjdXJyZW50IG5vZGUgaXMgdGhlIGxhc3QgY2hpbGQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtOb2RlfHVuZGVmaW5lZH0gbmV4dCBub2RlXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGlmICggY29tbWVudC50ZXh0ID09PSAnZGVsZXRlIG5leHQnICkge1xuICAgICAqICAgY29uc3QgbmV4dCA9IGNvbW1lbnQubmV4dCgpO1xuICAgICAqICAgaWYgKCBuZXh0ICkge1xuICAgICAqICAgICBuZXh0LnJlbW92ZSgpO1xuICAgICAqICAgfVxuICAgICAqIH1cbiAgICAgKi9cbiAgICBuZXh0KCkge1xuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLnBhcmVudC5pbmRleCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50Lm5vZGVzW2luZGV4ICsgMV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcHJldmlvdXMgY2hpbGQgb2YgdGhlIG5vZGXigJlzIHBhcmVudC5cbiAgICAgKiBSZXR1cm5zIGB1bmRlZmluZWRgIGlmIHRoZSBjdXJyZW50IG5vZGUgaXMgdGhlIGZpcnN0IGNoaWxkLlxuICAgICAqXG4gICAgICogQHJldHVybiB7Tm9kZXx1bmRlZmluZWR9IHByZXZpb3VzIG5vZGVcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3QgYW5ub3RhdGlvbiA9IGRlY2wucHJldigpO1xuICAgICAqIGlmICggYW5ub3RhdGlvbi50eXBlID09ICdjb21tZW50JyApIHtcbiAgICAgKiAgcmVhZEFubm90YXRpb24oYW5ub3RhdGlvbi50ZXh0KTtcbiAgICAgKiB9XG4gICAgICovXG4gICAgcHJldigpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5wYXJlbnQuaW5kZXgodGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5ub2Rlc1tpbmRleCAtIDFdO1xuICAgIH1cblxuICAgIHRvSlNPTigpIHtcbiAgICAgICAgbGV0IGZpeGVkID0geyB9O1xuXG4gICAgICAgIGZvciAoIGxldCBuYW1lIGluIHRoaXMgKSB7XG4gICAgICAgICAgICBpZiAoICF0aGlzLmhhc093blByb3BlcnR5KG5hbWUpICkgY29udGludWU7XG4gICAgICAgICAgICBpZiAoIG5hbWUgPT09ICdwYXJlbnQnICkgY29udGludWU7XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzW25hbWVdO1xuXG4gICAgICAgICAgICBpZiAoIHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgKSB7XG4gICAgICAgICAgICAgICAgZml4ZWRbbmFtZV0gPSB2YWx1ZS5tYXAoIGkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBpID09PSAnb2JqZWN0JyAmJiBpLnRvSlNPTiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpLnRvSlNPTigpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUudG9KU09OICkge1xuICAgICAgICAgICAgICAgIGZpeGVkW25hbWVdID0gdmFsdWUudG9KU09OKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpeGVkW25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZml4ZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHtAbGluayBOb2RlI3Jhd3N9IHZhbHVlLiBJZiB0aGUgbm9kZSBpcyBtaXNzaW5nXG4gICAgICogdGhlIGNvZGUgc3R5bGUgcHJvcGVydHkgKGJlY2F1c2UgdGhlIG5vZGUgd2FzIG1hbnVhbGx5IGJ1aWx0IG9yIGNsb25lZCksXG4gICAgICogUG9zdENTUyB3aWxsIHRyeSB0byBhdXRvZGV0ZWN0IHRoZSBjb2RlIHN0eWxlIHByb3BlcnR5IGJ5IGxvb2tpbmdcbiAgICAgKiBhdCBvdGhlciBub2RlcyBpbiB0aGUgdHJlZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wICAgICAgICAgIC0gbmFtZSBvZiBjb2RlIHN0eWxlIHByb3BlcnR5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtkZWZhdWx0VHlwZV0gLSBuYW1lIG9mIGRlZmF1bHQgdmFsdWUsIGl0IGNhbiBiZSBtaXNzZWRcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHRoZSB2YWx1ZSBpcyB0aGUgc2FtZSBhcyBwcm9wXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHJvb3QgPSBwb3N0Y3NzLnBhcnNlKCdhIHsgYmFja2dyb3VuZDogd2hpdGUgfScpO1xuICAgICAqIHJvb3Qubm9kZXNbMF0uYXBwZW5kKHsgcHJvcDogJ2NvbG9yJywgdmFsdWU6ICdibGFjaycgfSk7XG4gICAgICogcm9vdC5ub2Rlc1swXS5ub2Rlc1sxXS5yYXdzLmJlZm9yZSAgIC8vPT4gdW5kZWZpbmVkXG4gICAgICogcm9vdC5ub2Rlc1swXS5ub2Rlc1sxXS5yYXcoJ2JlZm9yZScpIC8vPT4gJyAnXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IGNvZGUgc3R5bGUgdmFsdWVcbiAgICAgKi9cbiAgICByYXcocHJvcCwgZGVmYXVsdFR5cGUpIHtcbiAgICAgICAgbGV0IHN0ciA9IG5ldyBTdHJpbmdpZmllcigpO1xuICAgICAgICByZXR1cm4gc3RyLnJhdyh0aGlzLCBwcm9wLCBkZWZhdWx0VHlwZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIFJvb3QgaW5zdGFuY2Ugb2YgdGhlIG5vZGXigJlzIHRyZWUuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJvb3Qubm9kZXNbMF0ubm9kZXNbMF0ucm9vdCgpID09PSByb290XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtSb290fSByb290IHBhcmVudFxuICAgICAqL1xuICAgIHJvb3QoKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzO1xuICAgICAgICB3aGlsZSAoIHJlc3VsdC5wYXJlbnQgKSByZXN1bHQgPSByZXN1bHQucGFyZW50O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGNsZWFuUmF3cyhrZWVwQmV0d2Vlbikge1xuICAgICAgICBkZWxldGUgdGhpcy5yYXdzLmJlZm9yZTtcbiAgICAgICAgZGVsZXRlIHRoaXMucmF3cy5hZnRlcjtcbiAgICAgICAgaWYgKCAha2VlcEJldHdlZW4gKSBkZWxldGUgdGhpcy5yYXdzLmJldHdlZW47XG4gICAgfVxuXG4gICAgcG9zaXRpb25JbnNpZGUoaW5kZXgpIHtcbiAgICAgICAgbGV0IHN0cmluZyA9IHRoaXMudG9TdHJpbmcoKTtcbiAgICAgICAgbGV0IGNvbHVtbiA9IHRoaXMuc291cmNlLnN0YXJ0LmNvbHVtbjtcbiAgICAgICAgbGV0IGxpbmUgICA9IHRoaXMuc291cmNlLnN0YXJ0LmxpbmU7XG5cbiAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgaW5kZXg7IGkrKyApIHtcbiAgICAgICAgICAgIGlmICggc3RyaW5nW2ldID09PSAnXFxuJyApIHtcbiAgICAgICAgICAgICAgICBjb2x1bW4gPSAxO1xuICAgICAgICAgICAgICAgIGxpbmUgICs9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbHVtbiArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgbGluZSwgY29sdW1uIH07XG4gICAgfVxuXG4gICAgcG9zaXRpb25CeShvcHRzKSB7XG4gICAgICAgIGxldCBwb3MgPSB0aGlzLnNvdXJjZS5zdGFydDtcbiAgICAgICAgaWYgKCBvcHRzLmluZGV4ICkge1xuICAgICAgICAgICAgcG9zID0gdGhpcy5wb3NpdGlvbkluc2lkZShvcHRzLmluZGV4KTtcbiAgICAgICAgfSBlbHNlIGlmICggb3B0cy53b3JkICkge1xuICAgICAgICAgICAgbGV0IGluZGV4ID0gdGhpcy50b1N0cmluZygpLmluZGV4T2Yob3B0cy53b3JkKTtcbiAgICAgICAgICAgIGlmICggaW5kZXggIT09IC0xICkgcG9zID0gdGhpcy5wb3NpdGlvbkluc2lkZShpbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICB9XG5cbiAgICByZW1vdmVTZWxmKCkge1xuICAgICAgICB3YXJuT25jZSgnTm9kZSNyZW1vdmVTZWxmIGlzIGRlcHJlY2F0ZWQuIFVzZSBOb2RlI3JlbW92ZS4nKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgcmVwbGFjZShub2Rlcykge1xuICAgICAgICB3YXJuT25jZSgnTm9kZSNyZXBsYWNlIGlzIGRlcHJlY2F0ZWQuIFVzZSBOb2RlI3JlcGxhY2VXaXRoJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcGxhY2VXaXRoKG5vZGVzKTtcbiAgICB9XG5cbiAgICBzdHlsZShvd24sIGRldGVjdCkge1xuICAgICAgICB3YXJuT25jZSgnTm9kZSNzdHlsZSgpIGlzIGRlcHJlY2F0ZWQuIFVzZSBOb2RlI3JhdygpJyk7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdyhvd24sIGRldGVjdCk7XG4gICAgfVxuXG4gICAgY2xlYW5TdHlsZXMoa2VlcEJldHdlZW4pIHtcbiAgICAgICAgd2Fybk9uY2UoJ05vZGUjY2xlYW5TdHlsZXMoKSBpcyBkZXByZWNhdGVkLiBVc2UgTm9kZSNjbGVhblJhd3MoKScpO1xuICAgICAgICByZXR1cm4gdGhpcy5jbGVhblJhd3Moa2VlcEJldHdlZW4pO1xuICAgIH1cblxuICAgIGdldCBiZWZvcmUoKSB7XG4gICAgICAgIHdhcm5PbmNlKCdOb2RlI2JlZm9yZSBpcyBkZXByZWNhdGVkLiBVc2UgTm9kZSNyYXdzLmJlZm9yZScpO1xuICAgICAgICByZXR1cm4gdGhpcy5yYXdzLmJlZm9yZTtcbiAgICB9XG5cbiAgICBzZXQgYmVmb3JlKHZhbCkge1xuICAgICAgICB3YXJuT25jZSgnTm9kZSNiZWZvcmUgaXMgZGVwcmVjYXRlZC4gVXNlIE5vZGUjcmF3cy5iZWZvcmUnKTtcbiAgICAgICAgdGhpcy5yYXdzLmJlZm9yZSA9IHZhbDtcbiAgICB9XG5cbiAgICBnZXQgYmV0d2VlbigpIHtcbiAgICAgICAgd2Fybk9uY2UoJ05vZGUjYmV0d2VlbiBpcyBkZXByZWNhdGVkLiBVc2UgTm9kZSNyYXdzLmJldHdlZW4nKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3cy5iZXR3ZWVuO1xuICAgIH1cblxuICAgIHNldCBiZXR3ZWVuKHZhbCkge1xuICAgICAgICB3YXJuT25jZSgnTm9kZSNiZXR3ZWVuIGlzIGRlcHJlY2F0ZWQuIFVzZSBOb2RlI3Jhd3MuYmV0d2VlbicpO1xuICAgICAgICB0aGlzLnJhd3MuYmV0d2VlbiA9IHZhbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbWVtYmVyb2YgTm9kZSNcbiAgICAgKiBAbWVtYmVyIHtzdHJpbmd9IHR5cGUgLSBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBub2Rl4oCZcyB0eXBlLlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIFBvc3NpYmxlIHZhbHVlcyBhcmUgYHJvb3RgLCBgYXRydWxlYCwgYHJ1bGVgLFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgIGBkZWNsYCwgb3IgYGNvbW1lbnRgLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBwb3N0Y3NzLmRlY2woeyBwcm9wOiAnY29sb3InLCB2YWx1ZTogJ2JsYWNrJyB9KS50eXBlIC8vPT4gJ2RlY2wnXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBAbWVtYmVyb2YgTm9kZSNcbiAgICAgKiBAbWVtYmVyIHtDb250YWluZXJ9IHBhcmVudCAtIHRoZSBub2Rl4oCZcyBwYXJlbnQgbm9kZS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogcm9vdC5ub2Rlc1swXS5wYXJlbnQgPT0gcm9vdDtcbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEBtZW1iZXJvZiBOb2RlI1xuICAgICAqIEBtZW1iZXIge3NvdXJjZX0gc291cmNlIC0gdGhlIGlucHV0IHNvdXJjZSBvZiB0aGUgbm9kZVxuICAgICAqXG4gICAgICogVGhlIHByb3BlcnR5IGlzIHVzZWQgaW4gc291cmNlIG1hcCBnZW5lcmF0aW9uLlxuICAgICAqXG4gICAgICogSWYgeW91IGNyZWF0ZSBhIG5vZGUgbWFudWFsbHkgKGUuZy4sIHdpdGggYHBvc3Rjc3MuZGVjbCgpYCksXG4gICAgICogdGhhdCBub2RlIHdpbGwgbm90IGhhdmUgYSBgc291cmNlYCBwcm9wZXJ0eSBhbmQgd2lsbCBiZSBhYnNlbnRcbiAgICAgKiBmcm9tIHRoZSBzb3VyY2UgbWFwLiBGb3IgdGhpcyByZWFzb24sIHRoZSBwbHVnaW4gZGV2ZWxvcGVyIHNob3VsZFxuICAgICAqIGNvbnNpZGVyIGNsb25pbmcgbm9kZXMgdG8gY3JlYXRlIG5ldyBvbmVzIChpbiB3aGljaCBjYXNlIHRoZSBuZXcgbm9kZeKAmXNcbiAgICAgKiBzb3VyY2Ugd2lsbCByZWZlcmVuY2UgdGhlIG9yaWdpbmFsLCBjbG9uZWQgbm9kZSkgb3Igc2V0dGluZ1xuICAgICAqIHRoZSBgc291cmNlYCBwcm9wZXJ0eSBtYW51YWxseS5cbiAgICAgKlxuICAgICAqIGBgYGpzXG4gICAgICogLy8gQmFkXG4gICAgICogY29uc3QgcHJlZml4ZWQgPSBwb3N0Y3NzLmRlY2woe1xuICAgICAqICAgcHJvcDogJy1tb3otJyArIGRlY2wucHJvcCxcbiAgICAgKiAgIHZhbHVlOiBkZWNsLnZhbHVlXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiAvLyBHb29kXG4gICAgICogY29uc3QgcHJlZml4ZWQgPSBkZWNsLmNsb25lKHsgcHJvcDogJy1tb3otJyArIGRlY2wucHJvcCB9KTtcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIGBgYGpzXG4gICAgICogaWYgKCBhdHJ1bGUubmFtZSA9PSAnYWRkLWxpbmsnICkge1xuICAgICAqICAgY29uc3QgcnVsZSA9IHBvc3Rjc3MucnVsZSh7IHNlbGVjdG9yOiAnYScsIHNvdXJjZTogYXRydWxlLnNvdXJjZSB9KTtcbiAgICAgKiAgIGF0cnVsZS5wYXJlbnQuaW5zZXJ0QmVmb3JlKGF0cnVsZSwgcnVsZSk7XG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBkZWNsLnNvdXJjZS5pbnB1dC5mcm9tIC8vPT4gJy9ob21lL2FpL2Euc2FzcydcbiAgICAgKiBkZWNsLnNvdXJjZS5zdGFydCAgICAgIC8vPT4geyBsaW5lOiAxMCwgY29sdW1uOiAyIH1cbiAgICAgKiBkZWNsLnNvdXJjZS5lbmQgICAgICAgIC8vPT4geyBsaW5lOiAxMCwgY29sdW1uOiAxMiB9XG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBAbWVtYmVyb2YgTm9kZSNcbiAgICAgKiBAbWVtYmVyIHtvYmplY3R9IHJhd3MgLSBJbmZvcm1hdGlvbiB0byBnZW5lcmF0ZSBieXRlLXRvLWJ5dGUgZXF1YWxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBub2RlIHN0cmluZyBhcyBpdCB3YXMgaW4gdGhlIG9yaWdpbiBpbnB1dC5cbiAgICAgKlxuICAgICAqIEV2ZXJ5IHBhcnNlciBzYXZlcyBpdHMgb3duIHByb3BlcnRpZXMsXG4gICAgICogYnV0IHRoZSBkZWZhdWx0IENTUyBwYXJzZXIgdXNlczpcbiAgICAgKlxuICAgICAqICogYGJlZm9yZWA6IHRoZSBzcGFjZSBzeW1ib2xzIGJlZm9yZSB0aGUgbm9kZS4gSXQgYWxzbyBzdG9yZXMgYCpgXG4gICAgICogICBhbmQgYF9gIHN5bWJvbHMgYmVmb3JlIHRoZSBkZWNsYXJhdGlvbiAoSUUgaGFjaykuXG4gICAgICogKiBgYWZ0ZXJgOiB0aGUgc3BhY2Ugc3ltYm9scyBhZnRlciB0aGUgbGFzdCBjaGlsZCBvZiB0aGUgbm9kZVxuICAgICAqICAgdG8gdGhlIGVuZCBvZiB0aGUgbm9kZS5cbiAgICAgKiAqIGBiZXR3ZWVuYDogdGhlIHN5bWJvbHMgYmV0d2VlbiB0aGUgcHJvcGVydHkgYW5kIHZhbHVlXG4gICAgICogICBmb3IgZGVjbGFyYXRpb25zLCBzZWxlY3RvciBhbmQgYHtgIGZvciBydWxlcywgb3IgbGFzdCBwYXJhbWV0ZXJcbiAgICAgKiAgIGFuZCBge2AgZm9yIGF0LXJ1bGVzLlxuICAgICAqICogYHNlbWljb2xvbmA6IGNvbnRhaW5zIHRydWUgaWYgdGhlIGxhc3QgY2hpbGQgaGFzXG4gICAgICogICBhbiAob3B0aW9uYWwpIHNlbWljb2xvbi5cbiAgICAgKiAqIGBhZnRlck5hbWVgOiB0aGUgc3BhY2UgYmV0d2VlbiB0aGUgYXQtcnVsZSBuYW1lIGFuZCBpdHMgcGFyYW1ldGVycy5cbiAgICAgKiAqIGBsZWZ0YDogdGhlIHNwYWNlIHN5bWJvbHMgYmV0d2VlbiBgLypgIGFuZCB0aGUgY29tbWVudOKAmXMgdGV4dC5cbiAgICAgKiAqIGByaWdodGA6IHRoZSBzcGFjZSBzeW1ib2xzIGJldHdlZW4gdGhlIGNvbW1lbnTigJlzIHRleHRcbiAgICAgKiAgIGFuZCA8Y29kZT4qJiM0Nzs8L2NvZGU+LlxuICAgICAqICogYGltcG9ydGFudGA6IHRoZSBjb250ZW50IG9mIHRoZSBpbXBvcnRhbnQgc3RhdGVtZW50LFxuICAgICAqICAgaWYgaXQgaXMgbm90IGp1c3QgYCFpbXBvcnRhbnRgLlxuICAgICAqXG4gICAgICogUG9zdENTUyBjbGVhbnMgc2VsZWN0b3JzLCBkZWNsYXJhdGlvbiB2YWx1ZXMgYW5kIGF0LXJ1bGUgcGFyYW1ldGVyc1xuICAgICAqIGZyb20gY29tbWVudHMgYW5kIGV4dHJhIHNwYWNlcywgYnV0IGl0IHN0b3JlcyBvcmlnaW4gY29udGVudCBpbiByYXdzXG4gICAgICogcHJvcGVydGllcy4gQXMgc3VjaCwgaWYgeW91IGRvbuKAmXQgY2hhbmdlIGEgZGVjbGFyYXRpb27igJlzIHZhbHVlLFxuICAgICAqIFBvc3RDU1Mgd2lsbCB1c2UgdGhlIHJhdyB2YWx1ZSB3aXRoIGNvbW1lbnRzLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCByb290ID0gcG9zdGNzcy5wYXJzZSgnYSB7XFxuICBjb2xvcjpibGFja1xcbn0nKVxuICAgICAqIHJvb3QuZmlyc3QuZmlyc3QucmF3cyAvLz0+IHsgYmVmb3JlOiAnXFxuICAnLCBiZXR3ZWVuOiAnOicgfVxuICAgICAqL1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGU7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

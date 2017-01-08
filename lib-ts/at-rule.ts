import Container from './container';
import warnOnce  from './warn-once';
import postcss   from './postcss';

export default class AtRule extends Container implements postcss.AtRule {
    /**
     * Returns a string representing the node's type. Possible values are
     * root, atrule, rule, decl or comment.
     */
    type = 'atrule';

    /**
     * Contains information to generate byte-to-byte equal node string as it
     * was in origin input.
     */
    raws: postcss.AtRuleRaws;

    /**
     * The identifier that immediately follows the @.
     */
    name: string;
    /**
     * These are the values that follow the at-rule's name, but precede any {}
     * block. The spec refers to this area as the at-rule's "prelude".
     */
    params: string;

    /**
     * Represents an at-rule. If it's followed in the CSS by a {} block, this
     * node will have a nodes property representing its children.
     */
    constructor(defaults?: postcss.AtRuleNewProps) {
        super(defaults);
    }

    /**
     * @param overrides New properties to override in the clone.
     * @returns A clone of this node. The node and its (cloned) children will
     * have a clean parent and code style properties.
     */
    clone(overrides?: Object) {
        return super.clone(overrides);
    }

    toJSON() {
        return <postcss.JsonAtRule>super.toJSON();
    }

    append(...children) {
        if ( !this.nodes ) this.nodes = [];
        super.append(...children);
        return this;
    }

    prepend(...children) {
        if ( !this.nodes ) this.nodes = [];
        super.prepend(...children);
        return this;
    }

    /* istanbul ignore next */
    get afterName() {
        warnOnce('AtRule#afterName was deprecated. Use AtRule#raws.afterName');
        return this.raws.afterName;
    }

    /* istanbul ignore next */
    set afterName(val) {
        warnOnce('AtRule#afterName was deprecated. Use AtRule#raws.afterName');
        this.raws.afterName = val;
    }

    /* istanbul ignore next */
    get _params() {
        warnOnce('AtRule#_params was deprecated. Use AtRule#raws.params');
        return this.raws.params;
    }

    /* istanbul ignore next */
    set _params(val) {
        warnOnce('AtRule#_params was deprecated. Use AtRule#raws.params');
        this.raws.params = val;
    }

}

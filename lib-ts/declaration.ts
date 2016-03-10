import warnOnce from './warn-once';
import postcss  from './postcss';
import Node     from './node';

export default class Declaration extends Node implements postcss.Declaration {
    /**
     * Returns a string representing the node's type. Possible values are
     * root, atrule, rule, decl or comment.
     */
    type = 'decl';

    /**
     * Contains information to generate byte-to-byte equal node string as it
     * was in origin input.
     */
    raws: postcss.DeclarationRaws;

    /**
     * The declaration's property name.
     */
    prop: string;

    /**
     * The declaration's value. This value will be cleaned of comments. If the
     * source value contained comments, those comments will be available in the
     * _value.raws property. If you have not changed the value, the result of
     * decl.toString() will include the original raws value (comments and all).
     */
    value: string;

    /**
     * True if the declaration has an !important annotation.
     */
    important: boolean;

    /**
     * Represents a CSS declaration.
     */
    constructor(defaults?: postcss.DeclarationNewProps) {
        super(defaults);
    }

    /**
     * @param overrides New properties to override in the clone.
     * @returns A clone of this node. The node and its (cloned) children will
     * have a clean parent and code style properties.
     */
    clone(overrides?: Object) {
        return <Declaration>super.clone(overrides);
    }

    toJSON() {
        return <postcss.JsonDeclaration>super.toJSON();
    }

    /* istanbul ignore next */
    get _value() {
        warnOnce('Node#_value was deprecated. Use Node#raws.value');
        return this.raws.value;
    }

    /* istanbul ignore next */
    set _value(val) {
        warnOnce('Node#_value was deprecated. Use Node#raws.value');
        this.raws.value = val;
    }

    /* istanbul ignore next */
    get _important() {
        warnOnce('Node#_important was deprecated. Use Node#raws.important');
        return this.raws.important;
    }

    /* istanbul ignore next */
    set _important(val) {
        warnOnce('Node#_important was deprecated. Use Node#raws.important');
        this.raws.important = val;
    }

}

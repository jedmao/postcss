/**
 * Contains helpers for working with vendor prefixes.
 */
module Vendor {
    /**
     * @returns The vendor prefix extracted from the input string.
     */
    export function prefix(prop: string) {
        if ( prop[0] === '-' ) {
            let sep = prop.indexOf('-', 1);
            return prop.substr(0, sep + 1);
        } else {
            return '';
        }
    }

    /**
     * @returns The input string stripped of its vendor prefix.
     */
    export function unprefixed(prop: string) {
        if ( prop[0] === '-' ) {
            let sep = prop.indexOf('-', 1);
            return prop.substr(sep + 1);
        } else {
            return prop;
        }
    }
}

export default Vendor;

/**
 * Contains helpers for working with vendor prefixes.
 */
var Vendor;
(function (Vendor) {
    /**
     * @returns The vendor prefix extracted from the input string.
     */
    function prefix(prop) {
        if (prop[0] === '-') {
            let sep = prop.indexOf('-', 1);
            return prop.substr(0, sep + 1);
        }
        else {
            return '';
        }
    }
    Vendor.prefix = prefix;
    /**
     * @returns The input string stripped of its vendor prefix.
     */
    function unprefixed(prop) {
        if (prop[0] === '-') {
            let sep = prop.indexOf('-', 1);
            return prop.substr(sep + 1);
        }
        else {
            return prop;
        }
    }
    Vendor.unprefixed = unprefixed;
})(Vendor || (Vendor = {}));
export default Vendor;

/**
 * Contains helpers for safely splitting lists of CSS values, preserving
 * parentheses and quotes.
 */
var List;
(function (List) {
    function split(str, separators, last) {
        let array = [];
        let current = '';
        let split = false;
        let func = 0;
        let quote = false;
        let escape = false;
        for (let i = 0; i < str.length; i++) {
            let letter = str[i];
            if (quote) {
                if (escape) {
                    escape = false;
                }
                else if (letter === '\\') {
                    escape = true;
                }
                else if (letter === quote) {
                    quote = false;
                }
            }
            else if (letter === '"' || letter === '\'') {
                quote = letter;
            }
            else if (letter === '(') {
                func += 1;
            }
            else if (letter === ')') {
                if (func > 0)
                    func -= 1;
            }
            else if (func === 0) {
                if (separators.indexOf(letter) !== -1)
                    split = true;
            }
            if (split) {
                if (current !== '')
                    array.push(current.trim());
                current = '';
                split = false;
            }
            else {
                current += letter;
            }
        }
        if (last || current !== '')
            array.push(current.trim());
        return array;
    }
    /**
     * Safely splits space-separated values (such as those for background,
     * border-radius and other shorthand properties).
     */
    function space(str) {
        let spaces = [' ', '\n', '\t'];
        return split(str, spaces);
    }
    List.space = space;
    /**
     * Safely splits comma-separated values (such as those for transition-* and
     * background  properties).
     */
    function comma(str) {
        let comma = ',';
        return split(str, [comma], true);
    }
    List.comma = comma;
})(List || (List = {}));
export default List;

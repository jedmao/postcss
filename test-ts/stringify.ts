///<reference path="../typings/tsd.d.ts" />
import stringify from '../lib-ts/stringify';
import parse     from '../lib-ts/parse';
import Root      from '../lib-ts/root';

import { expect } from 'chai';
const    cases  = require('postcss-parser-tests');

describe('stringify', () => {

    cases.each( (name, css) => {
        if ( name === 'bom.css' ) return;

        it('stringifies ' + name, () => {
            let root   = parse(css);
            let result = '';
            stringify((<Root>root), i => {
                result += i;
            });
            expect(result).to.eql(css);
        });
    });

});

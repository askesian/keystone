/*!
 * Module dependencies.
 */

var keystone = require('../../'),
    Field = keystone.Field;

module.exports = Field.extend({
    /**
     * Color FieldType Constructor
     * @extends Field
     * @api public
     */
    constructor: function(list, path, options) {
        this._nativeType = String;
        this._underscoreMethods = [];

        Field.apply(this, arguments);
    }
});

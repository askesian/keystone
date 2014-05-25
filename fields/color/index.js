/*!
 * Module dependencies.
 */

var keystone = require('../../'),
    Field = keystone.Field;

var Color = Field.extend({
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

exports = module.exports = Color;

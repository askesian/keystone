/*!
 * Module dependencies.
 */
'use strict';

var utils = require('keystone-utils'),
    keystone = require('../../'),
    Field = keystone.Field;

var Text = Field.extend({
    /**
     * Text FieldType Constructor
     * @extends Field
     * @api public
     */
    constructor: function(list, path, options) {
        this._nativeType = String;
        this._underscoreMethods = ['crop'];

        Field.apply(this, arguments);
    },

    /**
     * Crops the string to the specifed length.
     *
     * @api public
     */
    crop: function(item, length, append, preserveWords) {
        return utils.cropString(item.get(this.path), length, append, preserveWords);
    },

    getSearchFilters: function (filter, filters) {
        var cond;

        if (filter.exact) {
            if (filter.value) {
                cond = new RegExp('^' + utils.escapeRegExp(filter.value) + '$', 'i');
                filters[filter.field.path] = filter.inv ? { $not: cond } : cond;
            } else {
                if (filter.inv) {
                    filters[filter.field.path] = { $nin: ['', null] };
                } else {
                    filters[filter.field.path] = { $in: ['', null] };
                }
            }
        } else if (filter.value) {
            cond = new RegExp(utils.escapeRegExp(filter.value), 'i');
            filters[filter.field.path] = filter.inv ? { $not: cond } : cond;
        }
    }
});

exports = module.exports = Text;
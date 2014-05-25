/*!
 * Module dependencies.
 */

var _ = require('underscore'),
	bcrypt = require('bcrypt-nodejs'),
	utils = require('keystone-utils'),
	keystone = require('../../'),
	Field = keystone.Field;

var Password = Field.extend({
	/**
	 * password FieldType Constructor
	 * @extends Field
	 * @api public
	 */
	constructor: function(list, path, options) {
		this.workFactor = options.workFactor || 10;
		this._nativeType = String;
		options.nosort = true; // You can't sort on password fields
		// TODO: implement filtering, hard-coded as disabled for now
		options.nofilter = true;

		Field.apply(this, arguments);
	},

	/**
	 * Registers the field on the List's Mongoose Schema.
	 *
	 * Adds ...
	 *
	 * @api public
	 */
	addToSchema: function() {

		var field = this,
			schema = this.list.schema;

		this.paths = {
			confirm: this.options.confirmPath || this._path.append('_confirm')
		};

		schema.path(this.path, _.defaults({
			type: String
		}, this.options));

		schema.pre('save', function(next) {

			if (!this.isModified(field.path))
				return next();

			var item = this;

			bcrypt.genSalt(field.workFactor, function(err, salt) {
				if (err)
					return next(err);

				bcrypt.hash(item.get(field.path), salt, function() {}, function(err, hash) {
					if (err)
						return next(err);

					// override the cleartext password with the hashed one
					item.set(field.path, hash);
					next();
				});
			});

		});

		this.underscoreMethod('compare', function(candidate, callback) {
			bcrypt.compare(candidate, this.get(field.path), callback);
		});

		this.bindUnderscoreMethods();
	},

	/**
	 * If password fields are required, check that either a value has been
	 * provided or already exists in the field.
	 *
	 * Otherwise, input is always considered valid, as providing an empty
	 * value will not change the password.
	 *
	 * @api public
	 */
	validateInput: function(data, required, item) {

		if (!this.required) {
			return true;
		}

		if (item) {
			return (data[this.path] || item.get(this.path)) ? true : false;
		} else {
			return data[this.path] ? true : false;
		}
	},

	/**
	 * Processes a filter array into a filters object
	 *
	 * @param {Object} ops
	 * @param {Array} filter
	 * @api private
	 */

	processFilters: function (ops, filter) {
		// TODO
	},

	getSearchFilters: function (filter, filters) {
		// TODO
	}
});

exports = module.exports = Password;
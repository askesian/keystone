/*!
 * Module dependencies.
 */

var _ = require('underscore'),
	utils = require('keystone-utils'),
	marked = require('marked'),
	Path = require('./path'),
	fspath = require('path'),
	jade = require('jade'),
	fs = require('fs'),
	keystone = require('../'),
	compiledTemplates = {};


/**
 * Field Constructor
 * =================
 *
 * Extended by fieldType Classes, should not be used directly.
 *
 * @api public
 */

function Field(list, path, options) {
    var defaultTemplates,
        note;

	// Set field properties and options
	this.list = list;
	this._path = new Path(path);
	this.path = path;

	this.type = options.type.typeName;
	this.options = utils.options(this.defaults, options);
	this.label = options.label || utils.keyToLabel(this.path);
	this.typeDescription = options.typeDescription || this.typeDescription || this.type;

    // template directory base path via options
    this.templateDir = fspath.normalize(options.type.templatePath);

    defaultTemplates = {
        'form': this.templateDir + '/' + 'form.jade',
        'initial': this.templateDir + '/' + 'initial.jade',
        'filter': this.templateDir + '/' + 'filter.jade'
    };

    this.templates = utils.options(defaultTemplates, this.options.templates);
	// Add the field to the schema
	this.list.automap(this);
	this.addToSchema();

	// Add pre-save handler to the list if this field watches others
	if (this.options.watch) {
		this.list.schema.pre('save', this.getPreSaveWatcher());
	}

	// Convert notes from markdown to html
	note = null;
	Object.defineProperty(this, 'note', { get: function() {
		return (note === null) ? (note = (this.options.note) ? marked(this.options.note) : '') : note;
	} });

}

/**
 * Expose the keystone-utils extend method as a property on the Field object
 */

Field.extend = utils.extend;

exports = module.exports = Field;

/** Getter properties for the Field prototype */

Object.defineProperty(Field.prototype, 'width', { get: function() { return this.options.width || 'full'; } }); // !! field width is, for certain types, overridden by css
Object.defineProperty(Field.prototype, 'initial', { get: function() { return this.options.initial || false; } });
Object.defineProperty(Field.prototype, 'required', { get: function() { return this.options.required || false; } });
Object.defineProperty(Field.prototype, 'col', { get: function() { return this.options.col || false; } });
Object.defineProperty(Field.prototype, 'noedit', { get: function() { return this.options.noedit || false; } });
Object.defineProperty(Field.prototype, 'nocol', { get: function() { return this.options.nocol || false; } });
Object.defineProperty(Field.prototype, 'nosort', { get: function() { return this.options.nosort || false; } });
Object.defineProperty(Field.prototype, 'nofilter', { get: function() { return this.options.nofilter || false; } });
Object.defineProperty(Field.prototype, 'collapse', { get: function() { return this.options.collapse || false; } });
Object.defineProperty(Field.prototype, 'hidden', { get: function() { return this.options.hidden || false; } });
Object.defineProperty(Field.prototype, 'dependsOn', { get: function() { return this.options.dependsOn || false; } });


/**
 * Gets the pre-save watcher on the Field object
 * @api private
 */

Field.prototype.getPreSaveWatcher = function(next) {

	var field = this,
		applyValue;

	if (this.options.watch === true) {
		// watch == true means always apply the value method
		applyValue = function() { return true; };
	} else {
		// if watch is a string, convert it to a list of paths to watch
		if (_.isString(this.options.watch)) {
			this.options.watch = this.options.watch.split(' ');
		}
		if (_.isFunction(this.options.watch)) {
			applyValue = this.options.watch;
		} else if (_.isArray(this.options.watch)) {
			applyValue = function(item) {
				var pass = false;
				field.options.watch.forEach(function(path) {
					if (!item.isModified(path)) pass = true;
				});
				return pass;
			};
		} else if (_.isObject(this.options.watch)) {
			applyValue = function(item) {
				var pass = false;
				_.each(field.options.watch, function(value, path) {
					if (item.isModified(path) && item.get('path') == value) pass = true;
				});
				return pass;
			};
		}
	}

	if (!applyValue) {
		throw new Error('Invalid watch value (' + this.options.watch + ') provided for ' + list.key + '.' + this.path + ' (' + this.type + ')');
	}

	if (!_.isFunction(this.options.value)) {
		throw new Error('Watch set with no value method provided for ' + list.key + '.' + this.path + ' (' + this.type + ')');
	}

	return function(next) {
		if (!applyValue(this)) {
			return next();
		}
		this.set(field.path, field.options.value.call(this));
		next();
	};

};

/**
 * Default method to register the field on the List's Mongoose Schema.
 * Overridden by some fieldType Classes
 *
 * @api public
 */

Field.prototype.addToSchema = function() {

	var ops = (this._nativeType) ? _.defaults({ type: this._nativeType }, this.options) : this.options;

	this.list.schema.path(this.path, ops);

	this.bindUnderscoreMethods();

};

Field.prototype.bindUnderscoreMethods = function(methods) {

	var field = this;

	// automatically bind underscore methods specified by the _underscoreMethods property
	// always include the 'update' method

	(this._underscoreMethods || []).concat({ fn: 'updateItem', as: 'update' }, (methods || [])).forEach(function(method) {
		if ('string' == typeof method) {
			method = { fn: method, as: method };
		}
		if ('function' != typeof field[method.fn]) {
			throw new Error('Invalid underscore method (' + method.fn + ') applied to ' + field.list.key + '.' + field.path + ' (' + field.type + ')');
		}
		field.underscoreMethod(method.as, function() {
			var args = [this].concat(Array.prototype.slice.call(arguments));
			return field[method.fn].apply(field, args);
		});
	});

};


/**
 * Adds a method to the underscoreMethods collection on the field's list,
 * with a path prefix to match this field's path and bound to the document
 *
 * @api public
 */

Field.prototype.underscoreMethod = function(path, fn) {
	this.list.underscoreMethod(this.path + '.' + path, function() {
		return fn.apply(this, arguments);
	});
};


/**
 * Default method to format the field value for display
 * Overridden by some fieldType Classes
 *
 * @api public
 */

Field.prototype.format = function(item) {
	return item.get(this.path);
};


/**
 * Default method to detect whether the field has been modified in an item
 * Overridden by some fieldType Classes
 *
 * @api public
 */

Field.prototype.isModified = function(item) {
	return item.isModified(this.path);
};


/**
 * Validates that a value for this field has been provided in a data object
 * Overridden by some fieldType Classes
 *
 * @api public
 */

Field.prototype.validateInput = function(data, required, item) {
	if (!required) return true;
	if (!(this.path in data) && item && item.get(this.path)) return true;
	if ('string' == typeof data[this.path]) {
		return (data[this.path].trim()) ? true : false;
	} else {
		return (data[this.path]) ? true : false;
	}
};


/**
 * Updates the value for this field in the item from a data object
 * Overridden by some fieldType Classes
 *
 * @api public
 */

Field.prototype.updateItem = function(item, data) {
	if (this.path in data && data[this.path] != item.get(this.path)) {
		item.set(this.path, data[this.path]);
	}
};

/**
 * Compiles a field template and caches it
 *
 * @api public
 */

Field.prototype.compile = function(type, callback) {

	var templatePath = this.templates[type];

    if( !fs.existsSync(templatePath) ) {
        if ( callback ) {
            return callback();
        } else {
            return;
        }
    }

	if (!compiledTemplates[templatePath]) {
		fs.readFile(templatePath, 'utf8', function(err, file) {
			if (!err){
				compiledTemplates[templatePath] = jade.compile(file, {
					filename: templatePath,
					pretty: keystone.get('env') != "production"
				});
			}
			if (callback) return callback();
		});
	} else if (callback) {
		return callback();
	}

};

/**
 * Compiles a field template and caches it
 *
 * @api public
 */

Field.prototype.render = function(type, item, locals) {

	var templatePath = this.templates[type];

    if( !fs.existsSync(templatePath) ) {
        return '';
    }

	// Compile the template synchronously if it hasn't already been compiled
	if (!compiledTemplates[templatePath]) {

		var file = fs.readFileSync(templatePath, 'utf8');

		compiledTemplates[templatePath] = jade.compile(file, {
			filename: templatePath,
			pretty: (keystone.get('env') != "production")
		});

	}

	return compiledTemplates[templatePath](_.extend(locals || {}, {
		field: this,
		item: item
	}));

};

/**
 * Process a filter array into a filters object
 *
 * @param {Object} ops
 * @param {Array} filter
 * @api private
 */
Field.prototype.processFilters = function(ops, filter) {
    ops.value = filter[0];
}

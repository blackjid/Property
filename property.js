/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

Subscription = function(target, eventType, listener, context) {
    this._target    = target;
    this._eventType = eventType;
    this._listener  = listener;
    this._context   = context;
    this._active    = true;
};

Subscription.prototype.cancel = function() {
    if (!this._active) return;
    this._target.unbind(this._eventType, this._listener, this._context);
    this._active = false;
};

Observable = {
    bind: function(eventType, listener, context) {
        this._listeners = this._listeners || {};
        var list = this._listeners[eventType] = this._listeners[eventType] || [];
        list.push([listener, context]);

        return new Subscription(this, eventType, listener, context);
    },

    trigger: function(eventType) {
        if (!this._listeners) return;
        var list = this._listeners[eventType];
        if (!list) return;

        var args = arguments;
        _.each(list,function(listener) {
            listener[0].apply(listener[1], _.rest(args));
        });
    },

    unbind: function(eventType, listener, context) {
        if (!this._listeners) return;
        var list = this._listeners[eventType];
        if (!list) return;

        var i = list.length;
        while (i--) {
            if (list[i][0] === listener && list[i][1] === context)
                list.splice(i, 1);
        }
    }
};


/**
 * Events:
 *  change: (newValue, oldValue)
 */
function property(value) {
    /**
     * The value of the property
     */
    this.value = value;

    // Extend the property with the event manager
    $.extend(this, Observable);
}

property.prototype.__onChange__ = function(fun, context) {
    // Bind
    this.bind("change", fun, context);

    // Execute for the first time
    fun.call(context, this.value);

    // remain chain
    return this;
}

/**
 * Set the value of the property
 */
property.prototype.set = function(value) {
    var oldValue = this.value;

    if(this.value != value) {
        this.value = value;
        this.trigger("change", value, oldValue);
    }
}

/**
 * Compare the actual value of the property
 */
property.prototype.is = function(value) {
    return (this.value == value);
}

/**
 * @param selector  The selector (string) of the dom object
 * @param propValue The value of the property / comparer (function)
 * @param className The name of the class
 */
property.prototype.bindClass = function(selector, propValue, className) {
    return this.__onChange__(function(value) {
        var comparer = (_.isFunction(propValue)) ? propValue : function(value) {return propValue == value;};

        $(selector).toggleClass(className, comparer(value));
    });
}

/**
* If the value is boolean, it will toggle an attribute to the dom
*/
property.prototype.toggleAttr = function(selector, attr) {
    var self = this;

    $(selector).change(function() {
        self.set($(this).attr(attr));
    });

    return this.__onChange__(function(value) {
        if(value)
            $(selector).attr(attr, true);
        else
            $(selector).removeAttr(attr);
    });
};

/**
 * If the value is boolean, it will bind a class to a dom object with on-off state
 */
property.prototype.toggleClass = function(selector, prefix) {
    return this.__onChange__(function(value) {
        $(selector).toggleClass(prefix + "-on", value);
        $(selector).toggleClass(prefix + "-off", !value);
    });
}

/**
 * Attach the value of the property to a class "prefix"+ "-" + value
 */
property.prototype.prefixClass = function(selector, prefix) {
    return this.__onChange__(function(newValue, oldValue) {
        $(selector).toggleClass(prefix + "-" + oldValue, false);
        $(selector).toggleClass(prefix + "-" + newValue, true);
    });
}

property.prototype.change = function(callback, context) {
    this.bind("change", callback, context);
    return this;
}

/**
 * When the property changes to a certain value, the callback is executed
 */
property.prototype.when = function(value, callback, context) {
    this.bind("change", function(_value) {
        if(_.isFunction(value)) {
            if(value(_value))
                callback.call(context);
        }
        else {
            if(value === _value)
                callback.call(context);
        }
    }, context);

    return this;
}

/**
 * Toggle the value of the property (only valid for boolean)
 */
property.prototype.toggle = function() {
    this.set(!this.value);
}

/**
 * Toogle the visibility of an element
 * @param selector  The selector (string) of the dom object
 * @param propValue The value of the property / comparer (function)
 */
property.prototype.toggleVisibility = function(selector, propValue) {
    return this.__onChange__(function(newValue, oldValue) {
        var comparer = (_.isFunction(propValue)) ? propValue : function(value) {return propValue == value;};
        
        if(comparer(oldValue))
            $(selector).hide();
        if(comparer(newValue))
            $(selector).show();
    });
}

property.prototype.destruct = function() {

};

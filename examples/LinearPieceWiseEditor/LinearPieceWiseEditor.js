/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {module.exports = global["LinearPieceWiseEditor"] = __webpack_require__(1);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _ = __webpack_require__(2);

	var _2 = _interopRequireDefault(_);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var container = document.createElement('canvas');
	container.setAttribute('width', 400);
	container.setAttribute('height', 300);

	document.body.appendChild(container);

	var editor = new _2.default(container);

	editor.onChange(function (controlPoints, envelope) {
	  console.log(controlPoints);
	});

	editor.setControlPoints([{ x: 0.0, y: 0.0 }, { x: 0.25, y: 0.75 }, { x: 0.5, y: 0.25 }, { x: 0.75, y: 0.5 }, { x: 1, y: 1 }]);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	exports.getCanvasSize = getCanvasSize;

	var _monologue = __webpack_require__(3);

	var _monologue2 = _interopRequireDefault(_monologue);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	// ----------------------------------------------------------------------------
	// Helper / Private functions
	// ----------------------------------------------------------------------------

	function pointBuilder(x, y) {
	  return { x: x, y: y };
	}

	function clamp(value) {
	  var min = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	  var max = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

	  return value < min ? min : value > max ? max : value;
	}

	function sortPoints(pointsArray) {
	  pointsArray.sort(function (a, b) {
	    return a.x - b.x;
	  });
	  pointsArray.forEach(function (point, index) {
	    point.index = index;
	    point.fixedX = index === 0 || index + 1 === pointsArray.length;
	  });
	  return pointsArray;
	}

	function getCanvasSize(ctx) {
	  var margin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	  var _ctx$canvas = ctx.canvas,
	      width = _ctx$canvas.width,
	      height = _ctx$canvas.height;

	  width -= 2 * margin;
	  height -= 2 * margin;

	  return { width: width, height: height, margin: margin };
	}

	function getCanvasCoordinates(ctx, point, margin) {
	  var _getCanvasSize = getCanvasSize(ctx, margin),
	      width = _getCanvasSize.width,
	      height = _getCanvasSize.height;

	  var x = point.x,
	      y = point.y;

	  x = Math.floor(x * width + margin + 0.5);
	  y = Math.floor((1 - y) * height + margin + 0.5);
	  return { x: x, y: y };
	}

	function drawControlPoint(ctx, point, radius, color) {
	  var x = point.x,
	      y = point.y;

	  ctx.beginPath();
	  ctx.fillStyle = color;
	  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
	  ctx.fill();
	}

	function getNormalizePosition(event, ctx, margin) {
	  var _getCanvasSize2 = getCanvasSize(ctx, margin),
	      width = _getCanvasSize2.width,
	      height = _getCanvasSize2.height;

	  var rect = event.target.getBoundingClientRect();

	  return {
	    x: (event.clientX - rect.left - margin) / width,
	    y: 1 - (event.clientY - rect.top - margin) / height,
	    epsilon: {
	      x: 2 * margin / width,
	      y: 2 * margin / height
	    }
	  };
	}

	function findPoint(position, pointList) {
	  var pointsFound = pointList.filter(function (point) {
	    return point.x + position.epsilon.x > position.x && point.x - position.epsilon.x < position.x && point.y + position.epsilon.y > position.y && point.y - position.epsilon.y < position.y;
	  });
	  return pointsFound[0];
	}

	// ----------------------------------------------------------------------------
	// LinearPieceWiseEditor
	// ----------------------------------------------------------------------------

	var CHANGE_TOPIC = 'LinearPieceWiseEditor.change';
	var EDIT_MODE_TOPIC = 'LinearPieceWiseEditor.edit.mode';

	var LinearPieceWiseEditor = function () {
	  function LinearPieceWiseEditor(canvas, style) {
	    var _this = this;

	    _classCallCheck(this, LinearPieceWiseEditor);

	    this.onMouseDown = function (event) {
	      var click = getNormalizePosition(event, _this.ctx, _this.radius);
	      var controlPoint = findPoint(click, _this.controlPoints);
	      _this.activeControlPoint = controlPoint;
	      if (_this.activeControlPoint) {
	        _this.activeIndex = controlPoint.index;
	        _this.render();
	      } else {
	        _this.activeIndex = -1;
	        _this.render();
	      }
	      _this.canvas.addEventListener('mousemove', _this.onMouseMove);
	      _this.emit(EDIT_MODE_TOPIC, true);
	    };

	    this.onMouseMove = function (event) {
	      if (_this.activeControlPoint) {
	        var newPosition = getNormalizePosition(event, _this.ctx, _this.radius);
	        if (!_this.activeControlPoint.fixedX) {
	          _this.activeControlPoint.x = clamp(newPosition.x);
	        }
	        _this.activeControlPoint.y = clamp(newPosition.y);
	        sortPoints(_this.controlPoints);
	        _this.activeIndex = _this.activeControlPoint.index;
	        _this.render();
	      }
	    };

	    this.onMouseUp = function (event) {
	      _this.activeControlPoint = null;
	      if (_this.canvas) {
	        _this.canvas.removeEventListener('mousemove', _this.onMouseMove);
	      }
	      _this.emit(EDIT_MODE_TOPIC, false);
	    };

	    this.onMouseLeave = this.onMouseUp;

	    this.onClick = function (event) {
	      // Remove point
	      if (event.metaKey || event.ctrlKey) {
	        var click = getNormalizePosition(event, _this.ctx, _this.radius);
	        var controlPoint = findPoint(click, _this.controlPoints);
	        if (controlPoint && !controlPoint.fixedX) {
	          _this.controlPoints.splice(controlPoint.index, 1);
	          // fix indexes after deletion
	          for (var i = 0; i < _this.controlPoints.length; ++i) {
	            _this.controlPoints[i].index = i;
	          }
	          _this.activeIndex = -1;
	        }
	        _this.render();
	      }
	    };

	    this.onDblClick = function (event) {
	      var point = getNormalizePosition(event, _this.ctx, _this.radius);
	      var sanitizedPoint = { x: clamp(point.x), y: clamp(point.y) };
	      _this.controlPoints.push(sanitizedPoint);
	      sortPoints(_this.controlPoints);
	      _this.activeIndex = sanitizedPoint.index;
	      _this.render();
	    };

	    this.resetControlPoints();
	    this.setStyle(style);
	    this.setContainer(canvas);
	    this.activeIndex = -1;
	  }

	  _createClass(LinearPieceWiseEditor, [{
	    key: 'resetControlPoints',
	    value: function resetControlPoints() {
	      this.controlPoints = [pointBuilder(0, 0), pointBuilder(1, 1)];
	      sortPoints(this.controlPoints);
	    }

	    // Sets the control points to the new list of points.  The input should be a list
	    // of objects with members x and y (i.e. { x: 0.0, y: 1.0 }).  The valid range for
	    // x and y is [0,1] with 0 being the left/bottom edge of the canvas and 1 being
	    // the top/right edge.
	    // The second parameter specifies (in the list passed in) which point should be
	    // active after setting the control points.  Pass -1 for no point should be active

	  }, {
	    key: 'setControlPoints',
	    value: function setControlPoints(points) {
	      var _this2 = this;

	      var activeIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

	      this.controlPoints = points.map(function (pt) {
	        return pointBuilder(pt.x, pt.y);
	      });
	      var activePoint = null;
	      if (activeIndex !== -1) {
	        activePoint = this.controlPoints[activeIndex];
	      }
	      sortPoints(this.controlPoints);
	      if (activeIndex !== -1) {
	        for (var i = 0; i < this.controlPoints.length; ++i) {
	          if (activePoint === this.controlPoints[i]) {
	            this.activeIndex = i;
	          }
	        }
	      } else {
	        this.activeIndex = -1;
	      }
	      if (this.activeControlPoint) {
	        this.controlPoints.forEach(function (pt, index) {
	          if (pt.x === _this2.activeControlPoint.x && pt.y === _this2.activeControlPoint.y && index === _this2.activeIndex) {
	            _this2.activeControlPoint = pt;
	          }
	        });
	      }
	      this.render();
	    }
	  }, {
	    key: 'setStyle',
	    value: function setStyle() {
	      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	          _ref$radius = _ref.radius,
	          radius = _ref$radius === undefined ? 6 : _ref$radius,
	          _ref$stroke = _ref.stroke,
	          stroke = _ref$stroke === undefined ? 2 : _ref$stroke,
	          _ref$color = _ref.color,
	          color = _ref$color === undefined ? '#000000' : _ref$color,
	          _ref$activePointColor = _ref.activePointColor,
	          activePointColor = _ref$activePointColor === undefined ? '#EE3333' : _ref$activePointColor,
	          _ref$fillColor = _ref.fillColor,
	          fillColor = _ref$fillColor === undefined ? '#ccc' : _ref$fillColor;

	      this.radius = radius;
	      this.stroke = stroke;
	      this.color = color;
	      this.activePointColor = activePointColor;
	      this.fillColor = fillColor;
	    }
	  }, {
	    key: 'setContainer',
	    value: function setContainer(canvas) {
	      if (this.canvas) {
	        this.canvas.removeEventListener('click', this.onClick);
	        this.canvas.removeEventListener('dblclick', this.onDblClick);
	        this.canvas.removeEventListener('mousedown', this.onMouseDown);
	        this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
	        this.canvas.removeEventListener('mousemove', this.onMouseMove);
	        this.canvas.removeEventListener('mouseup', this.onMouseMove);
	      }

	      this.canvas = null;
	      this.ctx = null;
	      if (canvas) {
	        this.canvas = canvas;
	        this.ctx = canvas.getContext('2d');

	        this.canvas.addEventListener('click', this.onClick);
	        this.canvas.addEventListener('dblclick', this.onDblClick);
	        this.canvas.addEventListener('mousedown', this.onMouseDown);
	        this.canvas.addEventListener('mouseleave', this.onMouseLeave);
	        this.canvas.addEventListener('mouseup', this.onMouseUp);
	      }
	    }
	  }, {
	    key: 'setActivePoint',
	    value: function setActivePoint(index) {
	      this.activeIndex = index;
	      this.render();
	    }
	  }, {
	    key: 'clearActivePoint',
	    value: function clearActivePoint() {
	      this.setActivePoint(-1);
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this3 = this;

	      var _getCanvasSize3 = getCanvasSize(this.ctx, this.radius),
	          width = _getCanvasSize3.width,
	          height = _getCanvasSize3.height,
	          margin = _getCanvasSize3.margin;

	      this.ctx.fillStyle = this.fillColor;
	      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	      this.ctx.fillRect(margin, margin, width, height);

	      var linearPath = [];
	      this.controlPoints.forEach(function (point) {
	        linearPath.push(getCanvasCoordinates(_this3.ctx, point, _this3.radius));
	      });

	      // Draw path
	      this.ctx.beginPath();
	      this.ctx.lineWidth = this.stroke;
	      linearPath.forEach(function (point, idx) {
	        if (idx === 0) {
	          _this3.ctx.moveTo(point.x, point.y);
	        } else {
	          _this3.ctx.lineTo(point.x, point.y);
	        }
	      });
	      this.ctx.stroke();

	      // Draw control points
	      linearPath.forEach(function (point, index) {
	        drawControlPoint(_this3.ctx, point, _this3.radius, _this3.activeIndex === index ? _this3.activePointColor : _this3.color);
	      });

	      // Notify control points
	      this.emit(CHANGE_TOPIC, this.controlPoints);
	    }
	  }, {
	    key: 'onChange',
	    value: function onChange(callback) {
	      return callback ? this.on(CHANGE_TOPIC, callback) : null;
	    }
	  }, {
	    key: 'onEditModeChange',
	    value: function onEditModeChange(callback) {
	      return callback ? this.on(EDIT_MODE_TOPIC, callback) : null;
	    }
	  }, {
	    key: 'destroy',
	    value: function destroy() {
	      this.off();
	      this.setContainer(null);
	    }
	  }]);

	  return LinearPieceWiseEditor;
	}();

	// Add Observer pattern using Monologue.js


	exports.default = LinearPieceWiseEditor;
	_monologue2.default.mixInto(LinearPieceWiseEditor);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * monologue.js - EventEmitter replacement with AMQP-style bindings and other advanced features. Compatible with postal.js's API.
	 * Author: Jim Cowart (http://ifandelse.com)
	 * Version: v0.3.5
	 * Url: https://github.com/postaljs/monologue.js
	 * License(s): MIT, GPL
	 */

	( function( root, factory ) {
		/* istanbul ignore if  */
		if ( true ) {
			// AMD. Register as an anonymous module.
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [ __webpack_require__(4), __webpack_require__(6) ], __WEBPACK_AMD_DEFINE_RESULT__ = function( _, riveter ) {
				return factory( _, riveter, root );
			}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		/* istanbul ignore else  */
		} else if ( typeof module === "object" && module.exports ) {
			// Node, or CommonJS-Like environments
			module.exports = factory( require( "lodash" ), require( "riveter" ) );
		} else {
			// Browser globals
			root.Monologue = factory( root._, root.riveter, root );
		}
	}( this, function( _, riveter, global, undefined ) {
		
	var keyDelimiter = "|";
	var bindingsResolver = {
		cache: {},
		regex: {},

		compare: function compare( binding, topic ) {
			var pattern;
			var rgx;
			var prevSegment;
			var result = ( this.cache[ topic + keyDelimiter + binding ] );
			// result is cached?
			if ( result === true ) {
				return result;
			}
			// plain string matching?
			if ( binding.indexOf( "#" ) === -1 && binding.indexOf( "*" ) === -1 ) {
				result = this.cache[ topic + keyDelimiter + binding ] = ( topic === binding );
				return result;
			}
			// ah, regex matching, then
			if ( !( rgx = this.regex[ binding ] ) ) {
				pattern = "^" + _.map( binding.split( "." ), function mapTopicBinding( segment ) {
						var res = "";
						if ( !!prevSegment ) {
							res = prevSegment !== "#" ? "\\.\\b" : "\\b";
						}
						if ( segment === "#" ) {
							res += "[\\s\\S]*";
						} else if ( segment === "*" ) {
							res += "[^.]+";
						} else {
							res += segment;
						}
						prevSegment = segment;
						return res;
					} ).join( "" ) + "$";
				rgx = this.regex[ binding ] = new RegExp( pattern );
			}
			result = this.cache[ topic + keyDelimiter + binding ] = rgx.test( topic );
			return result;
		},

		reset: function reset() {
			this.cache = {};
			this.regex = {};
		},

		purge: function( options ) {
			var self = this;
			var matchPredicate = function( val, key ) {
				var split = key.split( keyDelimiter );
				var topic = split[ 0 ];
				var binding = split[ 1 ];
				if ( ( typeof options.topic === "undefined" || options.topic === topic ) &&
						( typeof options.binding === "undefined" || options.binding === binding ) ) {
					delete self.cache[ key ];
				}
			};

			if ( typeof options === "undefined" ) {
				this.reset();
			} else {
				_.each( this.cache, matchPredicate );
			}
		}
	};

		var SubscriptionDefinition = function( topic, callback, emitter ) {
		this.topic = topic;
		this.callback = callback;
		this.pipeline = [];
		this.cacheKeys = [];
		this._context = undefined;
		this.emitter = emitter;
	};

	var ConsecutiveDistinctPredicate = function() {
		var previous;
		return function( data ) {
			var eq = false;
			if ( _.isString( data ) ) {
				eq = data === previous;
				previous = data;
			} else {
				eq = _.isEqual( data, previous );
				previous = _.clone( data );
			}
			return !eq;
		};
	};

	var DistinctPredicate = function DistinctPredicateFactory() {
		var previous = [];
		return function DistinctPredicate( data ) {
			var isDistinct = !_.any( previous, function( p ) {
				if ( _.isObject( data ) || _.isArray( data ) ) {
					return _.isEqual( data, p );
				}
				return data === p;
			} );
			if ( isDistinct ) {
				previous.push( data );
			}
			return isDistinct;
		};
	};

	SubscriptionDefinition.prototype = {

		"catch": function( errorHandler ) {
			var original = this.callback;
			var safeCallback = function() {
				try {
					original.apply( this, arguments );
				} catch ( err ) {
					errorHandler( err, arguments[ 0 ] );
				}
			};
			this.callback = safeCallback;
			return this;
		},

		defer: function defer() {
			return this.delay( 0 );
		},

		disposeAfter: function disposeAfter( maxCalls ) {
			if ( !_.isNumber( maxCalls ) || maxCalls <= 0 ) {
				throw new Error( "The value provided to disposeAfter (maxCalls) must be a number greater than zero." );
			}

			var dispose = _.after( maxCalls, this.unsubscribe.bind( this ) );
			this.pipeline.push( function( data, env, next ) {
				next( data, env );
				dispose();
			} );
			return this;
		},

		distinct: function distinct() {
			return this.constraint( new DistinctPredicate() );
		},

		distinctUntilChanged: function distinctUntilChanged() {
			return this.constraint( new ConsecutiveDistinctPredicate() );
		},

		invokeSubscriber: function invokeSubscriber( data, env ) {
			if ( !this.inactive ) {
				var self = this;
				var pipeline = self.pipeline;
				var len = pipeline.length;
				var context = self._context;
				var idx = -1;
				if ( !len ) {
					self.callback.call( context, data, env );
				} else {
					pipeline = pipeline.concat( [ self.callback ] );
					var step = function step( d, e ) {
						idx += 1;
						if ( idx < len ) {
							pipeline[ idx ].call( context, d, e, step );
						} else {
							self.callback.call( context, d, e );
						}
					};
					step( data, env, 0 );
				}
			}
		},

		logError: function logError() {
			/* istanbul ignore else */
			if ( console ) {
				var report;
				if ( console.warn ) {
					report = console.warn;
				} else {
					report = console.log;
				}
				this.catch( report );
			}
			return this;
		},

		once: function once() {
			return this.disposeAfter( 1 );
		},

		unsubscribe: function() {
			/* istanbul ignore else */
			if ( !this.inactive ) {
				this.emitter.off( this );
			}
		},

		constraint: function constraint( predicate ) {
			if ( !_.isFunction( predicate ) ) {
				throw new Error( "Predicate constraint must be a function" );
			}
			this.pipeline.push( function( data, env, next ) {
				if ( predicate.call( this, data, env ) ) {
					next( data, env );
				}
			} );
			return this;
		},

		constraints: function constraints( predicates ) {
			var self = this;
			/* istanbul ignore else */
			if ( _.isArray( predicates ) ) {
				_.each( predicates, function( predicate ) {
					self.constraint( predicate );
				} );
			}
			return self;
		},

		context: function contextSetter( context ) {
			this._context = context;
			return this;
		},

		debounce: function debounce( milliseconds, immediate ) {
			if ( !_.isNumber( milliseconds ) ) {
				throw new Error( "Milliseconds must be a number" );
			}
			this.pipeline.push(
				_.debounce( function( data, env, next ) {
					next( data, env );
				},
					milliseconds,
					!!immediate
				)
			);
			return this;
		},

		delay: function delay( milliseconds ) {
			if ( !_.isNumber( milliseconds ) ) {
				throw new Error( "Milliseconds must be a number" );
			}
			var self = this;
			self.pipeline.push( function( data, env, next ) {
				setTimeout( function() {
					next( data, env );
				}, milliseconds );
			} );
			return this;
		},

		throttle: function throttle( milliseconds ) {
			if ( !_.isNumber( milliseconds ) ) {
				throw new Error( "Milliseconds must be a number" );
			}
			var fn = function( data, env, next ) {
				next( data, env );
			};
			this.pipeline.push( _.throttle( fn, milliseconds ) );
			return this;
		}
	};

	SubscriptionDefinition.prototype.off = SubscriptionDefinition.prototype.unsubscribe;
	// Backwards Compatibility
	// WARNING: these will be removed after the next version
	/* istanbul ignore next */
	function warnOnDeprecation( oldMethod, newMethod ) {
		return function() {
			if ( console.warn || console.log ) {
				var msg = "Warning, the " + oldMethod + " method has been deprecated. Please use " + newMethod + " instead.";
				if ( console.warn ) {
					console.warn( msg );
				} else {
					console.log( msg );
				}
			}
			return SubscriptionDefinition.prototype[ newMethod ].apply( this, arguments );
		};
	}
	var oldMethods = [ "withConstraint", "withConstraints", "withContext", "withDebounce", "withDelay", "withThrottle" ];
	var newMethods = [ "constraint", "constraints", "context", "debounce", "delay", "throttle" ];
	for ( var i = 0; i < 6; i++ ) {
		var oldMethod = oldMethods[ i ];
		SubscriptionDefinition.prototype[ oldMethod ] = warnOnDeprecation( oldMethod, newMethods[ i ] );
	}

		
	var slice = Array.prototype.slice;
	var Monologue = function() {};

	function getCacher( topic, cache, done ) {
		return function( subDef ) {
			if ( Monologue.resolver.compare( subDef.topic, topic ) ) {
				cache.push( subDef );
				subDef.cacheKeys.push( topic );
				if ( done ) {
					done( subDef );
				}
			}
		};
	}

	function getCachePurger( subDef, topic, cache ) {
		return function( sub, i, list ) {
			if ( sub === subDef ) {
				list.splice( i, 1 );
			}
			if ( list.length === 0 ) {
				delete cache[ topic ];
			}
		};
	}

	function removeSubscriber( subDef, emitter, idx, list ) {
		subDef.inactive = true;
		list.splice( idx, 1 );
		// remove SubscriptionDefinition from cache
		if ( subDef.cacheKeys && subDef.cacheKeys.length ) {
			var key;
			while ( key = subDef.cacheKeys.pop() ) {
				_.each( emitter._cache[ key ], getCachePurger( subDef, key, emitter._cache ) );
			}
		}
	}

	Monologue.prototype = {
		on: function( topic, callback ) {
			var self = this;
			self._subscriptions = self._subscriptions || {};
			self._subscriptions[ topic ] = self._subscriptions[ topic ] || [];
			var subDef = new SubscriptionDefinition( topic, callback, self );
			self._subscriptions[ topic ].push( subDef );

			// Next, add the SubscriptionDefinition to any relevant existing cache(s)
			_.each( self._cache, function( list, key ) {
				getCacher( key, list )( subDef );
			} );

			return self._subscriptions[ topic ][ self._subscriptions[ topic ].length - 1 ];
		},

		once: function( topic, callback ) {
			return this.on( topic, callback ).once();
		},

		off: function( topic, context ) {
			var self = this;
			self._subscriptions = self._subscriptions || {};
			self._cache = self._cache || {};
			switch ( arguments.length ) {
				case 0:
					_.each( self._subscriptions, function( tpc ) {
						_.each( tpc, function( subDef, idx ) {
							removeSubscriber( subDef, self, idx, tpc );
						} );
					} );
					self._subscriptions = {};
					break;
				case 1:
					var type = Object.prototype.toString.call( topic ) === "[object String]" ? "topic" : topic instanceof SubscriptionDefinition ? "def" : "context";
					switch ( type ) {
						case "topic":
							if ( self._subscriptions[ topic ] ) {
								_.each( self._subscriptions[ topic ], function( subDef, idx ) {
									removeSubscriber( subDef, self, idx, self._subscriptions[ topic ] );
								} );
							}
							break;
						case "context":
							_.each( self._subscriptions, function( subs ) {
								_.each( _.clone( subs ), function( subDef, idx ) {
									if ( subDef._context === topic ) {
										removeSubscriber( subDef, self, idx, subs );
									}
								} );
							} );
							break;
						default:
							// topic arg is the subDef in this case....
							_.each( self._subscriptions[ topic.topic ], function( subDef, idx ) {
								if ( subDef === topic ) {
									removeSubscriber( subDef, self, idx, self._subscriptions[ topic.topic ] );
								}
							} );
							break;
					}
					break;
				default:
					_.each( _.clone( self._subscriptions[ topic ] ), function( subDef, idx ) {
						if ( subDef._context === context ) {
							removeSubscriber( subDef, self, idx, self._subscriptions[ topic ] );
						}
					} );
					break;
			}
		},

		emit: function( topic, data ) {
			var envelope = this.getEnvelope( topic, data );
			this._cache = this._cache || {};
			var cache = this._cache[ topic ];
			var invoker = function( subDef ) {
				subDef.invokeSubscriber( envelope.data, envelope );
			};
			if ( !cache ) {
				cache = this._cache[ topic ] = [];
				var cacherFn = getCacher( topic, cache, invoker );
				_.each( this._subscriptions, function( candidates ) {
					_.each( slice.call( candidates, 0 ), cacherFn );
				} );
			} else {
				_.each( slice.call( cache, 0 ), invoker );
			}
		},

		getEnvelope: function( topic, data ) {
			return {
				topic: topic,
				timeStamp: new Date(),
				data: data
			};
		}
	};

	Monologue.resolver = bindingsResolver;
	Monologue.debug = false;
	Monologue.SubscriptionDefinition = SubscriptionDefinition;
	riveter( Monologue );
	Monologue.mixInto = function( target ) {
		riveter.punch( target, Monologue.prototype );
	};

		return Monologue;
	} ) );


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/**
	 * @license
	 * lodash 3.10.1 (Custom Build) <https://lodash.com/>
	 * Build: `lodash modern -d -o ./index.js`
	 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	;(function() {

	  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
	  var undefined;

	  /** Used as the semantic version number. */
	  var VERSION = '3.10.1';

	  /** Used to compose bitmasks for wrapper metadata. */
	  var BIND_FLAG = 1,
	      BIND_KEY_FLAG = 2,
	      CURRY_BOUND_FLAG = 4,
	      CURRY_FLAG = 8,
	      CURRY_RIGHT_FLAG = 16,
	      PARTIAL_FLAG = 32,
	      PARTIAL_RIGHT_FLAG = 64,
	      ARY_FLAG = 128,
	      REARG_FLAG = 256;

	  /** Used as default options for `_.trunc`. */
	  var DEFAULT_TRUNC_LENGTH = 30,
	      DEFAULT_TRUNC_OMISSION = '...';

	  /** Used to detect when a function becomes hot. */
	  var HOT_COUNT = 150,
	      HOT_SPAN = 16;

	  /** Used as the size to enable large array optimizations. */
	  var LARGE_ARRAY_SIZE = 200;

	  /** Used to indicate the type of lazy iteratees. */
	  var LAZY_FILTER_FLAG = 1,
	      LAZY_MAP_FLAG = 2;

	  /** Used as the `TypeError` message for "Functions" methods. */
	  var FUNC_ERROR_TEXT = 'Expected a function';

	  /** Used as the internal argument placeholder. */
	  var PLACEHOLDER = '__lodash_placeholder__';

	  /** `Object#toString` result references. */
	  var argsTag = '[object Arguments]',
	      arrayTag = '[object Array]',
	      boolTag = '[object Boolean]',
	      dateTag = '[object Date]',
	      errorTag = '[object Error]',
	      funcTag = '[object Function]',
	      mapTag = '[object Map]',
	      numberTag = '[object Number]',
	      objectTag = '[object Object]',
	      regexpTag = '[object RegExp]',
	      setTag = '[object Set]',
	      stringTag = '[object String]',
	      weakMapTag = '[object WeakMap]';

	  var arrayBufferTag = '[object ArrayBuffer]',
	      float32Tag = '[object Float32Array]',
	      float64Tag = '[object Float64Array]',
	      int8Tag = '[object Int8Array]',
	      int16Tag = '[object Int16Array]',
	      int32Tag = '[object Int32Array]',
	      uint8Tag = '[object Uint8Array]',
	      uint8ClampedTag = '[object Uint8ClampedArray]',
	      uint16Tag = '[object Uint16Array]',
	      uint32Tag = '[object Uint32Array]';

	  /** Used to match empty string literals in compiled template source. */
	  var reEmptyStringLeading = /\b__p \+= '';/g,
	      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
	      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

	  /** Used to match HTML entities and HTML characters. */
	  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g,
	      reUnescapedHtml = /[&<>"'`]/g,
	      reHasEscapedHtml = RegExp(reEscapedHtml.source),
	      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

	  /** Used to match template delimiters. */
	  var reEscape = /<%-([\s\S]+?)%>/g,
	      reEvaluate = /<%([\s\S]+?)%>/g,
	      reInterpolate = /<%=([\s\S]+?)%>/g;

	  /** Used to match property names within property paths. */
	  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
	      reIsPlainProp = /^\w*$/,
	      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

	  /**
	   * Used to match `RegExp` [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns)
	   * and those outlined by [`EscapeRegExpPattern`](http://ecma-international.org/ecma-262/6.0/#sec-escaperegexppattern).
	   */
	  var reRegExpChars = /^[:!,]|[\\^$.*+?()[\]{}|\/]|(^[0-9a-fA-Fnrtuvx])|([\n\r\u2028\u2029])/g,
	      reHasRegExpChars = RegExp(reRegExpChars.source);

	  /** Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks). */
	  var reComboMark = /[\u0300-\u036f\ufe20-\ufe23]/g;

	  /** Used to match backslashes in property paths. */
	  var reEscapeChar = /\\(\\)?/g;

	  /** Used to match [ES template delimiters](http://ecma-international.org/ecma-262/6.0/#sec-template-literal-lexical-components). */
	  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

	  /** Used to match `RegExp` flags from their coerced string values. */
	  var reFlags = /\w*$/;

	  /** Used to detect hexadecimal string values. */
	  var reHasHexPrefix = /^0[xX]/;

	  /** Used to detect host constructors (Safari > 5). */
	  var reIsHostCtor = /^\[object .+?Constructor\]$/;

	  /** Used to detect unsigned integer values. */
	  var reIsUint = /^\d+$/;

	  /** Used to match latin-1 supplementary letters (excluding mathematical operators). */
	  var reLatin1 = /[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g;

	  /** Used to ensure capturing order of template delimiters. */
	  var reNoMatch = /($^)/;

	  /** Used to match unescaped characters in compiled string literals. */
	  var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

	  /** Used to match words to create compound words. */
	  var reWords = (function() {
	    var upper = '[A-Z\\xc0-\\xd6\\xd8-\\xde]',
	        lower = '[a-z\\xdf-\\xf6\\xf8-\\xff]+';

	    return RegExp(upper + '+(?=' + upper + lower + ')|' + upper + '?' + lower + '|' + upper + '+|[0-9]+', 'g');
	  }());

	  /** Used to assign default `context` object properties. */
	  var contextProps = [
	    'Array', 'ArrayBuffer', 'Date', 'Error', 'Float32Array', 'Float64Array',
	    'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Math', 'Number',
	    'Object', 'RegExp', 'Set', 'String', '_', 'clearTimeout', 'isFinite',
	    'parseFloat', 'parseInt', 'setTimeout', 'TypeError', 'Uint8Array',
	    'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap'
	  ];

	  /** Used to make template sourceURLs easier to identify. */
	  var templateCounter = -1;

	  /** Used to identify `toStringTag` values of typed arrays. */
	  var typedArrayTags = {};
	  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	  typedArrayTags[uint32Tag] = true;
	  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	  typedArrayTags[dateTag] = typedArrayTags[errorTag] =
	  typedArrayTags[funcTag] = typedArrayTags[mapTag] =
	  typedArrayTags[numberTag] = typedArrayTags[objectTag] =
	  typedArrayTags[regexpTag] = typedArrayTags[setTag] =
	  typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

	  /** Used to identify `toStringTag` values supported by `_.clone`. */
	  var cloneableTags = {};
	  cloneableTags[argsTag] = cloneableTags[arrayTag] =
	  cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
	  cloneableTags[dateTag] = cloneableTags[float32Tag] =
	  cloneableTags[float64Tag] = cloneableTags[int8Tag] =
	  cloneableTags[int16Tag] = cloneableTags[int32Tag] =
	  cloneableTags[numberTag] = cloneableTags[objectTag] =
	  cloneableTags[regexpTag] = cloneableTags[stringTag] =
	  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
	  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
	  cloneableTags[errorTag] = cloneableTags[funcTag] =
	  cloneableTags[mapTag] = cloneableTags[setTag] =
	  cloneableTags[weakMapTag] = false;

	  /** Used to map latin-1 supplementary letters to basic latin letters. */
	  var deburredLetters = {
	    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
	    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
	    '\xc7': 'C',  '\xe7': 'c',
	    '\xd0': 'D',  '\xf0': 'd',
	    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
	    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
	    '\xcC': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
	    '\xeC': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
	    '\xd1': 'N',  '\xf1': 'n',
	    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
	    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
	    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
	    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
	    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
	    '\xc6': 'Ae', '\xe6': 'ae',
	    '\xde': 'Th', '\xfe': 'th',
	    '\xdf': 'ss'
	  };

	  /** Used to map characters to HTML entities. */
	  var htmlEscapes = {
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '"': '&quot;',
	    "'": '&#39;',
	    '`': '&#96;'
	  };

	  /** Used to map HTML entities to characters. */
	  var htmlUnescapes = {
	    '&amp;': '&',
	    '&lt;': '<',
	    '&gt;': '>',
	    '&quot;': '"',
	    '&#39;': "'",
	    '&#96;': '`'
	  };

	  /** Used to determine if values are of the language type `Object`. */
	  var objectTypes = {
	    'function': true,
	    'object': true
	  };

	  /** Used to escape characters for inclusion in compiled regexes. */
	  var regexpEscapes = {
	    '0': 'x30', '1': 'x31', '2': 'x32', '3': 'x33', '4': 'x34',
	    '5': 'x35', '6': 'x36', '7': 'x37', '8': 'x38', '9': 'x39',
	    'A': 'x41', 'B': 'x42', 'C': 'x43', 'D': 'x44', 'E': 'x45', 'F': 'x46',
	    'a': 'x61', 'b': 'x62', 'c': 'x63', 'd': 'x64', 'e': 'x65', 'f': 'x66',
	    'n': 'x6e', 'r': 'x72', 't': 'x74', 'u': 'x75', 'v': 'x76', 'x': 'x78'
	  };

	  /** Used to escape characters for inclusion in compiled string literals. */
	  var stringEscapes = {
	    '\\': '\\',
	    "'": "'",
	    '\n': 'n',
	    '\r': 'r',
	    '\u2028': 'u2028',
	    '\u2029': 'u2029'
	  };

	  /** Detect free variable `exports`. */
	  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

	  /** Detect free variable `module`. */
	  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

	  /** Detect free variable `global` from Node.js. */
	  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global && global.Object && global;

	  /** Detect free variable `self`. */
	  var freeSelf = objectTypes[typeof self] && self && self.Object && self;

	  /** Detect free variable `window`. */
	  var freeWindow = objectTypes[typeof window] && window && window.Object && window;

	  /** Detect the popular CommonJS extension `module.exports`. */
	  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

	  /**
	   * Used as a reference to the global object.
	   *
	   * The `this` value is used if it's the global object to avoid Greasemonkey's
	   * restricted `window` object, otherwise the `window` object is used.
	   */
	  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || freeSelf || this;

	  /*--------------------------------------------------------------------------*/

	  /**
	   * The base implementation of `compareAscending` which compares values and
	   * sorts them in ascending order without guaranteeing a stable sort.
	   *
	   * @private
	   * @param {*} value The value to compare.
	   * @param {*} other The other value to compare.
	   * @returns {number} Returns the sort order indicator for `value`.
	   */
	  function baseCompareAscending(value, other) {
	    if (value !== other) {
	      var valIsNull = value === null,
	          valIsUndef = value === undefined,
	          valIsReflexive = value === value;

	      var othIsNull = other === null,
	          othIsUndef = other === undefined,
	          othIsReflexive = other === other;

	      if ((value > other && !othIsNull) || !valIsReflexive ||
	          (valIsNull && !othIsUndef && othIsReflexive) ||
	          (valIsUndef && othIsReflexive)) {
	        return 1;
	      }
	      if ((value < other && !valIsNull) || !othIsReflexive ||
	          (othIsNull && !valIsUndef && valIsReflexive) ||
	          (othIsUndef && valIsReflexive)) {
	        return -1;
	      }
	    }
	    return 0;
	  }

	  /**
	   * The base implementation of `_.findIndex` and `_.findLastIndex` without
	   * support for callback shorthands and `this` binding.
	   *
	   * @private
	   * @param {Array} array The array to search.
	   * @param {Function} predicate The function invoked per iteration.
	   * @param {boolean} [fromRight] Specify iterating from right to left.
	   * @returns {number} Returns the index of the matched value, else `-1`.
	   */
	  function baseFindIndex(array, predicate, fromRight) {
	    var length = array.length,
	        index = fromRight ? length : -1;

	    while ((fromRight ? index-- : ++index < length)) {
	      if (predicate(array[index], index, array)) {
	        return index;
	      }
	    }
	    return -1;
	  }

	  /**
	   * The base implementation of `_.indexOf` without support for binary searches.
	   *
	   * @private
	   * @param {Array} array The array to search.
	   * @param {*} value The value to search for.
	   * @param {number} fromIndex The index to search from.
	   * @returns {number} Returns the index of the matched value, else `-1`.
	   */
	  function baseIndexOf(array, value, fromIndex) {
	    if (value !== value) {
	      return indexOfNaN(array, fromIndex);
	    }
	    var index = fromIndex - 1,
	        length = array.length;

	    while (++index < length) {
	      if (array[index] === value) {
	        return index;
	      }
	    }
	    return -1;
	  }

	  /**
	   * The base implementation of `_.isFunction` without support for environments
	   * with incorrect `typeof` results.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	   */
	  function baseIsFunction(value) {
	    // Avoid a Chakra JIT bug in compatibility modes of IE 11.
	    // See https://github.com/jashkenas/underscore/issues/1621 for more details.
	    return typeof value == 'function' || false;
	  }

	  /**
	   * Converts `value` to a string if it's not one. An empty string is returned
	   * for `null` or `undefined` values.
	   *
	   * @private
	   * @param {*} value The value to process.
	   * @returns {string} Returns the string.
	   */
	  function baseToString(value) {
	    return value == null ? '' : (value + '');
	  }

	  /**
	   * Used by `_.trim` and `_.trimLeft` to get the index of the first character
	   * of `string` that is not found in `chars`.
	   *
	   * @private
	   * @param {string} string The string to inspect.
	   * @param {string} chars The characters to find.
	   * @returns {number} Returns the index of the first character not found in `chars`.
	   */
	  function charsLeftIndex(string, chars) {
	    var index = -1,
	        length = string.length;

	    while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}
	    return index;
	  }

	  /**
	   * Used by `_.trim` and `_.trimRight` to get the index of the last character
	   * of `string` that is not found in `chars`.
	   *
	   * @private
	   * @param {string} string The string to inspect.
	   * @param {string} chars The characters to find.
	   * @returns {number} Returns the index of the last character not found in `chars`.
	   */
	  function charsRightIndex(string, chars) {
	    var index = string.length;

	    while (index-- && chars.indexOf(string.charAt(index)) > -1) {}
	    return index;
	  }

	  /**
	   * Used by `_.sortBy` to compare transformed elements of a collection and stable
	   * sort them in ascending order.
	   *
	   * @private
	   * @param {Object} object The object to compare.
	   * @param {Object} other The other object to compare.
	   * @returns {number} Returns the sort order indicator for `object`.
	   */
	  function compareAscending(object, other) {
	    return baseCompareAscending(object.criteria, other.criteria) || (object.index - other.index);
	  }

	  /**
	   * Used by `_.sortByOrder` to compare multiple properties of a value to another
	   * and stable sort them.
	   *
	   * If `orders` is unspecified, all valuess are sorted in ascending order. Otherwise,
	   * a value is sorted in ascending order if its corresponding order is "asc", and
	   * descending if "desc".
	   *
	   * @private
	   * @param {Object} object The object to compare.
	   * @param {Object} other The other object to compare.
	   * @param {boolean[]} orders The order to sort by for each property.
	   * @returns {number} Returns the sort order indicator for `object`.
	   */
	  function compareMultiple(object, other, orders) {
	    var index = -1,
	        objCriteria = object.criteria,
	        othCriteria = other.criteria,
	        length = objCriteria.length,
	        ordersLength = orders.length;

	    while (++index < length) {
	      var result = baseCompareAscending(objCriteria[index], othCriteria[index]);
	      if (result) {
	        if (index >= ordersLength) {
	          return result;
	        }
	        var order = orders[index];
	        return result * ((order === 'asc' || order === true) ? 1 : -1);
	      }
	    }
	    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
	    // that causes it, under certain circumstances, to provide the same value for
	    // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
	    // for more details.
	    //
	    // This also ensures a stable sort in V8 and other engines.
	    // See https://code.google.com/p/v8/issues/detail?id=90 for more details.
	    return object.index - other.index;
	  }

	  /**
	   * Used by `_.deburr` to convert latin-1 supplementary letters to basic latin letters.
	   *
	   * @private
	   * @param {string} letter The matched letter to deburr.
	   * @returns {string} Returns the deburred letter.
	   */
	  function deburrLetter(letter) {
	    return deburredLetters[letter];
	  }

	  /**
	   * Used by `_.escape` to convert characters to HTML entities.
	   *
	   * @private
	   * @param {string} chr The matched character to escape.
	   * @returns {string} Returns the escaped character.
	   */
	  function escapeHtmlChar(chr) {
	    return htmlEscapes[chr];
	  }

	  /**
	   * Used by `_.escapeRegExp` to escape characters for inclusion in compiled regexes.
	   *
	   * @private
	   * @param {string} chr The matched character to escape.
	   * @param {string} leadingChar The capture group for a leading character.
	   * @param {string} whitespaceChar The capture group for a whitespace character.
	   * @returns {string} Returns the escaped character.
	   */
	  function escapeRegExpChar(chr, leadingChar, whitespaceChar) {
	    if (leadingChar) {
	      chr = regexpEscapes[chr];
	    } else if (whitespaceChar) {
	      chr = stringEscapes[chr];
	    }
	    return '\\' + chr;
	  }

	  /**
	   * Used by `_.template` to escape characters for inclusion in compiled string literals.
	   *
	   * @private
	   * @param {string} chr The matched character to escape.
	   * @returns {string} Returns the escaped character.
	   */
	  function escapeStringChar(chr) {
	    return '\\' + stringEscapes[chr];
	  }

	  /**
	   * Gets the index at which the first occurrence of `NaN` is found in `array`.
	   *
	   * @private
	   * @param {Array} array The array to search.
	   * @param {number} fromIndex The index to search from.
	   * @param {boolean} [fromRight] Specify iterating from right to left.
	   * @returns {number} Returns the index of the matched `NaN`, else `-1`.
	   */
	  function indexOfNaN(array, fromIndex, fromRight) {
	    var length = array.length,
	        index = fromIndex + (fromRight ? 0 : -1);

	    while ((fromRight ? index-- : ++index < length)) {
	      var other = array[index];
	      if (other !== other) {
	        return index;
	      }
	    }
	    return -1;
	  }

	  /**
	   * Checks if `value` is object-like.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	   */
	  function isObjectLike(value) {
	    return !!value && typeof value == 'object';
	  }

	  /**
	   * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a
	   * character code is whitespace.
	   *
	   * @private
	   * @param {number} charCode The character code to inspect.
	   * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.
	   */
	  function isSpace(charCode) {
	    return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
	      (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
	  }

	  /**
	   * Replaces all `placeholder` elements in `array` with an internal placeholder
	   * and returns an array of their indexes.
	   *
	   * @private
	   * @param {Array} array The array to modify.
	   * @param {*} placeholder The placeholder to replace.
	   * @returns {Array} Returns the new array of placeholder indexes.
	   */
	  function replaceHolders(array, placeholder) {
	    var index = -1,
	        length = array.length,
	        resIndex = -1,
	        result = [];

	    while (++index < length) {
	      if (array[index] === placeholder) {
	        array[index] = PLACEHOLDER;
	        result[++resIndex] = index;
	      }
	    }
	    return result;
	  }

	  /**
	   * An implementation of `_.uniq` optimized for sorted arrays without support
	   * for callback shorthands and `this` binding.
	   *
	   * @private
	   * @param {Array} array The array to inspect.
	   * @param {Function} [iteratee] The function invoked per iteration.
	   * @returns {Array} Returns the new duplicate-value-free array.
	   */
	  function sortedUniq(array, iteratee) {
	    var seen,
	        index = -1,
	        length = array.length,
	        resIndex = -1,
	        result = [];

	    while (++index < length) {
	      var value = array[index],
	          computed = iteratee ? iteratee(value, index, array) : value;

	      if (!index || seen !== computed) {
	        seen = computed;
	        result[++resIndex] = value;
	      }
	    }
	    return result;
	  }

	  /**
	   * Used by `_.trim` and `_.trimLeft` to get the index of the first non-whitespace
	   * character of `string`.
	   *
	   * @private
	   * @param {string} string The string to inspect.
	   * @returns {number} Returns the index of the first non-whitespace character.
	   */
	  function trimmedLeftIndex(string) {
	    var index = -1,
	        length = string.length;

	    while (++index < length && isSpace(string.charCodeAt(index))) {}
	    return index;
	  }

	  /**
	   * Used by `_.trim` and `_.trimRight` to get the index of the last non-whitespace
	   * character of `string`.
	   *
	   * @private
	   * @param {string} string The string to inspect.
	   * @returns {number} Returns the index of the last non-whitespace character.
	   */
	  function trimmedRightIndex(string) {
	    var index = string.length;

	    while (index-- && isSpace(string.charCodeAt(index))) {}
	    return index;
	  }

	  /**
	   * Used by `_.unescape` to convert HTML entities to characters.
	   *
	   * @private
	   * @param {string} chr The matched character to unescape.
	   * @returns {string} Returns the unescaped character.
	   */
	  function unescapeHtmlChar(chr) {
	    return htmlUnescapes[chr];
	  }

	  /*--------------------------------------------------------------------------*/

	  /**
	   * Create a new pristine `lodash` function using the given `context` object.
	   *
	   * @static
	   * @memberOf _
	   * @category Utility
	   * @param {Object} [context=root] The context object.
	   * @returns {Function} Returns a new `lodash` function.
	   * @example
	   *
	   * _.mixin({ 'foo': _.constant('foo') });
	   *
	   * var lodash = _.runInContext();
	   * lodash.mixin({ 'bar': lodash.constant('bar') });
	   *
	   * _.isFunction(_.foo);
	   * // => true
	   * _.isFunction(_.bar);
	   * // => false
	   *
	   * lodash.isFunction(lodash.foo);
	   * // => false
	   * lodash.isFunction(lodash.bar);
	   * // => true
	   *
	   * // using `context` to mock `Date#getTime` use in `_.now`
	   * var mock = _.runInContext({
	   *   'Date': function() {
	   *     return { 'getTime': getTimeMock };
	   *   }
	   * });
	   *
	   * // or creating a suped-up `defer` in Node.js
	   * var defer = _.runInContext({ 'setTimeout': setImmediate }).defer;
	   */
	  function runInContext(context) {
	    // Avoid issues with some ES3 environments that attempt to use values, named
	    // after built-in constructors like `Object`, for the creation of literals.
	    // ES5 clears this up by stating that literals must use built-in constructors.
	    // See https://es5.github.io/#x11.1.5 for more details.
	    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

	    /** Native constructor references. */
	    var Array = context.Array,
	        Date = context.Date,
	        Error = context.Error,
	        Function = context.Function,
	        Math = context.Math,
	        Number = context.Number,
	        Object = context.Object,
	        RegExp = context.RegExp,
	        String = context.String,
	        TypeError = context.TypeError;

	    /** Used for native method references. */
	    var arrayProto = Array.prototype,
	        objectProto = Object.prototype,
	        stringProto = String.prototype;

	    /** Used to resolve the decompiled source of functions. */
	    var fnToString = Function.prototype.toString;

	    /** Used to check objects for own properties. */
	    var hasOwnProperty = objectProto.hasOwnProperty;

	    /** Used to generate unique IDs. */
	    var idCounter = 0;

	    /**
	     * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
	     * of values.
	     */
	    var objToString = objectProto.toString;

	    /** Used to restore the original `_` reference in `_.noConflict`. */
	    var oldDash = root._;

	    /** Used to detect if a method is native. */
	    var reIsNative = RegExp('^' +
	      fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
	      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	    );

	    /** Native method references. */
	    var ArrayBuffer = context.ArrayBuffer,
	        clearTimeout = context.clearTimeout,
	        parseFloat = context.parseFloat,
	        pow = Math.pow,
	        propertyIsEnumerable = objectProto.propertyIsEnumerable,
	        Set = getNative(context, 'Set'),
	        setTimeout = context.setTimeout,
	        splice = arrayProto.splice,
	        Uint8Array = context.Uint8Array,
	        WeakMap = getNative(context, 'WeakMap');

	    /* Native method references for those with the same name as other `lodash` methods. */
	    var nativeCeil = Math.ceil,
	        nativeCreate = getNative(Object, 'create'),
	        nativeFloor = Math.floor,
	        nativeIsArray = getNative(Array, 'isArray'),
	        nativeIsFinite = context.isFinite,
	        nativeKeys = getNative(Object, 'keys'),
	        nativeMax = Math.max,
	        nativeMin = Math.min,
	        nativeNow = getNative(Date, 'now'),
	        nativeParseInt = context.parseInt,
	        nativeRandom = Math.random;

	    /** Used as references for `-Infinity` and `Infinity`. */
	    var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY,
	        POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

	    /** Used as references for the maximum length and index of an array. */
	    var MAX_ARRAY_LENGTH = 4294967295,
	        MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1,
	        HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

	    /**
	     * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
	     * of an array-like value.
	     */
	    var MAX_SAFE_INTEGER = 9007199254740991;

	    /** Used to store function metadata. */
	    var metaMap = WeakMap && new WeakMap;

	    /** Used to lookup unminified function names. */
	    var realNames = {};

	    /*------------------------------------------------------------------------*/

	    /**
	     * Creates a `lodash` object which wraps `value` to enable implicit chaining.
	     * Methods that operate on and return arrays, collections, and functions can
	     * be chained together. Methods that retrieve a single value or may return a
	     * primitive value will automatically end the chain returning the unwrapped
	     * value. Explicit chaining may be enabled using `_.chain`. The execution of
	     * chained methods is lazy, that is, execution is deferred until `_#value`
	     * is implicitly or explicitly called.
	     *
	     * Lazy evaluation allows several methods to support shortcut fusion. Shortcut
	     * fusion is an optimization strategy which merge iteratee calls; this can help
	     * to avoid the creation of intermediate data structures and greatly reduce the
	     * number of iteratee executions.
	     *
	     * Chaining is supported in custom builds as long as the `_#value` method is
	     * directly or indirectly included in the build.
	     *
	     * In addition to lodash methods, wrappers have `Array` and `String` methods.
	     *
	     * The wrapper `Array` methods are:
	     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`,
	     * `splice`, and `unshift`
	     *
	     * The wrapper `String` methods are:
	     * `replace` and `split`
	     *
	     * The wrapper methods that support shortcut fusion are:
	     * `compact`, `drop`, `dropRight`, `dropRightWhile`, `dropWhile`, `filter`,
	     * `first`, `initial`, `last`, `map`, `pluck`, `reject`, `rest`, `reverse`,
	     * `slice`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, `toArray`,
	     * and `where`
	     *
	     * The chainable wrapper methods are:
	     * `after`, `ary`, `assign`, `at`, `before`, `bind`, `bindAll`, `bindKey`,
	     * `callback`, `chain`, `chunk`, `commit`, `compact`, `concat`, `constant`,
	     * `countBy`, `create`, `curry`, `debounce`, `defaults`, `defaultsDeep`,
	     * `defer`, `delay`, `difference`, `drop`, `dropRight`, `dropRightWhile`,
	     * `dropWhile`, `fill`, `filter`, `flatten`, `flattenDeep`, `flow`, `flowRight`,
	     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
	     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
	     * `invoke`, `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`,
	     * `matchesProperty`, `memoize`, `merge`, `method`, `methodOf`, `mixin`,
	     * `modArgs`, `negate`, `omit`, `once`, `pairs`, `partial`, `partialRight`,
	     * `partition`, `pick`, `plant`, `pluck`, `property`, `propertyOf`, `pull`,
	     * `pullAt`, `push`, `range`, `rearg`, `reject`, `remove`, `rest`, `restParam`,
	     * `reverse`, `set`, `shuffle`, `slice`, `sort`, `sortBy`, `sortByAll`,
	     * `sortByOrder`, `splice`, `spread`, `take`, `takeRight`, `takeRightWhile`,
	     * `takeWhile`, `tap`, `throttle`, `thru`, `times`, `toArray`, `toPlainObject`,
	     * `transform`, `union`, `uniq`, `unshift`, `unzip`, `unzipWith`, `values`,
	     * `valuesIn`, `where`, `without`, `wrap`, `xor`, `zip`, `zipObject`, `zipWith`
	     *
	     * The wrapper methods that are **not** chainable by default are:
	     * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clone`, `cloneDeep`,
	     * `deburr`, `endsWith`, `escape`, `escapeRegExp`, `every`, `find`, `findIndex`,
	     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `findWhere`, `first`,
	     * `floor`, `get`, `gt`, `gte`, `has`, `identity`, `includes`, `indexOf`,
	     * `inRange`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
	     * `isEmpty`, `isEqual`, `isError`, `isFinite` `isFunction`, `isMatch`,
	     * `isNative`, `isNaN`, `isNull`, `isNumber`, `isObject`, `isPlainObject`,
	     * `isRegExp`, `isString`, `isUndefined`, `isTypedArray`, `join`, `kebabCase`,
	     * `last`, `lastIndexOf`, `lt`, `lte`, `max`, `min`, `noConflict`, `noop`,
	     * `now`, `pad`, `padLeft`, `padRight`, `parseInt`, `pop`, `random`, `reduce`,
	     * `reduceRight`, `repeat`, `result`, `round`, `runInContext`, `shift`, `size`,
	     * `snakeCase`, `some`, `sortedIndex`, `sortedLastIndex`, `startCase`,
	     * `startsWith`, `sum`, `template`, `trim`, `trimLeft`, `trimRight`, `trunc`,
	     * `unescape`, `uniqueId`, `value`, and `words`
	     *
	     * The wrapper method `sample` will return a wrapped value when `n` is provided,
	     * otherwise an unwrapped value is returned.
	     *
	     * @name _
	     * @constructor
	     * @category Chain
	     * @param {*} value The value to wrap in a `lodash` instance.
	     * @returns {Object} Returns the new `lodash` wrapper instance.
	     * @example
	     *
	     * var wrapped = _([1, 2, 3]);
	     *
	     * // returns an unwrapped value
	     * wrapped.reduce(function(total, n) {
	     *   return total + n;
	     * });
	     * // => 6
	     *
	     * // returns a wrapped value
	     * var squares = wrapped.map(function(n) {
	     *   return n * n;
	     * });
	     *
	     * _.isArray(squares);
	     * // => false
	     *
	     * _.isArray(squares.value());
	     * // => true
	     */
	    function lodash(value) {
	      if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
	        if (value instanceof LodashWrapper) {
	          return value;
	        }
	        if (hasOwnProperty.call(value, '__chain__') && hasOwnProperty.call(value, '__wrapped__')) {
	          return wrapperClone(value);
	        }
	      }
	      return new LodashWrapper(value);
	    }

	    /**
	     * The function whose prototype all chaining wrappers inherit from.
	     *
	     * @private
	     */
	    function baseLodash() {
	      // No operation performed.
	    }

	    /**
	     * The base constructor for creating `lodash` wrapper objects.
	     *
	     * @private
	     * @param {*} value The value to wrap.
	     * @param {boolean} [chainAll] Enable chaining for all wrapper methods.
	     * @param {Array} [actions=[]] Actions to peform to resolve the unwrapped value.
	     */
	    function LodashWrapper(value, chainAll, actions) {
	      this.__wrapped__ = value;
	      this.__actions__ = actions || [];
	      this.__chain__ = !!chainAll;
	    }

	    /**
	     * An object environment feature flags.
	     *
	     * @static
	     * @memberOf _
	     * @type Object
	     */
	    var support = lodash.support = {};

	    /**
	     * By default, the template delimiters used by lodash are like those in
	     * embedded Ruby (ERB). Change the following template settings to use
	     * alternative delimiters.
	     *
	     * @static
	     * @memberOf _
	     * @type Object
	     */
	    lodash.templateSettings = {

	      /**
	       * Used to detect `data` property values to be HTML-escaped.
	       *
	       * @memberOf _.templateSettings
	       * @type RegExp
	       */
	      'escape': reEscape,

	      /**
	       * Used to detect code to be evaluated.
	       *
	       * @memberOf _.templateSettings
	       * @type RegExp
	       */
	      'evaluate': reEvaluate,

	      /**
	       * Used to detect `data` property values to inject.
	       *
	       * @memberOf _.templateSettings
	       * @type RegExp
	       */
	      'interpolate': reInterpolate,

	      /**
	       * Used to reference the data object in the template text.
	       *
	       * @memberOf _.templateSettings
	       * @type string
	       */
	      'variable': '',

	      /**
	       * Used to import variables into the compiled template.
	       *
	       * @memberOf _.templateSettings
	       * @type Object
	       */
	      'imports': {

	        /**
	         * A reference to the `lodash` function.
	         *
	         * @memberOf _.templateSettings.imports
	         * @type Function
	         */
	        '_': lodash
	      }
	    };

	    /*------------------------------------------------------------------------*/

	    /**
	     * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
	     *
	     * @private
	     * @param {*} value The value to wrap.
	     */
	    function LazyWrapper(value) {
	      this.__wrapped__ = value;
	      this.__actions__ = [];
	      this.__dir__ = 1;
	      this.__filtered__ = false;
	      this.__iteratees__ = [];
	      this.__takeCount__ = POSITIVE_INFINITY;
	      this.__views__ = [];
	    }

	    /**
	     * Creates a clone of the lazy wrapper object.
	     *
	     * @private
	     * @name clone
	     * @memberOf LazyWrapper
	     * @returns {Object} Returns the cloned `LazyWrapper` object.
	     */
	    function lazyClone() {
	      var result = new LazyWrapper(this.__wrapped__);
	      result.__actions__ = arrayCopy(this.__actions__);
	      result.__dir__ = this.__dir__;
	      result.__filtered__ = this.__filtered__;
	      result.__iteratees__ = arrayCopy(this.__iteratees__);
	      result.__takeCount__ = this.__takeCount__;
	      result.__views__ = arrayCopy(this.__views__);
	      return result;
	    }

	    /**
	     * Reverses the direction of lazy iteration.
	     *
	     * @private
	     * @name reverse
	     * @memberOf LazyWrapper
	     * @returns {Object} Returns the new reversed `LazyWrapper` object.
	     */
	    function lazyReverse() {
	      if (this.__filtered__) {
	        var result = new LazyWrapper(this);
	        result.__dir__ = -1;
	        result.__filtered__ = true;
	      } else {
	        result = this.clone();
	        result.__dir__ *= -1;
	      }
	      return result;
	    }

	    /**
	     * Extracts the unwrapped value from its lazy wrapper.
	     *
	     * @private
	     * @name value
	     * @memberOf LazyWrapper
	     * @returns {*} Returns the unwrapped value.
	     */
	    function lazyValue() {
	      var array = this.__wrapped__.value(),
	          dir = this.__dir__,
	          isArr = isArray(array),
	          isRight = dir < 0,
	          arrLength = isArr ? array.length : 0,
	          view = getView(0, arrLength, this.__views__),
	          start = view.start,
	          end = view.end,
	          length = end - start,
	          index = isRight ? end : (start - 1),
	          iteratees = this.__iteratees__,
	          iterLength = iteratees.length,
	          resIndex = 0,
	          takeCount = nativeMin(length, this.__takeCount__);

	      if (!isArr || arrLength < LARGE_ARRAY_SIZE || (arrLength == length && takeCount == length)) {
	        return baseWrapperValue((isRight && isArr) ? array.reverse() : array, this.__actions__);
	      }
	      var result = [];

	      outer:
	      while (length-- && resIndex < takeCount) {
	        index += dir;

	        var iterIndex = -1,
	            value = array[index];

	        while (++iterIndex < iterLength) {
	          var data = iteratees[iterIndex],
	              iteratee = data.iteratee,
	              type = data.type,
	              computed = iteratee(value);

	          if (type == LAZY_MAP_FLAG) {
	            value = computed;
	          } else if (!computed) {
	            if (type == LAZY_FILTER_FLAG) {
	              continue outer;
	            } else {
	              break outer;
	            }
	          }
	        }
	        result[resIndex++] = value;
	      }
	      return result;
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Creates a cache object to store key/value pairs.
	     *
	     * @private
	     * @static
	     * @name Cache
	     * @memberOf _.memoize
	     */
	    function MapCache() {
	      this.__data__ = {};
	    }

	    /**
	     * Removes `key` and its value from the cache.
	     *
	     * @private
	     * @name delete
	     * @memberOf _.memoize.Cache
	     * @param {string} key The key of the value to remove.
	     * @returns {boolean} Returns `true` if the entry was removed successfully, else `false`.
	     */
	    function mapDelete(key) {
	      return this.has(key) && delete this.__data__[key];
	    }

	    /**
	     * Gets the cached value for `key`.
	     *
	     * @private
	     * @name get
	     * @memberOf _.memoize.Cache
	     * @param {string} key The key of the value to get.
	     * @returns {*} Returns the cached value.
	     */
	    function mapGet(key) {
	      return key == '__proto__' ? undefined : this.__data__[key];
	    }

	    /**
	     * Checks if a cached value for `key` exists.
	     *
	     * @private
	     * @name has
	     * @memberOf _.memoize.Cache
	     * @param {string} key The key of the entry to check.
	     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	     */
	    function mapHas(key) {
	      return key != '__proto__' && hasOwnProperty.call(this.__data__, key);
	    }

	    /**
	     * Sets `value` to `key` of the cache.
	     *
	     * @private
	     * @name set
	     * @memberOf _.memoize.Cache
	     * @param {string} key The key of the value to cache.
	     * @param {*} value The value to cache.
	     * @returns {Object} Returns the cache object.
	     */
	    function mapSet(key, value) {
	      if (key != '__proto__') {
	        this.__data__[key] = value;
	      }
	      return this;
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     *
	     * Creates a cache object to store unique values.
	     *
	     * @private
	     * @param {Array} [values] The values to cache.
	     */
	    function SetCache(values) {
	      var length = values ? values.length : 0;

	      this.data = { 'hash': nativeCreate(null), 'set': new Set };
	      while (length--) {
	        this.push(values[length]);
	      }
	    }

	    /**
	     * Checks if `value` is in `cache` mimicking the return signature of
	     * `_.indexOf` by returning `0` if the value is found, else `-1`.
	     *
	     * @private
	     * @param {Object} cache The cache to search.
	     * @param {*} value The value to search for.
	     * @returns {number} Returns `0` if `value` is found, else `-1`.
	     */
	    function cacheIndexOf(cache, value) {
	      var data = cache.data,
	          result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

	      return result ? 0 : -1;
	    }

	    /**
	     * Adds `value` to the cache.
	     *
	     * @private
	     * @name push
	     * @memberOf SetCache
	     * @param {*} value The value to cache.
	     */
	    function cachePush(value) {
	      var data = this.data;
	      if (typeof value == 'string' || isObject(value)) {
	        data.set.add(value);
	      } else {
	        data.hash[value] = true;
	      }
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Creates a new array joining `array` with `other`.
	     *
	     * @private
	     * @param {Array} array The array to join.
	     * @param {Array} other The other array to join.
	     * @returns {Array} Returns the new concatenated array.
	     */
	    function arrayConcat(array, other) {
	      var index = -1,
	          length = array.length,
	          othIndex = -1,
	          othLength = other.length,
	          result = Array(length + othLength);

	      while (++index < length) {
	        result[index] = array[index];
	      }
	      while (++othIndex < othLength) {
	        result[index++] = other[othIndex];
	      }
	      return result;
	    }

	    /**
	     * Copies the values of `source` to `array`.
	     *
	     * @private
	     * @param {Array} source The array to copy values from.
	     * @param {Array} [array=[]] The array to copy values to.
	     * @returns {Array} Returns `array`.
	     */
	    function arrayCopy(source, array) {
	      var index = -1,
	          length = source.length;

	      array || (array = Array(length));
	      while (++index < length) {
	        array[index] = source[index];
	      }
	      return array;
	    }

	    /**
	     * A specialized version of `_.forEach` for arrays without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Array} Returns `array`.
	     */
	    function arrayEach(array, iteratee) {
	      var index = -1,
	          length = array.length;

	      while (++index < length) {
	        if (iteratee(array[index], index, array) === false) {
	          break;
	        }
	      }
	      return array;
	    }

	    /**
	     * A specialized version of `_.forEachRight` for arrays without support for
	     * callback shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Array} Returns `array`.
	     */
	    function arrayEachRight(array, iteratee) {
	      var length = array.length;

	      while (length--) {
	        if (iteratee(array[length], length, array) === false) {
	          break;
	        }
	      }
	      return array;
	    }

	    /**
	     * A specialized version of `_.every` for arrays without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} predicate The function invoked per iteration.
	     * @returns {boolean} Returns `true` if all elements pass the predicate check,
	     *  else `false`.
	     */
	    function arrayEvery(array, predicate) {
	      var index = -1,
	          length = array.length;

	      while (++index < length) {
	        if (!predicate(array[index], index, array)) {
	          return false;
	        }
	      }
	      return true;
	    }

	    /**
	     * A specialized version of `baseExtremum` for arrays which invokes `iteratee`
	     * with one argument: (value).
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @param {Function} comparator The function used to compare values.
	     * @param {*} exValue The initial extremum value.
	     * @returns {*} Returns the extremum value.
	     */
	    function arrayExtremum(array, iteratee, comparator, exValue) {
	      var index = -1,
	          length = array.length,
	          computed = exValue,
	          result = computed;

	      while (++index < length) {
	        var value = array[index],
	            current = +iteratee(value);

	        if (comparator(current, computed)) {
	          computed = current;
	          result = value;
	        }
	      }
	      return result;
	    }

	    /**
	     * A specialized version of `_.filter` for arrays without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} predicate The function invoked per iteration.
	     * @returns {Array} Returns the new filtered array.
	     */
	    function arrayFilter(array, predicate) {
	      var index = -1,
	          length = array.length,
	          resIndex = -1,
	          result = [];

	      while (++index < length) {
	        var value = array[index];
	        if (predicate(value, index, array)) {
	          result[++resIndex] = value;
	        }
	      }
	      return result;
	    }

	    /**
	     * A specialized version of `_.map` for arrays without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Array} Returns the new mapped array.
	     */
	    function arrayMap(array, iteratee) {
	      var index = -1,
	          length = array.length,
	          result = Array(length);

	      while (++index < length) {
	        result[index] = iteratee(array[index], index, array);
	      }
	      return result;
	    }

	    /**
	     * Appends the elements of `values` to `array`.
	     *
	     * @private
	     * @param {Array} array The array to modify.
	     * @param {Array} values The values to append.
	     * @returns {Array} Returns `array`.
	     */
	    function arrayPush(array, values) {
	      var index = -1,
	          length = values.length,
	          offset = array.length;

	      while (++index < length) {
	        array[offset + index] = values[index];
	      }
	      return array;
	    }

	    /**
	     * A specialized version of `_.reduce` for arrays without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @param {*} [accumulator] The initial value.
	     * @param {boolean} [initFromArray] Specify using the first element of `array`
	     *  as the initial value.
	     * @returns {*} Returns the accumulated value.
	     */
	    function arrayReduce(array, iteratee, accumulator, initFromArray) {
	      var index = -1,
	          length = array.length;

	      if (initFromArray && length) {
	        accumulator = array[++index];
	      }
	      while (++index < length) {
	        accumulator = iteratee(accumulator, array[index], index, array);
	      }
	      return accumulator;
	    }

	    /**
	     * A specialized version of `_.reduceRight` for arrays without support for
	     * callback shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @param {*} [accumulator] The initial value.
	     * @param {boolean} [initFromArray] Specify using the last element of `array`
	     *  as the initial value.
	     * @returns {*} Returns the accumulated value.
	     */
	    function arrayReduceRight(array, iteratee, accumulator, initFromArray) {
	      var length = array.length;
	      if (initFromArray && length) {
	        accumulator = array[--length];
	      }
	      while (length--) {
	        accumulator = iteratee(accumulator, array[length], length, array);
	      }
	      return accumulator;
	    }

	    /**
	     * A specialized version of `_.some` for arrays without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} predicate The function invoked per iteration.
	     * @returns {boolean} Returns `true` if any element passes the predicate check,
	     *  else `false`.
	     */
	    function arraySome(array, predicate) {
	      var index = -1,
	          length = array.length;

	      while (++index < length) {
	        if (predicate(array[index], index, array)) {
	          return true;
	        }
	      }
	      return false;
	    }

	    /**
	     * A specialized version of `_.sum` for arrays without support for callback
	     * shorthands and `this` binding..
	     *
	     * @private
	     * @param {Array} array The array to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {number} Returns the sum.
	     */
	    function arraySum(array, iteratee) {
	      var length = array.length,
	          result = 0;

	      while (length--) {
	        result += +iteratee(array[length]) || 0;
	      }
	      return result;
	    }

	    /**
	     * Used by `_.defaults` to customize its `_.assign` use.
	     *
	     * @private
	     * @param {*} objectValue The destination object property value.
	     * @param {*} sourceValue The source object property value.
	     * @returns {*} Returns the value to assign to the destination object.
	     */
	    function assignDefaults(objectValue, sourceValue) {
	      return objectValue === undefined ? sourceValue : objectValue;
	    }

	    /**
	     * Used by `_.template` to customize its `_.assign` use.
	     *
	     * **Note:** This function is like `assignDefaults` except that it ignores
	     * inherited property values when checking if a property is `undefined`.
	     *
	     * @private
	     * @param {*} objectValue The destination object property value.
	     * @param {*} sourceValue The source object property value.
	     * @param {string} key The key associated with the object and source values.
	     * @param {Object} object The destination object.
	     * @returns {*} Returns the value to assign to the destination object.
	     */
	    function assignOwnDefaults(objectValue, sourceValue, key, object) {
	      return (objectValue === undefined || !hasOwnProperty.call(object, key))
	        ? sourceValue
	        : objectValue;
	    }

	    /**
	     * A specialized version of `_.assign` for customizing assigned values without
	     * support for argument juggling, multiple sources, and `this` binding `customizer`
	     * functions.
	     *
	     * @private
	     * @param {Object} object The destination object.
	     * @param {Object} source The source object.
	     * @param {Function} customizer The function to customize assigned values.
	     * @returns {Object} Returns `object`.
	     */
	    function assignWith(object, source, customizer) {
	      var index = -1,
	          props = keys(source),
	          length = props.length;

	      while (++index < length) {
	        var key = props[index],
	            value = object[key],
	            result = customizer(value, source[key], key, object, source);

	        if ((result === result ? (result !== value) : (value === value)) ||
	            (value === undefined && !(key in object))) {
	          object[key] = result;
	        }
	      }
	      return object;
	    }

	    /**
	     * The base implementation of `_.assign` without support for argument juggling,
	     * multiple sources, and `customizer` functions.
	     *
	     * @private
	     * @param {Object} object The destination object.
	     * @param {Object} source The source object.
	     * @returns {Object} Returns `object`.
	     */
	    function baseAssign(object, source) {
	      return source == null
	        ? object
	        : baseCopy(source, keys(source), object);
	    }

	    /**
	     * The base implementation of `_.at` without support for string collections
	     * and individual key arguments.
	     *
	     * @private
	     * @param {Array|Object} collection The collection to iterate over.
	     * @param {number[]|string[]} props The property names or indexes of elements to pick.
	     * @returns {Array} Returns the new array of picked elements.
	     */
	    function baseAt(collection, props) {
	      var index = -1,
	          isNil = collection == null,
	          isArr = !isNil && isArrayLike(collection),
	          length = isArr ? collection.length : 0,
	          propsLength = props.length,
	          result = Array(propsLength);

	      while(++index < propsLength) {
	        var key = props[index];
	        if (isArr) {
	          result[index] = isIndex(key, length) ? collection[key] : undefined;
	        } else {
	          result[index] = isNil ? undefined : collection[key];
	        }
	      }
	      return result;
	    }

	    /**
	     * Copies properties of `source` to `object`.
	     *
	     * @private
	     * @param {Object} source The object to copy properties from.
	     * @param {Array} props The property names to copy.
	     * @param {Object} [object={}] The object to copy properties to.
	     * @returns {Object} Returns `object`.
	     */
	    function baseCopy(source, props, object) {
	      object || (object = {});

	      var index = -1,
	          length = props.length;

	      while (++index < length) {
	        var key = props[index];
	        object[key] = source[key];
	      }
	      return object;
	    }

	    /**
	     * The base implementation of `_.callback` which supports specifying the
	     * number of arguments to provide to `func`.
	     *
	     * @private
	     * @param {*} [func=_.identity] The value to convert to a callback.
	     * @param {*} [thisArg] The `this` binding of `func`.
	     * @param {number} [argCount] The number of arguments to provide to `func`.
	     * @returns {Function} Returns the callback.
	     */
	    function baseCallback(func, thisArg, argCount) {
	      var type = typeof func;
	      if (type == 'function') {
	        return thisArg === undefined
	          ? func
	          : bindCallback(func, thisArg, argCount);
	      }
	      if (func == null) {
	        return identity;
	      }
	      if (type == 'object') {
	        return baseMatches(func);
	      }
	      return thisArg === undefined
	        ? property(func)
	        : baseMatchesProperty(func, thisArg);
	    }

	    /**
	     * The base implementation of `_.clone` without support for argument juggling
	     * and `this` binding `customizer` functions.
	     *
	     * @private
	     * @param {*} value The value to clone.
	     * @param {boolean} [isDeep] Specify a deep clone.
	     * @param {Function} [customizer] The function to customize cloning values.
	     * @param {string} [key] The key of `value`.
	     * @param {Object} [object] The object `value` belongs to.
	     * @param {Array} [stackA=[]] Tracks traversed source objects.
	     * @param {Array} [stackB=[]] Associates clones with source counterparts.
	     * @returns {*} Returns the cloned value.
	     */
	    function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
	      var result;
	      if (customizer) {
	        result = object ? customizer(value, key, object) : customizer(value);
	      }
	      if (result !== undefined) {
	        return result;
	      }
	      if (!isObject(value)) {
	        return value;
	      }
	      var isArr = isArray(value);
	      if (isArr) {
	        result = initCloneArray(value);
	        if (!isDeep) {
	          return arrayCopy(value, result);
	        }
	      } else {
	        var tag = objToString.call(value),
	            isFunc = tag == funcTag;

	        if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
	          result = initCloneObject(isFunc ? {} : value);
	          if (!isDeep) {
	            return baseAssign(result, value);
	          }
	        } else {
	          return cloneableTags[tag]
	            ? initCloneByTag(value, tag, isDeep)
	            : (object ? value : {});
	        }
	      }
	      // Check for circular references and return its corresponding clone.
	      stackA || (stackA = []);
	      stackB || (stackB = []);

	      var length = stackA.length;
	      while (length--) {
	        if (stackA[length] == value) {
	          return stackB[length];
	        }
	      }
	      // Add the source value to the stack of traversed objects and associate it with its clone.
	      stackA.push(value);
	      stackB.push(result);

	      // Recursively populate clone (susceptible to call stack limits).
	      (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
	        result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
	      });
	      return result;
	    }

	    /**
	     * The base implementation of `_.create` without support for assigning
	     * properties to the created object.
	     *
	     * @private
	     * @param {Object} prototype The object to inherit from.
	     * @returns {Object} Returns the new object.
	     */
	    var baseCreate = (function() {
	      function object() {}
	      return function(prototype) {
	        if (isObject(prototype)) {
	          object.prototype = prototype;
	          var result = new object;
	          object.prototype = undefined;
	        }
	        return result || {};
	      };
	    }());

	    /**
	     * The base implementation of `_.delay` and `_.defer` which accepts an index
	     * of where to slice the arguments to provide to `func`.
	     *
	     * @private
	     * @param {Function} func The function to delay.
	     * @param {number} wait The number of milliseconds to delay invocation.
	     * @param {Object} args The arguments provide to `func`.
	     * @returns {number} Returns the timer id.
	     */
	    function baseDelay(func, wait, args) {
	      if (typeof func != 'function') {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      return setTimeout(function() { func.apply(undefined, args); }, wait);
	    }

	    /**
	     * The base implementation of `_.difference` which accepts a single array
	     * of values to exclude.
	     *
	     * @private
	     * @param {Array} array The array to inspect.
	     * @param {Array} values The values to exclude.
	     * @returns {Array} Returns the new array of filtered values.
	     */
	    function baseDifference(array, values) {
	      var length = array ? array.length : 0,
	          result = [];

	      if (!length) {
	        return result;
	      }
	      var index = -1,
	          indexOf = getIndexOf(),
	          isCommon = indexOf == baseIndexOf,
	          cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
	          valuesLength = values.length;

	      if (cache) {
	        indexOf = cacheIndexOf;
	        isCommon = false;
	        values = cache;
	      }
	      outer:
	      while (++index < length) {
	        var value = array[index];

	        if (isCommon && value === value) {
	          var valuesIndex = valuesLength;
	          while (valuesIndex--) {
	            if (values[valuesIndex] === value) {
	              continue outer;
	            }
	          }
	          result.push(value);
	        }
	        else if (indexOf(values, value, 0) < 0) {
	          result.push(value);
	        }
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `_.forEach` without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Array|Object|string} Returns `collection`.
	     */
	    var baseEach = createBaseEach(baseForOwn);

	    /**
	     * The base implementation of `_.forEachRight` without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Array|Object|string} Returns `collection`.
	     */
	    var baseEachRight = createBaseEach(baseForOwnRight, true);

	    /**
	     * The base implementation of `_.every` without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} predicate The function invoked per iteration.
	     * @returns {boolean} Returns `true` if all elements pass the predicate check,
	     *  else `false`
	     */
	    function baseEvery(collection, predicate) {
	      var result = true;
	      baseEach(collection, function(value, index, collection) {
	        result = !!predicate(value, index, collection);
	        return result;
	      });
	      return result;
	    }

	    /**
	     * Gets the extremum value of `collection` invoking `iteratee` for each value
	     * in `collection` to generate the criterion by which the value is ranked.
	     * The `iteratee` is invoked with three arguments: (value, index|key, collection).
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @param {Function} comparator The function used to compare values.
	     * @param {*} exValue The initial extremum value.
	     * @returns {*} Returns the extremum value.
	     */
	    function baseExtremum(collection, iteratee, comparator, exValue) {
	      var computed = exValue,
	          result = computed;

	      baseEach(collection, function(value, index, collection) {
	        var current = +iteratee(value, index, collection);
	        if (comparator(current, computed) || (current === exValue && current === result)) {
	          computed = current;
	          result = value;
	        }
	      });
	      return result;
	    }

	    /**
	     * The base implementation of `_.fill` without an iteratee call guard.
	     *
	     * @private
	     * @param {Array} array The array to fill.
	     * @param {*} value The value to fill `array` with.
	     * @param {number} [start=0] The start position.
	     * @param {number} [end=array.length] The end position.
	     * @returns {Array} Returns `array`.
	     */
	    function baseFill(array, value, start, end) {
	      var length = array.length;

	      start = start == null ? 0 : (+start || 0);
	      if (start < 0) {
	        start = -start > length ? 0 : (length + start);
	      }
	      end = (end === undefined || end > length) ? length : (+end || 0);
	      if (end < 0) {
	        end += length;
	      }
	      length = start > end ? 0 : (end >>> 0);
	      start >>>= 0;

	      while (start < length) {
	        array[start++] = value;
	      }
	      return array;
	    }

	    /**
	     * The base implementation of `_.filter` without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} predicate The function invoked per iteration.
	     * @returns {Array} Returns the new filtered array.
	     */
	    function baseFilter(collection, predicate) {
	      var result = [];
	      baseEach(collection, function(value, index, collection) {
	        if (predicate(value, index, collection)) {
	          result.push(value);
	        }
	      });
	      return result;
	    }

	    /**
	     * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
	     * without support for callback shorthands and `this` binding, which iterates
	     * over `collection` using the provided `eachFunc`.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to search.
	     * @param {Function} predicate The function invoked per iteration.
	     * @param {Function} eachFunc The function to iterate over `collection`.
	     * @param {boolean} [retKey] Specify returning the key of the found element
	     *  instead of the element itself.
	     * @returns {*} Returns the found element or its key, else `undefined`.
	     */
	    function baseFind(collection, predicate, eachFunc, retKey) {
	      var result;
	      eachFunc(collection, function(value, key, collection) {
	        if (predicate(value, key, collection)) {
	          result = retKey ? key : value;
	          return false;
	        }
	      });
	      return result;
	    }

	    /**
	     * The base implementation of `_.flatten` with added support for restricting
	     * flattening and specifying the start index.
	     *
	     * @private
	     * @param {Array} array The array to flatten.
	     * @param {boolean} [isDeep] Specify a deep flatten.
	     * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
	     * @param {Array} [result=[]] The initial result value.
	     * @returns {Array} Returns the new flattened array.
	     */
	    function baseFlatten(array, isDeep, isStrict, result) {
	      result || (result = []);

	      var index = -1,
	          length = array.length;

	      while (++index < length) {
	        var value = array[index];
	        if (isObjectLike(value) && isArrayLike(value) &&
	            (isStrict || isArray(value) || isArguments(value))) {
	          if (isDeep) {
	            // Recursively flatten arrays (susceptible to call stack limits).
	            baseFlatten(value, isDeep, isStrict, result);
	          } else {
	            arrayPush(result, value);
	          }
	        } else if (!isStrict) {
	          result[result.length] = value;
	        }
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `baseForIn` and `baseForOwn` which iterates
	     * over `object` properties returned by `keysFunc` invoking `iteratee` for
	     * each property. Iteratee functions may exit iteration early by explicitly
	     * returning `false`.
	     *
	     * @private
	     * @param {Object} object The object to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @param {Function} keysFunc The function to get the keys of `object`.
	     * @returns {Object} Returns `object`.
	     */
	    var baseFor = createBaseFor();

	    /**
	     * This function is like `baseFor` except that it iterates over properties
	     * in the opposite order.
	     *
	     * @private
	     * @param {Object} object The object to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @param {Function} keysFunc The function to get the keys of `object`.
	     * @returns {Object} Returns `object`.
	     */
	    var baseForRight = createBaseFor(true);

	    /**
	     * The base implementation of `_.forIn` without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Object} object The object to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Object} Returns `object`.
	     */
	    function baseForIn(object, iteratee) {
	      return baseFor(object, iteratee, keysIn);
	    }

	    /**
	     * The base implementation of `_.forOwn` without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Object} object The object to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Object} Returns `object`.
	     */
	    function baseForOwn(object, iteratee) {
	      return baseFor(object, iteratee, keys);
	    }

	    /**
	     * The base implementation of `_.forOwnRight` without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Object} object The object to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Object} Returns `object`.
	     */
	    function baseForOwnRight(object, iteratee) {
	      return baseForRight(object, iteratee, keys);
	    }

	    /**
	     * The base implementation of `_.functions` which creates an array of
	     * `object` function property names filtered from those provided.
	     *
	     * @private
	     * @param {Object} object The object to inspect.
	     * @param {Array} props The property names to filter.
	     * @returns {Array} Returns the new array of filtered property names.
	     */
	    function baseFunctions(object, props) {
	      var index = -1,
	          length = props.length,
	          resIndex = -1,
	          result = [];

	      while (++index < length) {
	        var key = props[index];
	        if (isFunction(object[key])) {
	          result[++resIndex] = key;
	        }
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `get` without support for string paths
	     * and default values.
	     *
	     * @private
	     * @param {Object} object The object to query.
	     * @param {Array} path The path of the property to get.
	     * @param {string} [pathKey] The key representation of path.
	     * @returns {*} Returns the resolved value.
	     */
	    function baseGet(object, path, pathKey) {
	      if (object == null) {
	        return;
	      }
	      if (pathKey !== undefined && pathKey in toObject(object)) {
	        path = [pathKey];
	      }
	      var index = 0,
	          length = path.length;

	      while (object != null && index < length) {
	        object = object[path[index++]];
	      }
	      return (index && index == length) ? object : undefined;
	    }

	    /**
	     * The base implementation of `_.isEqual` without support for `this` binding
	     * `customizer` functions.
	     *
	     * @private
	     * @param {*} value The value to compare.
	     * @param {*} other The other value to compare.
	     * @param {Function} [customizer] The function to customize comparing values.
	     * @param {boolean} [isLoose] Specify performing partial comparisons.
	     * @param {Array} [stackA] Tracks traversed `value` objects.
	     * @param {Array} [stackB] Tracks traversed `other` objects.
	     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	     */
	    function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
	      if (value === other) {
	        return true;
	      }
	      if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
	        return value !== value && other !== other;
	      }
	      return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
	    }

	    /**
	     * A specialized version of `baseIsEqual` for arrays and objects which performs
	     * deep comparisons and tracks traversed objects enabling objects with circular
	     * references to be compared.
	     *
	     * @private
	     * @param {Object} object The object to compare.
	     * @param {Object} other The other object to compare.
	     * @param {Function} equalFunc The function to determine equivalents of values.
	     * @param {Function} [customizer] The function to customize comparing objects.
	     * @param {boolean} [isLoose] Specify performing partial comparisons.
	     * @param {Array} [stackA=[]] Tracks traversed `value` objects.
	     * @param {Array} [stackB=[]] Tracks traversed `other` objects.
	     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	     */
	    function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
	      var objIsArr = isArray(object),
	          othIsArr = isArray(other),
	          objTag = arrayTag,
	          othTag = arrayTag;

	      if (!objIsArr) {
	        objTag = objToString.call(object);
	        if (objTag == argsTag) {
	          objTag = objectTag;
	        } else if (objTag != objectTag) {
	          objIsArr = isTypedArray(object);
	        }
	      }
	      if (!othIsArr) {
	        othTag = objToString.call(other);
	        if (othTag == argsTag) {
	          othTag = objectTag;
	        } else if (othTag != objectTag) {
	          othIsArr = isTypedArray(other);
	        }
	      }
	      var objIsObj = objTag == objectTag,
	          othIsObj = othTag == objectTag,
	          isSameTag = objTag == othTag;

	      if (isSameTag && !(objIsArr || objIsObj)) {
	        return equalByTag(object, other, objTag);
	      }
	      if (!isLoose) {
	        var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	            othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

	        if (objIsWrapped || othIsWrapped) {
	          return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
	        }
	      }
	      if (!isSameTag) {
	        return false;
	      }
	      // Assume cyclic values are equal.
	      // For more information on detecting circular references see https://es5.github.io/#JO.
	      stackA || (stackA = []);
	      stackB || (stackB = []);

	      var length = stackA.length;
	      while (length--) {
	        if (stackA[length] == object) {
	          return stackB[length] == other;
	        }
	      }
	      // Add `object` and `other` to the stack of traversed objects.
	      stackA.push(object);
	      stackB.push(other);

	      var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

	      stackA.pop();
	      stackB.pop();

	      return result;
	    }

	    /**
	     * The base implementation of `_.isMatch` without support for callback
	     * shorthands and `this` binding.
	     *
	     * @private
	     * @param {Object} object The object to inspect.
	     * @param {Array} matchData The propery names, values, and compare flags to match.
	     * @param {Function} [customizer] The function to customize comparing objects.
	     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	     */
	    function baseIsMatch(object, matchData, customizer) {
	      var index = matchData.length,
	          length = index,
	          noCustomizer = !customizer;

	      if (object == null) {
	        return !length;
	      }
	      object = toObject(object);
	      while (index--) {
	        var data = matchData[index];
	        if ((noCustomizer && data[2])
	              ? data[1] !== object[data[0]]
	              : !(data[0] in object)
	            ) {
	          return false;
	        }
	      }
	      while (++index < length) {
	        data = matchData[index];
	        var key = data[0],
	            objValue = object[key],
	            srcValue = data[1];

	        if (noCustomizer && data[2]) {
	          if (objValue === undefined && !(key in object)) {
	            return false;
	          }
	        } else {
	          var result = customizer ? customizer(objValue, srcValue, key) : undefined;
	          if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
	            return false;
	          }
	        }
	      }
	      return true;
	    }

	    /**
	     * The base implementation of `_.map` without support for callback shorthands
	     * and `this` binding.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {Array} Returns the new mapped array.
	     */
	    function baseMap(collection, iteratee) {
	      var index = -1,
	          result = isArrayLike(collection) ? Array(collection.length) : [];

	      baseEach(collection, function(value, key, collection) {
	        result[++index] = iteratee(value, key, collection);
	      });
	      return result;
	    }

	    /**
	     * The base implementation of `_.matches` which does not clone `source`.
	     *
	     * @private
	     * @param {Object} source The object of property values to match.
	     * @returns {Function} Returns the new function.
	     */
	    function baseMatches(source) {
	      var matchData = getMatchData(source);
	      if (matchData.length == 1 && matchData[0][2]) {
	        var key = matchData[0][0],
	            value = matchData[0][1];

	        return function(object) {
	          if (object == null) {
	            return false;
	          }
	          return object[key] === value && (value !== undefined || (key in toObject(object)));
	        };
	      }
	      return function(object) {
	        return baseIsMatch(object, matchData);
	      };
	    }

	    /**
	     * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
	     *
	     * @private
	     * @param {string} path The path of the property to get.
	     * @param {*} srcValue The value to compare.
	     * @returns {Function} Returns the new function.
	     */
	    function baseMatchesProperty(path, srcValue) {
	      var isArr = isArray(path),
	          isCommon = isKey(path) && isStrictComparable(srcValue),
	          pathKey = (path + '');

	      path = toPath(path);
	      return function(object) {
	        if (object == null) {
	          return false;
	        }
	        var key = pathKey;
	        object = toObject(object);
	        if ((isArr || !isCommon) && !(key in object)) {
	          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
	          if (object == null) {
	            return false;
	          }
	          key = last(path);
	          object = toObject(object);
	        }
	        return object[key] === srcValue
	          ? (srcValue !== undefined || (key in object))
	          : baseIsEqual(srcValue, object[key], undefined, true);
	      };
	    }

	    /**
	     * The base implementation of `_.merge` without support for argument juggling,
	     * multiple sources, and `this` binding `customizer` functions.
	     *
	     * @private
	     * @param {Object} object The destination object.
	     * @param {Object} source The source object.
	     * @param {Function} [customizer] The function to customize merged values.
	     * @param {Array} [stackA=[]] Tracks traversed source objects.
	     * @param {Array} [stackB=[]] Associates values with source counterparts.
	     * @returns {Object} Returns `object`.
	     */
	    function baseMerge(object, source, customizer, stackA, stackB) {
	      if (!isObject(object)) {
	        return object;
	      }
	      var isSrcArr = isArrayLike(source) && (isArray(source) || isTypedArray(source)),
	          props = isSrcArr ? undefined : keys(source);

	      arrayEach(props || source, function(srcValue, key) {
	        if (props) {
	          key = srcValue;
	          srcValue = source[key];
	        }
	        if (isObjectLike(srcValue)) {
	          stackA || (stackA = []);
	          stackB || (stackB = []);
	          baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
	        }
	        else {
	          var value = object[key],
	              result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
	              isCommon = result === undefined;

	          if (isCommon) {
	            result = srcValue;
	          }
	          if ((result !== undefined || (isSrcArr && !(key in object))) &&
	              (isCommon || (result === result ? (result !== value) : (value === value)))) {
	            object[key] = result;
	          }
	        }
	      });
	      return object;
	    }

	    /**
	     * A specialized version of `baseMerge` for arrays and objects which performs
	     * deep merges and tracks traversed objects enabling objects with circular
	     * references to be merged.
	     *
	     * @private
	     * @param {Object} object The destination object.
	     * @param {Object} source The source object.
	     * @param {string} key The key of the value to merge.
	     * @param {Function} mergeFunc The function to merge values.
	     * @param {Function} [customizer] The function to customize merged values.
	     * @param {Array} [stackA=[]] Tracks traversed source objects.
	     * @param {Array} [stackB=[]] Associates values with source counterparts.
	     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	     */
	    function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
	      var length = stackA.length,
	          srcValue = source[key];

	      while (length--) {
	        if (stackA[length] == srcValue) {
	          object[key] = stackB[length];
	          return;
	        }
	      }
	      var value = object[key],
	          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
	          isCommon = result === undefined;

	      if (isCommon) {
	        result = srcValue;
	        if (isArrayLike(srcValue) && (isArray(srcValue) || isTypedArray(srcValue))) {
	          result = isArray(value)
	            ? value
	            : (isArrayLike(value) ? arrayCopy(value) : []);
	        }
	        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
	          result = isArguments(value)
	            ? toPlainObject(value)
	            : (isPlainObject(value) ? value : {});
	        }
	        else {
	          isCommon = false;
	        }
	      }
	      // Add the source value to the stack of traversed objects and associate
	      // it with its merged value.
	      stackA.push(srcValue);
	      stackB.push(result);

	      if (isCommon) {
	        // Recursively merge objects and arrays (susceptible to call stack limits).
	        object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
	      } else if (result === result ? (result !== value) : (value === value)) {
	        object[key] = result;
	      }
	    }

	    /**
	     * The base implementation of `_.property` without support for deep paths.
	     *
	     * @private
	     * @param {string} key The key of the property to get.
	     * @returns {Function} Returns the new function.
	     */
	    function baseProperty(key) {
	      return function(object) {
	        return object == null ? undefined : object[key];
	      };
	    }

	    /**
	     * A specialized version of `baseProperty` which supports deep paths.
	     *
	     * @private
	     * @param {Array|string} path The path of the property to get.
	     * @returns {Function} Returns the new function.
	     */
	    function basePropertyDeep(path) {
	      var pathKey = (path + '');
	      path = toPath(path);
	      return function(object) {
	        return baseGet(object, path, pathKey);
	      };
	    }

	    /**
	     * The base implementation of `_.pullAt` without support for individual
	     * index arguments and capturing the removed elements.
	     *
	     * @private
	     * @param {Array} array The array to modify.
	     * @param {number[]} indexes The indexes of elements to remove.
	     * @returns {Array} Returns `array`.
	     */
	    function basePullAt(array, indexes) {
	      var length = array ? indexes.length : 0;
	      while (length--) {
	        var index = indexes[length];
	        if (index != previous && isIndex(index)) {
	          var previous = index;
	          splice.call(array, index, 1);
	        }
	      }
	      return array;
	    }

	    /**
	     * The base implementation of `_.random` without support for argument juggling
	     * and returning floating-point numbers.
	     *
	     * @private
	     * @param {number} min The minimum possible value.
	     * @param {number} max The maximum possible value.
	     * @returns {number} Returns the random number.
	     */
	    function baseRandom(min, max) {
	      return min + nativeFloor(nativeRandom() * (max - min + 1));
	    }

	    /**
	     * The base implementation of `_.reduce` and `_.reduceRight` without support
	     * for callback shorthands and `this` binding, which iterates over `collection`
	     * using the provided `eachFunc`.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @param {*} accumulator The initial value.
	     * @param {boolean} initFromCollection Specify using the first or last element
	     *  of `collection` as the initial value.
	     * @param {Function} eachFunc The function to iterate over `collection`.
	     * @returns {*} Returns the accumulated value.
	     */
	    function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
	      eachFunc(collection, function(value, index, collection) {
	        accumulator = initFromCollection
	          ? (initFromCollection = false, value)
	          : iteratee(accumulator, value, index, collection);
	      });
	      return accumulator;
	    }

	    /**
	     * The base implementation of `setData` without support for hot loop detection.
	     *
	     * @private
	     * @param {Function} func The function to associate metadata with.
	     * @param {*} data The metadata.
	     * @returns {Function} Returns `func`.
	     */
	    var baseSetData = !metaMap ? identity : function(func, data) {
	      metaMap.set(func, data);
	      return func;
	    };

	    /**
	     * The base implementation of `_.slice` without an iteratee call guard.
	     *
	     * @private
	     * @param {Array} array The array to slice.
	     * @param {number} [start=0] The start position.
	     * @param {number} [end=array.length] The end position.
	     * @returns {Array} Returns the slice of `array`.
	     */
	    function baseSlice(array, start, end) {
	      var index = -1,
	          length = array.length;

	      start = start == null ? 0 : (+start || 0);
	      if (start < 0) {
	        start = -start > length ? 0 : (length + start);
	      }
	      end = (end === undefined || end > length) ? length : (+end || 0);
	      if (end < 0) {
	        end += length;
	      }
	      length = start > end ? 0 : ((end - start) >>> 0);
	      start >>>= 0;

	      var result = Array(length);
	      while (++index < length) {
	        result[index] = array[index + start];
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `_.some` without support for callback shorthands
	     * and `this` binding.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} predicate The function invoked per iteration.
	     * @returns {boolean} Returns `true` if any element passes the predicate check,
	     *  else `false`.
	     */
	    function baseSome(collection, predicate) {
	      var result;

	      baseEach(collection, function(value, index, collection) {
	        result = predicate(value, index, collection);
	        return !result;
	      });
	      return !!result;
	    }

	    /**
	     * The base implementation of `_.sortBy` which uses `comparer` to define
	     * the sort order of `array` and replaces criteria objects with their
	     * corresponding values.
	     *
	     * @private
	     * @param {Array} array The array to sort.
	     * @param {Function} comparer The function to define sort order.
	     * @returns {Array} Returns `array`.
	     */
	    function baseSortBy(array, comparer) {
	      var length = array.length;

	      array.sort(comparer);
	      while (length--) {
	        array[length] = array[length].value;
	      }
	      return array;
	    }

	    /**
	     * The base implementation of `_.sortByOrder` without param guards.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
	     * @param {boolean[]} orders The sort orders of `iteratees`.
	     * @returns {Array} Returns the new sorted array.
	     */
	    function baseSortByOrder(collection, iteratees, orders) {
	      var callback = getCallback(),
	          index = -1;

	      iteratees = arrayMap(iteratees, function(iteratee) { return callback(iteratee); });

	      var result = baseMap(collection, function(value) {
	        var criteria = arrayMap(iteratees, function(iteratee) { return iteratee(value); });
	        return { 'criteria': criteria, 'index': ++index, 'value': value };
	      });

	      return baseSortBy(result, function(object, other) {
	        return compareMultiple(object, other, orders);
	      });
	    }

	    /**
	     * The base implementation of `_.sum` without support for callback shorthands
	     * and `this` binding.
	     *
	     * @private
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @returns {number} Returns the sum.
	     */
	    function baseSum(collection, iteratee) {
	      var result = 0;
	      baseEach(collection, function(value, index, collection) {
	        result += +iteratee(value, index, collection) || 0;
	      });
	      return result;
	    }

	    /**
	     * The base implementation of `_.uniq` without support for callback shorthands
	     * and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to inspect.
	     * @param {Function} [iteratee] The function invoked per iteration.
	     * @returns {Array} Returns the new duplicate-value-free array.
	     */
	    function baseUniq(array, iteratee) {
	      var index = -1,
	          indexOf = getIndexOf(),
	          length = array.length,
	          isCommon = indexOf == baseIndexOf,
	          isLarge = isCommon && length >= LARGE_ARRAY_SIZE,
	          seen = isLarge ? createCache() : null,
	          result = [];

	      if (seen) {
	        indexOf = cacheIndexOf;
	        isCommon = false;
	      } else {
	        isLarge = false;
	        seen = iteratee ? [] : result;
	      }
	      outer:
	      while (++index < length) {
	        var value = array[index],
	            computed = iteratee ? iteratee(value, index, array) : value;

	        if (isCommon && value === value) {
	          var seenIndex = seen.length;
	          while (seenIndex--) {
	            if (seen[seenIndex] === computed) {
	              continue outer;
	            }
	          }
	          if (iteratee) {
	            seen.push(computed);
	          }
	          result.push(value);
	        }
	        else if (indexOf(seen, computed, 0) < 0) {
	          if (iteratee || isLarge) {
	            seen.push(computed);
	          }
	          result.push(value);
	        }
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `_.values` and `_.valuesIn` which creates an
	     * array of `object` property values corresponding to the property names
	     * of `props`.
	     *
	     * @private
	     * @param {Object} object The object to query.
	     * @param {Array} props The property names to get values for.
	     * @returns {Object} Returns the array of property values.
	     */
	    function baseValues(object, props) {
	      var index = -1,
	          length = props.length,
	          result = Array(length);

	      while (++index < length) {
	        result[index] = object[props[index]];
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `_.dropRightWhile`, `_.dropWhile`, `_.takeRightWhile`,
	     * and `_.takeWhile` without support for callback shorthands and `this` binding.
	     *
	     * @private
	     * @param {Array} array The array to query.
	     * @param {Function} predicate The function invoked per iteration.
	     * @param {boolean} [isDrop] Specify dropping elements instead of taking them.
	     * @param {boolean} [fromRight] Specify iterating from right to left.
	     * @returns {Array} Returns the slice of `array`.
	     */
	    function baseWhile(array, predicate, isDrop, fromRight) {
	      var length = array.length,
	          index = fromRight ? length : -1;

	      while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {}
	      return isDrop
	        ? baseSlice(array, (fromRight ? 0 : index), (fromRight ? index + 1 : length))
	        : baseSlice(array, (fromRight ? index + 1 : 0), (fromRight ? length : index));
	    }

	    /**
	     * The base implementation of `wrapperValue` which returns the result of
	     * performing a sequence of actions on the unwrapped `value`, where each
	     * successive action is supplied the return value of the previous.
	     *
	     * @private
	     * @param {*} value The unwrapped value.
	     * @param {Array} actions Actions to peform to resolve the unwrapped value.
	     * @returns {*} Returns the resolved value.
	     */
	    function baseWrapperValue(value, actions) {
	      var result = value;
	      if (result instanceof LazyWrapper) {
	        result = result.value();
	      }
	      var index = -1,
	          length = actions.length;

	      while (++index < length) {
	        var action = actions[index];
	        result = action.func.apply(action.thisArg, arrayPush([result], action.args));
	      }
	      return result;
	    }

	    /**
	     * Performs a binary search of `array` to determine the index at which `value`
	     * should be inserted into `array` in order to maintain its sort order.
	     *
	     * @private
	     * @param {Array} array The sorted array to inspect.
	     * @param {*} value The value to evaluate.
	     * @param {boolean} [retHighest] Specify returning the highest qualified index.
	     * @returns {number} Returns the index at which `value` should be inserted
	     *  into `array`.
	     */
	    function binaryIndex(array, value, retHighest) {
	      var low = 0,
	          high = array ? array.length : low;

	      if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
	        while (low < high) {
	          var mid = (low + high) >>> 1,
	              computed = array[mid];

	          if ((retHighest ? (computed <= value) : (computed < value)) && computed !== null) {
	            low = mid + 1;
	          } else {
	            high = mid;
	          }
	        }
	        return high;
	      }
	      return binaryIndexBy(array, value, identity, retHighest);
	    }

	    /**
	     * This function is like `binaryIndex` except that it invokes `iteratee` for
	     * `value` and each element of `array` to compute their sort ranking. The
	     * iteratee is invoked with one argument; (value).
	     *
	     * @private
	     * @param {Array} array The sorted array to inspect.
	     * @param {*} value The value to evaluate.
	     * @param {Function} iteratee The function invoked per iteration.
	     * @param {boolean} [retHighest] Specify returning the highest qualified index.
	     * @returns {number} Returns the index at which `value` should be inserted
	     *  into `array`.
	     */
	    function binaryIndexBy(array, value, iteratee, retHighest) {
	      value = iteratee(value);

	      var low = 0,
	          high = array ? array.length : 0,
	          valIsNaN = value !== value,
	          valIsNull = value === null,
	          valIsUndef = value === undefined;

	      while (low < high) {
	        var mid = nativeFloor((low + high) / 2),
	            computed = iteratee(array[mid]),
	            isDef = computed !== undefined,
	            isReflexive = computed === computed;

	        if (valIsNaN) {
	          var setLow = isReflexive || retHighest;
	        } else if (valIsNull) {
	          setLow = isReflexive && isDef && (retHighest || computed != null);
	        } else if (valIsUndef) {
	          setLow = isReflexive && (retHighest || isDef);
	        } else if (computed == null) {
	          setLow = false;
	        } else {
	          setLow = retHighest ? (computed <= value) : (computed < value);
	        }
	        if (setLow) {
	          low = mid + 1;
	        } else {
	          high = mid;
	        }
	      }
	      return nativeMin(high, MAX_ARRAY_INDEX);
	    }

	    /**
	     * A specialized version of `baseCallback` which only supports `this` binding
	     * and specifying the number of arguments to provide to `func`.
	     *
	     * @private
	     * @param {Function} func The function to bind.
	     * @param {*} thisArg The `this` binding of `func`.
	     * @param {number} [argCount] The number of arguments to provide to `func`.
	     * @returns {Function} Returns the callback.
	     */
	    function bindCallback(func, thisArg, argCount) {
	      if (typeof func != 'function') {
	        return identity;
	      }
	      if (thisArg === undefined) {
	        return func;
	      }
	      switch (argCount) {
	        case 1: return function(value) {
	          return func.call(thisArg, value);
	        };
	        case 3: return function(value, index, collection) {
	          return func.call(thisArg, value, index, collection);
	        };
	        case 4: return function(accumulator, value, index, collection) {
	          return func.call(thisArg, accumulator, value, index, collection);
	        };
	        case 5: return function(value, other, key, object, source) {
	          return func.call(thisArg, value, other, key, object, source);
	        };
	      }
	      return function() {
	        return func.apply(thisArg, arguments);
	      };
	    }

	    /**
	     * Creates a clone of the given array buffer.
	     *
	     * @private
	     * @param {ArrayBuffer} buffer The array buffer to clone.
	     * @returns {ArrayBuffer} Returns the cloned array buffer.
	     */
	    function bufferClone(buffer) {
	      var result = new ArrayBuffer(buffer.byteLength),
	          view = new Uint8Array(result);

	      view.set(new Uint8Array(buffer));
	      return result;
	    }

	    /**
	     * Creates an array that is the composition of partially applied arguments,
	     * placeholders, and provided arguments into a single array of arguments.
	     *
	     * @private
	     * @param {Array|Object} args The provided arguments.
	     * @param {Array} partials The arguments to prepend to those provided.
	     * @param {Array} holders The `partials` placeholder indexes.
	     * @returns {Array} Returns the new array of composed arguments.
	     */
	    function composeArgs(args, partials, holders) {
	      var holdersLength = holders.length,
	          argsIndex = -1,
	          argsLength = nativeMax(args.length - holdersLength, 0),
	          leftIndex = -1,
	          leftLength = partials.length,
	          result = Array(leftLength + argsLength);

	      while (++leftIndex < leftLength) {
	        result[leftIndex] = partials[leftIndex];
	      }
	      while (++argsIndex < holdersLength) {
	        result[holders[argsIndex]] = args[argsIndex];
	      }
	      while (argsLength--) {
	        result[leftIndex++] = args[argsIndex++];
	      }
	      return result;
	    }

	    /**
	     * This function is like `composeArgs` except that the arguments composition
	     * is tailored for `_.partialRight`.
	     *
	     * @private
	     * @param {Array|Object} args The provided arguments.
	     * @param {Array} partials The arguments to append to those provided.
	     * @param {Array} holders The `partials` placeholder indexes.
	     * @returns {Array} Returns the new array of composed arguments.
	     */
	    function composeArgsRight(args, partials, holders) {
	      var holdersIndex = -1,
	          holdersLength = holders.length,
	          argsIndex = -1,
	          argsLength = nativeMax(args.length - holdersLength, 0),
	          rightIndex = -1,
	          rightLength = partials.length,
	          result = Array(argsLength + rightLength);

	      while (++argsIndex < argsLength) {
	        result[argsIndex] = args[argsIndex];
	      }
	      var offset = argsIndex;
	      while (++rightIndex < rightLength) {
	        result[offset + rightIndex] = partials[rightIndex];
	      }
	      while (++holdersIndex < holdersLength) {
	        result[offset + holders[holdersIndex]] = args[argsIndex++];
	      }
	      return result;
	    }

	    /**
	     * Creates a `_.countBy`, `_.groupBy`, `_.indexBy`, or `_.partition` function.
	     *
	     * @private
	     * @param {Function} setter The function to set keys and values of the accumulator object.
	     * @param {Function} [initializer] The function to initialize the accumulator object.
	     * @returns {Function} Returns the new aggregator function.
	     */
	    function createAggregator(setter, initializer) {
	      return function(collection, iteratee, thisArg) {
	        var result = initializer ? initializer() : {};
	        iteratee = getCallback(iteratee, thisArg, 3);

	        if (isArray(collection)) {
	          var index = -1,
	              length = collection.length;

	          while (++index < length) {
	            var value = collection[index];
	            setter(result, value, iteratee(value, index, collection), collection);
	          }
	        } else {
	          baseEach(collection, function(value, key, collection) {
	            setter(result, value, iteratee(value, key, collection), collection);
	          });
	        }
	        return result;
	      };
	    }

	    /**
	     * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
	     *
	     * @private
	     * @param {Function} assigner The function to assign values.
	     * @returns {Function} Returns the new assigner function.
	     */
	    function createAssigner(assigner) {
	      return restParam(function(object, sources) {
	        var index = -1,
	            length = object == null ? 0 : sources.length,
	            customizer = length > 2 ? sources[length - 2] : undefined,
	            guard = length > 2 ? sources[2] : undefined,
	            thisArg = length > 1 ? sources[length - 1] : undefined;

	        if (typeof customizer == 'function') {
	          customizer = bindCallback(customizer, thisArg, 5);
	          length -= 2;
	        } else {
	          customizer = typeof thisArg == 'function' ? thisArg : undefined;
	          length -= (customizer ? 1 : 0);
	        }
	        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
	          customizer = length < 3 ? undefined : customizer;
	          length = 1;
	        }
	        while (++index < length) {
	          var source = sources[index];
	          if (source) {
	            assigner(object, source, customizer);
	          }
	        }
	        return object;
	      });
	    }

	    /**
	     * Creates a `baseEach` or `baseEachRight` function.
	     *
	     * @private
	     * @param {Function} eachFunc The function to iterate over a collection.
	     * @param {boolean} [fromRight] Specify iterating from right to left.
	     * @returns {Function} Returns the new base function.
	     */
	    function createBaseEach(eachFunc, fromRight) {
	      return function(collection, iteratee) {
	        var length = collection ? getLength(collection) : 0;
	        if (!isLength(length)) {
	          return eachFunc(collection, iteratee);
	        }
	        var index = fromRight ? length : -1,
	            iterable = toObject(collection);

	        while ((fromRight ? index-- : ++index < length)) {
	          if (iteratee(iterable[index], index, iterable) === false) {
	            break;
	          }
	        }
	        return collection;
	      };
	    }

	    /**
	     * Creates a base function for `_.forIn` or `_.forInRight`.
	     *
	     * @private
	     * @param {boolean} [fromRight] Specify iterating from right to left.
	     * @returns {Function} Returns the new base function.
	     */
	    function createBaseFor(fromRight) {
	      return function(object, iteratee, keysFunc) {
	        var iterable = toObject(object),
	            props = keysFunc(object),
	            length = props.length,
	            index = fromRight ? length : -1;

	        while ((fromRight ? index-- : ++index < length)) {
	          var key = props[index];
	          if (iteratee(iterable[key], key, iterable) === false) {
	            break;
	          }
	        }
	        return object;
	      };
	    }

	    /**
	     * Creates a function that wraps `func` and invokes it with the `this`
	     * binding of `thisArg`.
	     *
	     * @private
	     * @param {Function} func The function to bind.
	     * @param {*} [thisArg] The `this` binding of `func`.
	     * @returns {Function} Returns the new bound function.
	     */
	    function createBindWrapper(func, thisArg) {
	      var Ctor = createCtorWrapper(func);

	      function wrapper() {
	        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
	        return fn.apply(thisArg, arguments);
	      }
	      return wrapper;
	    }

	    /**
	     * Creates a `Set` cache object to optimize linear searches of large arrays.
	     *
	     * @private
	     * @param {Array} [values] The values to cache.
	     * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
	     */
	    function createCache(values) {
	      return (nativeCreate && Set) ? new SetCache(values) : null;
	    }

	    /**
	     * Creates a function that produces compound words out of the words in a
	     * given string.
	     *
	     * @private
	     * @param {Function} callback The function to combine each word.
	     * @returns {Function} Returns the new compounder function.
	     */
	    function createCompounder(callback) {
	      return function(string) {
	        var index = -1,
	            array = words(deburr(string)),
	            length = array.length,
	            result = '';

	        while (++index < length) {
	          result = callback(result, array[index], index);
	        }
	        return result;
	      };
	    }

	    /**
	     * Creates a function that produces an instance of `Ctor` regardless of
	     * whether it was invoked as part of a `new` expression or by `call` or `apply`.
	     *
	     * @private
	     * @param {Function} Ctor The constructor to wrap.
	     * @returns {Function} Returns the new wrapped function.
	     */
	    function createCtorWrapper(Ctor) {
	      return function() {
	        // Use a `switch` statement to work with class constructors.
	        // See http://ecma-international.org/ecma-262/6.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
	        // for more details.
	        var args = arguments;
	        switch (args.length) {
	          case 0: return new Ctor;
	          case 1: return new Ctor(args[0]);
	          case 2: return new Ctor(args[0], args[1]);
	          case 3: return new Ctor(args[0], args[1], args[2]);
	          case 4: return new Ctor(args[0], args[1], args[2], args[3]);
	          case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
	          case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
	          case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
	        }
	        var thisBinding = baseCreate(Ctor.prototype),
	            result = Ctor.apply(thisBinding, args);

	        // Mimic the constructor's `return` behavior.
	        // See https://es5.github.io/#x13.2.2 for more details.
	        return isObject(result) ? result : thisBinding;
	      };
	    }

	    /**
	     * Creates a `_.curry` or `_.curryRight` function.
	     *
	     * @private
	     * @param {boolean} flag The curry bit flag.
	     * @returns {Function} Returns the new curry function.
	     */
	    function createCurry(flag) {
	      function curryFunc(func, arity, guard) {
	        if (guard && isIterateeCall(func, arity, guard)) {
	          arity = undefined;
	        }
	        var result = createWrapper(func, flag, undefined, undefined, undefined, undefined, undefined, arity);
	        result.placeholder = curryFunc.placeholder;
	        return result;
	      }
	      return curryFunc;
	    }

	    /**
	     * Creates a `_.defaults` or `_.defaultsDeep` function.
	     *
	     * @private
	     * @param {Function} assigner The function to assign values.
	     * @param {Function} customizer The function to customize assigned values.
	     * @returns {Function} Returns the new defaults function.
	     */
	    function createDefaults(assigner, customizer) {
	      return restParam(function(args) {
	        var object = args[0];
	        if (object == null) {
	          return object;
	        }
	        args.push(customizer);
	        return assigner.apply(undefined, args);
	      });
	    }

	    /**
	     * Creates a `_.max` or `_.min` function.
	     *
	     * @private
	     * @param {Function} comparator The function used to compare values.
	     * @param {*} exValue The initial extremum value.
	     * @returns {Function} Returns the new extremum function.
	     */
	    function createExtremum(comparator, exValue) {
	      return function(collection, iteratee, thisArg) {
	        if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
	          iteratee = undefined;
	        }
	        iteratee = getCallback(iteratee, thisArg, 3);
	        if (iteratee.length == 1) {
	          collection = isArray(collection) ? collection : toIterable(collection);
	          var result = arrayExtremum(collection, iteratee, comparator, exValue);
	          if (!(collection.length && result === exValue)) {
	            return result;
	          }
	        }
	        return baseExtremum(collection, iteratee, comparator, exValue);
	      };
	    }

	    /**
	     * Creates a `_.find` or `_.findLast` function.
	     *
	     * @private
	     * @param {Function} eachFunc The function to iterate over a collection.
	     * @param {boolean} [fromRight] Specify iterating from right to left.
	     * @returns {Function} Returns the new find function.
	     */
	    function createFind(eachFunc, fromRight) {
	      return function(collection, predicate, thisArg) {
	        predicate = getCallback(predicate, thisArg, 3);
	        if (isArray(collection)) {
	          var index = baseFindIndex(collection, predicate, fromRight);
	          return index > -1 ? collection[index] : undefined;
	        }
	        return baseFind(collection, predicate, eachFunc);
	      };
	    }

	    /**
	     * Creates a `_.findIndex` or `_.findLastIndex` function.
	     *
	     * @private
	     * @param {boolean} [fromRight] Specify iterating from right to left.
	     * @returns {Function} Returns the new find function.
	     */
	    function createFindIndex(fromRight) {
	      return function(array, predicate, thisArg) {
	        if (!(array && array.length)) {
	          return -1;
	        }
	        predicate = getCallback(predicate, thisArg, 3);
	        return baseFindIndex(array, predicate, fromRight);
	      };
	    }

	    /**
	     * Creates a `_.findKey` or `_.findLastKey` function.
	     *
	     * @private
	     * @param {Function} objectFunc The function to iterate over an object.
	     * @returns {Function} Returns the new find function.
	     */
	    function createFindKey(objectFunc) {
	      return function(object, predicate, thisArg) {
	        predicate = getCallback(predicate, thisArg, 3);
	        return baseFind(object, predicate, objectFunc, true);
	      };
	    }

	    /**
	     * Creates a `_.flow` or `_.flowRight` function.
	     *
	     * @private
	     * @param {boolean} [fromRight] Specify iterating from right to left.
	     * @returns {Function} Returns the new flow function.
	     */
	    function createFlow(fromRight) {
	      return function() {
	        var wrapper,
	            length = arguments.length,
	            index = fromRight ? length : -1,
	            leftIndex = 0,
	            funcs = Array(length);

	        while ((fromRight ? index-- : ++index < length)) {
	          var func = funcs[leftIndex++] = arguments[index];
	          if (typeof func != 'function') {
	            throw new TypeError(FUNC_ERROR_TEXT);
	          }
	          if (!wrapper && LodashWrapper.prototype.thru && getFuncName(func) == 'wrapper') {
	            wrapper = new LodashWrapper([], true);
	          }
	        }
	        index = wrapper ? -1 : length;
	        while (++index < length) {
	          func = funcs[index];

	          var funcName = getFuncName(func),
	              data = funcName == 'wrapper' ? getData(func) : undefined;

	          if (data && isLaziable(data[0]) && data[1] == (ARY_FLAG | CURRY_FLAG | PARTIAL_FLAG | REARG_FLAG) && !data[4].length && data[9] == 1) {
	            wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
	          } else {
	            wrapper = (func.length == 1 && isLaziable(func)) ? wrapper[funcName]() : wrapper.thru(func);
	          }
	        }
	        return function() {
	          var args = arguments,
	              value = args[0];

	          if (wrapper && args.length == 1 && isArray(value) && value.length >= LARGE_ARRAY_SIZE) {
	            return wrapper.plant(value).value();
	          }
	          var index = 0,
	              result = length ? funcs[index].apply(this, args) : value;

	          while (++index < length) {
	            result = funcs[index].call(this, result);
	          }
	          return result;
	        };
	      };
	    }

	    /**
	     * Creates a function for `_.forEach` or `_.forEachRight`.
	     *
	     * @private
	     * @param {Function} arrayFunc The function to iterate over an array.
	     * @param {Function} eachFunc The function to iterate over a collection.
	     * @returns {Function} Returns the new each function.
	     */
	    function createForEach(arrayFunc, eachFunc) {
	      return function(collection, iteratee, thisArg) {
	        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
	          ? arrayFunc(collection, iteratee)
	          : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
	      };
	    }

	    /**
	     * Creates a function for `_.forIn` or `_.forInRight`.
	     *
	     * @private
	     * @param {Function} objectFunc The function to iterate over an object.
	     * @returns {Function} Returns the new each function.
	     */
	    function createForIn(objectFunc) {
	      return function(object, iteratee, thisArg) {
	        if (typeof iteratee != 'function' || thisArg !== undefined) {
	          iteratee = bindCallback(iteratee, thisArg, 3);
	        }
	        return objectFunc(object, iteratee, keysIn);
	      };
	    }

	    /**
	     * Creates a function for `_.forOwn` or `_.forOwnRight`.
	     *
	     * @private
	     * @param {Function} objectFunc The function to iterate over an object.
	     * @returns {Function} Returns the new each function.
	     */
	    function createForOwn(objectFunc) {
	      return function(object, iteratee, thisArg) {
	        if (typeof iteratee != 'function' || thisArg !== undefined) {
	          iteratee = bindCallback(iteratee, thisArg, 3);
	        }
	        return objectFunc(object, iteratee);
	      };
	    }

	    /**
	     * Creates a function for `_.mapKeys` or `_.mapValues`.
	     *
	     * @private
	     * @param {boolean} [isMapKeys] Specify mapping keys instead of values.
	     * @returns {Function} Returns the new map function.
	     */
	    function createObjectMapper(isMapKeys) {
	      return function(object, iteratee, thisArg) {
	        var result = {};
	        iteratee = getCallback(iteratee, thisArg, 3);

	        baseForOwn(object, function(value, key, object) {
	          var mapped = iteratee(value, key, object);
	          key = isMapKeys ? mapped : key;
	          value = isMapKeys ? value : mapped;
	          result[key] = value;
	        });
	        return result;
	      };
	    }

	    /**
	     * Creates a function for `_.padLeft` or `_.padRight`.
	     *
	     * @private
	     * @param {boolean} [fromRight] Specify padding from the right.
	     * @returns {Function} Returns the new pad function.
	     */
	    function createPadDir(fromRight) {
	      return function(string, length, chars) {
	        string = baseToString(string);
	        return (fromRight ? string : '') + createPadding(string, length, chars) + (fromRight ? '' : string);
	      };
	    }

	    /**
	     * Creates a `_.partial` or `_.partialRight` function.
	     *
	     * @private
	     * @param {boolean} flag The partial bit flag.
	     * @returns {Function} Returns the new partial function.
	     */
	    function createPartial(flag) {
	      var partialFunc = restParam(function(func, partials) {
	        var holders = replaceHolders(partials, partialFunc.placeholder);
	        return createWrapper(func, flag, undefined, partials, holders);
	      });
	      return partialFunc;
	    }

	    /**
	     * Creates a function for `_.reduce` or `_.reduceRight`.
	     *
	     * @private
	     * @param {Function} arrayFunc The function to iterate over an array.
	     * @param {Function} eachFunc The function to iterate over a collection.
	     * @returns {Function} Returns the new each function.
	     */
	    function createReduce(arrayFunc, eachFunc) {
	      return function(collection, iteratee, accumulator, thisArg) {
	        var initFromArray = arguments.length < 3;
	        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
	          ? arrayFunc(collection, iteratee, accumulator, initFromArray)
	          : baseReduce(collection, getCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
	      };
	    }

	    /**
	     * Creates a function that wraps `func` and invokes it with optional `this`
	     * binding of, partial application, and currying.
	     *
	     * @private
	     * @param {Function|string} func The function or method name to reference.
	     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
	     * @param {*} [thisArg] The `this` binding of `func`.
	     * @param {Array} [partials] The arguments to prepend to those provided to the new function.
	     * @param {Array} [holders] The `partials` placeholder indexes.
	     * @param {Array} [partialsRight] The arguments to append to those provided to the new function.
	     * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
	     * @param {Array} [argPos] The argument positions of the new function.
	     * @param {number} [ary] The arity cap of `func`.
	     * @param {number} [arity] The arity of `func`.
	     * @returns {Function} Returns the new wrapped function.
	     */
	    function createHybridWrapper(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
	      var isAry = bitmask & ARY_FLAG,
	          isBind = bitmask & BIND_FLAG,
	          isBindKey = bitmask & BIND_KEY_FLAG,
	          isCurry = bitmask & CURRY_FLAG,
	          isCurryBound = bitmask & CURRY_BOUND_FLAG,
	          isCurryRight = bitmask & CURRY_RIGHT_FLAG,
	          Ctor = isBindKey ? undefined : createCtorWrapper(func);

	      function wrapper() {
	        // Avoid `arguments` object use disqualifying optimizations by
	        // converting it to an array before providing it to other functions.
	        var length = arguments.length,
	            index = length,
	            args = Array(length);

	        while (index--) {
	          args[index] = arguments[index];
	        }
	        if (partials) {
	          args = composeArgs(args, partials, holders);
	        }
	        if (partialsRight) {
	          args = composeArgsRight(args, partialsRight, holdersRight);
	        }
	        if (isCurry || isCurryRight) {
	          var placeholder = wrapper.placeholder,
	              argsHolders = replaceHolders(args, placeholder);

	          length -= argsHolders.length;
	          if (length < arity) {
	            var newArgPos = argPos ? arrayCopy(argPos) : undefined,
	                newArity = nativeMax(arity - length, 0),
	                newsHolders = isCurry ? argsHolders : undefined,
	                newHoldersRight = isCurry ? undefined : argsHolders,
	                newPartials = isCurry ? args : undefined,
	                newPartialsRight = isCurry ? undefined : args;

	            bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);
	            bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);

	            if (!isCurryBound) {
	              bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);
	            }
	            var newData = [func, bitmask, thisArg, newPartials, newsHolders, newPartialsRight, newHoldersRight, newArgPos, ary, newArity],
	                result = createHybridWrapper.apply(undefined, newData);

	            if (isLaziable(func)) {
	              setData(result, newData);
	            }
	            result.placeholder = placeholder;
	            return result;
	          }
	        }
	        var thisBinding = isBind ? thisArg : this,
	            fn = isBindKey ? thisBinding[func] : func;

	        if (argPos) {
	          args = reorder(args, argPos);
	        }
	        if (isAry && ary < args.length) {
	          args.length = ary;
	        }
	        if (this && this !== root && this instanceof wrapper) {
	          fn = Ctor || createCtorWrapper(func);
	        }
	        return fn.apply(thisBinding, args);
	      }
	      return wrapper;
	    }

	    /**
	     * Creates the padding required for `string` based on the given `length`.
	     * The `chars` string is truncated if the number of characters exceeds `length`.
	     *
	     * @private
	     * @param {string} string The string to create padding for.
	     * @param {number} [length=0] The padding length.
	     * @param {string} [chars=' '] The string used as padding.
	     * @returns {string} Returns the pad for `string`.
	     */
	    function createPadding(string, length, chars) {
	      var strLength = string.length;
	      length = +length;

	      if (strLength >= length || !nativeIsFinite(length)) {
	        return '';
	      }
	      var padLength = length - strLength;
	      chars = chars == null ? ' ' : (chars + '');
	      return repeat(chars, nativeCeil(padLength / chars.length)).slice(0, padLength);
	    }

	    /**
	     * Creates a function that wraps `func` and invokes it with the optional `this`
	     * binding of `thisArg` and the `partials` prepended to those provided to
	     * the wrapper.
	     *
	     * @private
	     * @param {Function} func The function to partially apply arguments to.
	     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
	     * @param {*} thisArg The `this` binding of `func`.
	     * @param {Array} partials The arguments to prepend to those provided to the new function.
	     * @returns {Function} Returns the new bound function.
	     */
	    function createPartialWrapper(func, bitmask, thisArg, partials) {
	      var isBind = bitmask & BIND_FLAG,
	          Ctor = createCtorWrapper(func);

	      function wrapper() {
	        // Avoid `arguments` object use disqualifying optimizations by
	        // converting it to an array before providing it `func`.
	        var argsIndex = -1,
	            argsLength = arguments.length,
	            leftIndex = -1,
	            leftLength = partials.length,
	            args = Array(leftLength + argsLength);

	        while (++leftIndex < leftLength) {
	          args[leftIndex] = partials[leftIndex];
	        }
	        while (argsLength--) {
	          args[leftIndex++] = arguments[++argsIndex];
	        }
	        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
	        return fn.apply(isBind ? thisArg : this, args);
	      }
	      return wrapper;
	    }

	    /**
	     * Creates a `_.ceil`, `_.floor`, or `_.round` function.
	     *
	     * @private
	     * @param {string} methodName The name of the `Math` method to use when rounding.
	     * @returns {Function} Returns the new round function.
	     */
	    function createRound(methodName) {
	      var func = Math[methodName];
	      return function(number, precision) {
	        precision = precision === undefined ? 0 : (+precision || 0);
	        if (precision) {
	          precision = pow(10, precision);
	          return func(number * precision) / precision;
	        }
	        return func(number);
	      };
	    }

	    /**
	     * Creates a `_.sortedIndex` or `_.sortedLastIndex` function.
	     *
	     * @private
	     * @param {boolean} [retHighest] Specify returning the highest qualified index.
	     * @returns {Function} Returns the new index function.
	     */
	    function createSortedIndex(retHighest) {
	      return function(array, value, iteratee, thisArg) {
	        var callback = getCallback(iteratee);
	        return (iteratee == null && callback === baseCallback)
	          ? binaryIndex(array, value, retHighest)
	          : binaryIndexBy(array, value, callback(iteratee, thisArg, 1), retHighest);
	      };
	    }

	    /**
	     * Creates a function that either curries or invokes `func` with optional
	     * `this` binding and partially applied arguments.
	     *
	     * @private
	     * @param {Function|string} func The function or method name to reference.
	     * @param {number} bitmask The bitmask of flags.
	     *  The bitmask may be composed of the following flags:
	     *     1 - `_.bind`
	     *     2 - `_.bindKey`
	     *     4 - `_.curry` or `_.curryRight` of a bound function
	     *     8 - `_.curry`
	     *    16 - `_.curryRight`
	     *    32 - `_.partial`
	     *    64 - `_.partialRight`
	     *   128 - `_.rearg`
	     *   256 - `_.ary`
	     * @param {*} [thisArg] The `this` binding of `func`.
	     * @param {Array} [partials] The arguments to be partially applied.
	     * @param {Array} [holders] The `partials` placeholder indexes.
	     * @param {Array} [argPos] The argument positions of the new function.
	     * @param {number} [ary] The arity cap of `func`.
	     * @param {number} [arity] The arity of `func`.
	     * @returns {Function} Returns the new wrapped function.
	     */
	    function createWrapper(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
	      var isBindKey = bitmask & BIND_KEY_FLAG;
	      if (!isBindKey && typeof func != 'function') {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      var length = partials ? partials.length : 0;
	      if (!length) {
	        bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);
	        partials = holders = undefined;
	      }
	      length -= (holders ? holders.length : 0);
	      if (bitmask & PARTIAL_RIGHT_FLAG) {
	        var partialsRight = partials,
	            holdersRight = holders;

	        partials = holders = undefined;
	      }
	      var data = isBindKey ? undefined : getData(func),
	          newData = [func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity];

	      if (data) {
	        mergeData(newData, data);
	        bitmask = newData[1];
	        arity = newData[9];
	      }
	      newData[9] = arity == null
	        ? (isBindKey ? 0 : func.length)
	        : (nativeMax(arity - length, 0) || 0);

	      if (bitmask == BIND_FLAG) {
	        var result = createBindWrapper(newData[0], newData[2]);
	      } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !newData[4].length) {
	        result = createPartialWrapper.apply(undefined, newData);
	      } else {
	        result = createHybridWrapper.apply(undefined, newData);
	      }
	      var setter = data ? baseSetData : setData;
	      return setter(result, newData);
	    }

	    /**
	     * A specialized version of `baseIsEqualDeep` for arrays with support for
	     * partial deep comparisons.
	     *
	     * @private
	     * @param {Array} array The array to compare.
	     * @param {Array} other The other array to compare.
	     * @param {Function} equalFunc The function to determine equivalents of values.
	     * @param {Function} [customizer] The function to customize comparing arrays.
	     * @param {boolean} [isLoose] Specify performing partial comparisons.
	     * @param {Array} [stackA] Tracks traversed `value` objects.
	     * @param {Array} [stackB] Tracks traversed `other` objects.
	     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	     */
	    function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
	      var index = -1,
	          arrLength = array.length,
	          othLength = other.length;

	      if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
	        return false;
	      }
	      // Ignore non-index properties.
	      while (++index < arrLength) {
	        var arrValue = array[index],
	            othValue = other[index],
	            result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

	        if (result !== undefined) {
	          if (result) {
	            continue;
	          }
	          return false;
	        }
	        // Recursively compare arrays (susceptible to call stack limits).
	        if (isLoose) {
	          if (!arraySome(other, function(othValue) {
	                return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
	              })) {
	            return false;
	          }
	        } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
	          return false;
	        }
	      }
	      return true;
	    }

	    /**
	     * A specialized version of `baseIsEqualDeep` for comparing objects of
	     * the same `toStringTag`.
	     *
	     * **Note:** This function only supports comparing values with tags of
	     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	     *
	     * @private
	     * @param {Object} object The object to compare.
	     * @param {Object} other The other object to compare.
	     * @param {string} tag The `toStringTag` of the objects to compare.
	     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	     */
	    function equalByTag(object, other, tag) {
	      switch (tag) {
	        case boolTag:
	        case dateTag:
	          // Coerce dates and booleans to numbers, dates to milliseconds and booleans
	          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
	          return +object == +other;

	        case errorTag:
	          return object.name == other.name && object.message == other.message;

	        case numberTag:
	          // Treat `NaN` vs. `NaN` as equal.
	          return (object != +object)
	            ? other != +other
	            : object == +other;

	        case regexpTag:
	        case stringTag:
	          // Coerce regexes to strings and treat strings primitives and string
	          // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
	          return object == (other + '');
	      }
	      return false;
	    }

	    /**
	     * A specialized version of `baseIsEqualDeep` for objects with support for
	     * partial deep comparisons.
	     *
	     * @private
	     * @param {Object} object The object to compare.
	     * @param {Object} other The other object to compare.
	     * @param {Function} equalFunc The function to determine equivalents of values.
	     * @param {Function} [customizer] The function to customize comparing values.
	     * @param {boolean} [isLoose] Specify performing partial comparisons.
	     * @param {Array} [stackA] Tracks traversed `value` objects.
	     * @param {Array} [stackB] Tracks traversed `other` objects.
	     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	     */
	    function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
	      var objProps = keys(object),
	          objLength = objProps.length,
	          othProps = keys(other),
	          othLength = othProps.length;

	      if (objLength != othLength && !isLoose) {
	        return false;
	      }
	      var index = objLength;
	      while (index--) {
	        var key = objProps[index];
	        if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
	          return false;
	        }
	      }
	      var skipCtor = isLoose;
	      while (++index < objLength) {
	        key = objProps[index];
	        var objValue = object[key],
	            othValue = other[key],
	            result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

	        // Recursively compare objects (susceptible to call stack limits).
	        if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
	          return false;
	        }
	        skipCtor || (skipCtor = key == 'constructor');
	      }
	      if (!skipCtor) {
	        var objCtor = object.constructor,
	            othCtor = other.constructor;

	        // Non `Object` object instances with different constructors are not equal.
	        if (objCtor != othCtor &&
	            ('constructor' in object && 'constructor' in other) &&
	            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	          return false;
	        }
	      }
	      return true;
	    }

	    /**
	     * Gets the appropriate "callback" function. If the `_.callback` method is
	     * customized this function returns the custom method, otherwise it returns
	     * the `baseCallback` function. If arguments are provided the chosen function
	     * is invoked with them and its result is returned.
	     *
	     * @private
	     * @returns {Function} Returns the chosen function or its result.
	     */
	    function getCallback(func, thisArg, argCount) {
	      var result = lodash.callback || callback;
	      result = result === callback ? baseCallback : result;
	      return argCount ? result(func, thisArg, argCount) : result;
	    }

	    /**
	     * Gets metadata for `func`.
	     *
	     * @private
	     * @param {Function} func The function to query.
	     * @returns {*} Returns the metadata for `func`.
	     */
	    var getData = !metaMap ? noop : function(func) {
	      return metaMap.get(func);
	    };

	    /**
	     * Gets the name of `func`.
	     *
	     * @private
	     * @param {Function} func The function to query.
	     * @returns {string} Returns the function name.
	     */
	    function getFuncName(func) {
	      var result = func.name,
	          array = realNames[result],
	          length = array ? array.length : 0;

	      while (length--) {
	        var data = array[length],
	            otherFunc = data.func;
	        if (otherFunc == null || otherFunc == func) {
	          return data.name;
	        }
	      }
	      return result;
	    }

	    /**
	     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
	     * customized this function returns the custom method, otherwise it returns
	     * the `baseIndexOf` function. If arguments are provided the chosen function
	     * is invoked with them and its result is returned.
	     *
	     * @private
	     * @returns {Function|number} Returns the chosen function or its result.
	     */
	    function getIndexOf(collection, target, fromIndex) {
	      var result = lodash.indexOf || indexOf;
	      result = result === indexOf ? baseIndexOf : result;
	      return collection ? result(collection, target, fromIndex) : result;
	    }

	    /**
	     * Gets the "length" property value of `object`.
	     *
	     * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
	     * that affects Safari on at least iOS 8.1-8.3 ARM64.
	     *
	     * @private
	     * @param {Object} object The object to query.
	     * @returns {*} Returns the "length" value.
	     */
	    var getLength = baseProperty('length');

	    /**
	     * Gets the propery names, values, and compare flags of `object`.
	     *
	     * @private
	     * @param {Object} object The object to query.
	     * @returns {Array} Returns the match data of `object`.
	     */
	    function getMatchData(object) {
	      var result = pairs(object),
	          length = result.length;

	      while (length--) {
	        result[length][2] = isStrictComparable(result[length][1]);
	      }
	      return result;
	    }

	    /**
	     * Gets the native function at `key` of `object`.
	     *
	     * @private
	     * @param {Object} object The object to query.
	     * @param {string} key The key of the method to get.
	     * @returns {*} Returns the function if it's native, else `undefined`.
	     */
	    function getNative(object, key) {
	      var value = object == null ? undefined : object[key];
	      return isNative(value) ? value : undefined;
	    }

	    /**
	     * Gets the view, applying any `transforms` to the `start` and `end` positions.
	     *
	     * @private
	     * @param {number} start The start of the view.
	     * @param {number} end The end of the view.
	     * @param {Array} transforms The transformations to apply to the view.
	     * @returns {Object} Returns an object containing the `start` and `end`
	     *  positions of the view.
	     */
	    function getView(start, end, transforms) {
	      var index = -1,
	          length = transforms.length;

	      while (++index < length) {
	        var data = transforms[index],
	            size = data.size;

	        switch (data.type) {
	          case 'drop':      start += size; break;
	          case 'dropRight': end -= size; break;
	          case 'take':      end = nativeMin(end, start + size); break;
	          case 'takeRight': start = nativeMax(start, end - size); break;
	        }
	      }
	      return { 'start': start, 'end': end };
	    }

	    /**
	     * Initializes an array clone.
	     *
	     * @private
	     * @param {Array} array The array to clone.
	     * @returns {Array} Returns the initialized clone.
	     */
	    function initCloneArray(array) {
	      var length = array.length,
	          result = new array.constructor(length);

	      // Add array properties assigned by `RegExp#exec`.
	      if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
	        result.index = array.index;
	        result.input = array.input;
	      }
	      return result;
	    }

	    /**
	     * Initializes an object clone.
	     *
	     * @private
	     * @param {Object} object The object to clone.
	     * @returns {Object} Returns the initialized clone.
	     */
	    function initCloneObject(object) {
	      var Ctor = object.constructor;
	      if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
	        Ctor = Object;
	      }
	      return new Ctor;
	    }

	    /**
	     * Initializes an object clone based on its `toStringTag`.
	     *
	     * **Note:** This function only supports cloning values with tags of
	     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	     *
	     * @private
	     * @param {Object} object The object to clone.
	     * @param {string} tag The `toStringTag` of the object to clone.
	     * @param {boolean} [isDeep] Specify a deep clone.
	     * @returns {Object} Returns the initialized clone.
	     */
	    function initCloneByTag(object, tag, isDeep) {
	      var Ctor = object.constructor;
	      switch (tag) {
	        case arrayBufferTag:
	          return bufferClone(object);

	        case boolTag:
	        case dateTag:
	          return new Ctor(+object);

	        case float32Tag: case float64Tag:
	        case int8Tag: case int16Tag: case int32Tag:
	        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
	          var buffer = object.buffer;
	          return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

	        case numberTag:
	        case stringTag:
	          return new Ctor(object);

	        case regexpTag:
	          var result = new Ctor(object.source, reFlags.exec(object));
	          result.lastIndex = object.lastIndex;
	      }
	      return result;
	    }

	    /**
	     * Invokes the method at `path` on `object`.
	     *
	     * @private
	     * @param {Object} object The object to query.
	     * @param {Array|string} path The path of the method to invoke.
	     * @param {Array} args The arguments to invoke the method with.
	     * @returns {*} Returns the result of the invoked method.
	     */
	    function invokePath(object, path, args) {
	      if (object != null && !isKey(path, object)) {
	        path = toPath(path);
	        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
	        path = last(path);
	      }
	      var func = object == null ? object : object[path];
	      return func == null ? undefined : func.apply(object, args);
	    }

	    /**
	     * Checks if `value` is array-like.
	     *
	     * @private
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	     */
	    function isArrayLike(value) {
	      return value != null && isLength(getLength(value));
	    }

	    /**
	     * Checks if `value` is a valid array-like index.
	     *
	     * @private
	     * @param {*} value The value to check.
	     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	     */
	    function isIndex(value, length) {
	      value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
	      length = length == null ? MAX_SAFE_INTEGER : length;
	      return value > -1 && value % 1 == 0 && value < length;
	    }

	    /**
	     * Checks if the provided arguments are from an iteratee call.
	     *
	     * @private
	     * @param {*} value The potential iteratee value argument.
	     * @param {*} index The potential iteratee index or key argument.
	     * @param {*} object The potential iteratee object argument.
	     * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
	     */
	    function isIterateeCall(value, index, object) {
	      if (!isObject(object)) {
	        return false;
	      }
	      var type = typeof index;
	      if (type == 'number'
	          ? (isArrayLike(object) && isIndex(index, object.length))
	          : (type == 'string' && index in object)) {
	        var other = object[index];
	        return value === value ? (value === other) : (other !== other);
	      }
	      return false;
	    }

	    /**
	     * Checks if `value` is a property name and not a property path.
	     *
	     * @private
	     * @param {*} value The value to check.
	     * @param {Object} [object] The object to query keys on.
	     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	     */
	    function isKey(value, object) {
	      var type = typeof value;
	      if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
	        return true;
	      }
	      if (isArray(value)) {
	        return false;
	      }
	      var result = !reIsDeepProp.test(value);
	      return result || (object != null && value in toObject(object));
	    }

	    /**
	     * Checks if `func` has a lazy counterpart.
	     *
	     * @private
	     * @param {Function} func The function to check.
	     * @returns {boolean} Returns `true` if `func` has a lazy counterpart, else `false`.
	     */
	    function isLaziable(func) {
	      var funcName = getFuncName(func);
	      if (!(funcName in LazyWrapper.prototype)) {
	        return false;
	      }
	      var other = lodash[funcName];
	      if (func === other) {
	        return true;
	      }
	      var data = getData(other);
	      return !!data && func === data[0];
	    }

	    /**
	     * Checks if `value` is a valid array-like length.
	     *
	     * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
	     *
	     * @private
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	     */
	    function isLength(value) {
	      return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	    }

	    /**
	     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
	     *
	     * @private
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` if suitable for strict
	     *  equality comparisons, else `false`.
	     */
	    function isStrictComparable(value) {
	      return value === value && !isObject(value);
	    }

	    /**
	     * Merges the function metadata of `source` into `data`.
	     *
	     * Merging metadata reduces the number of wrappers required to invoke a function.
	     * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
	     * may be applied regardless of execution order. Methods like `_.ary` and `_.rearg`
	     * augment function arguments, making the order in which they are executed important,
	     * preventing the merging of metadata. However, we make an exception for a safe
	     * common case where curried functions have `_.ary` and or `_.rearg` applied.
	     *
	     * @private
	     * @param {Array} data The destination metadata.
	     * @param {Array} source The source metadata.
	     * @returns {Array} Returns `data`.
	     */
	    function mergeData(data, source) {
	      var bitmask = data[1],
	          srcBitmask = source[1],
	          newBitmask = bitmask | srcBitmask,
	          isCommon = newBitmask < ARY_FLAG;

	      var isCombo =
	        (srcBitmask == ARY_FLAG && bitmask == CURRY_FLAG) ||
	        (srcBitmask == ARY_FLAG && bitmask == REARG_FLAG && data[7].length <= source[8]) ||
	        (srcBitmask == (ARY_FLAG | REARG_FLAG) && bitmask == CURRY_FLAG);

	      // Exit early if metadata can't be merged.
	      if (!(isCommon || isCombo)) {
	        return data;
	      }
	      // Use source `thisArg` if available.
	      if (srcBitmask & BIND_FLAG) {
	        data[2] = source[2];
	        // Set when currying a bound function.
	        newBitmask |= (bitmask & BIND_FLAG) ? 0 : CURRY_BOUND_FLAG;
	      }
	      // Compose partial arguments.
	      var value = source[3];
	      if (value) {
	        var partials = data[3];
	        data[3] = partials ? composeArgs(partials, value, source[4]) : arrayCopy(value);
	        data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : arrayCopy(source[4]);
	      }
	      // Compose partial right arguments.
	      value = source[5];
	      if (value) {
	        partials = data[5];
	        data[5] = partials ? composeArgsRight(partials, value, source[6]) : arrayCopy(value);
	        data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : arrayCopy(source[6]);
	      }
	      // Use source `argPos` if available.
	      value = source[7];
	      if (value) {
	        data[7] = arrayCopy(value);
	      }
	      // Use source `ary` if it's smaller.
	      if (srcBitmask & ARY_FLAG) {
	        data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
	      }
	      // Use source `arity` if one is not provided.
	      if (data[9] == null) {
	        data[9] = source[9];
	      }
	      // Use source `func` and merge bitmasks.
	      data[0] = source[0];
	      data[1] = newBitmask;

	      return data;
	    }

	    /**
	     * Used by `_.defaultsDeep` to customize its `_.merge` use.
	     *
	     * @private
	     * @param {*} objectValue The destination object property value.
	     * @param {*} sourceValue The source object property value.
	     * @returns {*} Returns the value to assign to the destination object.
	     */
	    function mergeDefaults(objectValue, sourceValue) {
	      return objectValue === undefined ? sourceValue : merge(objectValue, sourceValue, mergeDefaults);
	    }

	    /**
	     * A specialized version of `_.pick` which picks `object` properties specified
	     * by `props`.
	     *
	     * @private
	     * @param {Object} object The source object.
	     * @param {string[]} props The property names to pick.
	     * @returns {Object} Returns the new object.
	     */
	    function pickByArray(object, props) {
	      object = toObject(object);

	      var index = -1,
	          length = props.length,
	          result = {};

	      while (++index < length) {
	        var key = props[index];
	        if (key in object) {
	          result[key] = object[key];
	        }
	      }
	      return result;
	    }

	    /**
	     * A specialized version of `_.pick` which picks `object` properties `predicate`
	     * returns truthy for.
	     *
	     * @private
	     * @param {Object} object The source object.
	     * @param {Function} predicate The function invoked per iteration.
	     * @returns {Object} Returns the new object.
	     */
	    function pickByCallback(object, predicate) {
	      var result = {};
	      baseForIn(object, function(value, key, object) {
	        if (predicate(value, key, object)) {
	          result[key] = value;
	        }
	      });
	      return result;
	    }

	    /**
	     * Reorder `array` according to the specified indexes where the element at
	     * the first index is assigned as the first element, the element at
	     * the second index is assigned as the second element, and so on.
	     *
	     * @private
	     * @param {Array} array The array to reorder.
	     * @param {Array} indexes The arranged array indexes.
	     * @returns {Array} Returns `array`.
	     */
	    function reorder(array, indexes) {
	      var arrLength = array.length,
	          length = nativeMin(indexes.length, arrLength),
	          oldArray = arrayCopy(array);

	      while (length--) {
	        var index = indexes[length];
	        array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
	      }
	      return array;
	    }

	    /**
	     * Sets metadata for `func`.
	     *
	     * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
	     * period of time, it will trip its breaker and transition to an identity function
	     * to avoid garbage collection pauses in V8. See [V8 issue 2070](https://code.google.com/p/v8/issues/detail?id=2070)
	     * for more details.
	     *
	     * @private
	     * @param {Function} func The function to associate metadata with.
	     * @param {*} data The metadata.
	     * @returns {Function} Returns `func`.
	     */
	    var setData = (function() {
	      var count = 0,
	          lastCalled = 0;

	      return function(key, value) {
	        var stamp = now(),
	            remaining = HOT_SPAN - (stamp - lastCalled);

	        lastCalled = stamp;
	        if (remaining > 0) {
	          if (++count >= HOT_COUNT) {
	            return key;
	          }
	        } else {
	          count = 0;
	        }
	        return baseSetData(key, value);
	      };
	    }());

	    /**
	     * A fallback implementation of `Object.keys` which creates an array of the
	     * own enumerable property names of `object`.
	     *
	     * @private
	     * @param {Object} object The object to query.
	     * @returns {Array} Returns the array of property names.
	     */
	    function shimKeys(object) {
	      var props = keysIn(object),
	          propsLength = props.length,
	          length = propsLength && object.length;

	      var allowIndexes = !!length && isLength(length) &&
	        (isArray(object) || isArguments(object));

	      var index = -1,
	          result = [];

	      while (++index < propsLength) {
	        var key = props[index];
	        if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
	          result.push(key);
	        }
	      }
	      return result;
	    }

	    /**
	     * Converts `value` to an array-like object if it's not one.
	     *
	     * @private
	     * @param {*} value The value to process.
	     * @returns {Array|Object} Returns the array-like object.
	     */
	    function toIterable(value) {
	      if (value == null) {
	        return [];
	      }
	      if (!isArrayLike(value)) {
	        return values(value);
	      }
	      return isObject(value) ? value : Object(value);
	    }

	    /**
	     * Converts `value` to an object if it's not one.
	     *
	     * @private
	     * @param {*} value The value to process.
	     * @returns {Object} Returns the object.
	     */
	    function toObject(value) {
	      return isObject(value) ? value : Object(value);
	    }

	    /**
	     * Converts `value` to property path array if it's not one.
	     *
	     * @private
	     * @param {*} value The value to process.
	     * @returns {Array} Returns the property path array.
	     */
	    function toPath(value) {
	      if (isArray(value)) {
	        return value;
	      }
	      var result = [];
	      baseToString(value).replace(rePropName, function(match, number, quote, string) {
	        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
	      });
	      return result;
	    }

	    /**
	     * Creates a clone of `wrapper`.
	     *
	     * @private
	     * @param {Object} wrapper The wrapper to clone.
	     * @returns {Object} Returns the cloned wrapper.
	     */
	    function wrapperClone(wrapper) {
	      return wrapper instanceof LazyWrapper
	        ? wrapper.clone()
	        : new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__, arrayCopy(wrapper.__actions__));
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Creates an array of elements split into groups the length of `size`.
	     * If `collection` can't be split evenly, the final chunk will be the remaining
	     * elements.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to process.
	     * @param {number} [size=1] The length of each chunk.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Array} Returns the new array containing chunks.
	     * @example
	     *
	     * _.chunk(['a', 'b', 'c', 'd'], 2);
	     * // => [['a', 'b'], ['c', 'd']]
	     *
	     * _.chunk(['a', 'b', 'c', 'd'], 3);
	     * // => [['a', 'b', 'c'], ['d']]
	     */
	    function chunk(array, size, guard) {
	      if (guard ? isIterateeCall(array, size, guard) : size == null) {
	        size = 1;
	      } else {
	        size = nativeMax(nativeFloor(size) || 1, 1);
	      }
	      var index = 0,
	          length = array ? array.length : 0,
	          resIndex = -1,
	          result = Array(nativeCeil(length / size));

	      while (index < length) {
	        result[++resIndex] = baseSlice(array, index, (index += size));
	      }
	      return result;
	    }

	    /**
	     * Creates an array with all falsey values removed. The values `false`, `null`,
	     * `0`, `""`, `undefined`, and `NaN` are falsey.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to compact.
	     * @returns {Array} Returns the new array of filtered values.
	     * @example
	     *
	     * _.compact([0, 1, false, 2, '', 3]);
	     * // => [1, 2, 3]
	     */
	    function compact(array) {
	      var index = -1,
	          length = array ? array.length : 0,
	          resIndex = -1,
	          result = [];

	      while (++index < length) {
	        var value = array[index];
	        if (value) {
	          result[++resIndex] = value;
	        }
	      }
	      return result;
	    }

	    /**
	     * Creates an array of unique `array` values not included in the other
	     * provided arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	     * for equality comparisons.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to inspect.
	     * @param {...Array} [values] The arrays of values to exclude.
	     * @returns {Array} Returns the new array of filtered values.
	     * @example
	     *
	     * _.difference([1, 2, 3], [4, 2]);
	     * // => [1, 3]
	     */
	    var difference = restParam(function(array, values) {
	      return (isObjectLike(array) && isArrayLike(array))
	        ? baseDifference(array, baseFlatten(values, false, true))
	        : [];
	    });

	    /**
	     * Creates a slice of `array` with `n` elements dropped from the beginning.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @param {number} [n=1] The number of elements to drop.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.drop([1, 2, 3]);
	     * // => [2, 3]
	     *
	     * _.drop([1, 2, 3], 2);
	     * // => [3]
	     *
	     * _.drop([1, 2, 3], 5);
	     * // => []
	     *
	     * _.drop([1, 2, 3], 0);
	     * // => [1, 2, 3]
	     */
	    function drop(array, n, guard) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return [];
	      }
	      if (guard ? isIterateeCall(array, n, guard) : n == null) {
	        n = 1;
	      }
	      return baseSlice(array, n < 0 ? 0 : n);
	    }

	    /**
	     * Creates a slice of `array` with `n` elements dropped from the end.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @param {number} [n=1] The number of elements to drop.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.dropRight([1, 2, 3]);
	     * // => [1, 2]
	     *
	     * _.dropRight([1, 2, 3], 2);
	     * // => [1]
	     *
	     * _.dropRight([1, 2, 3], 5);
	     * // => []
	     *
	     * _.dropRight([1, 2, 3], 0);
	     * // => [1, 2, 3]
	     */
	    function dropRight(array, n, guard) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return [];
	      }
	      if (guard ? isIterateeCall(array, n, guard) : n == null) {
	        n = 1;
	      }
	      n = length - (+n || 0);
	      return baseSlice(array, 0, n < 0 ? 0 : n);
	    }

	    /**
	     * Creates a slice of `array` excluding elements dropped from the end.
	     * Elements are dropped until `predicate` returns falsey. The predicate is
	     * bound to `thisArg` and invoked with three arguments: (value, index, array).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that match the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.dropRightWhile([1, 2, 3], function(n) {
	     *   return n > 1;
	     * });
	     * // => [1]
	     *
	     * var users = [
	     *   { 'user': 'barney',  'active': true },
	     *   { 'user': 'fred',    'active': false },
	     *   { 'user': 'pebbles', 'active': false }
	     * ];
	     *
	     * // using the `_.matches` callback shorthand
	     * _.pluck(_.dropRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
	     * // => ['barney', 'fred']
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.pluck(_.dropRightWhile(users, 'active', false), 'user');
	     * // => ['barney']
	     *
	     * // using the `_.property` callback shorthand
	     * _.pluck(_.dropRightWhile(users, 'active'), 'user');
	     * // => ['barney', 'fred', 'pebbles']
	     */
	    function dropRightWhile(array, predicate, thisArg) {
	      return (array && array.length)
	        ? baseWhile(array, getCallback(predicate, thisArg, 3), true, true)
	        : [];
	    }

	    /**
	     * Creates a slice of `array` excluding elements dropped from the beginning.
	     * Elements are dropped until `predicate` returns falsey. The predicate is
	     * bound to `thisArg` and invoked with three arguments: (value, index, array).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.dropWhile([1, 2, 3], function(n) {
	     *   return n < 3;
	     * });
	     * // => [3]
	     *
	     * var users = [
	     *   { 'user': 'barney',  'active': false },
	     *   { 'user': 'fred',    'active': false },
	     *   { 'user': 'pebbles', 'active': true }
	     * ];
	     *
	     * // using the `_.matches` callback shorthand
	     * _.pluck(_.dropWhile(users, { 'user': 'barney', 'active': false }), 'user');
	     * // => ['fred', 'pebbles']
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.pluck(_.dropWhile(users, 'active', false), 'user');
	     * // => ['pebbles']
	     *
	     * // using the `_.property` callback shorthand
	     * _.pluck(_.dropWhile(users, 'active'), 'user');
	     * // => ['barney', 'fred', 'pebbles']
	     */
	    function dropWhile(array, predicate, thisArg) {
	      return (array && array.length)
	        ? baseWhile(array, getCallback(predicate, thisArg, 3), true)
	        : [];
	    }

	    /**
	     * Fills elements of `array` with `value` from `start` up to, but not
	     * including, `end`.
	     *
	     * **Note:** This method mutates `array`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to fill.
	     * @param {*} value The value to fill `array` with.
	     * @param {number} [start=0] The start position.
	     * @param {number} [end=array.length] The end position.
	     * @returns {Array} Returns `array`.
	     * @example
	     *
	     * var array = [1, 2, 3];
	     *
	     * _.fill(array, 'a');
	     * console.log(array);
	     * // => ['a', 'a', 'a']
	     *
	     * _.fill(Array(3), 2);
	     * // => [2, 2, 2]
	     *
	     * _.fill([4, 6, 8], '*', 1, 2);
	     * // => [4, '*', 8]
	     */
	    function fill(array, value, start, end) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return [];
	      }
	      if (start && typeof start != 'number' && isIterateeCall(array, value, start)) {
	        start = 0;
	        end = length;
	      }
	      return baseFill(array, value, start, end);
	    }

	    /**
	     * This method is like `_.find` except that it returns the index of the first
	     * element `predicate` returns truthy for instead of the element itself.
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to search.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {number} Returns the index of the found element, else `-1`.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney',  'active': false },
	     *   { 'user': 'fred',    'active': false },
	     *   { 'user': 'pebbles', 'active': true }
	     * ];
	     *
	     * _.findIndex(users, function(chr) {
	     *   return chr.user == 'barney';
	     * });
	     * // => 0
	     *
	     * // using the `_.matches` callback shorthand
	     * _.findIndex(users, { 'user': 'fred', 'active': false });
	     * // => 1
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.findIndex(users, 'active', false);
	     * // => 0
	     *
	     * // using the `_.property` callback shorthand
	     * _.findIndex(users, 'active');
	     * // => 2
	     */
	    var findIndex = createFindIndex();

	    /**
	     * This method is like `_.findIndex` except that it iterates over elements
	     * of `collection` from right to left.
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to search.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {number} Returns the index of the found element, else `-1`.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney',  'active': true },
	     *   { 'user': 'fred',    'active': false },
	     *   { 'user': 'pebbles', 'active': false }
	     * ];
	     *
	     * _.findLastIndex(users, function(chr) {
	     *   return chr.user == 'pebbles';
	     * });
	     * // => 2
	     *
	     * // using the `_.matches` callback shorthand
	     * _.findLastIndex(users, { 'user': 'barney', 'active': true });
	     * // => 0
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.findLastIndex(users, 'active', false);
	     * // => 2
	     *
	     * // using the `_.property` callback shorthand
	     * _.findLastIndex(users, 'active');
	     * // => 0
	     */
	    var findLastIndex = createFindIndex(true);

	    /**
	     * Gets the first element of `array`.
	     *
	     * @static
	     * @memberOf _
	     * @alias head
	     * @category Array
	     * @param {Array} array The array to query.
	     * @returns {*} Returns the first element of `array`.
	     * @example
	     *
	     * _.first([1, 2, 3]);
	     * // => 1
	     *
	     * _.first([]);
	     * // => undefined
	     */
	    function first(array) {
	      return array ? array[0] : undefined;
	    }

	    /**
	     * Flattens a nested array. If `isDeep` is `true` the array is recursively
	     * flattened, otherwise it is only flattened a single level.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to flatten.
	     * @param {boolean} [isDeep] Specify a deep flatten.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Array} Returns the new flattened array.
	     * @example
	     *
	     * _.flatten([1, [2, 3, [4]]]);
	     * // => [1, 2, 3, [4]]
	     *
	     * // using `isDeep`
	     * _.flatten([1, [2, 3, [4]]], true);
	     * // => [1, 2, 3, 4]
	     */
	    function flatten(array, isDeep, guard) {
	      var length = array ? array.length : 0;
	      if (guard && isIterateeCall(array, isDeep, guard)) {
	        isDeep = false;
	      }
	      return length ? baseFlatten(array, isDeep) : [];
	    }

	    /**
	     * Recursively flattens a nested array.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to recursively flatten.
	     * @returns {Array} Returns the new flattened array.
	     * @example
	     *
	     * _.flattenDeep([1, [2, 3, [4]]]);
	     * // => [1, 2, 3, 4]
	     */
	    function flattenDeep(array) {
	      var length = array ? array.length : 0;
	      return length ? baseFlatten(array, true) : [];
	    }

	    /**
	     * Gets the index at which the first occurrence of `value` is found in `array`
	     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	     * for equality comparisons. If `fromIndex` is negative, it is used as the offset
	     * from the end of `array`. If `array` is sorted providing `true` for `fromIndex`
	     * performs a faster binary search.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to search.
	     * @param {*} value The value to search for.
	     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
	     *  to perform a binary search on a sorted array.
	     * @returns {number} Returns the index of the matched value, else `-1`.
	     * @example
	     *
	     * _.indexOf([1, 2, 1, 2], 2);
	     * // => 1
	     *
	     * // using `fromIndex`
	     * _.indexOf([1, 2, 1, 2], 2, 2);
	     * // => 3
	     *
	     * // performing a binary search
	     * _.indexOf([1, 1, 2, 2], 2, true);
	     * // => 2
	     */
	    function indexOf(array, value, fromIndex) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return -1;
	      }
	      if (typeof fromIndex == 'number') {
	        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : fromIndex;
	      } else if (fromIndex) {
	        var index = binaryIndex(array, value);
	        if (index < length &&
	            (value === value ? (value === array[index]) : (array[index] !== array[index]))) {
	          return index;
	        }
	        return -1;
	      }
	      return baseIndexOf(array, value, fromIndex || 0);
	    }

	    /**
	     * Gets all but the last element of `array`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.initial([1, 2, 3]);
	     * // => [1, 2]
	     */
	    function initial(array) {
	      return dropRight(array, 1);
	    }

	    /**
	     * Creates an array of unique values that are included in all of the provided
	     * arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	     * for equality comparisons.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {...Array} [arrays] The arrays to inspect.
	     * @returns {Array} Returns the new array of shared values.
	     * @example
	     * _.intersection([1, 2], [4, 2], [2, 1]);
	     * // => [2]
	     */
	    var intersection = restParam(function(arrays) {
	      var othLength = arrays.length,
	          othIndex = othLength,
	          caches = Array(length),
	          indexOf = getIndexOf(),
	          isCommon = indexOf == baseIndexOf,
	          result = [];

	      while (othIndex--) {
	        var value = arrays[othIndex] = isArrayLike(value = arrays[othIndex]) ? value : [];
	        caches[othIndex] = (isCommon && value.length >= 120) ? createCache(othIndex && value) : null;
	      }
	      var array = arrays[0],
	          index = -1,
	          length = array ? array.length : 0,
	          seen = caches[0];

	      outer:
	      while (++index < length) {
	        value = array[index];
	        if ((seen ? cacheIndexOf(seen, value) : indexOf(result, value, 0)) < 0) {
	          var othIndex = othLength;
	          while (--othIndex) {
	            var cache = caches[othIndex];
	            if ((cache ? cacheIndexOf(cache, value) : indexOf(arrays[othIndex], value, 0)) < 0) {
	              continue outer;
	            }
	          }
	          if (seen) {
	            seen.push(value);
	          }
	          result.push(value);
	        }
	      }
	      return result;
	    });

	    /**
	     * Gets the last element of `array`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @returns {*} Returns the last element of `array`.
	     * @example
	     *
	     * _.last([1, 2, 3]);
	     * // => 3
	     */
	    function last(array) {
	      var length = array ? array.length : 0;
	      return length ? array[length - 1] : undefined;
	    }

	    /**
	     * This method is like `_.indexOf` except that it iterates over elements of
	     * `array` from right to left.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to search.
	     * @param {*} value The value to search for.
	     * @param {boolean|number} [fromIndex=array.length-1] The index to search from
	     *  or `true` to perform a binary search on a sorted array.
	     * @returns {number} Returns the index of the matched value, else `-1`.
	     * @example
	     *
	     * _.lastIndexOf([1, 2, 1, 2], 2);
	     * // => 3
	     *
	     * // using `fromIndex`
	     * _.lastIndexOf([1, 2, 1, 2], 2, 2);
	     * // => 1
	     *
	     * // performing a binary search
	     * _.lastIndexOf([1, 1, 2, 2], 2, true);
	     * // => 3
	     */
	    function lastIndexOf(array, value, fromIndex) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return -1;
	      }
	      var index = length;
	      if (typeof fromIndex == 'number') {
	        index = (fromIndex < 0 ? nativeMax(length + fromIndex, 0) : nativeMin(fromIndex || 0, length - 1)) + 1;
	      } else if (fromIndex) {
	        index = binaryIndex(array, value, true) - 1;
	        var other = array[index];
	        if (value === value ? (value === other) : (other !== other)) {
	          return index;
	        }
	        return -1;
	      }
	      if (value !== value) {
	        return indexOfNaN(array, index, true);
	      }
	      while (index--) {
	        if (array[index] === value) {
	          return index;
	        }
	      }
	      return -1;
	    }

	    /**
	     * Removes all provided values from `array` using
	     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	     * for equality comparisons.
	     *
	     * **Note:** Unlike `_.without`, this method mutates `array`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to modify.
	     * @param {...*} [values] The values to remove.
	     * @returns {Array} Returns `array`.
	     * @example
	     *
	     * var array = [1, 2, 3, 1, 2, 3];
	     *
	     * _.pull(array, 2, 3);
	     * console.log(array);
	     * // => [1, 1]
	     */
	    function pull() {
	      var args = arguments,
	          array = args[0];

	      if (!(array && array.length)) {
	        return array;
	      }
	      var index = 0,
	          indexOf = getIndexOf(),
	          length = args.length;

	      while (++index < length) {
	        var fromIndex = 0,
	            value = args[index];

	        while ((fromIndex = indexOf(array, value, fromIndex)) > -1) {
	          splice.call(array, fromIndex, 1);
	        }
	      }
	      return array;
	    }

	    /**
	     * Removes elements from `array` corresponding to the given indexes and returns
	     * an array of the removed elements. Indexes may be specified as an array of
	     * indexes or as individual arguments.
	     *
	     * **Note:** Unlike `_.at`, this method mutates `array`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to modify.
	     * @param {...(number|number[])} [indexes] The indexes of elements to remove,
	     *  specified as individual indexes or arrays of indexes.
	     * @returns {Array} Returns the new array of removed elements.
	     * @example
	     *
	     * var array = [5, 10, 15, 20];
	     * var evens = _.pullAt(array, 1, 3);
	     *
	     * console.log(array);
	     * // => [5, 15]
	     *
	     * console.log(evens);
	     * // => [10, 20]
	     */
	    var pullAt = restParam(function(array, indexes) {
	      indexes = baseFlatten(indexes);

	      var result = baseAt(array, indexes);
	      basePullAt(array, indexes.sort(baseCompareAscending));
	      return result;
	    });

	    /**
	     * Removes all elements from `array` that `predicate` returns truthy for
	     * and returns an array of the removed elements. The predicate is bound to
	     * `thisArg` and invoked with three arguments: (value, index, array).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * **Note:** Unlike `_.filter`, this method mutates `array`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to modify.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Array} Returns the new array of removed elements.
	     * @example
	     *
	     * var array = [1, 2, 3, 4];
	     * var evens = _.remove(array, function(n) {
	     *   return n % 2 == 0;
	     * });
	     *
	     * console.log(array);
	     * // => [1, 3]
	     *
	     * console.log(evens);
	     * // => [2, 4]
	     */
	    function remove(array, predicate, thisArg) {
	      var result = [];
	      if (!(array && array.length)) {
	        return result;
	      }
	      var index = -1,
	          indexes = [],
	          length = array.length;

	      predicate = getCallback(predicate, thisArg, 3);
	      while (++index < length) {
	        var value = array[index];
	        if (predicate(value, index, array)) {
	          result.push(value);
	          indexes.push(index);
	        }
	      }
	      basePullAt(array, indexes);
	      return result;
	    }

	    /**
	     * Gets all but the first element of `array`.
	     *
	     * @static
	     * @memberOf _
	     * @alias tail
	     * @category Array
	     * @param {Array} array The array to query.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.rest([1, 2, 3]);
	     * // => [2, 3]
	     */
	    function rest(array) {
	      return drop(array, 1);
	    }

	    /**
	     * Creates a slice of `array` from `start` up to, but not including, `end`.
	     *
	     * **Note:** This method is used instead of `Array#slice` to support node
	     * lists in IE < 9 and to ensure dense arrays are returned.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to slice.
	     * @param {number} [start=0] The start position.
	     * @param {number} [end=array.length] The end position.
	     * @returns {Array} Returns the slice of `array`.
	     */
	    function slice(array, start, end) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return [];
	      }
	      if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
	        start = 0;
	        end = length;
	      }
	      return baseSlice(array, start, end);
	    }

	    /**
	     * Uses a binary search to determine the lowest index at which `value` should
	     * be inserted into `array` in order to maintain its sort order. If an iteratee
	     * function is provided it is invoked for `value` and each element of `array`
	     * to compute their sort ranking. The iteratee is bound to `thisArg` and
	     * invoked with one argument; (value).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The sorted array to inspect.
	     * @param {*} value The value to evaluate.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {number} Returns the index at which `value` should be inserted
	     *  into `array`.
	     * @example
	     *
	     * _.sortedIndex([30, 50], 40);
	     * // => 1
	     *
	     * _.sortedIndex([4, 4, 5, 5], 5);
	     * // => 2
	     *
	     * var dict = { 'data': { 'thirty': 30, 'forty': 40, 'fifty': 50 } };
	     *
	     * // using an iteratee function
	     * _.sortedIndex(['thirty', 'fifty'], 'forty', function(word) {
	     *   return this.data[word];
	     * }, dict);
	     * // => 1
	     *
	     * // using the `_.property` callback shorthand
	     * _.sortedIndex([{ 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
	     * // => 1
	     */
	    var sortedIndex = createSortedIndex();

	    /**
	     * This method is like `_.sortedIndex` except that it returns the highest
	     * index at which `value` should be inserted into `array` in order to
	     * maintain its sort order.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The sorted array to inspect.
	     * @param {*} value The value to evaluate.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {number} Returns the index at which `value` should be inserted
	     *  into `array`.
	     * @example
	     *
	     * _.sortedLastIndex([4, 4, 5, 5], 5);
	     * // => 4
	     */
	    var sortedLastIndex = createSortedIndex(true);

	    /**
	     * Creates a slice of `array` with `n` elements taken from the beginning.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @param {number} [n=1] The number of elements to take.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.take([1, 2, 3]);
	     * // => [1]
	     *
	     * _.take([1, 2, 3], 2);
	     * // => [1, 2]
	     *
	     * _.take([1, 2, 3], 5);
	     * // => [1, 2, 3]
	     *
	     * _.take([1, 2, 3], 0);
	     * // => []
	     */
	    function take(array, n, guard) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return [];
	      }
	      if (guard ? isIterateeCall(array, n, guard) : n == null) {
	        n = 1;
	      }
	      return baseSlice(array, 0, n < 0 ? 0 : n);
	    }

	    /**
	     * Creates a slice of `array` with `n` elements taken from the end.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @param {number} [n=1] The number of elements to take.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.takeRight([1, 2, 3]);
	     * // => [3]
	     *
	     * _.takeRight([1, 2, 3], 2);
	     * // => [2, 3]
	     *
	     * _.takeRight([1, 2, 3], 5);
	     * // => [1, 2, 3]
	     *
	     * _.takeRight([1, 2, 3], 0);
	     * // => []
	     */
	    function takeRight(array, n, guard) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return [];
	      }
	      if (guard ? isIterateeCall(array, n, guard) : n == null) {
	        n = 1;
	      }
	      n = length - (+n || 0);
	      return baseSlice(array, n < 0 ? 0 : n);
	    }

	    /**
	     * Creates a slice of `array` with elements taken from the end. Elements are
	     * taken until `predicate` returns falsey. The predicate is bound to `thisArg`
	     * and invoked with three arguments: (value, index, array).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.takeRightWhile([1, 2, 3], function(n) {
	     *   return n > 1;
	     * });
	     * // => [2, 3]
	     *
	     * var users = [
	     *   { 'user': 'barney',  'active': true },
	     *   { 'user': 'fred',    'active': false },
	     *   { 'user': 'pebbles', 'active': false }
	     * ];
	     *
	     * // using the `_.matches` callback shorthand
	     * _.pluck(_.takeRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
	     * // => ['pebbles']
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.pluck(_.takeRightWhile(users, 'active', false), 'user');
	     * // => ['fred', 'pebbles']
	     *
	     * // using the `_.property` callback shorthand
	     * _.pluck(_.takeRightWhile(users, 'active'), 'user');
	     * // => []
	     */
	    function takeRightWhile(array, predicate, thisArg) {
	      return (array && array.length)
	        ? baseWhile(array, getCallback(predicate, thisArg, 3), false, true)
	        : [];
	    }

	    /**
	     * Creates a slice of `array` with elements taken from the beginning. Elements
	     * are taken until `predicate` returns falsey. The predicate is bound to
	     * `thisArg` and invoked with three arguments: (value, index, array).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to query.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Array} Returns the slice of `array`.
	     * @example
	     *
	     * _.takeWhile([1, 2, 3], function(n) {
	     *   return n < 3;
	     * });
	     * // => [1, 2]
	     *
	     * var users = [
	     *   { 'user': 'barney',  'active': false },
	     *   { 'user': 'fred',    'active': false},
	     *   { 'user': 'pebbles', 'active': true }
	     * ];
	     *
	     * // using the `_.matches` callback shorthand
	     * _.pluck(_.takeWhile(users, { 'user': 'barney', 'active': false }), 'user');
	     * // => ['barney']
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.pluck(_.takeWhile(users, 'active', false), 'user');
	     * // => ['barney', 'fred']
	     *
	     * // using the `_.property` callback shorthand
	     * _.pluck(_.takeWhile(users, 'active'), 'user');
	     * // => []
	     */
	    function takeWhile(array, predicate, thisArg) {
	      return (array && array.length)
	        ? baseWhile(array, getCallback(predicate, thisArg, 3))
	        : [];
	    }

	    /**
	     * Creates an array of unique values, in order, from all of the provided arrays
	     * using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	     * for equality comparisons.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {...Array} [arrays] The arrays to inspect.
	     * @returns {Array} Returns the new array of combined values.
	     * @example
	     *
	     * _.union([1, 2], [4, 2], [2, 1]);
	     * // => [1, 2, 4]
	     */
	    var union = restParam(function(arrays) {
	      return baseUniq(baseFlatten(arrays, false, true));
	    });

	    /**
	     * Creates a duplicate-free version of an array, using
	     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	     * for equality comparisons, in which only the first occurence of each element
	     * is kept. Providing `true` for `isSorted` performs a faster search algorithm
	     * for sorted arrays. If an iteratee function is provided it is invoked for
	     * each element in the array to generate the criterion by which uniqueness
	     * is computed. The `iteratee` is bound to `thisArg` and invoked with three
	     * arguments: (value, index, array).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias unique
	     * @category Array
	     * @param {Array} array The array to inspect.
	     * @param {boolean} [isSorted] Specify the array is sorted.
	     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Array} Returns the new duplicate-value-free array.
	     * @example
	     *
	     * _.uniq([2, 1, 2]);
	     * // => [2, 1]
	     *
	     * // using `isSorted`
	     * _.uniq([1, 1, 2], true);
	     * // => [1, 2]
	     *
	     * // using an iteratee function
	     * _.uniq([1, 2.5, 1.5, 2], function(n) {
	     *   return this.floor(n);
	     * }, Math);
	     * // => [1, 2.5]
	     *
	     * // using the `_.property` callback shorthand
	     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
	     * // => [{ 'x': 1 }, { 'x': 2 }]
	     */
	    function uniq(array, isSorted, iteratee, thisArg) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return [];
	      }
	      if (isSorted != null && typeof isSorted != 'boolean') {
	        thisArg = iteratee;
	        iteratee = isIterateeCall(array, isSorted, thisArg) ? undefined : isSorted;
	        isSorted = false;
	      }
	      var callback = getCallback();
	      if (!(iteratee == null && callback === baseCallback)) {
	        iteratee = callback(iteratee, thisArg, 3);
	      }
	      return (isSorted && getIndexOf() == baseIndexOf)
	        ? sortedUniq(array, iteratee)
	        : baseUniq(array, iteratee);
	    }

	    /**
	     * This method is like `_.zip` except that it accepts an array of grouped
	     * elements and creates an array regrouping the elements to their pre-zip
	     * configuration.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array of grouped elements to process.
	     * @returns {Array} Returns the new array of regrouped elements.
	     * @example
	     *
	     * var zipped = _.zip(['fred', 'barney'], [30, 40], [true, false]);
	     * // => [['fred', 30, true], ['barney', 40, false]]
	     *
	     * _.unzip(zipped);
	     * // => [['fred', 'barney'], [30, 40], [true, false]]
	     */
	    function unzip(array) {
	      if (!(array && array.length)) {
	        return [];
	      }
	      var index = -1,
	          length = 0;

	      array = arrayFilter(array, function(group) {
	        if (isArrayLike(group)) {
	          length = nativeMax(group.length, length);
	          return true;
	        }
	      });
	      var result = Array(length);
	      while (++index < length) {
	        result[index] = arrayMap(array, baseProperty(index));
	      }
	      return result;
	    }

	    /**
	     * This method is like `_.unzip` except that it accepts an iteratee to specify
	     * how regrouped values should be combined. The `iteratee` is bound to `thisArg`
	     * and invoked with four arguments: (accumulator, value, index, group).
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array of grouped elements to process.
	     * @param {Function} [iteratee] The function to combine regrouped values.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Array} Returns the new array of regrouped elements.
	     * @example
	     *
	     * var zipped = _.zip([1, 2], [10, 20], [100, 200]);
	     * // => [[1, 10, 100], [2, 20, 200]]
	     *
	     * _.unzipWith(zipped, _.add);
	     * // => [3, 30, 300]
	     */
	    function unzipWith(array, iteratee, thisArg) {
	      var length = array ? array.length : 0;
	      if (!length) {
	        return [];
	      }
	      var result = unzip(array);
	      if (iteratee == null) {
	        return result;
	      }
	      iteratee = bindCallback(iteratee, thisArg, 4);
	      return arrayMap(result, function(group) {
	        return arrayReduce(group, iteratee, undefined, true);
	      });
	    }

	    /**
	     * Creates an array excluding all provided values using
	     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	     * for equality comparisons.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {Array} array The array to filter.
	     * @param {...*} [values] The values to exclude.
	     * @returns {Array} Returns the new array of filtered values.
	     * @example
	     *
	     * _.without([1, 2, 1, 3], 1, 2);
	     * // => [3]
	     */
	    var without = restParam(function(array, values) {
	      return isArrayLike(array)
	        ? baseDifference(array, values)
	        : [];
	    });

	    /**
	     * Creates an array of unique values that is the [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference)
	     * of the provided arrays.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {...Array} [arrays] The arrays to inspect.
	     * @returns {Array} Returns the new array of values.
	     * @example
	     *
	     * _.xor([1, 2], [4, 2]);
	     * // => [1, 4]
	     */
	    function xor() {
	      var index = -1,
	          length = arguments.length;

	      while (++index < length) {
	        var array = arguments[index];
	        if (isArrayLike(array)) {
	          var result = result
	            ? arrayPush(baseDifference(result, array), baseDifference(array, result))
	            : array;
	        }
	      }
	      return result ? baseUniq(result) : [];
	    }

	    /**
	     * Creates an array of grouped elements, the first of which contains the first
	     * elements of the given arrays, the second of which contains the second elements
	     * of the given arrays, and so on.
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {...Array} [arrays] The arrays to process.
	     * @returns {Array} Returns the new array of grouped elements.
	     * @example
	     *
	     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
	     * // => [['fred', 30, true], ['barney', 40, false]]
	     */
	    var zip = restParam(unzip);

	    /**
	     * The inverse of `_.pairs`; this method returns an object composed from arrays
	     * of property names and values. Provide either a single two dimensional array,
	     * e.g. `[[key1, value1], [key2, value2]]` or two arrays, one of property names
	     * and one of corresponding values.
	     *
	     * @static
	     * @memberOf _
	     * @alias object
	     * @category Array
	     * @param {Array} props The property names.
	     * @param {Array} [values=[]] The property values.
	     * @returns {Object} Returns the new object.
	     * @example
	     *
	     * _.zipObject([['fred', 30], ['barney', 40]]);
	     * // => { 'fred': 30, 'barney': 40 }
	     *
	     * _.zipObject(['fred', 'barney'], [30, 40]);
	     * // => { 'fred': 30, 'barney': 40 }
	     */
	    function zipObject(props, values) {
	      var index = -1,
	          length = props ? props.length : 0,
	          result = {};

	      if (length && !values && !isArray(props[0])) {
	        values = [];
	      }
	      while (++index < length) {
	        var key = props[index];
	        if (values) {
	          result[key] = values[index];
	        } else if (key) {
	          result[key[0]] = key[1];
	        }
	      }
	      return result;
	    }

	    /**
	     * This method is like `_.zip` except that it accepts an iteratee to specify
	     * how grouped values should be combined. The `iteratee` is bound to `thisArg`
	     * and invoked with four arguments: (accumulator, value, index, group).
	     *
	     * @static
	     * @memberOf _
	     * @category Array
	     * @param {...Array} [arrays] The arrays to process.
	     * @param {Function} [iteratee] The function to combine grouped values.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Array} Returns the new array of grouped elements.
	     * @example
	     *
	     * _.zipWith([1, 2], [10, 20], [100, 200], _.add);
	     * // => [111, 222]
	     */
	    var zipWith = restParam(function(arrays) {
	      var length = arrays.length,
	          iteratee = length > 2 ? arrays[length - 2] : undefined,
	          thisArg = length > 1 ? arrays[length - 1] : undefined;

	      if (length > 2 && typeof iteratee == 'function') {
	        length -= 2;
	      } else {
	        iteratee = (length > 1 && typeof thisArg == 'function') ? (--length, thisArg) : undefined;
	        thisArg = undefined;
	      }
	      arrays.length = length;
	      return unzipWith(arrays, iteratee, thisArg);
	    });

	    /*------------------------------------------------------------------------*/

	    /**
	     * Creates a `lodash` object that wraps `value` with explicit method
	     * chaining enabled.
	     *
	     * @static
	     * @memberOf _
	     * @category Chain
	     * @param {*} value The value to wrap.
	     * @returns {Object} Returns the new `lodash` wrapper instance.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney',  'age': 36 },
	     *   { 'user': 'fred',    'age': 40 },
	     *   { 'user': 'pebbles', 'age': 1 }
	     * ];
	     *
	     * var youngest = _.chain(users)
	     *   .sortBy('age')
	     *   .map(function(chr) {
	     *     return chr.user + ' is ' + chr.age;
	     *   })
	     *   .first()
	     *   .value();
	     * // => 'pebbles is 1'
	     */
	    function chain(value) {
	      var result = lodash(value);
	      result.__chain__ = true;
	      return result;
	    }

	    /**
	     * This method invokes `interceptor` and returns `value`. The interceptor is
	     * bound to `thisArg` and invoked with one argument; (value). The purpose of
	     * this method is to "tap into" a method chain in order to perform operations
	     * on intermediate results within the chain.
	     *
	     * @static
	     * @memberOf _
	     * @category Chain
	     * @param {*} value The value to provide to `interceptor`.
	     * @param {Function} interceptor The function to invoke.
	     * @param {*} [thisArg] The `this` binding of `interceptor`.
	     * @returns {*} Returns `value`.
	     * @example
	     *
	     * _([1, 2, 3])
	     *  .tap(function(array) {
	     *    array.pop();
	     *  })
	     *  .reverse()
	     *  .value();
	     * // => [2, 1]
	     */
	    function tap(value, interceptor, thisArg) {
	      interceptor.call(thisArg, value);
	      return value;
	    }

	    /**
	     * This method is like `_.tap` except that it returns the result of `interceptor`.
	     *
	     * @static
	     * @memberOf _
	     * @category Chain
	     * @param {*} value The value to provide to `interceptor`.
	     * @param {Function} interceptor The function to invoke.
	     * @param {*} [thisArg] The `this` binding of `interceptor`.
	     * @returns {*} Returns the result of `interceptor`.
	     * @example
	     *
	     * _('  abc  ')
	     *  .chain()
	     *  .trim()
	     *  .thru(function(value) {
	     *    return [value];
	     *  })
	     *  .value();
	     * // => ['abc']
	     */
	    function thru(value, interceptor, thisArg) {
	      return interceptor.call(thisArg, value);
	    }

	    /**
	     * Enables explicit method chaining on the wrapper object.
	     *
	     * @name chain
	     * @memberOf _
	     * @category Chain
	     * @returns {Object} Returns the new `lodash` wrapper instance.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36 },
	     *   { 'user': 'fred',   'age': 40 }
	     * ];
	     *
	     * // without explicit chaining
	     * _(users).first();
	     * // => { 'user': 'barney', 'age': 36 }
	     *
	     * // with explicit chaining
	     * _(users).chain()
	     *   .first()
	     *   .pick('user')
	     *   .value();
	     * // => { 'user': 'barney' }
	     */
	    function wrapperChain() {
	      return chain(this);
	    }

	    /**
	     * Executes the chained sequence and returns the wrapped result.
	     *
	     * @name commit
	     * @memberOf _
	     * @category Chain
	     * @returns {Object} Returns the new `lodash` wrapper instance.
	     * @example
	     *
	     * var array = [1, 2];
	     * var wrapped = _(array).push(3);
	     *
	     * console.log(array);
	     * // => [1, 2]
	     *
	     * wrapped = wrapped.commit();
	     * console.log(array);
	     * // => [1, 2, 3]
	     *
	     * wrapped.last();
	     * // => 3
	     *
	     * console.log(array);
	     * // => [1, 2, 3]
	     */
	    function wrapperCommit() {
	      return new LodashWrapper(this.value(), this.__chain__);
	    }

	    /**
	     * Creates a new array joining a wrapped array with any additional arrays
	     * and/or values.
	     *
	     * @name concat
	     * @memberOf _
	     * @category Chain
	     * @param {...*} [values] The values to concatenate.
	     * @returns {Array} Returns the new concatenated array.
	     * @example
	     *
	     * var array = [1];
	     * var wrapped = _(array).concat(2, [3], [[4]]);
	     *
	     * console.log(wrapped.value());
	     * // => [1, 2, 3, [4]]
	     *
	     * console.log(array);
	     * // => [1]
	     */
	    var wrapperConcat = restParam(function(values) {
	      values = baseFlatten(values);
	      return this.thru(function(array) {
	        return arrayConcat(isArray(array) ? array : [toObject(array)], values);
	      });
	    });

	    /**
	     * Creates a clone of the chained sequence planting `value` as the wrapped value.
	     *
	     * @name plant
	     * @memberOf _
	     * @category Chain
	     * @returns {Object} Returns the new `lodash` wrapper instance.
	     * @example
	     *
	     * var array = [1, 2];
	     * var wrapped = _(array).map(function(value) {
	     *   return Math.pow(value, 2);
	     * });
	     *
	     * var other = [3, 4];
	     * var otherWrapped = wrapped.plant(other);
	     *
	     * otherWrapped.value();
	     * // => [9, 16]
	     *
	     * wrapped.value();
	     * // => [1, 4]
	     */
	    function wrapperPlant(value) {
	      var result,
	          parent = this;

	      while (parent instanceof baseLodash) {
	        var clone = wrapperClone(parent);
	        if (result) {
	          previous.__wrapped__ = clone;
	        } else {
	          result = clone;
	        }
	        var previous = clone;
	        parent = parent.__wrapped__;
	      }
	      previous.__wrapped__ = value;
	      return result;
	    }

	    /**
	     * Reverses the wrapped array so the first element becomes the last, the
	     * second element becomes the second to last, and so on.
	     *
	     * **Note:** This method mutates the wrapped array.
	     *
	     * @name reverse
	     * @memberOf _
	     * @category Chain
	     * @returns {Object} Returns the new reversed `lodash` wrapper instance.
	     * @example
	     *
	     * var array = [1, 2, 3];
	     *
	     * _(array).reverse().value()
	     * // => [3, 2, 1]
	     *
	     * console.log(array);
	     * // => [3, 2, 1]
	     */
	    function wrapperReverse() {
	      var value = this.__wrapped__;

	      var interceptor = function(value) {
	        return (wrapped && wrapped.__dir__ < 0) ? value : value.reverse();
	      };
	      if (value instanceof LazyWrapper) {
	        var wrapped = value;
	        if (this.__actions__.length) {
	          wrapped = new LazyWrapper(this);
	        }
	        wrapped = wrapped.reverse();
	        wrapped.__actions__.push({ 'func': thru, 'args': [interceptor], 'thisArg': undefined });
	        return new LodashWrapper(wrapped, this.__chain__);
	      }
	      return this.thru(interceptor);
	    }

	    /**
	     * Produces the result of coercing the unwrapped value to a string.
	     *
	     * @name toString
	     * @memberOf _
	     * @category Chain
	     * @returns {string} Returns the coerced string value.
	     * @example
	     *
	     * _([1, 2, 3]).toString();
	     * // => '1,2,3'
	     */
	    function wrapperToString() {
	      return (this.value() + '');
	    }

	    /**
	     * Executes the chained sequence to extract the unwrapped value.
	     *
	     * @name value
	     * @memberOf _
	     * @alias run, toJSON, valueOf
	     * @category Chain
	     * @returns {*} Returns the resolved unwrapped value.
	     * @example
	     *
	     * _([1, 2, 3]).value();
	     * // => [1, 2, 3]
	     */
	    function wrapperValue() {
	      return baseWrapperValue(this.__wrapped__, this.__actions__);
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Creates an array of elements corresponding to the given keys, or indexes,
	     * of `collection`. Keys may be specified as individual arguments or as arrays
	     * of keys.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {...(number|number[]|string|string[])} [props] The property names
	     *  or indexes of elements to pick, specified individually or in arrays.
	     * @returns {Array} Returns the new array of picked elements.
	     * @example
	     *
	     * _.at(['a', 'b', 'c'], [0, 2]);
	     * // => ['a', 'c']
	     *
	     * _.at(['barney', 'fred', 'pebbles'], 0, 2);
	     * // => ['barney', 'pebbles']
	     */
	    var at = restParam(function(collection, props) {
	      return baseAt(collection, baseFlatten(props));
	    });

	    /**
	     * Creates an object composed of keys generated from the results of running
	     * each element of `collection` through `iteratee`. The corresponding value
	     * of each key is the number of times the key was returned by `iteratee`.
	     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
	     * (value, index|key, collection).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns the composed aggregate object.
	     * @example
	     *
	     * _.countBy([4.3, 6.1, 6.4], function(n) {
	     *   return Math.floor(n);
	     * });
	     * // => { '4': 1, '6': 2 }
	     *
	     * _.countBy([4.3, 6.1, 6.4], function(n) {
	     *   return this.floor(n);
	     * }, Math);
	     * // => { '4': 1, '6': 2 }
	     *
	     * _.countBy(['one', 'two', 'three'], 'length');
	     * // => { '3': 2, '5': 1 }
	     */
	    var countBy = createAggregator(function(result, value, key) {
	      hasOwnProperty.call(result, key) ? ++result[key] : (result[key] = 1);
	    });

	    /**
	     * Checks if `predicate` returns truthy for **all** elements of `collection`.
	     * The predicate is bound to `thisArg` and invoked with three arguments:
	     * (value, index|key, collection).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias all
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {boolean} Returns `true` if all elements pass the predicate check,
	     *  else `false`.
	     * @example
	     *
	     * _.every([true, 1, null, 'yes'], Boolean);
	     * // => false
	     *
	     * var users = [
	     *   { 'user': 'barney', 'active': false },
	     *   { 'user': 'fred',   'active': false }
	     * ];
	     *
	     * // using the `_.matches` callback shorthand
	     * _.every(users, { 'user': 'barney', 'active': false });
	     * // => false
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.every(users, 'active', false);
	     * // => true
	     *
	     * // using the `_.property` callback shorthand
	     * _.every(users, 'active');
	     * // => false
	     */
	    function every(collection, predicate, thisArg) {
	      var func = isArray(collection) ? arrayEvery : baseEvery;
	      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
	        predicate = undefined;
	      }
	      if (typeof predicate != 'function' || thisArg !== undefined) {
	        predicate = getCallback(predicate, thisArg, 3);
	      }
	      return func(collection, predicate);
	    }

	    /**
	     * Iterates over elements of `collection`, returning an array of all elements
	     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
	     * invoked with three arguments: (value, index|key, collection).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias select
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Array} Returns the new filtered array.
	     * @example
	     *
	     * _.filter([4, 5, 6], function(n) {
	     *   return n % 2 == 0;
	     * });
	     * // => [4, 6]
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36, 'active': true },
	     *   { 'user': 'fred',   'age': 40, 'active': false }
	     * ];
	     *
	     * // using the `_.matches` callback shorthand
	     * _.pluck(_.filter(users, { 'age': 36, 'active': true }), 'user');
	     * // => ['barney']
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.pluck(_.filter(users, 'active', false), 'user');
	     * // => ['fred']
	     *
	     * // using the `_.property` callback shorthand
	     * _.pluck(_.filter(users, 'active'), 'user');
	     * // => ['barney']
	     */
	    function filter(collection, predicate, thisArg) {
	      var func = isArray(collection) ? arrayFilter : baseFilter;
	      predicate = getCallback(predicate, thisArg, 3);
	      return func(collection, predicate);
	    }

	    /**
	     * Iterates over elements of `collection`, returning the first element
	     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
	     * invoked with three arguments: (value, index|key, collection).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias detect
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to search.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {*} Returns the matched element, else `undefined`.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney',  'age': 36, 'active': true },
	     *   { 'user': 'fred',    'age': 40, 'active': false },
	     *   { 'user': 'pebbles', 'age': 1,  'active': true }
	     * ];
	     *
	     * _.result(_.find(users, function(chr) {
	     *   return chr.age < 40;
	     * }), 'user');
	     * // => 'barney'
	     *
	     * // using the `_.matches` callback shorthand
	     * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
	     * // => 'pebbles'
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.result(_.find(users, 'active', false), 'user');
	     * // => 'fred'
	     *
	     * // using the `_.property` callback shorthand
	     * _.result(_.find(users, 'active'), 'user');
	     * // => 'barney'
	     */
	    var find = createFind(baseEach);

	    /**
	     * This method is like `_.find` except that it iterates over elements of
	     * `collection` from right to left.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to search.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {*} Returns the matched element, else `undefined`.
	     * @example
	     *
	     * _.findLast([1, 2, 3, 4], function(n) {
	     *   return n % 2 == 1;
	     * });
	     * // => 3
	     */
	    var findLast = createFind(baseEachRight, true);

	    /**
	     * Performs a deep comparison between each element in `collection` and the
	     * source object, returning the first element that has equivalent property
	     * values.
	     *
	     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
	     * numbers, `Object` objects, regexes, and strings. Objects are compared by
	     * their own, not inherited, enumerable properties. For comparing a single
	     * own or inherited property value see `_.matchesProperty`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to search.
	     * @param {Object} source The object of property values to match.
	     * @returns {*} Returns the matched element, else `undefined`.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36, 'active': true },
	     *   { 'user': 'fred',   'age': 40, 'active': false }
	     * ];
	     *
	     * _.result(_.findWhere(users, { 'age': 36, 'active': true }), 'user');
	     * // => 'barney'
	     *
	     * _.result(_.findWhere(users, { 'age': 40, 'active': false }), 'user');
	     * // => 'fred'
	     */
	    function findWhere(collection, source) {
	      return find(collection, baseMatches(source));
	    }

	    /**
	     * Iterates over elements of `collection` invoking `iteratee` for each element.
	     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
	     * (value, index|key, collection). Iteratee functions may exit iteration early
	     * by explicitly returning `false`.
	     *
	     * **Note:** As with other "Collections" methods, objects with a "length" property
	     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
	     * may be used for object iteration.
	     *
	     * @static
	     * @memberOf _
	     * @alias each
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Array|Object|string} Returns `collection`.
	     * @example
	     *
	     * _([1, 2]).forEach(function(n) {
	     *   console.log(n);
	     * }).value();
	     * // => logs each value from left to right and returns the array
	     *
	     * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
	     *   console.log(n, key);
	     * });
	     * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
	     */
	    var forEach = createForEach(arrayEach, baseEach);

	    /**
	     * This method is like `_.forEach` except that it iterates over elements of
	     * `collection` from right to left.
	     *
	     * @static
	     * @memberOf _
	     * @alias eachRight
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Array|Object|string} Returns `collection`.
	     * @example
	     *
	     * _([1, 2]).forEachRight(function(n) {
	     *   console.log(n);
	     * }).value();
	     * // => logs each value from right to left and returns the array
	     */
	    var forEachRight = createForEach(arrayEachRight, baseEachRight);

	    /**
	     * Creates an object composed of keys generated from the results of running
	     * each element of `collection` through `iteratee`. The corresponding value
	     * of each key is an array of the elements responsible for generating the key.
	     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
	     * (value, index|key, collection).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns the composed aggregate object.
	     * @example
	     *
	     * _.groupBy([4.2, 6.1, 6.4], function(n) {
	     *   return Math.floor(n);
	     * });
	     * // => { '4': [4.2], '6': [6.1, 6.4] }
	     *
	     * _.groupBy([4.2, 6.1, 6.4], function(n) {
	     *   return this.floor(n);
	     * }, Math);
	     * // => { '4': [4.2], '6': [6.1, 6.4] }
	     *
	     * // using the `_.property` callback shorthand
	     * _.groupBy(['one', 'two', 'three'], 'length');
	     * // => { '3': ['one', 'two'], '5': ['three'] }
	     */
	    var groupBy = createAggregator(function(result, value, key) {
	      if (hasOwnProperty.call(result, key)) {
	        result[key].push(value);
	      } else {
	        result[key] = [value];
	      }
	    });

	    /**
	     * Checks if `value` is in `collection` using
	     * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
	     * for equality comparisons. If `fromIndex` is negative, it is used as the offset
	     * from the end of `collection`.
	     *
	     * @static
	     * @memberOf _
	     * @alias contains, include
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to search.
	     * @param {*} target The value to search for.
	     * @param {number} [fromIndex=0] The index to search from.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
	     * @returns {boolean} Returns `true` if a matching element is found, else `false`.
	     * @example
	     *
	     * _.includes([1, 2, 3], 1);
	     * // => true
	     *
	     * _.includes([1, 2, 3], 1, 2);
	     * // => false
	     *
	     * _.includes({ 'user': 'fred', 'age': 40 }, 'fred');
	     * // => true
	     *
	     * _.includes('pebbles', 'eb');
	     * // => true
	     */
	    function includes(collection, target, fromIndex, guard) {
	      var length = collection ? getLength(collection) : 0;
	      if (!isLength(length)) {
	        collection = values(collection);
	        length = collection.length;
	      }
	      if (typeof fromIndex != 'number' || (guard && isIterateeCall(target, fromIndex, guard))) {
	        fromIndex = 0;
	      } else {
	        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);
	      }
	      return (typeof collection == 'string' || !isArray(collection) && isString(collection))
	        ? (fromIndex <= length && collection.indexOf(target, fromIndex) > -1)
	        : (!!length && getIndexOf(collection, target, fromIndex) > -1);
	    }

	    /**
	     * Creates an object composed of keys generated from the results of running
	     * each element of `collection` through `iteratee`. The corresponding value
	     * of each key is the last element responsible for generating the key. The
	     * iteratee function is bound to `thisArg` and invoked with three arguments:
	     * (value, index|key, collection).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns the composed aggregate object.
	     * @example
	     *
	     * var keyData = [
	     *   { 'dir': 'left', 'code': 97 },
	     *   { 'dir': 'right', 'code': 100 }
	     * ];
	     *
	     * _.indexBy(keyData, 'dir');
	     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
	     *
	     * _.indexBy(keyData, function(object) {
	     *   return String.fromCharCode(object.code);
	     * });
	     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
	     *
	     * _.indexBy(keyData, function(object) {
	     *   return this.fromCharCode(object.code);
	     * }, String);
	     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
	     */
	    var indexBy = createAggregator(function(result, value, key) {
	      result[key] = value;
	    });

	    /**
	     * Invokes the method at `path` of each element in `collection`, returning
	     * an array of the results of each invoked method. Any additional arguments
	     * are provided to each invoked method. If `methodName` is a function it is
	     * invoked for, and `this` bound to, each element in `collection`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Array|Function|string} path The path of the method to invoke or
	     *  the function invoked per iteration.
	     * @param {...*} [args] The arguments to invoke the method with.
	     * @returns {Array} Returns the array of results.
	     * @example
	     *
	     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
	     * // => [[1, 5, 7], [1, 2, 3]]
	     *
	     * _.invoke([123, 456], String.prototype.split, '');
	     * // => [['1', '2', '3'], ['4', '5', '6']]
	     */
	    var invoke = restParam(function(collection, path, args) {
	      var index = -1,
	          isFunc = typeof path == 'function',
	          isProp = isKey(path),
	          result = isArrayLike(collection) ? Array(collection.length) : [];

	      baseEach(collection, function(value) {
	        var func = isFunc ? path : ((isProp && value != null) ? value[path] : undefined);
	        result[++index] = func ? func.apply(value, args) : invokePath(value, path, args);
	      });
	      return result;
	    });

	    /**
	     * Creates an array of values by running each element in `collection` through
	     * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
	     * arguments: (value, index|key, collection).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * Many lodash methods are guarded to work as iteratees for methods like
	     * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
	     *
	     * The guarded methods are:
	     * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
	     * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
	     * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
	     * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
	     * `sum`, `uniq`, and `words`
	     *
	     * @static
	     * @memberOf _
	     * @alias collect
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Array} Returns the new mapped array.
	     * @example
	     *
	     * function timesThree(n) {
	     *   return n * 3;
	     * }
	     *
	     * _.map([1, 2], timesThree);
	     * // => [3, 6]
	     *
	     * _.map({ 'a': 1, 'b': 2 }, timesThree);
	     * // => [3, 6] (iteration order is not guaranteed)
	     *
	     * var users = [
	     *   { 'user': 'barney' },
	     *   { 'user': 'fred' }
	     * ];
	     *
	     * // using the `_.property` callback shorthand
	     * _.map(users, 'user');
	     * // => ['barney', 'fred']
	     */
	    function map(collection, iteratee, thisArg) {
	      var func = isArray(collection) ? arrayMap : baseMap;
	      iteratee = getCallback(iteratee, thisArg, 3);
	      return func(collection, iteratee);
	    }

	    /**
	     * Creates an array of elements split into two groups, the first of which
	     * contains elements `predicate` returns truthy for, while the second of which
	     * contains elements `predicate` returns falsey for. The predicate is bound
	     * to `thisArg` and invoked with three arguments: (value, index|key, collection).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Array} Returns the array of grouped elements.
	     * @example
	     *
	     * _.partition([1, 2, 3], function(n) {
	     *   return n % 2;
	     * });
	     * // => [[1, 3], [2]]
	     *
	     * _.partition([1.2, 2.3, 3.4], function(n) {
	     *   return this.floor(n) % 2;
	     * }, Math);
	     * // => [[1.2, 3.4], [2.3]]
	     *
	     * var users = [
	     *   { 'user': 'barney',  'age': 36, 'active': false },
	     *   { 'user': 'fred',    'age': 40, 'active': true },
	     *   { 'user': 'pebbles', 'age': 1,  'active': false }
	     * ];
	     *
	     * var mapper = function(array) {
	     *   return _.pluck(array, 'user');
	     * };
	     *
	     * // using the `_.matches` callback shorthand
	     * _.map(_.partition(users, { 'age': 1, 'active': false }), mapper);
	     * // => [['pebbles'], ['barney', 'fred']]
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.map(_.partition(users, 'active', false), mapper);
	     * // => [['barney', 'pebbles'], ['fred']]
	     *
	     * // using the `_.property` callback shorthand
	     * _.map(_.partition(users, 'active'), mapper);
	     * // => [['fred'], ['barney', 'pebbles']]
	     */
	    var partition = createAggregator(function(result, value, key) {
	      result[key ? 0 : 1].push(value);
	    }, function() { return [[], []]; });

	    /**
	     * Gets the property value of `path` from all elements in `collection`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Array|string} path The path of the property to pluck.
	     * @returns {Array} Returns the property values.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36 },
	     *   { 'user': 'fred',   'age': 40 }
	     * ];
	     *
	     * _.pluck(users, 'user');
	     * // => ['barney', 'fred']
	     *
	     * var userIndex = _.indexBy(users, 'user');
	     * _.pluck(userIndex, 'age');
	     * // => [36, 40] (iteration order is not guaranteed)
	     */
	    function pluck(collection, path) {
	      return map(collection, property(path));
	    }

	    /**
	     * Reduces `collection` to a value which is the accumulated result of running
	     * each element in `collection` through `iteratee`, where each successive
	     * invocation is supplied the return value of the previous. If `accumulator`
	     * is not provided the first element of `collection` is used as the initial
	     * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
	     * (accumulator, value, index|key, collection).
	     *
	     * Many lodash methods are guarded to work as iteratees for methods like
	     * `_.reduce`, `_.reduceRight`, and `_.transform`.
	     *
	     * The guarded methods are:
	     * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `sortByAll`,
	     * and `sortByOrder`
	     *
	     * @static
	     * @memberOf _
	     * @alias foldl, inject
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [accumulator] The initial value.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {*} Returns the accumulated value.
	     * @example
	     *
	     * _.reduce([1, 2], function(total, n) {
	     *   return total + n;
	     * });
	     * // => 3
	     *
	     * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
	     *   result[key] = n * 3;
	     *   return result;
	     * }, {});
	     * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
	     */
	    var reduce = createReduce(arrayReduce, baseEach);

	    /**
	     * This method is like `_.reduce` except that it iterates over elements of
	     * `collection` from right to left.
	     *
	     * @static
	     * @memberOf _
	     * @alias foldr
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [accumulator] The initial value.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {*} Returns the accumulated value.
	     * @example
	     *
	     * var array = [[0, 1], [2, 3], [4, 5]];
	     *
	     * _.reduceRight(array, function(flattened, other) {
	     *   return flattened.concat(other);
	     * }, []);
	     * // => [4, 5, 2, 3, 0, 1]
	     */
	    var reduceRight = createReduce(arrayReduceRight, baseEachRight);

	    /**
	     * The opposite of `_.filter`; this method returns the elements of `collection`
	     * that `predicate` does **not** return truthy for.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Array} Returns the new filtered array.
	     * @example
	     *
	     * _.reject([1, 2, 3, 4], function(n) {
	     *   return n % 2 == 0;
	     * });
	     * // => [1, 3]
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36, 'active': false },
	     *   { 'user': 'fred',   'age': 40, 'active': true }
	     * ];
	     *
	     * // using the `_.matches` callback shorthand
	     * _.pluck(_.reject(users, { 'age': 40, 'active': true }), 'user');
	     * // => ['barney']
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.pluck(_.reject(users, 'active', false), 'user');
	     * // => ['fred']
	     *
	     * // using the `_.property` callback shorthand
	     * _.pluck(_.reject(users, 'active'), 'user');
	     * // => ['barney']
	     */
	    function reject(collection, predicate, thisArg) {
	      var func = isArray(collection) ? arrayFilter : baseFilter;
	      predicate = getCallback(predicate, thisArg, 3);
	      return func(collection, function(value, index, collection) {
	        return !predicate(value, index, collection);
	      });
	    }

	    /**
	     * Gets a random element or `n` random elements from a collection.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to sample.
	     * @param {number} [n] The number of elements to sample.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {*} Returns the random sample(s).
	     * @example
	     *
	     * _.sample([1, 2, 3, 4]);
	     * // => 2
	     *
	     * _.sample([1, 2, 3, 4], 2);
	     * // => [3, 1]
	     */
	    function sample(collection, n, guard) {
	      if (guard ? isIterateeCall(collection, n, guard) : n == null) {
	        collection = toIterable(collection);
	        var length = collection.length;
	        return length > 0 ? collection[baseRandom(0, length - 1)] : undefined;
	      }
	      var index = -1,
	          result = toArray(collection),
	          length = result.length,
	          lastIndex = length - 1;

	      n = nativeMin(n < 0 ? 0 : (+n || 0), length);
	      while (++index < n) {
	        var rand = baseRandom(index, lastIndex),
	            value = result[rand];

	        result[rand] = result[index];
	        result[index] = value;
	      }
	      result.length = n;
	      return result;
	    }

	    /**
	     * Creates an array of shuffled values, using a version of the
	     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to shuffle.
	     * @returns {Array} Returns the new shuffled array.
	     * @example
	     *
	     * _.shuffle([1, 2, 3, 4]);
	     * // => [4, 1, 3, 2]
	     */
	    function shuffle(collection) {
	      return sample(collection, POSITIVE_INFINITY);
	    }

	    /**
	     * Gets the size of `collection` by returning its length for array-like
	     * values or the number of own enumerable properties for objects.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to inspect.
	     * @returns {number} Returns the size of `collection`.
	     * @example
	     *
	     * _.size([1, 2, 3]);
	     * // => 3
	     *
	     * _.size({ 'a': 1, 'b': 2 });
	     * // => 2
	     *
	     * _.size('pebbles');
	     * // => 7
	     */
	    function size(collection) {
	      var length = collection ? getLength(collection) : 0;
	      return isLength(length) ? length : keys(collection).length;
	    }

	    /**
	     * Checks if `predicate` returns truthy for **any** element of `collection`.
	     * The function returns as soon as it finds a passing value and does not iterate
	     * over the entire collection. The predicate is bound to `thisArg` and invoked
	     * with three arguments: (value, index|key, collection).
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias any
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {boolean} Returns `true` if any element passes the predicate check,
	     *  else `false`.
	     * @example
	     *
	     * _.some([null, 0, 'yes', false], Boolean);
	     * // => true
	     *
	     * var users = [
	     *   { 'user': 'barney', 'active': true },
	     *   { 'user': 'fred',   'active': false }
	     * ];
	     *
	     * // using the `_.matches` callback shorthand
	     * _.some(users, { 'user': 'barney', 'active': false });
	     * // => false
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.some(users, 'active', false);
	     * // => true
	     *
	     * // using the `_.property` callback shorthand
	     * _.some(users, 'active');
	     * // => true
	     */
	    function some(collection, predicate, thisArg) {
	      var func = isArray(collection) ? arraySome : baseSome;
	      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
	        predicate = undefined;
	      }
	      if (typeof predicate != 'function' || thisArg !== undefined) {
	        predicate = getCallback(predicate, thisArg, 3);
	      }
	      return func(collection, predicate);
	    }

	    /**
	     * Creates an array of elements, sorted in ascending order by the results of
	     * running each element in a collection through `iteratee`. This method performs
	     * a stable sort, that is, it preserves the original sort order of equal elements.
	     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
	     * (value, index|key, collection).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Array} Returns the new sorted array.
	     * @example
	     *
	     * _.sortBy([1, 2, 3], function(n) {
	     *   return Math.sin(n);
	     * });
	     * // => [3, 1, 2]
	     *
	     * _.sortBy([1, 2, 3], function(n) {
	     *   return this.sin(n);
	     * }, Math);
	     * // => [3, 1, 2]
	     *
	     * var users = [
	     *   { 'user': 'fred' },
	     *   { 'user': 'pebbles' },
	     *   { 'user': 'barney' }
	     * ];
	     *
	     * // using the `_.property` callback shorthand
	     * _.pluck(_.sortBy(users, 'user'), 'user');
	     * // => ['barney', 'fred', 'pebbles']
	     */
	    function sortBy(collection, iteratee, thisArg) {
	      if (collection == null) {
	        return [];
	      }
	      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
	        iteratee = undefined;
	      }
	      var index = -1;
	      iteratee = getCallback(iteratee, thisArg, 3);

	      var result = baseMap(collection, function(value, key, collection) {
	        return { 'criteria': iteratee(value, key, collection), 'index': ++index, 'value': value };
	      });
	      return baseSortBy(result, compareAscending);
	    }

	    /**
	     * This method is like `_.sortBy` except that it can sort by multiple iteratees
	     * or property names.
	     *
	     * If a property name is provided for an iteratee the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If an object is provided for an iteratee the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {...(Function|Function[]|Object|Object[]|string|string[])} iteratees
	     *  The iteratees to sort by, specified as individual values or arrays of values.
	     * @returns {Array} Returns the new sorted array.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'fred',   'age': 48 },
	     *   { 'user': 'barney', 'age': 36 },
	     *   { 'user': 'fred',   'age': 42 },
	     *   { 'user': 'barney', 'age': 34 }
	     * ];
	     *
	     * _.map(_.sortByAll(users, ['user', 'age']), _.values);
	     * // => [['barney', 34], ['barney', 36], ['fred', 42], ['fred', 48]]
	     *
	     * _.map(_.sortByAll(users, 'user', function(chr) {
	     *   return Math.floor(chr.age / 10);
	     * }), _.values);
	     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
	     */
	    var sortByAll = restParam(function(collection, iteratees) {
	      if (collection == null) {
	        return [];
	      }
	      var guard = iteratees[2];
	      if (guard && isIterateeCall(iteratees[0], iteratees[1], guard)) {
	        iteratees.length = 1;
	      }
	      return baseSortByOrder(collection, baseFlatten(iteratees), []);
	    });

	    /**
	     * This method is like `_.sortByAll` except that it allows specifying the
	     * sort orders of the iteratees to sort by. If `orders` is unspecified, all
	     * values are sorted in ascending order. Otherwise, a value is sorted in
	     * ascending order if its corresponding order is "asc", and descending if "desc".
	     *
	     * If a property name is provided for an iteratee the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If an object is provided for an iteratee the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
	     * @param {boolean[]} [orders] The sort orders of `iteratees`.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
	     * @returns {Array} Returns the new sorted array.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'fred',   'age': 48 },
	     *   { 'user': 'barney', 'age': 34 },
	     *   { 'user': 'fred',   'age': 42 },
	     *   { 'user': 'barney', 'age': 36 }
	     * ];
	     *
	     * // sort by `user` in ascending order and by `age` in descending order
	     * _.map(_.sortByOrder(users, ['user', 'age'], ['asc', 'desc']), _.values);
	     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
	     */
	    function sortByOrder(collection, iteratees, orders, guard) {
	      if (collection == null) {
	        return [];
	      }
	      if (guard && isIterateeCall(iteratees, orders, guard)) {
	        orders = undefined;
	      }
	      if (!isArray(iteratees)) {
	        iteratees = iteratees == null ? [] : [iteratees];
	      }
	      if (!isArray(orders)) {
	        orders = orders == null ? [] : [orders];
	      }
	      return baseSortByOrder(collection, iteratees, orders);
	    }

	    /**
	     * Performs a deep comparison between each element in `collection` and the
	     * source object, returning an array of all elements that have equivalent
	     * property values.
	     *
	     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
	     * numbers, `Object` objects, regexes, and strings. Objects are compared by
	     * their own, not inherited, enumerable properties. For comparing a single
	     * own or inherited property value see `_.matchesProperty`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collection
	     * @param {Array|Object|string} collection The collection to search.
	     * @param {Object} source The object of property values to match.
	     * @returns {Array} Returns the new filtered array.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36, 'active': false, 'pets': ['hoppy'] },
	     *   { 'user': 'fred',   'age': 40, 'active': true, 'pets': ['baby puss', 'dino'] }
	     * ];
	     *
	     * _.pluck(_.where(users, { 'age': 36, 'active': false }), 'user');
	     * // => ['barney']
	     *
	     * _.pluck(_.where(users, { 'pets': ['dino'] }), 'user');
	     * // => ['fred']
	     */
	    function where(collection, source) {
	      return filter(collection, baseMatches(source));
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Gets the number of milliseconds that have elapsed since the Unix epoch
	     * (1 January 1970 00:00:00 UTC).
	     *
	     * @static
	     * @memberOf _
	     * @category Date
	     * @example
	     *
	     * _.defer(function(stamp) {
	     *   console.log(_.now() - stamp);
	     * }, _.now());
	     * // => logs the number of milliseconds it took for the deferred function to be invoked
	     */
	    var now = nativeNow || function() {
	      return new Date().getTime();
	    };

	    /*------------------------------------------------------------------------*/

	    /**
	     * The opposite of `_.before`; this method creates a function that invokes
	     * `func` once it is called `n` or more times.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {number} n The number of calls before `func` is invoked.
	     * @param {Function} func The function to restrict.
	     * @returns {Function} Returns the new restricted function.
	     * @example
	     *
	     * var saves = ['profile', 'settings'];
	     *
	     * var done = _.after(saves.length, function() {
	     *   console.log('done saving!');
	     * });
	     *
	     * _.forEach(saves, function(type) {
	     *   asyncSave({ 'type': type, 'complete': done });
	     * });
	     * // => logs 'done saving!' after the two async saves have completed
	     */
	    function after(n, func) {
	      if (typeof func != 'function') {
	        if (typeof n == 'function') {
	          var temp = n;
	          n = func;
	          func = temp;
	        } else {
	          throw new TypeError(FUNC_ERROR_TEXT);
	        }
	      }
	      n = nativeIsFinite(n = +n) ? n : 0;
	      return function() {
	        if (--n < 1) {
	          return func.apply(this, arguments);
	        }
	      };
	    }

	    /**
	     * Creates a function that accepts up to `n` arguments ignoring any
	     * additional arguments.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to cap arguments for.
	     * @param {number} [n=func.length] The arity cap.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * _.map(['6', '8', '10'], _.ary(parseInt, 1));
	     * // => [6, 8, 10]
	     */
	    function ary(func, n, guard) {
	      if (guard && isIterateeCall(func, n, guard)) {
	        n = undefined;
	      }
	      n = (func && n == null) ? func.length : nativeMax(+n || 0, 0);
	      return createWrapper(func, ARY_FLAG, undefined, undefined, undefined, undefined, n);
	    }

	    /**
	     * Creates a function that invokes `func`, with the `this` binding and arguments
	     * of the created function, while it is called less than `n` times. Subsequent
	     * calls to the created function return the result of the last `func` invocation.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {number} n The number of calls at which `func` is no longer invoked.
	     * @param {Function} func The function to restrict.
	     * @returns {Function} Returns the new restricted function.
	     * @example
	     *
	     * jQuery('#add').on('click', _.before(5, addContactToList));
	     * // => allows adding up to 4 contacts to the list
	     */
	    function before(n, func) {
	      var result;
	      if (typeof func != 'function') {
	        if (typeof n == 'function') {
	          var temp = n;
	          n = func;
	          func = temp;
	        } else {
	          throw new TypeError(FUNC_ERROR_TEXT);
	        }
	      }
	      return function() {
	        if (--n > 0) {
	          result = func.apply(this, arguments);
	        }
	        if (n <= 1) {
	          func = undefined;
	        }
	        return result;
	      };
	    }

	    /**
	     * Creates a function that invokes `func` with the `this` binding of `thisArg`
	     * and prepends any additional `_.bind` arguments to those provided to the
	     * bound function.
	     *
	     * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,
	     * may be used as a placeholder for partially applied arguments.
	     *
	     * **Note:** Unlike native `Function#bind` this method does not set the "length"
	     * property of bound functions.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to bind.
	     * @param {*} thisArg The `this` binding of `func`.
	     * @param {...*} [partials] The arguments to be partially applied.
	     * @returns {Function} Returns the new bound function.
	     * @example
	     *
	     * var greet = function(greeting, punctuation) {
	     *   return greeting + ' ' + this.user + punctuation;
	     * };
	     *
	     * var object = { 'user': 'fred' };
	     *
	     * var bound = _.bind(greet, object, 'hi');
	     * bound('!');
	     * // => 'hi fred!'
	     *
	     * // using placeholders
	     * var bound = _.bind(greet, object, _, '!');
	     * bound('hi');
	     * // => 'hi fred!'
	     */
	    var bind = restParam(function(func, thisArg, partials) {
	      var bitmask = BIND_FLAG;
	      if (partials.length) {
	        var holders = replaceHolders(partials, bind.placeholder);
	        bitmask |= PARTIAL_FLAG;
	      }
	      return createWrapper(func, bitmask, thisArg, partials, holders);
	    });

	    /**
	     * Binds methods of an object to the object itself, overwriting the existing
	     * method. Method names may be specified as individual arguments or as arrays
	     * of method names. If no method names are provided all enumerable function
	     * properties, own and inherited, of `object` are bound.
	     *
	     * **Note:** This method does not set the "length" property of bound functions.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Object} object The object to bind and assign the bound methods to.
	     * @param {...(string|string[])} [methodNames] The object method names to bind,
	     *  specified as individual method names or arrays of method names.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * var view = {
	     *   'label': 'docs',
	     *   'onClick': function() {
	     *     console.log('clicked ' + this.label);
	     *   }
	     * };
	     *
	     * _.bindAll(view);
	     * jQuery('#docs').on('click', view.onClick);
	     * // => logs 'clicked docs' when the element is clicked
	     */
	    var bindAll = restParam(function(object, methodNames) {
	      methodNames = methodNames.length ? baseFlatten(methodNames) : functions(object);

	      var index = -1,
	          length = methodNames.length;

	      while (++index < length) {
	        var key = methodNames[index];
	        object[key] = createWrapper(object[key], BIND_FLAG, object);
	      }
	      return object;
	    });

	    /**
	     * Creates a function that invokes the method at `object[key]` and prepends
	     * any additional `_.bindKey` arguments to those provided to the bound function.
	     *
	     * This method differs from `_.bind` by allowing bound functions to reference
	     * methods that may be redefined or don't yet exist.
	     * See [Peter Michaux's article](http://peter.michaux.ca/articles/lazy-function-definition-pattern)
	     * for more details.
	     *
	     * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic
	     * builds, may be used as a placeholder for partially applied arguments.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Object} object The object the method belongs to.
	     * @param {string} key The key of the method.
	     * @param {...*} [partials] The arguments to be partially applied.
	     * @returns {Function} Returns the new bound function.
	     * @example
	     *
	     * var object = {
	     *   'user': 'fred',
	     *   'greet': function(greeting, punctuation) {
	     *     return greeting + ' ' + this.user + punctuation;
	     *   }
	     * };
	     *
	     * var bound = _.bindKey(object, 'greet', 'hi');
	     * bound('!');
	     * // => 'hi fred!'
	     *
	     * object.greet = function(greeting, punctuation) {
	     *   return greeting + 'ya ' + this.user + punctuation;
	     * };
	     *
	     * bound('!');
	     * // => 'hiya fred!'
	     *
	     * // using placeholders
	     * var bound = _.bindKey(object, 'greet', _, '!');
	     * bound('hi');
	     * // => 'hiya fred!'
	     */
	    var bindKey = restParam(function(object, key, partials) {
	      var bitmask = BIND_FLAG | BIND_KEY_FLAG;
	      if (partials.length) {
	        var holders = replaceHolders(partials, bindKey.placeholder);
	        bitmask |= PARTIAL_FLAG;
	      }
	      return createWrapper(key, bitmask, object, partials, holders);
	    });

	    /**
	     * Creates a function that accepts one or more arguments of `func` that when
	     * called either invokes `func` returning its result, if all `func` arguments
	     * have been provided, or returns a function that accepts one or more of the
	     * remaining `func` arguments, and so on. The arity of `func` may be specified
	     * if `func.length` is not sufficient.
	     *
	     * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,
	     * may be used as a placeholder for provided arguments.
	     *
	     * **Note:** This method does not set the "length" property of curried functions.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to curry.
	     * @param {number} [arity=func.length] The arity of `func`.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Function} Returns the new curried function.
	     * @example
	     *
	     * var abc = function(a, b, c) {
	     *   return [a, b, c];
	     * };
	     *
	     * var curried = _.curry(abc);
	     *
	     * curried(1)(2)(3);
	     * // => [1, 2, 3]
	     *
	     * curried(1, 2)(3);
	     * // => [1, 2, 3]
	     *
	     * curried(1, 2, 3);
	     * // => [1, 2, 3]
	     *
	     * // using placeholders
	     * curried(1)(_, 3)(2);
	     * // => [1, 2, 3]
	     */
	    var curry = createCurry(CURRY_FLAG);

	    /**
	     * This method is like `_.curry` except that arguments are applied to `func`
	     * in the manner of `_.partialRight` instead of `_.partial`.
	     *
	     * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic
	     * builds, may be used as a placeholder for provided arguments.
	     *
	     * **Note:** This method does not set the "length" property of curried functions.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to curry.
	     * @param {number} [arity=func.length] The arity of `func`.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Function} Returns the new curried function.
	     * @example
	     *
	     * var abc = function(a, b, c) {
	     *   return [a, b, c];
	     * };
	     *
	     * var curried = _.curryRight(abc);
	     *
	     * curried(3)(2)(1);
	     * // => [1, 2, 3]
	     *
	     * curried(2, 3)(1);
	     * // => [1, 2, 3]
	     *
	     * curried(1, 2, 3);
	     * // => [1, 2, 3]
	     *
	     * // using placeholders
	     * curried(3)(1, _)(2);
	     * // => [1, 2, 3]
	     */
	    var curryRight = createCurry(CURRY_RIGHT_FLAG);

	    /**
	     * Creates a debounced function that delays invoking `func` until after `wait`
	     * milliseconds have elapsed since the last time the debounced function was
	     * invoked. The debounced function comes with a `cancel` method to cancel
	     * delayed invocations. Provide an options object to indicate that `func`
	     * should be invoked on the leading and/or trailing edge of the `wait` timeout.
	     * Subsequent calls to the debounced function return the result of the last
	     * `func` invocation.
	     *
	     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
	     * on the trailing edge of the timeout only if the the debounced function is
	     * invoked more than once during the `wait` timeout.
	     *
	     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
	     * for details over the differences between `_.debounce` and `_.throttle`.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to debounce.
	     * @param {number} [wait=0] The number of milliseconds to delay.
	     * @param {Object} [options] The options object.
	     * @param {boolean} [options.leading=false] Specify invoking on the leading
	     *  edge of the timeout.
	     * @param {number} [options.maxWait] The maximum time `func` is allowed to be
	     *  delayed before it is invoked.
	     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
	     *  edge of the timeout.
	     * @returns {Function} Returns the new debounced function.
	     * @example
	     *
	     * // avoid costly calculations while the window size is in flux
	     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
	     *
	     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
	     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
	     *   'leading': true,
	     *   'trailing': false
	     * }));
	     *
	     * // ensure `batchLog` is invoked once after 1 second of debounced calls
	     * var source = new EventSource('/stream');
	     * jQuery(source).on('message', _.debounce(batchLog, 250, {
	     *   'maxWait': 1000
	     * }));
	     *
	     * // cancel a debounced call
	     * var todoChanges = _.debounce(batchLog, 1000);
	     * Object.observe(models.todo, todoChanges);
	     *
	     * Object.observe(models, function(changes) {
	     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
	     *     todoChanges.cancel();
	     *   }
	     * }, ['delete']);
	     *
	     * // ...at some point `models.todo` is changed
	     * models.todo.completed = true;
	     *
	     * // ...before 1 second has passed `models.todo` is deleted
	     * // which cancels the debounced `todoChanges` call
	     * delete models.todo;
	     */
	    function debounce(func, wait, options) {
	      var args,
	          maxTimeoutId,
	          result,
	          stamp,
	          thisArg,
	          timeoutId,
	          trailingCall,
	          lastCalled = 0,
	          maxWait = false,
	          trailing = true;

	      if (typeof func != 'function') {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      wait = wait < 0 ? 0 : (+wait || 0);
	      if (options === true) {
	        var leading = true;
	        trailing = false;
	      } else if (isObject(options)) {
	        leading = !!options.leading;
	        maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
	        trailing = 'trailing' in options ? !!options.trailing : trailing;
	      }

	      function cancel() {
	        if (timeoutId) {
	          clearTimeout(timeoutId);
	        }
	        if (maxTimeoutId) {
	          clearTimeout(maxTimeoutId);
	        }
	        lastCalled = 0;
	        maxTimeoutId = timeoutId = trailingCall = undefined;
	      }

	      function complete(isCalled, id) {
	        if (id) {
	          clearTimeout(id);
	        }
	        maxTimeoutId = timeoutId = trailingCall = undefined;
	        if (isCalled) {
	          lastCalled = now();
	          result = func.apply(thisArg, args);
	          if (!timeoutId && !maxTimeoutId) {
	            args = thisArg = undefined;
	          }
	        }
	      }

	      function delayed() {
	        var remaining = wait - (now() - stamp);
	        if (remaining <= 0 || remaining > wait) {
	          complete(trailingCall, maxTimeoutId);
	        } else {
	          timeoutId = setTimeout(delayed, remaining);
	        }
	      }

	      function maxDelayed() {
	        complete(trailing, timeoutId);
	      }

	      function debounced() {
	        args = arguments;
	        stamp = now();
	        thisArg = this;
	        trailingCall = trailing && (timeoutId || !leading);

	        if (maxWait === false) {
	          var leadingCall = leading && !timeoutId;
	        } else {
	          if (!maxTimeoutId && !leading) {
	            lastCalled = stamp;
	          }
	          var remaining = maxWait - (stamp - lastCalled),
	              isCalled = remaining <= 0 || remaining > maxWait;

	          if (isCalled) {
	            if (maxTimeoutId) {
	              maxTimeoutId = clearTimeout(maxTimeoutId);
	            }
	            lastCalled = stamp;
	            result = func.apply(thisArg, args);
	          }
	          else if (!maxTimeoutId) {
	            maxTimeoutId = setTimeout(maxDelayed, remaining);
	          }
	        }
	        if (isCalled && timeoutId) {
	          timeoutId = clearTimeout(timeoutId);
	        }
	        else if (!timeoutId && wait !== maxWait) {
	          timeoutId = setTimeout(delayed, wait);
	        }
	        if (leadingCall) {
	          isCalled = true;
	          result = func.apply(thisArg, args);
	        }
	        if (isCalled && !timeoutId && !maxTimeoutId) {
	          args = thisArg = undefined;
	        }
	        return result;
	      }
	      debounced.cancel = cancel;
	      return debounced;
	    }

	    /**
	     * Defers invoking the `func` until the current call stack has cleared. Any
	     * additional arguments are provided to `func` when it is invoked.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to defer.
	     * @param {...*} [args] The arguments to invoke the function with.
	     * @returns {number} Returns the timer id.
	     * @example
	     *
	     * _.defer(function(text) {
	     *   console.log(text);
	     * }, 'deferred');
	     * // logs 'deferred' after one or more milliseconds
	     */
	    var defer = restParam(function(func, args) {
	      return baseDelay(func, 1, args);
	    });

	    /**
	     * Invokes `func` after `wait` milliseconds. Any additional arguments are
	     * provided to `func` when it is invoked.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to delay.
	     * @param {number} wait The number of milliseconds to delay invocation.
	     * @param {...*} [args] The arguments to invoke the function with.
	     * @returns {number} Returns the timer id.
	     * @example
	     *
	     * _.delay(function(text) {
	     *   console.log(text);
	     * }, 1000, 'later');
	     * // => logs 'later' after one second
	     */
	    var delay = restParam(function(func, wait, args) {
	      return baseDelay(func, wait, args);
	    });

	    /**
	     * Creates a function that returns the result of invoking the provided
	     * functions with the `this` binding of the created function, where each
	     * successive invocation is supplied the return value of the previous.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {...Function} [funcs] Functions to invoke.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * function square(n) {
	     *   return n * n;
	     * }
	     *
	     * var addSquare = _.flow(_.add, square);
	     * addSquare(1, 2);
	     * // => 9
	     */
	    var flow = createFlow();

	    /**
	     * This method is like `_.flow` except that it creates a function that
	     * invokes the provided functions from right to left.
	     *
	     * @static
	     * @memberOf _
	     * @alias backflow, compose
	     * @category Function
	     * @param {...Function} [funcs] Functions to invoke.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * function square(n) {
	     *   return n * n;
	     * }
	     *
	     * var addSquare = _.flowRight(square, _.add);
	     * addSquare(1, 2);
	     * // => 9
	     */
	    var flowRight = createFlow(true);

	    /**
	     * Creates a function that memoizes the result of `func`. If `resolver` is
	     * provided it determines the cache key for storing the result based on the
	     * arguments provided to the memoized function. By default, the first argument
	     * provided to the memoized function is coerced to a string and used as the
	     * cache key. The `func` is invoked with the `this` binding of the memoized
	     * function.
	     *
	     * **Note:** The cache is exposed as the `cache` property on the memoized
	     * function. Its creation may be customized by replacing the `_.memoize.Cache`
	     * constructor with one whose instances implement the [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
	     * method interface of `get`, `has`, and `set`.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to have its output memoized.
	     * @param {Function} [resolver] The function to resolve the cache key.
	     * @returns {Function} Returns the new memoizing function.
	     * @example
	     *
	     * var upperCase = _.memoize(function(string) {
	     *   return string.toUpperCase();
	     * });
	     *
	     * upperCase('fred');
	     * // => 'FRED'
	     *
	     * // modifying the result cache
	     * upperCase.cache.set('fred', 'BARNEY');
	     * upperCase('fred');
	     * // => 'BARNEY'
	     *
	     * // replacing `_.memoize.Cache`
	     * var object = { 'user': 'fred' };
	     * var other = { 'user': 'barney' };
	     * var identity = _.memoize(_.identity);
	     *
	     * identity(object);
	     * // => { 'user': 'fred' }
	     * identity(other);
	     * // => { 'user': 'fred' }
	     *
	     * _.memoize.Cache = WeakMap;
	     * var identity = _.memoize(_.identity);
	     *
	     * identity(object);
	     * // => { 'user': 'fred' }
	     * identity(other);
	     * // => { 'user': 'barney' }
	     */
	    function memoize(func, resolver) {
	      if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      var memoized = function() {
	        var args = arguments,
	            key = resolver ? resolver.apply(this, args) : args[0],
	            cache = memoized.cache;

	        if (cache.has(key)) {
	          return cache.get(key);
	        }
	        var result = func.apply(this, args);
	        memoized.cache = cache.set(key, result);
	        return result;
	      };
	      memoized.cache = new memoize.Cache;
	      return memoized;
	    }

	    /**
	     * Creates a function that runs each argument through a corresponding
	     * transform function.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to wrap.
	     * @param {...(Function|Function[])} [transforms] The functions to transform
	     * arguments, specified as individual functions or arrays of functions.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * function doubled(n) {
	     *   return n * 2;
	     * }
	     *
	     * function square(n) {
	     *   return n * n;
	     * }
	     *
	     * var modded = _.modArgs(function(x, y) {
	     *   return [x, y];
	     * }, square, doubled);
	     *
	     * modded(1, 2);
	     * // => [1, 4]
	     *
	     * modded(5, 10);
	     * // => [25, 20]
	     */
	    var modArgs = restParam(function(func, transforms) {
	      transforms = baseFlatten(transforms);
	      if (typeof func != 'function' || !arrayEvery(transforms, baseIsFunction)) {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      var length = transforms.length;
	      return restParam(function(args) {
	        var index = nativeMin(args.length, length);
	        while (index--) {
	          args[index] = transforms[index](args[index]);
	        }
	        return func.apply(this, args);
	      });
	    });

	    /**
	     * Creates a function that negates the result of the predicate `func`. The
	     * `func` predicate is invoked with the `this` binding and arguments of the
	     * created function.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} predicate The predicate to negate.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * function isEven(n) {
	     *   return n % 2 == 0;
	     * }
	     *
	     * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
	     * // => [1, 3, 5]
	     */
	    function negate(predicate) {
	      if (typeof predicate != 'function') {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      return function() {
	        return !predicate.apply(this, arguments);
	      };
	    }

	    /**
	     * Creates a function that is restricted to invoking `func` once. Repeat calls
	     * to the function return the value of the first call. The `func` is invoked
	     * with the `this` binding and arguments of the created function.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to restrict.
	     * @returns {Function} Returns the new restricted function.
	     * @example
	     *
	     * var initialize = _.once(createApplication);
	     * initialize();
	     * initialize();
	     * // `initialize` invokes `createApplication` once
	     */
	    function once(func) {
	      return before(2, func);
	    }

	    /**
	     * Creates a function that invokes `func` with `partial` arguments prepended
	     * to those provided to the new function. This method is like `_.bind` except
	     * it does **not** alter the `this` binding.
	     *
	     * The `_.partial.placeholder` value, which defaults to `_` in monolithic
	     * builds, may be used as a placeholder for partially applied arguments.
	     *
	     * **Note:** This method does not set the "length" property of partially
	     * applied functions.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to partially apply arguments to.
	     * @param {...*} [partials] The arguments to be partially applied.
	     * @returns {Function} Returns the new partially applied function.
	     * @example
	     *
	     * var greet = function(greeting, name) {
	     *   return greeting + ' ' + name;
	     * };
	     *
	     * var sayHelloTo = _.partial(greet, 'hello');
	     * sayHelloTo('fred');
	     * // => 'hello fred'
	     *
	     * // using placeholders
	     * var greetFred = _.partial(greet, _, 'fred');
	     * greetFred('hi');
	     * // => 'hi fred'
	     */
	    var partial = createPartial(PARTIAL_FLAG);

	    /**
	     * This method is like `_.partial` except that partially applied arguments
	     * are appended to those provided to the new function.
	     *
	     * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic
	     * builds, may be used as a placeholder for partially applied arguments.
	     *
	     * **Note:** This method does not set the "length" property of partially
	     * applied functions.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to partially apply arguments to.
	     * @param {...*} [partials] The arguments to be partially applied.
	     * @returns {Function} Returns the new partially applied function.
	     * @example
	     *
	     * var greet = function(greeting, name) {
	     *   return greeting + ' ' + name;
	     * };
	     *
	     * var greetFred = _.partialRight(greet, 'fred');
	     * greetFred('hi');
	     * // => 'hi fred'
	     *
	     * // using placeholders
	     * var sayHelloTo = _.partialRight(greet, 'hello', _);
	     * sayHelloTo('fred');
	     * // => 'hello fred'
	     */
	    var partialRight = createPartial(PARTIAL_RIGHT_FLAG);

	    /**
	     * Creates a function that invokes `func` with arguments arranged according
	     * to the specified indexes where the argument value at the first index is
	     * provided as the first argument, the argument value at the second index is
	     * provided as the second argument, and so on.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to rearrange arguments for.
	     * @param {...(number|number[])} indexes The arranged argument indexes,
	     *  specified as individual indexes or arrays of indexes.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var rearged = _.rearg(function(a, b, c) {
	     *   return [a, b, c];
	     * }, 2, 0, 1);
	     *
	     * rearged('b', 'c', 'a')
	     * // => ['a', 'b', 'c']
	     *
	     * var map = _.rearg(_.map, [1, 0]);
	     * map(function(n) {
	     *   return n * 3;
	     * }, [1, 2, 3]);
	     * // => [3, 6, 9]
	     */
	    var rearg = restParam(function(func, indexes) {
	      return createWrapper(func, REARG_FLAG, undefined, undefined, undefined, baseFlatten(indexes));
	    });

	    /**
	     * Creates a function that invokes `func` with the `this` binding of the
	     * created function and arguments from `start` and beyond provided as an array.
	     *
	     * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to apply a rest parameter to.
	     * @param {number} [start=func.length-1] The start position of the rest parameter.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var say = _.restParam(function(what, names) {
	     *   return what + ' ' + _.initial(names).join(', ') +
	     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
	     * });
	     *
	     * say('hello', 'fred', 'barney', 'pebbles');
	     * // => 'hello fred, barney, & pebbles'
	     */
	    function restParam(func, start) {
	      if (typeof func != 'function') {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
	      return function() {
	        var args = arguments,
	            index = -1,
	            length = nativeMax(args.length - start, 0),
	            rest = Array(length);

	        while (++index < length) {
	          rest[index] = args[start + index];
	        }
	        switch (start) {
	          case 0: return func.call(this, rest);
	          case 1: return func.call(this, args[0], rest);
	          case 2: return func.call(this, args[0], args[1], rest);
	        }
	        var otherArgs = Array(start + 1);
	        index = -1;
	        while (++index < start) {
	          otherArgs[index] = args[index];
	        }
	        otherArgs[start] = rest;
	        return func.apply(this, otherArgs);
	      };
	    }

	    /**
	     * Creates a function that invokes `func` with the `this` binding of the created
	     * function and an array of arguments much like [`Function#apply`](https://es5.github.io/#x15.3.4.3).
	     *
	     * **Note:** This method is based on the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator).
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to spread arguments over.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var say = _.spread(function(who, what) {
	     *   return who + ' says ' + what;
	     * });
	     *
	     * say(['fred', 'hello']);
	     * // => 'fred says hello'
	     *
	     * // with a Promise
	     * var numbers = Promise.all([
	     *   Promise.resolve(40),
	     *   Promise.resolve(36)
	     * ]);
	     *
	     * numbers.then(_.spread(function(x, y) {
	     *   return x + y;
	     * }));
	     * // => a Promise of 76
	     */
	    function spread(func) {
	      if (typeof func != 'function') {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      return function(array) {
	        return func.apply(this, array);
	      };
	    }

	    /**
	     * Creates a throttled function that only invokes `func` at most once per
	     * every `wait` milliseconds. The throttled function comes with a `cancel`
	     * method to cancel delayed invocations. Provide an options object to indicate
	     * that `func` should be invoked on the leading and/or trailing edge of the
	     * `wait` timeout. Subsequent calls to the throttled function return the
	     * result of the last `func` call.
	     *
	     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
	     * on the trailing edge of the timeout only if the the throttled function is
	     * invoked more than once during the `wait` timeout.
	     *
	     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
	     * for details over the differences between `_.throttle` and `_.debounce`.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {Function} func The function to throttle.
	     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
	     * @param {Object} [options] The options object.
	     * @param {boolean} [options.leading=true] Specify invoking on the leading
	     *  edge of the timeout.
	     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
	     *  edge of the timeout.
	     * @returns {Function} Returns the new throttled function.
	     * @example
	     *
	     * // avoid excessively updating the position while scrolling
	     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
	     *
	     * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes
	     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
	     *   'trailing': false
	     * }));
	     *
	     * // cancel a trailing throttled call
	     * jQuery(window).on('popstate', throttled.cancel);
	     */
	    function throttle(func, wait, options) {
	      var leading = true,
	          trailing = true;

	      if (typeof func != 'function') {
	        throw new TypeError(FUNC_ERROR_TEXT);
	      }
	      if (options === false) {
	        leading = false;
	      } else if (isObject(options)) {
	        leading = 'leading' in options ? !!options.leading : leading;
	        trailing = 'trailing' in options ? !!options.trailing : trailing;
	      }
	      return debounce(func, wait, { 'leading': leading, 'maxWait': +wait, 'trailing': trailing });
	    }

	    /**
	     * Creates a function that provides `value` to the wrapper function as its
	     * first argument. Any additional arguments provided to the function are
	     * appended to those provided to the wrapper function. The wrapper is invoked
	     * with the `this` binding of the created function.
	     *
	     * @static
	     * @memberOf _
	     * @category Function
	     * @param {*} value The value to wrap.
	     * @param {Function} wrapper The wrapper function.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var p = _.wrap(_.escape, function(func, text) {
	     *   return '<p>' + func(text) + '</p>';
	     * });
	     *
	     * p('fred, barney, & pebbles');
	     * // => '<p>fred, barney, &amp; pebbles</p>'
	     */
	    function wrap(value, wrapper) {
	      wrapper = wrapper == null ? identity : wrapper;
	      return createWrapper(wrapper, PARTIAL_FLAG, undefined, [value], []);
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
	     * otherwise they are assigned by reference. If `customizer` is provided it is
	     * invoked to produce the cloned values. If `customizer` returns `undefined`
	     * cloning is handled by the method instead. The `customizer` is bound to
	     * `thisArg` and invoked with two argument; (value [, index|key, object]).
	     *
	     * **Note:** This method is loosely based on the
	     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
	     * The enumerable properties of `arguments` objects and objects created by
	     * constructors other than `Object` are cloned to plain `Object` objects. An
	     * empty object is returned for uncloneable values such as functions, DOM nodes,
	     * Maps, Sets, and WeakMaps.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to clone.
	     * @param {boolean} [isDeep] Specify a deep clone.
	     * @param {Function} [customizer] The function to customize cloning values.
	     * @param {*} [thisArg] The `this` binding of `customizer`.
	     * @returns {*} Returns the cloned value.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney' },
	     *   { 'user': 'fred' }
	     * ];
	     *
	     * var shallow = _.clone(users);
	     * shallow[0] === users[0];
	     * // => true
	     *
	     * var deep = _.clone(users, true);
	     * deep[0] === users[0];
	     * // => false
	     *
	     * // using a customizer callback
	     * var el = _.clone(document.body, function(value) {
	     *   if (_.isElement(value)) {
	     *     return value.cloneNode(false);
	     *   }
	     * });
	     *
	     * el === document.body
	     * // => false
	     * el.nodeName
	     * // => BODY
	     * el.childNodes.length;
	     * // => 0
	     */
	    function clone(value, isDeep, customizer, thisArg) {
	      if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
	        isDeep = false;
	      }
	      else if (typeof isDeep == 'function') {
	        thisArg = customizer;
	        customizer = isDeep;
	        isDeep = false;
	      }
	      return typeof customizer == 'function'
	        ? baseClone(value, isDeep, bindCallback(customizer, thisArg, 1))
	        : baseClone(value, isDeep);
	    }

	    /**
	     * Creates a deep clone of `value`. If `customizer` is provided it is invoked
	     * to produce the cloned values. If `customizer` returns `undefined` cloning
	     * is handled by the method instead. The `customizer` is bound to `thisArg`
	     * and invoked with two argument; (value [, index|key, object]).
	     *
	     * **Note:** This method is loosely based on the
	     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
	     * The enumerable properties of `arguments` objects and objects created by
	     * constructors other than `Object` are cloned to plain `Object` objects. An
	     * empty object is returned for uncloneable values such as functions, DOM nodes,
	     * Maps, Sets, and WeakMaps.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to deep clone.
	     * @param {Function} [customizer] The function to customize cloning values.
	     * @param {*} [thisArg] The `this` binding of `customizer`.
	     * @returns {*} Returns the deep cloned value.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney' },
	     *   { 'user': 'fred' }
	     * ];
	     *
	     * var deep = _.cloneDeep(users);
	     * deep[0] === users[0];
	     * // => false
	     *
	     * // using a customizer callback
	     * var el = _.cloneDeep(document.body, function(value) {
	     *   if (_.isElement(value)) {
	     *     return value.cloneNode(true);
	     *   }
	     * });
	     *
	     * el === document.body
	     * // => false
	     * el.nodeName
	     * // => BODY
	     * el.childNodes.length;
	     * // => 20
	     */
	    function cloneDeep(value, customizer, thisArg) {
	      return typeof customizer == 'function'
	        ? baseClone(value, true, bindCallback(customizer, thisArg, 1))
	        : baseClone(value, true);
	    }

	    /**
	     * Checks if `value` is greater than `other`.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to compare.
	     * @param {*} other The other value to compare.
	     * @returns {boolean} Returns `true` if `value` is greater than `other`, else `false`.
	     * @example
	     *
	     * _.gt(3, 1);
	     * // => true
	     *
	     * _.gt(3, 3);
	     * // => false
	     *
	     * _.gt(1, 3);
	     * // => false
	     */
	    function gt(value, other) {
	      return value > other;
	    }

	    /**
	     * Checks if `value` is greater than or equal to `other`.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to compare.
	     * @param {*} other The other value to compare.
	     * @returns {boolean} Returns `true` if `value` is greater than or equal to `other`, else `false`.
	     * @example
	     *
	     * _.gte(3, 1);
	     * // => true
	     *
	     * _.gte(3, 3);
	     * // => true
	     *
	     * _.gte(1, 3);
	     * // => false
	     */
	    function gte(value, other) {
	      return value >= other;
	    }

	    /**
	     * Checks if `value` is classified as an `arguments` object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isArguments(function() { return arguments; }());
	     * // => true
	     *
	     * _.isArguments([1, 2, 3]);
	     * // => false
	     */
	    function isArguments(value) {
	      return isObjectLike(value) && isArrayLike(value) &&
	        hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
	    }

	    /**
	     * Checks if `value` is classified as an `Array` object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isArray([1, 2, 3]);
	     * // => true
	     *
	     * _.isArray(function() { return arguments; }());
	     * // => false
	     */
	    var isArray = nativeIsArray || function(value) {
	      return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
	    };

	    /**
	     * Checks if `value` is classified as a boolean primitive or object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isBoolean(false);
	     * // => true
	     *
	     * _.isBoolean(null);
	     * // => false
	     */
	    function isBoolean(value) {
	      return value === true || value === false || (isObjectLike(value) && objToString.call(value) == boolTag);
	    }

	    /**
	     * Checks if `value` is classified as a `Date` object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isDate(new Date);
	     * // => true
	     *
	     * _.isDate('Mon April 23 2012');
	     * // => false
	     */
	    function isDate(value) {
	      return isObjectLike(value) && objToString.call(value) == dateTag;
	    }

	    /**
	     * Checks if `value` is a DOM element.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
	     * @example
	     *
	     * _.isElement(document.body);
	     * // => true
	     *
	     * _.isElement('<body>');
	     * // => false
	     */
	    function isElement(value) {
	      return !!value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value);
	    }

	    /**
	     * Checks if `value` is empty. A value is considered empty unless it is an
	     * `arguments` object, array, string, or jQuery-like collection with a length
	     * greater than `0` or an object with own enumerable properties.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {Array|Object|string} value The value to inspect.
	     * @returns {boolean} Returns `true` if `value` is empty, else `false`.
	     * @example
	     *
	     * _.isEmpty(null);
	     * // => true
	     *
	     * _.isEmpty(true);
	     * // => true
	     *
	     * _.isEmpty(1);
	     * // => true
	     *
	     * _.isEmpty([1, 2, 3]);
	     * // => false
	     *
	     * _.isEmpty({ 'a': 1 });
	     * // => false
	     */
	    function isEmpty(value) {
	      if (value == null) {
	        return true;
	      }
	      if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) ||
	          (isObjectLike(value) && isFunction(value.splice)))) {
	        return !value.length;
	      }
	      return !keys(value).length;
	    }

	    /**
	     * Performs a deep comparison between two values to determine if they are
	     * equivalent. If `customizer` is provided it is invoked to compare values.
	     * If `customizer` returns `undefined` comparisons are handled by the method
	     * instead. The `customizer` is bound to `thisArg` and invoked with three
	     * arguments: (value, other [, index|key]).
	     *
	     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
	     * numbers, `Object` objects, regexes, and strings. Objects are compared by
	     * their own, not inherited, enumerable properties. Functions and DOM nodes
	     * are **not** supported. Provide a customizer function to extend support
	     * for comparing other values.
	     *
	     * @static
	     * @memberOf _
	     * @alias eq
	     * @category Lang
	     * @param {*} value The value to compare.
	     * @param {*} other The other value to compare.
	     * @param {Function} [customizer] The function to customize value comparisons.
	     * @param {*} [thisArg] The `this` binding of `customizer`.
	     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	     * @example
	     *
	     * var object = { 'user': 'fred' };
	     * var other = { 'user': 'fred' };
	     *
	     * object == other;
	     * // => false
	     *
	     * _.isEqual(object, other);
	     * // => true
	     *
	     * // using a customizer callback
	     * var array = ['hello', 'goodbye'];
	     * var other = ['hi', 'goodbye'];
	     *
	     * _.isEqual(array, other, function(value, other) {
	     *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
	     *     return true;
	     *   }
	     * });
	     * // => true
	     */
	    function isEqual(value, other, customizer, thisArg) {
	      customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
	      var result = customizer ? customizer(value, other) : undefined;
	      return  result === undefined ? baseIsEqual(value, other, customizer) : !!result;
	    }

	    /**
	     * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
	     * `SyntaxError`, `TypeError`, or `URIError` object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
	     * @example
	     *
	     * _.isError(new Error);
	     * // => true
	     *
	     * _.isError(Error);
	     * // => false
	     */
	    function isError(value) {
	      return isObjectLike(value) && typeof value.message == 'string' && objToString.call(value) == errorTag;
	    }

	    /**
	     * Checks if `value` is a finite primitive number.
	     *
	     * **Note:** This method is based on [`Number.isFinite`](http://ecma-international.org/ecma-262/6.0/#sec-number.isfinite).
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
	     * @example
	     *
	     * _.isFinite(10);
	     * // => true
	     *
	     * _.isFinite('10');
	     * // => false
	     *
	     * _.isFinite(true);
	     * // => false
	     *
	     * _.isFinite(Object(10));
	     * // => false
	     *
	     * _.isFinite(Infinity);
	     * // => false
	     */
	    function isFinite(value) {
	      return typeof value == 'number' && nativeIsFinite(value);
	    }

	    /**
	     * Checks if `value` is classified as a `Function` object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isFunction(_);
	     * // => true
	     *
	     * _.isFunction(/abc/);
	     * // => false
	     */
	    function isFunction(value) {
	      // The use of `Object#toString` avoids issues with the `typeof` operator
	      // in older versions of Chrome and Safari which return 'function' for regexes
	      // and Safari 8 equivalents which return 'object' for typed array constructors.
	      return isObject(value) && objToString.call(value) == funcTag;
	    }

	    /**
	     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
	     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	     * @example
	     *
	     * _.isObject({});
	     * // => true
	     *
	     * _.isObject([1, 2, 3]);
	     * // => true
	     *
	     * _.isObject(1);
	     * // => false
	     */
	    function isObject(value) {
	      // Avoid a V8 JIT bug in Chrome 19-20.
	      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
	      var type = typeof value;
	      return !!value && (type == 'object' || type == 'function');
	    }

	    /**
	     * Performs a deep comparison between `object` and `source` to determine if
	     * `object` contains equivalent property values. If `customizer` is provided
	     * it is invoked to compare values. If `customizer` returns `undefined`
	     * comparisons are handled by the method instead. The `customizer` is bound
	     * to `thisArg` and invoked with three arguments: (value, other, index|key).
	     *
	     * **Note:** This method supports comparing properties of arrays, booleans,
	     * `Date` objects, numbers, `Object` objects, regexes, and strings. Functions
	     * and DOM nodes are **not** supported. Provide a customizer function to extend
	     * support for comparing other values.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {Object} object The object to inspect.
	     * @param {Object} source The object of property values to match.
	     * @param {Function} [customizer] The function to customize value comparisons.
	     * @param {*} [thisArg] The `this` binding of `customizer`.
	     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
	     * @example
	     *
	     * var object = { 'user': 'fred', 'age': 40 };
	     *
	     * _.isMatch(object, { 'age': 40 });
	     * // => true
	     *
	     * _.isMatch(object, { 'age': 36 });
	     * // => false
	     *
	     * // using a customizer callback
	     * var object = { 'greeting': 'hello' };
	     * var source = { 'greeting': 'hi' };
	     *
	     * _.isMatch(object, source, function(value, other) {
	     *   return _.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/) || undefined;
	     * });
	     * // => true
	     */
	    function isMatch(object, source, customizer, thisArg) {
	      customizer = typeof customizer == 'function' ? bindCallback(customizer, thisArg, 3) : undefined;
	      return baseIsMatch(object, getMatchData(source), customizer);
	    }

	    /**
	     * Checks if `value` is `NaN`.
	     *
	     * **Note:** This method is not the same as [`isNaN`](https://es5.github.io/#x15.1.2.4)
	     * which returns `true` for `undefined` and other non-numeric values.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
	     * @example
	     *
	     * _.isNaN(NaN);
	     * // => true
	     *
	     * _.isNaN(new Number(NaN));
	     * // => true
	     *
	     * isNaN(undefined);
	     * // => true
	     *
	     * _.isNaN(undefined);
	     * // => false
	     */
	    function isNaN(value) {
	      // An `NaN` primitive is the only value that is not equal to itself.
	      // Perform the `toStringTag` check first to avoid errors with some host objects in IE.
	      return isNumber(value) && value != +value;
	    }

	    /**
	     * Checks if `value` is a native function.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
	     * @example
	     *
	     * _.isNative(Array.prototype.push);
	     * // => true
	     *
	     * _.isNative(_);
	     * // => false
	     */
	    function isNative(value) {
	      if (value == null) {
	        return false;
	      }
	      if (isFunction(value)) {
	        return reIsNative.test(fnToString.call(value));
	      }
	      return isObjectLike(value) && reIsHostCtor.test(value);
	    }

	    /**
	     * Checks if `value` is `null`.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
	     * @example
	     *
	     * _.isNull(null);
	     * // => true
	     *
	     * _.isNull(void 0);
	     * // => false
	     */
	    function isNull(value) {
	      return value === null;
	    }

	    /**
	     * Checks if `value` is classified as a `Number` primitive or object.
	     *
	     * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
	     * as numbers, use the `_.isFinite` method.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isNumber(8.4);
	     * // => true
	     *
	     * _.isNumber(NaN);
	     * // => true
	     *
	     * _.isNumber('8.4');
	     * // => false
	     */
	    function isNumber(value) {
	      return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
	    }

	    /**
	     * Checks if `value` is a plain object, that is, an object created by the
	     * `Object` constructor or one with a `[[Prototype]]` of `null`.
	     *
	     * **Note:** This method assumes objects created by the `Object` constructor
	     * have no inherited enumerable properties.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     * }
	     *
	     * _.isPlainObject(new Foo);
	     * // => false
	     *
	     * _.isPlainObject([1, 2, 3]);
	     * // => false
	     *
	     * _.isPlainObject({ 'x': 0, 'y': 0 });
	     * // => true
	     *
	     * _.isPlainObject(Object.create(null));
	     * // => true
	     */
	    function isPlainObject(value) {
	      var Ctor;

	      // Exit early for non `Object` objects.
	      if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
	          (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
	        return false;
	      }
	      // IE < 9 iterates inherited properties before own properties. If the first
	      // iterated property is an object's own property then there are no inherited
	      // enumerable properties.
	      var result;
	      // In most environments an object's own properties are iterated before
	      // its inherited properties. If the last iterated property is an object's
	      // own property then there are no inherited enumerable properties.
	      baseForIn(value, function(subValue, key) {
	        result = key;
	      });
	      return result === undefined || hasOwnProperty.call(value, result);
	    }

	    /**
	     * Checks if `value` is classified as a `RegExp` object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isRegExp(/abc/);
	     * // => true
	     *
	     * _.isRegExp('/abc/');
	     * // => false
	     */
	    function isRegExp(value) {
	      return isObject(value) && objToString.call(value) == regexpTag;
	    }

	    /**
	     * Checks if `value` is classified as a `String` primitive or object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isString('abc');
	     * // => true
	     *
	     * _.isString(1);
	     * // => false
	     */
	    function isString(value) {
	      return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
	    }

	    /**
	     * Checks if `value` is classified as a typed array.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
	     * @example
	     *
	     * _.isTypedArray(new Uint8Array);
	     * // => true
	     *
	     * _.isTypedArray([]);
	     * // => false
	     */
	    function isTypedArray(value) {
	      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
	    }

	    /**
	     * Checks if `value` is `undefined`.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
	     * @example
	     *
	     * _.isUndefined(void 0);
	     * // => true
	     *
	     * _.isUndefined(null);
	     * // => false
	     */
	    function isUndefined(value) {
	      return value === undefined;
	    }

	    /**
	     * Checks if `value` is less than `other`.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to compare.
	     * @param {*} other The other value to compare.
	     * @returns {boolean} Returns `true` if `value` is less than `other`, else `false`.
	     * @example
	     *
	     * _.lt(1, 3);
	     * // => true
	     *
	     * _.lt(3, 3);
	     * // => false
	     *
	     * _.lt(3, 1);
	     * // => false
	     */
	    function lt(value, other) {
	      return value < other;
	    }

	    /**
	     * Checks if `value` is less than or equal to `other`.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to compare.
	     * @param {*} other The other value to compare.
	     * @returns {boolean} Returns `true` if `value` is less than or equal to `other`, else `false`.
	     * @example
	     *
	     * _.lte(1, 3);
	     * // => true
	     *
	     * _.lte(3, 3);
	     * // => true
	     *
	     * _.lte(3, 1);
	     * // => false
	     */
	    function lte(value, other) {
	      return value <= other;
	    }

	    /**
	     * Converts `value` to an array.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to convert.
	     * @returns {Array} Returns the converted array.
	     * @example
	     *
	     * (function() {
	     *   return _.toArray(arguments).slice(1);
	     * }(1, 2, 3));
	     * // => [2, 3]
	     */
	    function toArray(value) {
	      var length = value ? getLength(value) : 0;
	      if (!isLength(length)) {
	        return values(value);
	      }
	      if (!length) {
	        return [];
	      }
	      return arrayCopy(value);
	    }

	    /**
	     * Converts `value` to a plain object flattening inherited enumerable
	     * properties of `value` to own properties of the plain object.
	     *
	     * @static
	     * @memberOf _
	     * @category Lang
	     * @param {*} value The value to convert.
	     * @returns {Object} Returns the converted plain object.
	     * @example
	     *
	     * function Foo() {
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.assign({ 'a': 1 }, new Foo);
	     * // => { 'a': 1, 'b': 2 }
	     *
	     * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
	     * // => { 'a': 1, 'b': 2, 'c': 3 }
	     */
	    function toPlainObject(value) {
	      return baseCopy(value, keysIn(value));
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Recursively merges own enumerable properties of the source object(s), that
	     * don't resolve to `undefined` into the destination object. Subsequent sources
	     * overwrite property assignments of previous sources. If `customizer` is
	     * provided it is invoked to produce the merged values of the destination and
	     * source properties. If `customizer` returns `undefined` merging is handled
	     * by the method instead. The `customizer` is bound to `thisArg` and invoked
	     * with five arguments: (objectValue, sourceValue, key, object, source).
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The destination object.
	     * @param {...Object} [sources] The source objects.
	     * @param {Function} [customizer] The function to customize assigned values.
	     * @param {*} [thisArg] The `this` binding of `customizer`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * var users = {
	     *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
	     * };
	     *
	     * var ages = {
	     *   'data': [{ 'age': 36 }, { 'age': 40 }]
	     * };
	     *
	     * _.merge(users, ages);
	     * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
	     *
	     * // using a customizer callback
	     * var object = {
	     *   'fruits': ['apple'],
	     *   'vegetables': ['beet']
	     * };
	     *
	     * var other = {
	     *   'fruits': ['banana'],
	     *   'vegetables': ['carrot']
	     * };
	     *
	     * _.merge(object, other, function(a, b) {
	     *   if (_.isArray(a)) {
	     *     return a.concat(b);
	     *   }
	     * });
	     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
	     */
	    var merge = createAssigner(baseMerge);

	    /**
	     * Assigns own enumerable properties of source object(s) to the destination
	     * object. Subsequent sources overwrite property assignments of previous sources.
	     * If `customizer` is provided it is invoked to produce the assigned values.
	     * The `customizer` is bound to `thisArg` and invoked with five arguments:
	     * (objectValue, sourceValue, key, object, source).
	     *
	     * **Note:** This method mutates `object` and is based on
	     * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
	     *
	     * @static
	     * @memberOf _
	     * @alias extend
	     * @category Object
	     * @param {Object} object The destination object.
	     * @param {...Object} [sources] The source objects.
	     * @param {Function} [customizer] The function to customize assigned values.
	     * @param {*} [thisArg] The `this` binding of `customizer`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
	     * // => { 'user': 'fred', 'age': 40 }
	     *
	     * // using a customizer callback
	     * var defaults = _.partialRight(_.assign, function(value, other) {
	     *   return _.isUndefined(value) ? other : value;
	     * });
	     *
	     * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
	     * // => { 'user': 'barney', 'age': 36 }
	     */
	    var assign = createAssigner(function(object, source, customizer) {
	      return customizer
	        ? assignWith(object, source, customizer)
	        : baseAssign(object, source);
	    });

	    /**
	     * Creates an object that inherits from the given `prototype` object. If a
	     * `properties` object is provided its own enumerable properties are assigned
	     * to the created object.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} prototype The object to inherit from.
	     * @param {Object} [properties] The properties to assign to the object.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Object} Returns the new object.
	     * @example
	     *
	     * function Shape() {
	     *   this.x = 0;
	     *   this.y = 0;
	     * }
	     *
	     * function Circle() {
	     *   Shape.call(this);
	     * }
	     *
	     * Circle.prototype = _.create(Shape.prototype, {
	     *   'constructor': Circle
	     * });
	     *
	     * var circle = new Circle;
	     * circle instanceof Circle;
	     * // => true
	     *
	     * circle instanceof Shape;
	     * // => true
	     */
	    function create(prototype, properties, guard) {
	      var result = baseCreate(prototype);
	      if (guard && isIterateeCall(prototype, properties, guard)) {
	        properties = undefined;
	      }
	      return properties ? baseAssign(result, properties) : result;
	    }

	    /**
	     * Assigns own enumerable properties of source object(s) to the destination
	     * object for all destination properties that resolve to `undefined`. Once a
	     * property is set, additional values of the same property are ignored.
	     *
	     * **Note:** This method mutates `object`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The destination object.
	     * @param {...Object} [sources] The source objects.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
	     * // => { 'user': 'barney', 'age': 36 }
	     */
	    var defaults = createDefaults(assign, assignDefaults);

	    /**
	     * This method is like `_.defaults` except that it recursively assigns
	     * default properties.
	     *
	     * **Note:** This method mutates `object`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The destination object.
	     * @param {...Object} [sources] The source objects.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * _.defaultsDeep({ 'user': { 'name': 'barney' } }, { 'user': { 'name': 'fred', 'age': 36 } });
	     * // => { 'user': { 'name': 'barney', 'age': 36 } }
	     *
	     */
	    var defaultsDeep = createDefaults(merge, mergeDefaults);

	    /**
	     * This method is like `_.find` except that it returns the key of the first
	     * element `predicate` returns truthy for instead of the element itself.
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to search.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
	     * @example
	     *
	     * var users = {
	     *   'barney':  { 'age': 36, 'active': true },
	     *   'fred':    { 'age': 40, 'active': false },
	     *   'pebbles': { 'age': 1,  'active': true }
	     * };
	     *
	     * _.findKey(users, function(chr) {
	     *   return chr.age < 40;
	     * });
	     * // => 'barney' (iteration order is not guaranteed)
	     *
	     * // using the `_.matches` callback shorthand
	     * _.findKey(users, { 'age': 1, 'active': true });
	     * // => 'pebbles'
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.findKey(users, 'active', false);
	     * // => 'fred'
	     *
	     * // using the `_.property` callback shorthand
	     * _.findKey(users, 'active');
	     * // => 'barney'
	     */
	    var findKey = createFindKey(baseForOwn);

	    /**
	     * This method is like `_.findKey` except that it iterates over elements of
	     * a collection in the opposite order.
	     *
	     * If a property name is provided for `predicate` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `predicate` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to search.
	     * @param {Function|Object|string} [predicate=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
	     * @example
	     *
	     * var users = {
	     *   'barney':  { 'age': 36, 'active': true },
	     *   'fred':    { 'age': 40, 'active': false },
	     *   'pebbles': { 'age': 1,  'active': true }
	     * };
	     *
	     * _.findLastKey(users, function(chr) {
	     *   return chr.age < 40;
	     * });
	     * // => returns `pebbles` assuming `_.findKey` returns `barney`
	     *
	     * // using the `_.matches` callback shorthand
	     * _.findLastKey(users, { 'age': 36, 'active': true });
	     * // => 'barney'
	     *
	     * // using the `_.matchesProperty` callback shorthand
	     * _.findLastKey(users, 'active', false);
	     * // => 'fred'
	     *
	     * // using the `_.property` callback shorthand
	     * _.findLastKey(users, 'active');
	     * // => 'pebbles'
	     */
	    var findLastKey = createFindKey(baseForOwnRight);

	    /**
	     * Iterates over own and inherited enumerable properties of an object invoking
	     * `iteratee` for each property. The `iteratee` is bound to `thisArg` and invoked
	     * with three arguments: (value, key, object). Iteratee functions may exit
	     * iteration early by explicitly returning `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.forIn(new Foo, function(value, key) {
	     *   console.log(key);
	     * });
	     * // => logs 'a', 'b', and 'c' (iteration order is not guaranteed)
	     */
	    var forIn = createForIn(baseFor);

	    /**
	     * This method is like `_.forIn` except that it iterates over properties of
	     * `object` in the opposite order.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.forInRight(new Foo, function(value, key) {
	     *   console.log(key);
	     * });
	     * // => logs 'c', 'b', and 'a' assuming `_.forIn ` logs 'a', 'b', and 'c'
	     */
	    var forInRight = createForIn(baseForRight);

	    /**
	     * Iterates over own enumerable properties of an object invoking `iteratee`
	     * for each property. The `iteratee` is bound to `thisArg` and invoked with
	     * three arguments: (value, key, object). Iteratee functions may exit iteration
	     * early by explicitly returning `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.forOwn(new Foo, function(value, key) {
	     *   console.log(key);
	     * });
	     * // => logs 'a' and 'b' (iteration order is not guaranteed)
	     */
	    var forOwn = createForOwn(baseForOwn);

	    /**
	     * This method is like `_.forOwn` except that it iterates over properties of
	     * `object` in the opposite order.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.forOwnRight(new Foo, function(value, key) {
	     *   console.log(key);
	     * });
	     * // => logs 'b' and 'a' assuming `_.forOwn` logs 'a' and 'b'
	     */
	    var forOwnRight = createForOwn(baseForOwnRight);

	    /**
	     * Creates an array of function property names from all enumerable properties,
	     * own and inherited, of `object`.
	     *
	     * @static
	     * @memberOf _
	     * @alias methods
	     * @category Object
	     * @param {Object} object The object to inspect.
	     * @returns {Array} Returns the new array of property names.
	     * @example
	     *
	     * _.functions(_);
	     * // => ['after', 'ary', 'assign', ...]
	     */
	    function functions(object) {
	      return baseFunctions(object, keysIn(object));
	    }

	    /**
	     * Gets the property value at `path` of `object`. If the resolved value is
	     * `undefined` the `defaultValue` is used in its place.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to query.
	     * @param {Array|string} path The path of the property to get.
	     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
	     * @returns {*} Returns the resolved value.
	     * @example
	     *
	     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	     *
	     * _.get(object, 'a[0].b.c');
	     * // => 3
	     *
	     * _.get(object, ['a', '0', 'b', 'c']);
	     * // => 3
	     *
	     * _.get(object, 'a.b.c', 'default');
	     * // => 'default'
	     */
	    function get(object, path, defaultValue) {
	      var result = object == null ? undefined : baseGet(object, toPath(path), path + '');
	      return result === undefined ? defaultValue : result;
	    }

	    /**
	     * Checks if `path` is a direct property.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to query.
	     * @param {Array|string} path The path to check.
	     * @returns {boolean} Returns `true` if `path` is a direct property, else `false`.
	     * @example
	     *
	     * var object = { 'a': { 'b': { 'c': 3 } } };
	     *
	     * _.has(object, 'a');
	     * // => true
	     *
	     * _.has(object, 'a.b.c');
	     * // => true
	     *
	     * _.has(object, ['a', 'b', 'c']);
	     * // => true
	     */
	    function has(object, path) {
	      if (object == null) {
	        return false;
	      }
	      var result = hasOwnProperty.call(object, path);
	      if (!result && !isKey(path)) {
	        path = toPath(path);
	        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
	        if (object == null) {
	          return false;
	        }
	        path = last(path);
	        result = hasOwnProperty.call(object, path);
	      }
	      return result || (isLength(object.length) && isIndex(path, object.length) &&
	        (isArray(object) || isArguments(object)));
	    }

	    /**
	     * Creates an object composed of the inverted keys and values of `object`.
	     * If `object` contains duplicate values, subsequent values overwrite property
	     * assignments of previous values unless `multiValue` is `true`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to invert.
	     * @param {boolean} [multiValue] Allow multiple values per key.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Object} Returns the new inverted object.
	     * @example
	     *
	     * var object = { 'a': 1, 'b': 2, 'c': 1 };
	     *
	     * _.invert(object);
	     * // => { '1': 'c', '2': 'b' }
	     *
	     * // with `multiValue`
	     * _.invert(object, true);
	     * // => { '1': ['a', 'c'], '2': ['b'] }
	     */
	    function invert(object, multiValue, guard) {
	      if (guard && isIterateeCall(object, multiValue, guard)) {
	        multiValue = undefined;
	      }
	      var index = -1,
	          props = keys(object),
	          length = props.length,
	          result = {};

	      while (++index < length) {
	        var key = props[index],
	            value = object[key];

	        if (multiValue) {
	          if (hasOwnProperty.call(result, value)) {
	            result[value].push(key);
	          } else {
	            result[value] = [key];
	          }
	        }
	        else {
	          result[value] = key;
	        }
	      }
	      return result;
	    }

	    /**
	     * Creates an array of the own enumerable property names of `object`.
	     *
	     * **Note:** Non-object values are coerced to objects. See the
	     * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
	     * for more details.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to query.
	     * @returns {Array} Returns the array of property names.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.keys(new Foo);
	     * // => ['a', 'b'] (iteration order is not guaranteed)
	     *
	     * _.keys('hi');
	     * // => ['0', '1']
	     */
	    var keys = !nativeKeys ? shimKeys : function(object) {
	      var Ctor = object == null ? undefined : object.constructor;
	      if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
	          (typeof object != 'function' && isArrayLike(object))) {
	        return shimKeys(object);
	      }
	      return isObject(object) ? nativeKeys(object) : [];
	    };

	    /**
	     * Creates an array of the own and inherited enumerable property names of `object`.
	     *
	     * **Note:** Non-object values are coerced to objects.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to query.
	     * @returns {Array} Returns the array of property names.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.keysIn(new Foo);
	     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
	     */
	    function keysIn(object) {
	      if (object == null) {
	        return [];
	      }
	      if (!isObject(object)) {
	        object = Object(object);
	      }
	      var length = object.length;
	      length = (length && isLength(length) &&
	        (isArray(object) || isArguments(object)) && length) || 0;

	      var Ctor = object.constructor,
	          index = -1,
	          isProto = typeof Ctor == 'function' && Ctor.prototype === object,
	          result = Array(length),
	          skipIndexes = length > 0;

	      while (++index < length) {
	        result[index] = (index + '');
	      }
	      for (var key in object) {
	        if (!(skipIndexes && isIndex(key, length)) &&
	            !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
	          result.push(key);
	        }
	      }
	      return result;
	    }

	    /**
	     * The opposite of `_.mapValues`; this method creates an object with the
	     * same values as `object` and keys generated by running each own enumerable
	     * property of `object` through `iteratee`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to iterate over.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns the new mapped object.
	     * @example
	     *
	     * _.mapKeys({ 'a': 1, 'b': 2 }, function(value, key) {
	     *   return key + value;
	     * });
	     * // => { 'a1': 1, 'b2': 2 }
	     */
	    var mapKeys = createObjectMapper(true);

	    /**
	     * Creates an object with the same keys as `object` and values generated by
	     * running each own enumerable property of `object` through `iteratee`. The
	     * iteratee function is bound to `thisArg` and invoked with three arguments:
	     * (value, key, object).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to iterate over.
	     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
	     *  per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Object} Returns the new mapped object.
	     * @example
	     *
	     * _.mapValues({ 'a': 1, 'b': 2 }, function(n) {
	     *   return n * 3;
	     * });
	     * // => { 'a': 3, 'b': 6 }
	     *
	     * var users = {
	     *   'fred':    { 'user': 'fred',    'age': 40 },
	     *   'pebbles': { 'user': 'pebbles', 'age': 1 }
	     * };
	     *
	     * // using the `_.property` callback shorthand
	     * _.mapValues(users, 'age');
	     * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
	     */
	    var mapValues = createObjectMapper();

	    /**
	     * The opposite of `_.pick`; this method creates an object composed of the
	     * own and inherited enumerable properties of `object` that are not omitted.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The source object.
	     * @param {Function|...(string|string[])} [predicate] The function invoked per
	     *  iteration or property names to omit, specified as individual property
	     *  names or arrays of property names.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Object} Returns the new object.
	     * @example
	     *
	     * var object = { 'user': 'fred', 'age': 40 };
	     *
	     * _.omit(object, 'age');
	     * // => { 'user': 'fred' }
	     *
	     * _.omit(object, _.isNumber);
	     * // => { 'user': 'fred' }
	     */
	    var omit = restParam(function(object, props) {
	      if (object == null) {
	        return {};
	      }
	      if (typeof props[0] != 'function') {
	        var props = arrayMap(baseFlatten(props), String);
	        return pickByArray(object, baseDifference(keysIn(object), props));
	      }
	      var predicate = bindCallback(props[0], props[1], 3);
	      return pickByCallback(object, function(value, key, object) {
	        return !predicate(value, key, object);
	      });
	    });

	    /**
	     * Creates a two dimensional array of the key-value pairs for `object`,
	     * e.g. `[[key1, value1], [key2, value2]]`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to query.
	     * @returns {Array} Returns the new array of key-value pairs.
	     * @example
	     *
	     * _.pairs({ 'barney': 36, 'fred': 40 });
	     * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
	     */
	    function pairs(object) {
	      object = toObject(object);

	      var index = -1,
	          props = keys(object),
	          length = props.length,
	          result = Array(length);

	      while (++index < length) {
	        var key = props[index];
	        result[index] = [key, object[key]];
	      }
	      return result;
	    }

	    /**
	     * Creates an object composed of the picked `object` properties. Property
	     * names may be specified as individual arguments or as arrays of property
	     * names. If `predicate` is provided it is invoked for each property of `object`
	     * picking the properties `predicate` returns truthy for. The predicate is
	     * bound to `thisArg` and invoked with three arguments: (value, key, object).
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The source object.
	     * @param {Function|...(string|string[])} [predicate] The function invoked per
	     *  iteration or property names to pick, specified as individual property
	     *  names or arrays of property names.
	     * @param {*} [thisArg] The `this` binding of `predicate`.
	     * @returns {Object} Returns the new object.
	     * @example
	     *
	     * var object = { 'user': 'fred', 'age': 40 };
	     *
	     * _.pick(object, 'user');
	     * // => { 'user': 'fred' }
	     *
	     * _.pick(object, _.isString);
	     * // => { 'user': 'fred' }
	     */
	    var pick = restParam(function(object, props) {
	      if (object == null) {
	        return {};
	      }
	      return typeof props[0] == 'function'
	        ? pickByCallback(object, bindCallback(props[0], props[1], 3))
	        : pickByArray(object, baseFlatten(props));
	    });

	    /**
	     * This method is like `_.get` except that if the resolved value is a function
	     * it is invoked with the `this` binding of its parent object and its result
	     * is returned.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to query.
	     * @param {Array|string} path The path of the property to resolve.
	     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
	     * @returns {*} Returns the resolved value.
	     * @example
	     *
	     * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
	     *
	     * _.result(object, 'a[0].b.c1');
	     * // => 3
	     *
	     * _.result(object, 'a[0].b.c2');
	     * // => 4
	     *
	     * _.result(object, 'a.b.c', 'default');
	     * // => 'default'
	     *
	     * _.result(object, 'a.b.c', _.constant('default'));
	     * // => 'default'
	     */
	    function result(object, path, defaultValue) {
	      var result = object == null ? undefined : object[path];
	      if (result === undefined) {
	        if (object != null && !isKey(path, object)) {
	          path = toPath(path);
	          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
	          result = object == null ? undefined : object[last(path)];
	        }
	        result = result === undefined ? defaultValue : result;
	      }
	      return isFunction(result) ? result.call(object) : result;
	    }

	    /**
	     * Sets the property value of `path` on `object`. If a portion of `path`
	     * does not exist it is created.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to augment.
	     * @param {Array|string} path The path of the property to set.
	     * @param {*} value The value to set.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	     *
	     * _.set(object, 'a[0].b.c', 4);
	     * console.log(object.a[0].b.c);
	     * // => 4
	     *
	     * _.set(object, 'x[0].y.z', 5);
	     * console.log(object.x[0].y.z);
	     * // => 5
	     */
	    function set(object, path, value) {
	      if (object == null) {
	        return object;
	      }
	      var pathKey = (path + '');
	      path = (object[pathKey] != null || isKey(path, object)) ? [pathKey] : toPath(path);

	      var index = -1,
	          length = path.length,
	          lastIndex = length - 1,
	          nested = object;

	      while (nested != null && ++index < length) {
	        var key = path[index];
	        if (isObject(nested)) {
	          if (index == lastIndex) {
	            nested[key] = value;
	          } else if (nested[key] == null) {
	            nested[key] = isIndex(path[index + 1]) ? [] : {};
	          }
	        }
	        nested = nested[key];
	      }
	      return object;
	    }

	    /**
	     * An alternative to `_.reduce`; this method transforms `object` to a new
	     * `accumulator` object which is the result of running each of its own enumerable
	     * properties through `iteratee`, with each invocation potentially mutating
	     * the `accumulator` object. The `iteratee` is bound to `thisArg` and invoked
	     * with four arguments: (accumulator, value, key, object). Iteratee functions
	     * may exit iteration early by explicitly returning `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Array|Object} object The object to iterate over.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [accumulator] The custom accumulator value.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {*} Returns the accumulated value.
	     * @example
	     *
	     * _.transform([2, 3, 4], function(result, n) {
	     *   result.push(n *= n);
	     *   return n % 2 == 0;
	     * });
	     * // => [4, 9]
	     *
	     * _.transform({ 'a': 1, 'b': 2 }, function(result, n, key) {
	     *   result[key] = n * 3;
	     * });
	     * // => { 'a': 3, 'b': 6 }
	     */
	    function transform(object, iteratee, accumulator, thisArg) {
	      var isArr = isArray(object) || isTypedArray(object);
	      iteratee = getCallback(iteratee, thisArg, 4);

	      if (accumulator == null) {
	        if (isArr || isObject(object)) {
	          var Ctor = object.constructor;
	          if (isArr) {
	            accumulator = isArray(object) ? new Ctor : [];
	          } else {
	            accumulator = baseCreate(isFunction(Ctor) ? Ctor.prototype : undefined);
	          }
	        } else {
	          accumulator = {};
	        }
	      }
	      (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
	        return iteratee(accumulator, value, index, object);
	      });
	      return accumulator;
	    }

	    /**
	     * Creates an array of the own enumerable property values of `object`.
	     *
	     * **Note:** Non-object values are coerced to objects.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to query.
	     * @returns {Array} Returns the array of property values.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.values(new Foo);
	     * // => [1, 2] (iteration order is not guaranteed)
	     *
	     * _.values('hi');
	     * // => ['h', 'i']
	     */
	    function values(object) {
	      return baseValues(object, keys(object));
	    }

	    /**
	     * Creates an array of the own and inherited enumerable property values
	     * of `object`.
	     *
	     * **Note:** Non-object values are coerced to objects.
	     *
	     * @static
	     * @memberOf _
	     * @category Object
	     * @param {Object} object The object to query.
	     * @returns {Array} Returns the array of property values.
	     * @example
	     *
	     * function Foo() {
	     *   this.a = 1;
	     *   this.b = 2;
	     * }
	     *
	     * Foo.prototype.c = 3;
	     *
	     * _.valuesIn(new Foo);
	     * // => [1, 2, 3] (iteration order is not guaranteed)
	     */
	    function valuesIn(object) {
	      return baseValues(object, keysIn(object));
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Checks if `n` is between `start` and up to but not including, `end`. If
	     * `end` is not specified it is set to `start` with `start` then set to `0`.
	     *
	     * @static
	     * @memberOf _
	     * @category Number
	     * @param {number} n The number to check.
	     * @param {number} [start=0] The start of the range.
	     * @param {number} end The end of the range.
	     * @returns {boolean} Returns `true` if `n` is in the range, else `false`.
	     * @example
	     *
	     * _.inRange(3, 2, 4);
	     * // => true
	     *
	     * _.inRange(4, 8);
	     * // => true
	     *
	     * _.inRange(4, 2);
	     * // => false
	     *
	     * _.inRange(2, 2);
	     * // => false
	     *
	     * _.inRange(1.2, 2);
	     * // => true
	     *
	     * _.inRange(5.2, 4);
	     * // => false
	     */
	    function inRange(value, start, end) {
	      start = +start || 0;
	      if (end === undefined) {
	        end = start;
	        start = 0;
	      } else {
	        end = +end || 0;
	      }
	      return value >= nativeMin(start, end) && value < nativeMax(start, end);
	    }

	    /**
	     * Produces a random number between `min` and `max` (inclusive). If only one
	     * argument is provided a number between `0` and the given number is returned.
	     * If `floating` is `true`, or either `min` or `max` are floats, a floating-point
	     * number is returned instead of an integer.
	     *
	     * @static
	     * @memberOf _
	     * @category Number
	     * @param {number} [min=0] The minimum possible value.
	     * @param {number} [max=1] The maximum possible value.
	     * @param {boolean} [floating] Specify returning a floating-point number.
	     * @returns {number} Returns the random number.
	     * @example
	     *
	     * _.random(0, 5);
	     * // => an integer between 0 and 5
	     *
	     * _.random(5);
	     * // => also an integer between 0 and 5
	     *
	     * _.random(5, true);
	     * // => a floating-point number between 0 and 5
	     *
	     * _.random(1.2, 5.2);
	     * // => a floating-point number between 1.2 and 5.2
	     */
	    function random(min, max, floating) {
	      if (floating && isIterateeCall(min, max, floating)) {
	        max = floating = undefined;
	      }
	      var noMin = min == null,
	          noMax = max == null;

	      if (floating == null) {
	        if (noMax && typeof min == 'boolean') {
	          floating = min;
	          min = 1;
	        }
	        else if (typeof max == 'boolean') {
	          floating = max;
	          noMax = true;
	        }
	      }
	      if (noMin && noMax) {
	        max = 1;
	        noMax = false;
	      }
	      min = +min || 0;
	      if (noMax) {
	        max = min;
	        min = 0;
	      } else {
	        max = +max || 0;
	      }
	      if (floating || min % 1 || max % 1) {
	        var rand = nativeRandom();
	        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand + '').length - 1)))), max);
	      }
	      return baseRandom(min, max);
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to convert.
	     * @returns {string} Returns the camel cased string.
	     * @example
	     *
	     * _.camelCase('Foo Bar');
	     * // => 'fooBar'
	     *
	     * _.camelCase('--foo-bar');
	     * // => 'fooBar'
	     *
	     * _.camelCase('__foo_bar__');
	     * // => 'fooBar'
	     */
	    var camelCase = createCompounder(function(result, word, index) {
	      word = word.toLowerCase();
	      return result + (index ? (word.charAt(0).toUpperCase() + word.slice(1)) : word);
	    });

	    /**
	     * Capitalizes the first character of `string`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to capitalize.
	     * @returns {string} Returns the capitalized string.
	     * @example
	     *
	     * _.capitalize('fred');
	     * // => 'Fred'
	     */
	    function capitalize(string) {
	      string = baseToString(string);
	      return string && (string.charAt(0).toUpperCase() + string.slice(1));
	    }

	    /**
	     * Deburrs `string` by converting [latin-1 supplementary letters](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
	     * to basic latin letters and removing [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to deburr.
	     * @returns {string} Returns the deburred string.
	     * @example
	     *
	     * _.deburr('déjà vu');
	     * // => 'deja vu'
	     */
	    function deburr(string) {
	      string = baseToString(string);
	      return string && string.replace(reLatin1, deburrLetter).replace(reComboMark, '');
	    }

	    /**
	     * Checks if `string` ends with the given target string.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to search.
	     * @param {string} [target] The string to search for.
	     * @param {number} [position=string.length] The position to search from.
	     * @returns {boolean} Returns `true` if `string` ends with `target`, else `false`.
	     * @example
	     *
	     * _.endsWith('abc', 'c');
	     * // => true
	     *
	     * _.endsWith('abc', 'b');
	     * // => false
	     *
	     * _.endsWith('abc', 'b', 2);
	     * // => true
	     */
	    function endsWith(string, target, position) {
	      string = baseToString(string);
	      target = (target + '');

	      var length = string.length;
	      position = position === undefined
	        ? length
	        : nativeMin(position < 0 ? 0 : (+position || 0), length);

	      position -= target.length;
	      return position >= 0 && string.indexOf(target, position) == position;
	    }

	    /**
	     * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
	     * their corresponding HTML entities.
	     *
	     * **Note:** No other characters are escaped. To escape additional characters
	     * use a third-party library like [_he_](https://mths.be/he).
	     *
	     * Though the ">" character is escaped for symmetry, characters like
	     * ">" and "/" don't need escaping in HTML and have no special meaning
	     * unless they're part of a tag or unquoted attribute value.
	     * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
	     * (under "semi-related fun fact") for more details.
	     *
	     * Backticks are escaped because in Internet Explorer < 9, they can break out
	     * of attribute values or HTML comments. See [#59](https://html5sec.org/#59),
	     * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
	     * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
	     * for more details.
	     *
	     * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
	     * to reduce XSS vectors.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to escape.
	     * @returns {string} Returns the escaped string.
	     * @example
	     *
	     * _.escape('fred, barney, & pebbles');
	     * // => 'fred, barney, &amp; pebbles'
	     */
	    function escape(string) {
	      // Reset `lastIndex` because in IE < 9 `String#replace` does not.
	      string = baseToString(string);
	      return (string && reHasUnescapedHtml.test(string))
	        ? string.replace(reUnescapedHtml, escapeHtmlChar)
	        : string;
	    }

	    /**
	     * Escapes the `RegExp` special characters "\", "/", "^", "$", ".", "|", "?",
	     * "*", "+", "(", ")", "[", "]", "{" and "}" in `string`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to escape.
	     * @returns {string} Returns the escaped string.
	     * @example
	     *
	     * _.escapeRegExp('[lodash](https://lodash.com/)');
	     * // => '\[lodash\]\(https:\/\/lodash\.com\/\)'
	     */
	    function escapeRegExp(string) {
	      string = baseToString(string);
	      return (string && reHasRegExpChars.test(string))
	        ? string.replace(reRegExpChars, escapeRegExpChar)
	        : (string || '(?:)');
	    }

	    /**
	     * Converts `string` to [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to convert.
	     * @returns {string} Returns the kebab cased string.
	     * @example
	     *
	     * _.kebabCase('Foo Bar');
	     * // => 'foo-bar'
	     *
	     * _.kebabCase('fooBar');
	     * // => 'foo-bar'
	     *
	     * _.kebabCase('__foo_bar__');
	     * // => 'foo-bar'
	     */
	    var kebabCase = createCompounder(function(result, word, index) {
	      return result + (index ? '-' : '') + word.toLowerCase();
	    });

	    /**
	     * Pads `string` on the left and right sides if it's shorter than `length`.
	     * Padding characters are truncated if they can't be evenly divided by `length`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to pad.
	     * @param {number} [length=0] The padding length.
	     * @param {string} [chars=' '] The string used as padding.
	     * @returns {string} Returns the padded string.
	     * @example
	     *
	     * _.pad('abc', 8);
	     * // => '  abc   '
	     *
	     * _.pad('abc', 8, '_-');
	     * // => '_-abc_-_'
	     *
	     * _.pad('abc', 3);
	     * // => 'abc'
	     */
	    function pad(string, length, chars) {
	      string = baseToString(string);
	      length = +length;

	      var strLength = string.length;
	      if (strLength >= length || !nativeIsFinite(length)) {
	        return string;
	      }
	      var mid = (length - strLength) / 2,
	          leftLength = nativeFloor(mid),
	          rightLength = nativeCeil(mid);

	      chars = createPadding('', rightLength, chars);
	      return chars.slice(0, leftLength) + string + chars;
	    }

	    /**
	     * Pads `string` on the left side if it's shorter than `length`. Padding
	     * characters are truncated if they exceed `length`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to pad.
	     * @param {number} [length=0] The padding length.
	     * @param {string} [chars=' '] The string used as padding.
	     * @returns {string} Returns the padded string.
	     * @example
	     *
	     * _.padLeft('abc', 6);
	     * // => '   abc'
	     *
	     * _.padLeft('abc', 6, '_-');
	     * // => '_-_abc'
	     *
	     * _.padLeft('abc', 3);
	     * // => 'abc'
	     */
	    var padLeft = createPadDir();

	    /**
	     * Pads `string` on the right side if it's shorter than `length`. Padding
	     * characters are truncated if they exceed `length`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to pad.
	     * @param {number} [length=0] The padding length.
	     * @param {string} [chars=' '] The string used as padding.
	     * @returns {string} Returns the padded string.
	     * @example
	     *
	     * _.padRight('abc', 6);
	     * // => 'abc   '
	     *
	     * _.padRight('abc', 6, '_-');
	     * // => 'abc_-_'
	     *
	     * _.padRight('abc', 3);
	     * // => 'abc'
	     */
	    var padRight = createPadDir(true);

	    /**
	     * Converts `string` to an integer of the specified radix. If `radix` is
	     * `undefined` or `0`, a `radix` of `10` is used unless `value` is a hexadecimal,
	     * in which case a `radix` of `16` is used.
	     *
	     * **Note:** This method aligns with the [ES5 implementation](https://es5.github.io/#E)
	     * of `parseInt`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} string The string to convert.
	     * @param {number} [radix] The radix to interpret `value` by.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {number} Returns the converted integer.
	     * @example
	     *
	     * _.parseInt('08');
	     * // => 8
	     *
	     * _.map(['6', '08', '10'], _.parseInt);
	     * // => [6, 8, 10]
	     */
	    function parseInt(string, radix, guard) {
	      // Firefox < 21 and Opera < 15 follow ES3 for `parseInt`.
	      // Chrome fails to trim leading <BOM> whitespace characters.
	      // See https://code.google.com/p/v8/issues/detail?id=3109 for more details.
	      if (guard ? isIterateeCall(string, radix, guard) : radix == null) {
	        radix = 0;
	      } else if (radix) {
	        radix = +radix;
	      }
	      string = trim(string);
	      return nativeParseInt(string, radix || (reHasHexPrefix.test(string) ? 16 : 10));
	    }

	    /**
	     * Repeats the given string `n` times.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to repeat.
	     * @param {number} [n=0] The number of times to repeat the string.
	     * @returns {string} Returns the repeated string.
	     * @example
	     *
	     * _.repeat('*', 3);
	     * // => '***'
	     *
	     * _.repeat('abc', 2);
	     * // => 'abcabc'
	     *
	     * _.repeat('abc', 0);
	     * // => ''
	     */
	    function repeat(string, n) {
	      var result = '';
	      string = baseToString(string);
	      n = +n;
	      if (n < 1 || !string || !nativeIsFinite(n)) {
	        return result;
	      }
	      // Leverage the exponentiation by squaring algorithm for a faster repeat.
	      // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
	      do {
	        if (n % 2) {
	          result += string;
	        }
	        n = nativeFloor(n / 2);
	        string += string;
	      } while (n);

	      return result;
	    }

	    /**
	     * Converts `string` to [snake case](https://en.wikipedia.org/wiki/Snake_case).
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to convert.
	     * @returns {string} Returns the snake cased string.
	     * @example
	     *
	     * _.snakeCase('Foo Bar');
	     * // => 'foo_bar'
	     *
	     * _.snakeCase('fooBar');
	     * // => 'foo_bar'
	     *
	     * _.snakeCase('--foo-bar');
	     * // => 'foo_bar'
	     */
	    var snakeCase = createCompounder(function(result, word, index) {
	      return result + (index ? '_' : '') + word.toLowerCase();
	    });

	    /**
	     * Converts `string` to [start case](https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage).
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to convert.
	     * @returns {string} Returns the start cased string.
	     * @example
	     *
	     * _.startCase('--foo-bar');
	     * // => 'Foo Bar'
	     *
	     * _.startCase('fooBar');
	     * // => 'Foo Bar'
	     *
	     * _.startCase('__foo_bar__');
	     * // => 'Foo Bar'
	     */
	    var startCase = createCompounder(function(result, word, index) {
	      return result + (index ? ' ' : '') + (word.charAt(0).toUpperCase() + word.slice(1));
	    });

	    /**
	     * Checks if `string` starts with the given target string.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to search.
	     * @param {string} [target] The string to search for.
	     * @param {number} [position=0] The position to search from.
	     * @returns {boolean} Returns `true` if `string` starts with `target`, else `false`.
	     * @example
	     *
	     * _.startsWith('abc', 'a');
	     * // => true
	     *
	     * _.startsWith('abc', 'b');
	     * // => false
	     *
	     * _.startsWith('abc', 'b', 1);
	     * // => true
	     */
	    function startsWith(string, target, position) {
	      string = baseToString(string);
	      position = position == null
	        ? 0
	        : nativeMin(position < 0 ? 0 : (+position || 0), string.length);

	      return string.lastIndexOf(target, position) == position;
	    }

	    /**
	     * Creates a compiled template function that can interpolate data properties
	     * in "interpolate" delimiters, HTML-escape interpolated data properties in
	     * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
	     * properties may be accessed as free variables in the template. If a setting
	     * object is provided it takes precedence over `_.templateSettings` values.
	     *
	     * **Note:** In the development build `_.template` utilizes
	     * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
	     * for easier debugging.
	     *
	     * For more information on precompiling templates see
	     * [lodash's custom builds documentation](https://lodash.com/custom-builds).
	     *
	     * For more information on Chrome extension sandboxes see
	     * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The template string.
	     * @param {Object} [options] The options object.
	     * @param {RegExp} [options.escape] The HTML "escape" delimiter.
	     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
	     * @param {Object} [options.imports] An object to import into the template as free variables.
	     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
	     * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.
	     * @param {string} [options.variable] The data object variable name.
	     * @param- {Object} [otherOptions] Enables the legacy `options` param signature.
	     * @returns {Function} Returns the compiled template function.
	     * @example
	     *
	     * // using the "interpolate" delimiter to create a compiled template
	     * var compiled = _.template('hello <%= user %>!');
	     * compiled({ 'user': 'fred' });
	     * // => 'hello fred!'
	     *
	     * // using the HTML "escape" delimiter to escape data property values
	     * var compiled = _.template('<b><%- value %></b>');
	     * compiled({ 'value': '<script>' });
	     * // => '<b>&lt;script&gt;</b>'
	     *
	     * // using the "evaluate" delimiter to execute JavaScript and generate HTML
	     * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
	     * compiled({ 'users': ['fred', 'barney'] });
	     * // => '<li>fred</li><li>barney</li>'
	     *
	     * // using the internal `print` function in "evaluate" delimiters
	     * var compiled = _.template('<% print("hello " + user); %>!');
	     * compiled({ 'user': 'barney' });
	     * // => 'hello barney!'
	     *
	     * // using the ES delimiter as an alternative to the default "interpolate" delimiter
	     * var compiled = _.template('hello ${ user }!');
	     * compiled({ 'user': 'pebbles' });
	     * // => 'hello pebbles!'
	     *
	     * // using custom template delimiters
	     * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
	     * var compiled = _.template('hello {{ user }}!');
	     * compiled({ 'user': 'mustache' });
	     * // => 'hello mustache!'
	     *
	     * // using backslashes to treat delimiters as plain text
	     * var compiled = _.template('<%= "\\<%- value %\\>" %>');
	     * compiled({ 'value': 'ignored' });
	     * // => '<%- value %>'
	     *
	     * // using the `imports` option to import `jQuery` as `jq`
	     * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
	     * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
	     * compiled({ 'users': ['fred', 'barney'] });
	     * // => '<li>fred</li><li>barney</li>'
	     *
	     * // using the `sourceURL` option to specify a custom sourceURL for the template
	     * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
	     * compiled(data);
	     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
	     *
	     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
	     * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
	     * compiled.source;
	     * // => function(data) {
	     * //   var __t, __p = '';
	     * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
	     * //   return __p;
	     * // }
	     *
	     * // using the `source` property to inline compiled templates for meaningful
	     * // line numbers in error messages and a stack trace
	     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
	     *   var JST = {\
	     *     "main": ' + _.template(mainText).source + '\
	     *   };\
	     * ');
	     */
	    function template(string, options, otherOptions) {
	      // Based on John Resig's `tmpl` implementation (http://ejohn.org/blog/javascript-micro-templating/)
	      // and Laura Doktorova's doT.js (https://github.com/olado/doT).
	      var settings = lodash.templateSettings;

	      if (otherOptions && isIterateeCall(string, options, otherOptions)) {
	        options = otherOptions = undefined;
	      }
	      string = baseToString(string);
	      options = assignWith(baseAssign({}, otherOptions || options), settings, assignOwnDefaults);

	      var imports = assignWith(baseAssign({}, options.imports), settings.imports, assignOwnDefaults),
	          importsKeys = keys(imports),
	          importsValues = baseValues(imports, importsKeys);

	      var isEscaping,
	          isEvaluating,
	          index = 0,
	          interpolate = options.interpolate || reNoMatch,
	          source = "__p += '";

	      // Compile the regexp to match each delimiter.
	      var reDelimiters = RegExp(
	        (options.escape || reNoMatch).source + '|' +
	        interpolate.source + '|' +
	        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
	        (options.evaluate || reNoMatch).source + '|$'
	      , 'g');

	      // Use a sourceURL for easier debugging.
	      var sourceURL = '//# sourceURL=' +
	        ('sourceURL' in options
	          ? options.sourceURL
	          : ('lodash.templateSources[' + (++templateCounter) + ']')
	        ) + '\n';

	      string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
	        interpolateValue || (interpolateValue = esTemplateValue);

	        // Escape characters that can't be included in string literals.
	        source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

	        // Replace delimiters with snippets.
	        if (escapeValue) {
	          isEscaping = true;
	          source += "' +\n__e(" + escapeValue + ") +\n'";
	        }
	        if (evaluateValue) {
	          isEvaluating = true;
	          source += "';\n" + evaluateValue + ";\n__p += '";
	        }
	        if (interpolateValue) {
	          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
	        }
	        index = offset + match.length;

	        // The JS engine embedded in Adobe products requires returning the `match`
	        // string in order to produce the correct `offset` value.
	        return match;
	      });

	      source += "';\n";

	      // If `variable` is not specified wrap a with-statement around the generated
	      // code to add the data object to the top of the scope chain.
	      var variable = options.variable;
	      if (!variable) {
	        source = 'with (obj) {\n' + source + '\n}\n';
	      }
	      // Cleanup code by stripping empty strings.
	      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
	        .replace(reEmptyStringMiddle, '$1')
	        .replace(reEmptyStringTrailing, '$1;');

	      // Frame code as the function body.
	      source = 'function(' + (variable || 'obj') + ') {\n' +
	        (variable
	          ? ''
	          : 'obj || (obj = {});\n'
	        ) +
	        "var __t, __p = ''" +
	        (isEscaping
	           ? ', __e = _.escape'
	           : ''
	        ) +
	        (isEvaluating
	          ? ', __j = Array.prototype.join;\n' +
	            "function print() { __p += __j.call(arguments, '') }\n"
	          : ';\n'
	        ) +
	        source +
	        'return __p\n}';

	      var result = attempt(function() {
	        return Function(importsKeys, sourceURL + 'return ' + source).apply(undefined, importsValues);
	      });

	      // Provide the compiled function's source by its `toString` method or
	      // the `source` property as a convenience for inlining compiled templates.
	      result.source = source;
	      if (isError(result)) {
	        throw result;
	      }
	      return result;
	    }

	    /**
	     * Removes leading and trailing whitespace or specified characters from `string`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to trim.
	     * @param {string} [chars=whitespace] The characters to trim.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {string} Returns the trimmed string.
	     * @example
	     *
	     * _.trim('  abc  ');
	     * // => 'abc'
	     *
	     * _.trim('-_-abc-_-', '_-');
	     * // => 'abc'
	     *
	     * _.map(['  foo  ', '  bar  '], _.trim);
	     * // => ['foo', 'bar']
	     */
	    function trim(string, chars, guard) {
	      var value = string;
	      string = baseToString(string);
	      if (!string) {
	        return string;
	      }
	      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
	        return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);
	      }
	      chars = (chars + '');
	      return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);
	    }

	    /**
	     * Removes leading whitespace or specified characters from `string`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to trim.
	     * @param {string} [chars=whitespace] The characters to trim.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {string} Returns the trimmed string.
	     * @example
	     *
	     * _.trimLeft('  abc  ');
	     * // => 'abc  '
	     *
	     * _.trimLeft('-_-abc-_-', '_-');
	     * // => 'abc-_-'
	     */
	    function trimLeft(string, chars, guard) {
	      var value = string;
	      string = baseToString(string);
	      if (!string) {
	        return string;
	      }
	      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
	        return string.slice(trimmedLeftIndex(string));
	      }
	      return string.slice(charsLeftIndex(string, (chars + '')));
	    }

	    /**
	     * Removes trailing whitespace or specified characters from `string`.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to trim.
	     * @param {string} [chars=whitespace] The characters to trim.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {string} Returns the trimmed string.
	     * @example
	     *
	     * _.trimRight('  abc  ');
	     * // => '  abc'
	     *
	     * _.trimRight('-_-abc-_-', '_-');
	     * // => '-_-abc'
	     */
	    function trimRight(string, chars, guard) {
	      var value = string;
	      string = baseToString(string);
	      if (!string) {
	        return string;
	      }
	      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
	        return string.slice(0, trimmedRightIndex(string) + 1);
	      }
	      return string.slice(0, charsRightIndex(string, (chars + '')) + 1);
	    }

	    /**
	     * Truncates `string` if it's longer than the given maximum string length.
	     * The last characters of the truncated string are replaced with the omission
	     * string which defaults to "...".
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to truncate.
	     * @param {Object|number} [options] The options object or maximum string length.
	     * @param {number} [options.length=30] The maximum string length.
	     * @param {string} [options.omission='...'] The string to indicate text is omitted.
	     * @param {RegExp|string} [options.separator] The separator pattern to truncate to.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {string} Returns the truncated string.
	     * @example
	     *
	     * _.trunc('hi-diddly-ho there, neighborino');
	     * // => 'hi-diddly-ho there, neighbo...'
	     *
	     * _.trunc('hi-diddly-ho there, neighborino', 24);
	     * // => 'hi-diddly-ho there, n...'
	     *
	     * _.trunc('hi-diddly-ho there, neighborino', {
	     *   'length': 24,
	     *   'separator': ' '
	     * });
	     * // => 'hi-diddly-ho there,...'
	     *
	     * _.trunc('hi-diddly-ho there, neighborino', {
	     *   'length': 24,
	     *   'separator': /,? +/
	     * });
	     * // => 'hi-diddly-ho there...'
	     *
	     * _.trunc('hi-diddly-ho there, neighborino', {
	     *   'omission': ' [...]'
	     * });
	     * // => 'hi-diddly-ho there, neig [...]'
	     */
	    function trunc(string, options, guard) {
	      if (guard && isIterateeCall(string, options, guard)) {
	        options = undefined;
	      }
	      var length = DEFAULT_TRUNC_LENGTH,
	          omission = DEFAULT_TRUNC_OMISSION;

	      if (options != null) {
	        if (isObject(options)) {
	          var separator = 'separator' in options ? options.separator : separator;
	          length = 'length' in options ? (+options.length || 0) : length;
	          omission = 'omission' in options ? baseToString(options.omission) : omission;
	        } else {
	          length = +options || 0;
	        }
	      }
	      string = baseToString(string);
	      if (length >= string.length) {
	        return string;
	      }
	      var end = length - omission.length;
	      if (end < 1) {
	        return omission;
	      }
	      var result = string.slice(0, end);
	      if (separator == null) {
	        return result + omission;
	      }
	      if (isRegExp(separator)) {
	        if (string.slice(end).search(separator)) {
	          var match,
	              newEnd,
	              substring = string.slice(0, end);

	          if (!separator.global) {
	            separator = RegExp(separator.source, (reFlags.exec(separator) || '') + 'g');
	          }
	          separator.lastIndex = 0;
	          while ((match = separator.exec(substring))) {
	            newEnd = match.index;
	          }
	          result = result.slice(0, newEnd == null ? end : newEnd);
	        }
	      } else if (string.indexOf(separator, end) != end) {
	        var index = result.lastIndexOf(separator);
	        if (index > -1) {
	          result = result.slice(0, index);
	        }
	      }
	      return result + omission;
	    }

	    /**
	     * The inverse of `_.escape`; this method converts the HTML entities
	     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, and `&#96;` in `string` to their
	     * corresponding characters.
	     *
	     * **Note:** No other HTML entities are unescaped. To unescape additional HTML
	     * entities use a third-party library like [_he_](https://mths.be/he).
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to unescape.
	     * @returns {string} Returns the unescaped string.
	     * @example
	     *
	     * _.unescape('fred, barney, &amp; pebbles');
	     * // => 'fred, barney, & pebbles'
	     */
	    function unescape(string) {
	      string = baseToString(string);
	      return (string && reHasEscapedHtml.test(string))
	        ? string.replace(reEscapedHtml, unescapeHtmlChar)
	        : string;
	    }

	    /**
	     * Splits `string` into an array of its words.
	     *
	     * @static
	     * @memberOf _
	     * @category String
	     * @param {string} [string=''] The string to inspect.
	     * @param {RegExp|string} [pattern] The pattern to match words.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Array} Returns the words of `string`.
	     * @example
	     *
	     * _.words('fred, barney, & pebbles');
	     * // => ['fred', 'barney', 'pebbles']
	     *
	     * _.words('fred, barney, & pebbles', /[^, ]+/g);
	     * // => ['fred', 'barney', '&', 'pebbles']
	     */
	    function words(string, pattern, guard) {
	      if (guard && isIterateeCall(string, pattern, guard)) {
	        pattern = undefined;
	      }
	      string = baseToString(string);
	      return string.match(pattern || reWords) || [];
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Attempts to invoke `func`, returning either the result or the caught error
	     * object. Any additional arguments are provided to `func` when it is invoked.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {Function} func The function to attempt.
	     * @returns {*} Returns the `func` result or error object.
	     * @example
	     *
	     * // avoid throwing errors for invalid selectors
	     * var elements = _.attempt(function(selector) {
	     *   return document.querySelectorAll(selector);
	     * }, '>_>');
	     *
	     * if (_.isError(elements)) {
	     *   elements = [];
	     * }
	     */
	    var attempt = restParam(function(func, args) {
	      try {
	        return func.apply(undefined, args);
	      } catch(e) {
	        return isError(e) ? e : new Error(e);
	      }
	    });

	    /**
	     * Creates a function that invokes `func` with the `this` binding of `thisArg`
	     * and arguments of the created function. If `func` is a property name the
	     * created callback returns the property value for a given element. If `func`
	     * is an object the created callback returns `true` for elements that contain
	     * the equivalent object properties, otherwise it returns `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias iteratee
	     * @category Utility
	     * @param {*} [func=_.identity] The value to convert to a callback.
	     * @param {*} [thisArg] The `this` binding of `func`.
	     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
	     * @returns {Function} Returns the callback.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36 },
	     *   { 'user': 'fred',   'age': 40 }
	     * ];
	     *
	     * // wrap to create custom callback shorthands
	     * _.callback = _.wrap(_.callback, function(callback, func, thisArg) {
	     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(func);
	     *   if (!match) {
	     *     return callback(func, thisArg);
	     *   }
	     *   return function(object) {
	     *     return match[2] == 'gt'
	     *       ? object[match[1]] > match[3]
	     *       : object[match[1]] < match[3];
	     *   };
	     * });
	     *
	     * _.filter(users, 'age__gt36');
	     * // => [{ 'user': 'fred', 'age': 40 }]
	     */
	    function callback(func, thisArg, guard) {
	      if (guard && isIterateeCall(func, thisArg, guard)) {
	        thisArg = undefined;
	      }
	      return isObjectLike(func)
	        ? matches(func)
	        : baseCallback(func, thisArg);
	    }

	    /**
	     * Creates a function that returns `value`.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {*} value The value to return from the new function.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var object = { 'user': 'fred' };
	     * var getter = _.constant(object);
	     *
	     * getter() === object;
	     * // => true
	     */
	    function constant(value) {
	      return function() {
	        return value;
	      };
	    }

	    /**
	     * This method returns the first argument provided to it.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {*} value Any value.
	     * @returns {*} Returns `value`.
	     * @example
	     *
	     * var object = { 'user': 'fred' };
	     *
	     * _.identity(object) === object;
	     * // => true
	     */
	    function identity(value) {
	      return value;
	    }

	    /**
	     * Creates a function that performs a deep comparison between a given object
	     * and `source`, returning `true` if the given object has equivalent property
	     * values, else `false`.
	     *
	     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
	     * numbers, `Object` objects, regexes, and strings. Objects are compared by
	     * their own, not inherited, enumerable properties. For comparing a single
	     * own or inherited property value see `_.matchesProperty`.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {Object} source The object of property values to match.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36, 'active': true },
	     *   { 'user': 'fred',   'age': 40, 'active': false }
	     * ];
	     *
	     * _.filter(users, _.matches({ 'age': 40, 'active': false }));
	     * // => [{ 'user': 'fred', 'age': 40, 'active': false }]
	     */
	    function matches(source) {
	      return baseMatches(baseClone(source, true));
	    }

	    /**
	     * Creates a function that compares the property value of `path` on a given
	     * object to `value`.
	     *
	     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
	     * numbers, `Object` objects, regexes, and strings. Objects are compared by
	     * their own, not inherited, enumerable properties.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {Array|string} path The path of the property to get.
	     * @param {*} srcValue The value to match.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var users = [
	     *   { 'user': 'barney' },
	     *   { 'user': 'fred' }
	     * ];
	     *
	     * _.find(users, _.matchesProperty('user', 'fred'));
	     * // => { 'user': 'fred' }
	     */
	    function matchesProperty(path, srcValue) {
	      return baseMatchesProperty(path, baseClone(srcValue, true));
	    }

	    /**
	     * Creates a function that invokes the method at `path` on a given object.
	     * Any additional arguments are provided to the invoked method.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {Array|string} path The path of the method to invoke.
	     * @param {...*} [args] The arguments to invoke the method with.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var objects = [
	     *   { 'a': { 'b': { 'c': _.constant(2) } } },
	     *   { 'a': { 'b': { 'c': _.constant(1) } } }
	     * ];
	     *
	     * _.map(objects, _.method('a.b.c'));
	     * // => [2, 1]
	     *
	     * _.invoke(_.sortBy(objects, _.method(['a', 'b', 'c'])), 'a.b.c');
	     * // => [1, 2]
	     */
	    var method = restParam(function(path, args) {
	      return function(object) {
	        return invokePath(object, path, args);
	      };
	    });

	    /**
	     * The opposite of `_.method`; this method creates a function that invokes
	     * the method at a given path on `object`. Any additional arguments are
	     * provided to the invoked method.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {Object} object The object to query.
	     * @param {...*} [args] The arguments to invoke the method with.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var array = _.times(3, _.constant),
	     *     object = { 'a': array, 'b': array, 'c': array };
	     *
	     * _.map(['a[2]', 'c[0]'], _.methodOf(object));
	     * // => [2, 0]
	     *
	     * _.map([['a', '2'], ['c', '0']], _.methodOf(object));
	     * // => [2, 0]
	     */
	    var methodOf = restParam(function(object, args) {
	      return function(path) {
	        return invokePath(object, path, args);
	      };
	    });

	    /**
	     * Adds all own enumerable function properties of a source object to the
	     * destination object. If `object` is a function then methods are added to
	     * its prototype as well.
	     *
	     * **Note:** Use `_.runInContext` to create a pristine `lodash` function to
	     * avoid conflicts caused by modifying the original.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {Function|Object} [object=lodash] The destination object.
	     * @param {Object} source The object of functions to add.
	     * @param {Object} [options] The options object.
	     * @param {boolean} [options.chain=true] Specify whether the functions added
	     *  are chainable.
	     * @returns {Function|Object} Returns `object`.
	     * @example
	     *
	     * function vowels(string) {
	     *   return _.filter(string, function(v) {
	     *     return /[aeiou]/i.test(v);
	     *   });
	     * }
	     *
	     * _.mixin({ 'vowels': vowels });
	     * _.vowels('fred');
	     * // => ['e']
	     *
	     * _('fred').vowels().value();
	     * // => ['e']
	     *
	     * _.mixin({ 'vowels': vowels }, { 'chain': false });
	     * _('fred').vowels();
	     * // => ['e']
	     */
	    function mixin(object, source, options) {
	      if (options == null) {
	        var isObj = isObject(source),
	            props = isObj ? keys(source) : undefined,
	            methodNames = (props && props.length) ? baseFunctions(source, props) : undefined;

	        if (!(methodNames ? methodNames.length : isObj)) {
	          methodNames = false;
	          options = source;
	          source = object;
	          object = this;
	        }
	      }
	      if (!methodNames) {
	        methodNames = baseFunctions(source, keys(source));
	      }
	      var chain = true,
	          index = -1,
	          isFunc = isFunction(object),
	          length = methodNames.length;

	      if (options === false) {
	        chain = false;
	      } else if (isObject(options) && 'chain' in options) {
	        chain = options.chain;
	      }
	      while (++index < length) {
	        var methodName = methodNames[index],
	            func = source[methodName];

	        object[methodName] = func;
	        if (isFunc) {
	          object.prototype[methodName] = (function(func) {
	            return function() {
	              var chainAll = this.__chain__;
	              if (chain || chainAll) {
	                var result = object(this.__wrapped__),
	                    actions = result.__actions__ = arrayCopy(this.__actions__);

	                actions.push({ 'func': func, 'args': arguments, 'thisArg': object });
	                result.__chain__ = chainAll;
	                return result;
	              }
	              return func.apply(object, arrayPush([this.value()], arguments));
	            };
	          }(func));
	        }
	      }
	      return object;
	    }

	    /**
	     * Reverts the `_` variable to its previous value and returns a reference to
	     * the `lodash` function.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @returns {Function} Returns the `lodash` function.
	     * @example
	     *
	     * var lodash = _.noConflict();
	     */
	    function noConflict() {
	      root._ = oldDash;
	      return this;
	    }

	    /**
	     * A no-operation function that returns `undefined` regardless of the
	     * arguments it receives.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @example
	     *
	     * var object = { 'user': 'fred' };
	     *
	     * _.noop(object) === undefined;
	     * // => true
	     */
	    function noop() {
	      // No operation performed.
	    }

	    /**
	     * Creates a function that returns the property value at `path` on a
	     * given object.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {Array|string} path The path of the property to get.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var objects = [
	     *   { 'a': { 'b': { 'c': 2 } } },
	     *   { 'a': { 'b': { 'c': 1 } } }
	     * ];
	     *
	     * _.map(objects, _.property('a.b.c'));
	     * // => [2, 1]
	     *
	     * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
	     * // => [1, 2]
	     */
	    function property(path) {
	      return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
	    }

	    /**
	     * The opposite of `_.property`; this method creates a function that returns
	     * the property value at a given path on `object`.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {Object} object The object to query.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var array = [0, 1, 2],
	     *     object = { 'a': array, 'b': array, 'c': array };
	     *
	     * _.map(['a[2]', 'c[0]'], _.propertyOf(object));
	     * // => [2, 0]
	     *
	     * _.map([['a', '2'], ['c', '0']], _.propertyOf(object));
	     * // => [2, 0]
	     */
	    function propertyOf(object) {
	      return function(path) {
	        return baseGet(object, toPath(path), path + '');
	      };
	    }

	    /**
	     * Creates an array of numbers (positive and/or negative) progressing from
	     * `start` up to, but not including, `end`. If `end` is not specified it is
	     * set to `start` with `start` then set to `0`. If `end` is less than `start`
	     * a zero-length range is created unless a negative `step` is specified.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {number} [start=0] The start of the range.
	     * @param {number} end The end of the range.
	     * @param {number} [step=1] The value to increment or decrement by.
	     * @returns {Array} Returns the new array of numbers.
	     * @example
	     *
	     * _.range(4);
	     * // => [0, 1, 2, 3]
	     *
	     * _.range(1, 5);
	     * // => [1, 2, 3, 4]
	     *
	     * _.range(0, 20, 5);
	     * // => [0, 5, 10, 15]
	     *
	     * _.range(0, -4, -1);
	     * // => [0, -1, -2, -3]
	     *
	     * _.range(1, 4, 0);
	     * // => [1, 1, 1]
	     *
	     * _.range(0);
	     * // => []
	     */
	    function range(start, end, step) {
	      if (step && isIterateeCall(start, end, step)) {
	        end = step = undefined;
	      }
	      start = +start || 0;
	      step = step == null ? 1 : (+step || 0);

	      if (end == null) {
	        end = start;
	        start = 0;
	      } else {
	        end = +end || 0;
	      }
	      // Use `Array(length)` so engines like Chakra and V8 avoid slower modes.
	      // See https://youtu.be/XAqIpGU8ZZk#t=17m25s for more details.
	      var index = -1,
	          length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
	          result = Array(length);

	      while (++index < length) {
	        result[index] = start;
	        start += step;
	      }
	      return result;
	    }

	    /**
	     * Invokes the iteratee function `n` times, returning an array of the results
	     * of each invocation. The `iteratee` is bound to `thisArg` and invoked with
	     * one argument; (index).
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {number} n The number of times to invoke `iteratee`.
	     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {Array} Returns the array of results.
	     * @example
	     *
	     * var diceRolls = _.times(3, _.partial(_.random, 1, 6, false));
	     * // => [3, 6, 4]
	     *
	     * _.times(3, function(n) {
	     *   mage.castSpell(n);
	     * });
	     * // => invokes `mage.castSpell(n)` three times with `n` of `0`, `1`, and `2`
	     *
	     * _.times(3, function(n) {
	     *   this.cast(n);
	     * }, mage);
	     * // => also invokes `mage.castSpell(n)` three times
	     */
	    function times(n, iteratee, thisArg) {
	      n = nativeFloor(n);

	      // Exit early to avoid a JSC JIT bug in Safari 8
	      // where `Array(0)` is treated as `Array(1)`.
	      if (n < 1 || !nativeIsFinite(n)) {
	        return [];
	      }
	      var index = -1,
	          result = Array(nativeMin(n, MAX_ARRAY_LENGTH));

	      iteratee = bindCallback(iteratee, thisArg, 1);
	      while (++index < n) {
	        if (index < MAX_ARRAY_LENGTH) {
	          result[index] = iteratee(index);
	        } else {
	          iteratee(index);
	        }
	      }
	      return result;
	    }

	    /**
	     * Generates a unique ID. If `prefix` is provided the ID is appended to it.
	     *
	     * @static
	     * @memberOf _
	     * @category Utility
	     * @param {string} [prefix] The value to prefix the ID with.
	     * @returns {string} Returns the unique ID.
	     * @example
	     *
	     * _.uniqueId('contact_');
	     * // => 'contact_104'
	     *
	     * _.uniqueId();
	     * // => '105'
	     */
	    function uniqueId(prefix) {
	      var id = ++idCounter;
	      return baseToString(prefix) + id;
	    }

	    /*------------------------------------------------------------------------*/

	    /**
	     * Adds two numbers.
	     *
	     * @static
	     * @memberOf _
	     * @category Math
	     * @param {number} augend The first number to add.
	     * @param {number} addend The second number to add.
	     * @returns {number} Returns the sum.
	     * @example
	     *
	     * _.add(6, 4);
	     * // => 10
	     */
	    function add(augend, addend) {
	      return (+augend || 0) + (+addend || 0);
	    }

	    /**
	     * Calculates `n` rounded up to `precision`.
	     *
	     * @static
	     * @memberOf _
	     * @category Math
	     * @param {number} n The number to round up.
	     * @param {number} [precision=0] The precision to round up to.
	     * @returns {number} Returns the rounded up number.
	     * @example
	     *
	     * _.ceil(4.006);
	     * // => 5
	     *
	     * _.ceil(6.004, 2);
	     * // => 6.01
	     *
	     * _.ceil(6040, -2);
	     * // => 6100
	     */
	    var ceil = createRound('ceil');

	    /**
	     * Calculates `n` rounded down to `precision`.
	     *
	     * @static
	     * @memberOf _
	     * @category Math
	     * @param {number} n The number to round down.
	     * @param {number} [precision=0] The precision to round down to.
	     * @returns {number} Returns the rounded down number.
	     * @example
	     *
	     * _.floor(4.006);
	     * // => 4
	     *
	     * _.floor(0.046, 2);
	     * // => 0.04
	     *
	     * _.floor(4060, -2);
	     * // => 4000
	     */
	    var floor = createRound('floor');

	    /**
	     * Gets the maximum value of `collection`. If `collection` is empty or falsey
	     * `-Infinity` is returned. If an iteratee function is provided it is invoked
	     * for each value in `collection` to generate the criterion by which the value
	     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
	     * arguments: (value, index, collection).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Math
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {*} Returns the maximum value.
	     * @example
	     *
	     * _.max([4, 2, 8, 6]);
	     * // => 8
	     *
	     * _.max([]);
	     * // => -Infinity
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36 },
	     *   { 'user': 'fred',   'age': 40 }
	     * ];
	     *
	     * _.max(users, function(chr) {
	     *   return chr.age;
	     * });
	     * // => { 'user': 'fred', 'age': 40 }
	     *
	     * // using the `_.property` callback shorthand
	     * _.max(users, 'age');
	     * // => { 'user': 'fred', 'age': 40 }
	     */
	    var max = createExtremum(gt, NEGATIVE_INFINITY);

	    /**
	     * Gets the minimum value of `collection`. If `collection` is empty or falsey
	     * `Infinity` is returned. If an iteratee function is provided it is invoked
	     * for each value in `collection` to generate the criterion by which the value
	     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
	     * arguments: (value, index, collection).
	     *
	     * If a property name is provided for `iteratee` the created `_.property`
	     * style callback returns the property value of the given element.
	     *
	     * If a value is also provided for `thisArg` the created `_.matchesProperty`
	     * style callback returns `true` for elements that have a matching property
	     * value, else `false`.
	     *
	     * If an object is provided for `iteratee` the created `_.matches` style
	     * callback returns `true` for elements that have the properties of the given
	     * object, else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Math
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {*} Returns the minimum value.
	     * @example
	     *
	     * _.min([4, 2, 8, 6]);
	     * // => 2
	     *
	     * _.min([]);
	     * // => Infinity
	     *
	     * var users = [
	     *   { 'user': 'barney', 'age': 36 },
	     *   { 'user': 'fred',   'age': 40 }
	     * ];
	     *
	     * _.min(users, function(chr) {
	     *   return chr.age;
	     * });
	     * // => { 'user': 'barney', 'age': 36 }
	     *
	     * // using the `_.property` callback shorthand
	     * _.min(users, 'age');
	     * // => { 'user': 'barney', 'age': 36 }
	     */
	    var min = createExtremum(lt, POSITIVE_INFINITY);

	    /**
	     * Calculates `n` rounded to `precision`.
	     *
	     * @static
	     * @memberOf _
	     * @category Math
	     * @param {number} n The number to round.
	     * @param {number} [precision=0] The precision to round to.
	     * @returns {number} Returns the rounded number.
	     * @example
	     *
	     * _.round(4.006);
	     * // => 4
	     *
	     * _.round(4.006, 2);
	     * // => 4.01
	     *
	     * _.round(4060, -2);
	     * // => 4100
	     */
	    var round = createRound('round');

	    /**
	     * Gets the sum of the values in `collection`.
	     *
	     * @static
	     * @memberOf _
	     * @category Math
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
	     * @param {*} [thisArg] The `this` binding of `iteratee`.
	     * @returns {number} Returns the sum.
	     * @example
	     *
	     * _.sum([4, 6]);
	     * // => 10
	     *
	     * _.sum({ 'a': 4, 'b': 6 });
	     * // => 10
	     *
	     * var objects = [
	     *   { 'n': 4 },
	     *   { 'n': 6 }
	     * ];
	     *
	     * _.sum(objects, function(object) {
	     *   return object.n;
	     * });
	     * // => 10
	     *
	     * // using the `_.property` callback shorthand
	     * _.sum(objects, 'n');
	     * // => 10
	     */
	    function sum(collection, iteratee, thisArg) {
	      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
	        iteratee = undefined;
	      }
	      iteratee = getCallback(iteratee, thisArg, 3);
	      return iteratee.length == 1
	        ? arraySum(isArray(collection) ? collection : toIterable(collection), iteratee)
	        : baseSum(collection, iteratee);
	    }

	    /*------------------------------------------------------------------------*/

	    // Ensure wrappers are instances of `baseLodash`.
	    lodash.prototype = baseLodash.prototype;

	    LodashWrapper.prototype = baseCreate(baseLodash.prototype);
	    LodashWrapper.prototype.constructor = LodashWrapper;

	    LazyWrapper.prototype = baseCreate(baseLodash.prototype);
	    LazyWrapper.prototype.constructor = LazyWrapper;

	    // Add functions to the `Map` cache.
	    MapCache.prototype['delete'] = mapDelete;
	    MapCache.prototype.get = mapGet;
	    MapCache.prototype.has = mapHas;
	    MapCache.prototype.set = mapSet;

	    // Add functions to the `Set` cache.
	    SetCache.prototype.push = cachePush;

	    // Assign cache to `_.memoize`.
	    memoize.Cache = MapCache;

	    // Add functions that return wrapped values when chaining.
	    lodash.after = after;
	    lodash.ary = ary;
	    lodash.assign = assign;
	    lodash.at = at;
	    lodash.before = before;
	    lodash.bind = bind;
	    lodash.bindAll = bindAll;
	    lodash.bindKey = bindKey;
	    lodash.callback = callback;
	    lodash.chain = chain;
	    lodash.chunk = chunk;
	    lodash.compact = compact;
	    lodash.constant = constant;
	    lodash.countBy = countBy;
	    lodash.create = create;
	    lodash.curry = curry;
	    lodash.curryRight = curryRight;
	    lodash.debounce = debounce;
	    lodash.defaults = defaults;
	    lodash.defaultsDeep = defaultsDeep;
	    lodash.defer = defer;
	    lodash.delay = delay;
	    lodash.difference = difference;
	    lodash.drop = drop;
	    lodash.dropRight = dropRight;
	    lodash.dropRightWhile = dropRightWhile;
	    lodash.dropWhile = dropWhile;
	    lodash.fill = fill;
	    lodash.filter = filter;
	    lodash.flatten = flatten;
	    lodash.flattenDeep = flattenDeep;
	    lodash.flow = flow;
	    lodash.flowRight = flowRight;
	    lodash.forEach = forEach;
	    lodash.forEachRight = forEachRight;
	    lodash.forIn = forIn;
	    lodash.forInRight = forInRight;
	    lodash.forOwn = forOwn;
	    lodash.forOwnRight = forOwnRight;
	    lodash.functions = functions;
	    lodash.groupBy = groupBy;
	    lodash.indexBy = indexBy;
	    lodash.initial = initial;
	    lodash.intersection = intersection;
	    lodash.invert = invert;
	    lodash.invoke = invoke;
	    lodash.keys = keys;
	    lodash.keysIn = keysIn;
	    lodash.map = map;
	    lodash.mapKeys = mapKeys;
	    lodash.mapValues = mapValues;
	    lodash.matches = matches;
	    lodash.matchesProperty = matchesProperty;
	    lodash.memoize = memoize;
	    lodash.merge = merge;
	    lodash.method = method;
	    lodash.methodOf = methodOf;
	    lodash.mixin = mixin;
	    lodash.modArgs = modArgs;
	    lodash.negate = negate;
	    lodash.omit = omit;
	    lodash.once = once;
	    lodash.pairs = pairs;
	    lodash.partial = partial;
	    lodash.partialRight = partialRight;
	    lodash.partition = partition;
	    lodash.pick = pick;
	    lodash.pluck = pluck;
	    lodash.property = property;
	    lodash.propertyOf = propertyOf;
	    lodash.pull = pull;
	    lodash.pullAt = pullAt;
	    lodash.range = range;
	    lodash.rearg = rearg;
	    lodash.reject = reject;
	    lodash.remove = remove;
	    lodash.rest = rest;
	    lodash.restParam = restParam;
	    lodash.set = set;
	    lodash.shuffle = shuffle;
	    lodash.slice = slice;
	    lodash.sortBy = sortBy;
	    lodash.sortByAll = sortByAll;
	    lodash.sortByOrder = sortByOrder;
	    lodash.spread = spread;
	    lodash.take = take;
	    lodash.takeRight = takeRight;
	    lodash.takeRightWhile = takeRightWhile;
	    lodash.takeWhile = takeWhile;
	    lodash.tap = tap;
	    lodash.throttle = throttle;
	    lodash.thru = thru;
	    lodash.times = times;
	    lodash.toArray = toArray;
	    lodash.toPlainObject = toPlainObject;
	    lodash.transform = transform;
	    lodash.union = union;
	    lodash.uniq = uniq;
	    lodash.unzip = unzip;
	    lodash.unzipWith = unzipWith;
	    lodash.values = values;
	    lodash.valuesIn = valuesIn;
	    lodash.where = where;
	    lodash.without = without;
	    lodash.wrap = wrap;
	    lodash.xor = xor;
	    lodash.zip = zip;
	    lodash.zipObject = zipObject;
	    lodash.zipWith = zipWith;

	    // Add aliases.
	    lodash.backflow = flowRight;
	    lodash.collect = map;
	    lodash.compose = flowRight;
	    lodash.each = forEach;
	    lodash.eachRight = forEachRight;
	    lodash.extend = assign;
	    lodash.iteratee = callback;
	    lodash.methods = functions;
	    lodash.object = zipObject;
	    lodash.select = filter;
	    lodash.tail = rest;
	    lodash.unique = uniq;

	    // Add functions to `lodash.prototype`.
	    mixin(lodash, lodash);

	    /*------------------------------------------------------------------------*/

	    // Add functions that return unwrapped values when chaining.
	    lodash.add = add;
	    lodash.attempt = attempt;
	    lodash.camelCase = camelCase;
	    lodash.capitalize = capitalize;
	    lodash.ceil = ceil;
	    lodash.clone = clone;
	    lodash.cloneDeep = cloneDeep;
	    lodash.deburr = deburr;
	    lodash.endsWith = endsWith;
	    lodash.escape = escape;
	    lodash.escapeRegExp = escapeRegExp;
	    lodash.every = every;
	    lodash.find = find;
	    lodash.findIndex = findIndex;
	    lodash.findKey = findKey;
	    lodash.findLast = findLast;
	    lodash.findLastIndex = findLastIndex;
	    lodash.findLastKey = findLastKey;
	    lodash.findWhere = findWhere;
	    lodash.first = first;
	    lodash.floor = floor;
	    lodash.get = get;
	    lodash.gt = gt;
	    lodash.gte = gte;
	    lodash.has = has;
	    lodash.identity = identity;
	    lodash.includes = includes;
	    lodash.indexOf = indexOf;
	    lodash.inRange = inRange;
	    lodash.isArguments = isArguments;
	    lodash.isArray = isArray;
	    lodash.isBoolean = isBoolean;
	    lodash.isDate = isDate;
	    lodash.isElement = isElement;
	    lodash.isEmpty = isEmpty;
	    lodash.isEqual = isEqual;
	    lodash.isError = isError;
	    lodash.isFinite = isFinite;
	    lodash.isFunction = isFunction;
	    lodash.isMatch = isMatch;
	    lodash.isNaN = isNaN;
	    lodash.isNative = isNative;
	    lodash.isNull = isNull;
	    lodash.isNumber = isNumber;
	    lodash.isObject = isObject;
	    lodash.isPlainObject = isPlainObject;
	    lodash.isRegExp = isRegExp;
	    lodash.isString = isString;
	    lodash.isTypedArray = isTypedArray;
	    lodash.isUndefined = isUndefined;
	    lodash.kebabCase = kebabCase;
	    lodash.last = last;
	    lodash.lastIndexOf = lastIndexOf;
	    lodash.lt = lt;
	    lodash.lte = lte;
	    lodash.max = max;
	    lodash.min = min;
	    lodash.noConflict = noConflict;
	    lodash.noop = noop;
	    lodash.now = now;
	    lodash.pad = pad;
	    lodash.padLeft = padLeft;
	    lodash.padRight = padRight;
	    lodash.parseInt = parseInt;
	    lodash.random = random;
	    lodash.reduce = reduce;
	    lodash.reduceRight = reduceRight;
	    lodash.repeat = repeat;
	    lodash.result = result;
	    lodash.round = round;
	    lodash.runInContext = runInContext;
	    lodash.size = size;
	    lodash.snakeCase = snakeCase;
	    lodash.some = some;
	    lodash.sortedIndex = sortedIndex;
	    lodash.sortedLastIndex = sortedLastIndex;
	    lodash.startCase = startCase;
	    lodash.startsWith = startsWith;
	    lodash.sum = sum;
	    lodash.template = template;
	    lodash.trim = trim;
	    lodash.trimLeft = trimLeft;
	    lodash.trimRight = trimRight;
	    lodash.trunc = trunc;
	    lodash.unescape = unescape;
	    lodash.uniqueId = uniqueId;
	    lodash.words = words;

	    // Add aliases.
	    lodash.all = every;
	    lodash.any = some;
	    lodash.contains = includes;
	    lodash.eq = isEqual;
	    lodash.detect = find;
	    lodash.foldl = reduce;
	    lodash.foldr = reduceRight;
	    lodash.head = first;
	    lodash.include = includes;
	    lodash.inject = reduce;

	    mixin(lodash, (function() {
	      var source = {};
	      baseForOwn(lodash, function(func, methodName) {
	        if (!lodash.prototype[methodName]) {
	          source[methodName] = func;
	        }
	      });
	      return source;
	    }()), false);

	    /*------------------------------------------------------------------------*/

	    // Add functions capable of returning wrapped and unwrapped values when chaining.
	    lodash.sample = sample;

	    lodash.prototype.sample = function(n) {
	      if (!this.__chain__ && n == null) {
	        return sample(this.value());
	      }
	      return this.thru(function(value) {
	        return sample(value, n);
	      });
	    };

	    /*------------------------------------------------------------------------*/

	    /**
	     * The semantic version number.
	     *
	     * @static
	     * @memberOf _
	     * @type string
	     */
	    lodash.VERSION = VERSION;

	    // Assign default placeholders.
	    arrayEach(['bind', 'bindKey', 'curry', 'curryRight', 'partial', 'partialRight'], function(methodName) {
	      lodash[methodName].placeholder = lodash;
	    });

	    // Add `LazyWrapper` methods for `_.drop` and `_.take` variants.
	    arrayEach(['drop', 'take'], function(methodName, index) {
	      LazyWrapper.prototype[methodName] = function(n) {
	        var filtered = this.__filtered__;
	        if (filtered && !index) {
	          return new LazyWrapper(this);
	        }
	        n = n == null ? 1 : nativeMax(nativeFloor(n) || 0, 0);

	        var result = this.clone();
	        if (filtered) {
	          result.__takeCount__ = nativeMin(result.__takeCount__, n);
	        } else {
	          result.__views__.push({ 'size': n, 'type': methodName + (result.__dir__ < 0 ? 'Right' : '') });
	        }
	        return result;
	      };

	      LazyWrapper.prototype[methodName + 'Right'] = function(n) {
	        return this.reverse()[methodName](n).reverse();
	      };
	    });

	    // Add `LazyWrapper` methods that accept an `iteratee` value.
	    arrayEach(['filter', 'map', 'takeWhile'], function(methodName, index) {
	      var type = index + 1,
	          isFilter = type != LAZY_MAP_FLAG;

	      LazyWrapper.prototype[methodName] = function(iteratee, thisArg) {
	        var result = this.clone();
	        result.__iteratees__.push({ 'iteratee': getCallback(iteratee, thisArg, 1), 'type': type });
	        result.__filtered__ = result.__filtered__ || isFilter;
	        return result;
	      };
	    });

	    // Add `LazyWrapper` methods for `_.first` and `_.last`.
	    arrayEach(['first', 'last'], function(methodName, index) {
	      var takeName = 'take' + (index ? 'Right' : '');

	      LazyWrapper.prototype[methodName] = function() {
	        return this[takeName](1).value()[0];
	      };
	    });

	    // Add `LazyWrapper` methods for `_.initial` and `_.rest`.
	    arrayEach(['initial', 'rest'], function(methodName, index) {
	      var dropName = 'drop' + (index ? '' : 'Right');

	      LazyWrapper.prototype[methodName] = function() {
	        return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
	      };
	    });

	    // Add `LazyWrapper` methods for `_.pluck` and `_.where`.
	    arrayEach(['pluck', 'where'], function(methodName, index) {
	      var operationName = index ? 'filter' : 'map',
	          createCallback = index ? baseMatches : property;

	      LazyWrapper.prototype[methodName] = function(value) {
	        return this[operationName](createCallback(value));
	      };
	    });

	    LazyWrapper.prototype.compact = function() {
	      return this.filter(identity);
	    };

	    LazyWrapper.prototype.reject = function(predicate, thisArg) {
	      predicate = getCallback(predicate, thisArg, 1);
	      return this.filter(function(value) {
	        return !predicate(value);
	      });
	    };

	    LazyWrapper.prototype.slice = function(start, end) {
	      start = start == null ? 0 : (+start || 0);

	      var result = this;
	      if (result.__filtered__ && (start > 0 || end < 0)) {
	        return new LazyWrapper(result);
	      }
	      if (start < 0) {
	        result = result.takeRight(-start);
	      } else if (start) {
	        result = result.drop(start);
	      }
	      if (end !== undefined) {
	        end = (+end || 0);
	        result = end < 0 ? result.dropRight(-end) : result.take(end - start);
	      }
	      return result;
	    };

	    LazyWrapper.prototype.takeRightWhile = function(predicate, thisArg) {
	      return this.reverse().takeWhile(predicate, thisArg).reverse();
	    };

	    LazyWrapper.prototype.toArray = function() {
	      return this.take(POSITIVE_INFINITY);
	    };

	    // Add `LazyWrapper` methods to `lodash.prototype`.
	    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
	      var checkIteratee = /^(?:filter|map|reject)|While$/.test(methodName),
	          retUnwrapped = /^(?:first|last)$/.test(methodName),
	          lodashFunc = lodash[retUnwrapped ? ('take' + (methodName == 'last' ? 'Right' : '')) : methodName];

	      if (!lodashFunc) {
	        return;
	      }
	      lodash.prototype[methodName] = function() {
	        var args = retUnwrapped ? [1] : arguments,
	            chainAll = this.__chain__,
	            value = this.__wrapped__,
	            isHybrid = !!this.__actions__.length,
	            isLazy = value instanceof LazyWrapper,
	            iteratee = args[0],
	            useLazy = isLazy || isArray(value);

	        if (useLazy && checkIteratee && typeof iteratee == 'function' && iteratee.length != 1) {
	          // Avoid lazy use if the iteratee has a "length" value other than `1`.
	          isLazy = useLazy = false;
	        }
	        var interceptor = function(value) {
	          return (retUnwrapped && chainAll)
	            ? lodashFunc(value, 1)[0]
	            : lodashFunc.apply(undefined, arrayPush([value], args));
	        };

	        var action = { 'func': thru, 'args': [interceptor], 'thisArg': undefined },
	            onlyLazy = isLazy && !isHybrid;

	        if (retUnwrapped && !chainAll) {
	          if (onlyLazy) {
	            value = value.clone();
	            value.__actions__.push(action);
	            return func.call(value);
	          }
	          return lodashFunc.call(undefined, this.value())[0];
	        }
	        if (!retUnwrapped && useLazy) {
	          value = onlyLazy ? value : new LazyWrapper(this);
	          var result = func.apply(value, args);
	          result.__actions__.push(action);
	          return new LodashWrapper(result, chainAll);
	        }
	        return this.thru(interceptor);
	      };
	    });

	    // Add `Array` and `String` methods to `lodash.prototype`.
	    arrayEach(['join', 'pop', 'push', 'replace', 'shift', 'sort', 'splice', 'split', 'unshift'], function(methodName) {
	      var func = (/^(?:replace|split)$/.test(methodName) ? stringProto : arrayProto)[methodName],
	          chainName = /^(?:push|sort|unshift)$/.test(methodName) ? 'tap' : 'thru',
	          retUnwrapped = /^(?:join|pop|replace|shift)$/.test(methodName);

	      lodash.prototype[methodName] = function() {
	        var args = arguments;
	        if (retUnwrapped && !this.__chain__) {
	          return func.apply(this.value(), args);
	        }
	        return this[chainName](function(value) {
	          return func.apply(value, args);
	        });
	      };
	    });

	    // Map minified function names to their real names.
	    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
	      var lodashFunc = lodash[methodName];
	      if (lodashFunc) {
	        var key = lodashFunc.name,
	            names = realNames[key] || (realNames[key] = []);

	        names.push({ 'name': methodName, 'func': lodashFunc });
	      }
	    });

	    realNames[createHybridWrapper(undefined, BIND_KEY_FLAG).name] = [{ 'name': 'wrapper', 'func': undefined }];

	    // Add functions to the lazy wrapper.
	    LazyWrapper.prototype.clone = lazyClone;
	    LazyWrapper.prototype.reverse = lazyReverse;
	    LazyWrapper.prototype.value = lazyValue;

	    // Add chaining functions to the `lodash` wrapper.
	    lodash.prototype.chain = wrapperChain;
	    lodash.prototype.commit = wrapperCommit;
	    lodash.prototype.concat = wrapperConcat;
	    lodash.prototype.plant = wrapperPlant;
	    lodash.prototype.reverse = wrapperReverse;
	    lodash.prototype.toString = wrapperToString;
	    lodash.prototype.run = lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;

	    // Add function aliases to the `lodash` wrapper.
	    lodash.prototype.collect = lodash.prototype.map;
	    lodash.prototype.head = lodash.prototype.first;
	    lodash.prototype.select = lodash.prototype.filter;
	    lodash.prototype.tail = lodash.prototype.rest;

	    return lodash;
	  }

	  /*--------------------------------------------------------------------------*/

	  // Export lodash.
	  var _ = runInContext();

	  // Some AMD build optimizers like r.js check for condition patterns like the following:
	  if (true) {
	    // Expose lodash to the global object when an AMD loader is present to avoid
	    // errors in cases where lodash is loaded by a script tag and not intended
	    // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
	    // more details.
	    root._ = _;

	    // Define as an anonymous module so, through path mapping, it can be
	    // referenced as the "underscore" module.
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return _;
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }
	  // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
	  else if (freeExports && freeModule) {
	    // Export for Node.js or RingoJS.
	    if (moduleExports) {
	      (freeModule.exports = _)._ = _;
	    }
	    // Export for Rhino with CommonJS support.
	    else {
	      freeExports._ = _;
	    }
	  }
	  else {
	    // Export for a browser or Rhino.
	    root._ = _;
	  }
	}.call(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module), (function() { return this; }())))

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * riveter - Mix-in, inheritance and constructor extend behavior for your JavaScript enjoyment.
	 * © 2012 - Copyright appendTo, LLC 
	 * Author(s): Jim Cowart, Nicholas Cloud, Doug Neiner
	 * Version: v0.2.0
	 * Url: https://github.com/a2labs/riveter
	 * License(s): MIT, GPL
	 */
	(function (root, factory) {
	    if (true) {
	        // AMD. Register as an anonymous module.
	        !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(7)], __WEBPACK_AMD_DEFINE_RESULT__ = function (_) {
	            return factory(_, root);
	        }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof module === "object" && module.exports) {
	        // Node, or CommonJS-Like environments
	        module.exports = factory(require("lodash"));
	    } else {
	        // Browser globals
	        root.riveter = factory(root._, root);
	    }
	}(this, function (_, global, undefined) {
	    var slice = Array.prototype.slice;
	    var riveter = function () {
	        var args = slice.call(arguments, 0);
	        while (args.length) {
	            riveter.rivet(args.shift());
	        }
	    };
	    function getActualType(val) {
	        if (_.isArray(val)) {
	            return "array";
	        }
	        if (_.isDate(val)) {
	            return "date";
	        }
	        if (_.isRegExp(val)) {
	            return "regex";
	        }
	        return typeof val;
	    }
	    function getHandlerName(val) {
	        var propType = getActualType(val);
	        return behavior[propType] ? propType : "*";
	    }
	    var behavior = {
	        "*": function (obj, sourcePropKey, sourcePropVal) {
	            obj[sourcePropKey] = sourcePropVal;
	        },
	        "object": function (obj, sourcePropKey, sourcePropVal) {
	            obj[sourcePropKey] = deepExtend(obj[sourcePropKey] || {}, sourcePropVal);
	        },
	        "array": function (obj, sourcePropKey, sourcePropVal) {
	            obj[sourcePropKey] = [];
	            _.each(sourcePropVal, function (item, idx) {
	                behavior[getHandlerName(item)](obj[sourcePropKey], idx, item);
	            }, this);
	        }
	    };
	    function deepExtend(obj) {
	        _.each(slice.call(arguments, 1), function (source) {
	            _.each(source, function (sourcePropVal, sourcePropKey) {
	                behavior[getHandlerName(sourcePropVal)](obj, sourcePropKey, sourcePropVal);
	            });
	        });
	        return obj;
	    }
	    riveter.rivet = function (fn) {
	        if (!fn.hasOwnProperty("extend")) {
	            fn.extend = function (props, ctorProps, options) {
	                return riveter.extend(fn, props, ctorProps, options);
	            };
	        }
	        if (!fn.hasOwnProperty("compose")) {
	            fn.compose = function () {
	                return riveter.compose.apply(this, [fn].concat(slice.call(arguments, 0)));
	            };
	        }
	        if (!fn.hasOwnProperty("inherits")) {
	            fn.inherits = function (parent, ctorProps, options) {
	                return riveter.inherits(fn, parent, ctorProps, options);
	            };
	        }
	        if (!fn.hasOwnProperty("mixin")) {
	            fn.mixin = function () {
	                return riveter.mixin.apply(this, ([fn].concat(slice.call(arguments, 0))));
	            };
	        }
	        if (!fn.hasOwnProperty("punch")) {
	            fn.punch = function () {
	                return riveter.punch.apply(this, ([fn].concat(slice.call(arguments, 0))));
	            };
	        }
	    };
	    riveter.inherits = function (child, parent, ctorProps, options) {
	        options = options || {};
	        var childProto;
	        var TmpCtor = function () {};
	        var Child = function () {
	            parent.apply(this, arguments);
	        };
	        if (typeof child === "object") {
	            if (child.hasOwnProperty("constructor")) {
	                Child = child.constructor;
	            }
	            childProto = child;
	        } else {
	            Child = child;
	            childProto = child.prototype;
	        }
	        riveter.rivet(Child);
	        if (options.deep) {
	            deepExtend(Child, parent, ctorProps);
	        } else {
	            _.defaults(Child, parent, ctorProps);
	        }
	        TmpCtor.prototype = parent.prototype;
	        Child.prototype = new TmpCtor();
	        if (options.deep) {
	            deepExtend(Child.prototype, childProto, {
	                constructor: Child
	            });
	        } else {
	            _.extend(Child.prototype, childProto, {
	                constructor: Child
	            });
	        }
	        Child.__super = parent;
	        // Next line is all about Backbone compatibility
	        Child.__super__ = parent.prototype;
	        return Child;
	    };
	    riveter.extend = function (ctor, props, ctorProps, options) {
	        return riveter.inherits(props, ctor, ctorProps, options);
	    };
	    riveter.compose = function () {
	        var args = slice.call(arguments, 0);
	        var ctor = args.shift();
	        riveter.rivet(ctor);
	        var mixin = _.reduce(args, function (memo, val) {
	            if (val.hasOwnProperty("_preInit")) {
	                memo.preInit.push(val._preInit);
	            }
	            if (val.hasOwnProperty("_postInit")) {
	                memo.postInit.push(val._postInit);
	            }
	            val = val.mixin || val;
	            memo.items.push(val);
	            return memo;
	        }, {
	            items: [],
	            preInit: [],
	            postInit: []
	        });
	        var res = ctor.extend({
	            constructor: function () {
	                var args = slice.call(arguments, 0);
	                _.each(mixin.preInit, function (initializer) {
	                    initializer.apply(this, args);
	                }, this);
	                ctor.prototype.constructor.apply(this, args);
	                _.each(mixin.postInit, function (initializer) {
	                    initializer.apply(this, args);
	                }, this);
	            }
	        });
	        riveter.rivet(res);
	        _.defaults(res.prototype, _.extend.apply(null, [{}].concat(mixin.items)));
	        return res;
	    };
	    riveter.mixin = function () {
	        var args = slice.call(arguments, 0);
	        var ctor = args.shift();
	        riveter.rivet(ctor);
	        _.defaults(ctor.prototype, _.extend.apply(null, [{}].concat(args)));
	        return ctor;
	    };
	    riveter.punch = function () {
	        var args = slice.call(arguments, 0);
	        var ctor = args.shift();
	        riveter.rivet(ctor);
	        _.extend(ctor.prototype, _.extend.apply(null, [{}].concat(args)));
	        return ctor;
	    };
	    return riveter;
	}));

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/**
	 * @license
	 * Lo-Dash 2.4.2 (Custom Build) <https://lodash.com/>
	 * Build: `lodash -o ./dist/lodash.compat.js`
	 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
	 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
	 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 * Available under MIT license <https://lodash.com/license>
	 */
	;(function() {

	  /** Used as a safe reference for `undefined` in pre ES5 environments */
	  var undefined;

	  /** Used to pool arrays and objects used internally */
	  var arrayPool = [],
	      objectPool = [];

	  /** Used to generate unique IDs */
	  var idCounter = 0;

	  /** Used internally to indicate various things */
	  var indicatorObject = {};

	  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
	  var keyPrefix = +new Date + '';

	  /** Used as the size when optimizations are enabled for large arrays */
	  var largeArraySize = 75;

	  /** Used as the max size of the `arrayPool` and `objectPool` */
	  var maxPoolSize = 40;

	  /** Used to detect and test whitespace */
	  var whitespace = (
	    // whitespace
	    ' \t\x0B\f\xA0\ufeff' +

	    // line terminators
	    '\n\r\u2028\u2029' +

	    // unicode category "Zs" space separators
	    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
	  );

	  /** Used to match empty string literals in compiled template source */
	  var reEmptyStringLeading = /\b__p \+= '';/g,
	      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
	      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

	  /**
	   * Used to match ES6 template delimiters
	   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
	   */
	  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

	  /** Used to match regexp flags from their coerced string values */
	  var reFlags = /\w*$/;

	  /** Used to detected named functions */
	  var reFuncName = /^\s*function[ \n\r\t]+\w/;

	  /** Used to match "interpolate" template delimiters */
	  var reInterpolate = /<%=([\s\S]+?)%>/g;

	  /** Used to match leading whitespace and zeros to be removed */
	  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

	  /** Used to ensure capturing order of template delimiters */
	  var reNoMatch = /($^)/;

	  /** Used to detect functions containing a `this` reference */
	  var reThis = /\bthis\b/;

	  /** Used to match unescaped characters in compiled string literals */
	  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

	  /** Used to assign default `context` object properties */
	  var contextProps = [
	    'Array', 'Boolean', 'Date', 'Error', 'Function', 'Math', 'Number', 'Object',
	    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
	    'parseInt', 'setTimeout'
	  ];

	  /** Used to fix the JScript [[DontEnum]] bug */
	  var shadowedProps = [
	    'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
	    'toLocaleString', 'toString', 'valueOf'
	  ];

	  /** Used to make template sourceURLs easier to identify */
	  var templateCounter = 0;

	  /** `Object#toString` result shortcuts */
	  var argsClass = '[object Arguments]',
	      arrayClass = '[object Array]',
	      boolClass = '[object Boolean]',
	      dateClass = '[object Date]',
	      errorClass = '[object Error]',
	      funcClass = '[object Function]',
	      numberClass = '[object Number]',
	      objectClass = '[object Object]',
	      regexpClass = '[object RegExp]',
	      stringClass = '[object String]';

	  /** Used to identify object classifications that `_.clone` supports */
	  var cloneableClasses = {};
	  cloneableClasses[funcClass] = false;
	  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
	  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
	  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
	  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

	  /** Used as an internal `_.debounce` options object */
	  var debounceOptions = {
	    'leading': false,
	    'maxWait': 0,
	    'trailing': false
	  };

	  /** Used as the property descriptor for `__bindData__` */
	  var descriptor = {
	    'configurable': false,
	    'enumerable': false,
	    'value': null,
	    'writable': false
	  };

	  /** Used as the data object for `iteratorTemplate` */
	  var iteratorData = {
	    'args': '',
	    'array': null,
	    'bottom': '',
	    'firstArg': '',
	    'init': '',
	    'keys': null,
	    'loop': '',
	    'shadowedProps': null,
	    'support': null,
	    'top': '',
	    'useHas': false
	  };

	  /** Used to determine if values are of the language type Object */
	  var objectTypes = {
	    'boolean': false,
	    'function': true,
	    'object': true,
	    'number': false,
	    'string': false,
	    'undefined': false
	  };

	  /** Used to escape characters for inclusion in compiled string literals */
	  var stringEscapes = {
	    '\\': '\\',
	    "'": "'",
	    '\n': 'n',
	    '\r': 'r',
	    '\t': 't',
	    '\u2028': 'u2028',
	    '\u2029': 'u2029'
	  };

	  /** Used as a reference to the global object */
	  var root = (objectTypes[typeof window] && window) || this;

	  /** Detect free variable `exports` */
	  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

	  /** Detect free variable `module` */
	  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

	  /** Detect the popular CommonJS extension `module.exports` */
	  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

	  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
	  var freeGlobal = objectTypes[typeof global] && global;
	  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
	    root = freeGlobal;
	  }

	  /*--------------------------------------------------------------------------*/

	  /**
	   * The base implementation of `_.indexOf` without support for binary searches
	   * or `fromIndex` constraints.
	   *
	   * @private
	   * @param {Array} array The array to search.
	   * @param {*} value The value to search for.
	   * @param {number} [fromIndex=0] The index to search from.
	   * @returns {number} Returns the index of the matched value or `-1`.
	   */
	  function baseIndexOf(array, value, fromIndex) {
	    var index = (fromIndex || 0) - 1,
	        length = array ? array.length : 0;

	    while (++index < length) {
	      if (array[index] === value) {
	        return index;
	      }
	    }
	    return -1;
	  }

	  /**
	   * An implementation of `_.contains` for cache objects that mimics the return
	   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
	   *
	   * @private
	   * @param {Object} cache The cache object to inspect.
	   * @param {*} value The value to search for.
	   * @returns {number} Returns `0` if `value` is found, else `-1`.
	   */
	  function cacheIndexOf(cache, value) {
	    var type = typeof value;
	    cache = cache.cache;

	    if (type == 'boolean' || value == null) {
	      return cache[value] ? 0 : -1;
	    }
	    if (type != 'number' && type != 'string') {
	      type = 'object';
	    }
	    var key = type == 'number' ? value : keyPrefix + value;
	    cache = (cache = cache[type]) && cache[key];

	    return type == 'object'
	      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
	      : (cache ? 0 : -1);
	  }

	  /**
	   * Adds a given value to the corresponding cache object.
	   *
	   * @private
	   * @param {*} value The value to add to the cache.
	   */
	  function cachePush(value) {
	    var cache = this.cache,
	        type = typeof value;

	    if (type == 'boolean' || value == null) {
	      cache[value] = true;
	    } else {
	      if (type != 'number' && type != 'string') {
	        type = 'object';
	      }
	      var key = type == 'number' ? value : keyPrefix + value,
	          typeCache = cache[type] || (cache[type] = {});

	      if (type == 'object') {
	        (typeCache[key] || (typeCache[key] = [])).push(value);
	      } else {
	        typeCache[key] = true;
	      }
	    }
	  }

	  /**
	   * Used by `_.max` and `_.min` as the default callback when a given
	   * collection is a string value.
	   *
	   * @private
	   * @param {string} value The character to inspect.
	   * @returns {number} Returns the code unit of given character.
	   */
	  function charAtCallback(value) {
	    return value.charCodeAt(0);
	  }

	  /**
	   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
	   * them in ascending order.
	   *
	   * @private
	   * @param {Object} a The object to compare to `b`.
	   * @param {Object} b The object to compare to `a`.
	   * @returns {number} Returns the sort order indicator of `1` or `-1`.
	   */
	  function compareAscending(a, b) {
	    var ac = a.criteria,
	        bc = b.criteria,
	        index = -1,
	        length = ac.length;

	    while (++index < length) {
	      var value = ac[index],
	          other = bc[index];

	      if (value !== other) {
	        if (value > other || typeof value == 'undefined') {
	          return 1;
	        }
	        if (value < other || typeof other == 'undefined') {
	          return -1;
	        }
	      }
	    }
	    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
	    // that causes it, under certain circumstances, to return the same value for
	    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
	    //
	    // This also ensures a stable sort in V8 and other engines.
	    // See http://code.google.com/p/v8/issues/detail?id=90
	    return a.index - b.index;
	  }

	  /**
	   * Creates a cache object to optimize linear searches of large arrays.
	   *
	   * @private
	   * @param {Array} [array=[]] The array to search.
	   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
	   */
	  function createCache(array) {
	    var index = -1,
	        length = array.length,
	        first = array[0],
	        mid = array[(length / 2) | 0],
	        last = array[length - 1];

	    if (first && typeof first == 'object' &&
	        mid && typeof mid == 'object' && last && typeof last == 'object') {
	      return false;
	    }
	    var cache = getObject();
	    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

	    var result = getObject();
	    result.array = array;
	    result.cache = cache;
	    result.push = cachePush;

	    while (++index < length) {
	      result.push(array[index]);
	    }
	    return result;
	  }

	  /**
	   * Used by `template` to escape characters for inclusion in compiled
	   * string literals.
	   *
	   * @private
	   * @param {string} match The matched character to escape.
	   * @returns {string} Returns the escaped character.
	   */
	  function escapeStringChar(match) {
	    return '\\' + stringEscapes[match];
	  }

	  /**
	   * Gets an array from the array pool or creates a new one if the pool is empty.
	   *
	   * @private
	   * @returns {Array} The array from the pool.
	   */
	  function getArray() {
	    return arrayPool.pop() || [];
	  }

	  /**
	   * Gets an object from the object pool or creates a new one if the pool is empty.
	   *
	   * @private
	   * @returns {Object} The object from the pool.
	   */
	  function getObject() {
	    return objectPool.pop() || {
	      'array': null,
	      'cache': null,
	      'criteria': null,
	      'false': false,
	      'index': 0,
	      'null': false,
	      'number': null,
	      'object': null,
	      'push': null,
	      'string': null,
	      'true': false,
	      'undefined': false,
	      'value': null
	    };
	  }

	  /**
	   * Checks if `value` is a DOM node in IE < 9.
	   *
	   * @private
	   * @param {*} value The value to check.
	   * @returns {boolean} Returns `true` if the `value` is a DOM node, else `false`.
	   */
	  function isNode(value) {
	    // IE < 9 presents DOM nodes as `Object` objects except they have `toString`
	    // methods that are `typeof` "string" and still can coerce nodes to strings
	    return typeof value.toString != 'function' && typeof (value + '') == 'string';
	  }

	  /**
	   * Releases the given array back to the array pool.
	   *
	   * @private
	   * @param {Array} [array] The array to release.
	   */
	  function releaseArray(array) {
	    array.length = 0;
	    if (arrayPool.length < maxPoolSize) {
	      arrayPool.push(array);
	    }
	  }

	  /**
	   * Releases the given object back to the object pool.
	   *
	   * @private
	   * @param {Object} [object] The object to release.
	   */
	  function releaseObject(object) {
	    var cache = object.cache;
	    if (cache) {
	      releaseObject(cache);
	    }
	    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
	    if (objectPool.length < maxPoolSize) {
	      objectPool.push(object);
	    }
	  }

	  /**
	   * Slices the `collection` from the `start` index up to, but not including,
	   * the `end` index.
	   *
	   * Note: This function is used instead of `Array#slice` to support node lists
	   * in IE < 9 and to ensure dense arrays are returned.
	   *
	   * @private
	   * @param {Array|Object|string} collection The collection to slice.
	   * @param {number} start The start index.
	   * @param {number} end The end index.
	   * @returns {Array} Returns the new array.
	   */
	  function slice(array, start, end) {
	    start || (start = 0);
	    if (typeof end == 'undefined') {
	      end = array ? array.length : 0;
	    }
	    var index = -1,
	        length = end - start || 0,
	        result = Array(length < 0 ? 0 : length);

	    while (++index < length) {
	      result[index] = array[start + index];
	    }
	    return result;
	  }

	  /*--------------------------------------------------------------------------*/

	  /**
	   * Create a new `lodash` function using the given context object.
	   *
	   * @static
	   * @memberOf _
	   * @category Utilities
	   * @param {Object} [context=root] The context object.
	   * @returns {Function} Returns the `lodash` function.
	   */
	  function runInContext(context) {
	    // Avoid issues with some ES3 environments that attempt to use values, named
	    // after built-in constructors like `Object`, for the creation of literals.
	    // ES5 clears this up by stating that literals must use built-in constructors.
	    // See http://es5.github.io/#x11.1.5.
	    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

	    /** Native constructor references */
	    var Array = context.Array,
	        Boolean = context.Boolean,
	        Date = context.Date,
	        Error = context.Error,
	        Function = context.Function,
	        Math = context.Math,
	        Number = context.Number,
	        Object = context.Object,
	        RegExp = context.RegExp,
	        String = context.String,
	        TypeError = context.TypeError;

	    /**
	     * Used for `Array` method references.
	     *
	     * Normally `Array.prototype` would suffice, however, using an array literal
	     * avoids issues in Narwhal.
	     */
	    var arrayRef = [];

	    /** Used for native method references */
	    var errorProto = Error.prototype,
	        objectProto = Object.prototype,
	        stringProto = String.prototype;

	    /** Used to restore the original `_` reference in `noConflict` */
	    var oldDash = context._;

	    /** Used to resolve the internal [[Class]] of values */
	    var toString = objectProto.toString;

	    /** Used to detect if a method is native */
	    var reNative = RegExp('^' +
	      String(toString)
	        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	        .replace(/toString| for [^\]]+/g, '.*?') + '$'
	    );

	    /** Native method shortcuts */
	    var ceil = Math.ceil,
	        clearTimeout = context.clearTimeout,
	        floor = Math.floor,
	        fnToString = Function.prototype.toString,
	        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
	        hasOwnProperty = objectProto.hasOwnProperty,
	        push = arrayRef.push,
	        propertyIsEnumerable = objectProto.propertyIsEnumerable,
	        setTimeout = context.setTimeout,
	        splice = arrayRef.splice,
	        unshift = arrayRef.unshift;

	    /** Used to set meta data on functions */
	    var defineProperty = (function() {
	      // IE 8 only accepts DOM elements
	      try {
	        var o = {},
	            func = isNative(func = Object.defineProperty) && func,
	            result = func(o, o, o) && func;
	      } catch(e) { }
	      return result;
	    }());

	    /* Native method shortcuts for methods with the same name as other `lodash` methods */
	    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
	        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
	        nativeIsFinite = context.isFinite,
	        nativeIsNaN = context.isNaN,
	        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
	        nativeMax = Math.max,
	        nativeMin = Math.min,
	        nativeParseInt = context.parseInt,
	        nativeRandom = Math.random;

	    /** Used to lookup a built-in constructor by [[Class]] */
	    var ctorByClass = {};
	    ctorByClass[arrayClass] = Array;
	    ctorByClass[boolClass] = Boolean;
	    ctorByClass[dateClass] = Date;
	    ctorByClass[funcClass] = Function;
	    ctorByClass[objectClass] = Object;
	    ctorByClass[numberClass] = Number;
	    ctorByClass[regexpClass] = RegExp;
	    ctorByClass[stringClass] = String;

	    /** Used to avoid iterating non-enumerable properties in IE < 9 */
	    var nonEnumProps = {};
	    nonEnumProps[arrayClass] = nonEnumProps[dateClass] = nonEnumProps[numberClass] = { 'constructor': true, 'toLocaleString': true, 'toString': true, 'valueOf': true };
	    nonEnumProps[boolClass] = nonEnumProps[stringClass] = { 'constructor': true, 'toString': true, 'valueOf': true };
	    nonEnumProps[errorClass] = nonEnumProps[funcClass] = nonEnumProps[regexpClass] = { 'constructor': true, 'toString': true };
	    nonEnumProps[objectClass] = { 'constructor': true };

	    (function() {
	      var length = shadowedProps.length;
	      while (length--) {
	        var key = shadowedProps[length];
	        for (var className in nonEnumProps) {
	          if (hasOwnProperty.call(nonEnumProps, className) && !hasOwnProperty.call(nonEnumProps[className], key)) {
	            nonEnumProps[className][key] = false;
	          }
	        }
	      }
	    }());

	    /*--------------------------------------------------------------------------*/

	    /**
	     * Creates a `lodash` object which wraps the given value to enable intuitive
	     * method chaining.
	     *
	     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
	     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
	     * and `unshift`
	     *
	     * Chaining is supported in custom builds as long as the `value` method is
	     * implicitly or explicitly included in the build.
	     *
	     * The chainable wrapper functions are:
	     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
	     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
	     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
	     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
	     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
	     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
	     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
	     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
	     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
	     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
	     * and `zip`
	     *
	     * The non-chainable wrapper functions are:
	     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
	     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
	     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
	     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
	     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
	     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
	     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
	     * `template`, `unescape`, `uniqueId`, and `value`
	     *
	     * The wrapper functions `first` and `last` return wrapped values when `n` is
	     * provided, otherwise they return unwrapped values.
	     *
	     * Explicit chaining can be enabled by using the `_.chain` method.
	     *
	     * @name _
	     * @constructor
	     * @category Chaining
	     * @param {*} value The value to wrap in a `lodash` instance.
	     * @returns {Object} Returns a `lodash` instance.
	     * @example
	     *
	     * var wrapped = _([1, 2, 3]);
	     *
	     * // returns an unwrapped value
	     * wrapped.reduce(function(sum, num) {
	     *   return sum + num;
	     * });
	     * // => 6
	     *
	     * // returns a wrapped value
	     * var squares = wrapped.map(function(num) {
	     *   return num * num;
	     * });
	     *
	     * _.isArray(squares);
	     * // => false
	     *
	     * _.isArray(squares.value());
	     * // => true
	     */
	    function lodash(value) {
	      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
	      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
	       ? value
	       : new lodashWrapper(value);
	    }

	    /**
	     * A fast path for creating `lodash` wrapper objects.
	     *
	     * @private
	     * @param {*} value The value to wrap in a `lodash` instance.
	     * @param {boolean} chainAll A flag to enable chaining for all methods
	     * @returns {Object} Returns a `lodash` instance.
	     */
	    function lodashWrapper(value, chainAll) {
	      this.__chain__ = !!chainAll;
	      this.__wrapped__ = value;
	    }
	    // ensure `new lodashWrapper` is an instance of `lodash`
	    lodashWrapper.prototype = lodash.prototype;

	    /**
	     * An object used to flag environments features.
	     *
	     * @static
	     * @memberOf _
	     * @type Object
	     */
	    var support = lodash.support = {};

	    (function() {
	      var ctor = function() { this.x = 1; },
	          object = { '0': 1, 'length': 1 },
	          props = [];

	      ctor.prototype = { 'valueOf': 1, 'y': 1 };
	      for (var key in new ctor) { props.push(key); }
	      for (key in arguments) { }

	      /**
	       * Detect if an `arguments` object's [[Class]] is resolvable (all but Firefox < 4, IE < 9).
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.argsClass = toString.call(arguments) == argsClass;

	      /**
	       * Detect if `arguments` objects are `Object` objects (all but Narwhal and Opera < 10.5).
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.argsObject = arguments.constructor == Object && !(arguments instanceof Array);

	      /**
	       * Detect if `name` or `message` properties of `Error.prototype` are
	       * enumerable by default. (IE < 9, Safari < 5.1)
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.enumErrorProps = propertyIsEnumerable.call(errorProto, 'message') || propertyIsEnumerable.call(errorProto, 'name');

	      /**
	       * Detect if `prototype` properties are enumerable by default.
	       *
	       * Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1
	       * (if the prototype or a property on the prototype has been set)
	       * incorrectly sets a function's `prototype` property [[Enumerable]]
	       * value to `true`.
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.enumPrototypes = propertyIsEnumerable.call(ctor, 'prototype');

	      /**
	       * Detect if functions can be decompiled by `Function#toString`
	       * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

	      /**
	       * Detect if `Function#name` is supported (all but IE).
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.funcNames = typeof Function.name == 'string';

	      /**
	       * Detect if `arguments` object indexes are non-enumerable
	       * (Firefox < 4, IE < 9, PhantomJS, Safari < 5.1).
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.nonEnumArgs = key != 0;

	      /**
	       * Detect if properties shadowing those on `Object.prototype` are non-enumerable.
	       *
	       * In IE < 9 an objects own properties, shadowing non-enumerable ones, are
	       * made non-enumerable as well (a.k.a the JScript [[DontEnum]] bug).
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.nonEnumShadows = !/valueOf/.test(props);

	      /**
	       * Detect if own properties are iterated after inherited properties (all but IE < 9).
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.ownLast = props[0] != 'x';

	      /**
	       * Detect if `Array#shift` and `Array#splice` augment array-like objects correctly.
	       *
	       * Firefox < 10, IE compatibility mode, and IE < 9 have buggy Array `shift()`
	       * and `splice()` functions that fail to remove the last element, `value[0]`,
	       * of array-like objects even though the `length` property is set to `0`.
	       * The `shift()` method is buggy in IE 8 compatibility mode, while `splice()`
	       * is buggy regardless of mode in IE < 9 and buggy in compatibility mode in IE 9.
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.spliceObjects = (arrayRef.splice.call(object, 0, 1), !object[0]);

	      /**
	       * Detect lack of support for accessing string characters by index.
	       *
	       * IE < 8 can't access characters by index and IE 8 can only access
	       * characters by index on string literals.
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      support.unindexedChars = ('x'[0] + Object('x')[0]) != 'xx';

	      /**
	       * Detect if a DOM node's [[Class]] is resolvable (all but IE < 9)
	       * and that the JS engine errors when attempting to coerce an object to
	       * a string without a `toString` function.
	       *
	       * @memberOf _.support
	       * @type boolean
	       */
	      try {
	        support.nodeClass = !(toString.call(document) == objectClass && !({ 'toString': 0 } + ''));
	      } catch(e) {
	        support.nodeClass = true;
	      }
	    }(1));

	    /**
	     * By default, the template delimiters used by Lo-Dash are similar to those in
	     * embedded Ruby (ERB). Change the following template settings to use alternative
	     * delimiters.
	     *
	     * @static
	     * @memberOf _
	     * @type Object
	     */
	    lodash.templateSettings = {

	      /**
	       * Used to detect `data` property values to be HTML-escaped.
	       *
	       * @memberOf _.templateSettings
	       * @type RegExp
	       */
	      'escape': /<%-([\s\S]+?)%>/g,

	      /**
	       * Used to detect code to be evaluated.
	       *
	       * @memberOf _.templateSettings
	       * @type RegExp
	       */
	      'evaluate': /<%([\s\S]+?)%>/g,

	      /**
	       * Used to detect `data` property values to inject.
	       *
	       * @memberOf _.templateSettings
	       * @type RegExp
	       */
	      'interpolate': reInterpolate,

	      /**
	       * Used to reference the data object in the template text.
	       *
	       * @memberOf _.templateSettings
	       * @type string
	       */
	      'variable': '',

	      /**
	       * Used to import variables into the compiled template.
	       *
	       * @memberOf _.templateSettings
	       * @type Object
	       */
	      'imports': {

	        /**
	         * A reference to the `lodash` function.
	         *
	         * @memberOf _.templateSettings.imports
	         * @type Function
	         */
	        '_': lodash
	      }
	    };

	    /*--------------------------------------------------------------------------*/

	    /**
	     * The template used to create iterator functions.
	     *
	     * @private
	     * @param {Object} data The data object used to populate the text.
	     * @returns {string} Returns the interpolated text.
	     */
	    var iteratorTemplate = function(obj) {

	      var __p = 'var index, iterable = ' +
	      (obj.firstArg) +
	      ', result = ' +
	      (obj.init) +
	      ';\nif (!iterable) return result;\n' +
	      (obj.top) +
	      ';';
	       if (obj.array) {
	      __p += '\nvar length = iterable.length; index = -1;\nif (' +
	      (obj.array) +
	      ') {  ';
	       if (support.unindexedChars) {
	      __p += '\n  if (isString(iterable)) {\n    iterable = iterable.split(\'\')\n  }  ';
	       }
	      __p += '\n  while (++index < length) {\n    ' +
	      (obj.loop) +
	      ';\n  }\n}\nelse {  ';
	       } else if (support.nonEnumArgs) {
	      __p += '\n  var length = iterable.length; index = -1;\n  if (length && isArguments(iterable)) {\n    while (++index < length) {\n      index += \'\';\n      ' +
	      (obj.loop) +
	      ';\n    }\n  } else {  ';
	       }

	       if (support.enumPrototypes) {
	      __p += '\n  var skipProto = typeof iterable == \'function\';\n  ';
	       }

	       if (support.enumErrorProps) {
	      __p += '\n  var skipErrorProps = iterable === errorProto || iterable instanceof Error;\n  ';
	       }

	          var conditions = [];    if (support.enumPrototypes) { conditions.push('!(skipProto && index == "prototype")'); }    if (support.enumErrorProps)  { conditions.push('!(skipErrorProps && (index == "message" || index == "name"))'); }

	       if (obj.useHas && obj.keys) {
	      __p += '\n  var ownIndex = -1,\n      ownProps = objectTypes[typeof iterable] && keys(iterable),\n      length = ownProps ? ownProps.length : 0;\n\n  while (++ownIndex < length) {\n    index = ownProps[ownIndex];\n';
	          if (conditions.length) {
	      __p += '    if (' +
	      (conditions.join(' && ')) +
	      ') {\n  ';
	       }
	      __p +=
	      (obj.loop) +
	      ';    ';
	       if (conditions.length) {
	      __p += '\n    }';
	       }
	      __p += '\n  }  ';
	       } else {
	      __p += '\n  for (index in iterable) {\n';
	          if (obj.useHas) { conditions.push("hasOwnProperty.call(iterable, index)"); }    if (conditions.length) {
	      __p += '    if (' +
	      (conditions.join(' && ')) +
	      ') {\n  ';
	       }
	      __p +=
	      (obj.loop) +
	      ';    ';
	       if (conditions.length) {
	      __p += '\n    }';
	       }
	      __p += '\n  }    ';
	       if (support.nonEnumShadows) {
	      __p += '\n\n  if (iterable !== objectProto) {\n    var ctor = iterable.constructor,\n        isProto = iterable === (ctor && ctor.prototype),\n        className = iterable === stringProto ? stringClass : iterable === errorProto ? errorClass : toString.call(iterable),\n        nonEnum = nonEnumProps[className];\n      ';
	       for (k = 0; k < 7; k++) {
	      __p += '\n    index = \'' +
	      (obj.shadowedProps[k]) +
	      '\';\n    if ((!(isProto && nonEnum[index]) && hasOwnProperty.call(iterable, index))';
	              if (!obj.useHas) {
	      __p += ' || (!nonEnum[index] && iterable[index] !== objectProto[index])';
	       }
	      __p += ') {\n      ' +
	      (obj.loop) +
	      ';\n    }      ';
	       }
	      __p += '\n  }    ';
	       }

	       }

	       if (obj.array || support.nonEnumArgs) {
	      __p += '\n}';
	       }
	      __p +=
	      (obj.bottom) +
	      ';\nreturn result';

	      return __p
	    };

	    /*--------------------------------------------------------------------------*/

	    /**
	     * The base implementation of `_.bind` that creates the bound function and
	     * sets its meta data.
	     *
	     * @private
	     * @param {Array} bindData The bind data array.
	     * @returns {Function} Returns the new bound function.
	     */
	    function baseBind(bindData) {
	      var func = bindData[0],
	          partialArgs = bindData[2],
	          thisArg = bindData[4];

	      function bound() {
	        // `Function#bind` spec
	        // http://es5.github.io/#x15.3.4.5
	        if (partialArgs) {
	          // avoid `arguments` object deoptimizations by using `slice` instead
	          // of `Array.prototype.slice.call` and not assigning `arguments` to a
	          // variable as a ternary expression
	          var args = slice(partialArgs);
	          push.apply(args, arguments);
	        }
	        // mimic the constructor's `return` behavior
	        // http://es5.github.io/#x13.2.2
	        if (this instanceof bound) {
	          // ensure `new bound` is an instance of `func`
	          var thisBinding = baseCreate(func.prototype),
	              result = func.apply(thisBinding, args || arguments);
	          return isObject(result) ? result : thisBinding;
	        }
	        return func.apply(thisArg, args || arguments);
	      }
	      setBindData(bound, bindData);
	      return bound;
	    }

	    /**
	     * The base implementation of `_.clone` without argument juggling or support
	     * for `thisArg` binding.
	     *
	     * @private
	     * @param {*} value The value to clone.
	     * @param {boolean} [isDeep=false] Specify a deep clone.
	     * @param {Function} [callback] The function to customize cloning values.
	     * @param {Array} [stackA=[]] Tracks traversed source objects.
	     * @param {Array} [stackB=[]] Associates clones with source counterparts.
	     * @returns {*} Returns the cloned value.
	     */
	    function baseClone(value, isDeep, callback, stackA, stackB) {
	      if (callback) {
	        var result = callback(value);
	        if (typeof result != 'undefined') {
	          return result;
	        }
	      }
	      // inspect [[Class]]
	      var isObj = isObject(value);
	      if (isObj) {
	        var className = toString.call(value);
	        if (!cloneableClasses[className] || (!support.nodeClass && isNode(value))) {
	          return value;
	        }
	        var ctor = ctorByClass[className];
	        switch (className) {
	          case boolClass:
	          case dateClass:
	            return new ctor(+value);

	          case numberClass:
	          case stringClass:
	            return new ctor(value);

	          case regexpClass:
	            result = ctor(value.source, reFlags.exec(value));
	            result.lastIndex = value.lastIndex;
	            return result;
	        }
	      } else {
	        return value;
	      }
	      var isArr = isArray(value);
	      if (isDeep) {
	        // check for circular references and return corresponding clone
	        var initedStack = !stackA;
	        stackA || (stackA = getArray());
	        stackB || (stackB = getArray());

	        var length = stackA.length;
	        while (length--) {
	          if (stackA[length] == value) {
	            return stackB[length];
	          }
	        }
	        result = isArr ? ctor(value.length) : {};
	      }
	      else {
	        result = isArr ? slice(value) : assign({}, value);
	      }
	      // add array properties assigned by `RegExp#exec`
	      if (isArr) {
	        if (hasOwnProperty.call(value, 'index')) {
	          result.index = value.index;
	        }
	        if (hasOwnProperty.call(value, 'input')) {
	          result.input = value.input;
	        }
	      }
	      // exit for shallow clone
	      if (!isDeep) {
	        return result;
	      }
	      // add the source value to the stack of traversed objects
	      // and associate it with its clone
	      stackA.push(value);
	      stackB.push(result);

	      // recursively populate clone (susceptible to call stack limits)
	      (isArr ? baseEach : forOwn)(value, function(objValue, key) {
	        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
	      });

	      if (initedStack) {
	        releaseArray(stackA);
	        releaseArray(stackB);
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `_.create` without support for assigning
	     * properties to the created object.
	     *
	     * @private
	     * @param {Object} prototype The object to inherit from.
	     * @returns {Object} Returns the new object.
	     */
	    function baseCreate(prototype, properties) {
	      return isObject(prototype) ? nativeCreate(prototype) : {};
	    }
	    // fallback for browsers without `Object.create`
	    if (!nativeCreate) {
	      baseCreate = (function() {
	        function Object() {}
	        return function(prototype) {
	          if (isObject(prototype)) {
	            Object.prototype = prototype;
	            var result = new Object;
	            Object.prototype = null;
	          }
	          return result || context.Object();
	        };
	      }());
	    }

	    /**
	     * The base implementation of `_.createCallback` without support for creating
	     * "_.pluck" or "_.where" style callbacks.
	     *
	     * @private
	     * @param {*} [func=identity] The value to convert to a callback.
	     * @param {*} [thisArg] The `this` binding of the created callback.
	     * @param {number} [argCount] The number of arguments the callback accepts.
	     * @returns {Function} Returns a callback function.
	     */
	    function baseCreateCallback(func, thisArg, argCount) {
	      if (typeof func != 'function') {
	        return identity;
	      }
	      // exit early for no `thisArg` or already bound by `Function#bind`
	      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
	        return func;
	      }
	      var bindData = func.__bindData__;
	      if (typeof bindData == 'undefined') {
	        if (support.funcNames) {
	          bindData = !func.name;
	        }
	        bindData = bindData || !support.funcDecomp;
	        if (!bindData) {
	          var source = fnToString.call(func);
	          if (!support.funcNames) {
	            bindData = !reFuncName.test(source);
	          }
	          if (!bindData) {
	            // checks if `func` references the `this` keyword and stores the result
	            bindData = reThis.test(source);
	            setBindData(func, bindData);
	          }
	        }
	      }
	      // exit early if there are no `this` references or `func` is bound
	      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
	        return func;
	      }
	      switch (argCount) {
	        case 1: return function(value) {
	          return func.call(thisArg, value);
	        };
	        case 2: return function(a, b) {
	          return func.call(thisArg, a, b);
	        };
	        case 3: return function(value, index, collection) {
	          return func.call(thisArg, value, index, collection);
	        };
	        case 4: return function(accumulator, value, index, collection) {
	          return func.call(thisArg, accumulator, value, index, collection);
	        };
	      }
	      return bind(func, thisArg);
	    }

	    /**
	     * The base implementation of `createWrapper` that creates the wrapper and
	     * sets its meta data.
	     *
	     * @private
	     * @param {Array} bindData The bind data array.
	     * @returns {Function} Returns the new function.
	     */
	    function baseCreateWrapper(bindData) {
	      var func = bindData[0],
	          bitmask = bindData[1],
	          partialArgs = bindData[2],
	          partialRightArgs = bindData[3],
	          thisArg = bindData[4],
	          arity = bindData[5];

	      var isBind = bitmask & 1,
	          isBindKey = bitmask & 2,
	          isCurry = bitmask & 4,
	          isCurryBound = bitmask & 8,
	          key = func;

	      function bound() {
	        var thisBinding = isBind ? thisArg : this;
	        if (partialArgs) {
	          var args = slice(partialArgs);
	          push.apply(args, arguments);
	        }
	        if (partialRightArgs || isCurry) {
	          args || (args = slice(arguments));
	          if (partialRightArgs) {
	            push.apply(args, partialRightArgs);
	          }
	          if (isCurry && args.length < arity) {
	            bitmask |= 16 & ~32;
	            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
	          }
	        }
	        args || (args = arguments);
	        if (isBindKey) {
	          func = thisBinding[key];
	        }
	        if (this instanceof bound) {
	          thisBinding = baseCreate(func.prototype);
	          var result = func.apply(thisBinding, args);
	          return isObject(result) ? result : thisBinding;
	        }
	        return func.apply(thisBinding, args);
	      }
	      setBindData(bound, bindData);
	      return bound;
	    }

	    /**
	     * The base implementation of `_.difference` that accepts a single array
	     * of values to exclude.
	     *
	     * @private
	     * @param {Array} array The array to process.
	     * @param {Array} [values] The array of values to exclude.
	     * @returns {Array} Returns a new array of filtered values.
	     */
	    function baseDifference(array, values) {
	      var index = -1,
	          indexOf = getIndexOf(),
	          length = array ? array.length : 0,
	          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
	          result = [];

	      if (isLarge) {
	        var cache = createCache(values);
	        if (cache) {
	          indexOf = cacheIndexOf;
	          values = cache;
	        } else {
	          isLarge = false;
	        }
	      }
	      while (++index < length) {
	        var value = array[index];
	        if (indexOf(values, value) < 0) {
	          result.push(value);
	        }
	      }
	      if (isLarge) {
	        releaseObject(values);
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `_.flatten` without support for callback
	     * shorthands or `thisArg` binding.
	     *
	     * @private
	     * @param {Array} array The array to flatten.
	     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
	     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
	     * @param {number} [fromIndex=0] The index to start from.
	     * @returns {Array} Returns a new flattened array.
	     */
	    function baseFlatten(array, isShallow, isStrict, fromIndex) {
	      var index = (fromIndex || 0) - 1,
	          length = array ? array.length : 0,
	          result = [];

	      while (++index < length) {
	        var value = array[index];

	        if (value && typeof value == 'object' && typeof value.length == 'number'
	            && (isArray(value) || isArguments(value))) {
	          // recursively flatten arrays (susceptible to call stack limits)
	          if (!isShallow) {
	            value = baseFlatten(value, isShallow, isStrict);
	          }
	          var valIndex = -1,
	              valLength = value.length,
	              resIndex = result.length;

	          result.length += valLength;
	          while (++valIndex < valLength) {
	            result[resIndex++] = value[valIndex];
	          }
	        } else if (!isStrict) {
	          result.push(value);
	        }
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
	     * that allows partial "_.where" style comparisons.
	     *
	     * @private
	     * @param {*} a The value to compare.
	     * @param {*} b The other value to compare.
	     * @param {Function} [callback] The function to customize comparing values.
	     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
	     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
	     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
	     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	     */
	    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
	      // used to indicate that when comparing objects, `a` has at least the properties of `b`
	      if (callback) {
	        var result = callback(a, b);
	        if (typeof result != 'undefined') {
	          return !!result;
	        }
	      }
	      // exit early for identical values
	      if (a === b) {
	        // treat `+0` vs. `-0` as not equal
	        return a !== 0 || (1 / a == 1 / b);
	      }
	      var type = typeof a,
	          otherType = typeof b;

	      // exit early for unlike primitive values
	      if (a === a &&
	          !(a && objectTypes[type]) &&
	          !(b && objectTypes[otherType])) {
	        return false;
	      }
	      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
	      // http://es5.github.io/#x15.3.4.4
	      if (a == null || b == null) {
	        return a === b;
	      }
	      // compare [[Class]] names
	      var className = toString.call(a),
	          otherClass = toString.call(b);

	      if (className == argsClass) {
	        className = objectClass;
	      }
	      if (otherClass == argsClass) {
	        otherClass = objectClass;
	      }
	      if (className != otherClass) {
	        return false;
	      }
	      switch (className) {
	        case boolClass:
	        case dateClass:
	          // coerce dates and booleans to numbers, dates to milliseconds and booleans
	          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
	          return +a == +b;

	        case numberClass:
	          // treat `NaN` vs. `NaN` as equal
	          return (a != +a)
	            ? b != +b
	            // but treat `+0` vs. `-0` as not equal
	            : (a == 0 ? (1 / a == 1 / b) : a == +b);

	        case regexpClass:
	        case stringClass:
	          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
	          // treat string primitives and their corresponding object instances as equal
	          return a == String(b);
	      }
	      var isArr = className == arrayClass;
	      if (!isArr) {
	        // unwrap any `lodash` wrapped values
	        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
	            bWrapped = hasOwnProperty.call(b, '__wrapped__');

	        if (aWrapped || bWrapped) {
	          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
	        }
	        // exit for functions and DOM nodes
	        if (className != objectClass || (!support.nodeClass && (isNode(a) || isNode(b)))) {
	          return false;
	        }
	        // in older versions of Opera, `arguments` objects have `Array` constructors
	        var ctorA = !support.argsObject && isArguments(a) ? Object : a.constructor,
	            ctorB = !support.argsObject && isArguments(b) ? Object : b.constructor;

	        // non `Object` object instances with different constructors are not equal
	        if (ctorA != ctorB &&
	              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
	              ('constructor' in a && 'constructor' in b)
	            ) {
	          return false;
	        }
	      }
	      // assume cyclic structures are equal
	      // the algorithm for detecting cyclic structures is adapted from ES 5.1
	      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
	      var initedStack = !stackA;
	      stackA || (stackA = getArray());
	      stackB || (stackB = getArray());

	      var length = stackA.length;
	      while (length--) {
	        if (stackA[length] == a) {
	          return stackB[length] == b;
	        }
	      }
	      var size = 0;
	      result = true;

	      // add `a` and `b` to the stack of traversed objects
	      stackA.push(a);
	      stackB.push(b);

	      // recursively compare objects and arrays (susceptible to call stack limits)
	      if (isArr) {
	        // compare lengths to determine if a deep comparison is necessary
	        length = a.length;
	        size = b.length;
	        result = size == length;

	        if (result || isWhere) {
	          // deep compare the contents, ignoring non-numeric properties
	          while (size--) {
	            var index = length,
	                value = b[size];

	            if (isWhere) {
	              while (index--) {
	                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
	                  break;
	                }
	              }
	            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
	              break;
	            }
	          }
	        }
	      }
	      else {
	        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
	        // which, in this case, is more costly
	        forIn(b, function(value, key, b) {
	          if (hasOwnProperty.call(b, key)) {
	            // count the number of properties.
	            size++;
	            // deep compare each property value.
	            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
	          }
	        });

	        if (result && !isWhere) {
	          // ensure both objects have the same number of properties
	          forIn(a, function(value, key, a) {
	            if (hasOwnProperty.call(a, key)) {
	              // `size` will be `-1` if `a` has more properties than `b`
	              return (result = --size > -1);
	            }
	          });
	        }
	      }
	      stackA.pop();
	      stackB.pop();

	      if (initedStack) {
	        releaseArray(stackA);
	        releaseArray(stackB);
	      }
	      return result;
	    }

	    /**
	     * The base implementation of `_.merge` without argument juggling or support
	     * for `thisArg` binding.
	     *
	     * @private
	     * @param {Object} object The destination object.
	     * @param {Object} source The source object.
	     * @param {Function} [callback] The function to customize merging properties.
	     * @param {Array} [stackA=[]] Tracks traversed source objects.
	     * @param {Array} [stackB=[]] Associates values with source counterparts.
	     */
	    function baseMerge(object, source, callback, stackA, stackB) {
	      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
	        var found,
	            isArr,
	            result = source,
	            value = object[key];

	        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
	          // avoid merging previously merged cyclic sources
	          var stackLength = stackA.length;
	          while (stackLength--) {
	            if ((found = stackA[stackLength] == source)) {
	              value = stackB[stackLength];
	              break;
	            }
	          }
	          if (!found) {
	            var isShallow;
	            if (callback) {
	              result = callback(value, source);
	              if ((isShallow = typeof result != 'undefined')) {
	                value = result;
	              }
	            }
	            if (!isShallow) {
	              value = isArr
	                ? (isArray(value) ? value : [])
	                : (isPlainObject(value) ? value : {});
	            }
	            // add `source` and associated `value` to the stack of traversed objects
	            stackA.push(source);
	            stackB.push(value);

	            // recursively merge objects and arrays (susceptible to call stack limits)
	            if (!isShallow) {
	              baseMerge(value, source, callback, stackA, stackB);
	            }
	          }
	        }
	        else {
	          if (callback) {
	            result = callback(value, source);
	            if (typeof result == 'undefined') {
	              result = source;
	            }
	          }
	          if (typeof result != 'undefined') {
	            value = result;
	          }
	        }
	        object[key] = value;
	      });
	    }

	    /**
	     * The base implementation of `_.random` without argument juggling or support
	     * for returning floating-point numbers.
	     *
	     * @private
	     * @param {number} min The minimum possible value.
	     * @param {number} max The maximum possible value.
	     * @returns {number} Returns a random number.
	     */
	    function baseRandom(min, max) {
	      return min + floor(nativeRandom() * (max - min + 1));
	    }

	    /**
	     * The base implementation of `_.uniq` without support for callback shorthands
	     * or `thisArg` binding.
	     *
	     * @private
	     * @param {Array} array The array to process.
	     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
	     * @param {Function} [callback] The function called per iteration.
	     * @returns {Array} Returns a duplicate-value-free array.
	     */
	    function baseUniq(array, isSorted, callback) {
	      var index = -1,
	          indexOf = getIndexOf(),
	          length = array ? array.length : 0,
	          result = [];

	      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
	          seen = (callback || isLarge) ? getArray() : result;

	      if (isLarge) {
	        var cache = createCache(seen);
	        indexOf = cacheIndexOf;
	        seen = cache;
	      }
	      while (++index < length) {
	        var value = array[index],
	            computed = callback ? callback(value, index, array) : value;

	        if (isSorted
	              ? !index || seen[seen.length - 1] !== computed
	              : indexOf(seen, computed) < 0
	            ) {
	          if (callback || isLarge) {
	            seen.push(computed);
	          }
	          result.push(value);
	        }
	      }
	      if (isLarge) {
	        releaseArray(seen.array);
	        releaseObject(seen);
	      } else if (callback) {
	        releaseArray(seen);
	      }
	      return result;
	    }

	    /**
	     * Creates a function that aggregates a collection, creating an object composed
	     * of keys generated from the results of running each element of the collection
	     * through a callback. The given `setter` function sets the keys and values
	     * of the composed object.
	     *
	     * @private
	     * @param {Function} setter The setter function.
	     * @returns {Function} Returns the new aggregator function.
	     */
	    function createAggregator(setter) {
	      return function(collection, callback, thisArg) {
	        var result = {};
	        callback = lodash.createCallback(callback, thisArg, 3);

	        if (isArray(collection)) {
	          var index = -1,
	              length = collection.length;

	          while (++index < length) {
	            var value = collection[index];
	            setter(result, value, callback(value, index, collection), collection);
	          }
	        } else {
	          baseEach(collection, function(value, key, collection) {
	            setter(result, value, callback(value, key, collection), collection);
	          });
	        }
	        return result;
	      };
	    }

	    /**
	     * Creates a function that, when called, either curries or invokes `func`
	     * with an optional `this` binding and partially applied arguments.
	     *
	     * @private
	     * @param {Function|string} func The function or method name to reference.
	     * @param {number} bitmask The bitmask of method flags to compose.
	     *  The bitmask may be composed of the following flags:
	     *  1 - `_.bind`
	     *  2 - `_.bindKey`
	     *  4 - `_.curry`
	     *  8 - `_.curry` (bound)
	     *  16 - `_.partial`
	     *  32 - `_.partialRight`
	     * @param {Array} [partialArgs] An array of arguments to prepend to those
	     *  provided to the new function.
	     * @param {Array} [partialRightArgs] An array of arguments to append to those
	     *  provided to the new function.
	     * @param {*} [thisArg] The `this` binding of `func`.
	     * @param {number} [arity] The arity of `func`.
	     * @returns {Function} Returns the new function.
	     */
	    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
	      var isBind = bitmask & 1,
	          isBindKey = bitmask & 2,
	          isCurry = bitmask & 4,
	          isCurryBound = bitmask & 8,
	          isPartial = bitmask & 16,
	          isPartialRight = bitmask & 32;

	      if (!isBindKey && !isFunction(func)) {
	        throw new TypeError;
	      }
	      if (isPartial && !partialArgs.length) {
	        bitmask &= ~16;
	        isPartial = partialArgs = false;
	      }
	      if (isPartialRight && !partialRightArgs.length) {
	        bitmask &= ~32;
	        isPartialRight = partialRightArgs = false;
	      }
	      var bindData = func && func.__bindData__;
	      if (bindData && bindData !== true) {
	        // clone `bindData`
	        bindData = slice(bindData);
	        if (bindData[2]) {
	          bindData[2] = slice(bindData[2]);
	        }
	        if (bindData[3]) {
	          bindData[3] = slice(bindData[3]);
	        }
	        // set `thisBinding` is not previously bound
	        if (isBind && !(bindData[1] & 1)) {
	          bindData[4] = thisArg;
	        }
	        // set if previously bound but not currently (subsequent curried functions)
	        if (!isBind && bindData[1] & 1) {
	          bitmask |= 8;
	        }
	        // set curried arity if not yet set
	        if (isCurry && !(bindData[1] & 4)) {
	          bindData[5] = arity;
	        }
	        // append partial left arguments
	        if (isPartial) {
	          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
	        }
	        // append partial right arguments
	        if (isPartialRight) {
	          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
	        }
	        // merge flags
	        bindData[1] |= bitmask;
	        return createWrapper.apply(null, bindData);
	      }
	      // fast path for `_.bind`
	      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
	      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
	    }

	    /**
	     * Creates compiled iteration functions.
	     *
	     * @private
	     * @param {...Object} [options] The compile options object(s).
	     * @param {string} [options.array] Code to determine if the iterable is an array or array-like.
	     * @param {boolean} [options.useHas] Specify using `hasOwnProperty` checks in the object loop.
	     * @param {Function} [options.keys] A reference to `_.keys` for use in own property iteration.
	     * @param {string} [options.args] A comma separated string of iteration function arguments.
	     * @param {string} [options.top] Code to execute before the iteration branches.
	     * @param {string} [options.loop] Code to execute in the object loop.
	     * @param {string} [options.bottom] Code to execute after the iteration branches.
	     * @returns {Function} Returns the compiled function.
	     */
	    function createIterator() {
	      // data properties
	      iteratorData.shadowedProps = shadowedProps;

	      // iterator options
	      iteratorData.array = iteratorData.bottom = iteratorData.loop = iteratorData.top = '';
	      iteratorData.init = 'iterable';
	      iteratorData.useHas = true;

	      // merge options into a template data object
	      for (var object, index = 0; object = arguments[index]; index++) {
	        for (var key in object) {
	          iteratorData[key] = object[key];
	        }
	      }
	      var args = iteratorData.args;
	      iteratorData.firstArg = /^[^,]+/.exec(args)[0];

	      // create the function factory
	      var factory = Function(
	          'baseCreateCallback, errorClass, errorProto, hasOwnProperty, ' +
	          'indicatorObject, isArguments, isArray, isString, keys, objectProto, ' +
	          'objectTypes, nonEnumProps, stringClass, stringProto, toString',
	        'return function(' + args + ') {\n' + iteratorTemplate(iteratorData) + '\n}'
	      );

	      // return the compiled function
	      return factory(
	        baseCreateCallback, errorClass, errorProto, hasOwnProperty,
	        indicatorObject, isArguments, isArray, isString, iteratorData.keys, objectProto,
	        objectTypes, nonEnumProps, stringClass, stringProto, toString
	      );
	    }

	    /**
	     * Used by `escape` to convert characters to HTML entities.
	     *
	     * @private
	     * @param {string} match The matched character to escape.
	     * @returns {string} Returns the escaped character.
	     */
	    function escapeHtmlChar(match) {
	      return htmlEscapes[match];
	    }

	    /**
	     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
	     * customized, this method returns the custom method, otherwise it returns
	     * the `baseIndexOf` function.
	     *
	     * @private
	     * @returns {Function} Returns the "indexOf" function.
	     */
	    function getIndexOf() {
	      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
	      return result;
	    }

	    /**
	     * Checks if `value` is a native function.
	     *
	     * @private
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
	     */
	    function isNative(value) {
	      return typeof value == 'function' && reNative.test(value);
	    }

	    /**
	     * Sets `this` binding data on a given function.
	     *
	     * @private
	     * @param {Function} func The function to set data on.
	     * @param {Array} value The data array to set.
	     */
	    var setBindData = !defineProperty ? noop : function(func, value) {
	      descriptor.value = value;
	      defineProperty(func, '__bindData__', descriptor);
	      descriptor.value = null;
	    };

	    /**
	     * A fallback implementation of `isPlainObject` which checks if a given value
	     * is an object created by the `Object` constructor, assuming objects created
	     * by the `Object` constructor have no inherited enumerable properties and that
	     * there are no `Object.prototype` extensions.
	     *
	     * @private
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	     */
	    function shimIsPlainObject(value) {
	      var ctor,
	          result;

	      // avoid non Object objects, `arguments` objects, and DOM elements
	      if (!(value && toString.call(value) == objectClass) ||
	          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor)) ||
	          (!support.argsClass && isArguments(value)) ||
	          (!support.nodeClass && isNode(value))) {
	        return false;
	      }
	      // IE < 9 iterates inherited properties before own properties. If the first
	      // iterated property is an object's own property then there are no inherited
	      // enumerable properties.
	      if (support.ownLast) {
	        forIn(value, function(value, key, object) {
	          result = hasOwnProperty.call(object, key);
	          return false;
	        });
	        return result !== false;
	      }
	      // In most environments an object's own properties are iterated before
	      // its inherited properties. If the last iterated property is an object's
	      // own property then there are no inherited enumerable properties.
	      forIn(value, function(value, key) {
	        result = key;
	      });
	      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
	    }

	    /**
	     * Used by `unescape` to convert HTML entities to characters.
	     *
	     * @private
	     * @param {string} match The matched character to unescape.
	     * @returns {string} Returns the unescaped character.
	     */
	    function unescapeHtmlChar(match) {
	      return htmlUnescapes[match];
	    }

	    /*--------------------------------------------------------------------------*/

	    /**
	     * Checks if `value` is an `arguments` object.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
	     * @example
	     *
	     * (function() { return _.isArguments(arguments); })(1, 2, 3);
	     * // => true
	     *
	     * _.isArguments([1, 2, 3]);
	     * // => false
	     */
	    function isArguments(value) {
	      return value && typeof value == 'object' && typeof value.length == 'number' &&
	        toString.call(value) == argsClass || false;
	    }
	    // fallback for browsers that can't detect `arguments` objects by [[Class]]
	    if (!support.argsClass) {
	      isArguments = function(value) {
	        return value && typeof value == 'object' && typeof value.length == 'number' &&
	          hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee') || false;
	      };
	    }

	    /**
	     * Checks if `value` is an array.
	     *
	     * @static
	     * @memberOf _
	     * @type Function
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
	     * @example
	     *
	     * (function() { return _.isArray(arguments); })();
	     * // => false
	     *
	     * _.isArray([1, 2, 3]);
	     * // => true
	     */
	    var isArray = nativeIsArray || function(value) {
	      return value && typeof value == 'object' && typeof value.length == 'number' &&
	        toString.call(value) == arrayClass || false;
	    };

	    /**
	     * A fallback implementation of `Object.keys` which produces an array of the
	     * given object's own enumerable property names.
	     *
	     * @private
	     * @type Function
	     * @param {Object} object The object to inspect.
	     * @returns {Array} Returns an array of property names.
	     */
	    var shimKeys = createIterator({
	      'args': 'object',
	      'init': '[]',
	      'top': 'if (!(objectTypes[typeof object])) return result',
	      'loop': 'result.push(index)'
	    });

	    /**
	     * Creates an array composed of the own enumerable property names of an object.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to inspect.
	     * @returns {Array} Returns an array of property names.
	     * @example
	     *
	     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
	     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
	     */
	    var keys = !nativeKeys ? shimKeys : function(object) {
	      if (!isObject(object)) {
	        return [];
	      }
	      if ((support.enumPrototypes && typeof object == 'function') ||
	          (support.nonEnumArgs && object.length && isArguments(object))) {
	        return shimKeys(object);
	      }
	      return nativeKeys(object);
	    };

	    /** Reusable iterator options shared by `each`, `forIn`, and `forOwn` */
	    var eachIteratorOptions = {
	      'args': 'collection, callback, thisArg',
	      'top': "callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3)",
	      'array': "typeof length == 'number'",
	      'keys': keys,
	      'loop': 'if (callback(iterable[index], index, collection) === false) return result'
	    };

	    /** Reusable iterator options for `assign` and `defaults` */
	    var defaultsIteratorOptions = {
	      'args': 'object, source, guard',
	      'top':
	        'var args = arguments,\n' +
	        '    argsIndex = 0,\n' +
	        "    argsLength = typeof guard == 'number' ? 2 : args.length;\n" +
	        'while (++argsIndex < argsLength) {\n' +
	        '  iterable = args[argsIndex];\n' +
	        '  if (iterable && objectTypes[typeof iterable]) {',
	      'keys': keys,
	      'loop': "if (typeof result[index] == 'undefined') result[index] = iterable[index]",
	      'bottom': '  }\n}'
	    };

	    /** Reusable iterator options for `forIn` and `forOwn` */
	    var forOwnIteratorOptions = {
	      'top': 'if (!objectTypes[typeof iterable]) return result;\n' + eachIteratorOptions.top,
	      'array': false
	    };

	    /**
	     * Used to convert characters to HTML entities:
	     *
	     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
	     * don't require escaping in HTML and have no special meaning unless they're part
	     * of a tag or an unquoted attribute value.
	     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
	     */
	    var htmlEscapes = {
	      '&': '&amp;',
	      '<': '&lt;',
	      '>': '&gt;',
	      '"': '&quot;',
	      "'": '&#39;'
	    };

	    /** Used to convert HTML entities to characters */
	    var htmlUnescapes = invert(htmlEscapes);

	    /** Used to match HTML entities and HTML characters */
	    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
	        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

	    /**
	     * A function compiled to iterate `arguments` objects, arrays, objects, and
	     * strings consistenly across environments, executing the callback for each
	     * element in the collection. The callback is bound to `thisArg` and invoked
	     * with three arguments; (value, index|key, collection). Callbacks may exit
	     * iteration early by explicitly returning `false`.
	     *
	     * @private
	     * @type Function
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array|Object|string} Returns `collection`.
	     */
	    var baseEach = createIterator(eachIteratorOptions);

	    /*--------------------------------------------------------------------------*/

	    /**
	     * Assigns own enumerable properties of source object(s) to the destination
	     * object. Subsequent sources will overwrite property assignments of previous
	     * sources. If a callback is provided it will be executed to produce the
	     * assigned values. The callback is bound to `thisArg` and invoked with two
	     * arguments; (objectValue, sourceValue).
	     *
	     * @static
	     * @memberOf _
	     * @type Function
	     * @alias extend
	     * @category Objects
	     * @param {Object} object The destination object.
	     * @param {...Object} [source] The source objects.
	     * @param {Function} [callback] The function to customize assigning values.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns the destination object.
	     * @example
	     *
	     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
	     * // => { 'name': 'fred', 'employer': 'slate' }
	     *
	     * var defaults = _.partialRight(_.assign, function(a, b) {
	     *   return typeof a == 'undefined' ? b : a;
	     * });
	     *
	     * var object = { 'name': 'barney' };
	     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
	     * // => { 'name': 'barney', 'employer': 'slate' }
	     */
	    var assign = createIterator(defaultsIteratorOptions, {
	      'top':
	        defaultsIteratorOptions.top.replace(';',
	          ';\n' +
	          "if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {\n" +
	          '  var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);\n' +
	          "} else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {\n" +
	          '  callback = args[--argsLength];\n' +
	          '}'
	        ),
	      'loop': 'result[index] = callback ? callback(result[index], iterable[index]) : iterable[index]'
	    });

	    /**
	     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
	     * be cloned, otherwise they will be assigned by reference. If a callback
	     * is provided it will be executed to produce the cloned values. If the
	     * callback returns `undefined` cloning will be handled by the method instead.
	     * The callback is bound to `thisArg` and invoked with one argument; (value).
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to clone.
	     * @param {boolean} [isDeep=false] Specify a deep clone.
	     * @param {Function} [callback] The function to customize cloning values.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the cloned value.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * var shallow = _.clone(characters);
	     * shallow[0] === characters[0];
	     * // => true
	     *
	     * var deep = _.clone(characters, true);
	     * deep[0] === characters[0];
	     * // => false
	     *
	     * _.mixin({
	     *   'clone': _.partialRight(_.clone, function(value) {
	     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
	     *   })
	     * });
	     *
	     * var clone = _.clone(document.body);
	     * clone.childNodes.length;
	     * // => 0
	     */
	    function clone(value, isDeep, callback, thisArg) {
	      // allows working with "Collections" methods without using their `index`
	      // and `collection` arguments for `isDeep` and `callback`
	      if (typeof isDeep != 'boolean' && isDeep != null) {
	        thisArg = callback;
	        callback = isDeep;
	        isDeep = false;
	      }
	      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
	    }

	    /**
	     * Creates a deep clone of `value`. If a callback is provided it will be
	     * executed to produce the cloned values. If the callback returns `undefined`
	     * cloning will be handled by the method instead. The callback is bound to
	     * `thisArg` and invoked with one argument; (value).
	     *
	     * Note: This method is loosely based on the structured clone algorithm. Functions
	     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
	     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
	     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to deep clone.
	     * @param {Function} [callback] The function to customize cloning values.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the deep cloned value.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * var deep = _.cloneDeep(characters);
	     * deep[0] === characters[0];
	     * // => false
	     *
	     * var view = {
	     *   'label': 'docs',
	     *   'node': element
	     * };
	     *
	     * var clone = _.cloneDeep(view, function(value) {
	     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
	     * });
	     *
	     * clone.node == view.node;
	     * // => false
	     */
	    function cloneDeep(value, callback, thisArg) {
	      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
	    }

	    /**
	     * Creates an object that inherits from the given `prototype` object. If a
	     * `properties` object is provided its own enumerable properties are assigned
	     * to the created object.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} prototype The object to inherit from.
	     * @param {Object} [properties] The properties to assign to the object.
	     * @returns {Object} Returns the new object.
	     * @example
	     *
	     * function Shape() {
	     *   this.x = 0;
	     *   this.y = 0;
	     * }
	     *
	     * function Circle() {
	     *   Shape.call(this);
	     * }
	     *
	     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
	     *
	     * var circle = new Circle;
	     * circle instanceof Circle;
	     * // => true
	     *
	     * circle instanceof Shape;
	     * // => true
	     */
	    function create(prototype, properties) {
	      var result = baseCreate(prototype);
	      return properties ? assign(result, properties) : result;
	    }

	    /**
	     * Assigns own enumerable properties of source object(s) to the destination
	     * object for all destination properties that resolve to `undefined`. Once a
	     * property is set, additional defaults of the same property will be ignored.
	     *
	     * @static
	     * @memberOf _
	     * @type Function
	     * @category Objects
	     * @param {Object} object The destination object.
	     * @param {...Object} [source] The source objects.
	     * @param- {Object} [guard] Allows working with `_.reduce` without using its
	     *  `key` and `object` arguments as sources.
	     * @returns {Object} Returns the destination object.
	     * @example
	     *
	     * var object = { 'name': 'barney' };
	     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
	     * // => { 'name': 'barney', 'employer': 'slate' }
	     */
	    var defaults = createIterator(defaultsIteratorOptions);

	    /**
	     * This method is like `_.findIndex` except that it returns the key of the
	     * first element that passes the callback check, instead of the element itself.
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to search.
	     * @param {Function|Object|string} [callback=identity] The function called per
	     *  iteration. If a property name or object is provided it will be used to
	     *  create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
	     * @example
	     *
	     * var characters = {
	     *   'barney': {  'age': 36, 'blocked': false },
	     *   'fred': {    'age': 40, 'blocked': true },
	     *   'pebbles': { 'age': 1,  'blocked': false }
	     * };
	     *
	     * _.findKey(characters, function(chr) {
	     *   return chr.age < 40;
	     * });
	     * // => 'barney' (property order is not guaranteed across environments)
	     *
	     * // using "_.where" callback shorthand
	     * _.findKey(characters, { 'age': 1 });
	     * // => 'pebbles'
	     *
	     * // using "_.pluck" callback shorthand
	     * _.findKey(characters, 'blocked');
	     * // => 'fred'
	     */
	    function findKey(object, callback, thisArg) {
	      var result;
	      callback = lodash.createCallback(callback, thisArg, 3);
	      forOwn(object, function(value, key, object) {
	        if (callback(value, key, object)) {
	          result = key;
	          return false;
	        }
	      });
	      return result;
	    }

	    /**
	     * This method is like `_.findKey` except that it iterates over elements
	     * of a `collection` in the opposite order.
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to search.
	     * @param {Function|Object|string} [callback=identity] The function called per
	     *  iteration. If a property name or object is provided it will be used to
	     *  create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
	     * @example
	     *
	     * var characters = {
	     *   'barney': {  'age': 36, 'blocked': true },
	     *   'fred': {    'age': 40, 'blocked': false },
	     *   'pebbles': { 'age': 1,  'blocked': true }
	     * };
	     *
	     * _.findLastKey(characters, function(chr) {
	     *   return chr.age < 40;
	     * });
	     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
	     *
	     * // using "_.where" callback shorthand
	     * _.findLastKey(characters, { 'age': 40 });
	     * // => 'fred'
	     *
	     * // using "_.pluck" callback shorthand
	     * _.findLastKey(characters, 'blocked');
	     * // => 'pebbles'
	     */
	    function findLastKey(object, callback, thisArg) {
	      var result;
	      callback = lodash.createCallback(callback, thisArg, 3);
	      forOwnRight(object, function(value, key, object) {
	        if (callback(value, key, object)) {
	          result = key;
	          return false;
	        }
	      });
	      return result;
	    }

	    /**
	     * Iterates over own and inherited enumerable properties of an object,
	     * executing the callback for each property. The callback is bound to `thisArg`
	     * and invoked with three arguments; (value, key, object). Callbacks may exit
	     * iteration early by explicitly returning `false`.
	     *
	     * @static
	     * @memberOf _
	     * @type Function
	     * @category Objects
	     * @param {Object} object The object to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * function Shape() {
	     *   this.x = 0;
	     *   this.y = 0;
	     * }
	     *
	     * Shape.prototype.move = function(x, y) {
	     *   this.x += x;
	     *   this.y += y;
	     * };
	     *
	     * _.forIn(new Shape, function(value, key) {
	     *   console.log(key);
	     * });
	     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
	     */
	    var forIn = createIterator(eachIteratorOptions, forOwnIteratorOptions, {
	      'useHas': false
	    });

	    /**
	     * This method is like `_.forIn` except that it iterates over elements
	     * of a `collection` in the opposite order.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * function Shape() {
	     *   this.x = 0;
	     *   this.y = 0;
	     * }
	     *
	     * Shape.prototype.move = function(x, y) {
	     *   this.x += x;
	     *   this.y += y;
	     * };
	     *
	     * _.forInRight(new Shape, function(value, key) {
	     *   console.log(key);
	     * });
	     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
	     */
	    function forInRight(object, callback, thisArg) {
	      var pairs = [];

	      forIn(object, function(value, key) {
	        pairs.push(key, value);
	      });

	      var length = pairs.length;
	      callback = baseCreateCallback(callback, thisArg, 3);
	      while (length--) {
	        if (callback(pairs[length--], pairs[length], object) === false) {
	          break;
	        }
	      }
	      return object;
	    }

	    /**
	     * Iterates over own enumerable properties of an object, executing the callback
	     * for each property. The callback is bound to `thisArg` and invoked with three
	     * arguments; (value, key, object). Callbacks may exit iteration early by
	     * explicitly returning `false`.
	     *
	     * @static
	     * @memberOf _
	     * @type Function
	     * @category Objects
	     * @param {Object} object The object to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
	     *   console.log(key);
	     * });
	     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
	     */
	    var forOwn = createIterator(eachIteratorOptions, forOwnIteratorOptions);

	    /**
	     * This method is like `_.forOwn` except that it iterates over elements
	     * of a `collection` in the opposite order.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
	     *   console.log(key);
	     * });
	     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
	     */
	    function forOwnRight(object, callback, thisArg) {
	      var props = keys(object),
	          length = props.length;

	      callback = baseCreateCallback(callback, thisArg, 3);
	      while (length--) {
	        var key = props[length];
	        if (callback(object[key], key, object) === false) {
	          break;
	        }
	      }
	      return object;
	    }

	    /**
	     * Creates a sorted array of property names of all enumerable properties,
	     * own and inherited, of `object` that have function values.
	     *
	     * @static
	     * @memberOf _
	     * @alias methods
	     * @category Objects
	     * @param {Object} object The object to inspect.
	     * @returns {Array} Returns an array of property names that have function values.
	     * @example
	     *
	     * _.functions(_);
	     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
	     */
	    function functions(object) {
	      var result = [];
	      forIn(object, function(value, key) {
	        if (isFunction(value)) {
	          result.push(key);
	        }
	      });
	      return result.sort();
	    }

	    /**
	     * Checks if the specified property name exists as a direct property of `object`,
	     * instead of an inherited property.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to inspect.
	     * @param {string} key The name of the property to check.
	     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
	     * @example
	     *
	     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
	     * // => true
	     */
	    function has(object, key) {
	      return object ? hasOwnProperty.call(object, key) : false;
	    }

	    /**
	     * Creates an object composed of the inverted keys and values of the given object.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to invert.
	     * @returns {Object} Returns the created inverted object.
	     * @example
	     *
	     * _.invert({ 'first': 'fred', 'second': 'barney' });
	     * // => { 'fred': 'first', 'barney': 'second' }
	     */
	    function invert(object) {
	      var index = -1,
	          props = keys(object),
	          length = props.length,
	          result = {};

	      while (++index < length) {
	        var key = props[index];
	        result[object[key]] = key;
	      }
	      return result;
	    }

	    /**
	     * Checks if `value` is a boolean value.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
	     * @example
	     *
	     * _.isBoolean(null);
	     * // => false
	     */
	    function isBoolean(value) {
	      return value === true || value === false ||
	        value && typeof value == 'object' && toString.call(value) == boolClass || false;
	    }

	    /**
	     * Checks if `value` is a date.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
	     * @example
	     *
	     * _.isDate(new Date);
	     * // => true
	     */
	    function isDate(value) {
	      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
	    }

	    /**
	     * Checks if `value` is a DOM element.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
	     * @example
	     *
	     * _.isElement(document.body);
	     * // => true
	     */
	    function isElement(value) {
	      return value && value.nodeType === 1 || false;
	    }

	    /**
	     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
	     * length of `0` and objects with no own enumerable properties are considered
	     * "empty".
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Array|Object|string} value The value to inspect.
	     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
	     * @example
	     *
	     * _.isEmpty([1, 2, 3]);
	     * // => false
	     *
	     * _.isEmpty({});
	     * // => true
	     *
	     * _.isEmpty('');
	     * // => true
	     */
	    function isEmpty(value) {
	      var result = true;
	      if (!value) {
	        return result;
	      }
	      var className = toString.call(value),
	          length = value.length;

	      if ((className == arrayClass || className == stringClass ||
	          (support.argsClass ? className == argsClass : isArguments(value))) ||
	          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
	        return !length;
	      }
	      forOwn(value, function() {
	        return (result = false);
	      });
	      return result;
	    }

	    /**
	     * Performs a deep comparison between two values to determine if they are
	     * equivalent to each other. If a callback is provided it will be executed
	     * to compare values. If the callback returns `undefined` comparisons will
	     * be handled by the method instead. The callback is bound to `thisArg` and
	     * invoked with two arguments; (a, b).
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} a The value to compare.
	     * @param {*} b The other value to compare.
	     * @param {Function} [callback] The function to customize comparing values.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	     * @example
	     *
	     * var object = { 'name': 'fred' };
	     * var copy = { 'name': 'fred' };
	     *
	     * object == copy;
	     * // => false
	     *
	     * _.isEqual(object, copy);
	     * // => true
	     *
	     * var words = ['hello', 'goodbye'];
	     * var otherWords = ['hi', 'goodbye'];
	     *
	     * _.isEqual(words, otherWords, function(a, b) {
	     *   var reGreet = /^(?:hello|hi)$/i,
	     *       aGreet = _.isString(a) && reGreet.test(a),
	     *       bGreet = _.isString(b) && reGreet.test(b);
	     *
	     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
	     * });
	     * // => true
	     */
	    function isEqual(a, b, callback, thisArg) {
	      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
	    }

	    /**
	     * Checks if `value` is, or can be coerced to, a finite number.
	     *
	     * Note: This is not the same as native `isFinite` which will return true for
	     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
	     * @example
	     *
	     * _.isFinite(-101);
	     * // => true
	     *
	     * _.isFinite('10');
	     * // => true
	     *
	     * _.isFinite(true);
	     * // => false
	     *
	     * _.isFinite('');
	     * // => false
	     *
	     * _.isFinite(Infinity);
	     * // => false
	     */
	    function isFinite(value) {
	      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
	    }

	    /**
	     * Checks if `value` is a function.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
	     * @example
	     *
	     * _.isFunction(_);
	     * // => true
	     */
	    function isFunction(value) {
	      return typeof value == 'function';
	    }
	    // fallback for older versions of Chrome and Safari
	    if (isFunction(/x/)) {
	      isFunction = function(value) {
	        return typeof value == 'function' && toString.call(value) == funcClass;
	      };
	    }

	    /**
	     * Checks if `value` is the language type of Object.
	     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
	     * @example
	     *
	     * _.isObject({});
	     * // => true
	     *
	     * _.isObject([1, 2, 3]);
	     * // => true
	     *
	     * _.isObject(1);
	     * // => false
	     */
	    function isObject(value) {
	      // check if the value is the ECMAScript language type of Object
	      // http://es5.github.io/#x8
	      // and avoid a V8 bug
	      // http://code.google.com/p/v8/issues/detail?id=2291
	      return !!(value && objectTypes[typeof value]);
	    }

	    /**
	     * Checks if `value` is `NaN`.
	     *
	     * Note: This is not the same as native `isNaN` which will return `true` for
	     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
	     * @example
	     *
	     * _.isNaN(NaN);
	     * // => true
	     *
	     * _.isNaN(new Number(NaN));
	     * // => true
	     *
	     * isNaN(undefined);
	     * // => true
	     *
	     * _.isNaN(undefined);
	     * // => false
	     */
	    function isNaN(value) {
	      // `NaN` as a primitive is the only value that is not equal to itself
	      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
	      return isNumber(value) && value != +value;
	    }

	    /**
	     * Checks if `value` is `null`.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
	     * @example
	     *
	     * _.isNull(null);
	     * // => true
	     *
	     * _.isNull(undefined);
	     * // => false
	     */
	    function isNull(value) {
	      return value === null;
	    }

	    /**
	     * Checks if `value` is a number.
	     *
	     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
	     * @example
	     *
	     * _.isNumber(8.4 * 5);
	     * // => true
	     */
	    function isNumber(value) {
	      return typeof value == 'number' ||
	        value && typeof value == 'object' && toString.call(value) == numberClass || false;
	    }

	    /**
	     * Checks if `value` is an object created by the `Object` constructor.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
	     * @example
	     *
	     * function Shape() {
	     *   this.x = 0;
	     *   this.y = 0;
	     * }
	     *
	     * _.isPlainObject(new Shape);
	     * // => false
	     *
	     * _.isPlainObject([1, 2, 3]);
	     * // => false
	     *
	     * _.isPlainObject({ 'x': 0, 'y': 0 });
	     * // => true
	     */
	    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
	      if (!(value && toString.call(value) == objectClass) || (!support.argsClass && isArguments(value))) {
	        return false;
	      }
	      var valueOf = value.valueOf,
	          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

	      return objProto
	        ? (value == objProto || getPrototypeOf(value) == objProto)
	        : shimIsPlainObject(value);
	    };

	    /**
	     * Checks if `value` is a regular expression.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
	     * @example
	     *
	     * _.isRegExp(/fred/);
	     * // => true
	     */
	    function isRegExp(value) {
	      return value && objectTypes[typeof value] && toString.call(value) == regexpClass || false;
	    }

	    /**
	     * Checks if `value` is a string.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
	     * @example
	     *
	     * _.isString('fred');
	     * // => true
	     */
	    function isString(value) {
	      return typeof value == 'string' ||
	        value && typeof value == 'object' && toString.call(value) == stringClass || false;
	    }

	    /**
	     * Checks if `value` is `undefined`.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {*} value The value to check.
	     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
	     * @example
	     *
	     * _.isUndefined(void 0);
	     * // => true
	     */
	    function isUndefined(value) {
	      return typeof value == 'undefined';
	    }

	    /**
	     * Creates an object with the same keys as `object` and values generated by
	     * running each own enumerable property of `object` through the callback.
	     * The callback is bound to `thisArg` and invoked with three arguments;
	     * (value, key, object).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
	     * @example
	     *
	     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
	     * // => { 'a': 3, 'b': 6, 'c': 9 }
	     *
	     * var characters = {
	     *   'fred': { 'name': 'fred', 'age': 40 },
	     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
	     * };
	     *
	     * // using "_.pluck" callback shorthand
	     * _.mapValues(characters, 'age');
	     * // => { 'fred': 40, 'pebbles': 1 }
	     */
	    function mapValues(object, callback, thisArg) {
	      var result = {};
	      callback = lodash.createCallback(callback, thisArg, 3);

	      forOwn(object, function(value, key, object) {
	        result[key] = callback(value, key, object);
	      });
	      return result;
	    }

	    /**
	     * Recursively merges own enumerable properties of the source object(s), that
	     * don't resolve to `undefined` into the destination object. Subsequent sources
	     * will overwrite property assignments of previous sources. If a callback is
	     * provided it will be executed to produce the merged values of the destination
	     * and source properties. If the callback returns `undefined` merging will
	     * be handled by the method instead. The callback is bound to `thisArg` and
	     * invoked with two arguments; (objectValue, sourceValue).
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The destination object.
	     * @param {...Object} [source] The source objects.
	     * @param {Function} [callback] The function to customize merging properties.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns the destination object.
	     * @example
	     *
	     * var names = {
	     *   'characters': [
	     *     { 'name': 'barney' },
	     *     { 'name': 'fred' }
	     *   ]
	     * };
	     *
	     * var ages = {
	     *   'characters': [
	     *     { 'age': 36 },
	     *     { 'age': 40 }
	     *   ]
	     * };
	     *
	     * _.merge(names, ages);
	     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
	     *
	     * var food = {
	     *   'fruits': ['apple'],
	     *   'vegetables': ['beet']
	     * };
	     *
	     * var otherFood = {
	     *   'fruits': ['banana'],
	     *   'vegetables': ['carrot']
	     * };
	     *
	     * _.merge(food, otherFood, function(a, b) {
	     *   return _.isArray(a) ? a.concat(b) : undefined;
	     * });
	     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
	     */
	    function merge(object) {
	      var args = arguments,
	          length = 2;

	      if (!isObject(object)) {
	        return object;
	      }
	      // allows working with `_.reduce` and `_.reduceRight` without using
	      // their `index` and `collection` arguments
	      if (typeof args[2] != 'number') {
	        length = args.length;
	      }
	      if (length > 3 && typeof args[length - 2] == 'function') {
	        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
	      } else if (length > 2 && typeof args[length - 1] == 'function') {
	        callback = args[--length];
	      }
	      var sources = slice(arguments, 1, length),
	          index = -1,
	          stackA = getArray(),
	          stackB = getArray();

	      while (++index < length) {
	        baseMerge(object, sources[index], callback, stackA, stackB);
	      }
	      releaseArray(stackA);
	      releaseArray(stackB);
	      return object;
	    }

	    /**
	     * Creates a shallow clone of `object` excluding the specified properties.
	     * Property names may be specified as individual arguments or as arrays of
	     * property names. If a callback is provided it will be executed for each
	     * property of `object` omitting the properties the callback returns truey
	     * for. The callback is bound to `thisArg` and invoked with three arguments;
	     * (value, key, object).
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The source object.
	     * @param {Function|...string|string[]} [callback] The properties to omit or the
	     *  function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns an object without the omitted properties.
	     * @example
	     *
	     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
	     * // => { 'name': 'fred' }
	     *
	     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
	     *   return typeof value == 'number';
	     * });
	     * // => { 'name': 'fred' }
	     */
	    function omit(object, callback, thisArg) {
	      var result = {};
	      if (typeof callback != 'function') {
	        var props = [];
	        forIn(object, function(value, key) {
	          props.push(key);
	        });
	        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

	        var index = -1,
	            length = props.length;

	        while (++index < length) {
	          var key = props[index];
	          result[key] = object[key];
	        }
	      } else {
	        callback = lodash.createCallback(callback, thisArg, 3);
	        forIn(object, function(value, key, object) {
	          if (!callback(value, key, object)) {
	            result[key] = value;
	          }
	        });
	      }
	      return result;
	    }

	    /**
	     * Creates a two dimensional array of an object's key-value pairs,
	     * i.e. `[[key1, value1], [key2, value2]]`.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to inspect.
	     * @returns {Array} Returns new array of key-value pairs.
	     * @example
	     *
	     * _.pairs({ 'barney': 36, 'fred': 40 });
	     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
	     */
	    function pairs(object) {
	      var index = -1,
	          props = keys(object),
	          length = props.length,
	          result = Array(length);

	      while (++index < length) {
	        var key = props[index];
	        result[index] = [key, object[key]];
	      }
	      return result;
	    }

	    /**
	     * Creates a shallow clone of `object` composed of the specified properties.
	     * Property names may be specified as individual arguments or as arrays of
	     * property names. If a callback is provided it will be executed for each
	     * property of `object` picking the properties the callback returns truey
	     * for. The callback is bound to `thisArg` and invoked with three arguments;
	     * (value, key, object).
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The source object.
	     * @param {Function|...string|string[]} [callback] The function called per
	     *  iteration or property names to pick, specified as individual property
	     *  names or arrays of property names.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns an object composed of the picked properties.
	     * @example
	     *
	     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
	     * // => { 'name': 'fred' }
	     *
	     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
	     *   return key.charAt(0) != '_';
	     * });
	     * // => { 'name': 'fred' }
	     */
	    function pick(object, callback, thisArg) {
	      var result = {};
	      if (typeof callback != 'function') {
	        var index = -1,
	            props = baseFlatten(arguments, true, false, 1),
	            length = isObject(object) ? props.length : 0;

	        while (++index < length) {
	          var key = props[index];
	          if (key in object) {
	            result[key] = object[key];
	          }
	        }
	      } else {
	        callback = lodash.createCallback(callback, thisArg, 3);
	        forIn(object, function(value, key, object) {
	          if (callback(value, key, object)) {
	            result[key] = value;
	          }
	        });
	      }
	      return result;
	    }

	    /**
	     * An alternative to `_.reduce` this method transforms `object` to a new
	     * `accumulator` object which is the result of running each of its own
	     * enumerable properties through a callback, with each callback execution
	     * potentially mutating the `accumulator` object. The callback is bound to
	     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
	     * Callbacks may exit iteration early by explicitly returning `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Array|Object} object The object to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [accumulator] The custom accumulator value.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the accumulated value.
	     * @example
	     *
	     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
	     *   num *= num;
	     *   if (num % 2) {
	     *     return result.push(num) < 3;
	     *   }
	     * });
	     * // => [1, 9, 25]
	     *
	     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
	     *   result[key] = num * 3;
	     * });
	     * // => { 'a': 3, 'b': 6, 'c': 9 }
	     */
	    function transform(object, callback, accumulator, thisArg) {
	      var isArr = isArray(object);
	      if (accumulator == null) {
	        if (isArr) {
	          accumulator = [];
	        } else {
	          var ctor = object && object.constructor,
	              proto = ctor && ctor.prototype;

	          accumulator = baseCreate(proto);
	        }
	      }
	      if (callback) {
	        callback = lodash.createCallback(callback, thisArg, 4);
	        (isArr ? baseEach : forOwn)(object, function(value, index, object) {
	          return callback(accumulator, value, index, object);
	        });
	      }
	      return accumulator;
	    }

	    /**
	     * Creates an array composed of the own enumerable property values of `object`.
	     *
	     * @static
	     * @memberOf _
	     * @category Objects
	     * @param {Object} object The object to inspect.
	     * @returns {Array} Returns an array of property values.
	     * @example
	     *
	     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
	     * // => [1, 2, 3] (property order is not guaranteed across environments)
	     */
	    function values(object) {
	      var index = -1,
	          props = keys(object),
	          length = props.length,
	          result = Array(length);

	      while (++index < length) {
	        result[index] = object[props[index]];
	      }
	      return result;
	    }

	    /*--------------------------------------------------------------------------*/

	    /**
	     * Creates an array of elements from the specified indexes, or keys, of the
	     * `collection`. Indexes may be specified as individual arguments or as arrays
	     * of indexes.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
	     *   to retrieve, specified as individual indexes or arrays of indexes.
	     * @returns {Array} Returns a new array of elements corresponding to the
	     *  provided indexes.
	     * @example
	     *
	     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
	     * // => ['a', 'c', 'e']
	     *
	     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
	     * // => ['fred', 'pebbles']
	     */
	    function at(collection) {
	      var args = arguments,
	          index = -1,
	          props = baseFlatten(args, true, false, 1),
	          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
	          result = Array(length);

	      if (support.unindexedChars && isString(collection)) {
	        collection = collection.split('');
	      }
	      while(++index < length) {
	        result[index] = collection[props[index]];
	      }
	      return result;
	    }

	    /**
	     * Checks if a given value is present in a collection using strict equality
	     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
	     * offset from the end of the collection.
	     *
	     * @static
	     * @memberOf _
	     * @alias include
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {*} target The value to check for.
	     * @param {number} [fromIndex=0] The index to search from.
	     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
	     * @example
	     *
	     * _.contains([1, 2, 3], 1);
	     * // => true
	     *
	     * _.contains([1, 2, 3], 1, 2);
	     * // => false
	     *
	     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
	     * // => true
	     *
	     * _.contains('pebbles', 'eb');
	     * // => true
	     */
	    function contains(collection, target, fromIndex) {
	      var index = -1,
	          indexOf = getIndexOf(),
	          length = collection ? collection.length : 0,
	          result = false;

	      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
	      if (isArray(collection)) {
	        result = indexOf(collection, target, fromIndex) > -1;
	      } else if (typeof length == 'number') {
	        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
	      } else {
	        baseEach(collection, function(value) {
	          if (++index >= fromIndex) {
	            return !(result = value === target);
	          }
	        });
	      }
	      return result;
	    }

	    /**
	     * Creates an object composed of keys generated from the results of running
	     * each element of `collection` through the callback. The corresponding value
	     * of each key is the number of times the key was returned by the callback.
	     * The callback is bound to `thisArg` and invoked with three arguments;
	     * (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns the composed aggregate object.
	     * @example
	     *
	     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
	     * // => { '4': 1, '6': 2 }
	     *
	     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
	     * // => { '4': 1, '6': 2 }
	     *
	     * _.countBy(['one', 'two', 'three'], 'length');
	     * // => { '3': 2, '5': 1 }
	     */
	    var countBy = createAggregator(function(result, value, key) {
	      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
	    });

	    /**
	     * Checks if the given callback returns truey value for **all** elements of
	     * a collection. The callback is bound to `thisArg` and invoked with three
	     * arguments; (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias all
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {boolean} Returns `true` if all elements passed the callback check,
	     *  else `false`.
	     * @example
	     *
	     * _.every([true, 1, null, 'yes']);
	     * // => false
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.every(characters, 'age');
	     * // => true
	     *
	     * // using "_.where" callback shorthand
	     * _.every(characters, { 'age': 36 });
	     * // => false
	     */
	    function every(collection, callback, thisArg) {
	      var result = true;
	      callback = lodash.createCallback(callback, thisArg, 3);

	      if (isArray(collection)) {
	        var index = -1,
	            length = collection.length;

	        while (++index < length) {
	          if (!(result = !!callback(collection[index], index, collection))) {
	            break;
	          }
	        }
	      } else {
	        baseEach(collection, function(value, index, collection) {
	          return (result = !!callback(value, index, collection));
	        });
	      }
	      return result;
	    }

	    /**
	     * Iterates over elements of a collection, returning an array of all elements
	     * the callback returns truey for. The callback is bound to `thisArg` and
	     * invoked with three arguments; (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias select
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a new array of elements that passed the callback check.
	     * @example
	     *
	     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
	     * // => [2, 4, 6]
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36, 'blocked': false },
	     *   { 'name': 'fred',   'age': 40, 'blocked': true }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.filter(characters, 'blocked');
	     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
	     *
	     * // using "_.where" callback shorthand
	     * _.filter(characters, { 'age': 36 });
	     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
	     */
	    function filter(collection, callback, thisArg) {
	      var result = [];
	      callback = lodash.createCallback(callback, thisArg, 3);

	      if (isArray(collection)) {
	        var index = -1,
	            length = collection.length;

	        while (++index < length) {
	          var value = collection[index];
	          if (callback(value, index, collection)) {
	            result.push(value);
	          }
	        }
	      } else {
	        baseEach(collection, function(value, index, collection) {
	          if (callback(value, index, collection)) {
	            result.push(value);
	          }
	        });
	      }
	      return result;
	    }

	    /**
	     * Iterates over elements of a collection, returning the first element that
	     * the callback returns truey for. The callback is bound to `thisArg` and
	     * invoked with three arguments; (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias detect, findWhere
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the found element, else `undefined`.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'age': 36, 'blocked': false },
	     *   { 'name': 'fred',    'age': 40, 'blocked': true },
	     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
	     * ];
	     *
	     * _.find(characters, function(chr) {
	     *   return chr.age < 40;
	     * });
	     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
	     *
	     * // using "_.where" callback shorthand
	     * _.find(characters, { 'age': 1 });
	     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
	     *
	     * // using "_.pluck" callback shorthand
	     * _.find(characters, 'blocked');
	     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
	     */
	    function find(collection, callback, thisArg) {
	      callback = lodash.createCallback(callback, thisArg, 3);

	      if (isArray(collection)) {
	        var index = -1,
	            length = collection.length;

	        while (++index < length) {
	          var value = collection[index];
	          if (callback(value, index, collection)) {
	            return value;
	          }
	        }
	      } else {
	        var result;
	        baseEach(collection, function(value, index, collection) {
	          if (callback(value, index, collection)) {
	            result = value;
	            return false;
	          }
	        });
	        return result;
	      }
	    }

	    /**
	     * This method is like `_.find` except that it iterates over elements
	     * of a `collection` from right to left.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the found element, else `undefined`.
	     * @example
	     *
	     * _.findLast([1, 2, 3, 4], function(num) {
	     *   return num % 2 == 1;
	     * });
	     * // => 3
	     */
	    function findLast(collection, callback, thisArg) {
	      var result;
	      callback = lodash.createCallback(callback, thisArg, 3);
	      forEachRight(collection, function(value, index, collection) {
	        if (callback(value, index, collection)) {
	          result = value;
	          return false;
	        }
	      });
	      return result;
	    }

	    /**
	     * Iterates over elements of a collection, executing the callback for each
	     * element. The callback is bound to `thisArg` and invoked with three arguments;
	     * (value, index|key, collection). Callbacks may exit iteration early by
	     * explicitly returning `false`.
	     *
	     * Note: As with other "Collections" methods, objects with a `length` property
	     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
	     * may be used for object iteration.
	     *
	     * @static
	     * @memberOf _
	     * @alias each
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array|Object|string} Returns `collection`.
	     * @example
	     *
	     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
	     * // => logs each number and returns '1,2,3'
	     *
	     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
	     * // => logs each number and returns the object (property order is not guaranteed across environments)
	     */
	    function forEach(collection, callback, thisArg) {
	      if (callback && typeof thisArg == 'undefined' && isArray(collection)) {
	        var index = -1,
	            length = collection.length;

	        while (++index < length) {
	          if (callback(collection[index], index, collection) === false) {
	            break;
	          }
	        }
	      } else {
	        baseEach(collection, callback, thisArg);
	      }
	      return collection;
	    }

	    /**
	     * This method is like `_.forEach` except that it iterates over elements
	     * of a `collection` from right to left.
	     *
	     * @static
	     * @memberOf _
	     * @alias eachRight
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array|Object|string} Returns `collection`.
	     * @example
	     *
	     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
	     * // => logs each number from right to left and returns '3,2,1'
	     */
	    function forEachRight(collection, callback, thisArg) {
	      var iterable = collection,
	          length = collection ? collection.length : 0;

	      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
	      if (isArray(collection)) {
	        while (length--) {
	          if (callback(collection[length], length, collection) === false) {
	            break;
	          }
	        }
	      } else {
	        if (typeof length != 'number') {
	          var props = keys(collection);
	          length = props.length;
	        } else if (support.unindexedChars && isString(collection)) {
	          iterable = collection.split('');
	        }
	        baseEach(collection, function(value, key, collection) {
	          key = props ? props[--length] : --length;
	          return callback(iterable[key], key, collection);
	        });
	      }
	      return collection;
	    }

	    /**
	     * Creates an object composed of keys generated from the results of running
	     * each element of a collection through the callback. The corresponding value
	     * of each key is an array of the elements responsible for generating the key.
	     * The callback is bound to `thisArg` and invoked with three arguments;
	     * (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns the composed aggregate object.
	     * @example
	     *
	     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
	     * // => { '4': [4.2], '6': [6.1, 6.4] }
	     *
	     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
	     * // => { '4': [4.2], '6': [6.1, 6.4] }
	     *
	     * // using "_.pluck" callback shorthand
	     * _.groupBy(['one', 'two', 'three'], 'length');
	     * // => { '3': ['one', 'two'], '5': ['three'] }
	     */
	    var groupBy = createAggregator(function(result, value, key) {
	      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
	    });

	    /**
	     * Creates an object composed of keys generated from the results of running
	     * each element of the collection through the given callback. The corresponding
	     * value of each key is the last element responsible for generating the key.
	     * The callback is bound to `thisArg` and invoked with three arguments;
	     * (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Object} Returns the composed aggregate object.
	     * @example
	     *
	     * var keys = [
	     *   { 'dir': 'left', 'code': 97 },
	     *   { 'dir': 'right', 'code': 100 }
	     * ];
	     *
	     * _.indexBy(keys, 'dir');
	     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
	     *
	     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
	     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
	     *
	     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
	     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
	     */
	    var indexBy = createAggregator(function(result, value, key) {
	      result[key] = value;
	    });

	    /**
	     * Invokes the method named by `methodName` on each element in the `collection`
	     * returning an array of the results of each invoked method. Additional arguments
	     * will be provided to each invoked method. If `methodName` is a function it
	     * will be invoked for, and `this` bound to, each element in the `collection`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|string} methodName The name of the method to invoke or
	     *  the function invoked per iteration.
	     * @param {...*} [arg] Arguments to invoke the method with.
	     * @returns {Array} Returns a new array of the results of each invoked method.
	     * @example
	     *
	     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
	     * // => [[1, 5, 7], [1, 2, 3]]
	     *
	     * _.invoke([123, 456], String.prototype.split, '');
	     * // => [['1', '2', '3'], ['4', '5', '6']]
	     */
	    function invoke(collection, methodName) {
	      var args = slice(arguments, 2),
	          index = -1,
	          isFunc = typeof methodName == 'function',
	          length = collection ? collection.length : 0,
	          result = Array(typeof length == 'number' ? length : 0);

	      forEach(collection, function(value) {
	        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
	      });
	      return result;
	    }

	    /**
	     * Creates an array of values by running each element in the collection
	     * through the callback. The callback is bound to `thisArg` and invoked with
	     * three arguments; (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias collect
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a new array of the results of each `callback` execution.
	     * @example
	     *
	     * _.map([1, 2, 3], function(num) { return num * 3; });
	     * // => [3, 6, 9]
	     *
	     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
	     * // => [3, 6, 9] (property order is not guaranteed across environments)
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.map(characters, 'name');
	     * // => ['barney', 'fred']
	     */
	    function map(collection, callback, thisArg) {
	      var index = -1,
	          length = collection ? collection.length : 0,
	          result = Array(typeof length == 'number' ? length : 0);

	      callback = lodash.createCallback(callback, thisArg, 3);
	      if (isArray(collection)) {
	        while (++index < length) {
	          result[index] = callback(collection[index], index, collection);
	        }
	      } else {
	        baseEach(collection, function(value, key, collection) {
	          result[++index] = callback(value, key, collection);
	        });
	      }
	      return result;
	    }

	    /**
	     * Retrieves the maximum value of a collection. If the collection is empty or
	     * falsey `-Infinity` is returned. If a callback is provided it will be executed
	     * for each value in the collection to generate the criterion by which the value
	     * is ranked. The callback is bound to `thisArg` and invoked with three
	     * arguments; (value, index, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the maximum value.
	     * @example
	     *
	     * _.max([4, 2, 8, 6]);
	     * // => 8
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * _.max(characters, function(chr) { return chr.age; });
	     * // => { 'name': 'fred', 'age': 40 };
	     *
	     * // using "_.pluck" callback shorthand
	     * _.max(characters, 'age');
	     * // => { 'name': 'fred', 'age': 40 };
	     */
	    function max(collection, callback, thisArg) {
	      var computed = -Infinity,
	          result = computed;

	      // allows working with functions like `_.map` without using
	      // their `index` argument as a callback
	      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
	        callback = null;
	      }
	      if (callback == null && isArray(collection)) {
	        var index = -1,
	            length = collection.length;

	        while (++index < length) {
	          var value = collection[index];
	          if (value > result) {
	            result = value;
	          }
	        }
	      } else {
	        callback = (callback == null && isString(collection))
	          ? charAtCallback
	          : lodash.createCallback(callback, thisArg, 3);

	        baseEach(collection, function(value, index, collection) {
	          var current = callback(value, index, collection);
	          if (current > computed) {
	            computed = current;
	            result = value;
	          }
	        });
	      }
	      return result;
	    }

	    /**
	     * Retrieves the minimum value of a collection. If the collection is empty or
	     * falsey `Infinity` is returned. If a callback is provided it will be executed
	     * for each value in the collection to generate the criterion by which the value
	     * is ranked. The callback is bound to `thisArg` and invoked with three
	     * arguments; (value, index, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the minimum value.
	     * @example
	     *
	     * _.min([4, 2, 8, 6]);
	     * // => 2
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * _.min(characters, function(chr) { return chr.age; });
	     * // => { 'name': 'barney', 'age': 36 };
	     *
	     * // using "_.pluck" callback shorthand
	     * _.min(characters, 'age');
	     * // => { 'name': 'barney', 'age': 36 };
	     */
	    function min(collection, callback, thisArg) {
	      var computed = Infinity,
	          result = computed;

	      // allows working with functions like `_.map` without using
	      // their `index` argument as a callback
	      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
	        callback = null;
	      }
	      if (callback == null && isArray(collection)) {
	        var index = -1,
	            length = collection.length;

	        while (++index < length) {
	          var value = collection[index];
	          if (value < result) {
	            result = value;
	          }
	        }
	      } else {
	        callback = (callback == null && isString(collection))
	          ? charAtCallback
	          : lodash.createCallback(callback, thisArg, 3);

	        baseEach(collection, function(value, index, collection) {
	          var current = callback(value, index, collection);
	          if (current < computed) {
	            computed = current;
	            result = value;
	          }
	        });
	      }
	      return result;
	    }

	    /**
	     * Retrieves the value of a specified property from all elements in the collection.
	     *
	     * @static
	     * @memberOf _
	     * @type Function
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {string} property The name of the property to pluck.
	     * @returns {Array} Returns a new array of property values.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * _.pluck(characters, 'name');
	     * // => ['barney', 'fred']
	     */
	    var pluck = map;

	    /**
	     * Reduces a collection to a value which is the accumulated result of running
	     * each element in the collection through the callback, where each successive
	     * callback execution consumes the return value of the previous execution. If
	     * `accumulator` is not provided the first element of the collection will be
	     * used as the initial `accumulator` value. The callback is bound to `thisArg`
	     * and invoked with four arguments; (accumulator, value, index|key, collection).
	     *
	     * @static
	     * @memberOf _
	     * @alias foldl, inject
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [accumulator] Initial value of the accumulator.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the accumulated value.
	     * @example
	     *
	     * var sum = _.reduce([1, 2, 3], function(sum, num) {
	     *   return sum + num;
	     * });
	     * // => 6
	     *
	     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
	     *   result[key] = num * 3;
	     *   return result;
	     * }, {});
	     * // => { 'a': 3, 'b': 6, 'c': 9 }
	     */
	    function reduce(collection, callback, accumulator, thisArg) {
	      var noaccum = arguments.length < 3;
	      callback = lodash.createCallback(callback, thisArg, 4);

	      if (isArray(collection)) {
	        var index = -1,
	            length = collection.length;

	        if (noaccum) {
	          accumulator = collection[++index];
	        }
	        while (++index < length) {
	          accumulator = callback(accumulator, collection[index], index, collection);
	        }
	      } else {
	        baseEach(collection, function(value, index, collection) {
	          accumulator = noaccum
	            ? (noaccum = false, value)
	            : callback(accumulator, value, index, collection)
	        });
	      }
	      return accumulator;
	    }

	    /**
	     * This method is like `_.reduce` except that it iterates over elements
	     * of a `collection` from right to left.
	     *
	     * @static
	     * @memberOf _
	     * @alias foldr
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function} [callback=identity] The function called per iteration.
	     * @param {*} [accumulator] Initial value of the accumulator.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the accumulated value.
	     * @example
	     *
	     * var list = [[0, 1], [2, 3], [4, 5]];
	     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
	     * // => [4, 5, 2, 3, 0, 1]
	     */
	    function reduceRight(collection, callback, accumulator, thisArg) {
	      var noaccum = arguments.length < 3;
	      callback = lodash.createCallback(callback, thisArg, 4);
	      forEachRight(collection, function(value, index, collection) {
	        accumulator = noaccum
	          ? (noaccum = false, value)
	          : callback(accumulator, value, index, collection);
	      });
	      return accumulator;
	    }

	    /**
	     * The opposite of `_.filter` this method returns the elements of a
	     * collection that the callback does **not** return truey for.
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a new array of elements that failed the callback check.
	     * @example
	     *
	     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
	     * // => [1, 3, 5]
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36, 'blocked': false },
	     *   { 'name': 'fred',   'age': 40, 'blocked': true }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.reject(characters, 'blocked');
	     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
	     *
	     * // using "_.where" callback shorthand
	     * _.reject(characters, { 'age': 36 });
	     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
	     */
	    function reject(collection, callback, thisArg) {
	      callback = lodash.createCallback(callback, thisArg, 3);
	      return filter(collection, function(value, index, collection) {
	        return !callback(value, index, collection);
	      });
	    }

	    /**
	     * Retrieves a random element or `n` random elements from a collection.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to sample.
	     * @param {number} [n] The number of elements to sample.
	     * @param- {Object} [guard] Allows working with functions like `_.map`
	     *  without using their `index` arguments as `n`.
	     * @returns {Array} Returns the random sample(s) of `collection`.
	     * @example
	     *
	     * _.sample([1, 2, 3, 4]);
	     * // => 2
	     *
	     * _.sample([1, 2, 3, 4], 2);
	     * // => [3, 1]
	     */
	    function sample(collection, n, guard) {
	      if (collection && typeof collection.length != 'number') {
	        collection = values(collection);
	      } else if (support.unindexedChars && isString(collection)) {
	        collection = collection.split('');
	      }
	      if (n == null || guard) {
	        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
	      }
	      var result = shuffle(collection);
	      result.length = nativeMin(nativeMax(0, n), result.length);
	      return result;
	    }

	    /**
	     * Creates an array of shuffled values, using a version of the Fisher-Yates
	     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to shuffle.
	     * @returns {Array} Returns a new shuffled collection.
	     * @example
	     *
	     * _.shuffle([1, 2, 3, 4, 5, 6]);
	     * // => [4, 1, 6, 3, 5, 2]
	     */
	    function shuffle(collection) {
	      var index = -1,
	          length = collection ? collection.length : 0,
	          result = Array(typeof length == 'number' ? length : 0);

	      forEach(collection, function(value) {
	        var rand = baseRandom(0, ++index);
	        result[index] = result[rand];
	        result[rand] = value;
	      });
	      return result;
	    }

	    /**
	     * Gets the size of the `collection` by returning `collection.length` for arrays
	     * and array-like objects or the number of own enumerable properties for objects.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to inspect.
	     * @returns {number} Returns `collection.length` or number of own enumerable properties.
	     * @example
	     *
	     * _.size([1, 2]);
	     * // => 2
	     *
	     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
	     * // => 3
	     *
	     * _.size('pebbles');
	     * // => 7
	     */
	    function size(collection) {
	      var length = collection ? collection.length : 0;
	      return typeof length == 'number' ? length : keys(collection).length;
	    }

	    /**
	     * Checks if the callback returns a truey value for **any** element of a
	     * collection. The function returns as soon as it finds a passing value and
	     * does not iterate over the entire collection. The callback is bound to
	     * `thisArg` and invoked with three arguments; (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias any
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {boolean} Returns `true` if any element passed the callback check,
	     *  else `false`.
	     * @example
	     *
	     * _.some([null, 0, 'yes', false], Boolean);
	     * // => true
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36, 'blocked': false },
	     *   { 'name': 'fred',   'age': 40, 'blocked': true }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.some(characters, 'blocked');
	     * // => true
	     *
	     * // using "_.where" callback shorthand
	     * _.some(characters, { 'age': 1 });
	     * // => false
	     */
	    function some(collection, callback, thisArg) {
	      var result;
	      callback = lodash.createCallback(callback, thisArg, 3);

	      if (isArray(collection)) {
	        var index = -1,
	            length = collection.length;

	        while (++index < length) {
	          if ((result = callback(collection[index], index, collection))) {
	            break;
	          }
	        }
	      } else {
	        baseEach(collection, function(value, index, collection) {
	          return !(result = callback(value, index, collection));
	        });
	      }
	      return !!result;
	    }

	    /**
	     * Creates an array of elements, sorted in ascending order by the results of
	     * running each element in a collection through the callback. This method
	     * performs a stable sort, that is, it will preserve the original sort order
	     * of equal elements. The callback is bound to `thisArg` and invoked with
	     * three arguments; (value, index|key, collection).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an array of property names is provided for `callback` the collection
	     * will be sorted by each property value.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Array|Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a new array of sorted elements.
	     * @example
	     *
	     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
	     * // => [3, 1, 2]
	     *
	     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
	     * // => [3, 1, 2]
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'age': 36 },
	     *   { 'name': 'fred',    'age': 40 },
	     *   { 'name': 'barney',  'age': 26 },
	     *   { 'name': 'fred',    'age': 30 }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.map(_.sortBy(characters, 'age'), _.values);
	     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
	     *
	     * // sorting by multiple properties
	     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
	     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
	     */
	    function sortBy(collection, callback, thisArg) {
	      var index = -1,
	          isArr = isArray(callback),
	          length = collection ? collection.length : 0,
	          result = Array(typeof length == 'number' ? length : 0);

	      if (!isArr) {
	        callback = lodash.createCallback(callback, thisArg, 3);
	      }
	      forEach(collection, function(value, key, collection) {
	        var object = result[++index] = getObject();
	        if (isArr) {
	          object.criteria = map(callback, function(key) { return value[key]; });
	        } else {
	          (object.criteria = getArray())[0] = callback(value, key, collection);
	        }
	        object.index = index;
	        object.value = value;
	      });

	      length = result.length;
	      result.sort(compareAscending);
	      while (length--) {
	        var object = result[length];
	        result[length] = object.value;
	        if (!isArr) {
	          releaseArray(object.criteria);
	        }
	        releaseObject(object);
	      }
	      return result;
	    }

	    /**
	     * Converts the `collection` to an array.
	     *
	     * @static
	     * @memberOf _
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to convert.
	     * @returns {Array} Returns the new converted array.
	     * @example
	     *
	     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
	     * // => [2, 3, 4]
	     */
	    function toArray(collection) {
	      if (collection && typeof collection.length == 'number') {
	        return (support.unindexedChars && isString(collection))
	          ? collection.split('')
	          : slice(collection);
	      }
	      return values(collection);
	    }

	    /**
	     * Performs a deep comparison of each element in a `collection` to the given
	     * `properties` object, returning an array of all elements that have equivalent
	     * property values.
	     *
	     * @static
	     * @memberOf _
	     * @type Function
	     * @category Collections
	     * @param {Array|Object|string} collection The collection to iterate over.
	     * @param {Object} props The object of property values to filter by.
	     * @returns {Array} Returns a new array of elements that have the given properties.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
	     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
	     * ];
	     *
	     * _.where(characters, { 'age': 36 });
	     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
	     *
	     * _.where(characters, { 'pets': ['dino'] });
	     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
	     */
	    var where = filter;

	    /*--------------------------------------------------------------------------*/

	    /**
	     * Creates an array with all falsey values removed. The values `false`, `null`,
	     * `0`, `""`, `undefined`, and `NaN` are all falsey.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to compact.
	     * @returns {Array} Returns a new array of filtered values.
	     * @example
	     *
	     * _.compact([0, 1, false, 2, '', 3]);
	     * // => [1, 2, 3]
	     */
	    function compact(array) {
	      var index = -1,
	          length = array ? array.length : 0,
	          result = [];

	      while (++index < length) {
	        var value = array[index];
	        if (value) {
	          result.push(value);
	        }
	      }
	      return result;
	    }

	    /**
	     * Creates an array excluding all values of the provided arrays using strict
	     * equality for comparisons, i.e. `===`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to process.
	     * @param {...Array} [values] The arrays of values to exclude.
	     * @returns {Array} Returns a new array of filtered values.
	     * @example
	     *
	     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
	     * // => [1, 3, 4]
	     */
	    function difference(array) {
	      return baseDifference(array, baseFlatten(arguments, true, true, 1));
	    }

	    /**
	     * This method is like `_.find` except that it returns the index of the first
	     * element that passes the callback check, instead of the element itself.
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to search.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {number} Returns the index of the found element, else `-1`.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'age': 36, 'blocked': false },
	     *   { 'name': 'fred',    'age': 40, 'blocked': true },
	     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
	     * ];
	     *
	     * _.findIndex(characters, function(chr) {
	     *   return chr.age < 20;
	     * });
	     * // => 2
	     *
	     * // using "_.where" callback shorthand
	     * _.findIndex(characters, { 'age': 36 });
	     * // => 0
	     *
	     * // using "_.pluck" callback shorthand
	     * _.findIndex(characters, 'blocked');
	     * // => 1
	     */
	    function findIndex(array, callback, thisArg) {
	      var index = -1,
	          length = array ? array.length : 0;

	      callback = lodash.createCallback(callback, thisArg, 3);
	      while (++index < length) {
	        if (callback(array[index], index, array)) {
	          return index;
	        }
	      }
	      return -1;
	    }

	    /**
	     * This method is like `_.findIndex` except that it iterates over elements
	     * of a `collection` from right to left.
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to search.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {number} Returns the index of the found element, else `-1`.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'age': 36, 'blocked': true },
	     *   { 'name': 'fred',    'age': 40, 'blocked': false },
	     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
	     * ];
	     *
	     * _.findLastIndex(characters, function(chr) {
	     *   return chr.age > 30;
	     * });
	     * // => 1
	     *
	     * // using "_.where" callback shorthand
	     * _.findLastIndex(characters, { 'age': 36 });
	     * // => 0
	     *
	     * // using "_.pluck" callback shorthand
	     * _.findLastIndex(characters, 'blocked');
	     * // => 2
	     */
	    function findLastIndex(array, callback, thisArg) {
	      var length = array ? array.length : 0;
	      callback = lodash.createCallback(callback, thisArg, 3);
	      while (length--) {
	        if (callback(array[length], length, array)) {
	          return length;
	        }
	      }
	      return -1;
	    }

	    /**
	     * Gets the first element or first `n` elements of an array. If a callback
	     * is provided elements at the beginning of the array are returned as long
	     * as the callback returns truey. The callback is bound to `thisArg` and
	     * invoked with three arguments; (value, index, array).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias head, take
	     * @category Arrays
	     * @param {Array} array The array to query.
	     * @param {Function|Object|number|string} [callback] The function called
	     *  per element or the number of elements to return. If a property name or
	     *  object is provided it will be used to create a "_.pluck" or "_.where"
	     *  style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the first element(s) of `array`.
	     * @example
	     *
	     * _.first([1, 2, 3]);
	     * // => 1
	     *
	     * _.first([1, 2, 3], 2);
	     * // => [1, 2]
	     *
	     * _.first([1, 2, 3], function(num) {
	     *   return num < 3;
	     * });
	     * // => [1, 2]
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
	     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
	     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.first(characters, 'blocked');
	     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
	     *
	     * // using "_.where" callback shorthand
	     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
	     * // => ['barney', 'fred']
	     */
	    function first(array, callback, thisArg) {
	      var n = 0,
	          length = array ? array.length : 0;

	      if (typeof callback != 'number' && callback != null) {
	        var index = -1;
	        callback = lodash.createCallback(callback, thisArg, 3);
	        while (++index < length && callback(array[index], index, array)) {
	          n++;
	        }
	      } else {
	        n = callback;
	        if (n == null || thisArg) {
	          return array ? array[0] : undefined;
	        }
	      }
	      return slice(array, 0, nativeMin(nativeMax(0, n), length));
	    }

	    /**
	     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
	     * is truey, the array will only be flattened a single level. If a callback
	     * is provided each element of the array is passed through the callback before
	     * flattening. The callback is bound to `thisArg` and invoked with three
	     * arguments; (value, index, array).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to flatten.
	     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a new flattened array.
	     * @example
	     *
	     * _.flatten([1, [2], [3, [[4]]]]);
	     * // => [1, 2, 3, 4];
	     *
	     * _.flatten([1, [2], [3, [[4]]]], true);
	     * // => [1, 2, 3, [[4]]];
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
	     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.flatten(characters, 'pets');
	     * // => ['hoppy', 'baby puss', 'dino']
	     */
	    function flatten(array, isShallow, callback, thisArg) {
	      // juggle arguments
	      if (typeof isShallow != 'boolean' && isShallow != null) {
	        thisArg = callback;
	        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
	        isShallow = false;
	      }
	      if (callback != null) {
	        array = map(array, callback, thisArg);
	      }
	      return baseFlatten(array, isShallow);
	    }

	    /**
	     * Gets the index at which the first occurrence of `value` is found using
	     * strict equality for comparisons, i.e. `===`. If the array is already sorted
	     * providing `true` for `fromIndex` will run a faster binary search.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to search.
	     * @param {*} value The value to search for.
	     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
	     *  to perform a binary search on a sorted array.
	     * @returns {number} Returns the index of the matched value or `-1`.
	     * @example
	     *
	     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
	     * // => 1
	     *
	     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
	     * // => 4
	     *
	     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
	     * // => 2
	     */
	    function indexOf(array, value, fromIndex) {
	      if (typeof fromIndex == 'number') {
	        var length = array ? array.length : 0;
	        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
	      } else if (fromIndex) {
	        var index = sortedIndex(array, value);
	        return array[index] === value ? index : -1;
	      }
	      return baseIndexOf(array, value, fromIndex);
	    }

	    /**
	     * Gets all but the last element or last `n` elements of an array. If a
	     * callback is provided elements at the end of the array are excluded from
	     * the result as long as the callback returns truey. The callback is bound
	     * to `thisArg` and invoked with three arguments; (value, index, array).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to query.
	     * @param {Function|Object|number|string} [callback=1] The function called
	     *  per element or the number of elements to exclude. If a property name or
	     *  object is provided it will be used to create a "_.pluck" or "_.where"
	     *  style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a slice of `array`.
	     * @example
	     *
	     * _.initial([1, 2, 3]);
	     * // => [1, 2]
	     *
	     * _.initial([1, 2, 3], 2);
	     * // => [1]
	     *
	     * _.initial([1, 2, 3], function(num) {
	     *   return num > 1;
	     * });
	     * // => [1]
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
	     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
	     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.initial(characters, 'blocked');
	     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
	     *
	     * // using "_.where" callback shorthand
	     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
	     * // => ['barney', 'fred']
	     */
	    function initial(array, callback, thisArg) {
	      var n = 0,
	          length = array ? array.length : 0;

	      if (typeof callback != 'number' && callback != null) {
	        var index = length;
	        callback = lodash.createCallback(callback, thisArg, 3);
	        while (index-- && callback(array[index], index, array)) {
	          n++;
	        }
	      } else {
	        n = (callback == null || thisArg) ? 1 : callback || n;
	      }
	      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
	    }

	    /**
	     * Creates an array of unique values present in all provided arrays using
	     * strict equality for comparisons, i.e. `===`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {...Array} [array] The arrays to inspect.
	     * @returns {Array} Returns an array of shared values.
	     * @example
	     *
	     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
	     * // => [1, 2]
	     */
	    function intersection() {
	      var args = [],
	          argsIndex = -1,
	          argsLength = arguments.length,
	          caches = getArray(),
	          indexOf = getIndexOf(),
	          trustIndexOf = indexOf === baseIndexOf,
	          seen = getArray();

	      while (++argsIndex < argsLength) {
	        var value = arguments[argsIndex];
	        if (isArray(value) || isArguments(value)) {
	          args.push(value);
	          caches.push(trustIndexOf && value.length >= largeArraySize &&
	            createCache(argsIndex ? args[argsIndex] : seen));
	        }
	      }
	      var array = args[0],
	          index = -1,
	          length = array ? array.length : 0,
	          result = [];

	      outer:
	      while (++index < length) {
	        var cache = caches[0];
	        value = array[index];

	        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
	          argsIndex = argsLength;
	          (cache || seen).push(value);
	          while (--argsIndex) {
	            cache = caches[argsIndex];
	            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
	              continue outer;
	            }
	          }
	          result.push(value);
	        }
	      }
	      while (argsLength--) {
	        cache = caches[argsLength];
	        if (cache) {
	          releaseObject(cache);
	        }
	      }
	      releaseArray(caches);
	      releaseArray(seen);
	      return result;
	    }

	    /**
	     * Gets the last element or last `n` elements of an array. If a callback is
	     * provided elements at the end of the array are returned as long as the
	     * callback returns truey. The callback is bound to `thisArg` and invoked
	     * with three arguments; (value, index, array).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to query.
	     * @param {Function|Object|number|string} [callback] The function called
	     *  per element or the number of elements to return. If a property name or
	     *  object is provided it will be used to create a "_.pluck" or "_.where"
	     *  style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {*} Returns the last element(s) of `array`.
	     * @example
	     *
	     * _.last([1, 2, 3]);
	     * // => 3
	     *
	     * _.last([1, 2, 3], 2);
	     * // => [2, 3]
	     *
	     * _.last([1, 2, 3], function(num) {
	     *   return num > 1;
	     * });
	     * // => [2, 3]
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
	     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
	     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.pluck(_.last(characters, 'blocked'), 'name');
	     * // => ['fred', 'pebbles']
	     *
	     * // using "_.where" callback shorthand
	     * _.last(characters, { 'employer': 'na' });
	     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
	     */
	    function last(array, callback, thisArg) {
	      var n = 0,
	          length = array ? array.length : 0;

	      if (typeof callback != 'number' && callback != null) {
	        var index = length;
	        callback = lodash.createCallback(callback, thisArg, 3);
	        while (index-- && callback(array[index], index, array)) {
	          n++;
	        }
	      } else {
	        n = callback;
	        if (n == null || thisArg) {
	          return array ? array[length - 1] : undefined;
	        }
	      }
	      return slice(array, nativeMax(0, length - n));
	    }

	    /**
	     * Gets the index at which the last occurrence of `value` is found using strict
	     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
	     * as the offset from the end of the collection.
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to search.
	     * @param {*} value The value to search for.
	     * @param {number} [fromIndex=array.length-1] The index to search from.
	     * @returns {number} Returns the index of the matched value or `-1`.
	     * @example
	     *
	     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
	     * // => 4
	     *
	     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
	     * // => 1
	     */
	    function lastIndexOf(array, value, fromIndex) {
	      var index = array ? array.length : 0;
	      if (typeof fromIndex == 'number') {
	        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
	      }
	      while (index--) {
	        if (array[index] === value) {
	          return index;
	        }
	      }
	      return -1;
	    }

	    /**
	     * Removes all provided values from the given array using strict equality for
	     * comparisons, i.e. `===`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to modify.
	     * @param {...*} [value] The values to remove.
	     * @returns {Array} Returns `array`.
	     * @example
	     *
	     * var array = [1, 2, 3, 1, 2, 3];
	     * _.pull(array, 2, 3);
	     * console.log(array);
	     * // => [1, 1]
	     */
	    function pull(array) {
	      var args = arguments,
	          argsIndex = 0,
	          argsLength = args.length,
	          length = array ? array.length : 0;

	      while (++argsIndex < argsLength) {
	        var index = -1,
	            value = args[argsIndex];
	        while (++index < length) {
	          if (array[index] === value) {
	            splice.call(array, index--, 1);
	            length--;
	          }
	        }
	      }
	      return array;
	    }

	    /**
	     * Creates an array of numbers (positive and/or negative) progressing from
	     * `start` up to but not including `end`. If `start` is less than `stop` a
	     * zero-length range is created unless a negative `step` is specified.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {number} [start=0] The start of the range.
	     * @param {number} end The end of the range.
	     * @param {number} [step=1] The value to increment or decrement by.
	     * @returns {Array} Returns a new range array.
	     * @example
	     *
	     * _.range(4);
	     * // => [0, 1, 2, 3]
	     *
	     * _.range(1, 5);
	     * // => [1, 2, 3, 4]
	     *
	     * _.range(0, 20, 5);
	     * // => [0, 5, 10, 15]
	     *
	     * _.range(0, -4, -1);
	     * // => [0, -1, -2, -3]
	     *
	     * _.range(1, 4, 0);
	     * // => [1, 1, 1]
	     *
	     * _.range(0);
	     * // => []
	     */
	    function range(start, end, step) {
	      start = +start || 0;
	      step = typeof step == 'number' ? step : (+step || 1);

	      if (end == null) {
	        end = start;
	        start = 0;
	      }
	      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
	      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
	      var index = -1,
	          length = nativeMax(0, ceil((end - start) / (step || 1))),
	          result = Array(length);

	      while (++index < length) {
	        result[index] = start;
	        start += step;
	      }
	      return result;
	    }

	    /**
	     * Removes all elements from an array that the callback returns truey for
	     * and returns an array of removed elements. The callback is bound to `thisArg`
	     * and invoked with three arguments; (value, index, array).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to modify.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a new array of removed elements.
	     * @example
	     *
	     * var array = [1, 2, 3, 4, 5, 6];
	     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
	     *
	     * console.log(array);
	     * // => [1, 3, 5]
	     *
	     * console.log(evens);
	     * // => [2, 4, 6]
	     */
	    function remove(array, callback, thisArg) {
	      var index = -1,
	          length = array ? array.length : 0,
	          result = [];

	      callback = lodash.createCallback(callback, thisArg, 3);
	      while (++index < length) {
	        var value = array[index];
	        if (callback(value, index, array)) {
	          result.push(value);
	          splice.call(array, index--, 1);
	          length--;
	        }
	      }
	      return result;
	    }

	    /**
	     * The opposite of `_.initial` this method gets all but the first element or
	     * first `n` elements of an array. If a callback function is provided elements
	     * at the beginning of the array are excluded from the result as long as the
	     * callback returns truey. The callback is bound to `thisArg` and invoked
	     * with three arguments; (value, index, array).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias drop, tail
	     * @category Arrays
	     * @param {Array} array The array to query.
	     * @param {Function|Object|number|string} [callback=1] The function called
	     *  per element or the number of elements to exclude. If a property name or
	     *  object is provided it will be used to create a "_.pluck" or "_.where"
	     *  style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a slice of `array`.
	     * @example
	     *
	     * _.rest([1, 2, 3]);
	     * // => [2, 3]
	     *
	     * _.rest([1, 2, 3], 2);
	     * // => [3]
	     *
	     * _.rest([1, 2, 3], function(num) {
	     *   return num < 3;
	     * });
	     * // => [3]
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
	     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
	     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
	     * ];
	     *
	     * // using "_.pluck" callback shorthand
	     * _.pluck(_.rest(characters, 'blocked'), 'name');
	     * // => ['fred', 'pebbles']
	     *
	     * // using "_.where" callback shorthand
	     * _.rest(characters, { 'employer': 'slate' });
	     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
	     */
	    function rest(array, callback, thisArg) {
	      if (typeof callback != 'number' && callback != null) {
	        var n = 0,
	            index = -1,
	            length = array ? array.length : 0;

	        callback = lodash.createCallback(callback, thisArg, 3);
	        while (++index < length && callback(array[index], index, array)) {
	          n++;
	        }
	      } else {
	        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
	      }
	      return slice(array, n);
	    }

	    /**
	     * Uses a binary search to determine the smallest index at which a value
	     * should be inserted into a given sorted array in order to maintain the sort
	     * order of the array. If a callback is provided it will be executed for
	     * `value` and each element of `array` to compute their sort ranking. The
	     * callback is bound to `thisArg` and invoked with one argument; (value).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to inspect.
	     * @param {*} value The value to evaluate.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {number} Returns the index at which `value` should be inserted
	     *  into `array`.
	     * @example
	     *
	     * _.sortedIndex([20, 30, 50], 40);
	     * // => 2
	     *
	     * // using "_.pluck" callback shorthand
	     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
	     * // => 2
	     *
	     * var dict = {
	     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
	     * };
	     *
	     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
	     *   return dict.wordToNumber[word];
	     * });
	     * // => 2
	     *
	     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
	     *   return this.wordToNumber[word];
	     * }, dict);
	     * // => 2
	     */
	    function sortedIndex(array, value, callback, thisArg) {
	      var low = 0,
	          high = array ? array.length : low;

	      // explicitly reference `identity` for better inlining in Firefox
	      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
	      value = callback(value);

	      while (low < high) {
	        var mid = (low + high) >>> 1;
	        (callback(array[mid]) < value)
	          ? low = mid + 1
	          : high = mid;
	      }
	      return low;
	    }

	    /**
	     * Creates an array of unique values, in order, of the provided arrays using
	     * strict equality for comparisons, i.e. `===`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {...Array} [array] The arrays to inspect.
	     * @returns {Array} Returns an array of combined values.
	     * @example
	     *
	     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
	     * // => [1, 2, 3, 5, 4]
	     */
	    function union() {
	      return baseUniq(baseFlatten(arguments, true, true));
	    }

	    /**
	     * Creates a duplicate-value-free version of an array using strict equality
	     * for comparisons, i.e. `===`. If the array is sorted, providing
	     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
	     * each element of `array` is passed through the callback before uniqueness
	     * is computed. The callback is bound to `thisArg` and invoked with three
	     * arguments; (value, index, array).
	     *
	     * If a property name is provided for `callback` the created "_.pluck" style
	     * callback will return the property value of the given element.
	     *
	     * If an object is provided for `callback` the created "_.where" style callback
	     * will return `true` for elements that have the properties of the given object,
	     * else `false`.
	     *
	     * @static
	     * @memberOf _
	     * @alias unique
	     * @category Arrays
	     * @param {Array} array The array to process.
	     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
	     * @param {Function|Object|string} [callback=identity] The function called
	     *  per iteration. If a property name or object is provided it will be used
	     *  to create a "_.pluck" or "_.where" style callback, respectively.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns a duplicate-value-free array.
	     * @example
	     *
	     * _.uniq([1, 2, 1, 3, 1]);
	     * // => [1, 2, 3]
	     *
	     * _.uniq([1, 1, 2, 2, 3], true);
	     * // => [1, 2, 3]
	     *
	     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
	     * // => ['A', 'b', 'C']
	     *
	     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
	     * // => [1, 2.5, 3]
	     *
	     * // using "_.pluck" callback shorthand
	     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
	     * // => [{ 'x': 1 }, { 'x': 2 }]
	     */
	    function uniq(array, isSorted, callback, thisArg) {
	      // juggle arguments
	      if (typeof isSorted != 'boolean' && isSorted != null) {
	        thisArg = callback;
	        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
	        isSorted = false;
	      }
	      if (callback != null) {
	        callback = lodash.createCallback(callback, thisArg, 3);
	      }
	      return baseUniq(array, isSorted, callback);
	    }

	    /**
	     * Creates an array excluding all provided values using strict equality for
	     * comparisons, i.e. `===`.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {Array} array The array to filter.
	     * @param {...*} [value] The values to exclude.
	     * @returns {Array} Returns a new array of filtered values.
	     * @example
	     *
	     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
	     * // => [2, 3, 4]
	     */
	    function without(array) {
	      return baseDifference(array, slice(arguments, 1));
	    }

	    /**
	     * Creates an array that is the symmetric difference of the provided arrays.
	     * See http://en.wikipedia.org/wiki/Symmetric_difference.
	     *
	     * @static
	     * @memberOf _
	     * @category Arrays
	     * @param {...Array} [array] The arrays to inspect.
	     * @returns {Array} Returns an array of values.
	     * @example
	     *
	     * _.xor([1, 2, 3], [5, 2, 1, 4]);
	     * // => [3, 5, 4]
	     *
	     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
	     * // => [1, 4, 5]
	     */
	    function xor() {
	      var index = -1,
	          length = arguments.length;

	      while (++index < length) {
	        var array = arguments[index];
	        if (isArray(array) || isArguments(array)) {
	          var result = result
	            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
	            : array;
	        }
	      }
	      return result || [];
	    }

	    /**
	     * Creates an array of grouped elements, the first of which contains the first
	     * elements of the given arrays, the second of which contains the second
	     * elements of the given arrays, and so on.
	     *
	     * @static
	     * @memberOf _
	     * @alias unzip
	     * @category Arrays
	     * @param {...Array} [array] Arrays to process.
	     * @returns {Array} Returns a new array of grouped elements.
	     * @example
	     *
	     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
	     * // => [['fred', 30, true], ['barney', 40, false]]
	     */
	    function zip() {
	      var array = arguments.length > 1 ? arguments : arguments[0],
	          index = -1,
	          length = array ? max(pluck(array, 'length')) : 0,
	          result = Array(length < 0 ? 0 : length);

	      while (++index < length) {
	        result[index] = pluck(array, index);
	      }
	      return result;
	    }

	    /**
	     * Creates an object composed from arrays of `keys` and `values`. Provide
	     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
	     * or two arrays, one of `keys` and one of corresponding `values`.
	     *
	     * @static
	     * @memberOf _
	     * @alias object
	     * @category Arrays
	     * @param {Array} keys The array of keys.
	     * @param {Array} [values=[]] The array of values.
	     * @returns {Object} Returns an object composed of the given keys and
	     *  corresponding values.
	     * @example
	     *
	     * _.zipObject(['fred', 'barney'], [30, 40]);
	     * // => { 'fred': 30, 'barney': 40 }
	     */
	    function zipObject(keys, values) {
	      var index = -1,
	          length = keys ? keys.length : 0,
	          result = {};

	      if (!values && length && !isArray(keys[0])) {
	        values = [];
	      }
	      while (++index < length) {
	        var key = keys[index];
	        if (values) {
	          result[key] = values[index];
	        } else if (key) {
	          result[key[0]] = key[1];
	        }
	      }
	      return result;
	    }

	    /*--------------------------------------------------------------------------*/

	    /**
	     * Creates a function that executes `func`, with  the `this` binding and
	     * arguments of the created function, only after being called `n` times.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {number} n The number of times the function must be called before
	     *  `func` is executed.
	     * @param {Function} func The function to restrict.
	     * @returns {Function} Returns the new restricted function.
	     * @example
	     *
	     * var saves = ['profile', 'settings'];
	     *
	     * var done = _.after(saves.length, function() {
	     *   console.log('Done saving!');
	     * });
	     *
	     * _.forEach(saves, function(type) {
	     *   asyncSave({ 'type': type, 'complete': done });
	     * });
	     * // => logs 'Done saving!', after all saves have completed
	     */
	    function after(n, func) {
	      if (!isFunction(func)) {
	        throw new TypeError;
	      }
	      return function() {
	        if (--n < 1) {
	          return func.apply(this, arguments);
	        }
	      };
	    }

	    /**
	     * Creates a function that, when called, invokes `func` with the `this`
	     * binding of `thisArg` and prepends any additional `bind` arguments to those
	     * provided to the bound function.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to bind.
	     * @param {*} [thisArg] The `this` binding of `func`.
	     * @param {...*} [arg] Arguments to be partially applied.
	     * @returns {Function} Returns the new bound function.
	     * @example
	     *
	     * var func = function(greeting) {
	     *   return greeting + ' ' + this.name;
	     * };
	     *
	     * func = _.bind(func, { 'name': 'fred' }, 'hi');
	     * func();
	     * // => 'hi fred'
	     */
	    function bind(func, thisArg) {
	      return arguments.length > 2
	        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
	        : createWrapper(func, 1, null, null, thisArg);
	    }

	    /**
	     * Binds methods of an object to the object itself, overwriting the existing
	     * method. Method names may be specified as individual arguments or as arrays
	     * of method names. If no method names are provided all the function properties
	     * of `object` will be bound.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Object} object The object to bind and assign the bound methods to.
	     * @param {...string} [methodName] The object method names to
	     *  bind, specified as individual method names or arrays of method names.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * var view = {
	     *   'label': 'docs',
	     *   'onClick': function() { console.log('clicked ' + this.label); }
	     * };
	     *
	     * _.bindAll(view);
	     * jQuery('#docs').on('click', view.onClick);
	     * // => logs 'clicked docs', when the button is clicked
	     */
	    function bindAll(object) {
	      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
	          index = -1,
	          length = funcs.length;

	      while (++index < length) {
	        var key = funcs[index];
	        object[key] = createWrapper(object[key], 1, null, null, object);
	      }
	      return object;
	    }

	    /**
	     * Creates a function that, when called, invokes the method at `object[key]`
	     * and prepends any additional `bindKey` arguments to those provided to the bound
	     * function. This method differs from `_.bind` by allowing bound functions to
	     * reference methods that will be redefined or don't yet exist.
	     * See http://michaux.ca/articles/lazy-function-definition-pattern.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Object} object The object the method belongs to.
	     * @param {string} key The key of the method.
	     * @param {...*} [arg] Arguments to be partially applied.
	     * @returns {Function} Returns the new bound function.
	     * @example
	     *
	     * var object = {
	     *   'name': 'fred',
	     *   'greet': function(greeting) {
	     *     return greeting + ' ' + this.name;
	     *   }
	     * };
	     *
	     * var func = _.bindKey(object, 'greet', 'hi');
	     * func();
	     * // => 'hi fred'
	     *
	     * object.greet = function(greeting) {
	     *   return greeting + 'ya ' + this.name + '!';
	     * };
	     *
	     * func();
	     * // => 'hiya fred!'
	     */
	    function bindKey(object, key) {
	      return arguments.length > 2
	        ? createWrapper(key, 19, slice(arguments, 2), null, object)
	        : createWrapper(key, 3, null, null, object);
	    }

	    /**
	     * Creates a function that is the composition of the provided functions,
	     * where each function consumes the return value of the function that follows.
	     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
	     * Each function is executed with the `this` binding of the composed function.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {...Function} [func] Functions to compose.
	     * @returns {Function} Returns the new composed function.
	     * @example
	     *
	     * var realNameMap = {
	     *   'pebbles': 'penelope'
	     * };
	     *
	     * var format = function(name) {
	     *   name = realNameMap[name.toLowerCase()] || name;
	     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
	     * };
	     *
	     * var greet = function(formatted) {
	     *   return 'Hiya ' + formatted + '!';
	     * };
	     *
	     * var welcome = _.compose(greet, format);
	     * welcome('pebbles');
	     * // => 'Hiya Penelope!'
	     */
	    function compose() {
	      var funcs = arguments,
	          length = funcs.length;

	      while (length--) {
	        if (!isFunction(funcs[length])) {
	          throw new TypeError;
	        }
	      }
	      return function() {
	        var args = arguments,
	            length = funcs.length;

	        while (length--) {
	          args = [funcs[length].apply(this, args)];
	        }
	        return args[0];
	      };
	    }

	    /**
	     * Creates a function which accepts one or more arguments of `func` that when
	     * invoked either executes `func` returning its result, if all `func` arguments
	     * have been provided, or returns a function that accepts one or more of the
	     * remaining `func` arguments, and so on. The arity of `func` can be specified
	     * if `func.length` is not sufficient.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to curry.
	     * @param {number} [arity=func.length] The arity of `func`.
	     * @returns {Function} Returns the new curried function.
	     * @example
	     *
	     * var curried = _.curry(function(a, b, c) {
	     *   console.log(a + b + c);
	     * });
	     *
	     * curried(1)(2)(3);
	     * // => 6
	     *
	     * curried(1, 2)(3);
	     * // => 6
	     *
	     * curried(1, 2, 3);
	     * // => 6
	     */
	    function curry(func, arity) {
	      arity = typeof arity == 'number' ? arity : (+arity || func.length);
	      return createWrapper(func, 4, null, null, null, arity);
	    }

	    /**
	     * Creates a function that will delay the execution of `func` until after
	     * `wait` milliseconds have elapsed since the last time it was invoked.
	     * Provide an options object to indicate that `func` should be invoked on
	     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
	     * to the debounced function will return the result of the last `func` call.
	     *
	     * Note: If `leading` and `trailing` options are `true` `func` will be called
	     * on the trailing edge of the timeout only if the the debounced function is
	     * invoked more than once during the `wait` timeout.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to debounce.
	     * @param {number} wait The number of milliseconds to delay.
	     * @param {Object} [options] The options object.
	     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
	     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
	     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
	     * @returns {Function} Returns the new debounced function.
	     * @example
	     *
	     * // avoid costly calculations while the window size is in flux
	     * var lazyLayout = _.debounce(calculateLayout, 150);
	     * jQuery(window).on('resize', lazyLayout);
	     *
	     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
	     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
	     *   'leading': true,
	     *   'trailing': false
	     * });
	     *
	     * // ensure `batchLog` is executed once after 1 second of debounced calls
	     * var source = new EventSource('/stream');
	     * source.addEventListener('message', _.debounce(batchLog, 250, {
	     *   'maxWait': 1000
	     * }, false);
	     */
	    function debounce(func, wait, options) {
	      var args,
	          maxTimeoutId,
	          result,
	          stamp,
	          thisArg,
	          timeoutId,
	          trailingCall,
	          lastCalled = 0,
	          maxWait = false,
	          trailing = true;

	      if (!isFunction(func)) {
	        throw new TypeError;
	      }
	      wait = nativeMax(0, wait) || 0;
	      if (options === true) {
	        var leading = true;
	        trailing = false;
	      } else if (isObject(options)) {
	        leading = options.leading;
	        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
	        trailing = 'trailing' in options ? options.trailing : trailing;
	      }
	      var delayed = function() {
	        var remaining = wait - (now() - stamp);
	        if (remaining <= 0) {
	          if (maxTimeoutId) {
	            clearTimeout(maxTimeoutId);
	          }
	          var isCalled = trailingCall;
	          maxTimeoutId = timeoutId = trailingCall = undefined;
	          if (isCalled) {
	            lastCalled = now();
	            result = func.apply(thisArg, args);
	            if (!timeoutId && !maxTimeoutId) {
	              args = thisArg = null;
	            }
	          }
	        } else {
	          timeoutId = setTimeout(delayed, remaining);
	        }
	      };

	      var maxDelayed = function() {
	        if (timeoutId) {
	          clearTimeout(timeoutId);
	        }
	        maxTimeoutId = timeoutId = trailingCall = undefined;
	        if (trailing || (maxWait !== wait)) {
	          lastCalled = now();
	          result = func.apply(thisArg, args);
	          if (!timeoutId && !maxTimeoutId) {
	            args = thisArg = null;
	          }
	        }
	      };

	      return function() {
	        args = arguments;
	        stamp = now();
	        thisArg = this;
	        trailingCall = trailing && (timeoutId || !leading);

	        if (maxWait === false) {
	          var leadingCall = leading && !timeoutId;
	        } else {
	          if (!maxTimeoutId && !leading) {
	            lastCalled = stamp;
	          }
	          var remaining = maxWait - (stamp - lastCalled),
	              isCalled = remaining <= 0;

	          if (isCalled) {
	            if (maxTimeoutId) {
	              maxTimeoutId = clearTimeout(maxTimeoutId);
	            }
	            lastCalled = stamp;
	            result = func.apply(thisArg, args);
	          }
	          else if (!maxTimeoutId) {
	            maxTimeoutId = setTimeout(maxDelayed, remaining);
	          }
	        }
	        if (isCalled && timeoutId) {
	          timeoutId = clearTimeout(timeoutId);
	        }
	        else if (!timeoutId && wait !== maxWait) {
	          timeoutId = setTimeout(delayed, wait);
	        }
	        if (leadingCall) {
	          isCalled = true;
	          result = func.apply(thisArg, args);
	        }
	        if (isCalled && !timeoutId && !maxTimeoutId) {
	          args = thisArg = null;
	        }
	        return result;
	      };
	    }

	    /**
	     * Defers executing the `func` function until the current call stack has cleared.
	     * Additional arguments will be provided to `func` when it is invoked.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to defer.
	     * @param {...*} [arg] Arguments to invoke the function with.
	     * @returns {number} Returns the timer id.
	     * @example
	     *
	     * _.defer(function(text) { console.log(text); }, 'deferred');
	     * // logs 'deferred' after one or more milliseconds
	     */
	    function defer(func) {
	      if (!isFunction(func)) {
	        throw new TypeError;
	      }
	      var args = slice(arguments, 1);
	      return setTimeout(function() { func.apply(undefined, args); }, 1);
	    }

	    /**
	     * Executes the `func` function after `wait` milliseconds. Additional arguments
	     * will be provided to `func` when it is invoked.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to delay.
	     * @param {number} wait The number of milliseconds to delay execution.
	     * @param {...*} [arg] Arguments to invoke the function with.
	     * @returns {number} Returns the timer id.
	     * @example
	     *
	     * _.delay(function(text) { console.log(text); }, 1000, 'later');
	     * // => logs 'later' after one second
	     */
	    function delay(func, wait) {
	      if (!isFunction(func)) {
	        throw new TypeError;
	      }
	      var args = slice(arguments, 2);
	      return setTimeout(function() { func.apply(undefined, args); }, wait);
	    }

	    /**
	     * Creates a function that memoizes the result of `func`. If `resolver` is
	     * provided it will be used to determine the cache key for storing the result
	     * based on the arguments provided to the memoized function. By default, the
	     * first argument provided to the memoized function is used as the cache key.
	     * The `func` is executed with the `this` binding of the memoized function.
	     * The result cache is exposed as the `cache` property on the memoized function.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to have its output memoized.
	     * @param {Function} [resolver] A function used to resolve the cache key.
	     * @returns {Function} Returns the new memoizing function.
	     * @example
	     *
	     * var fibonacci = _.memoize(function(n) {
	     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
	     * });
	     *
	     * fibonacci(9)
	     * // => 34
	     *
	     * var data = {
	     *   'fred': { 'name': 'fred', 'age': 40 },
	     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
	     * };
	     *
	     * // modifying the result cache
	     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
	     * get('pebbles');
	     * // => { 'name': 'pebbles', 'age': 1 }
	     *
	     * get.cache.pebbles.name = 'penelope';
	     * get('pebbles');
	     * // => { 'name': 'penelope', 'age': 1 }
	     */
	    function memoize(func, resolver) {
	      if (!isFunction(func)) {
	        throw new TypeError;
	      }
	      var memoized = function() {
	        var cache = memoized.cache,
	            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

	        return hasOwnProperty.call(cache, key)
	          ? cache[key]
	          : (cache[key] = func.apply(this, arguments));
	      }
	      memoized.cache = {};
	      return memoized;
	    }

	    /**
	     * Creates a function that is restricted to execute `func` once. Repeat calls to
	     * the function will return the value of the first call. The `func` is executed
	     * with the `this` binding of the created function.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to restrict.
	     * @returns {Function} Returns the new restricted function.
	     * @example
	     *
	     * var initialize = _.once(createApplication);
	     * initialize();
	     * initialize();
	     * // `initialize` executes `createApplication` once
	     */
	    function once(func) {
	      var ran,
	          result;

	      if (!isFunction(func)) {
	        throw new TypeError;
	      }
	      return function() {
	        if (ran) {
	          return result;
	        }
	        ran = true;
	        result = func.apply(this, arguments);

	        // clear the `func` variable so the function may be garbage collected
	        func = null;
	        return result;
	      };
	    }

	    /**
	     * Creates a function that, when called, invokes `func` with any additional
	     * `partial` arguments prepended to those provided to the new function. This
	     * method is similar to `_.bind` except it does **not** alter the `this` binding.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to partially apply arguments to.
	     * @param {...*} [arg] Arguments to be partially applied.
	     * @returns {Function} Returns the new partially applied function.
	     * @example
	     *
	     * var greet = function(greeting, name) { return greeting + ' ' + name; };
	     * var hi = _.partial(greet, 'hi');
	     * hi('fred');
	     * // => 'hi fred'
	     */
	    function partial(func) {
	      return createWrapper(func, 16, slice(arguments, 1));
	    }

	    /**
	     * This method is like `_.partial` except that `partial` arguments are
	     * appended to those provided to the new function.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to partially apply arguments to.
	     * @param {...*} [arg] Arguments to be partially applied.
	     * @returns {Function} Returns the new partially applied function.
	     * @example
	     *
	     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
	     *
	     * var options = {
	     *   'variable': 'data',
	     *   'imports': { 'jq': $ }
	     * };
	     *
	     * defaultsDeep(options, _.templateSettings);
	     *
	     * options.variable
	     * // => 'data'
	     *
	     * options.imports
	     * // => { '_': _, 'jq': $ }
	     */
	    function partialRight(func) {
	      return createWrapper(func, 32, null, slice(arguments, 1));
	    }

	    /**
	     * Creates a function that, when executed, will only call the `func` function
	     * at most once per every `wait` milliseconds. Provide an options object to
	     * indicate that `func` should be invoked on the leading and/or trailing edge
	     * of the `wait` timeout. Subsequent calls to the throttled function will
	     * return the result of the last `func` call.
	     *
	     * Note: If `leading` and `trailing` options are `true` `func` will be called
	     * on the trailing edge of the timeout only if the the throttled function is
	     * invoked more than once during the `wait` timeout.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {Function} func The function to throttle.
	     * @param {number} wait The number of milliseconds to throttle executions to.
	     * @param {Object} [options] The options object.
	     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
	     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
	     * @returns {Function} Returns the new throttled function.
	     * @example
	     *
	     * // avoid excessively updating the position while scrolling
	     * var throttled = _.throttle(updatePosition, 100);
	     * jQuery(window).on('scroll', throttled);
	     *
	     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
	     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
	     *   'trailing': false
	     * }));
	     */
	    function throttle(func, wait, options) {
	      var leading = true,
	          trailing = true;

	      if (!isFunction(func)) {
	        throw new TypeError;
	      }
	      if (options === false) {
	        leading = false;
	      } else if (isObject(options)) {
	        leading = 'leading' in options ? options.leading : leading;
	        trailing = 'trailing' in options ? options.trailing : trailing;
	      }
	      debounceOptions.leading = leading;
	      debounceOptions.maxWait = wait;
	      debounceOptions.trailing = trailing;

	      return debounce(func, wait, debounceOptions);
	    }

	    /**
	     * Creates a function that provides `value` to the wrapper function as its
	     * first argument. Additional arguments provided to the function are appended
	     * to those provided to the wrapper function. The wrapper is executed with
	     * the `this` binding of the created function.
	     *
	     * @static
	     * @memberOf _
	     * @category Functions
	     * @param {*} value The value to wrap.
	     * @param {Function} wrapper The wrapper function.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var p = _.wrap(_.escape, function(func, text) {
	     *   return '<p>' + func(text) + '</p>';
	     * });
	     *
	     * p('Fred, Wilma, & Pebbles');
	     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
	     */
	    function wrap(value, wrapper) {
	      return createWrapper(wrapper, 16, [value]);
	    }

	    /*--------------------------------------------------------------------------*/

	    /**
	     * Creates a function that returns `value`.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {*} value The value to return from the new function.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var object = { 'name': 'fred' };
	     * var getter = _.constant(object);
	     * getter() === object;
	     * // => true
	     */
	    function constant(value) {
	      return function() {
	        return value;
	      };
	    }

	    /**
	     * Produces a callback bound to an optional `thisArg`. If `func` is a property
	     * name the created callback will return the property value for a given element.
	     * If `func` is an object the created callback will return `true` for elements
	     * that contain the equivalent object properties, otherwise it will return `false`.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {*} [func=identity] The value to convert to a callback.
	     * @param {*} [thisArg] The `this` binding of the created callback.
	     * @param {number} [argCount] The number of arguments the callback accepts.
	     * @returns {Function} Returns a callback function.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * // wrap to create custom callback shorthands
	     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
	     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
	     *   return !match ? func(callback, thisArg) : function(object) {
	     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
	     *   };
	     * });
	     *
	     * _.filter(characters, 'age__gt38');
	     * // => [{ 'name': 'fred', 'age': 40 }]
	     */
	    function createCallback(func, thisArg, argCount) {
	      var type = typeof func;
	      if (func == null || type == 'function') {
	        return baseCreateCallback(func, thisArg, argCount);
	      }
	      // handle "_.pluck" style callback shorthands
	      if (type != 'object') {
	        return property(func);
	      }
	      var props = keys(func),
	          key = props[0],
	          a = func[key];

	      // handle "_.where" style callback shorthands
	      if (props.length == 1 && a === a && !isObject(a)) {
	        // fast path the common case of providing an object with a single
	        // property containing a primitive value
	        return function(object) {
	          var b = object[key];
	          return a === b && (a !== 0 || (1 / a == 1 / b));
	        };
	      }
	      return function(object) {
	        var length = props.length,
	            result = false;

	        while (length--) {
	          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
	            break;
	          }
	        }
	        return result;
	      };
	    }

	    /**
	     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
	     * corresponding HTML entities.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {string} string The string to escape.
	     * @returns {string} Returns the escaped string.
	     * @example
	     *
	     * _.escape('Fred, Wilma, & Pebbles');
	     * // => 'Fred, Wilma, &amp; Pebbles'
	     */
	    function escape(string) {
	      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
	    }

	    /**
	     * This method returns the first argument provided to it.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {*} value Any value.
	     * @returns {*} Returns `value`.
	     * @example
	     *
	     * var object = { 'name': 'fred' };
	     * _.identity(object) === object;
	     * // => true
	     */
	    function identity(value) {
	      return value;
	    }

	    /**
	     * Adds function properties of a source object to the destination object.
	     * If `object` is a function methods will be added to its prototype as well.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {Function|Object} [object=lodash] object The destination object.
	     * @param {Object} source The object of functions to add.
	     * @param {Object} [options] The options object.
	     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
	     * @example
	     *
	     * function capitalize(string) {
	     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
	     * }
	     *
	     * _.mixin({ 'capitalize': capitalize });
	     * _.capitalize('fred');
	     * // => 'Fred'
	     *
	     * _('fred').capitalize().value();
	     * // => 'Fred'
	     *
	     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
	     * _('fred').capitalize();
	     * // => 'Fred'
	     */
	    function mixin(object, source, options) {
	      var chain = true,
	          methodNames = source && functions(source);

	      if (!source || (!options && !methodNames.length)) {
	        if (options == null) {
	          options = source;
	        }
	        ctor = lodashWrapper;
	        source = object;
	        object = lodash;
	        methodNames = functions(source);
	      }
	      if (options === false) {
	        chain = false;
	      } else if (isObject(options) && 'chain' in options) {
	        chain = options.chain;
	      }
	      var ctor = object,
	          isFunc = isFunction(ctor);

	      forEach(methodNames, function(methodName) {
	        var func = object[methodName] = source[methodName];
	        if (isFunc) {
	          ctor.prototype[methodName] = function() {
	            var chainAll = this.__chain__,
	                value = this.__wrapped__,
	                args = [value];

	            push.apply(args, arguments);
	            var result = func.apply(object, args);
	            if (chain || chainAll) {
	              if (value === result && isObject(result)) {
	                return this;
	              }
	              result = new ctor(result);
	              result.__chain__ = chainAll;
	            }
	            return result;
	          };
	        }
	      });
	    }

	    /**
	     * Reverts the '_' variable to its previous value and returns a reference to
	     * the `lodash` function.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @returns {Function} Returns the `lodash` function.
	     * @example
	     *
	     * var lodash = _.noConflict();
	     */
	    function noConflict() {
	      context._ = oldDash;
	      return this;
	    }

	    /**
	     * A no-operation function.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @example
	     *
	     * var object = { 'name': 'fred' };
	     * _.noop(object) === undefined;
	     * // => true
	     */
	    function noop() {
	      // no operation performed
	    }

	    /**
	     * Gets the number of milliseconds that have elapsed since the Unix epoch
	     * (1 January 1970 00:00:00 UTC).
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @example
	     *
	     * var stamp = _.now();
	     * _.defer(function() { console.log(_.now() - stamp); });
	     * // => logs the number of milliseconds it took for the deferred function to be called
	     */
	    var now = isNative(now = Date.now) && now || function() {
	      return new Date().getTime();
	    };

	    /**
	     * Converts the given value into an integer of the specified radix.
	     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
	     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
	     *
	     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
	     * implementations. See http://es5.github.io/#E.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {string} value The value to parse.
	     * @param {number} [radix] The radix used to interpret the value to parse.
	     * @returns {number} Returns the new integer value.
	     * @example
	     *
	     * _.parseInt('08');
	     * // => 8
	     */
	    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
	      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
	      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
	    };

	    /**
	     * Creates a "_.pluck" style function, which returns the `key` value of a
	     * given object.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {string} key The name of the property to retrieve.
	     * @returns {Function} Returns the new function.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'fred',   'age': 40 },
	     *   { 'name': 'barney', 'age': 36 }
	     * ];
	     *
	     * var getName = _.property('name');
	     *
	     * _.map(characters, getName);
	     * // => ['barney', 'fred']
	     *
	     * _.sortBy(characters, getName);
	     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
	     */
	    function property(key) {
	      return function(object) {
	        return object[key];
	      };
	    }

	    /**
	     * Produces a random number between `min` and `max` (inclusive). If only one
	     * argument is provided a number between `0` and the given number will be
	     * returned. If `floating` is truey or either `min` or `max` are floats a
	     * floating-point number will be returned instead of an integer.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {number} [min=0] The minimum possible value.
	     * @param {number} [max=1] The maximum possible value.
	     * @param {boolean} [floating=false] Specify returning a floating-point number.
	     * @returns {number} Returns a random number.
	     * @example
	     *
	     * _.random(0, 5);
	     * // => an integer between 0 and 5
	     *
	     * _.random(5);
	     * // => also an integer between 0 and 5
	     *
	     * _.random(5, true);
	     * // => a floating-point number between 0 and 5
	     *
	     * _.random(1.2, 5.2);
	     * // => a floating-point number between 1.2 and 5.2
	     */
	    function random(min, max, floating) {
	      var noMin = min == null,
	          noMax = max == null;

	      if (floating == null) {
	        if (typeof min == 'boolean' && noMax) {
	          floating = min;
	          min = 1;
	        }
	        else if (!noMax && typeof max == 'boolean') {
	          floating = max;
	          noMax = true;
	        }
	      }
	      if (noMin && noMax) {
	        max = 1;
	      }
	      min = +min || 0;
	      if (noMax) {
	        max = min;
	        min = 0;
	      } else {
	        max = +max || 0;
	      }
	      if (floating || min % 1 || max % 1) {
	        var rand = nativeRandom();
	        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
	      }
	      return baseRandom(min, max);
	    }

	    /**
	     * Resolves the value of property `key` on `object`. If `key` is a function
	     * it will be invoked with the `this` binding of `object` and its result returned,
	     * else the property value is returned. If `object` is falsey then `undefined`
	     * is returned.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {Object} object The object to inspect.
	     * @param {string} key The name of the property to resolve.
	     * @returns {*} Returns the resolved value.
	     * @example
	     *
	     * var object = {
	     *   'cheese': 'crumpets',
	     *   'stuff': function() {
	     *     return 'nonsense';
	     *   }
	     * };
	     *
	     * _.result(object, 'cheese');
	     * // => 'crumpets'
	     *
	     * _.result(object, 'stuff');
	     * // => 'nonsense'
	     */
	    function result(object, key) {
	      if (object) {
	        var value = object[key];
	        return isFunction(value) ? object[key]() : value;
	      }
	    }

	    /**
	     * A micro-templating method that handles arbitrary delimiters, preserves
	     * whitespace, and correctly escapes quotes within interpolated code.
	     *
	     * Note: In the development build, `_.template` utilizes sourceURLs for easier
	     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
	     *
	     * For more information on precompiling templates see:
	     * https://lodash.com/custom-builds
	     *
	     * For more information on Chrome extension sandboxes see:
	     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {string} text The template text.
	     * @param {Object} data The data object used to populate the text.
	     * @param {Object} [options] The options object.
	     * @param {RegExp} [options.escape] The "escape" delimiter.
	     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
	     * @param {Object} [options.imports] An object to import into the template as local variables.
	     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
	     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
	     * @param {string} [variable] The data object variable name.
	     * @returns {Function|string} Returns a compiled function when no `data` object
	     *  is given, else it returns the interpolated text.
	     * @example
	     *
	     * // using the "interpolate" delimiter to create a compiled template
	     * var compiled = _.template('hello <%= name %>');
	     * compiled({ 'name': 'fred' });
	     * // => 'hello fred'
	     *
	     * // using the "escape" delimiter to escape HTML in data property values
	     * _.template('<b><%- value %></b>', { 'value': '<script>' });
	     * // => '<b>&lt;script&gt;</b>'
	     *
	     * // using the "evaluate" delimiter to generate HTML
	     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
	     * _.template(list, { 'people': ['fred', 'barney'] });
	     * // => '<li>fred</li><li>barney</li>'
	     *
	     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
	     * _.template('hello ${ name }', { 'name': 'pebbles' });
	     * // => 'hello pebbles'
	     *
	     * // using the internal `print` function in "evaluate" delimiters
	     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
	     * // => 'hello barney!'
	     *
	     * // using a custom template delimiters
	     * _.templateSettings = {
	     *   'interpolate': /{{([\s\S]+?)}}/g
	     * };
	     *
	     * _.template('hello {{ name }}!', { 'name': 'mustache' });
	     * // => 'hello mustache!'
	     *
	     * // using the `imports` option to import jQuery
	     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
	     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
	     * // => '<li>fred</li><li>barney</li>'
	     *
	     * // using the `sourceURL` option to specify a custom sourceURL for the template
	     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
	     * compiled(data);
	     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
	     *
	     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
	     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
	     * compiled.source;
	     * // => function(data) {
	     *   var __t, __p = '', __e = _.escape;
	     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
	     *   return __p;
	     * }
	     *
	     * // using the `source` property to inline compiled templates for meaningful
	     * // line numbers in error messages and a stack trace
	     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
	     *   var JST = {\
	     *     "main": ' + _.template(mainText).source + '\
	     *   };\
	     * ');
	     */
	    function template(text, data, options) {
	      // based on John Resig's `tmpl` implementation
	      // http://ejohn.org/blog/javascript-micro-templating/
	      // and Laura Doktorova's doT.js
	      // https://github.com/olado/doT
	      var settings = lodash.templateSettings;
	      text = String(text || '');

	      // avoid missing dependencies when `iteratorTemplate` is not defined
	      options = defaults({}, options, settings);

	      var imports = defaults({}, options.imports, settings.imports),
	          importsKeys = keys(imports),
	          importsValues = values(imports);

	      var isEvaluating,
	          index = 0,
	          interpolate = options.interpolate || reNoMatch,
	          source = "__p += '";

	      // compile the regexp to match each delimiter
	      var reDelimiters = RegExp(
	        (options.escape || reNoMatch).source + '|' +
	        interpolate.source + '|' +
	        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
	        (options.evaluate || reNoMatch).source + '|$'
	      , 'g');

	      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
	        interpolateValue || (interpolateValue = esTemplateValue);

	        // escape characters that cannot be included in string literals
	        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

	        // replace delimiters with snippets
	        if (escapeValue) {
	          source += "' +\n__e(" + escapeValue + ") +\n'";
	        }
	        if (evaluateValue) {
	          isEvaluating = true;
	          source += "';\n" + evaluateValue + ";\n__p += '";
	        }
	        if (interpolateValue) {
	          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
	        }
	        index = offset + match.length;

	        // the JS engine embedded in Adobe products requires returning the `match`
	        // string in order to produce the correct `offset` value
	        return match;
	      });

	      source += "';\n";

	      // if `variable` is not specified, wrap a with-statement around the generated
	      // code to add the data object to the top of the scope chain
	      var variable = options.variable,
	          hasVariable = variable;

	      if (!hasVariable) {
	        variable = 'obj';
	        source = 'with (' + variable + ') {\n' + source + '\n}\n';
	      }
	      // cleanup code by stripping empty strings
	      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
	        .replace(reEmptyStringMiddle, '$1')
	        .replace(reEmptyStringTrailing, '$1;');

	      // frame code as the function body
	      source = 'function(' + variable + ') {\n' +
	        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
	        "var __t, __p = '', __e = _.escape" +
	        (isEvaluating
	          ? ', __j = Array.prototype.join;\n' +
	            "function print() { __p += __j.call(arguments, '') }\n"
	          : ';\n'
	        ) +
	        source +
	        'return __p\n}';

	      // Use a sourceURL for easier debugging.
	      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
	      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

	      try {
	        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
	      } catch(e) {
	        e.source = source;
	        throw e;
	      }
	      if (data) {
	        return result(data);
	      }
	      // provide the compiled function's source by its `toString` method, in
	      // supported environments, or the `source` property as a convenience for
	      // inlining compiled templates during the build process
	      result.source = source;
	      return result;
	    }

	    /**
	     * Executes the callback `n` times, returning an array of the results
	     * of each callback execution. The callback is bound to `thisArg` and invoked
	     * with one argument; (index).
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {number} n The number of times to execute the callback.
	     * @param {Function} callback The function called per iteration.
	     * @param {*} [thisArg] The `this` binding of `callback`.
	     * @returns {Array} Returns an array of the results of each `callback` execution.
	     * @example
	     *
	     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
	     * // => [3, 6, 4]
	     *
	     * _.times(3, function(n) { mage.castSpell(n); });
	     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
	     *
	     * _.times(3, function(n) { this.cast(n); }, mage);
	     * // => also calls `mage.castSpell(n)` three times
	     */
	    function times(n, callback, thisArg) {
	      n = (n = +n) > -1 ? n : 0;
	      var index = -1,
	          result = Array(n);

	      callback = baseCreateCallback(callback, thisArg, 1);
	      while (++index < n) {
	        result[index] = callback(index);
	      }
	      return result;
	    }

	    /**
	     * The inverse of `_.escape` this method converts the HTML entities
	     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
	     * corresponding characters.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {string} string The string to unescape.
	     * @returns {string} Returns the unescaped string.
	     * @example
	     *
	     * _.unescape('Fred, Barney &amp; Pebbles');
	     * // => 'Fred, Barney & Pebbles'
	     */
	    function unescape(string) {
	      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
	    }

	    /**
	     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
	     *
	     * @static
	     * @memberOf _
	     * @category Utilities
	     * @param {string} [prefix] The value to prefix the ID with.
	     * @returns {string} Returns the unique ID.
	     * @example
	     *
	     * _.uniqueId('contact_');
	     * // => 'contact_104'
	     *
	     * _.uniqueId();
	     * // => '105'
	     */
	    function uniqueId(prefix) {
	      var id = ++idCounter;
	      return String(prefix == null ? '' : prefix) + id;
	    }

	    /*--------------------------------------------------------------------------*/

	    /**
	     * Creates a `lodash` object that wraps the given value with explicit
	     * method chaining enabled.
	     *
	     * @static
	     * @memberOf _
	     * @category Chaining
	     * @param {*} value The value to wrap.
	     * @returns {Object} Returns the wrapper object.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney',  'age': 36 },
	     *   { 'name': 'fred',    'age': 40 },
	     *   { 'name': 'pebbles', 'age': 1 }
	     * ];
	     *
	     * var youngest = _.chain(characters)
	     *     .sortBy('age')
	     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
	     *     .first()
	     *     .value();
	     * // => 'pebbles is 1'
	     */
	    function chain(value) {
	      value = new lodashWrapper(value);
	      value.__chain__ = true;
	      return value;
	    }

	    /**
	     * Invokes `interceptor` with the `value` as the first argument and then
	     * returns `value`. The purpose of this method is to "tap into" a method
	     * chain in order to perform operations on intermediate results within
	     * the chain.
	     *
	     * @static
	     * @memberOf _
	     * @category Chaining
	     * @param {*} value The value to provide to `interceptor`.
	     * @param {Function} interceptor The function to invoke.
	     * @returns {*} Returns `value`.
	     * @example
	     *
	     * _([1, 2, 3, 4])
	     *  .tap(function(array) { array.pop(); })
	     *  .reverse()
	     *  .value();
	     * // => [3, 2, 1]
	     */
	    function tap(value, interceptor) {
	      interceptor(value);
	      return value;
	    }

	    /**
	     * Enables explicit method chaining on the wrapper object.
	     *
	     * @name chain
	     * @memberOf _
	     * @category Chaining
	     * @returns {*} Returns the wrapper object.
	     * @example
	     *
	     * var characters = [
	     *   { 'name': 'barney', 'age': 36 },
	     *   { 'name': 'fred',   'age': 40 }
	     * ];
	     *
	     * // without explicit chaining
	     * _(characters).first();
	     * // => { 'name': 'barney', 'age': 36 }
	     *
	     * // with explicit chaining
	     * _(characters).chain()
	     *   .first()
	     *   .pick('age')
	     *   .value();
	     * // => { 'age': 36 }
	     */
	    function wrapperChain() {
	      this.__chain__ = true;
	      return this;
	    }

	    /**
	     * Produces the `toString` result of the wrapped value.
	     *
	     * @name toString
	     * @memberOf _
	     * @category Chaining
	     * @returns {string} Returns the string result.
	     * @example
	     *
	     * _([1, 2, 3]).toString();
	     * // => '1,2,3'
	     */
	    function wrapperToString() {
	      return String(this.__wrapped__);
	    }

	    /**
	     * Extracts the wrapped value.
	     *
	     * @name valueOf
	     * @memberOf _
	     * @alias value
	     * @category Chaining
	     * @returns {*} Returns the wrapped value.
	     * @example
	     *
	     * _([1, 2, 3]).valueOf();
	     * // => [1, 2, 3]
	     */
	    function wrapperValueOf() {
	      return this.__wrapped__;
	    }

	    /*--------------------------------------------------------------------------*/

	    // add functions that return wrapped values when chaining
	    lodash.after = after;
	    lodash.assign = assign;
	    lodash.at = at;
	    lodash.bind = bind;
	    lodash.bindAll = bindAll;
	    lodash.bindKey = bindKey;
	    lodash.chain = chain;
	    lodash.compact = compact;
	    lodash.compose = compose;
	    lodash.constant = constant;
	    lodash.countBy = countBy;
	    lodash.create = create;
	    lodash.createCallback = createCallback;
	    lodash.curry = curry;
	    lodash.debounce = debounce;
	    lodash.defaults = defaults;
	    lodash.defer = defer;
	    lodash.delay = delay;
	    lodash.difference = difference;
	    lodash.filter = filter;
	    lodash.flatten = flatten;
	    lodash.forEach = forEach;
	    lodash.forEachRight = forEachRight;
	    lodash.forIn = forIn;
	    lodash.forInRight = forInRight;
	    lodash.forOwn = forOwn;
	    lodash.forOwnRight = forOwnRight;
	    lodash.functions = functions;
	    lodash.groupBy = groupBy;
	    lodash.indexBy = indexBy;
	    lodash.initial = initial;
	    lodash.intersection = intersection;
	    lodash.invert = invert;
	    lodash.invoke = invoke;
	    lodash.keys = keys;
	    lodash.map = map;
	    lodash.mapValues = mapValues;
	    lodash.max = max;
	    lodash.memoize = memoize;
	    lodash.merge = merge;
	    lodash.min = min;
	    lodash.omit = omit;
	    lodash.once = once;
	    lodash.pairs = pairs;
	    lodash.partial = partial;
	    lodash.partialRight = partialRight;
	    lodash.pick = pick;
	    lodash.pluck = pluck;
	    lodash.property = property;
	    lodash.pull = pull;
	    lodash.range = range;
	    lodash.reject = reject;
	    lodash.remove = remove;
	    lodash.rest = rest;
	    lodash.shuffle = shuffle;
	    lodash.sortBy = sortBy;
	    lodash.tap = tap;
	    lodash.throttle = throttle;
	    lodash.times = times;
	    lodash.toArray = toArray;
	    lodash.transform = transform;
	    lodash.union = union;
	    lodash.uniq = uniq;
	    lodash.values = values;
	    lodash.where = where;
	    lodash.without = without;
	    lodash.wrap = wrap;
	    lodash.xor = xor;
	    lodash.zip = zip;
	    lodash.zipObject = zipObject;

	    // add aliases
	    lodash.collect = map;
	    lodash.drop = rest;
	    lodash.each = forEach;
	    lodash.eachRight = forEachRight;
	    lodash.extend = assign;
	    lodash.methods = functions;
	    lodash.object = zipObject;
	    lodash.select = filter;
	    lodash.tail = rest;
	    lodash.unique = uniq;
	    lodash.unzip = zip;

	    // add functions to `lodash.prototype`
	    mixin(lodash);

	    /*--------------------------------------------------------------------------*/

	    // add functions that return unwrapped values when chaining
	    lodash.clone = clone;
	    lodash.cloneDeep = cloneDeep;
	    lodash.contains = contains;
	    lodash.escape = escape;
	    lodash.every = every;
	    lodash.find = find;
	    lodash.findIndex = findIndex;
	    lodash.findKey = findKey;
	    lodash.findLast = findLast;
	    lodash.findLastIndex = findLastIndex;
	    lodash.findLastKey = findLastKey;
	    lodash.has = has;
	    lodash.identity = identity;
	    lodash.indexOf = indexOf;
	    lodash.isArguments = isArguments;
	    lodash.isArray = isArray;
	    lodash.isBoolean = isBoolean;
	    lodash.isDate = isDate;
	    lodash.isElement = isElement;
	    lodash.isEmpty = isEmpty;
	    lodash.isEqual = isEqual;
	    lodash.isFinite = isFinite;
	    lodash.isFunction = isFunction;
	    lodash.isNaN = isNaN;
	    lodash.isNull = isNull;
	    lodash.isNumber = isNumber;
	    lodash.isObject = isObject;
	    lodash.isPlainObject = isPlainObject;
	    lodash.isRegExp = isRegExp;
	    lodash.isString = isString;
	    lodash.isUndefined = isUndefined;
	    lodash.lastIndexOf = lastIndexOf;
	    lodash.mixin = mixin;
	    lodash.noConflict = noConflict;
	    lodash.noop = noop;
	    lodash.now = now;
	    lodash.parseInt = parseInt;
	    lodash.random = random;
	    lodash.reduce = reduce;
	    lodash.reduceRight = reduceRight;
	    lodash.result = result;
	    lodash.runInContext = runInContext;
	    lodash.size = size;
	    lodash.some = some;
	    lodash.sortedIndex = sortedIndex;
	    lodash.template = template;
	    lodash.unescape = unescape;
	    lodash.uniqueId = uniqueId;

	    // add aliases
	    lodash.all = every;
	    lodash.any = some;
	    lodash.detect = find;
	    lodash.findWhere = find;
	    lodash.foldl = reduce;
	    lodash.foldr = reduceRight;
	    lodash.include = contains;
	    lodash.inject = reduce;

	    mixin(function() {
	      var source = {}
	      forOwn(lodash, function(func, methodName) {
	        if (!lodash.prototype[methodName]) {
	          source[methodName] = func;
	        }
	      });
	      return source;
	    }(), false);

	    /*--------------------------------------------------------------------------*/

	    // add functions capable of returning wrapped and unwrapped values when chaining
	    lodash.first = first;
	    lodash.last = last;
	    lodash.sample = sample;

	    // add aliases
	    lodash.take = first;
	    lodash.head = first;

	    forOwn(lodash, function(func, methodName) {
	      var callbackable = methodName !== 'sample';
	      if (!lodash.prototype[methodName]) {
	        lodash.prototype[methodName]= function(n, guard) {
	          var chainAll = this.__chain__,
	              result = func(this.__wrapped__, n, guard);

	          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
	            ? result
	            : new lodashWrapper(result, chainAll);
	        };
	      }
	    });

	    /*--------------------------------------------------------------------------*/

	    /**
	     * The semantic version number.
	     *
	     * @static
	     * @memberOf _
	     * @type string
	     */
	    lodash.VERSION = '2.4.2';

	    // add "Chaining" functions to the wrapper
	    lodash.prototype.chain = wrapperChain;
	    lodash.prototype.toString = wrapperToString;
	    lodash.prototype.value = wrapperValueOf;
	    lodash.prototype.valueOf = wrapperValueOf;

	    // add `Array` functions that return unwrapped values
	    baseEach(['join', 'pop', 'shift'], function(methodName) {
	      var func = arrayRef[methodName];
	      lodash.prototype[methodName] = function() {
	        var chainAll = this.__chain__,
	            result = func.apply(this.__wrapped__, arguments);

	        return chainAll
	          ? new lodashWrapper(result, chainAll)
	          : result;
	      };
	    });

	    // add `Array` functions that return the existing wrapped value
	    baseEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
	      var func = arrayRef[methodName];
	      lodash.prototype[methodName] = function() {
	        func.apply(this.__wrapped__, arguments);
	        return this;
	      };
	    });

	    // add `Array` functions that return new wrapped values
	    baseEach(['concat', 'slice', 'splice'], function(methodName) {
	      var func = arrayRef[methodName];
	      lodash.prototype[methodName] = function() {
	        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
	      };
	    });

	    // avoid array-like object bugs with `Array#shift` and `Array#splice`
	    // in IE < 9, Firefox < 10, Narwhal, and RingoJS
	    if (!support.spliceObjects) {
	      baseEach(['pop', 'shift', 'splice'], function(methodName) {
	        var func = arrayRef[methodName],
	            isSplice = methodName == 'splice';

	        lodash.prototype[methodName] = function() {
	          var chainAll = this.__chain__,
	              value = this.__wrapped__,
	              result = func.apply(value, arguments);

	          if (value.length === 0) {
	            delete value[0];
	          }
	          return (chainAll || isSplice)
	            ? new lodashWrapper(result, chainAll)
	            : result;
	        };
	      });
	    }

	    return lodash;
	  }

	  /*--------------------------------------------------------------------------*/

	  // expose Lo-Dash
	  var _ = runInContext();

	  // some AMD build optimizers like r.js check for condition patterns like the following:
	  if (true) {
	    // Expose Lo-Dash to the global object even when an AMD loader is present in
	    // case Lo-Dash is loaded with a RequireJS shim config.
	    // See http://requirejs.org/docs/api.html#config-shim
	    root._ = _;

	    // define as an anonymous module so, through path mapping, it can be
	    // referenced as the "underscore" module
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return _;
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  }
	  // check for `exports` after `define` in case a build optimizer adds an `exports` object
	  else if (freeExports && freeModule) {
	    // in Node.js or RingoJS
	    if (moduleExports) {
	      (freeModule.exports = _)._ = _;
	    }
	    // in Narwhal or Rhino -require
	    else {
	      freeExports._ = _;
	    }
	  }
	  else {
	    // in a browser or Rhino
	    root._ = _;
	  }
	}.call(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module), (function() { return this; }())))

/***/ }
/******/ ]);
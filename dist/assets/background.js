import { O as processDBOperations, g as getData, P as cfg, e as roundTo, Q as getLatestAndPreviousByTriplet, b as getLatestEntriesPerUser, R as saveData, S as gcDistance, T as courseAngle, U as angle, V as toRad, W as toDeg, X as calculateCOGLoxo, F as guessOptionBits, E as isBitSet, s as sailNames, p as getxFactorStyle, Y as twaBackGround, f as formatHM, t as getBG, h as formatTimeNotif, j as infoSail, n as formatPosition, k as getUserPrefs, N as createKeyChangeListener } from "./common-1c8f3165.js";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function Cache(maxSize) {
  this._maxSize = maxSize;
  this.clear();
}
Cache.prototype.clear = function() {
  this._size = 0;
  this._values = /* @__PURE__ */ Object.create(null);
};
Cache.prototype.get = function(key) {
  return this._values[key];
};
Cache.prototype.set = function(key, value) {
  this._size >= this._maxSize && this.clear();
  if (!(key in this._values))
    this._size++;
  return this._values[key] = value;
};
var SPLIT_REGEX = /[^.^\]^[]+|(?=\[\]|\.\.)/g, DIGIT_REGEX = /^\d+$/, LEAD_DIGIT_REGEX = /^\d/, SPEC_CHAR_REGEX = /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g, CLEAN_QUOTES_REGEX = /^\s*(['"]?)(.*?)(\1)\s*$/, MAX_CACHE_SIZE = 512;
var pathCache = new Cache(MAX_CACHE_SIZE), setCache = new Cache(MAX_CACHE_SIZE), getCache = new Cache(MAX_CACHE_SIZE);
var propertyExpr = {
  Cache,
  split,
  normalizePath,
  setter: function(path) {
    var parts = normalizePath(path);
    return setCache.get(path) || setCache.set(path, function setter(obj, value) {
      var index = 0;
      var len = parts.length;
      var data = obj;
      while (index < len - 1) {
        var part = parts[index];
        if (part === "__proto__" || part === "constructor" || part === "prototype") {
          return obj;
        }
        data = data[parts[index++]];
      }
      data[parts[index]] = value;
    });
  },
  getter: function(path, safe) {
    var parts = normalizePath(path);
    return getCache.get(path) || getCache.set(path, function getter(data) {
      var index = 0, len = parts.length;
      while (index < len) {
        if (data != null || !safe)
          data = data[parts[index++]];
        else
          return;
      }
      return data;
    });
  },
  join: function(segments) {
    return segments.reduce(function(path, part) {
      return path + (isQuoted(part) || DIGIT_REGEX.test(part) ? "[" + part + "]" : (path ? "." : "") + part);
    }, "");
  },
  forEach: function(path, cb, thisArg) {
    forEach(Array.isArray(path) ? path : split(path), cb, thisArg);
  }
};
function normalizePath(path) {
  return pathCache.get(path) || pathCache.set(
    path,
    split(path).map(function(part) {
      return part.replace(CLEAN_QUOTES_REGEX, "$2");
    })
  );
}
function split(path) {
  return path.match(SPLIT_REGEX) || [""];
}
function forEach(parts, iter, thisArg) {
  var len = parts.length, part, idx, isArray, isBracket;
  for (idx = 0; idx < len; idx++) {
    part = parts[idx];
    if (part) {
      if (shouldBeQuoted(part)) {
        part = '"' + part + '"';
      }
      isBracket = isQuoted(part);
      isArray = !isBracket && /^\d+$/.test(part);
      iter.call(thisArg, part, isBracket, isArray, idx, parts);
    }
  }
}
function isQuoted(str) {
  return typeof str === "string" && str && ["'", '"'].indexOf(str.charAt(0)) !== -1;
}
function hasLeadingNumber(part) {
  return part.match(LEAD_DIGIT_REGEX) && !part.match(DIGIT_REGEX);
}
function hasSpecialChars(part) {
  return SPEC_CHAR_REGEX.test(part);
}
function shouldBeQuoted(part) {
  return !isQuoted(part) && (hasLeadingNumber(part) || hasSpecialChars(part));
}
const reWords = /[A-Z\xc0-\xd6\xd8-\xde]?[a-z\xdf-\xf6\xf8-\xff]+(?:['’](?:d|ll|m|re|s|t|ve))?(?=[\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000]|[A-Z\xc0-\xd6\xd8-\xde]|$)|(?:[A-Z\xc0-\xd6\xd8-\xde]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])+(?:['’](?:D|LL|M|RE|S|T|VE))?(?=[\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000]|[A-Z\xc0-\xd6\xd8-\xde](?:[a-z\xdf-\xf6\xf8-\xff]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])|$)|[A-Z\xc0-\xd6\xd8-\xde]?(?:[a-z\xdf-\xf6\xf8-\xff]|[^\ud800-\udfff\xac\xb1\xd7\xf7\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\u2000-\u206f \t\x0b\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\d+\u2700-\u27bfa-z\xdf-\xf6\xf8-\xffA-Z\xc0-\xd6\xd8-\xde])+(?:['’](?:d|ll|m|re|s|t|ve))?|[A-Z\xc0-\xd6\xd8-\xde]+(?:['’](?:D|LL|M|RE|S|T|VE))?|\d*(?:1ST|2ND|3RD|(?![123])\dTH)(?=\b|[a-z_])|\d*(?:1st|2nd|3rd|(?![123])\dth)(?=\b|[A-Z_])|\d+|(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff]|\ud83c[\udffb-\udfff])?)*/g;
const words = (str) => str.match(reWords) || [];
const upperFirst = (str) => str[0].toUpperCase() + str.slice(1);
const join = (str, d) => words(str).join(d).toLowerCase();
const camelCase = (str) => words(str).reduce(
  (acc, next) => `${acc}${!acc ? next.toLowerCase() : next[0].toUpperCase() + next.slice(1).toLowerCase()}`,
  ""
);
const pascalCase = (str) => upperFirst(camelCase(str));
const snakeCase = (str) => join(str, "_");
const kebabCase = (str) => join(str, "-");
const sentenceCase = (str) => upperFirst(join(str, " "));
const titleCase = (str) => words(str).map(upperFirst).join(" ");
var tinyCase = {
  words,
  upperFirst,
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  sentenceCase,
  titleCase
};
var toposort$2 = { exports: {} };
toposort$2.exports = function(edges) {
  return toposort(uniqueNodes(edges), edges);
};
toposort$2.exports.array = toposort;
function toposort(nodes, edges) {
  var cursor = nodes.length, sorted = new Array(cursor), visited = {}, i = cursor, outgoingEdges = makeOutgoingEdges(edges), nodesHash = makeNodesHash(nodes);
  edges.forEach(function(edge) {
    if (!nodesHash.has(edge[0]) || !nodesHash.has(edge[1])) {
      throw new Error("Unknown node. There is an unknown node in the supplied edges.");
    }
  });
  while (i--) {
    if (!visited[i])
      visit(nodes[i], i, /* @__PURE__ */ new Set());
  }
  return sorted;
  function visit(node, i2, predecessors) {
    if (predecessors.has(node)) {
      var nodeRep;
      try {
        nodeRep = ", node was:" + JSON.stringify(node);
      } catch (e) {
        nodeRep = "";
      }
      throw new Error("Cyclic dependency" + nodeRep);
    }
    if (!nodesHash.has(node)) {
      throw new Error("Found unknown node. Make sure to provided all involved nodes. Unknown node: " + JSON.stringify(node));
    }
    if (visited[i2])
      return;
    visited[i2] = true;
    var outgoing = outgoingEdges.get(node) || /* @__PURE__ */ new Set();
    outgoing = Array.from(outgoing);
    if (i2 = outgoing.length) {
      predecessors.add(node);
      do {
        var child = outgoing[--i2];
        visit(child, nodesHash.get(child), predecessors);
      } while (i2);
      predecessors.delete(node);
    }
    sorted[--cursor] = node;
  }
}
function uniqueNodes(arr) {
  var res = /* @__PURE__ */ new Set();
  for (var i = 0, len = arr.length; i < len; i++) {
    var edge = arr[i];
    res.add(edge[0]);
    res.add(edge[1]);
  }
  return Array.from(res);
}
function makeOutgoingEdges(arr) {
  var edges = /* @__PURE__ */ new Map();
  for (var i = 0, len = arr.length; i < len; i++) {
    var edge = arr[i];
    if (!edges.has(edge[0]))
      edges.set(edge[0], /* @__PURE__ */ new Set());
    if (!edges.has(edge[1]))
      edges.set(edge[1], /* @__PURE__ */ new Set());
    edges.get(edge[0]).add(edge[1]);
  }
  return edges;
}
function makeNodesHash(arr) {
  var res = /* @__PURE__ */ new Map();
  for (var i = 0, len = arr.length; i < len; i++) {
    res.set(arr[i], i);
  }
  return res;
}
var toposortExports = toposort$2.exports;
const toposort$1 = /* @__PURE__ */ getDefaultExportFromCjs(toposortExports);
const toString = Object.prototype.toString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
const symbolToString = typeof Symbol !== "undefined" ? Symbol.prototype.toString : () => "";
const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
function printNumber(val) {
  if (val != +val)
    return "NaN";
  const isNegativeZero = val === 0 && 1 / val < 0;
  return isNegativeZero ? "-0" : "" + val;
}
function printSimpleValue(val, quoteStrings = false) {
  if (val == null || val === true || val === false)
    return "" + val;
  const typeOf = typeof val;
  if (typeOf === "number")
    return printNumber(val);
  if (typeOf === "string")
    return quoteStrings ? `"${val}"` : val;
  if (typeOf === "function")
    return "[Function " + (val.name || "anonymous") + "]";
  if (typeOf === "symbol")
    return symbolToString.call(val).replace(SYMBOL_REGEXP, "Symbol($1)");
  const tag = toString.call(val).slice(8, -1);
  if (tag === "Date")
    return isNaN(val.getTime()) ? "" + val : val.toISOString(val);
  if (tag === "Error" || val instanceof Error)
    return "[" + errorToString.call(val) + "]";
  if (tag === "RegExp")
    return regExpToString.call(val);
  return null;
}
function printValue(value, quoteStrings) {
  let result = printSimpleValue(value, quoteStrings);
  if (result !== null)
    return result;
  return JSON.stringify(value, function(key, value2) {
    let result2 = printSimpleValue(this[key], quoteStrings);
    if (result2 !== null)
      return result2;
    return value2;
  }, 2);
}
function toArray(value) {
  return value == null ? [] : [].concat(value);
}
let _Symbol$toStringTag, _Symbol$hasInstance, _Symbol$toStringTag2;
let strReg = /\$\{\s*(\w+)\s*\}/g;
_Symbol$toStringTag = Symbol.toStringTag;
class ValidationErrorNoStack {
  constructor(errorOrErrors, value, field, type) {
    this.name = void 0;
    this.message = void 0;
    this.value = void 0;
    this.path = void 0;
    this.type = void 0;
    this.params = void 0;
    this.errors = void 0;
    this.inner = void 0;
    this[_Symbol$toStringTag] = "Error";
    this.name = "ValidationError";
    this.value = value;
    this.path = field;
    this.type = type;
    this.errors = [];
    this.inner = [];
    toArray(errorOrErrors).forEach((err) => {
      if (ValidationError.isError(err)) {
        this.errors.push(...err.errors);
        const innerErrors = err.inner.length ? err.inner : [err];
        this.inner.push(...innerErrors);
      } else {
        this.errors.push(err);
      }
    });
    this.message = this.errors.length > 1 ? `${this.errors.length} errors occurred` : this.errors[0];
  }
}
_Symbol$hasInstance = Symbol.hasInstance;
_Symbol$toStringTag2 = Symbol.toStringTag;
class ValidationError extends Error {
  static formatError(message, params) {
    const path = params.label || params.path || "this";
    params = Object.assign({}, params, {
      path,
      originalPath: params.path
    });
    if (typeof message === "string")
      return message.replace(strReg, (_, key) => printValue(params[key]));
    if (typeof message === "function")
      return message(params);
    return message;
  }
  static isError(err) {
    return err && err.name === "ValidationError";
  }
  constructor(errorOrErrors, value, field, type, disableStack) {
    const errorNoStack = new ValidationErrorNoStack(errorOrErrors, value, field, type);
    if (disableStack) {
      return errorNoStack;
    }
    super();
    this.value = void 0;
    this.path = void 0;
    this.type = void 0;
    this.params = void 0;
    this.errors = [];
    this.inner = [];
    this[_Symbol$toStringTag2] = "Error";
    this.name = errorNoStack.name;
    this.message = errorNoStack.message;
    this.type = errorNoStack.type;
    this.value = errorNoStack.value;
    this.path = errorNoStack.path;
    this.errors = errorNoStack.errors;
    this.inner = errorNoStack.inner;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
  static [_Symbol$hasInstance](inst) {
    return ValidationErrorNoStack[Symbol.hasInstance](inst) || super[Symbol.hasInstance](inst);
  }
}
let mixed = {
  default: "${path} is invalid",
  required: "${path} is a required field",
  defined: "${path} must be defined",
  notNull: "${path} cannot be null",
  oneOf: "${path} must be one of the following values: ${values}",
  notOneOf: "${path} must not be one of the following values: ${values}",
  notType: ({
    path,
    type,
    value,
    originalValue
  }) => {
    const castMsg = originalValue != null && originalValue !== value ? ` (cast from the value \`${printValue(originalValue, true)}\`).` : ".";
    return type !== "mixed" ? `${path} must be a \`${type}\` type, but the final value was: \`${printValue(value, true)}\`` + castMsg : `${path} must match the configured type. The validated value was: \`${printValue(value, true)}\`` + castMsg;
  }
};
let string = {
  length: "${path} must be exactly ${length} characters",
  min: "${path} must be at least ${min} characters",
  max: "${path} must be at most ${max} characters",
  matches: '${path} must match the following: "${regex}"',
  email: "${path} must be a valid email",
  url: "${path} must be a valid URL",
  uuid: "${path} must be a valid UUID",
  datetime: "${path} must be a valid ISO date-time",
  datetime_precision: "${path} must be a valid ISO date-time with a sub-second precision of exactly ${precision} digits",
  datetime_offset: '${path} must be a valid ISO date-time with UTC "Z" timezone',
  trim: "${path} must be a trimmed string",
  lowercase: "${path} must be a lowercase string",
  uppercase: "${path} must be a upper case string"
};
let number = {
  min: "${path} must be greater than or equal to ${min}",
  max: "${path} must be less than or equal to ${max}",
  lessThan: "${path} must be less than ${less}",
  moreThan: "${path} must be greater than ${more}",
  positive: "${path} must be a positive number",
  negative: "${path} must be a negative number",
  integer: "${path} must be an integer"
};
let date = {
  min: "${path} field must be later than ${min}",
  max: "${path} field must be at earlier than ${max}"
};
let boolean = {
  isValue: "${path} field must be ${value}"
};
let object = {
  noUnknown: "${path} field has unspecified keys: ${unknown}",
  exact: "${path} object contains unknown properties: ${properties}"
};
let array = {
  min: "${path} field must have at least ${min} items",
  max: "${path} field must have less than or equal to ${max} items",
  length: "${path} must have ${length} items"
};
let tuple = {
  notType: (params) => {
    const {
      path,
      value,
      spec
    } = params;
    const typeLen = spec.types.length;
    if (Array.isArray(value)) {
      if (value.length < typeLen)
        return `${path} tuple value has too few items, expected a length of ${typeLen} but got ${value.length} for value: \`${printValue(value, true)}\``;
      if (value.length > typeLen)
        return `${path} tuple value has too many items, expected a length of ${typeLen} but got ${value.length} for value: \`${printValue(value, true)}\``;
    }
    return ValidationError.formatError(mixed.notType, params);
  }
};
Object.assign(/* @__PURE__ */ Object.create(null), {
  mixed,
  string,
  number,
  date,
  object,
  array,
  boolean,
  tuple
});
const isSchema = (obj) => obj && obj.__isYupSchema__;
class Condition {
  static fromOptions(refs, config) {
    if (!config.then && !config.otherwise)
      throw new TypeError("either `then:` or `otherwise:` is required for `when()` conditions");
    let {
      is,
      then,
      otherwise
    } = config;
    let check = typeof is === "function" ? is : (...values) => values.every((value) => value === is);
    return new Condition(refs, (values, schema) => {
      var _branch;
      let branch = check(...values) ? then : otherwise;
      return (_branch = branch == null ? void 0 : branch(schema)) != null ? _branch : schema;
    });
  }
  constructor(refs, builder) {
    this.fn = void 0;
    this.refs = refs;
    this.refs = refs;
    this.fn = builder;
  }
  resolve(base, options) {
    let values = this.refs.map((ref) => (
      // TODO: ? operator here?
      ref.getValue(options == null ? void 0 : options.value, options == null ? void 0 : options.parent, options == null ? void 0 : options.context)
    ));
    let schema = this.fn(values, base, options);
    if (schema === void 0 || // @ts-ignore this can be base
    schema === base) {
      return base;
    }
    if (!isSchema(schema))
      throw new TypeError("conditions must return a schema object");
    return schema.resolve(options);
  }
}
const prefixes = {
  context: "$",
  value: "."
};
class Reference {
  constructor(key, options = {}) {
    this.key = void 0;
    this.isContext = void 0;
    this.isValue = void 0;
    this.isSibling = void 0;
    this.path = void 0;
    this.getter = void 0;
    this.map = void 0;
    if (typeof key !== "string")
      throw new TypeError("ref must be a string, got: " + key);
    this.key = key.trim();
    if (key === "")
      throw new TypeError("ref must be a non-empty string");
    this.isContext = this.key[0] === prefixes.context;
    this.isValue = this.key[0] === prefixes.value;
    this.isSibling = !this.isContext && !this.isValue;
    let prefix = this.isContext ? prefixes.context : this.isValue ? prefixes.value : "";
    this.path = this.key.slice(prefix.length);
    this.getter = this.path && propertyExpr.getter(this.path, true);
    this.map = options.map;
  }
  getValue(value, parent, context) {
    let result = this.isContext ? context : this.isValue ? value : parent;
    if (this.getter)
      result = this.getter(result || {});
    if (this.map)
      result = this.map(result);
    return result;
  }
  /**
   *
   * @param {*} value
   * @param {Object} options
   * @param {Object=} options.context
   * @param {Object=} options.parent
   */
  cast(value, options) {
    return this.getValue(value, options == null ? void 0 : options.parent, options == null ? void 0 : options.context);
  }
  resolve() {
    return this;
  }
  describe() {
    return {
      type: "ref",
      key: this.key
    };
  }
  toString() {
    return `Ref(${this.key})`;
  }
  static isRef(value) {
    return value && value.__isYupRef;
  }
}
Reference.prototype.__isYupRef = true;
const isAbsent = (value) => value == null;
function createValidation(config) {
  function validate({
    value,
    path = "",
    options,
    originalValue,
    schema
  }, panic, next) {
    const {
      name,
      test,
      params,
      message,
      skipAbsent
    } = config;
    let {
      parent,
      context,
      abortEarly = schema.spec.abortEarly,
      disableStackTrace = schema.spec.disableStackTrace
    } = options;
    const resolveOptions = {
      value,
      parent,
      context
    };
    function createError(overrides = {}) {
      const nextParams = resolveParams(Object.assign({
        value,
        originalValue,
        label: schema.spec.label,
        path: overrides.path || path,
        spec: schema.spec,
        disableStackTrace: overrides.disableStackTrace || disableStackTrace
      }, params, overrides.params), resolveOptions);
      const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name, nextParams.disableStackTrace);
      error.params = nextParams;
      return error;
    }
    const invalid = abortEarly ? panic : next;
    let ctx = {
      path,
      parent,
      type: name,
      from: options.from,
      createError,
      resolve(item) {
        return resolveMaybeRef(item, resolveOptions);
      },
      options,
      originalValue,
      schema
    };
    const handleResult = (validOrError) => {
      if (ValidationError.isError(validOrError))
        invalid(validOrError);
      else if (!validOrError)
        invalid(createError());
      else
        next(null);
    };
    const handleError = (err) => {
      if (ValidationError.isError(err))
        invalid(err);
      else
        panic(err);
    };
    const shouldSkip = skipAbsent && isAbsent(value);
    if (shouldSkip) {
      return handleResult(true);
    }
    let result;
    try {
      var _result;
      result = test.call(ctx, value, ctx);
      if (typeof ((_result = result) == null ? void 0 : _result.then) === "function") {
        if (options.sync) {
          throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. This test will finish after the validate call has returned`);
        }
        return Promise.resolve(result).then(handleResult, handleError);
      }
    } catch (err) {
      handleError(err);
      return;
    }
    handleResult(result);
  }
  validate.OPTIONS = config;
  return validate;
}
function resolveParams(params, options) {
  if (!params)
    return params;
  for (const key of Object.keys(params)) {
    params[key] = resolveMaybeRef(params[key], options);
  }
  return params;
}
function resolveMaybeRef(item, options) {
  return Reference.isRef(item) ? item.getValue(options.value, options.parent, options.context) : item;
}
function getIn(schema, path, value, context = value) {
  let parent, lastPart, lastPartDebug;
  if (!path)
    return {
      parent,
      parentPath: path,
      schema
    };
  propertyExpr.forEach(path, (_part, isBracket, isArray) => {
    let part = isBracket ? _part.slice(1, _part.length - 1) : _part;
    schema = schema.resolve({
      context,
      parent,
      value
    });
    let isTuple = schema.type === "tuple";
    let idx = isArray ? parseInt(part, 10) : 0;
    if (schema.innerType || isTuple) {
      if (isTuple && !isArray)
        throw new Error(`Yup.reach cannot implicitly index into a tuple type. the path part "${lastPartDebug}" must contain an index to the tuple element, e.g. "${lastPartDebug}[0]"`);
      if (value && idx >= value.length) {
        throw new Error(`Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path}. because there is no value at that index. `);
      }
      parent = value;
      value = value && value[idx];
      schema = isTuple ? schema.spec.types[idx] : schema.innerType;
    }
    if (!isArray) {
      if (!schema.fields || !schema.fields[part])
        throw new Error(`The schema does not contain the path: ${path}. (failed at: ${lastPartDebug} which is a type: "${schema.type}")`);
      parent = value;
      value = value && value[part];
      schema = schema.fields[part];
    }
    lastPart = part;
    lastPartDebug = isBracket ? "[" + _part + "]" : "." + _part;
  });
  return {
    schema,
    parent,
    parentPath: lastPart
  };
}
class ReferenceSet extends Set {
  describe() {
    const description = [];
    for (const item of this.values()) {
      description.push(Reference.isRef(item) ? item.describe() : item);
    }
    return description;
  }
  resolveAll(resolve) {
    let result = [];
    for (const item of this.values()) {
      result.push(resolve(item));
    }
    return result;
  }
  clone() {
    return new ReferenceSet(this.values());
  }
  merge(newItems, removeItems) {
    const next = this.clone();
    newItems.forEach((value) => next.add(value));
    removeItems.forEach((value) => next.delete(value));
    return next;
  }
}
function clone(src, seen = /* @__PURE__ */ new Map()) {
  if (isSchema(src) || !src || typeof src !== "object")
    return src;
  if (seen.has(src))
    return seen.get(src);
  let copy;
  if (src instanceof Date) {
    copy = new Date(src.getTime());
    seen.set(src, copy);
  } else if (src instanceof RegExp) {
    copy = new RegExp(src);
    seen.set(src, copy);
  } else if (Array.isArray(src)) {
    copy = new Array(src.length);
    seen.set(src, copy);
    for (let i = 0; i < src.length; i++)
      copy[i] = clone(src[i], seen);
  } else if (src instanceof Map) {
    copy = /* @__PURE__ */ new Map();
    seen.set(src, copy);
    for (const [k, v] of src.entries())
      copy.set(k, clone(v, seen));
  } else if (src instanceof Set) {
    copy = /* @__PURE__ */ new Set();
    seen.set(src, copy);
    for (const v of src)
      copy.add(clone(v, seen));
  } else if (src instanceof Object) {
    copy = {};
    seen.set(src, copy);
    for (const [k, v] of Object.entries(src))
      copy[k] = clone(v, seen);
  } else {
    throw Error(`Unable to clone ${src}`);
  }
  return copy;
}
function createStandardPath(path) {
  if (!(path != null && path.length)) {
    return void 0;
  }
  const segments = [];
  let currentSegment = "";
  let inBrackets = false;
  let inQuotes = false;
  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    if (char === "[" && !inQuotes) {
      if (currentSegment) {
        segments.push(...currentSegment.split(".").filter(Boolean));
        currentSegment = "";
      }
      inBrackets = true;
      continue;
    }
    if (char === "]" && !inQuotes) {
      if (currentSegment) {
        if (/^\d+$/.test(currentSegment)) {
          segments.push(currentSegment);
        } else {
          segments.push(currentSegment.replace(/^"|"$/g, ""));
        }
        currentSegment = "";
      }
      inBrackets = false;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "." && !inBrackets && !inQuotes) {
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = "";
      }
      continue;
    }
    currentSegment += char;
  }
  if (currentSegment) {
    segments.push(...currentSegment.split(".").filter(Boolean));
  }
  return segments;
}
function createStandardIssues(error, parentPath) {
  const path = parentPath ? `${parentPath}.${error.path}` : error.path;
  return error.errors.map((err) => ({
    message: err,
    path: createStandardPath(path)
  }));
}
function issuesFromValidationError(error, parentPath) {
  var _error$inner;
  if (!((_error$inner = error.inner) != null && _error$inner.length) && error.errors.length) {
    return createStandardIssues(error, parentPath);
  }
  const path = parentPath ? `${parentPath}.${error.path}` : error.path;
  return error.inner.flatMap((err) => issuesFromValidationError(err, path));
}
class Schema {
  constructor(options) {
    this.type = void 0;
    this.deps = [];
    this.tests = void 0;
    this.transforms = void 0;
    this.conditions = [];
    this._mutate = void 0;
    this.internalTests = {};
    this._whitelist = new ReferenceSet();
    this._blacklist = new ReferenceSet();
    this.exclusiveTests = /* @__PURE__ */ Object.create(null);
    this._typeCheck = void 0;
    this.spec = void 0;
    this.tests = [];
    this.transforms = [];
    this.withMutation(() => {
      this.typeError(mixed.notType);
    });
    this.type = options.type;
    this._typeCheck = options.check;
    this.spec = Object.assign({
      strip: false,
      strict: false,
      abortEarly: true,
      recursive: true,
      disableStackTrace: false,
      nullable: false,
      optional: true,
      coerce: true
    }, options == null ? void 0 : options.spec);
    this.withMutation((s) => {
      s.nonNullable();
    });
  }
  // TODO: remove
  get _type() {
    return this.type;
  }
  clone(spec) {
    if (this._mutate) {
      if (spec)
        Object.assign(this.spec, spec);
      return this;
    }
    const next = Object.create(Object.getPrototypeOf(this));
    next.type = this.type;
    next._typeCheck = this._typeCheck;
    next._whitelist = this._whitelist.clone();
    next._blacklist = this._blacklist.clone();
    next.internalTests = Object.assign({}, this.internalTests);
    next.exclusiveTests = Object.assign({}, this.exclusiveTests);
    next.deps = [...this.deps];
    next.conditions = [...this.conditions];
    next.tests = [...this.tests];
    next.transforms = [...this.transforms];
    next.spec = clone(Object.assign({}, this.spec, spec));
    return next;
  }
  label(label) {
    let next = this.clone();
    next.spec.label = label;
    return next;
  }
  meta(...args) {
    if (args.length === 0)
      return this.spec.meta;
    let next = this.clone();
    next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
    return next;
  }
  withMutation(fn) {
    let before = this._mutate;
    this._mutate = true;
    let result = fn(this);
    this._mutate = before;
    return result;
  }
  concat(schema) {
    if (!schema || schema === this)
      return this;
    if (schema.type !== this.type && this.type !== "mixed")
      throw new TypeError(`You cannot \`concat()\` schema's of different types: ${this.type} and ${schema.type}`);
    let base = this;
    let combined = schema.clone();
    const mergedSpec = Object.assign({}, base.spec, combined.spec);
    combined.spec = mergedSpec;
    combined.internalTests = Object.assign({}, base.internalTests, combined.internalTests);
    combined._whitelist = base._whitelist.merge(schema._whitelist, schema._blacklist);
    combined._blacklist = base._blacklist.merge(schema._blacklist, schema._whitelist);
    combined.tests = base.tests;
    combined.exclusiveTests = base.exclusiveTests;
    combined.withMutation((next) => {
      schema.tests.forEach((fn) => {
        next.test(fn.OPTIONS);
      });
    });
    combined.transforms = [...base.transforms, ...combined.transforms];
    return combined;
  }
  isType(v) {
    if (v == null) {
      if (this.spec.nullable && v === null)
        return true;
      if (this.spec.optional && v === void 0)
        return true;
      return false;
    }
    return this._typeCheck(v);
  }
  resolve(options) {
    let schema = this;
    if (schema.conditions.length) {
      let conditions = schema.conditions;
      schema = schema.clone();
      schema.conditions = [];
      schema = conditions.reduce((prevSchema, condition) => condition.resolve(prevSchema, options), schema);
      schema = schema.resolve(options);
    }
    return schema;
  }
  resolveOptions(options) {
    var _options$strict, _options$abortEarly, _options$recursive, _options$disableStack;
    return Object.assign({}, options, {
      from: options.from || [],
      strict: (_options$strict = options.strict) != null ? _options$strict : this.spec.strict,
      abortEarly: (_options$abortEarly = options.abortEarly) != null ? _options$abortEarly : this.spec.abortEarly,
      recursive: (_options$recursive = options.recursive) != null ? _options$recursive : this.spec.recursive,
      disableStackTrace: (_options$disableStack = options.disableStackTrace) != null ? _options$disableStack : this.spec.disableStackTrace
    });
  }
  /**
   * Run the configured transform pipeline over an input value.
   */
  cast(value, options = {}) {
    let resolvedSchema = this.resolve(Object.assign({
      value
    }, options));
    let allowOptionality = options.assert === "ignore-optionality";
    let result = resolvedSchema._cast(value, options);
    if (options.assert !== false && !resolvedSchema.isType(result)) {
      if (allowOptionality && isAbsent(result)) {
        return result;
      }
      let formattedValue = printValue(value);
      let formattedResult = printValue(result);
      throw new TypeError(`The value of ${options.path || "field"} could not be cast to a value that satisfies the schema type: "${resolvedSchema.type}". 

attempted value: ${formattedValue} 
` + (formattedResult !== formattedValue ? `result of cast: ${formattedResult}` : ""));
    }
    return result;
  }
  _cast(rawValue, options) {
    let value = rawValue === void 0 ? rawValue : this.transforms.reduce((prevValue, fn) => fn.call(this, prevValue, rawValue, this), rawValue);
    if (value === void 0) {
      value = this.getDefault(options);
    }
    return value;
  }
  _validate(_value, options = {}, panic, next) {
    let {
      path,
      originalValue = _value,
      strict = this.spec.strict
    } = options;
    let value = _value;
    if (!strict) {
      value = this._cast(value, Object.assign({
        assert: false
      }, options));
    }
    let initialTests = [];
    for (let test of Object.values(this.internalTests)) {
      if (test)
        initialTests.push(test);
    }
    this.runTests({
      path,
      value,
      originalValue,
      options,
      tests: initialTests
    }, panic, (initialErrors) => {
      if (initialErrors.length) {
        return next(initialErrors, value);
      }
      this.runTests({
        path,
        value,
        originalValue,
        options,
        tests: this.tests
      }, panic, next);
    });
  }
  /**
   * Executes a set of validations, either schema, produced Tests or a nested
   * schema validate result.
   */
  runTests(runOptions, panic, next) {
    let fired = false;
    let {
      tests,
      value,
      originalValue,
      path,
      options
    } = runOptions;
    let panicOnce = (arg) => {
      if (fired)
        return;
      fired = true;
      panic(arg, value);
    };
    let nextOnce = (arg) => {
      if (fired)
        return;
      fired = true;
      next(arg, value);
    };
    let count = tests.length;
    let nestedErrors = [];
    if (!count)
      return nextOnce([]);
    let args = {
      value,
      originalValue,
      path,
      options,
      schema: this
    };
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      test(args, panicOnce, function finishTestRun(err) {
        if (err) {
          Array.isArray(err) ? nestedErrors.push(...err) : nestedErrors.push(err);
        }
        if (--count <= 0) {
          nextOnce(nestedErrors);
        }
      });
    }
  }
  asNestedTest({
    key,
    index,
    parent,
    parentPath,
    originalParent,
    options
  }) {
    const k = key != null ? key : index;
    if (k == null) {
      throw TypeError("Must include `key` or `index` for nested validations");
    }
    const isIndex = typeof k === "number";
    let value = parent[k];
    const testOptions = Object.assign({}, options, {
      // Nested validations fields are always strict:
      //    1. parent isn't strict so the casting will also have cast inner values
      //    2. parent is strict in which case the nested values weren't cast either
      strict: true,
      parent,
      value,
      originalValue: originalParent[k],
      // FIXME: tests depend on `index` being passed around deeply,
      //   we should not let the options.key/index bleed through
      key: void 0,
      // index: undefined,
      [isIndex ? "index" : "key"]: k,
      path: isIndex || k.includes(".") ? `${parentPath || ""}[${isIndex ? k : `"${k}"`}]` : (parentPath ? `${parentPath}.` : "") + key
    });
    return (_, panic, next) => this.resolve(testOptions)._validate(value, testOptions, panic, next);
  }
  validate(value, options) {
    var _options$disableStack2;
    let schema = this.resolve(Object.assign({}, options, {
      value
    }));
    let disableStackTrace = (_options$disableStack2 = options == null ? void 0 : options.disableStackTrace) != null ? _options$disableStack2 : schema.spec.disableStackTrace;
    return new Promise((resolve, reject) => schema._validate(value, options, (error, parsed) => {
      if (ValidationError.isError(error))
        error.value = parsed;
      reject(error);
    }, (errors, validated) => {
      if (errors.length)
        reject(new ValidationError(errors, validated, void 0, void 0, disableStackTrace));
      else
        resolve(validated);
    }));
  }
  validateSync(value, options) {
    var _options$disableStack3;
    let schema = this.resolve(Object.assign({}, options, {
      value
    }));
    let result;
    let disableStackTrace = (_options$disableStack3 = options == null ? void 0 : options.disableStackTrace) != null ? _options$disableStack3 : schema.spec.disableStackTrace;
    schema._validate(value, Object.assign({}, options, {
      sync: true
    }), (error, parsed) => {
      if (ValidationError.isError(error))
        error.value = parsed;
      throw error;
    }, (errors, validated) => {
      if (errors.length)
        throw new ValidationError(errors, value, void 0, void 0, disableStackTrace);
      result = validated;
    });
    return result;
  }
  isValid(value, options) {
    return this.validate(value, options).then(() => true, (err) => {
      if (ValidationError.isError(err))
        return false;
      throw err;
    });
  }
  isValidSync(value, options) {
    try {
      this.validateSync(value, options);
      return true;
    } catch (err) {
      if (ValidationError.isError(err))
        return false;
      throw err;
    }
  }
  _getDefault(options) {
    let defaultValue = this.spec.default;
    if (defaultValue == null) {
      return defaultValue;
    }
    return typeof defaultValue === "function" ? defaultValue.call(this, options) : clone(defaultValue);
  }
  getDefault(options) {
    let schema = this.resolve(options || {});
    return schema._getDefault(options);
  }
  default(def) {
    if (arguments.length === 0) {
      return this._getDefault();
    }
    let next = this.clone({
      default: def
    });
    return next;
  }
  strict(isStrict = true) {
    return this.clone({
      strict: isStrict
    });
  }
  nullability(nullable, message) {
    const next = this.clone({
      nullable
    });
    next.internalTests.nullable = createValidation({
      message,
      name: "nullable",
      test(value) {
        return value === null ? this.schema.spec.nullable : true;
      }
    });
    return next;
  }
  optionality(optional, message) {
    const next = this.clone({
      optional
    });
    next.internalTests.optionality = createValidation({
      message,
      name: "optionality",
      test(value) {
        return value === void 0 ? this.schema.spec.optional : true;
      }
    });
    return next;
  }
  optional() {
    return this.optionality(true);
  }
  defined(message = mixed.defined) {
    return this.optionality(false, message);
  }
  nullable() {
    return this.nullability(true);
  }
  nonNullable(message = mixed.notNull) {
    return this.nullability(false, message);
  }
  required(message = mixed.required) {
    return this.clone().withMutation((next) => next.nonNullable(message).defined(message));
  }
  notRequired() {
    return this.clone().withMutation((next) => next.nullable().optional());
  }
  transform(fn) {
    let next = this.clone();
    next.transforms.push(fn);
    return next;
  }
  /**
   * Adds a test function to the schema's queue of tests.
   * tests can be exclusive or non-exclusive.
   *
   * - exclusive tests, will replace any existing tests of the same name.
   * - non-exclusive: can be stacked
   *
   * If a non-exclusive test is added to a schema with an exclusive test of the same name
   * the exclusive test is removed and further tests of the same name will be stacked.
   *
   * If an exclusive test is added to a schema with non-exclusive tests of the same name
   * the previous tests are removed and further tests of the same name will replace each other.
   */
  test(...args) {
    let opts;
    if (args.length === 1) {
      if (typeof args[0] === "function") {
        opts = {
          test: args[0]
        };
      } else {
        opts = args[0];
      }
    } else if (args.length === 2) {
      opts = {
        name: args[0],
        test: args[1]
      };
    } else {
      opts = {
        name: args[0],
        message: args[1],
        test: args[2]
      };
    }
    if (opts.message === void 0)
      opts.message = mixed.default;
    if (typeof opts.test !== "function")
      throw new TypeError("`test` is a required parameters");
    let next = this.clone();
    let validate = createValidation(opts);
    let isExclusive = opts.exclusive || opts.name && next.exclusiveTests[opts.name] === true;
    if (opts.exclusive) {
      if (!opts.name)
        throw new TypeError("Exclusive tests must provide a unique `name` identifying the test");
    }
    if (opts.name)
      next.exclusiveTests[opts.name] = !!opts.exclusive;
    next.tests = next.tests.filter((fn) => {
      if (fn.OPTIONS.name === opts.name) {
        if (isExclusive)
          return false;
        if (fn.OPTIONS.test === validate.OPTIONS.test)
          return false;
      }
      return true;
    });
    next.tests.push(validate);
    return next;
  }
  when(keys, options) {
    if (!Array.isArray(keys) && typeof keys !== "string") {
      options = keys;
      keys = ".";
    }
    let next = this.clone();
    let deps = toArray(keys).map((key) => new Reference(key));
    deps.forEach((dep) => {
      if (dep.isSibling)
        next.deps.push(dep.key);
    });
    next.conditions.push(typeof options === "function" ? new Condition(deps, options) : Condition.fromOptions(deps, options));
    return next;
  }
  typeError(message) {
    let next = this.clone();
    next.internalTests.typeError = createValidation({
      message,
      name: "typeError",
      skipAbsent: true,
      test(value) {
        if (!this.schema._typeCheck(value))
          return this.createError({
            params: {
              type: this.schema.type
            }
          });
        return true;
      }
    });
    return next;
  }
  oneOf(enums, message = mixed.oneOf) {
    let next = this.clone();
    enums.forEach((val) => {
      next._whitelist.add(val);
      next._blacklist.delete(val);
    });
    next.internalTests.whiteList = createValidation({
      message,
      name: "oneOf",
      skipAbsent: true,
      test(value) {
        let valids = this.schema._whitelist;
        let resolved = valids.resolveAll(this.resolve);
        return resolved.includes(value) ? true : this.createError({
          params: {
            values: Array.from(valids).join(", "),
            resolved
          }
        });
      }
    });
    return next;
  }
  notOneOf(enums, message = mixed.notOneOf) {
    let next = this.clone();
    enums.forEach((val) => {
      next._blacklist.add(val);
      next._whitelist.delete(val);
    });
    next.internalTests.blacklist = createValidation({
      message,
      name: "notOneOf",
      test(value) {
        let invalids = this.schema._blacklist;
        let resolved = invalids.resolveAll(this.resolve);
        if (resolved.includes(value))
          return this.createError({
            params: {
              values: Array.from(invalids).join(", "),
              resolved
            }
          });
        return true;
      }
    });
    return next;
  }
  strip(strip = true) {
    let next = this.clone();
    next.spec.strip = strip;
    return next;
  }
  /**
   * Return a serialized description of the schema including validations, flags, types etc.
   *
   * @param options Provide any needed context for resolving runtime schema alterations (lazy, when conditions, etc).
   */
  describe(options) {
    const next = (options ? this.resolve(options) : this).clone();
    const {
      label,
      meta,
      optional,
      nullable
    } = next.spec;
    const description = {
      meta,
      label,
      optional,
      nullable,
      default: next.getDefault(options),
      type: next.type,
      oneOf: next._whitelist.describe(),
      notOneOf: next._blacklist.describe(),
      tests: next.tests.filter((n, idx, list) => list.findIndex((c) => c.OPTIONS.name === n.OPTIONS.name) === idx).map((fn) => {
        const params = fn.OPTIONS.params && options ? resolveParams(Object.assign({}, fn.OPTIONS.params), options) : fn.OPTIONS.params;
        return {
          name: fn.OPTIONS.name,
          params
        };
      })
    };
    return description;
  }
  get ["~standard"]() {
    const schema = this;
    const standard = {
      version: 1,
      vendor: "yup",
      async validate(value) {
        try {
          const result = await schema.validate(value, {
            abortEarly: false
          });
          return {
            value: result
          };
        } catch (err) {
          if (err instanceof ValidationError) {
            return {
              issues: issuesFromValidationError(err)
            };
          }
          throw err;
        }
      }
    };
    return standard;
  }
}
Schema.prototype.__isYupSchema__ = true;
for (const method of ["validate", "validateSync"])
  Schema.prototype[`${method}At`] = function(path, value, options = {}) {
    const {
      parent,
      parentPath,
      schema
    } = getIn(this, path, value, options.context);
    return schema[method](parent && parent[parentPath], Object.assign({}, options, {
      parent,
      path
    }));
  };
for (const alias of ["equals", "is"])
  Schema.prototype[alias] = Schema.prototype.oneOf;
for (const alias of ["not", "nope"])
  Schema.prototype[alias] = Schema.prototype.notOneOf;
const returnsTrue = () => true;
function create$8(spec) {
  return new MixedSchema(spec);
}
class MixedSchema extends Schema {
  constructor(spec) {
    super(typeof spec === "function" ? {
      type: "mixed",
      check: spec
    } : Object.assign({
      type: "mixed",
      check: returnsTrue
    }, spec));
  }
}
create$8.prototype = MixedSchema.prototype;
function create$7() {
  return new BooleanSchema();
}
class BooleanSchema extends Schema {
  constructor() {
    super({
      type: "boolean",
      check(v) {
        if (v instanceof Boolean)
          v = v.valueOf();
        return typeof v === "boolean";
      }
    });
    this.withMutation(() => {
      this.transform((value, _raw, ctx) => {
        if (ctx.spec.coerce && !ctx.isType(value)) {
          if (/^(true|1)$/i.test(String(value)))
            return true;
          if (/^(false|0)$/i.test(String(value)))
            return false;
        }
        return value;
      });
    });
  }
  isTrue(message = boolean.isValue) {
    return this.test({
      message,
      name: "is-value",
      exclusive: true,
      params: {
        value: "true"
      },
      test(value) {
        return isAbsent(value) || value === true;
      }
    });
  }
  isFalse(message = boolean.isValue) {
    return this.test({
      message,
      name: "is-value",
      exclusive: true,
      params: {
        value: "false"
      },
      test(value) {
        return isAbsent(value) || value === false;
      }
    });
  }
  default(def) {
    return super.default(def);
  }
  defined(msg) {
    return super.defined(msg);
  }
  optional() {
    return super.optional();
  }
  required(msg) {
    return super.required(msg);
  }
  notRequired() {
    return super.notRequired();
  }
  nullable() {
    return super.nullable();
  }
  nonNullable(msg) {
    return super.nonNullable(msg);
  }
  strip(v) {
    return super.strip(v);
  }
}
create$7.prototype = BooleanSchema.prototype;
const isoReg = /^(\d{4}|[+-]\d{6})(?:-?(\d{2})(?:-?(\d{2}))?)?(?:[ T]?(\d{2}):?(\d{2})(?::?(\d{2})(?:[,.](\d{1,}))?)?(?:(Z)|([+-])(\d{2})(?::?(\d{2}))?)?)?$/;
function parseIsoDate(date2) {
  const struct = parseDateStruct(date2);
  if (!struct)
    return Date.parse ? Date.parse(date2) : Number.NaN;
  if (struct.z === void 0 && struct.plusMinus === void 0) {
    return new Date(struct.year, struct.month, struct.day, struct.hour, struct.minute, struct.second, struct.millisecond).valueOf();
  }
  let totalMinutesOffset = 0;
  if (struct.z !== "Z" && struct.plusMinus !== void 0) {
    totalMinutesOffset = struct.hourOffset * 60 + struct.minuteOffset;
    if (struct.plusMinus === "+")
      totalMinutesOffset = 0 - totalMinutesOffset;
  }
  return Date.UTC(struct.year, struct.month, struct.day, struct.hour, struct.minute + totalMinutesOffset, struct.second, struct.millisecond);
}
function parseDateStruct(date2) {
  var _regexResult$7$length, _regexResult$;
  const regexResult = isoReg.exec(date2);
  if (!regexResult)
    return null;
  return {
    year: toNumber(regexResult[1]),
    month: toNumber(regexResult[2], 1) - 1,
    day: toNumber(regexResult[3], 1),
    hour: toNumber(regexResult[4]),
    minute: toNumber(regexResult[5]),
    second: toNumber(regexResult[6]),
    millisecond: regexResult[7] ? (
      // allow arbitrary sub-second precision beyond milliseconds
      toNumber(regexResult[7].substring(0, 3))
    ) : 0,
    precision: (_regexResult$7$length = (_regexResult$ = regexResult[7]) == null ? void 0 : _regexResult$.length) != null ? _regexResult$7$length : void 0,
    z: regexResult[8] || void 0,
    plusMinus: regexResult[9] || void 0,
    hourOffset: toNumber(regexResult[10]),
    minuteOffset: toNumber(regexResult[11])
  };
}
function toNumber(str, defaultValue = 0) {
  return Number(str) || defaultValue;
}
let rEmail = (
  // eslint-disable-next-line
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
);
let rUrl = (
  // eslint-disable-next-line
  /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
);
let rUUID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
let yearMonthDay = "^\\d{4}-\\d{2}-\\d{2}";
let hourMinuteSecond = "\\d{2}:\\d{2}:\\d{2}";
let zOrOffset = "(([+-]\\d{2}(:?\\d{2})?)|Z)";
let rIsoDateTime = new RegExp(`${yearMonthDay}T${hourMinuteSecond}(\\.\\d+)?${zOrOffset}$`);
let isTrimmed = (value) => isAbsent(value) || value === value.trim();
let objStringTag = {}.toString();
function create$6() {
  return new StringSchema();
}
class StringSchema extends Schema {
  constructor() {
    super({
      type: "string",
      check(value) {
        if (value instanceof String)
          value = value.valueOf();
        return typeof value === "string";
      }
    });
    this.withMutation(() => {
      this.transform((value, _raw, ctx) => {
        if (!ctx.spec.coerce || ctx.isType(value))
          return value;
        if (Array.isArray(value))
          return value;
        const strValue = value != null && value.toString ? value.toString() : value;
        if (strValue === objStringTag)
          return value;
        return strValue;
      });
    });
  }
  required(message) {
    return super.required(message).withMutation((schema) => schema.test({
      message: message || mixed.required,
      name: "required",
      skipAbsent: true,
      test: (value) => !!value.length
    }));
  }
  notRequired() {
    return super.notRequired().withMutation((schema) => {
      schema.tests = schema.tests.filter((t) => t.OPTIONS.name !== "required");
      return schema;
    });
  }
  length(length, message = string.length) {
    return this.test({
      message,
      name: "length",
      exclusive: true,
      params: {
        length
      },
      skipAbsent: true,
      test(value) {
        return value.length === this.resolve(length);
      }
    });
  }
  min(min, message = string.min) {
    return this.test({
      message,
      name: "min",
      exclusive: true,
      params: {
        min
      },
      skipAbsent: true,
      test(value) {
        return value.length >= this.resolve(min);
      }
    });
  }
  max(max, message = string.max) {
    return this.test({
      name: "max",
      exclusive: true,
      message,
      params: {
        max
      },
      skipAbsent: true,
      test(value) {
        return value.length <= this.resolve(max);
      }
    });
  }
  matches(regex, options) {
    let excludeEmptyString = false;
    let message;
    let name;
    if (options) {
      if (typeof options === "object") {
        ({
          excludeEmptyString = false,
          message,
          name
        } = options);
      } else {
        message = options;
      }
    }
    return this.test({
      name: name || "matches",
      message: message || string.matches,
      params: {
        regex
      },
      skipAbsent: true,
      test: (value) => value === "" && excludeEmptyString || value.search(regex) !== -1
    });
  }
  email(message = string.email) {
    return this.matches(rEmail, {
      name: "email",
      message,
      excludeEmptyString: true
    });
  }
  url(message = string.url) {
    return this.matches(rUrl, {
      name: "url",
      message,
      excludeEmptyString: true
    });
  }
  uuid(message = string.uuid) {
    return this.matches(rUUID, {
      name: "uuid",
      message,
      excludeEmptyString: false
    });
  }
  datetime(options) {
    let message = "";
    let allowOffset;
    let precision;
    if (options) {
      if (typeof options === "object") {
        ({
          message = "",
          allowOffset = false,
          precision = void 0
        } = options);
      } else {
        message = options;
      }
    }
    return this.matches(rIsoDateTime, {
      name: "datetime",
      message: message || string.datetime,
      excludeEmptyString: true
    }).test({
      name: "datetime_offset",
      message: message || string.datetime_offset,
      params: {
        allowOffset
      },
      skipAbsent: true,
      test: (value) => {
        if (!value || allowOffset)
          return true;
        const struct = parseDateStruct(value);
        if (!struct)
          return false;
        return !!struct.z;
      }
    }).test({
      name: "datetime_precision",
      message: message || string.datetime_precision,
      params: {
        precision
      },
      skipAbsent: true,
      test: (value) => {
        if (!value || precision == void 0)
          return true;
        const struct = parseDateStruct(value);
        if (!struct)
          return false;
        return struct.precision === precision;
      }
    });
  }
  //-- transforms --
  ensure() {
    return this.default("").transform((val) => val === null ? "" : val);
  }
  trim(message = string.trim) {
    return this.transform((val) => val != null ? val.trim() : val).test({
      message,
      name: "trim",
      test: isTrimmed
    });
  }
  lowercase(message = string.lowercase) {
    return this.transform((value) => !isAbsent(value) ? value.toLowerCase() : value).test({
      message,
      name: "string_case",
      exclusive: true,
      skipAbsent: true,
      test: (value) => isAbsent(value) || value === value.toLowerCase()
    });
  }
  uppercase(message = string.uppercase) {
    return this.transform((value) => !isAbsent(value) ? value.toUpperCase() : value).test({
      message,
      name: "string_case",
      exclusive: true,
      skipAbsent: true,
      test: (value) => isAbsent(value) || value === value.toUpperCase()
    });
  }
}
create$6.prototype = StringSchema.prototype;
let isNaN$1 = (value) => value != +value;
function create$5() {
  return new NumberSchema();
}
class NumberSchema extends Schema {
  constructor() {
    super({
      type: "number",
      check(value) {
        if (value instanceof Number)
          value = value.valueOf();
        return typeof value === "number" && !isNaN$1(value);
      }
    });
    this.withMutation(() => {
      this.transform((value, _raw, ctx) => {
        if (!ctx.spec.coerce)
          return value;
        let parsed = value;
        if (typeof parsed === "string") {
          parsed = parsed.replace(/\s/g, "");
          if (parsed === "")
            return NaN;
          parsed = +parsed;
        }
        if (ctx.isType(parsed) || parsed === null)
          return parsed;
        return parseFloat(parsed);
      });
    });
  }
  min(min, message = number.min) {
    return this.test({
      message,
      name: "min",
      exclusive: true,
      params: {
        min
      },
      skipAbsent: true,
      test(value) {
        return value >= this.resolve(min);
      }
    });
  }
  max(max, message = number.max) {
    return this.test({
      message,
      name: "max",
      exclusive: true,
      params: {
        max
      },
      skipAbsent: true,
      test(value) {
        return value <= this.resolve(max);
      }
    });
  }
  lessThan(less, message = number.lessThan) {
    return this.test({
      message,
      name: "max",
      exclusive: true,
      params: {
        less
      },
      skipAbsent: true,
      test(value) {
        return value < this.resolve(less);
      }
    });
  }
  moreThan(more, message = number.moreThan) {
    return this.test({
      message,
      name: "min",
      exclusive: true,
      params: {
        more
      },
      skipAbsent: true,
      test(value) {
        return value > this.resolve(more);
      }
    });
  }
  positive(msg = number.positive) {
    return this.moreThan(0, msg);
  }
  negative(msg = number.negative) {
    return this.lessThan(0, msg);
  }
  integer(message = number.integer) {
    return this.test({
      name: "integer",
      message,
      skipAbsent: true,
      test: (val) => Number.isInteger(val)
    });
  }
  truncate() {
    return this.transform((value) => !isAbsent(value) ? value | 0 : value);
  }
  round(method) {
    var _method;
    let avail = ["ceil", "floor", "round", "trunc"];
    method = ((_method = method) == null ? void 0 : _method.toLowerCase()) || "round";
    if (method === "trunc")
      return this.truncate();
    if (avail.indexOf(method.toLowerCase()) === -1)
      throw new TypeError("Only valid options for round() are: " + avail.join(", "));
    return this.transform((value) => !isAbsent(value) ? Math[method](value) : value);
  }
}
create$5.prototype = NumberSchema.prototype;
let invalidDate = /* @__PURE__ */ new Date("");
let isDate = (obj) => Object.prototype.toString.call(obj) === "[object Date]";
class DateSchema extends Schema {
  constructor() {
    super({
      type: "date",
      check(v) {
        return isDate(v) && !isNaN(v.getTime());
      }
    });
    this.withMutation(() => {
      this.transform((value, _raw, ctx) => {
        if (!ctx.spec.coerce || ctx.isType(value) || value === null)
          return value;
        value = parseIsoDate(value);
        return !isNaN(value) ? new Date(value) : DateSchema.INVALID_DATE;
      });
    });
  }
  prepareParam(ref, name) {
    let param;
    if (!Reference.isRef(ref)) {
      let cast = this.cast(ref);
      if (!this._typeCheck(cast))
        throw new TypeError(`\`${name}\` must be a Date or a value that can be \`cast()\` to a Date`);
      param = cast;
    } else {
      param = ref;
    }
    return param;
  }
  min(min, message = date.min) {
    let limit = this.prepareParam(min, "min");
    return this.test({
      message,
      name: "min",
      exclusive: true,
      params: {
        min
      },
      skipAbsent: true,
      test(value) {
        return value >= this.resolve(limit);
      }
    });
  }
  max(max, message = date.max) {
    let limit = this.prepareParam(max, "max");
    return this.test({
      message,
      name: "max",
      exclusive: true,
      params: {
        max
      },
      skipAbsent: true,
      test(value) {
        return value <= this.resolve(limit);
      }
    });
  }
}
DateSchema.INVALID_DATE = invalidDate;
DateSchema.prototype;
function sortFields(fields, excludedEdges = []) {
  let edges = [];
  let nodes = /* @__PURE__ */ new Set();
  let excludes = new Set(excludedEdges.map(([a, b]) => `${a}-${b}`));
  function addNode(depPath, key) {
    let node = propertyExpr.split(depPath)[0];
    nodes.add(node);
    if (!excludes.has(`${key}-${node}`))
      edges.push([key, node]);
  }
  for (const key of Object.keys(fields)) {
    let value = fields[key];
    nodes.add(key);
    if (Reference.isRef(value) && value.isSibling)
      addNode(value.path, key);
    else if (isSchema(value) && "deps" in value)
      value.deps.forEach((path) => addNode(path, key));
  }
  return toposort$1.array(Array.from(nodes), edges).reverse();
}
function findIndex(arr, err) {
  let idx = Infinity;
  arr.some((key, ii) => {
    var _err$path;
    if ((_err$path = err.path) != null && _err$path.includes(key)) {
      idx = ii;
      return true;
    }
  });
  return idx;
}
function sortByKeyOrder(keys) {
  return (a, b) => {
    return findIndex(keys, a) - findIndex(keys, b);
  };
}
const parseJson = (value, _, ctx) => {
  if (typeof value !== "string") {
    return value;
  }
  let parsed = value;
  try {
    parsed = JSON.parse(value);
  } catch (err) {
  }
  return ctx.isType(parsed) ? parsed : value;
};
function deepPartial(schema) {
  if ("fields" in schema) {
    const partial = {};
    for (const [key, fieldSchema] of Object.entries(schema.fields)) {
      partial[key] = deepPartial(fieldSchema);
    }
    return schema.setFields(partial);
  }
  if (schema.type === "array") {
    const nextArray = schema.optional();
    if (nextArray.innerType)
      nextArray.innerType = deepPartial(nextArray.innerType);
    return nextArray;
  }
  if (schema.type === "tuple") {
    return schema.optional().clone({
      types: schema.spec.types.map(deepPartial)
    });
  }
  if ("optional" in schema) {
    return schema.optional();
  }
  return schema;
}
const deepHas = (obj, p) => {
  const path = [...propertyExpr.normalizePath(p)];
  if (path.length === 1)
    return path[0] in obj;
  let last = path.pop();
  let parent = propertyExpr.getter(propertyExpr.join(path), true)(obj);
  return !!(parent && last in parent);
};
let isObject = (obj) => Object.prototype.toString.call(obj) === "[object Object]";
function unknown(ctx, value) {
  let known = Object.keys(ctx.fields);
  return Object.keys(value).filter((key) => known.indexOf(key) === -1);
}
const defaultSort = sortByKeyOrder([]);
function create$3(spec) {
  return new ObjectSchema(spec);
}
class ObjectSchema extends Schema {
  constructor(spec) {
    super({
      type: "object",
      check(value) {
        return isObject(value) || typeof value === "function";
      }
    });
    this.fields = /* @__PURE__ */ Object.create(null);
    this._sortErrors = defaultSort;
    this._nodes = [];
    this._excludedEdges = [];
    this.withMutation(() => {
      if (spec) {
        this.shape(spec);
      }
    });
  }
  _cast(_value, options = {}) {
    var _options$stripUnknown;
    let value = super._cast(_value, options);
    if (value === void 0)
      return this.getDefault(options);
    if (!this._typeCheck(value))
      return value;
    let fields = this.fields;
    let strip = (_options$stripUnknown = options.stripUnknown) != null ? _options$stripUnknown : this.spec.noUnknown;
    let props = [].concat(this._nodes, Object.keys(value).filter((v) => !this._nodes.includes(v)));
    let intermediateValue = {};
    let innerOptions = Object.assign({}, options, {
      parent: intermediateValue,
      __validating: options.__validating || false
    });
    let isChanged = false;
    for (const prop of props) {
      let field = fields[prop];
      let exists = prop in value;
      if (field) {
        let fieldValue;
        let inputValue = value[prop];
        innerOptions.path = (options.path ? `${options.path}.` : "") + prop;
        field = field.resolve({
          value: inputValue,
          context: options.context,
          parent: intermediateValue
        });
        let fieldSpec = field instanceof Schema ? field.spec : void 0;
        let strict = fieldSpec == null ? void 0 : fieldSpec.strict;
        if (fieldSpec != null && fieldSpec.strip) {
          isChanged = isChanged || prop in value;
          continue;
        }
        fieldValue = !options.__validating || !strict ? (
          // TODO: use _cast, this is double resolving
          field.cast(value[prop], innerOptions)
        ) : value[prop];
        if (fieldValue !== void 0) {
          intermediateValue[prop] = fieldValue;
        }
      } else if (exists && !strip) {
        intermediateValue[prop] = value[prop];
      }
      if (exists !== prop in intermediateValue || intermediateValue[prop] !== value[prop]) {
        isChanged = true;
      }
    }
    return isChanged ? intermediateValue : value;
  }
  _validate(_value, options = {}, panic, next) {
    let {
      from = [],
      originalValue = _value,
      recursive = this.spec.recursive
    } = options;
    options.from = [{
      schema: this,
      value: originalValue
    }, ...from];
    options.__validating = true;
    options.originalValue = originalValue;
    super._validate(_value, options, panic, (objectErrors, value) => {
      if (!recursive || !isObject(value)) {
        next(objectErrors, value);
        return;
      }
      originalValue = originalValue || value;
      let tests = [];
      for (let key of this._nodes) {
        let field = this.fields[key];
        if (!field || Reference.isRef(field)) {
          continue;
        }
        tests.push(field.asNestedTest({
          options,
          key,
          parent: value,
          parentPath: options.path,
          originalParent: originalValue
        }));
      }
      this.runTests({
        tests,
        value,
        originalValue,
        options
      }, panic, (fieldErrors) => {
        next(fieldErrors.sort(this._sortErrors).concat(objectErrors), value);
      });
    });
  }
  clone(spec) {
    const next = super.clone(spec);
    next.fields = Object.assign({}, this.fields);
    next._nodes = this._nodes;
    next._excludedEdges = this._excludedEdges;
    next._sortErrors = this._sortErrors;
    return next;
  }
  concat(schema) {
    let next = super.concat(schema);
    let nextFields = next.fields;
    for (let [field, schemaOrRef] of Object.entries(this.fields)) {
      const target = nextFields[field];
      nextFields[field] = target === void 0 ? schemaOrRef : target;
    }
    return next.withMutation((s) => (
      // XXX: excludes here is wrong
      s.setFields(nextFields, [...this._excludedEdges, ...schema._excludedEdges])
    ));
  }
  _getDefault(options) {
    if ("default" in this.spec) {
      return super._getDefault(options);
    }
    if (!this._nodes.length) {
      return void 0;
    }
    let dft = {};
    this._nodes.forEach((key) => {
      var _innerOptions;
      const field = this.fields[key];
      let innerOptions = options;
      if ((_innerOptions = innerOptions) != null && _innerOptions.value) {
        innerOptions = Object.assign({}, innerOptions, {
          parent: innerOptions.value,
          value: innerOptions.value[key]
        });
      }
      dft[key] = field && "getDefault" in field ? field.getDefault(innerOptions) : void 0;
    });
    return dft;
  }
  setFields(shape, excludedEdges) {
    let next = this.clone();
    next.fields = shape;
    next._nodes = sortFields(shape, excludedEdges);
    next._sortErrors = sortByKeyOrder(Object.keys(shape));
    if (excludedEdges)
      next._excludedEdges = excludedEdges;
    return next;
  }
  shape(additions, excludes = []) {
    return this.clone().withMutation((next) => {
      let edges = next._excludedEdges;
      if (excludes.length) {
        if (!Array.isArray(excludes[0]))
          excludes = [excludes];
        edges = [...next._excludedEdges, ...excludes];
      }
      return next.setFields(Object.assign(next.fields, additions), edges);
    });
  }
  partial() {
    const partial = {};
    for (const [key, schema] of Object.entries(this.fields)) {
      partial[key] = "optional" in schema && schema.optional instanceof Function ? schema.optional() : schema;
    }
    return this.setFields(partial);
  }
  deepPartial() {
    const next = deepPartial(this);
    return next;
  }
  pick(keys) {
    const picked = {};
    for (const key of keys) {
      if (this.fields[key])
        picked[key] = this.fields[key];
    }
    return this.setFields(picked, this._excludedEdges.filter(([a, b]) => keys.includes(a) && keys.includes(b)));
  }
  omit(keys) {
    const remaining = [];
    for (const key of Object.keys(this.fields)) {
      if (keys.includes(key))
        continue;
      remaining.push(key);
    }
    return this.pick(remaining);
  }
  from(from, to, alias) {
    let fromGetter = propertyExpr.getter(from, true);
    return this.transform((obj) => {
      if (!obj)
        return obj;
      let newObj = obj;
      if (deepHas(obj, from)) {
        newObj = Object.assign({}, obj);
        if (!alias)
          delete newObj[from];
        newObj[to] = fromGetter(obj);
      }
      return newObj;
    });
  }
  /** Parse an input JSON string to an object */
  json() {
    return this.transform(parseJson);
  }
  /**
   * Similar to `noUnknown` but only validates that an object is the right shape without stripping the unknown keys
   */
  exact(message) {
    return this.test({
      name: "exact",
      exclusive: true,
      message: message || object.exact,
      test(value) {
        if (value == null)
          return true;
        const unknownKeys = unknown(this.schema, value);
        return unknownKeys.length === 0 || this.createError({
          params: {
            properties: unknownKeys.join(", ")
          }
        });
      }
    });
  }
  stripUnknown() {
    return this.clone({
      noUnknown: true
    });
  }
  noUnknown(noAllow = true, message = object.noUnknown) {
    if (typeof noAllow !== "boolean") {
      message = noAllow;
      noAllow = true;
    }
    let next = this.test({
      name: "noUnknown",
      exclusive: true,
      message,
      test(value) {
        if (value == null)
          return true;
        const unknownKeys = unknown(this.schema, value);
        return !noAllow || unknownKeys.length === 0 || this.createError({
          params: {
            unknown: unknownKeys.join(", ")
          }
        });
      }
    });
    next.spec.noUnknown = noAllow;
    return next;
  }
  unknown(allow = true, message = object.noUnknown) {
    return this.noUnknown(!allow, message);
  }
  transformKeys(fn) {
    return this.transform((obj) => {
      if (!obj)
        return obj;
      const result = {};
      for (const key of Object.keys(obj))
        result[fn(key)] = obj[key];
      return result;
    });
  }
  camelCase() {
    return this.transformKeys(tinyCase.camelCase);
  }
  snakeCase() {
    return this.transformKeys(tinyCase.snakeCase);
  }
  constantCase() {
    return this.transformKeys((key) => tinyCase.snakeCase(key).toUpperCase());
  }
  describe(options) {
    const next = (options ? this.resolve(options) : this).clone();
    const base = super.describe(options);
    base.fields = {};
    for (const [key, value] of Object.entries(next.fields)) {
      var _innerOptions2;
      let innerOptions = options;
      if ((_innerOptions2 = innerOptions) != null && _innerOptions2.value) {
        innerOptions = Object.assign({}, innerOptions, {
          parent: innerOptions.value,
          value: innerOptions.value[key]
        });
      }
      base.fields[key] = value.describe(innerOptions);
    }
    return base;
  }
}
create$3.prototype = ObjectSchema.prototype;
function create$2(type) {
  return new ArraySchema(type);
}
class ArraySchema extends Schema {
  constructor(type) {
    super({
      type: "array",
      spec: {
        types: type
      },
      check(v) {
        return Array.isArray(v);
      }
    });
    this.innerType = void 0;
    this.innerType = type;
  }
  _cast(_value, _opts) {
    const value = super._cast(_value, _opts);
    if (!this._typeCheck(value) || !this.innerType) {
      return value;
    }
    let isChanged = false;
    const castArray = value.map((v, idx) => {
      const castElement = this.innerType.cast(v, Object.assign({}, _opts, {
        path: `${_opts.path || ""}[${idx}]`
      }));
      if (castElement !== v) {
        isChanged = true;
      }
      return castElement;
    });
    return isChanged ? castArray : value;
  }
  _validate(_value, options = {}, panic, next) {
    var _options$recursive;
    let innerType = this.innerType;
    let recursive = (_options$recursive = options.recursive) != null ? _options$recursive : this.spec.recursive;
    options.originalValue != null ? options.originalValue : _value;
    super._validate(_value, options, panic, (arrayErrors, value) => {
      var _options$originalValu2;
      if (!recursive || !innerType || !this._typeCheck(value)) {
        next(arrayErrors, value);
        return;
      }
      let tests = new Array(value.length);
      for (let index = 0; index < value.length; index++) {
        var _options$originalValu;
        tests[index] = innerType.asNestedTest({
          options,
          index,
          parent: value,
          parentPath: options.path,
          originalParent: (_options$originalValu = options.originalValue) != null ? _options$originalValu : _value
        });
      }
      this.runTests({
        value,
        tests,
        originalValue: (_options$originalValu2 = options.originalValue) != null ? _options$originalValu2 : _value,
        options
      }, panic, (innerTypeErrors) => next(innerTypeErrors.concat(arrayErrors), value));
    });
  }
  clone(spec) {
    const next = super.clone(spec);
    next.innerType = this.innerType;
    return next;
  }
  /** Parse an input JSON string to an object */
  json() {
    return this.transform(parseJson);
  }
  concat(schema) {
    let next = super.concat(schema);
    next.innerType = this.innerType;
    if (schema.innerType)
      next.innerType = next.innerType ? (
        // @ts-expect-error Lazy doesn't have concat and will break
        next.innerType.concat(schema.innerType)
      ) : schema.innerType;
    return next;
  }
  of(schema) {
    let next = this.clone();
    if (!isSchema(schema))
      throw new TypeError("`array.of()` sub-schema must be a valid yup schema not: " + printValue(schema));
    next.innerType = schema;
    next.spec = Object.assign({}, next.spec, {
      types: schema
    });
    return next;
  }
  length(length, message = array.length) {
    return this.test({
      message,
      name: "length",
      exclusive: true,
      params: {
        length
      },
      skipAbsent: true,
      test(value) {
        return value.length === this.resolve(length);
      }
    });
  }
  min(min, message) {
    message = message || array.min;
    return this.test({
      message,
      name: "min",
      exclusive: true,
      params: {
        min
      },
      skipAbsent: true,
      // FIXME(ts): Array<typeof T>
      test(value) {
        return value.length >= this.resolve(min);
      }
    });
  }
  max(max, message) {
    message = message || array.max;
    return this.test({
      message,
      name: "max",
      exclusive: true,
      params: {
        max
      },
      skipAbsent: true,
      test(value) {
        return value.length <= this.resolve(max);
      }
    });
  }
  ensure() {
    return this.default(() => []).transform((val, original) => {
      if (this._typeCheck(val))
        return val;
      return original == null ? [] : [].concat(original);
    });
  }
  compact(rejector) {
    let reject = !rejector ? (v) => !!v : (v, i, a) => !rejector(v, i, a);
    return this.transform((values) => values != null ? values.filter(reject) : values);
  }
  describe(options) {
    const next = (options ? this.resolve(options) : this).clone();
    const base = super.describe(options);
    if (next.innerType) {
      var _innerOptions;
      let innerOptions = options;
      if ((_innerOptions = innerOptions) != null && _innerOptions.value) {
        innerOptions = Object.assign({}, innerOptions, {
          parent: innerOptions.value,
          value: innerOptions.value[0]
        });
      }
      base.innerType = next.innerType.describe(innerOptions);
    }
    return base;
  }
}
create$2.prototype = ArraySchema.prototype;
const accountDetailsDataModel = create$3({
  displayName: create$6().required(),
  userId: create$6().required(),
  currency1: create$5().required(),
  scriptData: create$3({
    isGuest: create$7().required(),
    isVIP: create$7().required(),
    userSettings: create$3({
      noAds: create$7().required()
    }).required(),
    currentLegs: create$2().of(
      create$3({
        raceId: create$5().required(),
        legNum: create$5().required()
      })
    ).nullable().notRequired(),
    team: create$3({
      coach: create$7().notRequired().nullable(),
      name: create$6().notRequired().nullable(),
      id: create$6().notRequired().nullable()
    }).nullable().notRequired(),
    vsr2: create$3({
      rank: create$5().required().notRequired().nullable()
    })
  })
});
const locationSchema = create$3({
  date: create$5().required(),
  heading: create$5().optional(),
  lat: create$5().required(),
  lon: create$5().required(),
  name: create$6().required(),
  countryFlag: create$6().required(),
  radius: create$5().optional()
});
const boatStatsSchema = create$3({
  weight: create$5().required()
});
create$3({
  raceId: create$5().required(),
  legNum: create$5().required()
});
const raceSchema = create$3({
  raceId: create$5().required(),
  legNum: create$5().required(),
  limitedAccess: create$7().optional(),
  legName: create$6().required(),
  estimatedTime: create$5().required(),
  estimatedLength: create$5().required(),
  status: create$6().oneOf(["opened", "started", "finished", "ended"]).required(),
  startDate: create$5().required(),
  start: locationSchema.required(),
  end: locationSchema.required(),
  raceName: create$6().required(),
  raceType: create$6().required(),
  boat: create$3({
    polar_id: create$5().required(),
    stats: boatStatsSchema.required()
  }).required(),
  vsrRank: create$5().optional(),
  priceLevel: create$5().optional(),
  freeCredits: create$5().optional(),
  adStartCredits: create$5().optional(),
  pilotBoatCredits: create$5().optional(),
  lastUpdate: create$5().required(),
  skinDiscount: create$5().optional(),
  fineWinds: create$7().optional(),
  nbTotalSkippers: create$5().required(),
  boatsAtSea: create$5().required(),
  arrived: create$5().required()
});
const scriptDataSchema = create$3({
  boatsAtSea: create$5().required(),
  res: create$2().of(raceSchema).required()
});
const legListDataModel = create$3({
  scriptData: scriptDataSchema.required(),
  "@class": create$6().required(),
  requestId: create$6().required()
});
const latlonSchema = create$3({
  lat: create$5().required(),
  lon: create$5().required()
});
const checkpointSchema = create$3({
  id: create$5().required(),
  group: create$5().required(),
  name: create$8().nullable(true),
  // string ou number ou vide
  start: latlonSchema.required(),
  end: latlonSchema.required(),
  engine: create$7().required(),
  display: create$6().required(),
  ranking: create$7().required(),
  side: create$6().oneOf(["port", "stbd"]).required()
});
const restrictedAeraPointSchema = create$3({
  name: create$6().optional(),
  color: create$6().optional(),
  bbox: create$2(create$5()).optional(),
  vertices: create$2().of(latlonSchema).optional()
});
const legSchema = create$3({
  _id: create$3({
    race_id: create$5().required(),
    num: create$5().required()
  }).required(),
  _updatedAt: create$6().required(),
  // ISO Date
  boat: create$3({
    polar_id: create$5().required(),
    stats: boatStatsSchema.required()
  }).required(),
  checkpoints: create$2().of(checkpointSchema).required(),
  course: create$2().of(latlonSchema).required(),
  close: create$3({
    date: create$5().required()
  }).required(),
  end: create$3({
    date: create$5().required(),
    lat: create$5().required(),
    lon: create$5().required(),
    name: create$6().required(),
    radius: create$5().required(),
    countryCode: create$6().required()
  }).required(),
  freeCredits: create$5().required(),
  ice_limits: create$3({
    maxLat: create$5().required(),
    minLat: create$5().required(),
    north: create$2().of(latlonSchema).required(),
    south: create$2().of(latlonSchema).required()
  }).required(),
  lastUpdate: create$5().required(),
  name: create$6().required(),
  open: create$3({
    date: create$5().required()
  }).required(),
  optionPrices: create$3({
    foil: create$5().required(),
    winch: create$5().required(),
    radio: create$5().required(),
    skin: create$5().required(),
    hull: create$5().required(),
    reach: create$5().required(),
    heavy: create$5().required(),
    light: create$5().required(),
    comfortLoungePug: create$5().required(),
    magicFurler: create$5().required(),
    vrtexJacket: create$5().required()
  }).required(),
  pilotBoatCredits: create$5().required(),
  priceLevel: create$5().required(),
  race: create$3({
    name: create$6().required(),
    type: create$6().required()
  }).required(),
  start: create$3({
    date: create$5().required(),
    heading: create$5().required(),
    lat: create$5().required(),
    lon: create$5().required(),
    name: create$6().required(),
    countryCode: create$6().required()
  }).required(),
  status: create$6().required(),
  vsrLevel: create$5().required(),
  estimatedLength: create$5().required(),
  estimatedTime: create$5().required(),
  fineWinds: create$7().required(),
  restrictedZones: create$2().of(restrictedAeraPointSchema).optional()
});
const endLegPrepDataModel = create$3({
  scriptData: create$3({
    leg: legSchema.required()
  }).required(),
  "@class": create$6().required(),
  requestId: create$6().required()
});
create$3({
  infos: create$6().required(),
  leg_num: create$5().required(),
  race_id: create$5().required(),
  user_id: create$6().required()
});
const getBoatInfosResponseSchema = create$3({
  res: create$3({
    ba: create$8().notRequired().nullable(),
    bs: create$8().notRequired().transform((value, originalValue) => {
      if (originalValue == null)
        return void 0;
      try {
        return getBoatInfosBoatStateSchema.validateSync(originalValue, { stripUnknown: true });
      } catch (e) {
        throw new ValidationError(e.errors, originalValue, "res.bs");
      }
    }),
    engine: create$8().required().transform((value, originalValue) => {
      if (originalValue == null)
        return void 0;
      try {
        return getBoatInfosBoatEngineSchema.validateSync(originalValue, { stripUnknown: true });
      } catch (e) {
        throw new ValidationError(e.errors, originalValue, "res.engine");
      }
    }),
    leg: create$8().notRequired().transform((value, originalValue) => {
      if (originalValue == null)
        return void 0;
      try {
        return legSchema.validateSync(originalValue, { stripUnknown: true });
      } catch (e) {
        throw new ValidationError(e.errors, originalValue, "res.leg");
      }
    }),
    track: create$8().notRequired().transform((value, originalValue) => {
      if (originalValue == null)
        return void 0;
      try {
        return getBoatInfosBoatTrackSchema.validateSync(originalValue, { stripUnknown: true });
      } catch (e) {
        throw new ValidationError(e.errors, originalValue, "res.leg");
      }
    })
  })
});
const getBoatInfosBoatStateSchema = create$3({
  _id: create$3({
    user_id: create$6().required(),
    race_id: create$5().required(),
    leg_num: create$5().required()
  }).required(),
  displayName: create$6().required(),
  distanceFromStart: create$5().notRequired().nullable(),
  distanceToEnd: create$5().notRequired().nullable(),
  gateGroupCounters: create$2(create$5().required()).notRequired().nullable(),
  hasPermanentAutoSails: create$7().notRequired().nullable(),
  heading: create$5().required(),
  lastCalcDate: create$5().notRequired().nullable(),
  legStartDate: create$5().notRequired().nullable(),
  pos: latlonSchema.required(),
  rank: create$5().notRequired().nullable(),
  sail: create$5().required(),
  isRegulated: create$7().notRequired().nullable(),
  speed: create$5().required(),
  stamina: create$5().notRequired().nullable(),
  startDate: create$5().notRequired().nullable(),
  state: create$6().required(),
  tsLastAction: create$5().notRequired().nullable(),
  tsEndOfAutoSail: create$5().notRequired().nullable(),
  tsEndOfSailChange: create$5().notRequired().nullable(),
  tsEndOfGybe: create$5().notRequired().nullable(),
  tsEndOfTack: create$5().notRequired().nullable(),
  twa: create$5().notRequired().nullable(),
  twaAuto: create$5().notRequired().nullable(),
  twd: create$5().notRequired().nullable(),
  tws: create$5().notRequired().nullable(),
  // type: Yup.string().required(),
  aground: create$7().notRequired().nullable(),
  badSail: create$7().notRequired().nullable(),
  isFollowed: create$7().notRequired().nullable(),
  followed: create$7().notRequired().nullable(),
  team: create$7().notRequired().nullable(),
  fullOptions: create$7().notRequired().nullable(),
  options: create$2(create$6().required()).notRequired().nullable(),
  branding: create$3({
    name: create$6().notRequired().nullable()
  }).notRequired().nullable(),
  waypoints: create$2().of(latlonSchema).notRequired(),
  nextWpIdx: create$5().notRequired().nullable(),
  lastWpIdx: create$5().notRequired().nullable(),
  stats: create$3({
    staminaMax: create$5().notRequired().nullable(),
    staminaTemp: create$2(
      create$3({
        exp: create$5().required(),
        value: create$5().required()
      })
    ).notRequired().nullable(),
    staminaMaxEffects: create$2(
      create$3({
        exp: create$5().required(),
        value: create$5().required()
      })
    ).notRequired().nullable()
  }).notRequired().nullable()
});
const getBoatInfosBoatEngineSchema = create$3({
  lastCalc: create$5().required(),
  lastFineWindUpdate: create$5().required(),
  lastWindUpdate: create$5().required(),
  nextCalc: create$5().required()
});
const getBoatInfosBoatTrackSchema = create$3({
  track: create$2(
    create$3({
      lat: create$5().required(),
      lon: create$5().required(),
      ts: create$5().required(),
      tag: create$6().required()
    })
  )
});
const numberRecord = create$3().test(
  "is-number-record",
  "must be a record<number>",
  (val) => val != null && typeof val === "object" && !Array.isArray(val) && Object.values(val).every((v) => typeof v === "number")
);
const gameSettingsSchema = create$3({
  scriptData: create$3({
    rc: create$6().oneOf(["ok"]).required(),
    settings: create$3({
      lastUpdateTS: create$5().required(),
      stamina: create$3({
        recovery: create$3({
          points: create$5().required(),
          loWind: create$5().required(),
          hiWind: create$5().required(),
          loTime: create$5().required(),
          hiTime: create$5().required()
        }).required(),
        tiredness: create$2().of(create$5().required()).length(2).required(),
        consumption: create$3({
          points: create$3({
            tack: create$5().required(),
            gybe: create$5().required(),
            sail: create$5().required()
          }).required(),
          // Dicts "clé numérique (stringifiée) -> number"
          winds: numberRecord.required(),
          boats: numberRecord.required()
        }).required(),
        impact: numberRecord.required()
      }).required(),
      inRaceConsumablesShop: create$2().of(
        create$3({
          id: create$6().required(),
          name: create$6().required()
        }).required()
      ).required()
    }).required()
  }).required()
});
create$3({
  race_id: create$5().required(),
  leg_num: create$5().required(),
  ts: create$5().required(),
  playerId: create$6().required()
});
const boatActionStartSchema = create$3({
  _id: create$3({
    user_id: create$6().required(),
    action: create$6().oneOf(["start"]).required(),
    ts: create$5().required(),
    race_id: create$5().required(),
    leg_num: create$5().required()
  })
});
const boatActionHeadingSchema = create$3({
  autoTwa: create$7().required(),
  deg: create$5().required(),
  isProg: create$7().required(),
  _id: create$3({
    user_id: create$6().required(),
    action: create$6().oneOf(["heading"]).required(),
    ts: create$5().required(),
    race_id: create$5().required(),
    leg_num: create$5().required()
  })
});
const boatActionSailSchema = create$3({
  qty: create$5().required().notRequired(),
  sail_id: create$5().required(),
  _id: create$3({
    user_id: create$6().required(),
    action: create$6().oneOf(["sail"]).required(),
    ts: create$5().required(),
    race_id: create$5().required(),
    leg_num: create$5().required()
  })
});
const boatActionWpSchema = create$3({
  pos: create$2(
    create$3({
      lat: create$5().required(),
      lon: create$5().required(),
      idx: create$5().required()
    })
  ),
  _id: create$3({
    user_id: create$6().required(),
    race_id: create$5().required(),
    leg_num: create$5().required(),
    ts: create$5().required(),
    action: create$6().oneOf(["wp"]).required()
  })
});
const boatActionSchema = create$8().test(
  "is-valid-action",
  "Invalid boat action format",
  function(value) {
    const schemas = [
      boatActionHeadingSchema,
      boatActionSailSchema,
      boatActionWpSchema,
      boatActionStartSchema
    ];
    for (const schema of schemas) {
      try {
        schema.validateSync(value, { strict: true });
        return true;
      } catch (_) {
      }
    }
    return this.createError({ message: "Aucune des formes attendues pour boatAction n’est valide" });
  }
);
create$2().of(boatActionSchema);
const boatActionResponseData = create$3({
  scriptData: create$3({
    actionTs: create$5().required(),
    serverTs: create$5().required(),
    boatActions: create$2(boatActionSchema)
  })
});
const getFleetRequestDataSchema = create$3({
  filter: create$6().required(),
  leg_num: create$5().required(),
  race_id: create$5().required(),
  user_id: create$6().required(),
  vip: create$7().required(),
  followed: create$2(create$6().required()).nullable(),
  teamMembers: create$2(create$6().required()).nullable()
});
const getFleetResponseSchema = create$3({
  res: create$2(
    create$3({
      userId: create$6().required(),
      displayName: create$6().notRequired(),
      type: create$6().required(),
      lastCalcDate: create$5().notRequired(),
      pos: latlonSchema.required(),
      heading: create$5().required(),
      speed: create$5().required(),
      state: create$6().required(),
      tws: create$5().notRequired().nullable(),
      twa: create$5().notRequired().nullable(),
      twd: create$5().notRequired().nullable(),
      sail: create$5().notRequired().nullable(),
      rank: create$5().notRequired().nullable(),
      state: create$6().required(),
      isFollowed: create$7().notRequired().nullable(),
      followed: create$7().notRequired().nullable(),
      team: create$7().notRequired().nullable(),
      type: create$6().notRequired()
    })
  )
});
const polarSchema = create$3({
  _id: create$5().required(),
  label: create$6().required(),
  globalSpeedRatio: create$5().required(),
  iceSpeedRatio: create$5().required(),
  autoSailChangeTolerance: create$5().required(),
  badSailTolerance: create$5().required(),
  maxSpeed: create$5().required(),
  weight: create$5().optional(),
  foil: create$3({
    speedRatio: create$5().required(),
    twaMin: create$5().required(),
    twaMax: create$5().required(),
    twaMerge: create$5().required(),
    twsMin: create$5().required(),
    twsMax: create$5().required(),
    twsMerge: create$5().required()
  }),
  hull: create$3({
    speedRatio: create$5().required()
  }),
  winch: create$3({
    tack: create$3({
      std: create$3({
        lw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        }),
        hw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        })
      }),
      pro: create$3({
        lw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        }),
        hw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        })
      })
    }),
    gybe: create$3({
      std: create$3({
        lw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        }),
        hw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        })
      }),
      pro: create$3({
        lw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        }),
        hw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        })
      })
    }),
    sailChange: create$3({
      std: create$3({
        lw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        }),
        hw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        })
      }),
      pro: create$3({
        lw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        }),
        hw: create$3({
          ratio: create$5().required(),
          timer: create$5().required()
        })
      })
    }),
    lws: create$5().required(),
    hws: create$5().required()
  }),
  tws: create$2(create$5().required()),
  twa: create$2(create$5().required()),
  sail: create$2(
    create$3({
      id: create$5().required(),
      name: create$6().required(),
      speed: create$2(create$2(create$5().required()))
    })
  ),
  _updatedAt: create$6().required()
});
create$3({
  scriptData: create$3({
    polar: polarSchema
  })
});
const ghostTrackRequestDataSchema = create$3({
  race_id: create$5().required(),
  leg_num: create$5().required(),
  playerId: create$6().required()
});
const ghostTrackResponseSchema = create$3({
  scriptData: create$3({
    leaderName: create$6().notRequired(),
    leaderId: create$6().notRequired(),
    leaderTrack: create$2(
      create$3({
        lat: create$5().required(),
        lon: create$5().required(),
        ts: create$5().required(),
        tag: create$6().required()
      })
    ).notRequired(),
    myTrack: create$2(
      create$3({
        lat: create$5().required(),
        lon: create$5().required(),
        ts: create$5().required(),
        tag: create$6().required()
      })
    ).notRequired()
  }).required()
});
function ingestPolars(msgBody) {
  var _a, _b;
  const polarsData = (_b = (_a = msgBody == null ? void 0 : msgBody.scriptData) == null ? void 0 : _a.extendsData) == null ? void 0 : _b.boatPolar;
  if (!polarsData)
    return;
  polarSchema.validate(polarsData, { stripUnknow: true }).then((polar) => {
    const dbOpe = [
      {
        type: "putOrUpdate",
        polars: [
          {
            id: polar._id,
            label: polar.label,
            globalSpeedRatio: polar.globalSpeedRatio,
            iceSpeedRatio: polar.iceSpeedRatio,
            autoSailChangeTolerance: polar.autoSailChangeTolerance,
            badSailTolerance: polar.badSailTolerance,
            maxSpeed: polar.maxSpeed,
            foil: polar.foil,
            hull: polar.hull,
            winch: polar.winch,
            tws: polar.tws,
            twa: polar.twa,
            sail: polar.sail,
            _updatedAt: polar._updatedAt
          }
        ],
        internal: [
          {
            id: "polarsUpdate",
            ts: Date.now()
          }
        ]
      }
    ];
    processDBOperations(dbOpe);
  }).catch((error) => {
    console.error("Account Validation Error :", error);
  });
}
async function ingestBoatInfos(boatData) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w;
  const ope = [];
  let rstTimer = false;
  let raceId = null;
  let legNum = null;
  let userId = null;
  try {
    const boatInfos = await getBoatInfosResponseSchema.validate(boatData, {
      stripUnknown: true,
      abortEarly: false
    });
    let currendId = await getData("internal", "lastLoggedUser");
    currendId = currendId == null ? void 0 : currendId.loggedUser;
    if ((_a = boatInfos.res) == null ? void 0 : _a.leg) {
      const l = boatInfos.res.leg;
      raceId = l.race_id;
      legNum = l.leg_num;
      ope.push({
        type: "putOrUpdate",
        legList: [
          {
            //          key:[l.race_id,l.leg_num], 
            id: `${l._id.race_id}-${l._id.num}`,
            raceId: l._id.race_id,
            legNum: l._id.num,
            status: l.status,
            legName: l.name,
            raceName: l.race.name,
            raceType: l.race.type,
            vsrLevel: l.vsrLevel,
            estimatedTime: l.estimatedTime,
            estimatedLength: l.estimatedLength,
            fineWinds: l.fineWinds,
            start: l.start,
            end: l.end,
            close: l.close,
            open: l.open,
            polar_id: (_b = l.boat) == null ? void 0 : _b.polar_id,
            boatName: (_c = l.boat) == null ? void 0 : _c.name,
            pilotBoatCredits: l.pilotBoatCredits,
            priceLevel: l.priceLevel,
            freeCredits: l.freeCredits,
            lastUpdate: l.lastUpdate,
            optionPrices: l.optionPrices,
            checkpoints: l.checkpoints,
            ice_limits: l.ice_limits,
            fineWinds: l.fineWinds,
            course: l.course,
            restrictedZones: l.restrictedZones ?? null
          }
        ],
        ...((_e = (_d = l.boat) == null ? void 0 : _d.stats) == null ? void 0 : _e.weight) && ((_f = l.boat) == null ? void 0 : _f.polar_id) && {
          polars: [
            {
              //                key: l.boat.polar_id,
              id: l.boat.polar_id,
              weight: l.boat.stats.weight
            }
          ]
        },
        internal: [
          {
            id: "legListUpdate",
            ts: Date.now()
          },
          ...((_h = (_g = l.boat) == null ? void 0 : _g.stats) == null ? void 0 : _h.weight) && ((_i = l.boat) == null ? void 0 : _i.polar_id) ? [{
            id: "polarsUpdate",
            ts: Date.now()
          }] : []
        ]
      });
    }
    if (((_j = boatInfos.res) == null ? void 0 : _j.bs) && !boatInfos.res.bs.lastCalcDate)
      boatInfos.res.bs.lastCalcDate = Date.now();
    if (((_k = boatInfos.res) == null ? void 0 : _k.leg) && ((_l = boatInfos.res) == null ? void 0 : _l.bs)) {
      const bs = boatInfos.res.bs;
      const l = boatInfos.res.leg;
      raceId = l.race_id;
      legNum = l.leg_num;
      userId = bs._id.user_id;
      currendId = bs._id.user_id;
      ope.push({
        type: "putOrUpdate",
        internal: [
          {
            id: "lastLoggedUser",
            loggedUser: bs._id.user_id
          },
          {
            id: "lastOpennedRace",
            lastOpennedRace: `${l._id.race_id}-${l._id.num}`,
            raceId: l._id.race_id,
            legNum: l._id.num
          },
          {
            id: "playersUpdate",
            ts: Date.now()
          },
          {
            id: "state",
            state: "raceOpened"
          }
        ],
        players: [
          {
            //            key: bs._id.user_id,   
            id: bs._id.user_id,
            name: bs.displayName,
            timestamp: Date.now()
            //                  isVip : validAccount.scriptData.isVIP && validAccount.scriptData.userSettings?.noAds,
            //            credits : bs.currency1
          }
        ]
      });
    }
    if ((_m = boatInfos.res) == null ? void 0 : _m.bs) {
      const bs = boatInfos.res.bs;
      raceId = bs._id.race_id;
      legNum = bs._id.leg_num;
      userId = bs._id.user_id;
      if (bs._id.user_id == currendId) {
        rstTimer = true;
        if (bs.fullOptions) {
          bs.options = [
            "foil",
            "heavy",
            "hull",
            "light",
            "reach",
            "radio",
            "winch",
            "comfortLoungePug",
            "magicFurler",
            "vrtexJacket"
          ];
        }
        ope.push({
          type: "putOrUpdate",
          legPlayersInfos: [
            {
              id: bs._id.race_id + "_" + bs._id.leg_num + "_" + bs._id.user_id + "_" + bs.lastCalcDate,
              userId: bs._id.user_id,
              iteDate: bs.lastCalcDate,
              raceId: bs._id.race_id,
              legNum: bs._id.leg_num,
              distanceFromStart: bs.distanceFromStart,
              distanceToEnd: bs.distanceToEnd,
              gateGroupCounters: bs.gateGroupCounters,
              hasPermanentAutoSails: bs.hasPermanentAutoSails,
              hdg: bs.heading,
              legStartDate: bs.legStartDate,
              pos: bs.pos,
              rank: bs.rank,
              sail: bs.sail,
              isRegulated: bs.isRegulated ?? null,
              speed: bs.speed,
              stamina: bs.stamina,
              startDate: bs.startDate,
              state: bs.state,
              tsEndOfAutoSail: bs.tsEndOfAutoSail ?? null,
              tsEndOfSailChange: bs.tsEndOfSailChange ?? null,
              tsEndOfGybe: bs.tsEndOfGybe ?? null,
              tsEndOfTack: bs.tsEndOfTack ?? null,
              twa: bs.twa,
              twaAuto: bs.twaAuto ?? null,
              twd: bs.twd,
              tws: bs.tws,
              aground: bs.aground,
              badSail: bs.badSail ?? null,
              waypoints: bs.waypoints ?? null,
              nextWpIdx: bs.nextWpIdx ?? null,
              lastWpIdx: bs.lastWpIdx ?? null,
              stats: bs.stats,
              choice: true,
              branding: bs.branding
            }
          ],
          ...bs.options && bs.options.length > 0 && {
            legPlayersOptions: [
              {
                raceId: bs._id.race_id,
                legNum: bs._id.leg_num,
                userId: bs._id.user_id,
                id: bs._id.race_id + "_" + bs._id.leg_num + "_" + bs._id.user_id + "_" + bs.lastCalcDate,
                options: {
                  foil: ((_n = bs.options) == null ? void 0 : _n.includes("foil")) ?? false,
                  heavy: ((_o = bs.options) == null ? void 0 : _o.includes("heavy")) ?? false,
                  hull: ((_p = bs.options) == null ? void 0 : _p.includes("hull")) ?? false,
                  light: ((_q = bs.options) == null ? void 0 : _q.includes("light")) ?? false,
                  reach: ((_r = bs.options) == null ? void 0 : _r.includes("reach")) ?? false,
                  winch: ((_s = bs.options) == null ? void 0 : _s.includes("winch")) ?? false,
                  comfortLoungePug: ((_t = bs.options) == null ? void 0 : _t.includes("comfortLoungePug")) ?? false,
                  magicFurler: ((_u = bs.options) == null ? void 0 : _u.includes("magicFurler")) ?? false,
                  vrtexJacket: ((_v = bs.options) == null ? void 0 : _v.includes("vrtexJacket")) ?? false,
                  radio: ((_w = bs.options) == null ? void 0 : _w.includes("radio")) ?? false
                },
                timestamp: bs.lastCalcDate
              }
            ]
          },
          internal: [
            {
              id: "legPlayersInfosUpdate",
              ts: Date.now()
            },
            ...bs.options && bs.options.length > 0 ? [{
              id: "legPlayersOptionsUpdate",
              ts: Date.now()
            }] : []
          ]
        });
      } else {
        ope.push({
          type: "putOrUpdate",
          legFleetInfos: [
            {
              id: bs._id.race_id + "_" + bs._id.leg_num + "_" + bs._id.user_id + "_" + bs.lastCalcDate,
              userId: bs._id.user_id,
              iteDate: bs.lastCalcDate,
              raceId: bs._id.race_id,
              legNum: bs._id.leg_num,
              distanceFromStart: bs.distanceFromStart,
              distanceToEnd: bs.distanceToEnd,
              hasPermanentAutoSails: bs.hasPermanentAutoSails,
              hdg: bs.heading,
              pos: bs.pos,
              rank: bs.rank ?? null,
              sail: bs.sail,
              isRegulated: bs.isRegulated ?? null,
              speed: bs.speed,
              state: bs.state,
              twa: bs.twa,
              twaAuto: bs.twaAuto ?? null,
              twd: bs.twd,
              tws: bs.tws,
              aground: bs.aground ?? null,
              badSail: bs.badSail ?? null,
              choice: true,
              ...bs.isFollowed ? { isFollowed: bs.isFollowed } : {},
              ...bs.followed ? { followed: bs.followed } : {},
              ...bs.team ? { team: bs.team } : {}
            }
          ],
          players: [
            {
              id: bs._id.user_id,
              name: bs.displayName,
              timestamp: Date.now()
            }
          ],
          internal: [
            {
              id: "legFleetInfosUpdate",
              ts: Date.now()
            },
            {
              id: "playersUpdate",
              ts: Date.now()
            }
          ]
        });
      }
      if (boatInfos.res.track) {
        ope.push({
          type: "putOrUpdate",
          playersTracks: [
            {
              raceId,
              legNum,
              userId,
              type: "fleet",
              track: boatInfos.res.track
            }
          ],
          internal: [
            {
              id: "playersTracksUpdate",
              ts: Date.now()
            }
          ]
        });
      }
    }
    processDBOperations(ope);
    return {
      rstTimer,
      raceId,
      legNum,
      userId
    };
  } catch (error) {
    console.error("boat infos Validation Error :", error);
    return {
      rstTimer: false,
      raceId: null,
      legNum: null,
      userId: null
    };
  }
}
function ingestAccountDetails(account) {
  accountDetailsDataModel.validate(account, { stripUnknow: true }).then((validAccount) => {
    var _a, _b, _c, _d;
    const dbOpe = [
      {
        type: "putOrUpdate",
        internal: [
          {
            id: "state",
            state: "playerConnected"
          },
          {
            id: "playersUpdate",
            ts: Date.now()
          },
          {
            //                        key: 'lastLoggedUser',
            id: "lastLoggedUser",
            loggedUser: validAccount.userId
          },
          ...((_a = validAccount.scriptData.team) == null ? void 0 : _a.id) ? [{
            id: "teamsUpdate",
            ts: Date.now()
          }] : []
        ],
        players: [
          {
            //                        key: validAccount.userId,  
            id: validAccount.userId,
            name: validAccount.displayName,
            teamId: ((_b = validAccount.scriptData.team) == null ? void 0 : _b.id) ?? null,
            timestamp: Date.now(),
            isVip: validAccount.scriptData.isVIP && ((_c = validAccount.scriptData.userSettings) == null ? void 0 : _c.noAds),
            credits: validAccount.currency1
          }
        ],
        ...((_d = validAccount.scriptData.team) == null ? void 0 : _d.id) && {
          teams: [
            {
              //                            key: validAccount.scriptData.team.id,  
              id: validAccount.scriptData.team.id,
              name: validAccount.scriptData.team.name
              // Ajoute d'autres propriétés si nécessaire
            }
          ]
        }
      }
    ];
    processDBOperations(dbOpe);
    return true;
  }).catch((error) => {
    console.error("Account Validation Error :", error);
    return false;
  });
}
function ingestEndLegPrep(endLegPrep) {
  endLegPrepDataModel.validate(endLegPrep, { stripUnknown: true, abortEarly: false }).then((validData) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const l = validData.scriptData.leg;
    const dbOpe = [
      {
        type: "putOrUpdate",
        legList: [
          {
            //            key : [l._id.race_id,l._id.num],
            id: `${l._id.race_id}-${l._id.num}`,
            raceId: l._id.race_id,
            legNum: l._id.num,
            status: l.status,
            legName: l.name,
            raceName: l.race.name,
            raceType: l.race.type,
            vsrLevel: l.vsrLevel,
            estimatedTime: l.estimatedTime,
            estimatedLength: l.estimatedLength,
            fineWinds: l.fineWinds,
            start: l.start,
            end: l.end,
            close: l.close,
            open: l.open,
            polar_id: (_a = l.boat) == null ? void 0 : _a.polar_id,
            boatName: (_b = l.boat) == null ? void 0 : _b.name,
            pilotBoatCredits: l.pilotBoatCredits,
            priceLevel: l.priceLevel,
            freeCredits: l.freeCredits,
            lastUpdate: l.lastUpdate,
            optionPrices: l.optionPrices,
            checkpoints: l.checkpoints,
            ice_limits: l.ice_limits,
            fineWinds: l.fineWinds,
            course: l.course,
            restrictedZones: l.restrictedZones
          },
          {
            //              key : 'update',
            id: "update",
            update: (/* @__PURE__ */ new Date()).toISOString()
          }
        ],
        ...((_d = (_c = l.boat) == null ? void 0 : _c.stats) == null ? void 0 : _d.weight) && ((_e = l.boat) == null ? void 0 : _e.polar_id) && {
          polars: [
            {
              //                key: l.boat.polar_id,
              id: l.boat.polar_id,
              weight: l.boat.stats.weight
            }
          ]
        },
        internal: [
          {
            id: "legListUpdate",
            ts: Date.now()
          },
          ...((_g = (_f = l.boat) == null ? void 0 : _f.stats) == null ? void 0 : _g.weight) && ((_h = l.boat) == null ? void 0 : _h.polar_id) ? [{
            id: "polarsUpdate",
            ts: Date.now()
          }] : [],
          {
            id: "lastOpennedRace",
            lastOpennedRace: `${l._id.race_id}-${l._id.num}`,
            raceId: l._id.race_id,
            legNum: l._id.num
          },
          {
            id: "state",
            state: "raceOpened"
          }
        ]
      }
    ];
    processDBOperations(dbOpe);
  }).catch((err) => {
    console.error("Validation failed:", err.errors);
  });
}
function ingestRaceList(legListData) {
  var _a, _b, _c, _d, _e, _f;
  try {
    const validData = legListDataModel.validateSync(legListData, {
      stripUnknown: true,
      abortEarly: false
    });
    const races = ((_a = validData.scriptData) == null ? void 0 : _a.res) || [];
    const legList = [];
    const polars = [];
    let validCount = 0;
    let errorCount = 0;
    for (const r of races) {
      try {
        const validated = raceSchema.validateSync(r, { stripUnknown: true });
        const idInfo = validated._id || {};
        legList.push({
          //         key : [validated._id.race_id,validated._id.num],
          id: `${validated.raceId}-${validated.legNum}`,
          raceId: validated.raceId,
          legNum: validated.legNum,
          raceName: validated.raceName,
          legName: validated.legName,
          estimatedTime: validated.estimatedTime,
          estimatedLength: validated.estimatedLength,
          status: validated.status,
          vsrLevel: validated.vsrRank,
          priceLevel: validated.priceLevel,
          freeCredits: validated.freeCredits,
          adStartCredits: validated.adStartCredits,
          pilotBoatCredits: validated.pilotBoatCredits,
          lastUpdate: validated.lastUpdate,
          fineWinds: validated.fineWinds,
          nbTotalSkippers: validated.nbTotalSkippers,
          boatsAtSea: validated.boatsAtSea,
          arrived: validated.arrived,
          raceType: validated.raceType,
          limitedAccess: validated.limitedAccess,
          polar_id: (_b = validated.boat) == null ? void 0 : _b.polar_id,
          boatName: (_c = validated.boat) == null ? void 0 : _c.name,
          start: validated.start,
          end: validated.end
        });
        if (((_e = (_d = validated.boat) == null ? void 0 : _d.stats) == null ? void 0 : _e.weight) && ((_f = validated.boat) == null ? void 0 : _f.polar_id)) {
          polars.push(
            {
              //              key: validated.boat.polar_id,
              id: validated.boat.polar_id,
              weight: validated.boat.stats.weight
            }
          );
        }
        validCount++;
      } catch (validationErr) {
        if (cfg.debugIngester)
          ;
        if (cfg.debugIngester)
          ;
        errorCount++;
      }
    }
    if (legList.length > 1) {
      const dbOpe = [
        {
          type: "putOrUpdate",
          legList,
          polars,
          internal: [
            {
              id: "legListUpdate",
              ts: Date.now()
            },
            ...polars.length > 1 ? [{
              id: "polarsUpdate",
              ts: Date.now()
            }] : []
          ]
        }
      ];
      processDBOperations(dbOpe);
    }
    if (cfg.debugIngester)
      ;
  } catch (err) {
    console.error("❌ Erreur globale dans legListDataModel :", err.errors);
  }
}
async function ingestFleetData(request, response) {
  try {
    const req = getFleetRequestDataSchema.validateSync(request, {
      stripUnknown: true
    });
    const filteredResponse = {
      ...response,
      res: (response.res || []).filter((p) => p.userId !== "pilotBoat").map((p) => ({
        ...p,
        state: p.type === "real" && p.state === null ? "racing" : p.state
      }))
    };
    const res = getFleetResponseSchema.validateSync(filteredResponse, {
      stripUnknown: true
    });
    const connectedUserInfos = await getData("players", req.user_id);
    let currentTeamId = (connectedUserInfos == null ? void 0 : connectedUserInfos.teamId) ? connectedUserInfos.teamId : null;
    const legFleetInfos = res.res.map((p) => ({
      //      key:[req.race_id,req.leg_num,p.userId,p.lastCalcDate],   
      id: `${req.race_id}-${req.leg_num}-${p.userId}-${p.lastCalcDate}`,
      raceId: req.race_id,
      legNum: req.leg_num,
      userId: p.userId,
      iteDate: p.lastCalcDate ? p.lastCalcDate : Date.now(),
      type: p.type,
      hdg: p.heading,
      speed: p.speed,
      pos: p.pos,
      tws: p.tws,
      twa: p.twa,
      twd: p.twd,
      sail: p.sail ?? null,
      rank: p.rank ?? null,
      state: p.state,
      type: p.type,
      ...p.isFollowed ? { isFollowed: p.isFollowed } : {},
      ...p.followed ? { followed: p.followed } : {},
      ...p.team ? { team: p.team } : {}
    }));
    const players = res.res.map((p) => ({
      id: p.userId,
      name: p.displayName,
      timestamp: Date.now(),
      ...p.team && currentTeamId ? { teamId: currentTeamId } : {}
    }));
    const dbOpe = [
      {
        type: "putOrUpdate",
        legFleetInfos,
        players,
        internal: [
          {
            id: "legFleetInfosUpdate",
            ts: Date.now()
          },
          {
            id: "playersUpdate",
            ts: Date.now()
          }
        ]
      }
    ];
    processDBOperations(dbOpe);
    if (cfg.debugIngester)
      ;
  } catch (err) {
    console.error("❌ Fleet ingest failed:", err.errors);
  }
}
function ingestGameSetting(gameSetting) {
  gameSettingsSchema.validate(gameSetting, { stripUnknown: true }).then((validGameSetting) => {
    var _a, _b;
    const stamina = (_b = (_a = validGameSetting.scriptData) == null ? void 0 : _a.settings) == null ? void 0 : _b.stamina;
    const dbOpe = [
      {
        type: "putOrUpdate",
        ...stamina && {
          internal: [
            {
              //              key: "paramStamina",
              id: "paramStamina",
              paramStamina: stamina
            },
            {
              id: "paramStaminaUpdate",
              ts: Date.now()
            }
          ]
        }
      }
    ];
    processDBOperations(dbOpe);
    return true;
  }).catch((error) => {
    console.error("Account Validation Error :", error);
    return false;
  });
}
function ingestBoatAction(boatActionTxt) {
  boatActionResponseData.validate(boatActionTxt, { stripUnknown: true }).then((ValidboatActionTxt) => {
    const { boatActions } = ValidboatActionTxt.scriptData;
    const raceId = boatActions[0]._id.race_id;
    const legNum = boatActions[0]._id.leg_num;
    const userId = boatActions[0]._id.user_id;
    const userAction = {};
    const prog = {
      order: [],
      wp: []
    };
    for (const action of boatActions) {
      if ("sail_id" in action) {
        userAction.sail = {
          autoSails: action.sail_id >= 10 ? true : false,
          sailId: action.sail_id
        };
      } else if ("isProg" in action) {
        const order = {
          autoTwa: action.autoTwa,
          deg: action.deg,
          timestamp: action._id.ts
        };
        if (!action.isProg)
          userAction.heading = order;
        else
          prog.order.push(order);
      } else if ("pos" in action) {
        action.pos.forEach(({ lat, lon, idx }) => {
          const order = {
            lat,
            lon,
            idx
          };
          prog.wp.push(order);
        });
        prog.wp.sort((a, b) => a.idx - b.idx);
      }
    }
    if (prog.order) {
      prog.order.sort((a, b) => a.timestamp - b.timestamp);
    }
    const dbOpe = [
      {
        type: "putOrUpdate",
        legPlayersOrder: [
          ..."sail" in userAction ? [{
            raceId,
            legNum,
            userId,
            serverTs: ValidboatActionTxt.scriptData.serverTs,
            iteDate: ValidboatActionTxt.scriptData.actionTs,
            action: { type: "sail", action: userAction.sail }
          }] : [],
          ..."heading" in userAction ? [{
            raceId,
            legNum,
            userId,
            serverTs: ValidboatActionTxt.scriptData.serverTs,
            iteDate: ValidboatActionTxt.scriptData.actionTs,
            action: { type: "order", action: userAction.heading }
          }] : [],
          ...prog.order.length ? [{
            raceId,
            legNum,
            userId,
            serverTs: ValidboatActionTxt.scriptData.serverTs,
            iteDate: ValidboatActionTxt.scriptData.actionTs,
            action: { type: "prog", action: prog.order }
          }] : [],
          ...prog.wp.length ? [{
            raceId,
            legNum,
            userId,
            serverTs: ValidboatActionTxt.scriptData.serverTs,
            iteDate: ValidboatActionTxt.scriptData.actionTs,
            action: { type: "wp", action: prog.wp }
          }] : []
        ],
        ...("sail" in userAction || "heading" in userAction || prog.order.length || prog.wp.length) && {
          internal: [
            {
              id: "legPlayersOrderUpdate",
              ts: Date.now()
            }
          ]
        }
      }
    ];
    processDBOperations(dbOpe);
    return true;
  }).catch((error) => {
    console.error("boatAction Validation Error :", error);
    return false;
  });
}
async function ingestGhostTrack(request, response) {
  const req = ghostTrackRequestDataSchema.validateSync(request, {
    stripUnknown: true
  });
  ghostTrackResponseSchema.validate(response, { stripUnknown: true }).then((validGhostTracks) => {
    var _a, _b, _c, _d;
    const raceId = req == null ? void 0 : req.race_id;
    const legNum = req == null ? void 0 : req.leg_num;
    if (!raceId || !legNum)
      return;
    const leaderName = (_a = validGhostTracks == null ? void 0 : validGhostTracks.scriptData) == null ? void 0 : _a.leaderName;
    const leaderId = (_b = validGhostTracks == null ? void 0 : validGhostTracks.scriptData) == null ? void 0 : _b.leaderId;
    const leaderTrack = (_c = validGhostTracks == null ? void 0 : validGhostTracks.scriptData) == null ? void 0 : _c.leaderTrack;
    const ghostPlayerId = req == null ? void 0 : req.playerId;
    const ghostPlayerTrack = (_d = validGhostTracks == null ? void 0 : validGhostTracks.scriptData) == null ? void 0 : _d.myTrack;
    const dbOpe = [
      {
        type: "putOrUpdate",
        ...leaderId && leaderTrack && {
          players: [
            {
              id: leaderId,
              name: leaderName,
              timestamp: Date.now()
            }
          ],
          playersTracks: [
            {
              raceId,
              legNum,
              userId: leaderId,
              type: "leader",
              track: leaderTrack
            }
          ]
        },
        ...ghostPlayerTrack && {
          playersTracks: [
            {
              raceId,
              legNum,
              userId: ghostPlayerId,
              type: "ghost",
              track: ghostPlayerTrack
            }
          ]
        },
        ...(ghostPlayerTrack || leaderId && leaderTrack) && {
          internal: [
            {
              id: "playersTracksUpdate",
              ts: Date.now()
            },
            ...ghostPlayerTrack && {
              id: "playersUpdate",
              ts: Date.now()
            }
          ]
        }
      }
    ];
    processDBOperations(dbOpe);
    return true;
  }).catch((error) => {
    console.error("ghostTrack validation Error :", error);
    return false;
  });
}
function theoreticalSpeed(polar, options = [], tws, twa, sailId = null) {
  if (polar == void 0 || tws == void 0)
    return void 0;
  let foil = foilingFactor(options, tws, twa, polar.foil);
  let foiling = (foil - 1) * 100 / (polar.foil.speedRatio - 1);
  let hull = (options == null ? void 0 : options.hull) ? 1.003 : 1;
  let ratio = polar.globalSpeedRatio;
  let twsLookup = fractionStep(tws, polar.tws);
  let twaLookup = fractionStep(twa, polar.twa);
  const maxSpd = maxSpeed(options, twsLookup, twaLookup, polar.sail);
  const spd = sailId != null ? pSpeed(twaLookup, twsLookup, polar.sail[sailId].speed) : 0;
  return {
    "speed": sailId != null ? roundTo(spd * foil * hull * ratio, 3) : roundTo(maxSpd.speed * foil * hull * ratio, 3),
    "sail": sailId != null ? sailId : maxSpd.sail,
    "foiling": foiling
  };
}
function maxSpeed(options, iS, iA, sailDefs) {
  let maxSpeed2 = 0;
  let maxSail = "";
  for (const sailDef of sailDefs) {
    if (sailDef.id === 1 || sailDef.id === 2 || sailDef.id === 3 && (options == null ? void 0 : options.heavy) || sailDef.id === 4 && (options == null ? void 0 : options.light) || sailDef.id === 5 && (options == null ? void 0 : options.reach) || sailDef.id === 6 && (options == null ? void 0 : options.heavy) || sailDef.id === 7 && (options == null ? void 0 : options.light)) {
      let speed = pSpeed(iA, iS, sailDef.speed);
      if (speed > maxSpeed2) {
        maxSpeed2 = speed;
        maxSail = sailDef.id;
      }
    }
  }
  return {
    speed: maxSpeed2,
    sail: maxSail
  };
}
function pSpeed(iA, iS, speeds) {
  return bilinear(
    iA.fraction,
    iS.fraction,
    speeds[iA.index - 1][iS.index - 1],
    speeds[iA.index][iS.index - 1],
    speeds[iA.index - 1][iS.index],
    speeds[iA.index][iS.index]
  );
}
function bilinear(x, y, f00, f10, f01, f11) {
  return f00 * (1 - x) * (1 - y) + f10 * x * (1 - y) + f01 * (1 - x) * y + f11 * x * y;
}
function foilingFactor(options, tws, twa, foil) {
  let speedSteps = [0, foil.twsMin - foil.twsMerge, foil.twsMin, foil.twsMax, foil.twsMax + foil.twsMerge, Infinity];
  let twaSteps = [0, foil.twaMin - foil.twaMerge, foil.twaMin, foil.twaMax, foil.twaMax + foil.twaMerge, Infinity];
  let foilMat = [
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, foil.speedRatio, foil.speedRatio, 1, 1],
    [1, 1, foil.speedRatio, foil.speedRatio, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1]
  ];
  if (options == null ? void 0 : options.foil) {
    let iS = fractionStep(tws, speedSteps);
    let iA = fractionStep(twa, twaSteps);
    return bilinear(
      iA.fraction,
      iS.fraction,
      foilMat[iA.index - 1][iS.index - 1],
      foilMat[iA.index][iS.index - 1],
      foilMat[iA.index - 1][iS.index],
      foilMat[iA.index][iS.index]
    );
  } else {
    return 1;
  }
}
function fractionStep(value, steps) {
  let absVal = Math.abs(value);
  let index = 0;
  while (index < steps.length && steps[index] <= absVal) {
    index++;
  }
  if (index >= steps.length) {
    return {
      index: steps.length - 1,
      fraction: 1
    };
  }
  return {
    index,
    fraction: (absVal - steps[index - 1]) / (steps[index] - steps[index - 1])
  };
}
function isSailisInOptions(sailId, options) {
  switch (sailId) {
    default:
    case 1:
    case 2:
      return true;
    case 3:
    case 6:
      return options == null ? void 0 : options.heavy;
    case 4:
    case 7:
      return options == null ? void 0 : options.light;
    case 5:
      return options == null ? void 0 : options.reach;
  }
}
const computeEnergyLoose = (polar, paramStamina, options = {}, tws) => {
  if (!polar) {
    return { gybe: null, tack: null, sail: null };
  }
  const { consumption = {} } = paramStamina ?? {};
  const { points = {}, winds: windsCfg = {}, boats: boatsCfg = null } = consumption;
  const computeStaminaLoose = (basePt, type = "M") => {
    const getBoatCoefficient = (boatWeightKg) => {
      if (!boatsCfg)
        return -1;
      const keys = Object.keys(boatsCfg).map(Number).sort((a, b) => a - b);
      if (!keys.length)
        return -1;
      if (boatWeightKg <= keys[0])
        return boatsCfg[keys[0]];
      if (boatWeightKg >= keys[keys.length - 1])
        return boatsCfg[keys[keys.length - 1]];
      let lower = keys[0];
      keys[0];
      for (let i = 0; i < keys.length; i++) {
        if (boatWeightKg >= keys[i])
          lower = keys[i];
        if (boatWeightKg < keys[i]) {
          keys[i];
          break;
        }
      }
      return boatsCfg[lower];
    };
    const getWindConsumptionFactor = (windSpeed) => {
      const vrJacketWinds = { 0: 1, 10: 1, 20: 1.2, 30: 1.8 };
      const windsTable = (options == null ? void 0 : options.vrtexJacket) ? vrJacketWinds : windsCfg;
      const keys = Object.keys(windsTable).map(Number).sort((a, b) => a - b);
      if (!keys.length)
        return 1;
      if (windSpeed <= keys[0])
        return windsTable[keys[0]];
      if (windSpeed >= keys[keys.length - 1])
        return windsTable[keys[keys.length - 1]];
      let lower = keys[0], upper = keys[0];
      for (let i = 0; i < keys.length; i++) {
        if (windSpeed >= keys[i])
          lower = keys[i];
        if (windSpeed < keys[i]) {
          upper = keys[i];
          break;
        }
      }
      const ratio = (windSpeed - lower) / (upper - lower);
      return windsTable[lower] + ratio * (windsTable[upper] - windsTable[lower]);
    };
    const boatCoeff = (polar == null ? void 0 : polar.weight) ? getBoatCoefficient(polar.weight / 1e3) : 1;
    let stamina = basePt * boatCoeff;
    if (type === "S" && (options == null ? void 0 : options.magicFurler)) {
      stamina *= 0.8;
    }
    const factor = getWindConsumptionFactor(tws);
    return (factor * stamina).toFixed(2);
  };
  return {
    gybe: computeStaminaLoose(points.gybe),
    tack: computeStaminaLoose(points.tack),
    sail: computeStaminaLoose(points.sail, "S")
  };
};
const computeEnergyRecovery = (pts, tws, paramStamina, options = {}) => {
  if (!tws)
    return "-";
  let ltws = paramStamina.recovery.loWind;
  let htws = paramStamina.recovery.hiWind;
  let lRecovery = paramStamina.recovery.loTime * 60;
  let hRecovery = paramStamina.recovery.hiTime * 60;
  let minByPt = 1;
  if (tws <= ltws) {
    minByPt = lRecovery;
  } else if (tws >= htws) {
    minByPt = hRecovery;
  } else {
    let aFactor = (hRecovery + lRecovery) / 2;
    let bFactor = (hRecovery - lRecovery) / 2;
    minByPt = aFactor - Math.cos((tws - ltws) / (htws - ltws) * Math.PI) * bFactor;
  }
  if (options == null ? void 0 : options.comfortLoungePug)
    minByPt *= 0.8;
  return (pts / Number(paramStamina.recovery.points) * minByPt / 60).toFixed(0);
};
const computeEnergyPenalitiesFactor = (stamina) => {
  let coeff = stamina * -0.015 + 2;
  return coeff ? coeff < 0.5 ? 0.5 : coeff : 1;
};
function manoeuveringPenalities(polar, ite, stamina, options) {
  if (!polar || !ite)
    return {
      "gybe": null,
      "tack": null,
      "sail": null,
      "staminaFactor": null
    };
  const penalty = (speed2, options2, fraction2, spec, boatcoeff, type = "M") => {
    if (!spec) {
      return {
        "time": null,
        "dist": null
      };
    }
    if (options2 == null ? void 0 : options2.winch) {
      spec = spec.pro;
    } else {
      spec = spec.std;
    }
    let time = (spec.lw.timer + (spec.hw.timer - spec.lw.timer) * fraction2) * boatcoeff;
    if (type == "S") {
      if (options2 == null ? void 0 : options2.magicFurler) {
        time *= 0.8;
      }
    }
    let dist = speed2 * time / 3600;
    return {
      "time": time.toFixed(),
      "dist": (dist * (1 - spec.lw.ratio)).toFixed(3)
    };
  };
  let winch = polar.winch;
  let tws = ite.tws;
  let speed = ite.speed;
  let fraction;
  if (winch.lws <= tws && tws <= winch.hws) {
    fraction = 0.5 - Math.cos((tws - winch.lws) / (winch.hws - winch.lws) * Math.PI) * 0.5;
  } else if (tws < winch.lws) {
    fraction = 0;
  } else {
    fraction = 1;
  }
  let boatCoeff = 1;
  if (stamina) {
    boatCoeff = computeEnergyPenalitiesFactor(stamina);
  }
  return {
    gybe: penalty(speed, options, fraction, winch.gybe, boatCoeff),
    tack: penalty(speed, options, fraction, winch.tack, boatCoeff),
    sail: penalty(speed, options, fraction, winch.sailChange, boatCoeff, "S"),
    staminaFactor: boatCoeff
  };
}
function bestVMG(tws, polars, options, sailId, currTwa) {
  var _a, _b, _c, _d;
  const best = {
    vmgUp: 0,
    twaUp: 0,
    sailUp: 0,
    vmgDown: 0,
    twaDown: 0,
    sailDown: 0,
    bspeed: 0,
    btwa: 0,
    sailBSpeed: 0,
    sailTWAMin: 0,
    sailTWAMax: 0,
    sailTWSMin: 0,
    sailTWSMax: 0
  };
  if (!((_a = polars == null ? void 0 : polars.tws) == null ? void 0 : _a.length) || !((_b = polars == null ? void 0 : polars.twa) == null ? void 0 : _b.length) || !((_c = polars == null ? void 0 : polars.sail) == null ? void 0 : _c.length))
    return best;
  const DEG2RAD = Math.PI / 180;
  const tol = 0.014;
  const inOpts = (id) => isSailisInOptions(id, options);
  const safeStep = (step, arrLen) => ({
    index: Math.min(Math.max(step.index, 1), arrLen - 1),
    fraction: Math.min(Math.max(step.fraction, 0), 1)
  });
  const hRatio = (options == null ? void 0 : options.hull) ? ((_d = polars == null ? void 0 : polars.hull) == null ? void 0 : _d.speedRatio) ?? 1 : 1;
  const sStep = safeStep(fractionStep(tws, polars.tws), polars.tws.length);
  let twaDetect = [];
  for (let twaIndex = 250; twaIndex < 1800; twaIndex++) {
    const aTWA = twaIndex / 10;
    const aStepRaw = fractionStep(aTWA, polars.twa);
    const aStep = safeStep(aStepRaw, polars.twa.length);
    let actualSailSpd = 0;
    let bestSpdAtThisTWA = 0;
    let bestSpdSailAtThisTWA = null;
    for (const sail of polars.sail) {
      if (!inOpts(sail.id))
        continue;
      const f = foilingFactor(options, tws, polars.twa[aStep.index], polars.foil);
      const rspeed = bilinear(
        aStep.fraction,
        sStep.fraction,
        sail.speed[aStep.index - 1][sStep.index - 1],
        sail.speed[aStep.index][sStep.index - 1],
        sail.speed[aStep.index - 1][sStep.index],
        sail.speed[aStep.index][sStep.index]
      );
      const speed = rspeed * f * hRatio;
      const vmg = speed * Math.cos(aTWA * DEG2RAD);
      if (vmg > best.vmgUp) {
        best.vmgUp = vmg;
        best.twaUp = aTWA;
        best.sailUp = sail.id;
      } else if (vmg < best.vmgDown) {
        best.vmgDown = vmg;
        best.twaDown = aTWA;
        best.sailDown = sail.id;
      }
      if (speed > best.bspeed) {
        best.bspeed = speed;
        best.btwa = aTWA;
        best.sailBSpeed = sail.id;
      }
      if (speed > bestSpdAtThisTWA) {
        bestSpdAtThisTWA = speed;
        bestSpdSailAtThisTWA = sail.id;
      }
      if (sail.id === sailId)
        actualSailSpd = speed;
    }
    if (actualSailSpd >= bestSpdAtThisTWA && bestSpdSailAtThisTWA === sailId || actualSailSpd * (1 + tol) > bestSpdAtThisTWA && bestSpdSailAtThisTWA !== sailId) {
      twaDetect.push(aTWA);
    }
  }
  if (twaDetect.length) {
    best.sailTWAMin = twaDetect.reduce((m, v) => Math.min(m, v), Infinity);
    best.sailTWAMax = twaDetect.reduce((m, v) => Math.max(m, v), -Infinity);
  }
  const aStep2 = safeStep(fractionStep(currTwa, polars.twa), polars.twa.length);
  let twsDetect = [];
  for (let twsIndex = 100; twsIndex < 4300; twsIndex++) {
    const aTWS = twsIndex / 100;
    const sStep2 = safeStep(fractionStep(aTWS, polars.tws), polars.tws.length);
    let actualSailSpd = 0;
    let bestSpdAtThisTWS = 0;
    let bestSpdSailAtThisTWS = null;
    for (const sail of polars.sail) {
      if (!inOpts(sail.id))
        continue;
      const f = foilingFactor(options, aTWS, polars.twa[aStep2.index], polars.foil);
      const rspeed = bilinear(
        aStep2.fraction,
        sStep2.fraction,
        sail.speed[aStep2.index - 1][sStep2.index - 1],
        sail.speed[aStep2.index][sStep2.index - 1],
        sail.speed[aStep2.index - 1][sStep2.index],
        sail.speed[aStep2.index][sStep2.index]
      );
      const speed = rspeed * f * hRatio;
      if (speed > bestSpdAtThisTWS) {
        bestSpdAtThisTWS = speed;
        bestSpdSailAtThisTWS = sail.id;
      }
      if (sail.id === sailId)
        actualSailSpd = speed;
    }
    if (actualSailSpd >= bestSpdAtThisTWS && bestSpdSailAtThisTWS === sailId || actualSailSpd * (1 + tol) > bestSpdAtThisTWS && bestSpdSailAtThisTWS !== sailId) {
      twsDetect.push(aTWS);
    }
  }
  if (twsDetect.length) {
    best.sailTWSMin = twsDetect.reduce((m, v) => Math.min(m, v), Infinity);
    best.sailTWSMax = twsDetect.reduce((m, v) => Math.max(m, v), -Infinity);
  }
  return best;
}
async function computeFleetPlayerIte(legInfos, latest, playerOption, currentPlayerLatest, polar) {
  var _a, _b;
  if (!latest || !currentPlayerLatest || !polar)
    return;
  const metaDash = latest.metaDash ? latest.metaDash : [];
  const playerPos = latest.pos;
  const currentPlayerPos = currentPlayerLatest.pos;
  metaDash.DTU = roundTo(gcDistance(currentPlayerPos, playerPos), 1);
  metaDash.BFU = roundTo(courseAngle(currentPlayerPos.lat, currentPlayerPos.lon, playerPos.lat, playerPos.lon) * 180 / Math.PI, 1);
  let ad = metaDash.BFU - currentPlayerLatest.hdg + 90;
  if (ad < 0)
    ad += 360;
  if (ad > 360)
    ad -= 360;
  if (ad > 180)
    metaDash.DTU = -metaDash.DTU;
  metaDash.dtf = latest.distanceToEnd;
  metaDash.dtfC = legInfos.end ? gcDistance(latest.pos, legInfos.end) : null;
  if (!metaDash.dtf || metaDash.dtf == null) {
    metaDash.dtf = metaDash.dtfC;
  }
  metaDash.raceTime = null;
  if (legInfos.type == "record") {
    if (latest.state == "racing" && latest.distanceToEnd) {
      try {
        metaDash.raceTime = latest.dateIte - latest.startDate;
        const estimatedSpeed = latest.distanceFromStart / (raceTime / 36e5);
        const eTtF = latest.distanceToEnd / estimatedSpeed * 36e5;
        metaDash.avgSpeed = estimatedSpeed;
        metaDash.eRT = raceTime + eTtF;
      } catch (e) {
        metaDash.eRT = e.toString();
      }
    } else if (latest.startDate && latest.state === "racing" && latest.startDate != "-") {
      metaDash.raceTime = Date.now() - latest.startDate;
    }
  } else {
    let legS = 0;
    if (legInfos.legStartDate != void 0 && legInfos.legStartDate > 0)
      legS = legInfos.legStartDate;
    if (((_a = legInfos.start) == null ? void 0 : _a.date) != void 0)
      legS = legInfos.start.date;
    if (legS > 0)
      metaDash.raceTime = currentPlayerLatest.iteDate - legS;
  }
  let realFoilFactor = null;
  let sailCoverage = 0;
  let xplained = false;
  let xfactor = 1;
  playerOption.guessOptions = playerOption.guessOptions ? playerOption.guessOptions : 0;
  const playerGuessOptionPrev = playerOption.guessOptions;
  if (polar) {
    const currentSail = latest.sail % 10;
    let sailDef = polar.sail[currentSail - 1];
    if (latest.state == "racing" && sailDef && latest.twa && latest.tws) {
      const speedTFull = theoreticalSpeed(polar, null, latest.tws, latest.twa, currentSail - 1);
      let speedT = speedTFull.speed;
      let foilFactor = foilingFactor({ foil: true }, latest.tws, latest.twa, polar.foil);
      let hullFactor = polar.hull.speedRatio;
      const epsEqual = (a, b) => {
        return Math.abs(b - a) < 2e-5;
      };
      const aroundV = (a, b) => {
        return Math.abs(b - a) < 0.01;
      };
      if (guessOptionBits[currentSail])
        playerOption.guessOptions |= guessOptionBits[currentSail];
      if ((_b = playerOption == null ? void 0 : playerOption.options) == null ? void 0 : _b.foil) {
        realFoilFactor = 0;
      }
      xfactor = latest.speed / speedT;
      const foils = (foilFactor - 1) * 100 / 4 * 100;
      if (epsEqual(xfactor, 1)) {
        xplained = true;
        playerOption.guessOptions |= guessOptionBits["hullDetected"];
        playerOption.guessOptions &= ~guessOptionBits["hull"];
        if (foilFactor > 1) {
          realFoilFactor = null;
          playerOption.guessOptions |= guessOptionBits["foilDetected"];
          playerOption.guessOptions &= ~guessOptionBits["foil"];
        }
      } else {
        if (epsEqual(latest.speed, speedT * hullFactor)) {
          xplained = true;
          if (epsEqual(hullFactor, foilFactor)) {
            realFoilFactor = foils;
            playerOption.guessOptions |= guessOptionBits["foilActivated"];
            playerOption.guessOptions |= guessOptionBits["hullDetected"];
            playerOption.guessOptions &= ~guessOptionBits["hull"];
          } else {
            playerOption.guessOptions |= guessOptionBits["hullActivated"];
            if (foilFactor > 1) {
              realFoilFactor = null;
              playerOption.guessOptions |= guessOptionBits["foilDetected"];
              playerOption.guessOptions &= ~guessOptionBits["foil"];
            }
          }
        } else if (epsEqual(latest.speed, speedT * foilFactor)) {
          xplained = true;
          realFoilFactor = foils;
          playerOption.guessOptions |= guessOptionBits["foilActivated"];
          playerOption.guessOptions |= guessOptionBits["hullDetected"];
          playerOption.guessOptions &= ~guessOptionBits["hull"];
        } else if (epsEqual(latest.speed, speedT * foilFactor * hullFactor)) {
          xplained = true;
          realFoilFactor = foils;
          playerOption.guessOptions |= guessOptionBits["foilActivated"];
          playerOption.guessOptions |= guessOptionBits["hullActivated"];
        } else {
          if ((playerOption == null ? void 0 : playerOption.options) || isBitSet(playerOption == null ? void 0 : playerOption.guessOptions, guessOptionBits["foilDetected"]) && isBitSet(playerOption == null ? void 0 : playerOption.guessOptions, guessOptionBits["hullDetected"])) {
            let hullOpt = isBitSet(playerOption == null ? void 0 : playerOption.guessOptions, guessOptionBits["hull"]);
            let foilOpt = isBitSet(playerOption == null ? void 0 : playerOption.guessOptions, guessOptionBits["foil"]);
            if (playerOption == null ? void 0 : playerOption.options) {
              hullOpt = playerOption == null ? void 0 : playerOption.options.hull;
              foilOpt = playerOption == null ? void 0 : playerOption.options.foil;
            }
            xplained = true;
            if (foilOpt)
              realFoilFactor = foils;
            else
              realFoilFactor = null;
            let sf = 1;
            if (foilOpt && hullOpt)
              sf = latest.speed / (speedT * foilFactor * hullFactor);
            else if (foilOpt)
              sf = latest.speed / (speedT * foilFactor);
            else if (hullOpt)
              sf = latest.speed / (speedT * hullFactor);
            else
              sf = latest.speed / speedT;
            if (sf > 1 && sf <= 1.14) {
              sailCoverage = roundTo((sf - 1) * 100, 2);
            } else if (sf < 1) {
              let c = (1 - sf) * 100;
              sailCoverage = -roundTo((1 - sf) * 100, 2);
              if (aroundV(c, 75) || aroundV(c, 50)) {
                playerOption.guessOptions |= guessOptionBits["winchDetected"];
                playerOption.guessOptions &= ~guessOptionBits["winch"];
              } else if (aroundV(c, 30) || aroundV(c, 51)) {
                playerOption.guessOptions |= guessOptionBits["winchActivated"];
              }
            }
          }
        }
      }
    }
  } else {
    xplained = true;
  }
  metaDash.xplained = xplained;
  metaDash.sailCoverage = sailCoverage;
  metaDash.realFoilFactor = realFoilFactor;
  metaDash.xfactor = xfactor;
  if (latest.twa !== 0) {
    metaDash.twd = latest.twa + latest.hdg;
    if (metaDash.twd < 0) {
      metaDash.twd += 360;
    } else if (metaDash.twd > 360)
      metaDash.twd -= 360;
  } else {
    metaDash.twd = 0;
  }
  metaDash.vmg = Math.abs(latest.speed * Math.cos(toRad(latest.twa)));
  if (!metaDash.bVmg)
    metaDash.bVmg = bestVMG(latest.tws, polar, playerOption.options, latest.sail % 10, latest.twa);
  if (latest.team) {
    latest.type2 = "team";
  } else if (latest.followed || latest.isFollowed) {
    latest.type2 = "followed";
  } else {
    latest.type2 = latest.type;
  }
  latest.metaDash = metaDash;
  if (latest.userId == currentPlayerLatest.userId) {
    await saveData("legPlayersInfos", latest, null, { updateIfExists: true });
    await saveData("legFleetInfos", latest, null, { updateIfExists: true });
  } else
    await saveData("legFleetInfos", latest, null, { updateIfExists: true });
  if (playerOption.guessOptions != playerGuessOptionPrev) {
    latest.metaDash = metaDash;
    const playerOptionRaceRecord = {
      raceId: legInfos.raceId,
      legNum: legInfos.legNum,
      userId: latest.userId,
      guessOptions: playerOption.guessOptions,
      timestamp: Date.now()
    };
    await saveData("legPlayersOptions", playerOptionRaceRecord, null, { updateIfExists: true });
  }
}
async function computeFleetIte(raceId, legNum) {
  if (!raceId || !legNum)
    return;
  const legInfos = await getData("legList", [raceId, legNum]);
  if (!legInfos)
    return;
  const polar = await getData("polars", legInfos.polar_id);
  if (!polar)
    return;
  const currentUserId = await getData("internal", "lastLoggedUser");
  if (!currentUserId)
    return;
  const { latest, previous, meta1 } = await getLatestAndPreviousByTriplet(raceId, legNum, currentUserId.loggedUser, { storeName: "legPlayersInfos" });
  const currentPlayerIte = latest;
  if (!currentPlayerIte)
    return;
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1e3;
  const { items, meta } = await getLatestEntriesPerUser(raceId, legNum, {
    since: fifteenMinutesAgo,
    until: now,
    timeout: 4e3,
    storeName: "legFleetInfos"
  });
  for (const [userId, entry] of Object.entries(items)) {
    const playerOptionRace = await getData("legPlayersOptions", [raceId, legNum, userId]) ?? { options: [], guessOptions: 0 };
    await computeFleetPlayerIte(legInfos, entry, playerOptionRace, currentPlayerIte, polar);
  }
  await saveData("internal", { id: "legFleetInfosDashUpdate", ts: Date.now() }, null, { updateIfExists: true });
}
async function computeOwnIte(raceId, legNum, userId) {
  var _a;
  if (!raceId || !legNum || !userId)
    return;
  const { latest, previous, meta } = await getLatestAndPreviousByTriplet(raceId, legNum, userId, { storeName: "legPlayersInfos" });
  if (meta.timedOut || !latest)
    return;
  const legInfos = await getData("legList", [raceId, legNum]);
  if (!legInfos)
    return;
  const polar = await getData("polars", legInfos.polar_id);
  if (!polar)
    return;
  const playerOption = await getData("legPlayersOptions", [raceId, legNum, userId]) ?? { options: [], guessOptions: 0 };
  const paramStamina = ((_a = await getData("internal", "paramStamina")) == null ? void 0 : _a.paramStamina) ?? null;
  const metaDash = latest.metaDash ? latest.metaDash : [];
  metaDash.speedT = theoreticalSpeed(polar, playerOption.options, latest == null ? void 0 : latest.tws, latest == null ? void 0 : latest.twa);
  if (previous) {
    const d = gcDistance(previous.pos, latest.pos);
    const delta = courseAngle(previous.pos.lat, previous.pos.lon, latest.pos.lat, latest.pos.lon);
    const alpha = Math.PI - angle(toRad(previous.hdg), delta);
    const beta = Math.PI - angle(toRad(latest.hdg), delta);
    const gamma = angle(toRad(latest.hdg), toRad(previous.hdg));
    metaDash.deltaT = (latest.iteDate - previous.iteDate) / 1e3;
    if (metaDash.deltaT > 0 && Math.abs(toDeg(gamma) - 180) > 1 && toDeg(alpha) > 1 && toDeg(beta) > 1) {
      metaDash.deltaD = d / Math.sin(gamma) * (Math.sin(beta) + Math.sin(alpha));
    } else {
      metaDash.deltaD = d;
    }
    metaDash.speedC = Math.abs(roundTo(metaDash.deltaD / metaDash.deltaT * 3600, 3));
    if (metaDash.speedT) {
      metaDash.deltaD_T = metaDash.deltaD / metaDash.speedC * metaDash.speedT.speed;
    }
    metaDash.previousItedate = previous.iteDate;
  }
  metaDash.bVmg = bestVMG(latest.tws, polar, playerOption.options, latest.sail % 10, latest.twa);
  metaDash.cog = null;
  metaDash.vmc = null;
  if (legInfos.checkpoints) {
    var cp_status = false;
    for (var i = 0; i < legInfos.checkpoints.length; i++) {
      var cp = legInfos.checkpoints[i];
      if (cp.display == "none" || latest.gateGroupCounters && latest.gateGroupCounters[cp.group - 1]) {
        continue;
      }
      if (cp.display != "none" || !latest.gateGroupCounters[cp.group - 1]) {
        metaDash.cog = calculateCOGLoxo(latest.pos.lat, latest.pos.lon, cp.start.lat, cp.start.lon);
        metaDash.vmc = latest.speed * Math.cos((latest.hdg - metaDash.cog) * (Math.PI / 180));
        cp_status = true;
        break;
      }
    }
    if (cp_status == false) {
      metaDash.cog = calculateCOGLoxo(latest.pos.lat, latest.pos.lon, legInfos.end.lat, legInfos.end.lon);
      metaDash.vmc = latest.speed * Math.cos((latest.hdg - metaDash.cog) * (Math.PI / 180));
    }
  }
  metaDash.coffeeBoost = 0;
  metaDash.coffeeExp = Date.now() + 24 * 60 * 60 * 1e3;
  metaDash.chocoBoost = 0;
  metaDash.chocoExp = Date.now() + 24 * 60 * 60 * 1e3;
  if (latest.stats) {
    if (latest.stats.staminaMaxEffects)
      for (const coffee of latest.stats.staminaMaxEffects) {
        if (coffee.value > 0 && coffee.exp > Date.now()) {
          metaDash.coffeeBoost += coffee.value;
          if (coffee.exp < metaDash.coffeeExp)
            metaDash.coffeeExp = coffee.exp;
        }
      }
    if (latest.stats.staminaTemp)
      for (const choco of latest.stats.staminaTemp) {
        if (choco.value > 0 && choco.exp > Date.now()) {
          metaDash.chocoBoost += choco.value;
          if (choco.exp < metaDash.chocoExp)
            metaDash.chocoExp = choco.exp;
        }
      }
  }
  const maxStamina = 100 + metaDash.coffeeBoost;
  let realStamina = latest.stamina + metaDash.coffeeBoost + metaDash.chocoBoost;
  metaDash.realStamina = realStamina > maxStamina ? maxStamina : realStamina;
  const pena = manoeuveringPenalities(polar, latest, metaDash.realStamina, playerOption.options);
  const energyLoose = computeEnergyLoose(polar, paramStamina, playerOption.options, latest.tws);
  const manoeuver = [];
  manoeuver.gybe = {
    pena: pena.gybe,
    energyLoose: energyLoose.gybe,
    energyRecovery: computeEnergyRecovery(energyLoose.gybe, latest.tws, paramStamina, playerOption.options)
  };
  manoeuver.tack = {
    pena: pena.tack,
    energyLoose: energyLoose.tack,
    energyRecovery: computeEnergyRecovery(energyLoose.tack, latest.tws, paramStamina, playerOption.options)
  };
  manoeuver.sail = {
    pena: pena.sail,
    energyLoose: energyLoose.sail,
    energyRecovery: computeEnergyRecovery(energyLoose.sail, latest.tws, paramStamina, playerOption.options)
  };
  metaDash.manoeuver = manoeuver;
  metaDash.manoeuver.staminaFactor = pena.staminaFactor;
  metaDash.manoeuvering = latest.tsEndOfSailChange > latest.iteDate || latest.tsEndOfGybe > latest.iteDate || latest.tsEndOfTack > latest.iteDate;
  metaDash.receivedTS = Date.now();
  metaDash.deltaReceiveCompute = metaDash.receivedTS - latest.iteDate;
  metaDash.isAutoSail = latest.hasPermanentAutoSails || latest.tsEndOfAutoSail && latest.tsEndOfAutoSail - latest.iteDate > 0;
  metaDash.autoSailTime = latest.hasPermanentAutoSails ? "inf" : latest.tsEndOfAutoSail - latest.iteDate;
  latest.metaDash = metaDash;
  await computeFleetPlayerIte(legInfos, latest, playerOption, latest, polar);
  await saveData("internal", { id: "legPlayersInfosDashUpdate", ts: Date.now() }, null, { updateIfExists: true });
}
let buildEmbeddedToolbarContent = { content: "", newTab: true, rid: null, theme: "dark", rstTimer: false, gameSize: 100 };
async function buildEmbeddedToolbarHtml(raceId, legNum, connectedPlayerId) {
  const userPrefs = getUserPrefs();
  const rid = raceId + "-" + legNum;
  let embeddedToolbarHeader = '<tr><th title="Call Router">RT</th><th title="Call Polars">PL</th><th>Time</th><th title="True Wind Direction">TWD</th><th title="True Wind Speed">TWS</th><th title="True Wind Angle">TWA</th><th title="Heading">HDG</th><th title="Boat speed / Speed factor / Foils usage">Speed</th><th title="Auto Sail time remaining">aSail</th><th title="Boat VMG">VMG</th><th title="Best VMG Up / Down">Best VMG</th><th title="Best speed angle (Sail) / Best speed">Best speed</th><th title="Stamina">Stamina</th><th title="Position">Position</th>';
  if (userPrefs.lang == "fr") {
    embeddedToolbarHeader += '<th title="Temps restant changement de voile">Voile</th><th title="Temps restant empannage">Emp.</th><th title="Temps restant virement">Vir.</th>';
  } else {
    embeddedToolbarHeader += '<th title="Time remaining sail change">Sail</th><th title="Time remaining tack">Tack</th><th title="Time remaining gybe">Gybe</th>';
  }
  embeddedToolbarHeader += "</tr>";
  let embeddedToolbarLine = await buildEmbeddedToolbarLine(raceId, legNum, connectedPlayerId);
  const embeddedToolBarTable = '<table id="raceStatusTable"><thead>' + embeddedToolbarHeader + "</thead><tbody>" + embeddedToolbarLine + "</tbody></table>";
  buildEmbeddedToolbarContent = {
    content: embeddedToolBarTable,
    newTab: userPrefs.global.reuseTab,
    rid,
    theme: userPrefs.theme,
    rstTimer: false,
    gameSize: userPrefs.drawing.fullScreen ? userPrefs.drawing.ratio : 0
  };
}
function getbuildEmbeddedToolbarContent() {
  return buildEmbeddedToolbarContent;
}
async function buildEmbeddedToolbarLine(raceId, legNum, connectedPlayerId) {
  let dashState = await getData("internal", "state");
  dashState = (dashState == null ? void 0 : dashState.state) ? dashState.state : "dashInstalled";
  const playerInfo = connectedPlayerId && connectedPlayerId != "" ? await getData("players", connectedPlayerId) : null;
  const userPrefs = getUserPrefs();
  let retVal = "";
  if (dashState == "dashInstalled" || !connectedPlayerId || connectedPlayerId == "") {
    if (userPrefs.lang == "fr") {
      retVal = "<tr><td colspan='17'>❌ Joueur non détecté (<a href='https://www.virtualregatta.com/offshore-game/'>Relancer</a>)</td></tr>";
    } else {
      retVal = "<tr><td colspan='17'>❌ Player not detected (<a href='https://www.virtualregatta.com/en/offshore-game/'>Reload</a>)</td></tr>";
    }
    return retVal;
  } else if (dashState == "playerConnected" || !raceId || !legNum) {
    if (userPrefs.lang == "fr") {
      retVal = '<tr><td colspan="17">❌ Aucune course chargée (Joueur détecté: ' + playerInfo.name + ")</td></tr>";
    } else {
      retVal = '<tr><td colspan="17">❌ No race loaded (Player detected: ' + playerInfo.name + ")</td></tr>";
    }
    return retVal;
  }
  const { latest, previous, meta } = await getLatestAndPreviousByTriplet(raceId, legNum, connectedPlayerId, { storeName: "legPlayersInfos" });
  if (meta.timedOut || !latest)
    return;
  const raceIte = latest;
  const legInfos = await getData("legList", [raceId, legNum]);
  if (!legInfos || !raceIte || !raceIte.metaDash)
    return;
  const best = raceIte.metaDash.bVmg;
  let bestVMGTxt = "";
  let bspeedTxt = "";
  if (best) {
    bestVMGTxt = "<div>↗  " + best.twaUp + " (" + sailNames[best.sailUp % 10] + ")";
    if (userPrefs.raceData.VMGSpeed)
      bestVMGTxt += " (" + roundTo(bestTwa.vmgUp, 3) + "kts )";
    bestVMGTxt += "</div>";
    bestVMGTxt += "<div>↘  " + best.twaDown + " (" + sailNames[best.sailDown % 10] + ")";
    if (userPrefs.raceData.VMGSpeed)
      bestVMGTxt += " (" + roundTo(Math.abs(best.vmgDown), 3) + "kts )";
    bestVMGTxt += "</div>";
    bspeedTxt += "<div>" + best.btwa + "° (" + sailNames[best.sailBSpeed % 10] + ") </div>";
    bspeedTxt += "<div>" + roundTo(best.bspeed, 3) + "kts</div>";
  }
  let speedTxtBg = "";
  if (raceIte.aground || raceIte.metaDash.manoeuvering) {
    speedTxtBg = 'style="background-color:' + userPrefs.theme == "dark" ? "darkred" : "LightRed;";
  }
  const xfactorStyle = getxFactorStyle(raceIte);
  let xfactorTxt = roundTo(raceIte.metaDash.xfactor, 4);
  if (raceIte.metaDash.sailCoverage != 0 && raceIte.metaDash.xplained) {
    xfactorTxt += " " + raceIte.metaDash.sailCoverage + "%";
  }
  let speedTxt = "<div>" + roundTo(raceIte.speed, 3) + "</div>";
  speedTxt += '<div class="xfactor"' + xfactorStyle + ">" + xfactorTxt + "</div>";
  speedTxt += '<div class="foil">';
  speedTxt += '<img " class="foilImg" src="' + chrome.runtime.getURL("./img/foil.png") + '" >';
  speedTxt += raceIte.metaDash.realFoilFactor == null ? "no" : roundTo(raceIte.metaDash.realFoilFactor, 2) + "%";
  speedTxt += "</div>";
  let lastCalcStyle = "";
  if (raceIte.metaDash.deltaReceiveCompute > 9e5) {
    lastCalcStyle = 'style="background-color: red;';
    lastCalcStyle += userPrefs.theme == "dark" ? ' color:black;"' : '"';
  }
  const isTWAMode = raceIte.isRegulated;
  const twaFG = raceIte.twa < 0 ? "red" : "green";
  const twaBold = isTWAMode ? "font-weight: bold;" : "";
  let twaBG = " ";
  if (best) {
    twaBG = twaBackGround(raceIte.twa, best);
  }
  let hdgFG = isTWAMode ? "black" : "blue";
  const hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
  if (userPrefs.theme == "dark")
    hdgFG = isTWAMode ? "white" : "darkcyan";
  let staminaStyle = "";
  let staminaTxt = "-";
  const stamina = raceIte.metaDash.realStamina;
  const setting = await getData("internal", "paramStamina");
  const paramStamina = setting == null ? void 0 : setting.paramStamina;
  const manoeuver = raceIte.metaDash.manoeuver;
  if (stamina) {
    if (stamina < (paramStamina == null ? void 0 : paramStamina.tiredness[0]))
      staminaStyle = 'style="color:red"';
    else if (stamina < (paramStamina == null ? void 0 : paramStamina.tiredness[1]))
      staminaStyle = 'style="color:orange"';
    else
      staminaStyle = 'style="color:green"';
    staminaTxt = roundTo(stamina, 2) + "%";
    staminaTxt += " (x" + roundTo(manoeuver.staminaFactor, 2) + ")";
  }
  let fullStamina = '<td class="stamina" ';
  if (raceIte.metaDash.coffeeBoost != 0 || raceIte.metaDash.chocoBoost != 0) {
    fullStamina += '><div class="textMini">';
    if (raceIte.metaDash.chocoBoost != 0) {
      fullStamina += "🍫+" + roundTo(raceIte.metaDash.chocoBoost, 2) + "%";
      fullStamina += " ⌚" + formatHM(raceIte.metaDash.chocoExp - Date.now());
    }
    fullStamina += "</div>";
    fullStamina += "<div " + staminaStyle + ">";
    fullStamina += staminaTxt;
    fullStamina += "</div>";
    fullStamina += '<div class="textMini">';
    if (raceIte.metaDash.coffeeBoost != 0) {
      fullStamina += "☕+" + roundTo(raceIte.metaDash.coffeeBoost, 2) + "%";
      fullStamina += " ⌚" + formatHM(raceIte.metaDash.coffeeExp - Date.now());
    }
    fullStamina += "</div>";
    fullStamina += "</td>";
  } else {
    fullStamina += staminaStyle + ">" + staminaTxt + "</td>";
  }
  let sailPenaTxt = '<td class="tack">';
  if (manoeuver == null ? void 0 : manoeuver.sail)
    sailPenaTxt += "<div>-" + manoeuver.sail.pena.dist + "nm | " + manoeuver.sail.pena.time + "s</div>";
  else
    sailPenaTxt += "<div>-</div>";
  if (raceIte.tsEndOfSailChange)
    sailPenaTxt += "<div " + getBG(raceIte.tsEndOfSailChange, raceIte.metaDash.previousIteDate) + ">" + formatSeconds(raceIte.tsEndOfSailChange - raceIte.iteDate) + "</div>";
  else
    sailPenaTxt += "<div> - </div>";
  sailPenaTxt += "</td>";
  let tackPenaTxt = '<td class="tack">';
  if (manoeuver == null ? void 0 : manoeuver.tack)
    tackPenaTxt += "<div>-" + manoeuver.tack.pena.dist + "nm | " + manoeuver.tack.pena.time + "s</div>";
  else
    tackPenaTxt += "<div>-</div>";
  if (raceIte.tsEndOfTack)
    tackPenaTxt += "<div " + getBG(raceIte.tsEndOfTack, raceIte.metaDash.previousIteDate) + ">" + formatSeconds(raceIte.tsEndOfTack - raceIte.iteDate) + "</div>";
  else
    tackPenaTxt += "<div> - </div>";
  tackPenaTxt += "</td>";
  let gybePenaTxt = '<td class="tack">';
  if (manoeuver == null ? void 0 : manoeuver.tack)
    gybePenaTxt += "<div>-" + manoeuver.gybe.pena.dist + "nm | " + manoeuver.gybe.pena.time + "s</div>";
  else
    gybePenaTxt += "<div>-</div>";
  if (raceIte.tsEndOfGybe)
    gybePenaTxt += "<div " + getBG(raceIte.tsEndOfGybe, raceIte.metaDash.previousIteDate) + ">" + formatSeconds(raceIte.tsEndOfGybe - raceIte.iteDate) + "</div>";
  else
    gybePenaTxt += "<div> - </div>";
  gybePenaTxt += "</td>";
  const timeLine = "<div>" + formatTimeNotif(raceIte.iteDate) + '</div><div id="dashIntegTime" class="textMini"></div>';
  const rid = legInfos.id + "-" + legInfos.legNum;
  retVal = '<tr id="rs:' + rid + '">';
  retVal += '<td class="tdc"><div>';
  retVal += '<span id="vrz:' + rid + '">&#x262F;</span>';
  retVal += "</div><div>";
  retVal += "&nbsp;";
  retVal += "</div></td>";
  retVal += '<td class="tdc"><div>';
  retVal += '<span id="pl:' + rid + '">&#x26F5;</span>';
  retVal += "</div><div>";
  retVal += '<span id="ityc:' + rid + '">&#x2620;</span>';
  retVal += "</div></td>";
  retVal += '<td class="time" ' + lastCalcStyle + ">" + timeLine + '</td><td class="twd">' + roundTo(raceIte.twd, 3) + '</td><td class="tws">' + roundTo(raceIte.tws, 3) + '</td><td class="twa" style="color:' + twaFG + ";" + twaBG + twaBold + '">' + roundTo(Math.abs(raceIte.twa), 3) + '</td><td  class="hdg" style="color:' + hdgFG + ";" + hdgBold + '">' + roundTo(raceIte.hdg, 3) + '</td><td class="speed1"' + speedTxtBg + ">" + speedTxt + "</td>" + infoSail(raceIte, true) + '<td class="speed2">' + roundTo(raceIte.metaDash.vmg, 3) + '</td><td class="bvmg">' + bestVMGTxt + '</td><td class="bspeed">' + bspeedTxt + "</td>" + fullStamina + '<td class="position">' + (raceIte.pos ? formatPosition(raceIte.pos.lat, raceIte.pos.lon, true) : "-") + "</td>" + sailPenaTxt + gybePenaTxt + tackPenaTxt + "</tr>";
  return retVal;
}
async function manageDashState(nextState) {
  const currentDashState = await getData("internal", "state");
  let dashState = (currentDashState == null ? void 0 : currentDashState.state) ? currentDashState.state : "dashInstalled";
  if (nextState == "start")
    dashState.state = "dashInstalled";
  else
    switch (dashState) {
      case "dashInstalled":
        if (nextState == "playerConnected" || nextState == "raceOpened")
          dashState = nextState;
        break;
      case "playerConnected":
        if (nextState == "raceOpened")
          dashState = nextState;
        break;
      case "raceOpened":
        if (nextState == "playerConnected")
          dashState = nextState;
        break;
    }
  if (currentDashState != dashState)
    await saveData("internal", { id: "state", state: dashState }, null, { updateIfExists: true });
}
var debuggeeTab;
var dashboardTab;
const pending = /* @__PURE__ */ new Map();
saveData("internal", { id: "state", state: "dashInstalled" });
chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if ((msg == null ? void 0 : msg.target) !== "bg")
    return;
  if (msg.type === "job:done" && pending.has(msg.id)) {
    pending.get(msg.id).resolve(msg.summary);
    pending.delete(msg.id);
  }
  if (msg.type === "job:error" && pending.has(msg.id)) {
    pending.get(msg.id).reject(new Error(msg.error || "Offscreen/Worker error"));
    pending.delete(msg.id);
  }
});
chrome.action.onClicked.addListener(onStartDash);
function onStartDash(tab) {
  if (tab && tab.url.indexOf("virtualregatta.com") >= 0) {
    debuggeeTab = tab;
    onAttach(tab.id);
  }
}
function autoReloadTab(tabs) {
  tabs.forEach((tab) => {
    if (tab.url.indexOf(chrome.runtime.id + "/dashboard.html") >= 0) {
      dashboardTab = tab;
      chrome.tabs.reload(tab.id);
      console.log("autoreload: " + tab.id + " " + tab.url);
    }
  });
}
chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    checkForValidUrl(activeInfo.tabId, null, tab);
  });
});
function checkForValidUrl(tabId, changeInfo, tabInfo) {
  try {
    if (tabInfo && tabInfo.url.indexOf("virtualregatta.com") >= 0) {
      if (!debuggeeTab) {
        debuggeeTab = tabInfo;
      }
      if (!dashboardTab) {
        chrome.tabs.query({}).then(autoReloadTab);
      }
    }
  } catch (e) {
    console.log("Tab is gone: " + tabId);
  }
}
chrome.tabs.onRemoved.addListener(onTabRemoved);
function onTabRemoved(tabId, removeInfo) {
  if (debuggeeTab && tabId == debuggeeTab.id) {
    try {
      debuggeeTab = void 0;
      if (dashboardTab)
        chrome.tabs.remove(dashboardTab.id);
      dashboardTab = void 0;
    } catch (e) {
      console.log(JSON.stringify(e));
    }
  } else if (dashboardTab && tabId == dashboardTab.id) {
    dashboardTab = void 0;
  }
}
function onAttach(tabId) {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
  } else {
    if (!dashboardTab)
      chrome.tabs.create(
        { url: "dashboard.html?" + tabId, active: false },
        function(tab) {
          dashboardTab = tab;
        }
      );
  }
}
chrome.declarativeContent.onPageChanged.removeRules(async () => {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostPrefix: "www.virtualregatta.", pathContains: "/offshore-" }
      })
    ],
    actions: [
      new chrome.declarativeContent.SetIcon({
        imageData: {
          128: await loadImageData("icon.png")
        }
      }),
      chrome.declarativeContent.ShowAction ? new chrome.declarativeContent.ShowAction() : new chrome.declarativeContent.ShowPageAction()
    ]
  }]);
});
async function loadImageData(url) {
  const img = await createImageBitmap(await (await fetch(chrome.runtime.getURL(url))).blob());
  const { width: w, height: h } = img;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    try {
      const panelWindowInfo = chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        height: 150,
        width: 300
      });
    } catch (error) {
      console.log(error);
    }
  }
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("bg R2 " + msg.type);
  sendResponse({ type: "alive", rstTimer: false, gameSize: 80 });
});
chrome.runtime.onMessageExternal.addListener(
  async function(request, sender, sendResponse) {
    var msg = request;
    let rstTimer = false;
    console.log("bg R " + msg.type);
    if (msg.type == "data") {
      if (msg.req.Accept) {
        sendResponse({ type: "dummy" });
        return;
      }
      var postData = JSON.parse(msg.req);
      var eventClass = postData["@class"];
      var body = JSON.parse(msg.resp.replace(/\bNaN\b|\bInfinity\b/g, "null"));
      if (eventClass == "AccountDetailsRequest") {
        await ingestAccountDetails(body);
      } else if (eventClass == "LogEventRequest") {
        var eventKey = postData.eventKey;
        if (eventKey == "Leg_GetList") {
          await ingestRaceList(body);
        } else if (eventKey == "Game_EndLegPrep") {
          await ingestEndLegPrep(body);
        } else if (eventKey == "Game_GetSettings") {
          await ingestGameSetting(body);
        } else if (eventKey == "Race_SelectorData") {
          await ingestPolars(body);
        } else if (eventKey == "Game_AddBoatAction") {
          await ingestBoatAction(body);
        } else if (eventKey == "Game_GetGhostTrack") {
          await ingestGhostTrack(postData, body);
        }
      } else {
        let event = msg.url.substring(msg.url.lastIndexOf("/") + 1);
        if (event == "getboatinfos") {
          const ret = await ingestBoatInfos(body);
          rstTimer = ret.rstTimer;
        } else if (event == "getfleet") {
          await ingestFleetData(postData, body);
        }
      }
    }
    void chrome.runtime.getPlatformInfo();
    const embeddedToolbar = getbuildEmbeddedToolbarContent();
    embeddedToolbar.rstTimer = rstTimer;
    sendResponse({ ...embeddedToolbar, type: "update" });
  }
);
const dashStateInfosListener = createKeyChangeListener("internal", "state");
dashStateInfosListener.start({
  referenceValue: { state: "" },
  onChange: async ({ oldValue, newValue }) => {
    const currentId = await getData("internal", "lastLoggedUser");
    const currentRace = await getData("internal", "lastOpennedRace");
    await buildEmbeddedToolbarHtml(currentRace.raceId, currentRace.legNum, currentId.loggedUser);
  }
});
const legPlayersInfosListener = createKeyChangeListener("internal", "legPlayersInfosUpdate");
legPlayersInfosListener.start({
  referenceValue: { loggedUser: Date.now() },
  onChange: async ({ oldValue, newValue }) => {
    const currentId = await getData("internal", "lastLoggedUser");
    const currentRace = await getData("internal", "lastOpennedRace");
    if (!currentId || !currentRace)
      return;
    await manageDashState("raceOpened");
    await computeOwnIte(currentRace.raceId, currentRace.legNum, currentId.loggedUser);
    await buildEmbeddedToolbarHtml(currentRace.raceId, currentRace.legNum, currentId.loggedUser);
  }
});
const legFleetInfosListener = createKeyChangeListener("internal", "legFleetInfosUpdate");
legFleetInfosListener.start({
  referenceValue: { loggedUser: Date.now() },
  onChange: async ({ oldValue, newValue }) => {
    const currentRace = await getData("internal", "lastOpennedRace");
    if (!currentRace)
      return;
    await manageDashState("raceOpened");
    await computeFleetIte(currentRace.raceId, currentRace.legNum);
  }
});
const connectedUserListener = createKeyChangeListener("internal", "lastLoggedUser");
connectedUserListener.start({
  referenceValue: { loggedUser: null },
  onChange: async ({ oldValue, newValue }) => {
    if (newValue.loggedUser) {
      const currentRace = await getData("internal", "lastOpennedRace");
      await manageDashState("playerConnected");
      await buildEmbeddedToolbarHtml(currentRace.raceId, currentRace.legNum, newValue.loggedUser);
    }
  }
});
const connectedRaceListener = createKeyChangeListener("internal", "lastOpennedRace");
connectedRaceListener.start({
  referenceValue: { raceId: null, legNum: null },
  onChange: async ({ oldValue, newValue }) => {
    const currentId = await getData("internal", "lastLoggedUser");
    await manageDashState("raceOpened");
    await buildEmbeddedToolbarHtml(newValue.raceId, newValue.legNum, currentId.loggedUser);
  }
});
//# sourceMappingURL=background.js.map

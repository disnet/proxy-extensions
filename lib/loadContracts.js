// Domain Public by Eric Wendelin http://eriwen.com/ (2008)
//                  Luke Smith http://lucassmith.name/ (2008)
//                  Loic Dachary <loic@dachary.org> (2008)
//                  Johan Euphrosine <proppy@aminche.com> (2008)
//                  Oyvind Sean Kinsey http://kinsey.no/blog (2010)
//                  Victor Homyakov <victor-homyakov@users.sourceforge.net> (2010)

/**
 * Main function giving a function stack trace with a forced or passed in Error
 *
 * @cfg {Error} e The error to create a stacktrace from (optional)
 * @cfg {Boolean} guess If we should try to resolve the names of anonymous functions
 * @return {Array} of Strings with functions, lines, files, and arguments where possible
 */
function printStackTrace(options) {
    options = options || {guess: true};
    var ex = options.e || null, guess = !!options.guess;
    var p = new printStackTrace.implementation(), result = p.run(ex);
    return (guess) ? p.guessAnonymousFunctions(result) : result;
}

printStackTrace.implementation = function() {
};

printStackTrace.implementation.prototype = {
    run: function(ex) {
        ex = ex || this.createException();
        // Do not use the stored mode: different exceptions in Chrome
        // may or may not have arguments or stack
        var mode = this.mode(ex);
        // Use either the stored mode, or resolve it
        //var mode = this._mode || this.mode(ex);
        if (mode === 'other') {
            return this.other(arguments.callee);
        } else {
            return this[mode](ex);
        }
    },

    createException: function() {
        try {
            this.undef();
            return null;
        } catch (e) {
            return e;
        }
    },

    /**
     * @return {String} mode of operation for the environment in question.
     */
    mode: function(e) {
        if (e['arguments'] && e.stack) {
            return (this._mode = 'chrome');
        } else if (e.message && typeof window !== 'undefined' && window.opera) {
            return (this._mode = e.stacktrace ? 'opera10' : 'opera');
        } else if (e.stack) {
            return (this._mode = 'firefox');
        }
        return (this._mode = 'other');
    },

    /**
     * Given a context, function name, and callback function, overwrite it so that it calls
     * printStackTrace() first with a callback and then runs the rest of the body.
     *
     * @param {Object} context of execution (e.g. window)
     * @param {String} functionName to instrument
     * @param {Function} function to call with a stack trace on invocation
     */
    instrumentFunction: function(context, functionName, callback) {
        context = context || window;
        var original = context[functionName];
        context[functionName] = function instrumented() {
            callback.call(this, printStackTrace().slice(4));
            return context[functionName]._instrumented.apply(this, arguments);
        };
        context[functionName]._instrumented = original;
    },

    /**
     * Given a context and function name of a function that has been
     * instrumented, revert the function to it's original (non-instrumented)
     * state.
     *
     * @param {Object} context of execution (e.g. window)
     * @param {String} functionName to de-instrument
     */
    deinstrumentFunction: function(context, functionName) {
        if (context[functionName].constructor === Function &&
                context[functionName]._instrumented &&
                context[functionName]._instrumented.constructor === Function) {
            context[functionName] = context[functionName]._instrumented;
        }
    },

    /**
     * Given an Error object, return a formatted Array based on Chrome's stack string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    chrome: function(e) {
        var stack = (e.stack + '\n').replace(/^\S[^\(]+?[\n$]/gm, '').
          replace(/^\s+at\s+/gm, '').
          replace(/^([^\(]+?)([\n$])/gm, '{anonymous}()@$1$2').
          replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1').split('\n');
        stack.pop();
        return stack;
    },

    /**
     * Given an Error object, return a formatted Array based on Firefox's stack string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    firefox: function(e) {
        return e.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^\(/gm, '{anonymous}(').split('\n');
    },

    /**
     * Given an Error object, return a formatted Array based on Opera 10's stacktrace string.
     *
     * @param e - Error object to inspect
     * @return Array<String> of function calls, files and line numbers
     */
    opera10: function(e) {
        var stack = e.stacktrace;
        var lines = stack.split('\n'), ANON = '{anonymous}', lineRE = /.*line (\d+), column (\d+) in ((<anonymous function\:?\s*(\S+))|([^\(]+)\([^\)]*\))(?: in )?(.*)\s*$/i, i, j, len;
        for (i = 2, j = 0, len = lines.length; i < len - 2; i++) {
            if (lineRE.test(lines[i])) {
                var location = RegExp.$6 + ':' + RegExp.$1 + ':' + RegExp.$2;
                var fnName = RegExp.$3;
                fnName = fnName.replace(/<anonymous function\:?\s?(\S+)?>/g, ANON);
                lines[j++] = fnName + '@' + location;
            }
        }

        lines.splice(j, lines.length - j);
        return lines;
    },

    // Opera 7.x-9.x only!
    opera: function(e) {
        var lines = e.message.split('\n'), ANON = '{anonymous}', lineRE = /Line\s+(\d+).*script\s+(http\S+)(?:.*in\s+function\s+(\S+))?/i, i, j, len;

        for (i = 4, j = 0, len = lines.length; i < len; i += 2) {
            //TODO: RegExp.exec() would probably be cleaner here
            if (lineRE.test(lines[i])) {
                lines[j++] = (RegExp.$3 ? RegExp.$3 + '()@' + RegExp.$2 + RegExp.$1 : ANON + '()@' + RegExp.$2 + ':' + RegExp.$1) + ' -- ' + lines[i + 1].replace(/^\s+/, '');
            }
        }

        lines.splice(j, lines.length - j);
        return lines;
    },

    // Safari, IE, and others
    other: function(curr) {
        var ANON = '{anonymous}', fnRE = /function\s*([\w\-$]+)?\s*\(/i, stack = [], fn, args, maxStackSize = 10;
        while (curr && stack.length < maxStackSize) {
            fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
            args = Array.prototype.slice.call(curr['arguments'] || []);
            stack[stack.length] = fn + '(' + this.stringifyArguments(args) + ')';
            curr = curr.caller;
        }
        return stack;
    },

    /**
     * Given arguments array as a String, subsituting type names for non-string types.
     *
     * @param {Arguments} object
     * @return {Array} of Strings with stringified arguments
     */
    stringifyArguments: function(args) {
        var slice = Array.prototype.slice;
        for (var i = 0; i < args.length; ++i) {
            var arg = args[i];
            if (arg === undefined) {
                args[i] = 'undefined';
            } else if (arg === null) {
                args[i] = 'null';
            } else if (arg.constructor) {
                if (arg.constructor === Array) {
                    if (arg.length < 3) {
                        args[i] = '[' + this.stringifyArguments(arg) + ']';
                    } else {
                        args[i] = '[' + this.stringifyArguments(slice.call(arg, 0, 1)) + '...' + this.stringifyArguments(slice.call(arg, -1)) + ']';
                    }
                } else if (arg.constructor === Object) {
                    args[i] = '#object';
                } else if (arg.constructor === Function) {
                    args[i] = '#function';
                } else if (arg.constructor === String) {
                    args[i] = '"' + arg + '"';
                }
            }
        }
        return args.join(',');
    },

    sourceCache: {},

    /**
     * @return the text from a given URL.
     */
    ajax: function(url) {
        var req = this.createXMLHTTPObject();
        if (!req) {
            return;
        }
        req.open('GET', url, false);
        req.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
        req.send('');
        return req.responseText;
    },

    /**
     * Try XHR methods in order and store XHR factory.
     *
     * @return <Function> XHR function or equivalent
     */
    createXMLHTTPObject: function() {
        var xmlhttp, XMLHttpFactories = [
            function() {
                return new XMLHttpRequest();
            }, function() {
                return new ActiveXObject('Msxml2.XMLHTTP');
            }, function() {
                return new ActiveXObject('Msxml3.XMLHTTP');
            }, function() {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        ];
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
                // Use memoization to cache the factory
                this.createXMLHTTPObject = XMLHttpFactories[i];
                return xmlhttp;
            } catch (e) {
            }
        }
    },

    /**
     * Given a URL, check if it is in the same domain (so we can get the source
     * via Ajax).
     *
     * @param url <String> source url
     * @return False if we need a cross-domain request
     */
    isSameDomain: function(url) {
        return url.indexOf(location.hostname) !== -1;
    },

    /**
     * Get source code from given URL if in the same domain.
     *
     * @param url <String> JS source URL
     * @return <Array> Array of source code lines
     */
    getSource: function(url) {
        if (!(url in this.sourceCache)) {
            this.sourceCache[url] = this.ajax(url).split('\n');
        }
        return this.sourceCache[url];
    },

    guessAnonymousFunctions: function(stack) {
        for (var i = 0; i < stack.length; ++i) {
            var reStack = /\{anonymous\}\(.*\)@(\w+:\/\/([\-\w\.]+)+(:\d+)?[^:]+):(\d+):?(\d+)?/;
            var frame = stack[i], m = reStack.exec(frame);
            if (m) {
                var file = m[1], lineno = m[4], charno = m[7] || 0; //m[7] is character position in Chrome
                if (file && this.isSameDomain(file) && lineno) {
                    var functionName = this.guessAnonymousFunction(file, lineno, charno);
                    stack[i] = frame.replace('{anonymous}', functionName);
                }
            }
        }
        return stack;
    },

    guessAnonymousFunction: function(url, lineNo, charNo) {
        var ret;
        try {
            ret = this.findFunctionName(this.getSource(url), lineNo);
        } catch (e) {
            ret = 'getSource failed with url: ' + url + ', exception: ' + e.toString();
        }
        return ret;
    },

    findFunctionName: function(source, lineNo) {
        // FIXME findFunctionName fails for compressed source
        // (more than one function on the same line)
        // TODO use captured args
        // function {name}({args}) m[1]=name m[2]=args
        var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
        // {name} = function ({args}) TODO args capture
        // /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*function(?:[^(]*)/
        var reFunctionExpression = /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*function\b/;
        // {name} = eval()
        var reFunctionEvaluation = /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
        // Walk backwards in the source lines until we find
        // the line which matches one of the patterns above
        var code = "", line, maxLines = 10, m;
        for (var i = 0; i < maxLines; ++i) {
            // FIXME lineNo is 1-based, source[] is 0-based
            line = source[lineNo - i];
            if (line) {
                code = line + code;
                m = reFunctionExpression.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
                m = reFunctionDeclaration.exec(code);
                if (m && m[1]) {
                    //return m[1] + "(" + (m[2] || "") + ")";
                    return m[1];
                }
                m = reFunctionEvaluation.exec(code);
                if (m && m[1]) {
                    return m[1];
                }
            }
        }
        return '(?)';
    }
};

(function() {

  "use strict";

  /*
  contracts.coffee
  http://disnetdev.com/contracts.coffee
  
  Copyright 2011, Tim Disney
  Released under the MIT License
  */

  var Contract, ModuleName, Unproxy, Utils, and_, any, arr, blame, blameM, check, checkOptions, combinators, contracts, ctor, ctorSafe, enabled, findCallsite, fun, getModName, guard, idHandler, none, not_, object, opt, or_, root, self, unproxy, ___, _blame;

  root = typeof global !== "undefined" && global !== null ? global : this;

  enabled = true;

  Unproxy = (function() {

    function Unproxy() {
      if (typeof WeakMap !== "undefined" && WeakMap !== null) {
        this.hasWeak = true;
        this.unproxy = new WeakMap();
      } else {
        this.hasWeak = false;
        this.unproxy = [];
      }
    }

    Unproxy.prototype.set = function(p, c) {
      if (this.hasWeak) {
        return this.unproxy.set(p, c);
      } else {
        return this.unproxy.push({
          proxy: p,
          contract: c
        });
      }
    };

    Unproxy.prototype.get = function(p) {
      var pc;
      if (this.hasWeak) {
        if ((p !== null) && typeof p === "object" || typeof p === "function") {
          return this.unproxy.get(p);
        } else {
          return;
        }
      } else {
        pc = this.unproxy.filter(function(el) {
          return p === el.proxy;
        });
        if (pc.length > 1) {
          throw "assumption failed: unproxy object stores multiple unique proxies";
        }
        if (pc.length === 1) {
          return pc[0];
        } else {
          return;
        }
      }
    };

    return Unproxy;

  })();

  unproxy = new Unproxy();

  Utils = {
    getPropertyDescriptor: function(obj, prop) {
      var desc, o;
      o = obj;
      while (true) {
        desc = Object.getOwnPropertyDescriptor(o, prop);
        if (desc !== undefined) return desc;
        o = Object.getPrototypeOf(o);
        if (o === null) break;
      }
      return;
    },
    merge: function(o1, o2) {
      var f, o3;
      o3 = {};
      f = function(o) {
        var name, _results;
        _results = [];
        for (name in o) {
          if (o.hasOwnProperty(name)) {
            _results.push(o3[name] = o[name]);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      f(o1);
      f(o2);
      return o3;
    },
    hasNoHoles: function(obj) {
      var i;
      i = 0;
      while (i < obj.length) {
        if (!(i in obj)) return false;
        i++;
      }
      return true;
    },
    zip: function(a1, a2) {
      var i, ret;
      ret = [];
      if (!Array.isArray(a1) || !Array.isArray(a2) || (a1.length !== a2.length)) {
        ret = [];
      } else {
        i = 0;
        while (i < a1.length) {
          ret.push([a1[i], a2[i]]);
          i++;
        }
      }
      return ret;
    }
  };

  checkOptions = function(a, b) {
    var name, pOpt;
    pOpt = true;
    for (name in a) {
      if (a[name] instanceof Contract) {
        if (!a[name].equals(b[name])) pOpt = false;
      } else {
        if (a[name] !== b[name]) pOpt = false;
      }
    }
    for (name in b) {
      if (!(name in a)) pOpt = false;
    }
    return pOpt;
  };

  findCallsite = function(trace) {
    var match, re, t;
    t = trace[0];
    re = /@(.*):(\d*)$/;
    match = re.exec(t);
    if (match) {
      return [match[1], parseInt(match[2], 10)];
    } else {
      return null;
    }
  };

  _blame = function(toblame, other, msg, parents) {
    var callsite, err, m, ps, server, st;
    ps = parents.slice(0);
    server = (toblame.isServer ? toblame : other);
    m = "Contract violation: " + msg + "\n" + "Value guarded in: " + server + " -- blame is on: " + toblame + "\n";
    if (ps) m += "Parent contracts:\n" + ps.reverse().join("\n");
    err = new Error(m);
    st = printStackTrace({
      e: err
    });
    err.cleaned_stacktrace = st;
    callsite = findCallsite(st);
    if (callsite) {
      err.fileName = callsite[0];
      err.lineNumber = callsite[1];
    }
    throw err;
  };

  blame = function(toblame, other, contract, value, parents) {
    var cname, msg;
    cname = contract.cname || contract;
    msg = "expected <" + cname + ">" + ", actual: " + (typeof value === "string" ? "\"" + value + "\"" : value);
    throw _blame(toblame, other, msg, parents);
  };

  blameM = function(toblame, other, msg, parents) {
    return _blame(toblame, other, msg, parents);
  };

  idHandler = function(obj) {
    return {
      getOwnPropertyDescriptor: function(name) {
        var desc;
        desc = Object.getOwnPropertyDescriptor(obj, name);
        if (desc !== void 0) desc.configurable = true;
        return desc;
      },
      getPropertyDescriptor: function(name) {
        var desc;
        desc = Utils.getPropertyDescriptor(obj, name);
        if (desc) desc.configurable = true;
        return desc;
      },
      getOwnPropertyNames: function() {
        return Object.getOwnPropertyNames(obj);
      },
      getPropertyNames: function() {
        return Object.getPropertyNames(obj);
      },
      defineProperty: function(name, desc) {
        return Object.defineProperty(obj, name, desc);
      },
      'delete': function(name) {
        return delete obj[name];
      },
      fix: function() {
        if (Object.isFrozen(obj)) {
          return Object.getOwnPropertyNames(obj).map(function(name) {
            return Object.getOwnPropertyDescriptor(obj, name);
          });
        }
        return;
      },
      has: function(name) {
        return name in obj;
      },
      hasOwn: function(name) {
        return Object.prototype.hasOwnProperty.call(obj, name);
      },
      enumerate: function() {
        var name, result;
        result = [];
        name = void 0;
        for (name in obj) {
          result.push(name);
        }
        return result;
      },
      get: function(receiver, name) {
        return obj[name];
      },
      set: function(receiver, name, val) {
        obj[name] = val;
        return true;
      },
      keys: function() {
        return Object.keys(obj);
      }
    };
  };

  Contract = (function() {

    function Contract(cname, ctype, handler) {
      this.cname = cname;
      this.ctype = ctype;
      this.handler = handler;
      this.parent = null;
    }

    Contract.prototype.check = function(val, pos, neg, parentKs, stack) {
      var c;
      c = unproxy.get(val);
      if (c && c.equals(this)) {
        this.handler(val, pos, neg, parentKs, stack);
        return val;
      } else {
        return this.handler(val, pos, neg, parentKs, stack);
      }
    };

    Contract.prototype.toContract = function() {
      return this;
    };

    Contract.prototype.toString = function() {
      return this.cname;
    };

    Contract.prototype.equals = function(other) {
      throw "Equality checking must be overridden";
    };

    return Contract;

  })();

  ModuleName = (function() {
    var toString;

    function ModuleName(filename, linenum, isServer) {
      this.filename = filename;
      this.linenum = linenum;
      this.isServer = isServer;
    }

    toString = function() {
      return this.filename + (this.linenum === "" ? "" : ":" + this.linenum);
    };

    return ModuleName;

  })();

  Function.prototype.toContract = function() {
    var name;
    name = "<user defined: " + this.toString() + ">";
    return check(this, name);
  };

  check = function(p, name) {
    var c;
    c = new Contract(name, "check", function(val, pos, neg, parentKs, stack) {
      if (p(val, stack)) {
        return val;
      } else {
        return blame(pos, neg, this, val, parentKs);
      }
    });
    c.equals = function(other) {
      return (this.cname === other.cname) && (this.handler === other.handler);
    };
    return c;
  };

  fun = function(dom, rng, options) {
    var c, callOnly, calldom, callrng, cleanDom, contractName, domName, newOnly, newdom, newrng, optionsName;
    cleanDom = function(dom) {
      if (dom instanceof Contract) dom = [dom];
      dom.reduce((function(prevWasOpt, curr) {
        if (curr.ctype === "opt") {
          return true;
        } else {
          if (prevWasOpt) {
            throw "Illagal arguments: required argument following an optional argument.";
          } else {
            return false;
          }
        }
      }), false);
      return dom;
    };
    if (dom && dom.call && dom["new"]) {
      calldom = cleanDom(dom.call[0]);
      callrng = dom.call[1];
      newdom = cleanDom(dom["new"][0]);
      newrng = dom["new"][1];
      options = rng || {};
    } else {
      calldom = cleanDom(dom);
      callrng = rng;
      newdom = calldom;
      newrng = callrng;
      options = options || {};
    }
    callOnly = options && options.callOnly;
    newOnly = options && options.newOnly;
    if (callOnly && newOnly) {
      throw "Cannot have a function be both newOnly and newSafe";
    }
    if (newOnly && options["this"]) {
      throw "Illegal arguments: cannot have both newOnly and a contract on 'this'";
    }
    domName = "(" + calldom.join(",") + ")";
    optionsName = (options["this"] ? "{this: " + options["this"].cname + "}" : "");
    contractName = domName + " -> " + callrng.cname + " " + optionsName;
    c = new Contract(contractName, "fun", function(f, pos, neg, parentKs, stack) {
      var callHandler, handler, makeHandler, newHandler, p, parents, that;
      handler = idHandler(f);
      that = this;
      parents = parentKs.slice(0);
      if (typeof f !== "function") blame(pos, neg, this, f, parents);
      parents.push(that);
      /*
          options:
            isNew: Bool   - make a constructor handler (to be called with new)
            newSafe: Bool - make call handler that adds a call to new
            pre: ({} -> Bool) - function to check preconditions
            post: ({} -> Bool) - function to check postconditions
            this: {...} - object contract to check 'this'
      */
      makeHandler = function(dom, rng, options) {
        var functionHandler;
        return functionHandler = function() {
          var args, bf, boundArgs, clean_rng, i, res, thisc;
          args = [];
          if (options && options.checkStack && !(options.checkStack(stack))) {
            throw new Error("stack checking failed");
          }
          if (typeof options.pre === "function" && !options.pre(this)) {
            blame(neg, pos, "precondition: " + options.pre.toString(), "[failed precondition]", parents);
          }
          i = 0;
          while (i < dom.length) {
            args[i] = dom[i].check(arguments[i], neg, pos, parents, stack);
            i++;
          }
          if (typeof rng === "function") {
            clean_rng = rng.apply(this, args);
          } else {
            clean_rng = rng;
          }
          if (options.isNew || options.newSafe) {
            boundArgs = [].concat.apply([null], args);
            bf = f.bind.apply(f, boundArgs);
            res = new bf();
            res = clean_rng.check(res, pos, neg, parents, stack);
          } else {
            if (options["this"]) {
              thisc = options["this"].check(this, neg, pos, parents, stack);
            } else {
              thisc = this;
            }
            res = clean_rng.check(f.apply(thisc, args), pos, neg, parents, stack);
          }
          if (typeof options.post === "function" && !options.post(this)) {
            blame(neg, pos, "failed postcondition: " + options.post.toString(), "[failed postcondition]", parents);
          }
          return res;
        };
      };
      if (newOnly) {
        options.isNew = true;
        callHandler = function() {
          return blameM(neg, pos, "called newOnly function without new", parents);
        };
        newHandler = makeHandler(this.newdom, this.newrng, options);
      } else if (callOnly) {
        options.isNew = false;
        newHandler = function() {
          return blameM(neg, pos, "called callOnly function with a new", parents);
        };
        callHandler = makeHandler(this.calldom, this.callrng, options);
      } else {
        callHandler = makeHandler(this.calldom, this.callrng, options);
        newHandler = makeHandler(this.newdom, this.newrng, options);
      }
      p = Proxy.createFunction(handler, callHandler, newHandler);
      unproxy.set(p, this);
      return p;
    });
    c.calldom = calldom;
    c.callrng = callrng;
    c.newdom = newdom;
    c.newrng = newrng;
    c.raw_options = options;
    c.equals = function(other) {
      var pCDom, pNDom, pOpt, zipCDom, zipNDom;
      if (!other instanceof Contract || other.ctype !== this.ctype) return false;
      zipCDom = Utils.zip(this.calldom, other.calldom);
      zipNDom = Utils.zip(this.newdom, other.newdom);
      pCDom = (zipCDom.length !== 0) && zipCDom.every(function(zd) {
        return zd[0].equals(zd[1]);
      });
      pNDom = (zipNDom.length !== 0) && zipNDom.every(function(zd) {
        return zd[0].equals(zd[1]);
      });
      pOpt = checkOptions(this.raw_options, other.raw_options);
      return pOpt && pCDom && pNDom && (this.callrng.equals(other.callrng)) && (this.newrng.equals(other.newrng));
    };
    return c;
  };

  ctor = function(dom, rng, options) {
    var opt;
    opt = Utils.merge(options, {
      newOnly: true
    });
    return fun(dom, rng, opt);
  };

  ctorSafe = function(dom, rng, options) {
    var opt;
    opt = Utils.merge(options, {
      newSafe: true
    });
    return fun(dom, rng, opt);
  };

  object = function(objContract, options, name) {
    var c, objName, setSelfContracts;
    if (options == null) options = {};
    objName = function(obj) {
      var props;
      if (name === void 0) {
        props = Object.keys(obj).map(function(propName) {
          if (obj[propName].cname) {
            return propName + " : " + obj[propName].cname;
          } else {
            return propName + " : " + obj[propName].value.cname;
          }
        }, this);
        return "{" + props.join(", ") + "}";
      } else {
        return name;
      }
    };
    c = new Contract(objName(objContract), "object", function(obj, pos, neg, parentKs) {
      var contractDesc, handler, invariant, objDesc, op, parents, prop, that, value;
      handler = idHandler(obj);
      that = this;
      parents = parentKs.slice(0);
      parents.push(this);
      if (!obj instanceof Object) blame(pos, neg, this, obj, parentKs);
      if (options.extensible === true && !Object.isExtensible(obj)) {
        blame(pos, neg, "[extensible object]", "[non-extensible object]", parents);
      }
      if (options.extensible === false && Object.isExtensible(obj)) {
        blame(pos, neg, "[non-extensible]", "[extensible object]", parents);
      }
      if (options.sealed === true && !Object.isSealed(obj)) {
        blame(pos, neg, "[sealed object]", "[non-sealed object]", parents);
      }
      if (options.sealed === false && Object.isSealed(obj)) {
        blame(pos, neg, "[non-sealed object]", "[sealed object]", parents);
      }
      if (options.frozen === true && !Object.isFrozen(obj)) {
        blame(pos, neg, "[frozen object]", "[non-frozen object]", parents);
      }
      if (options.frozen === false && Object.isFrozen(obj)) {
        blame(pos, neg, "[non-frozen object]", "[frozen object]", parents);
      }
      for (prop in this.oc) {
        contractDesc = this.oc[prop];
        objDesc = Utils.getPropertyDescriptor(obj, prop);
        if (contractDesc instanceof Contract) {
          value = contractDesc;
        } else {
          if (contractDesc["value"]) {
            value = contractDesc["value"];
          } else {
            blameM(pos, neg, "contract property descriptor missing value property", parents);
          }
        }
        if (objDesc) {
          if (contractDesc.writable === true && !objDesc.writable) {
            blame(pos, neg, "[writable property: " + prop + "]", "[read-only property: " + prop + "]", parents);
          }
          if (contractDesc.writable === false && objDesc.writable) {
            blame(pos, neg, "[read-only property: " + prop + "]", "[writable property: " + prop + "]", parents);
          }
          if (contractDesc.configurable === true && !objDesc.configurable) {
            blame(pos, neg, "[configurable property: " + prop + "]", "[non-configurable property: " + prop + "]", parents);
          }
          if (contractDesc.configurable === false && objDesc.configurable) {
            blame(pos, neg, "[non-configurable property: " + prop + "]", "[configurable property: " + prop + "]", parents);
          }
          if (contractDesc.enumerable === true && !objDesc.enumerable) {
            blame(pos, neg, "[enumerable property: " + prop + "]", "[non-enumerable property: " + prop + "]", parents);
          }
          if (contractDesc.enumerable === false && objDesc.enumerable) {
            blame(pos, neg, "[non-enumerable property: " + prop + "]", "[enumerable property: " + prop + "]", parents);
          }
          this.oc[prop] = {
            value: value,
            writable: contractDesc.writable || objDesc.writable,
            configurable: contractDesc.configurable || objDesc.configurable,
            enumerable: contractDesc.enumerable || objDesc.enumerable
          };
        } else {
          if (value.ctype === "opt") {
            this.oc[prop] = {
              value: value,
              writable: true,
              configurable: true,
              enumerable: true
            };
          } else {
            blame(pos, neg, this, "[missing property: " + prop + "]", parents);
          }
        }
      }
      if (options.invariant) {
        invariant = options.invariant.bind(obj);
        if (!invariant()) {
          blame(neg, pos, "invariant: " + (options.invariant.toString()), obj, parents);
        }
      }
      handler.defineProperty = function(name, desc) {
        if ((options.extensible === false) || options.sealed || options.frozen) {
          blame(neg, pos, "[non-extensible object]", "[attempted to change property descriptor of: " + name + "]", parents);
        }
        if (!that.oc[name].configurable) {
          blame(neg, pos, "[non-configurable property: " + name + "]", "[attempted to change the property descriptor of property: " + name + "]", parents);
        }
        return Object.defineProperty(obj, name, desc);
      };
      handler["delete"] = function(name) {
        var res;
        res = void 0;
        invariant = void 0;
        if (options.sealed || options.frozen) {
          blame(neg, pos, "" + (options.sealed ? 'sealed' : 'frozen') + " object", "[call to delete]", parents);
        }
        res = delete obj[name];
        if (options.invariant) {
          invariant = options.invariant.bind(obj);
          if (!invariant()) {
            return blame(neg, pos, "invariant: " + (options.invariant.toString()), obj, parents);
          }
        }
      };
      handler["get"] = function(receiver, name) {
        if (that.oc.hasOwnProperty(name)) {
          return that.oc[name].value.check(obj[name], pos, neg, parents);
        } else if ((options.arrayRangeContract && (options.arrayRange !== undefined)) && (parseInt(name, 10) >= options.arrayRange)) {
          return options.arrayRangeContract.check(obj[name], pos, neg, parents);
        } else {
          return obj[name];
        }
      };
      handler.set = function(receiver, name, val) {
        if ((options.extensible === false) && Object.getOwnPropertyDescriptor(obj, name) === void 0) {
          blame(neg, pos, "non-extensible object", "[attempted to set a new property: " + name + "]", parents);
        }
        if (options.frozen) {
          blame(neg, pos, "frozen object", "[attempted to set: " + name + "]", parents);
        }
        if (that.oc.hasOwnProperty(name)) {
          if (!that.oc[name].writable) {
            blame(neg, pos, "read-only property", "[attempted to set read-only property: " + name + "]", parents);
          }
          obj[name] = that.oc[name]["value"].check(val, neg, pos, parents);
        } else if ((options.arrayRangeContract && (options.arrayRange !== void 0)) && (parseInt(name, 10) >= options.arrayRange)) {
          obj[name] = options.arrayRangeContract.check(val, neg, pos, parents);
        } else {
          obj[name] = val;
        }
        if (options.invariant) {
          invariant = options.invariant.bind(obj);
          if (!invariant()) {
            blame(neg, pos, "invariant: " + (options.invariant.toString()), obj, parents);
          }
        }
        return true;
      };
      if (typeof obj === "function") {
        op = Proxy.createFunction(handler, function(args) {
          return obj.apply(this, arguments);
        }, function(args) {
          var bf, boundArgs;
          boundArgs = [].concat.apply([null], arguments);
          bf = obj.bind.apply(obj, boundArgs);
          return new bf();
        });
      } else {
        op = Proxy.create(handler, Object.prototype);
      }
      unproxy.set(op, this);
      return op;
    });
    c.oc = objContract;
    c.raw_options = options;
    setSelfContracts = function(c, toset) {
      var childrenNames, name, _results;
      childrenNames = ["k", "k1", "k2", "flats", "ho", "calldom", "callrng", "newdom", "newrng"];
      if (typeof c.oc !== "undefined") {
        _results = [];
        for (name in c.oc) {
          if (c.oc[name] === self) {
            _results.push(c.oc[name] = toset);
          } else {
            if (c.oc[name].ctype !== "object") {
              _results.push(setSelfContracts(c.oc[name], toset));
            } else {
              _results.push(void 0);
            }
          }
        }
        return _results;
      } else {
        return childrenNames.forEach(function(cName) {
          var i, _results2;
          if (typeof c[cName] !== "undefined") {
            if (Array.isArray(c[cName])) {
              i = 0;
              _results2 = [];
              while (i < c[cName].length) {
                if (c[cName][i] === self) {
                  c[cName][i] = toset;
                } else {
                  if (c[cName][i].ctype !== "object") {
                    setSelfContracts(c[cName][i], toset);
                  }
                }
                _results2.push(i++);
              }
              return _results2;
            } else {
              if (c[cName] === self) {
                return c[cName] = toset;
              } else {
                if (c[cName] !== "object") {
                  return setSelfContracts(c[cName], toset);
                }
              }
            }
          }
        });
      }
    };
    setSelfContracts(c, c);
    c.equals = function(other) {
      if (!other instanceof Contract || other.ctype !== this.ctype) return false;
      return checkOptions(this.oc, other.oc) && checkOptions(this.raw_options, other.raw_options);
    };
    return c;
  };

  arr = function(ks) {
    var i, name, oc, prefix, rangeContract, rangeIndex;
    oc = {};
    name = "";
    prefix = "";
    i = 0;
    while (i < ks.length) {
      if (i !== 0) prefix = ", ";
      if (typeof ks[i] === "function") {
        if (i !== ks.length - 1) {
          throw "___() must be at the last position in the array";
        }
        rangeContract = ks[i]();
        rangeIndex = i;
        name += prefix + "..." + rangeContract.cname;
      } else {
        oc[i] = ks[i];
        name += prefix + ks[i].cname;
      }
      i++;
    }
    name = "[" + name + "]";
    return object(oc, {
      arrayRange: rangeIndex,
      arrayRangeContract: rangeContract
    }, name);
  };

  ___ = function(k) {
    return function() {
      return k;
    };
  };

  or_ = function() {
    var c, flats, ho, ks, name;
    ks = [].slice.call(arguments);
    flats = ks.filter(function(el) {
      return el.ctype === "check";
    });
    ho = ks.filter(function(el) {
      return el.ctype !== "check";
    });
    if (ho.length > 1) {
      throw "Cannot have more than 1 higher order contract in 'or'";
    }
    name = ks.join(" or ");
    c = new Contract(name, "or", function(val, pos, neg, parentKs) {
      var i, lastBlame, parents;
      parents = parentKs.slice(0);
      parents.push(this);
      i = 0;
      while (i < flats.length) {
        try {
          return this.flats[i].check(val, pos, neg, parents);
        } catch (e) {
          lastBlame = e;
          i++;
        }
      }
      if (ho.length === 1) {
        return this.ho[0].check(val, pos, neg, parents);
      } else {
        throw lastBlame;
      }
    });
    c.flats = flats;
    c.ho = ho;
    c.equals = function(other) {
      var pFlats, zipFlats;
      if (!other instanceof Contract || other.ctype !== this.ctype) return false;
      zipFlats = Utils.zip(this.flats, other.flats);
      pFlats = (zipFlats.length !== 0) && zipFlats.every(function(zf) {
        return zf[0].equals(zf[1]);
      });
      return pFlats && (this.ho.equals(other.ho));
    };
    return c;
  };

  and_ = function(k1, k2) {
    var c;
    c = new Contract("" + k1.cname + " and " + k2.cname, "and", function(val, pos, neg, parentKs) {
      var k1c;
      k1c = k1.check(val, pos, neg, parentKs);
      return k2.check(k1c, pos, neg, parentKs);
    });
    c.k1 = k1;
    c.k2 = k2;
    c.equals = function(other) {
      if (!other instanceof Contract || other.ctype !== this.ctype) return false;
      return (this.k1.equals(other.k1)) && (this.k2.equals(other.k2));
    };
    return c;
  };

  not_ = function(k) {
    var c;
    if (k.ctype === "fun" || k.ctype === "object") {
      throw "cannot construct a 'not' contract with a function or object contract";
    }
    c = new Contract("not " + k.cname, "not", function(val, pos, neg, parentKs) {
      var res;
      try {
        res = this.k.check(val, pos, neg, parentKs);
        return blame(pos, neg, this, val, parentKs);
      } catch (b) {
        return res;
      }
    });
    c.k = k;
    c.equals = function(other) {
      if (!other instanceof Contract || other.ctype !== this.ctype) return false;
      return this.k.equals(other.k);
    };
    return c;
  };

  opt = function(k) {
    var c;
    c = new Contract("opt(" + k.cname + ")", "opt", function(val, pos, neg, parentKs) {
      if (val === void 0) {
        return val;
      } else {
        return this.k.check(val, pos, neg, parentKs);
      }
    });
    c.k = k;
    c.equals = function(other) {
      if (!other instanceof Contract || other.ctype !== this.ctype) return false;
      return this.k.equals(other.k);
    };
    return c;
  };

  getModName = function(isServer) {
    var filename, guardedAt, linenum, match, st;
    st = printStackTrace({
      e: new Error()
    });
    guardedAt = st[2];
    match = /\/([^\/]*):(\d*)[\)]?$/.exec(guardedAt);
    if (match) {
      filename = match[1];
      linenum = match[2];
    } else {
      filename = "unknown";
      linenum = "-1";
    }
    return new ModuleName(filename, linenum, isServer);
  };

  guard = function(k, x, server, setup) {
    var stack;
    stack = [];
    if (typeof setup === "function") setup(stack);
    if (!server) {
      server = getModName(true);
    } else {
      server = new ModuleName(server, "", true);
    }
    return {
      use: function(client, srvr) {
        if (!client) {
          client = getModName(false);
        } else {
          client = new ModuleName(client, "", false);
        }
        if (srvr) server = new ModuleName(srvr, "", false);
        if ((server.filename === client.filename) && (server.linenum === client.linenum)) {
          server.linenum = server.linenum + " (server)";
          client.linenum = client.linenum + " (client)";
        }
        if (enabled) {
          return k.check(x, server, client, [], stack);
        } else {
          return x;
        }
      }
    };
  };

  any = (function() {
    var c;
    c = new Contract("any", "any", function(val) {
      return val;
    });
    c.equals = function(other) {
      return this === other;
    };
    return c;
  })();

  self = (function() {
    var c;
    c = new Contract("self", "self", function(val) {
      return val;
    });
    c.equals = function(other) {
      return this === other;
    };
    return c;
  })();

  none = (function() {
    var c;
    c = new Contract("none", "none", function(val, pos, neg, parentKs) {
      return blame(pos, neg, this, val, parentKs);
    });
    c.equals = function(other) {
      return this === other;
    };
    return c;
  })();

  combinators = {
    check: check,
    fun: fun,
    ctor: ctor,
    ctorSafe: ctorSafe,
    object: object,
    arr: arr,
    ___: ___,
    any: any,
    'or': or_,
    none: none,
    'not': not_,
    'and': and_,
    opt: opt,
    guard: guard
  };

  contracts = {
    Undefined: combinators.check((function(x) {
      return void 0 === x;
    }), "Undefined"),
    Null: combinators.check((function(x) {
      return null === x;
    }), "Null"),
    Num: combinators.check((function(x) {
      return typeof x === "number";
    }), "Num"),
    Bool: combinators.check((function(x) {
      return typeof x === "boolean";
    }), "Bool"),
    Str: combinators.check((function(x) {
      return typeof x === "string";
    }), "Str"),
    Odd: combinators.check((function(x) {
      return (x % 2) === 1;
    }), "Odd"),
    Even: combinators.check((function(x) {
      return (x % 2) !== 1;
    }), "Even"),
    Pos: combinators.check((function(x) {
      return x >= 0;
    }), "Pos"),
    Nat: combinators.check((function(x) {
      return x > 0;
    }), "Nat"),
    Neg: combinators.check((function(x) {
      return x < 0;
    }), "Neg"),
    Arr: combinators.object({
      length: combinators.check((function(x) {
        return typeof x === "number";
      }), "Number")
    }),
    Self: self,
    Any: any,
    None: none
  };

  root.Contracts = {
    combinators: combinators,
    contracts: contracts,
    enabled: function(b) {
      return enabled = b;
    }
  };

}).call(this);

// load all the contract identifiers into the global scope
function load(obj) {
  var name, root;
  root = typeof global !== "undefined" && global !== null ? global : this;
  for(name in obj) {
    if(obj.hasOwnProperty(name)) {
      root[name] = obj[name];
    }
  }
}
load(Contracts.contracts);
load(Contracts.combinators);

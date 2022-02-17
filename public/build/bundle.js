
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",];
    const keys = {
        "a": "$",
        "b": "&",
        "c": "!",
        "d": "@",
        "e": "#",
        "f": ")",
        "g": "(",
        "h": "0",
        "i": "3",
        "j": "=",
        "k": "[",
        "l": "}",
        "m": "%",
        "n": "{",
        "o": "<",
        "p": ">",
        "q": "_",
        "r": "\\",
        "s": "*",
        "t": "/",
        "u": "?",
        "v": "~",
        "w": "`",
        "x": "'",
        "y": "\"",
        "z": ".",
    };
    const reverseKeys = Object.keys(keys).reduce(((obj, value) => { obj[keys[value]] = value; return obj; }), {});
    const getCode = (letter) => (!letter) ? null : letter.toLowerCase().charCodeAt(0) - 96;
    const getLetter = (code) => String.fromCharCode(code + 96);
    function obscureWord(word) {
        return word
            .split("")
            .map((letter) => keys[getLetter(getCode(letter))])
            .join("");
    }
    function unobscureWord(obscureWord) {
        return obscureWord
            .split("")
            .map((code) => getLetter(getCode(reverseKeys[code])))
            .join("");
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    class InstantPopups {
        constructor() {
            this.popups = {};
            this.id = 0;
            this.update = false;
        }
        remove(id) {
            delete this.popups[id];
            this.update = !this.update;
            instantPopupsWritable.update((i) => i);
        }
        add(message, delay = 2000) {
            this.popups[this.id] = { message, delay };
            this.id += 1;
            this.update = !this.update;
            instantPopupsWritable.update((i) => i);
        }
    }
    const instantPopupsWritable = writable(new InstantPopups());

    class Game {
        constructor(wordLength, maxGuesses, guessesList, answersList, customWord = false, dailyWord = false) {
            this.wordLength = wordLength;
            this.maxGuesses = maxGuesses;
            this.guessesList = guessesList;
            this.answersList = answersList;
            this.dailyWord = dailyWord;
            const instantPopups = get_store_value(instantPopupsWritable);
            this.guesses = [];
            this.boxes = [...Array(maxGuesses)].map(() => [...Array(wordLength)].map(() => "empty"));
            if (customWord && dailyWord) {
                console.log("📝 Using daily word!");
                if (instantPopups)
                    instantPopups.add("Daily word detected & used!");
                this.word = customWord.toLowerCase();
            }
            else if (customWord &&
                customWord.split("").filter(l => alphabet.includes(l)).join("").length === customWord.length &&
                customWord.length === wordLength) {
                console.log("📝 Custom word detected!");
                if (instantPopups)
                    instantPopups.add("Custom word detected & used!");
                this.word = customWord.toLowerCase();
            }
            else {
                this.word = answersList[Math.floor(Math.random() * answersList.length)];
            }
            if (!guessesList.includes(this.word))
                guessesList.push(this.word);
            this.started = Date.now();
            this.endTimer = false;
            this.keyboardColors = {};
            alphabet.forEach((letter) => (this.keyboardColors[letter] = "none"));
            // if (this.word) console.log(`Word is "${this.word}" (cheater 👀)`)
        }
        getColor(color, keyboard = false) {
            switch (color) {
                case "correct":
                    return "#AFE1AF";
                case "empty":
                    return keyboard ? "dimgrey" : "#D3D3D3";
                case "semicorrect":
                    return "#FFC300";
                case "none":
                    return "";
            }
        }
        get coloredBoxes() {
            return this.boxes.map((row) => row.map((color) => this.getColor(color)));
        }
        validateInput(input) {
            if (!input)
                return "Enter something!";
            if ((input === null || input === void 0 ? void 0 : input.length) < this.wordLength)
                return "Input too short!";
            if ((input === null || input === void 0 ? void 0 : input.length) > this.wordLength)
                return "Input too long!";
            if (this.guesses.includes(input))
                return "Don't waste your guesses!";
            if (!this.guessesList.includes(input))
                return `"${input}" is not a valid word!`;
            return true;
        }
    }
    const gameWritable = writable(new Game(0, 0, [], []));

    const statsKeys = ["played", "wins", "losses", "currentStreak", "maxStreak"];
    const stats = writable(statsKeys.reduce((acc, curr) => { acc[curr] = 0; return acc; }, {}));
    const localStats = localStorage.getItem("stats");
    if (localStats) {
        let parsedStats;
        try {
            parsedStats = JSON.parse(localStats);
        }
        catch (_a) {
            parsedStats = null;
        }
        if (parsedStats) {
            statsKeys.forEach((key) => {
                if (!parsedStats[key] || typeof parsedStats[key] !== "number") {
                    parsedStats[key] = 0;
                }
            });
            Object.keys(parsedStats).forEach((key) => {
                if (!statsKeys.includes(key)) {
                    delete parsedStats[key];
                }
            });
            stats.update(() => parsedStats);
        }
        localStorage.setItem("stats", JSON.stringify(get_store_value(stats)));
    }
    else {
        localStorage.setItem("stats", JSON.stringify(get_store_value(stats)));
    }
    function updateStats(newStats) {
        stats.update(() => newStats);
        localStorage.setItem("stats", JSON.stringify(newStats));
    }

    /* src/componenets/darkmode.svelte generated by Svelte v3.46.4 */

    const file$6 = "src/componenets/darkmode.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*label*/ ctx[0]);
    			add_location(button, file$6, 30, 0, 701);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Darkmode', slots, []);
    	let { label = "🌓" } = $$props;
    	let theme = "light";

    	function applyTheme() {
    		if (theme === "dark") {
    			window.document.body.classList.add("darkMode");
    		} else {
    			window.document.body.classList.remove("darkMode");
    		}
    	}

    	if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    		theme = "dark";
    	}

    	const localTheme = localStorage.getItem("theme");

    	if (localTheme === "light" || localTheme === "dark") {
    		theme = localTheme;
    	}

    	applyTheme();

    	function click() {
    		if (theme === "dark") {
    			theme = "light";
    		} else {
    			theme = "dark";
    		}

    		applyTheme();
    		localStorage.setItem("theme", theme);
    	}

    	const writable_props = ['label'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Darkmode> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({
    		label,
    		theme,
    		applyTheme,
    		localTheme,
    		click
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('theme' in $$props) theme = $$props.theme;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, click];
    }

    class Darkmode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Darkmode",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get label() {
    		throw new Error("<Darkmode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Darkmode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componenets/popup.svelte generated by Svelte v3.46.4 */
    const file$5 = "src/componenets/popup.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let t0;
    	let button;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			button = element("button");
    			button.textContent = "Close";
    			add_location(button, file$5, 7, 4, 146);
    			attr_dev(div, "class", "popup svelte-l2rdpq");
    			add_location(div, file$5, 4, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onClose*/ ctx[0])) /*onClose*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Popup', slots, ['default']);
    	let { onClose } = $$props;
    	const writable_props = ['onClose'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Popup> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('onClose' in $$props) $$invalidate(0, onClose = $$props.onClose);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ fade, onClose });

    	$$self.$inject_state = $$props => {
    		if ('onClose' in $$props) $$invalidate(0, onClose = $$props.onClose);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onClose, $$scope, slots];
    }

    class Popup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { onClose: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popup",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onClose*/ ctx[0] === undefined && !('onClose' in props)) {
    			console.warn("<Popup> was created without expected prop 'onClose'");
    		}
    	}

    	get onClose() {
    		throw new Error("<Popup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClose(value) {
    		throw new Error("<Popup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componenets/bar.svelte generated by Svelte v3.46.4 */

    const { console: console_1$1 } = globals;
    const file$4 = "src/componenets/bar.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (53:8) {#if $gameWritable.endTimer}
    function create_if_block_3$1(ctx) {
    	let button;
    	let button_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "🔗";
    			add_location(button, file$4, 53, 12, 2019);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!button_intro) {
    				add_render_callback(() => {
    					button_intro = create_in_transition(button, fade, {});
    					button_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(53:8) {#if $gameWritable.endTimer}",
    		ctx
    	});

    	return block;
    }

    // (67:0) {#if showShareMenu}
    function create_if_block_2$1(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				onClose: /*func*/ ctx[19],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(popup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popup_changes = {};
    			if (dirty & /*showShareMenu*/ 256) popup_changes.onClose = /*func*/ ctx[19];

    			if (dirty & /*$$scope, copyGame, copyLink*/ 268435480) {
    				popup_changes.$$scope = { dirty, ctx };
    			}

    			popup.$set(popup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(67:0) {#if showShareMenu}",
    		ctx
    	});

    	return block;
    }

    // (68:4) <Popup onClose={() => (showShareMenu = false)}>
    function create_default_slot_2(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let br;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Sharing options";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "🔗 Share word (link for others to try your word)";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "🔗 Share game (sharing your guesses, word, and time)";
    			t5 = space();
    			br = element("br");
    			add_location(h2, file$4, 69, 12, 2544);
    			add_location(button0, file$4, 70, 12, 2581);
    			add_location(button1, file$4, 71, 12, 2679);
    			attr_dev(div, "class", "container svelte-k0i19s");
    			add_location(div, file$4, 68, 8, 2508);
    			add_location(br, file$4, 73, 8, 2792);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, br, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*copyLink*/ ctx[3])) /*copyLink*/ ctx[3].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*copyGame*/ ctx[4])) /*copyGame*/ ctx[4].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(68:4) <Popup onClose={() => (showShareMenu = false)}>",
    		ctx
    	});

    	return block;
    }

    // (78:0) {#if showStats}
    function create_if_block_1$2(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				onClose: /*func_1*/ ctx[20],
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(popup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popup_changes = {};
    			if (dirty & /*showStats*/ 128) popup_changes.onClose = /*func_1*/ ctx[20];

    			if (dirty & /*$$scope, $stats*/ 268437504) {
    				popup_changes.$$scope = { dirty, ctx };
    			}

    			popup.$set(popup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(78:0) {#if showStats}",
    		ctx
    	});

    	return block;
    }

    // (79:4) <Popup onClose={() => (showStats = false)}>
    function create_default_slot_1$1(ctx) {
    	let div13;
    	let h2;
    	let t1;
    	let div12;
    	let div2;
    	let div0;
    	let t2_value = /*$stats*/ ctx[11].played + "";
    	let t2;
    	let t3;
    	let div1;
    	let t5;
    	let div5;
    	let div3;

    	let t6_value = Math.round((!(/*$stats*/ ctx[11].wins / /*$stats*/ ctx[11].played)
    	? 0
    	: /*$stats*/ ctx[11].wins / /*$stats*/ ctx[11].played) * 1000) / 10 + "";

    	let t6;
    	let t7;
    	let div4;
    	let t9;
    	let div8;
    	let div6;
    	let t10_value = /*$stats*/ ctx[11].currentStreak + "";
    	let t10;
    	let t11;
    	let div7;
    	let t13;
    	let div11;
    	let div9;
    	let t14_value = /*$stats*/ ctx[11].maxStreak + "";
    	let t14;
    	let t15;
    	let div10;

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Statistics";
    			t1 = space();
    			div12 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "Played";
    			t5 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "Win %";
    			t9 = space();
    			div8 = element("div");
    			div6 = element("div");
    			t10 = text(t10_value);
    			t11 = space();
    			div7 = element("div");
    			div7.textContent = "Current streak";
    			t13 = space();
    			div11 = element("div");
    			div9 = element("div");
    			t14 = text(t14_value);
    			t15 = space();
    			div10 = element("div");
    			div10.textContent = "Max streak";
    			add_location(h2, file$4, 80, 12, 2927);
    			attr_dev(div0, "class", "statValue svelte-k0i19s");
    			add_location(div0, file$4, 83, 20, 3034);
    			attr_dev(div1, "class", "statKey svelte-k0i19s");
    			add_location(div1, file$4, 84, 20, 3099);
    			attr_dev(div2, "class", "stat svelte-k0i19s");
    			add_location(div2, file$4, 82, 16, 2995);
    			attr_dev(div3, "class", "statValue svelte-k0i19s");
    			add_location(div3, file$4, 87, 20, 3211);
    			attr_dev(div4, "class", "statKey svelte-k0i19s");
    			add_location(div4, file$4, 90, 20, 3399);
    			attr_dev(div5, "class", "stat svelte-k0i19s");
    			add_location(div5, file$4, 86, 16, 3172);
    			attr_dev(div6, "class", "statValue svelte-k0i19s");
    			add_location(div6, file$4, 93, 20, 3510);
    			attr_dev(div7, "class", "statKey svelte-k0i19s");
    			add_location(div7, file$4, 94, 20, 3582);
    			attr_dev(div8, "class", "stat svelte-k0i19s");
    			add_location(div8, file$4, 92, 16, 3471);
    			attr_dev(div9, "class", "statValue svelte-k0i19s");
    			add_location(div9, file$4, 97, 20, 3702);
    			attr_dev(div10, "class", "statKey svelte-k0i19s");
    			add_location(div10, file$4, 98, 20, 3770);
    			attr_dev(div11, "class", "stat svelte-k0i19s");
    			add_location(div11, file$4, 96, 16, 3663);
    			attr_dev(div12, "class", "stats svelte-k0i19s");
    			add_location(div12, file$4, 81, 12, 2959);
    			attr_dev(div13, "class", "container svelte-k0i19s");
    			add_location(div13, file$4, 79, 8, 2891);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, h2);
    			append_dev(div13, t1);
    			append_dev(div13, div12);
    			append_dev(div12, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div12, t5);
    			append_dev(div12, div5);
    			append_dev(div5, div3);
    			append_dev(div3, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div12, t9);
    			append_dev(div12, div8);
    			append_dev(div8, div6);
    			append_dev(div6, t10);
    			append_dev(div8, t11);
    			append_dev(div8, div7);
    			append_dev(div12, t13);
    			append_dev(div12, div11);
    			append_dev(div11, div9);
    			append_dev(div9, t14);
    			append_dev(div11, t15);
    			append_dev(div11, div10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$stats*/ 2048 && t2_value !== (t2_value = /*$stats*/ ctx[11].played + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$stats*/ 2048 && t6_value !== (t6_value = Math.round((!(/*$stats*/ ctx[11].wins / /*$stats*/ ctx[11].played)
    			? 0
    			: /*$stats*/ ctx[11].wins / /*$stats*/ ctx[11].played) * 1000) / 10 + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$stats*/ 2048 && t10_value !== (t10_value = /*$stats*/ ctx[11].currentStreak + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*$stats*/ 2048 && t14_value !== (t14_value = /*$stats*/ ctx[11].maxStreak + "")) set_data_dev(t14, t14_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(79:4) <Popup onClose={() => (showStats = false)}>",
    		ctx
    	});

    	return block;
    }

    // (106:0) {#if showWordMenu}
    function create_if_block$2(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				onClose: /*func_2*/ ctx[23],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(popup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popup_changes = {};
    			if (dirty & /*showWordMenu*/ 2) popup_changes.onClose = /*func_2*/ ctx[23];

    			if (dirty & /*$$scope, tries, customWord*/ 268436000) {
    				popup_changes.$$scope = { dirty, ctx };
    			}

    			popup.$set(popup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(106:0) {#if showWordMenu}",
    		ctx
    	});

    	return block;
    }

    // (116:20) {#each Array(7) as _, i}
    function create_each_block$3(ctx) {
    	let option;
    	let t0_value = /*i*/ ctx[27] + 3 + "";
    	let t0;
    	let t1;
    	let t2_value = (/*i*/ ctx[27] + 3 === 6 ? "(deafult)" : "") + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" tries ");
    			t2 = text(t2_value);
    			t3 = space();
    			option.__value = /*i*/ ctx[27] + 3;
    			option.value = option.__value;
    			add_location(option, file$4, 116, 24, 4429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			append_dev(option, t2);
    			append_dev(option, t3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(116:20) {#each Array(7) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (107:4) <Popup onClose={() => (showWordMenu = false)}>
    function create_default_slot$1(ctx) {
    	let div2;
    	let h2;
    	let t1;
    	let div0;
    	let t3;
    	let br0;
    	let t4;
    	let div1;
    	let input;
    	let t5;
    	let select;
    	let t6;
    	let button;
    	let t8;
    	let br1;
    	let mounted;
    	let dispose;
    	let each_value = Array(7);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Share custom word";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Create a copyable link with a custom word to stump your friends (does not have to be a valid word) (3-7 letter words)!";
    			t3 = space();
    			br0 = element("br");
    			t4 = space();
    			div1 = element("div");
    			input = element("input");
    			t5 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			button = element("button");
    			button.textContent = "Copy sharable link";
    			t8 = space();
    			br1 = element("br");
    			add_location(h2, file$4, 108, 12, 3999);
    			set_style(div0, "text-align", "center");
    			add_location(div0, file$4, 109, 12, 4038);
    			add_location(br0, file$4, 110, 12, 4207);
    			attr_dev(input, "placeholder", "Word");
    			attr_dev(input, "maxlength", "7");
    			add_location(input, file$4, 113, 16, 4249);
    			if (/*tries*/ ctx[9] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[22].call(select));
    			add_location(select, file$4, 114, 16, 4332);
    			add_location(button, file$4, 120, 26, 4615);
    			add_location(div1, file$4, 112, 12, 4227);
    			attr_dev(div2, "class", "container svelte-k0i19s");
    			add_location(div2, file$4, 107, 8, 3963);
    			add_location(br1, file$4, 123, 8, 4720);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div2, t3);
    			append_dev(div2, br0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*customWord*/ ctx[5]);
    			append_dev(div1, t5);
    			append_dev(div1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*tries*/ ctx[9]);
    			append_dev(div1, t6);
    			append_dev(div1, button);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, br1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[21]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[22]),
    					listen_dev(button, "click", /*shareCustomWord*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*customWord*/ 32 && input.value !== /*customWord*/ ctx[5]) {
    				set_input_value(input, /*customWord*/ ctx[5]);
    			}

    			if (dirty & /*tries*/ 512) {
    				select_option(select, /*tries*/ ctx[9]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(br1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(107:4) <Popup onClose={() => (showWordMenu = false)}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let button0;
    	let t1;
    	let darkmode;
    	let t2;
    	let t3;
    	let div1;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let t9;
    	let h3;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let if_block3_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	darkmode = new Darkmode({ $$inline: true });
    	let if_block0 = /*$gameWritable*/ ctx[10].endTimer && create_if_block_3$1(ctx);
    	let if_block1 = /*showShareMenu*/ ctx[8] && create_if_block_2$1(ctx);
    	let if_block2 = /*showStats*/ ctx[7] && create_if_block_1$2(ctx);
    	let if_block3 = /*showWordMenu*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "📩";
    			t1 = space();
    			create_component(darkmode.$$.fragment);
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			div1 = element("div");
    			button1 = element("button");
    			button1.textContent = "🔨";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "📊";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "🔄";
    			t9 = space();
    			h3 = element("h3");
    			t10 = text(/*timeElapsed*/ ctx[6]);
    			t11 = space();
    			if (if_block1) if_block1.c();
    			t12 = space();
    			if (if_block2) if_block2.c();
    			t13 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    			add_location(button0, file$4, 50, 8, 1881);
    			set_style(div0, "position", "absolute");
    			set_style(div0, "left", "10px");
    			add_location(div0, file$4, 49, 4, 1829);
    			add_location(button1, file$4, 58, 8, 2180);
    			add_location(button2, file$4, 59, 8, 2242);
    			add_location(button3, file$4, 60, 8, 2312);
    			set_style(div1, "position", "absolute");
    			set_style(div1, "right", "10px");
    			add_location(div1, file$4, 57, 4, 2127);
    			attr_dev(h3, "class", "timer svelte-k0i19s");
    			add_location(h3, file$4, 63, 4, 2383);
    			attr_dev(div2, "class", "sidebar svelte-k0i19s");
    			add_location(div2, file$4, 48, 0, 1784);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			mount_component(darkmode, div0, null);
    			append_dev(div0, t2);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, button1);
    			append_dev(div1, t5);
    			append_dev(div1, button2);
    			append_dev(div1, t7);
    			append_dev(div1, button3);
    			append_dev(div2, t9);
    			append_dev(div2, h3);
    			append_dev(h3, t10);
    			/*div2_binding*/ ctx[18](div2);
    			insert_dev(target, t11, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t12, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t13, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, if_block3_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[13], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[15], false, false, false),
    					listen_dev(button2, "click", /*click_handler_3*/ ctx[16], false, false, false),
    					listen_dev(button3, "click", /*click_handler_4*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$gameWritable*/ ctx[10].endTimer) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$gameWritable*/ 1024) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*timeElapsed*/ 64) set_data_dev(t10, /*timeElapsed*/ ctx[6]);

    			if (/*showShareMenu*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*showShareMenu*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t12.parentNode, t12);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*showStats*/ ctx[7]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*showStats*/ 128) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t13.parentNode, t13);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*showWordMenu*/ ctx[1]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*showWordMenu*/ 2) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(darkmode.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(darkmode.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(darkmode);
    			if (if_block0) if_block0.d();
    			/*div2_binding*/ ctx[18](null);
    			if (detaching) detach_dev(t11);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t12);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t13);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(if_block3_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $instantPopupsWritable;
    	let $gameWritable;
    	let $stats;
    	validate_store(instantPopupsWritable, 'instantPopupsWritable');
    	component_subscribe($$self, instantPopupsWritable, $$value => $$invalidate(24, $instantPopupsWritable = $$value));
    	validate_store(gameWritable, 'gameWritable');
    	component_subscribe($$self, gameWritable, $$value => $$invalidate(10, $gameWritable = $$value));
    	validate_store(stats, 'stats');
    	component_subscribe($$self, stats, $$value => $$invalidate(11, $stats = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Bar', slots, []);
    	let { toggleSettings } = $$props;
    	let { copyLink } = $$props;
    	let { copyGame } = $$props;
    	let { barDiv } = $$props;
    	let timeElapsed = "00:00";

    	setInterval(
    		() => {
    			if ($gameWritable.endTimer) return;
    			$$invalidate(6, timeElapsed = new Date(Date.now() - $gameWritable.started).toISOString().substring(14, 19));
    		},
    		1000
    	);

    	let showStats = false;
    	let showShareMenu = false;
    	let { showWordMenu = false } = $$props;
    	let customWord;
    	let tries = 6;

    	const shareCustomWord = async () => {
    		if (!customWord) return $instantPopupsWritable.add("Enter something!");

    		if ((customWord === null || customWord === void 0
    		? void 0
    		: customWord.length) < 3) return $instantPopupsWritable.add("Word has to be more than 3 characters!");

    		if ((customWord === null || customWord === void 0
    		? void 0
    		: customWord.length) > 7) return $instantPopupsWritable.add("Word has to be less than 7 characters!");

    		navigator.clipboard.writeText(`${window.location.href.split("?")[0]}?wordLength=${customWord.length}&maxGuesses=${tries}&word=${obscureWord(customWord)}`).then(() => {
    			$instantPopupsWritable.add("Link copied to clipboard!");
    		}).catch(err => {
    			console.error(err);
    			$instantPopupsWritable.add("An error has occured!");
    		});
    	};

    	const writable_props = ['toggleSettings', 'copyLink', 'copyGame', 'barDiv', 'showWordMenu'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Bar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, showWordMenu = !showWordMenu);
    	const click_handler_1 = () => $$invalidate(8, showShareMenu = !showShareMenu);
    	const click_handler_2 = () => toggleSettings();
    	const click_handler_3 = () => $$invalidate(7, showStats = !showStats);
    	const click_handler_4 = () => location.reload();

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			barDiv = $$value;
    			$$invalidate(0, barDiv);
    		});
    	}

    	const func = () => $$invalidate(8, showShareMenu = false);
    	const func_1 = () => $$invalidate(7, showStats = false);

    	function input_input_handler() {
    		customWord = this.value;
    		$$invalidate(5, customWord);
    	}

    	function select_change_handler() {
    		tries = select_value(this);
    		$$invalidate(9, tries);
    	}

    	const func_2 = () => $$invalidate(1, showWordMenu = false);

    	$$self.$$set = $$props => {
    		if ('toggleSettings' in $$props) $$invalidate(2, toggleSettings = $$props.toggleSettings);
    		if ('copyLink' in $$props) $$invalidate(3, copyLink = $$props.copyLink);
    		if ('copyGame' in $$props) $$invalidate(4, copyGame = $$props.copyGame);
    		if ('barDiv' in $$props) $$invalidate(0, barDiv = $$props.barDiv);
    		if ('showWordMenu' in $$props) $$invalidate(1, showWordMenu = $$props.showWordMenu);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		alphabet,
    		obscureWord,
    		gameWritable,
    		instantPopupsWritable,
    		stats,
    		Darkmode,
    		Popup,
    		toggleSettings,
    		copyLink,
    		copyGame,
    		barDiv,
    		timeElapsed,
    		showStats,
    		showShareMenu,
    		showWordMenu,
    		customWord,
    		tries,
    		shareCustomWord,
    		$instantPopupsWritable,
    		$gameWritable,
    		$stats
    	});

    	$$self.$inject_state = $$props => {
    		if ('toggleSettings' in $$props) $$invalidate(2, toggleSettings = $$props.toggleSettings);
    		if ('copyLink' in $$props) $$invalidate(3, copyLink = $$props.copyLink);
    		if ('copyGame' in $$props) $$invalidate(4, copyGame = $$props.copyGame);
    		if ('barDiv' in $$props) $$invalidate(0, barDiv = $$props.barDiv);
    		if ('timeElapsed' in $$props) $$invalidate(6, timeElapsed = $$props.timeElapsed);
    		if ('showStats' in $$props) $$invalidate(7, showStats = $$props.showStats);
    		if ('showShareMenu' in $$props) $$invalidate(8, showShareMenu = $$props.showShareMenu);
    		if ('showWordMenu' in $$props) $$invalidate(1, showWordMenu = $$props.showWordMenu);
    		if ('customWord' in $$props) $$invalidate(5, customWord = $$props.customWord);
    		if ('tries' in $$props) $$invalidate(9, tries = $$props.tries);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*customWord*/ 32) {
    			$$invalidate(5, customWord = customWord
    			? customWord.toLowerCase().split("").filter(letter => alphabet.includes(letter)).join("")
    			: customWord);
    		}
    	};

    	return [
    		barDiv,
    		showWordMenu,
    		toggleSettings,
    		copyLink,
    		copyGame,
    		customWord,
    		timeElapsed,
    		showStats,
    		showShareMenu,
    		tries,
    		$gameWritable,
    		$stats,
    		shareCustomWord,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		div2_binding,
    		func,
    		func_1,
    		input_input_handler,
    		select_change_handler,
    		func_2
    	];
    }

    class Bar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			toggleSettings: 2,
    			copyLink: 3,
    			copyGame: 4,
    			barDiv: 0,
    			showWordMenu: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bar",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*toggleSettings*/ ctx[2] === undefined && !('toggleSettings' in props)) {
    			console_1$1.warn("<Bar> was created without expected prop 'toggleSettings'");
    		}

    		if (/*copyLink*/ ctx[3] === undefined && !('copyLink' in props)) {
    			console_1$1.warn("<Bar> was created without expected prop 'copyLink'");
    		}

    		if (/*copyGame*/ ctx[4] === undefined && !('copyGame' in props)) {
    			console_1$1.warn("<Bar> was created without expected prop 'copyGame'");
    		}

    		if (/*barDiv*/ ctx[0] === undefined && !('barDiv' in props)) {
    			console_1$1.warn("<Bar> was created without expected prop 'barDiv'");
    		}
    	}

    	get toggleSettings() {
    		throw new Error("<Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleSettings(value) {
    		throw new Error("<Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copyLink() {
    		throw new Error("<Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copyLink(value) {
    		throw new Error("<Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get copyGame() {
    		throw new Error("<Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set copyGame(value) {
    		throw new Error("<Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get barDiv() {
    		throw new Error("<Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set barDiv(value) {
    		throw new Error("<Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showWordMenu() {
    		throw new Error("<Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showWordMenu(value) {
    		throw new Error("<Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componenets/instantpopup.svelte generated by Svelte v3.46.4 */
    const file$3 = "src/componenets/instantpopup.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*message*/ ctx[0]);
    			attr_dev(div, "class", "instantpopup svelte-11vgyrm");
    			add_location(div, file$3, 7, 0, 163);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*message*/ 1) set_data_dev(t, /*message*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, fade, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Instantpopup', slots, []);
    	let { message } = $$props;
    	let { duration } = $$props;
    	let { destroy } = $$props;
    	setTimeout(destroy, duration);
    	const writable_props = ['message', 'duration', 'destroy'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Instantpopup> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('duration' in $$props) $$invalidate(1, duration = $$props.duration);
    		if ('destroy' in $$props) $$invalidate(2, destroy = $$props.destroy);
    	};

    	$$self.$capture_state = () => ({ fade, message, duration, destroy });

    	$$self.$inject_state = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('duration' in $$props) $$invalidate(1, duration = $$props.duration);
    		if ('destroy' in $$props) $$invalidate(2, destroy = $$props.destroy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, duration, destroy];
    }

    class Instantpopup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { message: 0, duration: 1, destroy: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Instantpopup",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !('message' in props)) {
    			console.warn("<Instantpopup> was created without expected prop 'message'");
    		}

    		if (/*duration*/ ctx[1] === undefined && !('duration' in props)) {
    			console.warn("<Instantpopup> was created without expected prop 'duration'");
    		}

    		if (/*destroy*/ ctx[2] === undefined && !('destroy' in props)) {
    			console.warn("<Instantpopup> was created without expected prop 'destroy'");
    		}
    	}

    	get message() {
    		throw new Error("<Instantpopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Instantpopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Instantpopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Instantpopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get destroy() {
    		throw new Error("<Instantpopup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set destroy(value) {
    		throw new Error("<Instantpopup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componenets/keyboard.svelte generated by Svelte v3.46.4 */
    const file$2 = "src/componenets/keyboard.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (31:20) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let t_value = /*key*/ ctx[11].toUpperCase() + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[6](/*key*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "key svelte-r0o5in");
    			set_style(button, "background-color", /*$gameWritable*/ ctx[2].getColor(/*$gameWritable*/ ctx[2].keyboardColors[/*key*/ ctx[11]], true));
    			add_location(button, file$2, 31, 24, 1809);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$gameWritable*/ 4) {
    				set_style(button, "background-color", /*$gameWritable*/ ctx[2].getColor(/*$gameWritable*/ ctx[2].keyboardColors[/*key*/ ctx[11]], true));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(31:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:20) {#if key.length !== 1}
    function create_if_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*key*/ ctx[11] === "backspace") return create_if_block_1$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(16:20) {#if key.length !== 1}",
    		ctx
    	});

    	return block;
    }

    // (28:24) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let t_value = /*key*/ ctx[11] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*key*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "specialKey svelte-r0o5in");
    			add_location(button, file$2, 28, 28, 1649);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(28:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:24) {#if key === "backspace"}
    function create_if_block_1$1(ctx) {
    	let button;
    	let svg;
    	let path0;
    	let path1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*key*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M5.83 5.146a.5.5 0 0 0 0 .708L7.975 8l-2.147 2.146a.5.5 0 0 0 .707.708l2.147-2.147 2.146 2.147a.5.5 0 0 0 .707-.708L9.39 8l2.146-2.146a.5.5 0 0 0-.707-.708L8.683 7.293 6.536 5.146a.5.5 0 0 0-.707 0z");
    			add_location(path0, file$2, 19, 36, 869);
    			attr_dev(path1, "d", "M13.683 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7.08a2 2 0 0 1-1.519-.698L.241 8.65a1 1 0 0 1 0-1.302L5.084 1.7A2 2 0 0 1 6.603 1h7.08zm-7.08 1a1 1 0 0 0-.76.35L1 8l4.844 5.65a1 1 0 0 0 .759.35h7.08a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-7.08z");
    			add_location(path1, file$2, 22, 36, 1193);
    			attr_dev(svg, "width", "40");
    			attr_dev(svg, "height", "30");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			add_location(svg, file$2, 18, 33, 764);
    			attr_dev(button, "class", "specialKey svelte-r0o5in");
    			add_location(button, file$2, 17, 28, 668);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(17:24) {#if key === \\\"backspace\\\"}",
    		ctx
    	});

    	return block;
    }

    // (15:16) {#each keyboardRow as key}
    function create_each_block_1$2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*key*/ ctx[11].length !== 1) return create_if_block$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(15:16) {#each keyboardRow as key}",
    		ctx
    	});

    	return block;
    }

    // (13:8) {#each keyboard as keyboardRow}
    function create_each_block$2(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*keyboardRow*/ ctx[8];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "keyboardRow svelte-r0o5in");
    			set_style(div, "--columns", /*keyboardRow*/ ctx[8].length);
    			add_location(div, file$2, 13, 12, 438);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*keyboardPress, keyboard, $gameWritable*/ 14) {
    				each_value_1 = /*keyboardRow*/ ctx[8];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(13:8) {#each keyboard as keyboardRow}",
    		ctx
    	});

    	return block;
    }

    // (12:4) {#key $gameWritable}
    function create_key_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*keyboard*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*keyboard, keyboardPress, $gameWritable*/ 14) {
    				each_value = /*keyboard*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block$1.name,
    		type: "key",
    		source: "(12:4) {#key $gameWritable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let previous_key = /*$gameWritable*/ ctx[2];
    	let key_block = create_key_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			key_block.c();
    			attr_dev(div, "class", "keyboard svelte-r0o5in");
    			add_location(div, file$2, 10, 0, 314);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			key_block.m(div, null);
    			/*div_binding*/ ctx[7](div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$gameWritable*/ 4 && safe_not_equal(previous_key, previous_key = /*$gameWritable*/ ctx[2])) {
    				key_block.d(1);
    				key_block = create_key_block$1(ctx);
    				key_block.c();
    				key_block.m(div, null);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			key_block.d(detaching);
    			/*div_binding*/ ctx[7](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $gameWritable;
    	validate_store(gameWritable, 'gameWritable');
    	component_subscribe($$self, gameWritable, $$value => $$invalidate(2, $gameWritable = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Keyboard', slots, []);
    	let { keyboardPress } = $$props;

    	const keyboard = [
    		["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    		["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    		["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"]
    	];

    	let { keyboardDiv } = $$props;
    	const writable_props = ['keyboardPress', 'keyboardDiv'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Keyboard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = key => keyboardPress(key);
    	const click_handler_1 = key => keyboardPress(key);
    	const click_handler_2 = key => keyboardPress(key);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			keyboardDiv = $$value;
    			$$invalidate(0, keyboardDiv);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('keyboardPress' in $$props) $$invalidate(1, keyboardPress = $$props.keyboardPress);
    		if ('keyboardDiv' in $$props) $$invalidate(0, keyboardDiv = $$props.keyboardDiv);
    	};

    	$$self.$capture_state = () => ({
    		gameWritable,
    		keyboardPress,
    		keyboard,
    		keyboardDiv,
    		$gameWritable
    	});

    	$$self.$inject_state = $$props => {
    		if ('keyboardPress' in $$props) $$invalidate(1, keyboardPress = $$props.keyboardPress);
    		if ('keyboardDiv' in $$props) $$invalidate(0, keyboardDiv = $$props.keyboardDiv);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		keyboardDiv,
    		keyboardPress,
    		$gameWritable,
    		keyboard,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		div_binding
    	];
    }

    class Keyboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { keyboardPress: 1, keyboardDiv: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Keyboard",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*keyboardPress*/ ctx[1] === undefined && !('keyboardPress' in props)) {
    			console.warn("<Keyboard> was created without expected prop 'keyboardPress'");
    		}

    		if (/*keyboardDiv*/ ctx[0] === undefined && !('keyboardDiv' in props)) {
    			console.warn("<Keyboard> was created without expected prop 'keyboardDiv'");
    		}
    	}

    	get keyboardPress() {
    		throw new Error("<Keyboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keyboardPress(value) {
    		throw new Error("<Keyboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get keyboardDiv() {
    		throw new Error("<Keyboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keyboardDiv(value) {
    		throw new Error("<Keyboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componenets/settings.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/componenets/settings.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (10:8) {#each Array(5) as _, i}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t0_value = /*i*/ ctx[10] + 3 + "";
    	let t0;
    	let t1;
    	let t2_value = (/*i*/ ctx[10] + 3 === 5 ? "(deafult)" : "") + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" letter words ");
    			t2 = text(t2_value);
    			t3 = space();
    			option.__value = /*i*/ ctx[10] + 3;
    			option.value = option.__value;
    			add_location(option, file$1, 10, 12, 276);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			append_dev(option, t2);
    			append_dev(option, t3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(10:8) {#each Array(5) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (17:8) {#each Array(7) as _, i}
    function create_each_block$1(ctx) {
    	let option;
    	let t0_value = /*i*/ ctx[10] + 3 + "";
    	let t0;
    	let t1;
    	let t2_value = (/*i*/ ctx[10] + 3 === 6 ? "(deafult)" : "") + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" tries ");
    			t2 = text(t2_value);
    			t3 = space();
    			option.__value = /*i*/ ctx[10] + 3;
    			option.value = option.__value;
    			add_location(option, file$1, 17, 12, 498);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			append_dev(option, t2);
    			append_dev(option, t3);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(17:8) {#each Array(7) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let select0;
    	let t0;
    	let select1;
    	let t1;
    	let select2;
    	let option0;
    	let option1;
    	let t4;
    	let button0;
    	let strong;
    	let t6;
    	let button1;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = Array(5);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = Array(7);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			select2 = element("select");
    			option0 = element("option");
    			option0.textContent = "Use daily word (will make guesses 6) ";
    			option1 = element("option");
    			option1.textContent = "Don't use daily word (deafult)";
    			t4 = space();
    			button0 = element("button");
    			strong = element("strong");
    			strong.textContent = "Apply settings (will reset)";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Cancel";
    			if (/*wordLength*/ ctx[1] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[4].call(select0));
    			add_location(select0, file$1, 8, 4, 198);
    			if (/*tries*/ ctx[2] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[5].call(select1));
    			add_location(select1, file$1, 15, 4, 425);
    			option0.__value = true;
    			option0.value = option0.__value;
    			add_location(option0, file$1, 23, 8, 676);
    			option1.__value = false;
    			option1.value = option1.__value;
    			add_location(option1, file$1, 24, 8, 753);
    			if (/*daily*/ ctx[3] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[6].call(select2));
    			add_location(select2, file$1, 22, 4, 640);
    			add_location(strong, file$1, 27, 133, 965);
    			add_location(button0, file$1, 27, 4, 836);
    			add_location(button1, file$1, 28, 4, 1023);
    			attr_dev(div, "class", "settings svelte-1w4wnnm");
    			add_location(div, file$1, 7, 0, 152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*wordLength*/ ctx[1]);
    			append_dev(div, t0);
    			append_dev(div, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*tries*/ ctx[2]);
    			append_dev(div, t1);
    			append_dev(div, select2);
    			append_dev(select2, option0);
    			append_dev(select2, option1);
    			select_option(select2, /*daily*/ ctx[3]);
    			append_dev(div, t4);
    			append_dev(div, button0);
    			append_dev(button0, strong);
    			append_dev(div, t6);
    			append_dev(div, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[4]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[5]),
    					listen_dev(select2, "change", /*select2_change_handler*/ ctx[6]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*closeSettings*/ ctx[0])) /*closeSettings*/ ctx[0].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*wordLength*/ 2) {
    				select_option(select0, /*wordLength*/ ctx[1]);
    			}

    			if (dirty & /*tries*/ 4) {
    				select_option(select1, /*tries*/ ctx[2]);
    			}

    			if (dirty & /*daily*/ 8) {
    				select_option(select2, /*daily*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, slide, {});
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, slide, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);
    	let { closeSettings } = $$props;
    	let wordLength = 5;
    	let tries = 6;
    	let daily = false;
    	const writable_props = ['closeSettings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function select0_change_handler() {
    		wordLength = select_value(this);
    		$$invalidate(1, wordLength);
    	}

    	function select1_change_handler() {
    		tries = select_value(this);
    		$$invalidate(2, tries);
    	}

    	function select2_change_handler() {
    		daily = select_value(this);
    		$$invalidate(3, daily);
    	}

    	const click_handler = () => window.location.href = `./?wordLength=${wordLength}&maxGuesses=${tries}${daily ? "&word=daily" : ""}`;

    	$$self.$$set = $$props => {
    		if ('closeSettings' in $$props) $$invalidate(0, closeSettings = $$props.closeSettings);
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		closeSettings,
    		wordLength,
    		tries,
    		daily
    	});

    	$$self.$inject_state = $$props => {
    		if ('closeSettings' in $$props) $$invalidate(0, closeSettings = $$props.closeSettings);
    		if ('wordLength' in $$props) $$invalidate(1, wordLength = $$props.wordLength);
    		if ('tries' in $$props) $$invalidate(2, tries = $$props.tries);
    		if ('daily' in $$props) $$invalidate(3, daily = $$props.daily);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		closeSettings,
    		wordLength,
    		tries,
    		daily,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler,
    		click_handler
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { closeSettings: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*closeSettings*/ ctx[0] === undefined && !('closeSettings' in props)) {
    			console.warn("<Settings> was created without expected prop 'closeSettings'");
    		}
    	}

    	get closeSettings() {
    		throw new Error("<Settings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeSettings(value) {
    		throw new Error("<Settings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function copyLink() {
        const instantPopups = get_store_value(instantPopupsWritable);
        const game = get_store_value(gameWritable);
        navigator.clipboard
            .writeText(game.dailyWord
            ? `${window.location.href.split("?")[0]}?wordLength=${game.wordLength}&maxGuesses=${game.maxGuesses}&word=daily`
            : `${window.location.href.split("?")[0]}?wordLength=${game.wordLength}&maxGuesses=${game.maxGuesses}&word=${obscureWord(game.word)}`)
            .then(() => {
            instantPopups.add("Link copied to clipboard!");
        })
            .catch((err) => {
            console.error(err);
            instantPopups.add("An error has occured!");
        });
    }
    function copyGame() {
        const instantPopups = get_store_value(instantPopupsWritable);
        const game = get_store_value(gameWritable);
        const message = [];
        message.push(`Wordimik | ⌚ ${new Date(game.endTimer - game.started).toISOString().substring(14, 19)}s | 📕 "${game.word}"\n`);
        game.boxes.forEach((row, i) => {
            const rowMessage = [];
            row.forEach((box) => {
                switch (box) {
                    case "correct":
                        rowMessage.push("🟩");
                        break;
                    case "empty":
                        rowMessage.push("⬜");
                        break;
                    case "semicorrect":
                        rowMessage.push("🟨");
                        break;
                }
            });
            if (game.guesses[i])
                rowMessage.push(` - ${game.guesses[i]}`);
            message.push(rowMessage.join(""));
        });
        message.push(`
Click the link below to try a game of Wordimik!
${window.location.href.split("?")[0]}?wordLength=${game.wordLength}&maxGuesses=${game.maxGuesses}`);
        navigator.clipboard
            .writeText(message.join("\n"))
            .then(() => {
            instantPopups.add("Link copied to clipboard!");
        })
            .catch((err) => {
            console.error(err);
            instantPopups.add("An error has occured!");
        });
    }

    /* src/App.svelte generated by Svelte v3.46.4 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[39] = list[i];
    	child_ctx[41] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[42] = list[i];
    	child_ctx[44] = i;
    	return child_ctx;
    }

    // (235:1) {#if $gameWritable.wordLength !== 0}
    function create_if_block_3(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let keyboard;
    	let updating_keyboardDiv;
    	let current;
    	let each_value_1 = /*$gameWritable*/ ctx[10].coloredBoxes;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function keyboard_keyboardDiv_binding(value) {
    		/*keyboard_keyboardDiv_binding*/ ctx[17](value);
    	}

    	let keyboard_props = { keyboardPress: /*keyboardPress*/ ctx[12] };

    	if (/*keyboardDiv*/ ctx[0] !== void 0) {
    		keyboard_props.keyboardDiv = /*keyboardDiv*/ ctx[0];
    	}

    	keyboard = new Keyboard({ props: keyboard_props, $$inline: true });
    	binding_callbacks.push(() => bind(keyboard, 'keyboardDiv', keyboard_keyboardDiv_binding));

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div1 = element("div");
    			create_component(keyboard.$$.fragment);
    			attr_dev(div0, "class", "game svelte-1o4i9s4");
    			set_style(div0, "--max-guesses", /*$gameWritable*/ ctx[10].maxGuesses);
    			set_style(div0, "--word-length", /*$gameWritable*/ ctx[10].wordLength);
    			add_location(div0, file, 236, 2, 10545);
    			attr_dev(div1, "class", "input svelte-1o4i9s4");
    			add_location(div1, file, 255, 2, 11276);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div0_binding*/ ctx[16](div0);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(keyboard, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$gameWritable, input*/ 1032) {
    				each_value_1 = /*$gameWritable*/ ctx[10].coloredBoxes;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty[0] & /*$gameWritable*/ 1024) {
    				set_style(div0, "--max-guesses", /*$gameWritable*/ ctx[10].maxGuesses);
    			}

    			if (!current || dirty[0] & /*$gameWritable*/ 1024) {
    				set_style(div0, "--word-length", /*$gameWritable*/ ctx[10].wordLength);
    			}

    			const keyboard_changes = {};

    			if (!updating_keyboardDiv && dirty[0] & /*keyboardDiv*/ 1) {
    				updating_keyboardDiv = true;
    				keyboard_changes.keyboardDiv = /*keyboardDiv*/ ctx[0];
    				add_flush_callback(() => updating_keyboardDiv = false);
    			}

    			keyboard.$set(keyboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(keyboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(keyboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			/*div0_binding*/ ctx[16](null);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_component(keyboard);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(235:1) {#if $gameWritable.wordLength !== 0}",
    		ctx
    	});

    	return block;
    }

    // (246:5) {:else}
    function create_else_block(ctx) {
    	let div;

    	let t0_value = (/*input*/ ctx[3]?.[/*column*/ ctx[44]] && /*$gameWritable*/ ctx[10].guesses.length === /*row*/ ctx[41]
    	? /*input*/ ctx[3]?.[/*column*/ ctx[44]]?.toUpperCase()
    	: "") + "";

    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "box svelte-1o4i9s4");
    			add_location(div, file, 246, 6, 11079);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*input, $gameWritable*/ 1032 && t0_value !== (t0_value = (/*input*/ ctx[3]?.[/*column*/ ctx[44]] && /*$gameWritable*/ ctx[10].guesses.length === /*row*/ ctx[41]
    			? /*input*/ ctx[3]?.[/*column*/ ctx[44]]?.toUpperCase()
    			: "") + "")) set_data_dev(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(246:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (240:5) {#if $gameWritable.guesses[row]}
    function create_if_block_4(ctx) {
    	let previous_key = /*$gameWritable*/ ctx[10].guesses[/*row*/ ctx[41]].charAt(/*column*/ ctx[44]).toUpperCase();
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block_1(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$gameWritable*/ 1024 && safe_not_equal(previous_key, previous_key = /*$gameWritable*/ ctx[10].guesses[/*row*/ ctx[41]].charAt(/*column*/ ctx[44]).toUpperCase())) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block_1(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(240:5) {#if $gameWritable.guesses[row]}",
    		ctx
    	});

    	return block;
    }

    // (241:6) {#key $gameWritable.guesses[row].charAt(column).toUpperCase()}
    function create_key_block_1(ctx) {
    	let div;
    	let t0_value = /*$gameWritable*/ ctx[10].guesses[/*row*/ ctx[41]][/*column*/ ctx[44]].toUpperCase() + "";
    	let t0;
    	let t1;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "box noBorder svelte-1o4i9s4");
    			set_style(div, "--color", /*_row*/ ctx[39][/*column*/ ctx[44]]);
    			add_location(div, file, 241, 7, 10872);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*$gameWritable*/ 1024) && t0_value !== (t0_value = /*$gameWritable*/ ctx[10].guesses[/*row*/ ctx[41]][/*column*/ ctx[44]].toUpperCase() + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*$gameWritable*/ 1024) {
    				set_style(div, "--color", /*_row*/ ctx[39][/*column*/ ctx[44]]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, scale, { delay: 200 * /*column*/ ctx[44] }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, scale, { delay: 200 * /*column*/ ctx[44] }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block_1.name,
    		type: "key",
    		source: "(241:6) {#key $gameWritable.guesses[row].charAt(column).toUpperCase()}",
    		ctx
    	});

    	return block;
    }

    // (239:4) {#each _row as _, column}
    function create_each_block_2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_4, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$gameWritable*/ ctx[10].guesses[/*row*/ ctx[41]]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(239:4) {#each _row as _, column}",
    		ctx
    	});

    	return block;
    }

    // (238:3) {#each $gameWritable.coloredBoxes as _row, row}
    function create_each_block_1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_2 = /*_row*/ ctx[39];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$gameWritable, input*/ 1032) {
    				each_value_2 = /*_row*/ ctx[39];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(238:3) {#each $gameWritable.coloredBoxes as _row, row}",
    		ctx
    	});

    	return block;
    }

    // (260:1) {#if settingsOpen}
    function create_if_block_2(ctx) {
    	let settings;
    	let current;

    	settings = new Settings({
    			props: { closeSettings: /*func_1*/ ctx[18] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(settings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const settings_changes = {};
    			if (dirty[0] & /*settingsOpen*/ 256) settings_changes.closeSettings = /*func_1*/ ctx[18];
    			settings.$set(settings_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(260:1) {#if settingsOpen}",
    		ctx
    	});

    	return block;
    }

    // (266:3) {#each Object.keys($instantPopupsWritable.popups) as key}
    function create_each_block(ctx) {
    	let instantpopup;
    	let current;

    	function func_2() {
    		return /*func_2*/ ctx[19](/*key*/ ctx[36]);
    	}

    	instantpopup = new Instantpopup({
    			props: {
    				message: /*$instantPopupsWritable*/ ctx[11].popups[/*key*/ ctx[36]].message,
    				duration: /*$instantPopupsWritable*/ ctx[11].popups[/*key*/ ctx[36]].delay,
    				destroy: func_2
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(instantpopup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(instantpopup, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const instantpopup_changes = {};
    			if (dirty[0] & /*$instantPopupsWritable*/ 2048) instantpopup_changes.message = /*$instantPopupsWritable*/ ctx[11].popups[/*key*/ ctx[36]].message;
    			if (dirty[0] & /*$instantPopupsWritable*/ 2048) instantpopup_changes.duration = /*$instantPopupsWritable*/ ctx[11].popups[/*key*/ ctx[36]].delay;
    			if (dirty[0] & /*$instantPopupsWritable*/ 2048) instantpopup_changes.destroy = func_2;
    			instantpopup.$set(instantpopup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(instantpopup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(instantpopup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(instantpopup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(266:3) {#each Object.keys($instantPopupsWritable.popups) as key}",
    		ctx
    	});

    	return block;
    }

    // (264:1) {#key $instantPopupsWritable.update}
    function create_key_block(ctx) {
    	let div;
    	let current;
    	let each_value = Object.keys(/*$instantPopupsWritable*/ ctx[11].popups);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "instantPopups svelte-1o4i9s4");
    			add_location(div, file, 264, 2, 11502);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$instantPopupsWritable*/ 2048) {
    				each_value = Object.keys(/*$instantPopupsWritable*/ ctx[11].popups);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(264:1) {#key $instantPopupsWritable.update}",
    		ctx
    	});

    	return block;
    }

    // (273:1) {#if won && !closedWonPopup}
    function create_if_block_1(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				onClose: /*func_3*/ ctx[20],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(popup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popup_changes = {};
    			if (dirty[0] & /*closedWonPopup*/ 32) popup_changes.onClose = /*func_3*/ ctx[20];

    			if (dirty[0] & /*$gameWritable*/ 1024 | dirty[1] & /*$$scope*/ 16384) {
    				popup_changes.$$scope = { dirty, ctx };
    			}

    			popup.$set(popup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(273:1) {#if won && !closedWonPopup}",
    		ctx
    	});

    	return block;
    }

    // (274:2) <Popup onClose={() => (closedWonPopup = true)}>
    function create_default_slot_1(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let h1;
    	let t4;

    	let t5_value = (/*$gameWritable*/ ctx[10].dailyWord
    	? "beat the daily word"
    	: "won") + "";

    	let t5;
    	let t6;

    	let t7_value = (/*$gameWritable*/ ctx[10].guesses.length === 1
    	? "first try! (Cheater 👀)"
    	: `in ${/*$gameWritable*/ ctx[10].guesses.length} tries!`) + "";

    	let t7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "🔗 Share word (link for others to try your word)";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "🔗 Share game (sharing your guesses, word, and time)";
    			t3 = space();
    			h1 = element("h1");
    			t4 = text("🎉 You ");
    			t5 = text(t5_value);
    			t6 = space();
    			t7 = text(t7_value);
    			attr_dev(button0, "class", "svelte-1o4i9s4");
    			add_location(button0, file, 274, 3, 11908);
    			attr_dev(button1, "class", "svelte-1o4i9s4");
    			add_location(button1, file, 275, 3, 11997);
    			attr_dev(h1, "class", "svelte-1o4i9s4");
    			add_location(h1, file, 276, 3, 12090);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t4);
    			append_dev(h1, t5);
    			append_dev(h1, t6);
    			append_dev(h1, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", copyLink, false, false, false),
    					listen_dev(button1, "click", copyGame, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$gameWritable*/ 1024 && t5_value !== (t5_value = (/*$gameWritable*/ ctx[10].dailyWord
    			? "beat the daily word"
    			: "won") + "")) set_data_dev(t5, t5_value);

    			if (dirty[0] & /*$gameWritable*/ 1024 && t7_value !== (t7_value = (/*$gameWritable*/ ctx[10].guesses.length === 1
    			? "first try! (Cheater 👀)"
    			: `in ${/*$gameWritable*/ ctx[10].guesses.length} tries!`) + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(274:2) <Popup onClose={() => (closedWonPopup = true)}>",
    		ctx
    	});

    	return block;
    }

    // (284:1) {#if lose && !closedLosePopup}
    function create_if_block(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				onClose: /*func_4*/ ctx[21],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(popup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const popup_changes = {};
    			if (dirty[0] & /*closedLosePopup*/ 128) popup_changes.onClose = /*func_4*/ ctx[21];

    			if (dirty[0] & /*$gameWritable*/ 1024 | dirty[1] & /*$$scope*/ 16384) {
    				popup_changes.$$scope = { dirty, ctx };
    			}

    			popup.$set(popup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(284:1) {#if lose && !closedLosePopup}",
    		ctx
    	});

    	return block;
    }

    // (285:2) <Popup onClose={() => (closedLosePopup = true)}>
    function create_default_slot(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let h1;
    	let t4;

    	let t5_value = (/*$gameWritable*/ ctx[10].dailyWord
    	? ", click the reload icon on the top right to try the daily word again"
    	: `, the word was ${/*$gameWritable*/ ctx[10].word}`) + "";

    	let t5;
    	let t6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "🔗 Share word (link for others to try your word)";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "🔗 Share game (sharing your guesses, word, and time)";
    			t3 = space();
    			h1 = element("h1");
    			t4 = text("🎈 You lost");
    			t5 = text(t5_value);
    			t6 = text("!");
    			attr_dev(button0, "class", "svelte-1o4i9s4");
    			add_location(button0, file, 285, 3, 12393);
    			attr_dev(button1, "class", "svelte-1o4i9s4");
    			add_location(button1, file, 286, 3, 12482);
    			attr_dev(h1, "class", "svelte-1o4i9s4");
    			add_location(h1, file, 287, 3, 12575);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t4);
    			append_dev(h1, t5);
    			append_dev(h1, t6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", copyLink, false, false, false),
    					listen_dev(button1, "click", copyGame, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$gameWritable*/ 1024 && t5_value !== (t5_value = (/*$gameWritable*/ ctx[10].dailyWord
    			? ", click the reload icon on the top right to try the daily word again"
    			: `, the word was ${/*$gameWritable*/ ctx[10].word}`) + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(285:2) <Popup onClose={() => (closedLosePopup = true)}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let bar;
    	let updating_showWordMenu;
    	let updating_barDiv;
    	let t0;
    	let t1;
    	let t2;
    	let previous_key = /*$instantPopupsWritable*/ ctx[11].update;
    	let t3;
    	let t4;
    	let t5;
    	let svg;
    	let path;
    	let current;
    	let mounted;
    	let dispose;

    	function bar_showWordMenu_binding(value) {
    		/*bar_showWordMenu_binding*/ ctx[14](value);
    	}

    	function bar_barDiv_binding(value) {
    		/*bar_barDiv_binding*/ ctx[15](value);
    	}

    	let bar_props = {
    		copyLink,
    		copyGame,
    		toggleSettings: /*func*/ ctx[13]
    	};

    	if (/*customOpen*/ ctx[2] !== void 0) {
    		bar_props.showWordMenu = /*customOpen*/ ctx[2];
    	}

    	if (/*barDiv*/ ctx[1] !== void 0) {
    		bar_props.barDiv = /*barDiv*/ ctx[1];
    	}

    	bar = new Bar({ props: bar_props, $$inline: true });
    	binding_callbacks.push(() => bind(bar, 'showWordMenu', bar_showWordMenu_binding));
    	binding_callbacks.push(() => bind(bar, 'barDiv', bar_barDiv_binding));
    	let if_block0 = /*$gameWritable*/ ctx[10].wordLength !== 0 && create_if_block_3(ctx);
    	let if_block1 = /*settingsOpen*/ ctx[8] && create_if_block_2(ctx);
    	let key_block = create_key_block(ctx);
    	let if_block2 = /*won*/ ctx[4] && !/*closedWonPopup*/ ctx[5] && create_if_block_1(ctx);
    	let if_block3 = /*lose*/ ctx[6] && !/*closedLosePopup*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(bar.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			key_block.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			if (if_block3) if_block3.c();
    			t5 = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z");
    			attr_dev(path, "class", "svelte-1o4i9s4");
    			add_location(path, file, 292, 3, 12932);
    			attr_dev(svg, "class", "githubIco svelte-1o4i9s4");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill-opacity", "0.6");
    			add_location(svg, file, 291, 1, 12756);
    			attr_dev(main, "class", "svelte-1o4i9s4");
    			add_location(main, file, 231, 0, 10353);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(bar, main, null);
    			append_dev(main, t0);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t1);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t2);
    			key_block.m(main, null);
    			append_dev(main, t3);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t4);
    			if (if_block3) if_block3.m(main, null);
    			append_dev(main, t5);
    			append_dev(main, svg);
    			append_dev(svg, path);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", /*click_handler*/ ctx[22], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const bar_changes = {};
    			if (dirty[0] & /*settingsOpen*/ 256) bar_changes.toggleSettings = /*func*/ ctx[13];

    			if (!updating_showWordMenu && dirty[0] & /*customOpen*/ 4) {
    				updating_showWordMenu = true;
    				bar_changes.showWordMenu = /*customOpen*/ ctx[2];
    				add_flush_callback(() => updating_showWordMenu = false);
    			}

    			if (!updating_barDiv && dirty[0] & /*barDiv*/ 2) {
    				updating_barDiv = true;
    				bar_changes.barDiv = /*barDiv*/ ctx[1];
    				add_flush_callback(() => updating_barDiv = false);
    			}

    			bar.$set(bar_changes);

    			if (/*$gameWritable*/ ctx[10].wordLength !== 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*$gameWritable*/ 1024) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*settingsOpen*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*settingsOpen*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*$instantPopupsWritable*/ 2048 && safe_not_equal(previous_key, previous_key = /*$instantPopupsWritable*/ ctx[11].update)) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(main, t3);
    			} else {
    				key_block.p(ctx, dirty);
    			}

    			if (/*won*/ ctx[4] && !/*closedWonPopup*/ ctx[5]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*won, closedWonPopup*/ 48) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t4);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*lose*/ ctx[6] && !/*closedLosePopup*/ ctx[7]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*lose, closedLosePopup*/ 192) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t5);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bar.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(key_block);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bar.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(key_block);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(bar);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			key_block.d(detaching);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $gameWritable;
    	let $instantPopupsWritable;
    	let $stats;
    	validate_store(gameWritable, 'gameWritable');
    	component_subscribe($$self, gameWritable, $$value => $$invalidate(10, $gameWritable = $$value));
    	validate_store(instantPopupsWritable, 'instantPopupsWritable');
    	component_subscribe($$self, instantPopupsWritable, $$value => $$invalidate(11, $instantPopupsWritable = $$value));
    	validate_store(stats, 'stats');
    	component_subscribe($$self, stats, $$value => $$invalidate(26, $stats = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let customOpen = false;
    	let wordLength = 5;
    	let maxGuesses = 6;
    	const searchParams = new URLSearchParams(window.location.search);

    	if (searchParams.has("wordLength") && !isNaN(searchParams.get("wordLength")) && parseInt(searchParams.get("wordLength")) >= 3 && parseInt(searchParams.get("wordLength")) <= 7) {
    		const _wordLength = parseInt(searchParams.get("wordLength"));
    		wordLength = _wordLength;
    	}

    	if (searchParams.has("maxGuesses") && !isNaN(searchParams.get("maxGuesses")) && parseInt(searchParams.get("maxGuesses")) >= 3 && parseInt(searchParams.get("maxGuesses")) <= 9) {
    		const _maxGuesses = parseInt(searchParams.get("maxGuesses"));
    		maxGuesses = _maxGuesses;
    	}

    	let customWord = false;

    	if (searchParams.has("word")) {
    		customWord = unobscureWord(searchParams.get("word"));
    		if (customWord.length !== wordLength) customWord = false;
    	}

    	const now = new Date();
    	const days = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000) - 1;

    	const start = async () => {
    		let _guesses;
    		let _answers;
    		const _words = await fetch(`./words/word_${wordLength}.txt`);
    		const words = await _words.text();
    		_guesses = words.split(",");

    		if (wordLength !== 5) {
    			_answers = words.split(",");
    		}

    		if (wordLength === 5) {
    			const _words = await fetch(`./words/word_${wordLength}_answers.txt`);
    			const words = await _words.text();
    			_answers = words.split(",");
    		}

    		let _daily;

    		if (searchParams.get("word") === "daily") {
    			if (localStorage.getItem(`daily,${wordLength}`) !== days.toString()) {
    				const _dailyList = await fetch(`./words/daily_${wordLength}.txt`);
    				const dailyList = await _dailyList.text();
    				_daily = dailyList.split(",").filter(daily => daily.split("|")[0] === days.toString())[0].split("|")[1];
    				maxGuesses = 6;
    			} else {
    				$instantPopupsWritable.add("You already did the daily word for today!, using random word instead.");
    			}
    		}

    		return [_guesses, _answers, _daily];
    	};

    	const guessesAnswers = start();

    	guessesAnswers.then(guessesAnswers => {
    		const guesses = guessesAnswers[0];
    		const answers = guessesAnswers[1];
    		const daily = guessesAnswers[2];

    		if (daily) {
    			set_store_value(gameWritable, $gameWritable = new Game(wordLength, maxGuesses, guesses, answers, daily, true), $gameWritable);
    			gameWritable.update(n => n);
    		} else {
    			set_store_value(gameWritable, $gameWritable = new Game(wordLength, maxGuesses, guesses, answers, customWord), $gameWritable);
    			gameWritable.update(n => n);
    		}
    	});

    	const processInput = () => {
    		if ($gameWritable.validateInput(input) !== true) return;

    		/* ---------------------------- Reset / add input --------------------------- */
    		set_store_value(gameWritable, $gameWritable.guesses = [...$gameWritable.guesses, input], $gameWritable);

    		gameWritable.update(n => n);

    		/* -------------------------- Determine the colors -------------------------- */
    		/**
     * Array of already colored indexes in the word
     */
    		const foundindexes = [];

    		/* ------------------------- Loop through the input ------------------------- */
    		for (let i = 0; i < input.length; i++) {
    			const letter = input[i];
    			const index = $gameWritable.word.indexOf(letter);
    			console.log(`Starting index i=${i} letter=${letter} index(of letter in word)=${index}`);

    			/* --------------- If the input letter isnt found in the word --------------- */
    			if (index === -1) {
    				set_store_value(gameWritable, $gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "empty", $gameWritable);

    				if ($gameWritable.keyboardColors[letter] !== "correct" && $gameWritable.keyboardColors[letter] !== "semicorrect") {
    					set_store_value(gameWritable, $gameWritable.keyboardColors[letter] = "empty", $gameWritable);
    				}

    				console.log(" - Index not found at all (empty)");

    				// gameWritable.update((n) => n);
    				continue;
    			}

    			/* -------- If the input letter is in the word and in the right index ------- */
    			if ($gameWritable.word[i] === letter) {
    				set_store_value(gameWritable, $gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "correct", $gameWritable);
    				set_store_value(gameWritable, $gameWritable.keyboardColors[letter] = "correct", $gameWritable);
    				foundindexes.push(index);

    				// gameWritable.update((n) => n);
    				console.log(" - Index is in the right place (correct)");

    				continue;
    			}

    			/* ---------------- Check to see if a correct index would be ---------------- */
    			/* ------------------- found if the loop were to continue ------------------- */
    			let found = false;

    			for (let x = 0; x < input.length; x++) {
    				if ($gameWritable.word[i] === input[x] && x === i) {
    					found = true;
    					break;
    				}
    			}

    			console.log(` - found=${found}`);

    			if (found) {
    				set_store_value(gameWritable, $gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "empty", $gameWritable);

    				if ($gameWritable.keyboardColors[letter] !== "correct" && $gameWritable.keyboardColors[letter] !== "semicorrect") {
    					set_store_value(gameWritable, $gameWritable.keyboardColors[letter] = "empty", $gameWritable);
    				}

    				// gameWritable.update((n) => n);
    				console.log(" - Set empty due to found=true");

    				continue;
    			}

    			if (!foundindexes.includes(index)) {
    				set_store_value(gameWritable, $gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "semicorrect", $gameWritable);

    				if ($gameWritable.keyboardColors[letter] !== "correct") {
    					set_store_value(gameWritable, $gameWritable.keyboardColors[letter] = "semicorrect", $gameWritable);
    				}

    				foundindexes.push(index);
    				console.log(" - Foundindex doesnt include (semicorrect)");

    				// gameWritable.update((n) => n);
    				continue;
    			}

    			set_store_value(gameWritable, $gameWritable.boxes[$gameWritable.guesses.length - 1][i] = "empty", $gameWritable);

    			if ($gameWritable.keyboardColors[letter] !== "correct" && $gameWritable.keyboardColors[letter] !== "semicorrect") {
    				set_store_value(gameWritable, $gameWritable.keyboardColors[letter] = "empty", $gameWritable);
    			}
    		} // gameWritable.update((n) => n);

    		/* ------------------------------- Win / lose ------------------------------- */
    		if (input === $gameWritable.word) {
    			$$invalidate(4, won = true);
    			set_store_value(gameWritable, $gameWritable.endTimer = Date.now(), $gameWritable);

    			// gameWritable.update((n) => n);
    			updateStats(Object.assign(Object.assign({}, $stats), { wins: $stats.wins + 1 }));

    			updateStats(Object.assign(Object.assign({}, $stats), { currentStreak: $stats.currentStreak + 1 }));

    			if ($stats.currentStreak > $stats.maxStreak) {
    				updateStats(Object.assign(Object.assign({}, $stats), { maxStreak: $stats.currentStreak }));
    			}

    			updateStats(Object.assign(Object.assign({}, $stats), { played: $stats.played + 1 }));
    			localStorage.setItem(`daily,${wordLength}`, days.toString());
    		} else if ($gameWritable.guesses.length >= $gameWritable.maxGuesses) {
    			$$invalidate(6, lose = true);
    			set_store_value(gameWritable, $gameWritable.endTimer = Date.now(), $gameWritable);

    			// gameWritable.update((n) => n);
    			updateStats(Object.assign(Object.assign({}, $stats), { losses: $stats.losses + 1 }));

    			updateStats(Object.assign(Object.assign({}, $stats), { played: $stats.played + 1 }));
    			updateStats(Object.assign(Object.assign({}, $stats), { currentStreak: 0 }));
    		}

    		gameWritable.update(n => n);
    		$$invalidate(3, input = "");
    	};

    	/* --------------------------------- Inputs --------------------------------- */
    	let input = "";

    	const inputValid = () => {
    		return !won
    		? !lose
    			? $gameWritable.validateInput(input)
    			: `You lost, the word was ${$gameWritable.word}!`
    		: "You won!";
    	};

    	const keyboardPress = key => {
    		if (key === "backspace") {
    			$$invalidate(3, input = input.slice(0, -1));
    		} else if (key == "enter") {
    			if (inputValid() !== true) $instantPopupsWritable.add(inputValid().toString());
    			processInput();
    		} else if (input.length <= $gameWritable.wordLength - 1) {
    			$$invalidate(3, input = `${input}${key}`);
    		}
    	};

    	document.addEventListener("keydown", event => {
    		if (customOpen) return;

    		if (event.code === "Escape") $$invalidate(8, settingsOpen = !settingsOpen); else if (event.code === "Backspace") {
    			$$invalidate(3, input = input.slice(0, -1));
    		} else if (event.code === "Enter") {
    			if (inputValid() !== true) $instantPopupsWritable.add(inputValid().toString());
    			processInput();
    		} else if (alphabet.includes(event.key.toLowerCase()) && input.length <= $gameWritable.wordLength - 1) {
    			$$invalidate(3, input = `${input}${event.key.toLowerCase()}`);
    		}
    	});

    	/* --------------------------------- Popups --------------------------------- */
    	let won = false;

    	let closedWonPopup = false;
    	let lose = false;
    	let closedLosePopup = false;

    	/* -------------------------------- Settings -------------------------------- */
    	let settingsOpen = false;

    	/* ---------------------------------- Zoom ---------------------------------- */
    	let gameDiv;

    	let resized = false;

    	const onResize = () => {
    		const barRect = barDiv.getBoundingClientRect();
    		const keyboardRect = keyboardDiv.getBoundingClientRect();
    		const distance = Math.abs(barRect.bottom + 25 - keyboardRect.top + 50);
    		const value = distance / $gameWritable.maxGuesses - 5;
    		$$invalidate(9, gameDiv.style.gridTemplateRows = `repeat(var(--max-guesses), ${value}px`, gameDiv);

    		$$invalidate(
    			9,
    			gameDiv.style.gridTemplateColumns = `repeat(var(--word-length), ${value * $gameWritable.wordLength < window.innerWidth
			? `${value}px`
			: "1fr"}`,
    			gameDiv
    		);
    	};

    	window.addEventListener("resize", onResize);
    	setTimeout(onResize, 1000);
    	let keyboardDiv;
    	let barDiv;
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const func = () => $$invalidate(8, settingsOpen = !settingsOpen);

    	function bar_showWordMenu_binding(value) {
    		customOpen = value;
    		$$invalidate(2, customOpen);
    	}

    	function bar_barDiv_binding(value) {
    		barDiv = value;
    		$$invalidate(1, barDiv);
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			gameDiv = $$value;
    			$$invalidate(9, gameDiv);
    		});
    	}

    	function keyboard_keyboardDiv_binding(value) {
    		keyboardDiv = value;
    		$$invalidate(0, keyboardDiv);
    	}

    	const func_1 = () => $$invalidate(8, settingsOpen = false);
    	const func_2 = key => $instantPopupsWritable.remove(key);
    	const func_3 = () => $$invalidate(5, closedWonPopup = true);
    	const func_4 = () => $$invalidate(7, closedLosePopup = true);
    	const click_handler = () => window.open("https://github.com/jameslinimk/wordlecloneweb", "_blank");

    	$$self.$capture_state = () => ({
    		scale,
    		Bar,
    		InstantPopup: Instantpopup,
    		Keyboard,
    		Popup,
    		Settings,
    		alphabet,
    		unobscureWord,
    		Game,
    		gameWritable,
    		instantPopupsWritable,
    		copyGame,
    		copyLink,
    		stats,
    		updateStats,
    		customOpen,
    		wordLength,
    		maxGuesses,
    		searchParams,
    		customWord,
    		now,
    		days,
    		start,
    		guessesAnswers,
    		processInput,
    		input,
    		inputValid,
    		keyboardPress,
    		won,
    		closedWonPopup,
    		lose,
    		closedLosePopup,
    		settingsOpen,
    		gameDiv,
    		resized,
    		onResize,
    		keyboardDiv,
    		barDiv,
    		$gameWritable,
    		$instantPopupsWritable,
    		$stats
    	});

    	$$self.$inject_state = $$props => {
    		if ('customOpen' in $$props) $$invalidate(2, customOpen = $$props.customOpen);
    		if ('wordLength' in $$props) wordLength = $$props.wordLength;
    		if ('maxGuesses' in $$props) maxGuesses = $$props.maxGuesses;
    		if ('customWord' in $$props) customWord = $$props.customWord;
    		if ('input' in $$props) $$invalidate(3, input = $$props.input);
    		if ('won' in $$props) $$invalidate(4, won = $$props.won);
    		if ('closedWonPopup' in $$props) $$invalidate(5, closedWonPopup = $$props.closedWonPopup);
    		if ('lose' in $$props) $$invalidate(6, lose = $$props.lose);
    		if ('closedLosePopup' in $$props) $$invalidate(7, closedLosePopup = $$props.closedLosePopup);
    		if ('settingsOpen' in $$props) $$invalidate(8, settingsOpen = $$props.settingsOpen);
    		if ('gameDiv' in $$props) $$invalidate(9, gameDiv = $$props.gameDiv);
    		if ('resized' in $$props) $$invalidate(34, resized = $$props.resized);
    		if ('keyboardDiv' in $$props) $$invalidate(0, keyboardDiv = $$props.keyboardDiv);
    		if ('barDiv' in $$props) $$invalidate(1, barDiv = $$props.barDiv);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*barDiv, keyboardDiv*/ 3) {
    			if (!resized && (barDiv === null || barDiv === void 0
    			? void 0
    			: barDiv.style) && (keyboardDiv === null || keyboardDiv === void 0
    			? void 0
    			: keyboardDiv.style)) onResize();
    		}
    	};

    	return [
    		keyboardDiv,
    		barDiv,
    		customOpen,
    		input,
    		won,
    		closedWonPopup,
    		lose,
    		closedLosePopup,
    		settingsOpen,
    		gameDiv,
    		$gameWritable,
    		$instantPopupsWritable,
    		keyboardPress,
    		func,
    		bar_showWordMenu_binding,
    		bar_barDiv_binding,
    		div0_binding,
    		keyboard_keyboardDiv_binding,
    		func_1,
    		func_2,
    		func_3,
    		func_4,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

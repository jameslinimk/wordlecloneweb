
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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

    /* src\popup.svelte generated by Svelte v3.46.4 */
    const file$4 = "src\\popup.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let h1;
    	let t0;
    	let t1;
    	let button;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(/*message*/ ctx[0]);
    			t1 = space();
    			button = element("button");
    			button.textContent = "Close";
    			add_location(h1, file$4, 6, 4, 158);
    			add_location(button, file$4, 8, 4, 184);
    			attr_dev(div, "class", "popup svelte-8vo8ko");
    			add_location(div, file$4, 5, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);
    			append_dev(div, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onClose*/ ctx[1])) /*onClose*/ ctx[1].apply(this, arguments);
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
    			if (!current || dirty & /*message*/ 1) set_data_dev(t0, /*message*/ ctx[0]);
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
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Popup', slots, []);
    	let { message } = $$props;
    	let { onClose } = $$props;
    	const writable_props = ['message', 'onClose'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Popup> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('onClose' in $$props) $$invalidate(1, onClose = $$props.onClose);
    	};

    	$$self.$capture_state = () => ({ fade, message, onClose });

    	$$self.$inject_state = $$props => {
    		if ('message' in $$props) $$invalidate(0, message = $$props.message);
    		if ('onClose' in $$props) $$invalidate(1, onClose = $$props.onClose);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [message, onClose];
    }

    class Popup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { message: 0, onClose: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popup",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !('message' in props)) {
    			console.warn("<Popup> was created without expected prop 'message'");
    		}

    		if (/*onClose*/ ctx[1] === undefined && !('onClose' in props)) {
    			console.warn("<Popup> was created without expected prop 'onClose'");
    		}
    	}

    	get message() {
    		throw new Error("<Popup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Popup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClose() {
    		throw new Error("<Popup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClose(value) {
    		throw new Error("<Popup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Settings.svelte generated by Svelte v3.46.4 */
    const file$3 = "src\\Settings.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let p;
    	let t1;
    	let button;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Test";
    			t1 = space();
    			button = element("button");
    			button.textContent = "Test button";
    			add_location(p, file$3, 4, 4, 122);
    			add_location(button, file$3, 5, 4, 139);
    			attr_dev(div, "class", "settings svelte-9of6q1");
    			add_location(div, file$3, 3, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);
    			append_dev(div, button);
    			current = true;
    		},
    		p: noop,
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
    	validate_slots('Settings', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ slide });
    	return [];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\darkmode.svelte generated by Svelte v3.46.4 */

    const { console: console_1$1 } = globals;
    const file$2 = "src\\darkmode.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "🌓";
    			add_location(button, file$2, 31, 0, 737);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Darkmode', slots, []);
    	let theme = "light";

    	function applyTheme() {
    		if (theme === "dark") {
    			window.document.body.classList.add("dark-mode");
    		} else {
    			window.document.body.classList.remove("dark-mode");
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
    		console.log(theme);
    		localStorage.setItem("theme", theme);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Darkmode> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ theme, applyTheme, localTheme, click });

    	$$self.$inject_state = $$props => {
    		if ('theme' in $$props) theme = $$props.theme;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [click];
    }

    class Darkmode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Darkmode",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\sidebar.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\sidebar.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let darkmode;
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let h3;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;
    	darkmode = new Darkmode({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(darkmode.$$.fragment);
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "🔨";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "🔄";
    			t4 = space();
    			h3 = element("h3");
    			t5 = text(/*timeElapsed*/ ctx[1]);
    			add_location(button0, file$1, 15, 4, 371);
    			add_location(button1, file$1, 16, 4, 428);
    			attr_dev(h3, "class", "timer svelte-1uxou2x");
    			add_location(h3, file$1, 17, 4, 488);
    			attr_dev(div, "class", "sidebar svelte-1uxou2x");
    			add_location(div, file$1, 13, 0, 326);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(darkmode, div, null);
    			append_dev(div, t0);
    			append_dev(div, button0);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(div, t4);
    			append_dev(div, h3);
    			append_dev(h3, t5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*timeElapsed*/ 2) set_data_dev(t5, /*timeElapsed*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(darkmode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(darkmode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(darkmode);
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
    	validate_slots('Sidebar', slots, []);
    	let { game } = $$props;
    	let { openSettings } = $$props;
    	let timeElapsed = "00:00:00";

    	setInterval(
    		() => {
    			if (game.endTimer) return;
    			$$invalidate(1, timeElapsed = new Date(Date.now() - game.started).toISOString().substr(11, 8));
    		},
    		1000
    	);

    	const writable_props = ['game', 'openSettings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => openSettings();
    	const click_handler_1 = () => location.reload();

    	$$self.$$set = $$props => {
    		if ('game' in $$props) $$invalidate(2, game = $$props.game);
    		if ('openSettings' in $$props) $$invalidate(0, openSettings = $$props.openSettings);
    	};

    	$$self.$capture_state = () => ({
    		Darkmode,
    		game,
    		openSettings,
    		timeElapsed
    	});

    	$$self.$inject_state = $$props => {
    		if ('game' in $$props) $$invalidate(2, game = $$props.game);
    		if ('openSettings' in $$props) $$invalidate(0, openSettings = $$props.openSettings);
    		if ('timeElapsed' in $$props) $$invalidate(1, timeElapsed = $$props.timeElapsed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [openSettings, timeElapsed, game, click_handler, click_handler_1];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { game: 2, openSettings: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*game*/ ctx[2] === undefined && !('game' in props)) {
    			console.warn("<Sidebar> was created without expected prop 'game'");
    		}

    		if (/*openSettings*/ ctx[0] === undefined && !('openSettings' in props)) {
    			console.warn("<Sidebar> was created without expected prop 'openSettings'");
    		}
    	}

    	get game() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set game(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get openSettings() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set openSettings(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const guesses = ["which", "there", "their", "about", "would", "these", "other", "words", "could", "write", "first", "water", "after", "where", "right", "think", "three", "years", "place", "sound", "great", "again", "still", "every", "small", "found", "those", "never", "under", "might", "while", "house", "world", "below", "asked", "going", "large", "until", "along", "shall", "being", "often", "earth", "began", "since", "study", "night", "light", "above", "paper", "parts", "young", "story", "point", "times", "heard", "whole", "white", "given", "means", "music", "miles", "thing", "today", "later", "using", "money", "lines", "order", "group", "among", "learn", "known", "space", "table", "early", "trees", "short", "hands", "state", "black", "shown", "stood", "front", "voice", "kinds", "makes", "comes", "close", "power", "lived", "vowel", "taken", "built", "heart", "ready", "quite", "class", "bring", "round", "horse", "shows", "piece", "green", "stand", "birds", "start", "river", "tried", "least", "field", "whose", "girls", "leave", "added", "color", "third", "hours", "moved", "plant", "doing", "names", "forms", "heavy", "ideas", "cried", "check", "floor", "begin", "woman", "alone", "plane", "spell", "watch", "carry", "wrote", "clear", "named", "books", "child", "glass", "human", "takes", "party", "build", "seems", "blood", "sides", "seven", "mouth", "solve", "north", "value", "death", "maybe", "happy", "tells", "gives", "looks", "shape", "lives", "steps", "areas", "sense", "speak", "force", "ocean", "speed", "women", "metal", "south", "grass", "scale", "cells", "lower", "sleep", "wrong", "pages", "ships", "needs", "rocks", "eight", "major", "level", "total", "ahead", "reach", "stars", "store", "sight", "terms", "catch", "works", "board", "cover", "songs", "equal", "stone", "waves", "guess", "dance", "spoke", "break", "cause", "radio", "weeks", "lands", "basic", "liked", "trade", "fresh", "final", "fight", "meant", "drive", "spent", "local", "waxes", "knows", "train", "bread", "homes", "teeth", "coast", "thick", "brown", "clean", "quiet", "sugar", "facts", "steel", "forth", "rules", "notes", "units", "peace", "month", "verbs", "seeds", "helps", "sharp", "visit", "woods", "chief", "walls", "cross", "wings", "grown", "cases", "foods", "crops", "fruit", "stick", "wants", "stage", "sheep", "nouns", "plain", "drink", "bones", "apart", "turns", "moves", "touch", "angle", "based", "range", "marks", "tired", "older", "farms", "spend", "shoes", "goods", "chair", "twice", "cents", "empty", "alike", "style", "broke", "pairs", "count", "enjoy", "score", "shore", "roots", "paint", "heads", "shook", "serve", "angry", "crowd", "wheel", "quick", "dress", "share", "alive", "noise", "solid", "cloth", "signs", "hills", "types", "drawn", "worth", "truck", "piano", "upper", "loved", "usual", "faces", "drove", "cabin", "boats", "towns", "proud", "court", "model", "prime", "fifty", "plans", "yards", "prove", "tools", "price", "sheet", "smell", "boxes", "raise", "match", "truth", "roads", "threw", "enemy", "lunch", "chart", "scene", "graph", "doubt", "guide", "winds", "block", "grain", "smoke", "mixed", "games", "wagon", "sweet", "topic", "extra", "plate", "title", "knife", "fence", "falls", "cloud", "wheat", "plays", "enter", "broad", "steam", "atoms", "press", "lying", "basis", "clock", "taste", "grows", "thank", "storm", "agree", "brain", "track", "smile", "funny", "beach", "stock", "hurry", "saved", "sorry", "giant", "trail", "offer", "ought", "rough", "daily", "avoid", "keeps", "throw", "allow", "cream", "laugh", "edges", "teach", "frame", "bells", "dream", "magic", "occur", "ended", "chord", "false", "skill", "holes", "dozen", "brave", "apple", "climb", "outer", "pitch", "ruler", "holds", "fixed", "costs", "calls", "blank", "staff", "labor", "eaten", "youth", "tones", "honor", "globe", "gases", "doors", "poles", "loose", "apply", "tears", "exact", "brush", "chest", "layer", "whale", "minor", "faith", "tests", "judge", "items", "worry", "waste", "hoped", "strip", "begun", "aside", "lakes", "bound", "depth", "candy", "event", "worse", "aware", "shell", "rooms", "ranch", "image", "snake", "aloud", "dried", "likes", "motor", "pound", "knees", "refer", "fully", "chain", "shirt", "flour", "drops", "spite", "orbit", "banks", "shoot", "curve", "tribe", "tight", "blind", "slept", "shade", "claim", "flies", "theme", "queen", "fifth", "union", "hence", "straw", "entry", "issue", "birth", "feels", "anger", "brief", "rhyme", "glory", "guard", "flows", "flesh", "owned", "trick", "yours", "sizes", "noted", "width", "burst", "route", "lungs", "uncle", "bears", "royal", "kings", "forty", "trial", "cards", "brass", "opera", "chose", "owner", "vapor", "beats", "mouse", "tough", "wires", "meter", "tower", "finds", "inner", "stuck", "arrow", "poems", "label", "swing", "solar", "truly", "tense", "beans", "split", "rises", "weigh", "hotel", "stems", "pride", "swung", "grade", "digit", "badly", "boots", "pilot", "sales", "swept", "lucky", "prize", "stove", "tubes", "acres", "wound", "steep", "slide", "trunk", "error", "porch", "slave", "exist", "faced", "mines", "marry", "juice", "raced", "waved", "goose", "trust", "fewer", "favor", "mills", "views", "joint", "eager", "spots", "blend", "rings", "adult", "index", "nails", "horns", "balls", "flame", "rates", "drill", "trace", "skins", "waxed", "seats", "stuff", "ratio", "minds", "dirty", "silly", "coins", "hello", "trips", "leads", "rifle", "hopes", "bases", "shine", "bench", "moral", "fires", "meals", "shake", "shops", "cycle", "movie", "slope", "canoe", "teams", "folks", "fired", "bands", "thumb", "shout", "canal", "habit", "reply", "ruled", "fever", "crust", "shelf", "walks", "midst", "crack", "print", "tales", "coach", "stiff", "flood", "verse", "awake", "rocky", "march", "fault", "swift", "faint", "civil", "ghost", "feast", "blade", "limit", "germs", "reads", "ducks", "dairy", "worst", "gifts", "lists", "stops", "rapid", "brick", "claws", "beads", "beast", "skirt", "cakes", "lions", "frogs", "tries", "nerve", "grand", "armed", "treat", "honey", "moist", "legal", "penny", "crown", "shock", "taxes", "sixty", "altar", "pulls", "sport", "drums", "talks", "dying", "dates", "drank", "blows", "lever", "wages", "proof", "drugs", "tanks", "sings", "tails", "pause", "herds", "arose", "hated", "clues", "novel", "shame", "burnt", "races", "flash", "weary", "heels", "token", "coats", "spare", "shiny", "alarm", "dimes", "sixth", "clerk", "mercy", "sunny", "guest", "float", "shone", "pipes", "worms", "bills", "sweat", "suits", "smart", "upset", "rains", "sandy", "rainy", "parks", "sadly", "fancy", "rider", "unity", "bunch", "rolls", "crash", "craft", "newly", "gates", "hatch", "paths", "funds", "wider", "grace", "grave", "tides", "admit", "shift", "sails", "pupil", "tiger", "angel", "cruel", "agent", "drama", "urged", "patch", "nests", "vital", "sword", "blame", "weeds", "screw", "vocal", "bacon", "chalk", "cargo", "crazy", "acted", "goats", "arise", "witch", "loves", "queer", "dwell", "backs", "ropes", "shots", "merry", "phone", "cheek", "peaks", "ideal", "beard", "eagle", "creek", "cries", "ashes", "stall", "yield", "mayor", "opens", "input", "fleet", "tooth", "cubic", "wives", "burns", "poets", "apron", "spear", "organ", "cliff", "stamp", "paste", "rural", "baked", "chase", "slice", "slant", "knock", "noisy", "sorts", "stays", "wiped", "blown", "piled", "clubs", "cheer", "widow", "twist", "tenth", "hides", "comma", "sweep", "spoon", "stern", "crept", "maple", "deeds", "rides", "muddy", "crime", "jelly", "ridge", "drift", "dusty", "devil", "tempo", "humor", "sends", "steal", "tents", "waist", "roses", "reign", "noble", "cheap", "dense", "linen", "geese", "woven", "posts", "hired", "wrath", "salad", "bowed", "tires", "shark", "belts", "grasp", "blast", "polar", "fungi", "tends", "pearl", "loads", "jokes", "veins", "frost", "hears", "loses", "hosts", "diver", "phase", "toads", "alert", "tasks", "seams", "coral", "focus", "naked", "puppy", "jumps", "spoil", "quart", "macro", "fears", "flung", "spark", "vivid", "brook", "steer", "spray", "decay", "ports", "socks", "urban", "goals", "grant", "minus", "films", "tunes", "shaft", "firms", "skies", "bride", "wreck", "flock", "stare", "hobby", "bonds", "dared", "faded", "thief", "crude", "pants", "flute", "votes", "tonal", "radar", "wells", "skull", "hairs", "argue", "wears", "dolls", "voted", "caves", "cared", "broom", "scent", "panel", "fairy", "olive", "bends", "prism", "lamps", "cable", "peach", "ruins", "rally", "schwa", "lambs", "sells", "cools", "draft", "charm", "limbs", "brake", "gazed", "cubes", "delay", "beams", "fetch", "ranks", "array", "harsh", "camel", "vines", "picks", "naval", "purse", "rigid", "crawl", "toast", "soils", "sauce", "basin", "ponds", "twins", "wrist", "fluid", "pools", "brand", "stalk", "robot", "reeds", "hoofs", "buses", "sheer", "grief", "bloom", "dwelt", "melts", "risen", "flags", "knelt", "fiber", "roofs", "freed", "armor", "piles", "aimed", "algae", "twigs", "lemon", "ditch", "drunk", "rests", "chill", "slain", "panic", "cords", "tuned", "crisp", "ledge", "dived", "swamp", "clung", "stole", "molds", "yarns", "liver", "gauge", "breed", "stool", "gulls", "awoke", "gross", "diary", "rails", "belly", "trend", "flask", "stake", "fried", "draws", "actor", "handy", "bowls", "haste", "scope", "deals", "knots", "moons", "essay", "thump", "hangs", "bliss", "dealt", "gains", "bombs", "clown", "palms", "cones", "roast", "tidal", "bored", "chant", "acids", "dough", "camps", "swore", "lover", "hooks", "males", "cocoa", "punch", "award", "reins", "ninth", "noses", "links", "drain", "fills", "nylon", "lunar", "pulse", "flown", "elbow", "fatal", "sites", "moths", "meats", "foxes", "mined", "attic", "fiery", "mount", "usage", "swear", "snowy", "rusty", "scare", "traps", "relax", "react", "valid", "robin", "cease", "gills", "prior", "safer", "polio", "loyal", "swell", "salty", "marsh", "vague", "weave", "mound", "seals", "mules", "virus", "scout", "acute", "windy", "stout", "folds", "seize", "hilly", "joins", "pluck", "stack", "lords", "dunes", "burro", "hawks", "trout", "feeds", "scarf", "halls", "coals", "towel", "souls", "elect", "buggy", "pumps", "loans", "spins", "files", "oxide", "pains", "photo", "rival", "flats", "syrup", "rodeo", "sands", "moose", "pints", "curly", "comic", "cloak", "onion", "clams", "scrap", "didst", "couch", "codes", "fails", "ounce", "lodge", "greet", "gypsy", "utter", "paved", "zones", "fours", "alley", "tiles", "bless", "crest", "elder", "kills", "yeast", "erect", "bugle", "medal", "roles", "hound", "snail", "alter", "ankle", "relay", "loops", "zeros", "bites", "modes", "debts", "realm", "glove", "rayon", "swims", "poked", "stray", "lifts", "maker", "lumps", "graze", "dread", "barns", "docks", "masts", "pours", "wharf", "curse", "plump", "robes", "seeks", "cedar", "curls", "jolly", "myths", "cages", "gloom", "locks", "pedal", "beets", "crows", "anode", "slash", "creep", "rowed", "chips", "fists", "wines", "cares", "valve", "newer", "motel", "ivory", "necks", "clamp", "barge", "blues", "alien", "frown", "strap", "crews", "shack", "gonna", "saves", "stump", "ferry", "idols", "cooks", "juicy", "glare", "carts", "alloy", "bulbs", "lawns", "lasts", "fuels", "oddly", "crane", "filed", "weird", "shawl", "slips", "troop", "bolts", "suite", "sleek", "quilt", "tramp", "blaze", "atlas", "odors", "scrub", "crabs", "probe", "logic", "adobe", "exile", "rebel", "grind", "sting", "spine", "cling", "desks", "grove", "leaps", "prose", "lofty", "agony", "snare", "tusks", "bulls", "moods", "humid", "finer", "dimly", "plank", "china", "pines", "guilt", "sacks", "brace", "quote", "lathe", "gaily", "fonts", "scalp", "adopt", "foggy", "ferns", "grams", "clump", "perch", "tumor", "teens", "crank", "fable", "hedge", "genes", "sober", "boast", "tract", "cigar", "unite", "owing", "thigh", "haiku", "swish", "dikes", "wedge", "booth", "eased", "frail", "cough", "tombs", "darts", "forts", "choir", "pouch", "pinch", "hairy", "buyer", "torch", "vigor", "waltz", "heats", "herbs", "users", "flint", "click", "madam", "bleak", "blunt", "aided", "lacks", "masks", "waded", "risks", "nurse", "chaos", "sewed", "cured", "ample", "lease", "steak", "sinks", "merit", "bluff", "bathe", "gleam", "bonus", "colts", "shear", "gland", "silky", "skate", "birch", "anvil", "sleds", "groan", "maids", "meets", "speck", "hymns", "hints", "drown", "bosom", "slick", "quest", "coils", "spied", "snows", "stead", "snack", "plows", "blond", "tamed", "thorn", "waits", "glued", "banjo", "tease", "arena", "bulky", "carve", "stunt", "warms", "shady", "razor", "folly", "leafy", "notch", "fools", "otter", "pears", "flush", "genus", "ached", "fives", "flaps", "spout", "smote", "fumes", "adapt", "cuffs", "tasty", "stoop", "clips", "disks", "sniff", "lanes", "brisk", "imply", "demon", "super", "furry", "raged", "growl", "texts", "hardy", "stung", "typed", "hates", "wiser", "timid", "serum", "beaks", "rotor", "casts", "baths", "glide", "plots", "trait", "resin", "slums", "lyric", "puffs", "decks", "brood", "mourn", "aloft", "abuse", "whirl", "edged", "ovary", "quack", "heaps", "slang", "await", "civic", "saint", "bevel", "sonar", "aunts", "packs", "froze", "tonic", "corps", "swarm", "frank", "repay", "gaunt", "wired", "niece", "cello", "needy", "chuck", "stony", "media", "surge", "hurts", "repel", "husky", "dated", "hunts", "mists", "exert", "dries", "mates", "sworn", "baker", "spice", "oasis", "boils", "spurs", "doves", "sneak", "paces", "colon", "siege", "strum", "drier", "cacao", "humus", "bales", "piped", "nasty", "rinse", "boxer", "shrub", "amuse", "tacks", "cited", "slung", "delta", "laden", "larva", "rents", "yells", "spool", "spill", "crush", "jewel", "snaps", "stain", "kicks", "tying", "slits", "rated", "eerie", "smash", "plums", "zebra", "earns", "bushy", "scary", "squad", "tutor", "silks", "slabs", "bumps", "evils", "fangs", "snout", "peril", "pivot", "yacht", "lobby", "jeans", "grins", "viola", "liner", "comet", "scars", "chops", "raids", "eater", "slate", "skips", "soles", "misty", "urine", "knobs", "sleet", "holly", "pests", "forks", "grill", "trays", "pails", "borne", "tenor", "wares", "carol", "woody", "canon", "wakes", "kitty", "miner", "polls", "shaky", "nasal", "scorn", "chess", "taxis", "crate", "shyly", "tulip", "forge", "nymph", "budge", "lowly", "abide", "depot", "oases", "asses", "sheds", "fudge", "pills", "rivet", "thine", "groom", "lanky", "boost", "broth", "heave", "gravy", "beech", "timed", "quail", "inert", "gears", "chick", "hinge", "trash", "clash", "sighs", "renew", "bough", "dwarf", "slows", "quill", "shave", "spore", "sixes", "chunk", "madly", "paced", "braid", "fuzzy", "motto", "spies", "slack", "mucus", "magma", "awful", "discs", "erase", "posed", "asset", "cider", "taper", "theft", "churn", "satin", "slots", "taxed", "bully", "sloth", "shale", "tread", "raked", "curds", "manor", "aisle", "bulge", "loins", "stair", "tapes", "leans", "bunks", "squat", "towed", "lance", "panes", "sakes", "heirs", "caste", "dummy", "pores", "fauna", "crook", "poise", "epoch", "risky", "warns", "fling", "berry", "grape", "flank", "drags", "squid", "pelts", "icing", "irony", "irons", "barks", "whoop", "choke", "diets", "whips", "tally", "dozed", "twine", "kites", "bikes", "ticks", "riots", "roars", "vault", "looms", "scold", "blink", "dandy", "pupae", "sieve", "spike", "ducts", "lends", "pizza", "brink", "widen", "plumb", "pagan", "feats", "bison", "soggy", "scoop", "argon", "nudge", "skiff", "amber", "sexes", "rouse", "salts", "hitch", "exalt", "leash", "dined", "chute", "snort", "gusts", "melon", "cheat", "reefs", "llama", "lasso", "debut", "quota", "oaths", "prone", "mixes", "rafts", "dives", "stale", "inlet", "flick", "pinto", "brows", "untie", "batch", "greed", "chore", "stirs", "blush", "onset", "barbs", "volts", "beige", "swoop", "paddy", "laced", "shove", "jerky", "poppy", "leaks", "fares", "dodge", "godly", "squaw", "affix", "brute", "nicer", "undue", "snarl", "merge", "doses", "showy", "daddy", "roost", "vases", "swirl", "petty", "colds", "curry", "cobra", "genie", "flare", "messy", "cores", "soaks", "ripen", "whine", "amino", "plaid", "spiny", "mowed", "baton", "peers", "vowed", "pious", "swans", "exits", "afoot", "plugs", "idiom", "chili", "rites", "serfs", "cleft", "berth", "grubs", "annex", "dizzy", "hasty", "latch", "wasps", "mirth", "baron", "plead", "aloof", "aging", "pixel", "bared", "mummy", "hotly", "auger", "buddy", "chaps", "badge", "stark", "fairs", "gully", "mumps", "emery", "filly", "ovens", "drone", "gauze", "idiot", "fussy", "annoy", "shank", "gouge", "bleed", "elves", "roped", "unfit", "baggy", "mower", "scant", "grabs", "fleas", "lousy", "album", "sawed", "cooky", "murky", "infer", "burly", "waged", "dingy", "brine", "kneel", "creak", "vanes", "smoky", "spurt", "combs", "easel", "laces", "humps", "rumor", "aroma", "horde", "swiss", "leapt", "opium", "slime", "afire", "pansy", "mares", "soaps", "husks", "snips", "hazel", "lined", "cafes", "naive", "wraps", "sized", "piers", "beset", "agile", "tongs", "steed", "fraud", "booty", "valor", "downy", "witty", "mossy", "psalm", "scuba", "tours", "polka", "milky", "gaudy", "shrug", "tufts", "wilds", "laser", "truss", "hares", "creed", "lilac", "siren", "tarry", "bribe", "swine", "muted", "flips", "cures", "sinew", "boxed", "hoops", "gasps", "hoods", "niche", "yucca", "glows", "sewer", "whack", "fuses", "gowns", "droop", "bucks", "pangs", "mails", "whisk", "haven", "clasp", "sling", "stint", "urges", "champ", "piety", "chirp", "pleat", "posse", "sunup", "menus", "howls", "quake", "knack", "plaza", "fiend", "caked", "bangs", "erupt", "poker", "olden", "cramp", "voter", "poses", "manly", "slump", "fined", "grips", "gaped", "purge", "hiked", "maize", "fluff", "strut", "sloop", "prowl", "roach", "cocks", "bland", "dials", "plume", "slaps", "soups", "dully", "wills", "foams", "solos", "skier", "eaves", "totem", "fused", "latex", "veils", "mused", "mains", "myrrh", "racks", "galls", "gnats", "bouts", "sisal", "shuts", "hoses", "dryly", "hover", "gloss", "seeps", "denim", "putty", "guppy", "leaky", "dusky", "filth", "oboes", "spans", "fowls", "adorn", "glaze", "haunt", "dares", "obeys", "bakes", "abyss", "smelt", "gangs", "aches", "trawl", "claps", "undid", "spicy", "hoist", "fades", "vicar", "acorn", "pussy", "gruff", "musty", "tarts", "snuff", "hunch", "truce", "tweed", "dryer", "loser", "sheaf", "moles", "lapse", "tawny", "vexed", "autos", "wager", "domes", "sheen", "clang", "spade", "sowed", "broil", "slyly", "studs", "grunt", "donor", "slugs", "aspen", "homer", "croak", "tithe", "halts", "avert", "havoc", "hogan", "glint", "ruddy", "jeeps", "flaky", "ladle", "taunt", "snore", "fines", "props", "prune", "pesos", "radii", "pokes", "tiled", "daisy", "heron", "villa", "farce", "binds", "cites", "fixes", "jerks", "livid", "waked", "inked", "booms", "chews", "licks", "hyena", "scoff", "lusty", "sonic", "smith", "usher", "tucks", "vigil", "molts", "sects", "spars", "dumps", "scaly", "wisps", "sores", "mince", "panda", "flier", "axles", "plied", "booby", "patio", "rabbi", "petal", "polyp", "tints", "grate", "troll", "tolls", "relic", "phony", "bleat", "flaws", "flake", "snags", "aptly", "drawl", "ulcer", "soapy", "bossy", "monks", "crags", "caged", "twang", "diner", "taped", "cadet", "grids", "spawn", "guile", "noose", "mores", "girth", "slimy", "aides", "spasm", "burrs", "alibi", "lymph", "saucy", "muggy", "liter", "joked", "goofy", "exams", "enact", "stork", "lured", "toxic", "omens", "nears", "covet", "wrung", "forum", "venom", "moody", "alder", "sassy", "flair", "guild", "prays", "wrens", "hauls", "stave", "tilts", "pecks", "stomp", "gales", "tempt", "capes", "mesas", "omits", "tepee", "harry", "wring", "evoke", "limes", "cluck", "lunge", "highs", "canes", "giddy", "lithe", "verge", "khaki", "queue", "loath", "foyer", "outdo", "fared", "deter", "crumb", "astir", "spire", "jumpy", "extol", "buoys", "stubs", "lucid", "thong", "afore", "whiff", "maxim", "hulls", "clogs", "slats", "jiffy", "arbor", "cinch", "igloo", "goody", "gazes", "dowel", "calms", "bitch", "scowl", "gulps", "coded", "waver", "mason", "lobes", "ebony", "flail", "isles", "clods", "dazed", "adept", "oozed", "sedan", "clays", "warts", "ketch", "skunk", "manes", "adore", "sneer", "mango", "fiord", "flora", "roomy", "minks", "thaws", "watts", "freer", "exult", "plush", "paled", "twain", "clink", "scamp", "pawed", "grope", "bravo", "gable", "stink", "sever", "waned", "rarer", "regal", "wards", "fawns", "babes", "unify", "amend", "oaken", "glade", "visor", "hefty", "nines", "throb", "pecan", "butts", "pence", "sills", "jails", "flyer", "saber", "nomad", "miter", "beeps", "domed", "gulfs", "curbs", "heath", "moors", "aorta", "larks", "tangy", "wryly", "cheep", "rages", "evade", "lures", "freak", "vogue", "tunic", "slams", "knits", "dumpy", "mania", "spits", "firth", "hikes", "trots", "nosed", "clank", "dogma", "bloat", "balsa", "graft", "middy", "stile", "keyed", "finch", "sperm", "chaff", "wiles", "amigo", "copra", "amiss", "eying", "twirl", "lurch", "popes", "chins", "smock", "tines", "guise", "grits", "junks", "shoal", "cache", "tapir", "atoll", "deity", "toils", "spree", "mocks", "scans", "shorn", "revel", "raven", "hoary", "reels", "scuff", "mimic", "weedy", "corny", "truer", "rouge", "ember", "floes", "torso", "wipes", "edict", "sulky", "recur", "groin", "baste", "kinks", "surer", "piggy", "moldy", "franc", "liars", "inept", "gusty", "facet", "jetty", "equip", "leper", "slink", "soars", "cater", "dowry", "sided", "yearn", "decoy", "taboo", "ovals", "heals", "pleas", "beret", "spilt", "gayly", "rover", "endow", "pygmy", "carat", "abbey", "vents", "waken", "chimp", "fumed", "sodas", "vinyl", "clout", "wades", "mites", "smirk", "bores", "bunny", "surly", "frock", "foray", "purer", "milks", "query", "mired", "blare", "froth", "gruel", "navel", "paler", "puffy", "casks", "grime", "derby", "mamma", "gavel", "teddy", "vomit", "moans", "allot", "defer", "wield", "viper", "louse", "erred", "hewed", "abhor", "wrest", "waxen", "adage", "ardor", "stabs", "pored", "rondo", "loped", "fishy", "bible", "hires", "foals", "feuds", "jambs", "thuds", "jeers", "knead", "quirk", "rugby", "expel", "greys", "rigor", "ester", "lyres", "aback", "glues", "lotus", "lurid", "rungs", "hutch", "thyme", "valet", "tommy", "yokes", "epics", "trill", "pikes", "ozone", "caper", "chime", "frees", "famed", "leech", "smite", "neigh", "erode", "robed", "hoard", "salve", "conic", "gawky", "craze", "jacks", "gloat", "mushy", "rumps", "fetus", "wince", "pinks", "shalt", "toots", "glens", "cooed", "rusts", "stews", "shred", "parka", "chugs", "winks", "clots", "shrew", "booed", "filmy", "juror", "dents", "gummy", "grays", "hooky", "butte", "dogie", "poled", "reams", "fifes", "spank", "gayer", "tepid", "spook", "taint", "flirt", "rogue", "spiky", "opals", "miser", "cocky", "coyly", "balmy", "slosh", "brawl", "aphid", "faked", "hydra", "brags", "chide", "yanks", "allay", "video", "altos", "eases", "meted", "chasm", "longs", "excel", "taffy", "impel", "savor", "koala", "quays", "dawns", "proxy", "clove", "duets", "dregs", "tardy", "briar", "grimy", "ultra", "meaty", "halve", "wails", "suede", "mauve", "envoy", "arson", "coves", "gooey", "brews", "sofas", "chums", "amaze", "zooms", "abbot", "halos", "scour", "suing", "cribs", "sagas", "enema", "wordy", "harps", "coupe", "molar", "flops", "weeps", "mints", "ashen", "felts", "askew", "munch", "mewed", "divan", "vices", "jumbo", "blobs", "blots", "spunk", "acrid", "topaz", "cubed", "clans", "flees", "slurs", "gnaws", "welds", "fords", "emits", "agate", "pumas", "mends", "darks", "dukes", "plies", "canny", "hoots", "oozes", "lamed", "fouls", "clefs", "nicks", "mated", "skims", "brunt", "tuber", "tinge", "fates", "ditty", "thins", "frets", "eider", "bayou", "mulch", "fasts", "amass", "damps", "morns", "friar", "palsy", "vista", "croon", "conch", "udder", "tacos", "skits", "mikes", "quits", "preen", "aster", "adder", "elegy", "pulpy", "scows", "baled", "hovel", "lavas", "crave", "optic", "welts", "busts", "knave", "razed", "shins", "totes", "scoot", "dears", "crock", "mutes", "trims", "skein", "doted", "shuns", "veers", "fakes", "yoked", "wooed", "hacks", "sprig", "wands", "lulls", "seers", "snobs", "nooks", "pined", "perky", "mooed", "frill", "dines", "booze", "tripe", "prong", "drips", "odder", "levee", "antic", "sidle", "pithy", "corks", "yelps", "joker", "fleck", "buffs", "scram", "tiers", "bogey", "doled", "irate", "vales", "coped", "hails", "elude", "bulks", "aired", "vying", "stags", "strew", "cocci", "pacts", "scabs", "silos", "dusts", "yodel", "terse", "jaded", "baser", "jibes", "foils", "sways", "forgo", "slays", "preys", "treks", "quell", "peeks", "assay", "lurks", "eject", "boars", "trite", "belch", "gnash", "wanes", "lutes", "whims", "dosed", "chewy", "snipe", "umbra", "teems", "dozes", "kelps", "upped", "brawn", "doped", "shush", "rinds", "slush", "moron", "voile", "woken", "fjord", "sheik", "jests", "kayak", "slews", "toted", "saner", "drape", "patty", "raves", "sulfa", "grist", "skied", "vixen", "civet", "vouch", "tiara", "homey", "moped", "runts", "serge", "kinky", "rills", "corns", "brats", "pries", "amble", "fries", "loons", "tsars", "datum", "musky", "pigmy", "gnome", "ravel", "ovule", "icily", "liken", "lemur", "frays", "silts", "sifts", "plods", "ramps", "tress", "earls", "dudes", "waive", "karat", "jolts", "peons", "beers", "horny", "pales", "wreak", "lairs", "lynch", "stank", "swoon", "idler", "abort", "blitz", "ensue", "atone", "bingo", "roves", "kilts", "scald", "adios", "cynic", "dulls", "memos", "elfin", "dales", "peels", "peals", "bares", "sinus", "crone", "sable", "hinds", "shirk", "enrol", "wilts", "roams", "duped", "cysts", "mitts", "safes", "spats", "coops", "filet", "knell", "refit", "covey", "punks", "kilns", "fitly", "abate", "talcs", "heeds", "duels", "wanly", "ruffs", "gauss", "lapel", "jaunt", "whelp", "cleat", "gauzy", "dirge", "edits", "wormy", "moats", "smear", "prods", "bowel", "frisk", "vests", "bayed", "rasps", "tames", "delve", "embed", "befit", "wafer", "ceded", "novas", "feign", "spews", "larch", "huffs", "doles", "mamas", "hulks", "pried", "brims", "irked", "aspic", "swipe", "mealy", "skimp", "bluer", "slake", "dowdy", "penis", "brays", "pupas", "egret", "flunk", "phlox", "gripe", "peony", "douse", "blurs", "darns", "slunk", "lefts", "chats", "inane", "vials", "stilt", "rinks", "woofs", "wowed", "bongs", "frond", "ingot", "evict", "singe", "shyer", "flied", "slops", "dolts", "drool", "dells", "whelk", "hippy", "feted", "ether", "cocos", "hives", "jibed", "mazes", "trios", "sirup", "squab", "laths", "leers", "pasta", "rifts", "lopes", "alias", "whirs", "diced", "slags", "lodes", "foxed", "idled", "prows", "plait", "malts", "chafe", "cower", "toyed", "chefs", "keels", "sties", "racer", "etude", "sucks", "sulks", "micas", "czars", "copse", "ailed", "abler", "rabid", "golds", "croup", "snaky", "visas", "palls", "mopes", "boned", "wispy", "raved", "swaps", "junky", "doily", "pawns", "tamer", "poach", "baits", "damns", "gumbo", "daunt", "prank", "hunks", "buxom", "heres", "honks", "stows", "unbar", "idles", "routs", "sages", "goads", "remit", "copes", "deign", "culls", "girds", "haves", "lucks", "stunk", "dodos", "shams", "snubs", "icons", "usurp", "dooms", "hells", "soled", "comas", "paves", "maths", "perks", "limps", "wombs", "blurb", "daubs", "cokes", "sours", "stuns", "cased", "musts", "coeds", "cowed", "aping", "zoned", "rummy", "fetes", "skulk", "quaff", "rajah", "deans", "reaps", "galas", "tills", "roved", "kudos", "toned", "pared", "scull", "vexes", "punts", "snoop", "bails", "dames", "hazes", "lores", "marts", "voids", "ameba", "rakes", "adzes", "harms", "rears", "satyr", "swill", "hexes", "colic", "leeks", "hurls", "yowls", "ivies", "plops", "musks", "papaw", "jells", "bused", "cruet", "bided", "filch", "zests", "rooks", "laxly", "rends", "loams", "basks", "sires", "carps", "pokey", "flits", "muses", "bawls", "shuck", "viler", "lisps", "peeps", "sorer", "lolls", "prude", "diked", "floss", "flogs", "scums", "dopes", "bogie", "pinky", "leafs", "tubas", "scads", "lowed", "yeses", "biked", "qualm", "evens", "caned", "gawks", "whits", "wooly", "gluts", "romps", "bests", "dunce", "crony", "joist", "tunas", "boner", "malls", "parch", "avers", "crams", "pares", "dally", "bigot", "kales", "flays", "leach", "gushy", "pooch", "huger", "slyer", "golfs", "mires", "flues", "loafs", "arced", "acnes", "neons", "fiefs", "dints", "dazes", "pouts", "cored", "yules", "lilts", "beefs", "mutts", "fells", "cowls", "spuds", "lames", "jawed", "dupes", "deads", "bylaw", "noons", "nifty", "clued", "vireo", "gapes", "metes", "cuter", "maims", "droll", "cupid", "mauls", "sedge", "papas", "wheys", "eking", "loots", "hilts", "meows", "beaus", "dices", "peppy", "riper", "fogey", "gists", "yogas", "gilts", "skews", "cedes", "zeals", "alums", "okays", "elope", "grump", "wafts", "soots", "blimp", "hefts", "mulls", "hosed", "cress", "doffs", "ruder", "pixie", "waifs", "ousts", "pucks", "biers", "gulch", "suets", "hobos", "lints", "brans", "teals", "garbs", "pewee", "helms", "turfs", "quips", "wends", "banes", "napes", "icier", "swats", "bagel", "hexed", "ogres", "goner", "gilds", "pyres", "lards", "bides", "paged", "talon", "flout", "medic", "veals", "putts", "dirks", "dotes", "tippy", "blurt", "piths", "acing", "barer", "whets", "gaits", "wools", "dunks", "heros", "swabs", "dirts", "jutes", "hemps", "surfs", "okapi", "chows", "shoos", "dusks", "parry", "decal", "furls", "cilia", "sears", "novae", "murks", "warps", "slues", "lamer", "saris", "weans", "purrs", "dills", "togas", "newts", "meany", "bunts", "razes", "goons", "wicks", "ruses", "vends", "geode", "drake", "judos", "lofts", "pulps", "lauds", "mucks", "vises", "mocha", "oiled", "roman", "ethyl", "gotta", "fugue", "smack", "gourd", "bumpy", "radix", "fatty", "borax", "cubit", "cacti", "gamma", "focal", "avail", "papal", "golly", "elite", "versa", "billy", "adieu", "annum", "howdy", "rhino", "norms", "bobby", "axiom", "setup", "yolks", "terns", "mixer", "genre", "knoll", "abode", "junta", "gorge", "combo", "alpha", "overt", "kinda", "spelt", "prick", "nobly", "ephod", "audio", "modal", "veldt", "warty", "fluke", "bonny", "bream", "rosin", "bolls", "doers", "downs", "beady", "motif", "humph", "fella", "mould", "crepe", "kerns", "aloha", "glyph", "azure", "riser", "blest", "locus", "lumpy", "beryl", "wanna", "brier", "tuner", "rowdy", "mural", "timer", "canst", "krill", "quoth", "lemme", "triad", "tenon", "amply", "deeps", "padre", "leant", "pacer", "octal", "dolly", "trans", "sumac", "foamy", "lolly", "giver", "quipu", "codex", "manna", "unwed", "vodka", "ferny", "salon", "duple", "boron", "revue", "crier", "alack", "inter", "dilly", "whist", "cults", "spake", "reset", "loess", "decor", "mover", "verve", "ethic", "gamut", "lingo", "dunno", "align", "sissy", "incur", "reedy", "avant", "piper", "waxer", "calyx", "basil", "coons", "seine", "piney", "lemma", "trams", "winch", "whirr", "saith", "ionic", "heady", "harem", "tummy", "sally", "shied", "dross", "farad", "saver", "tilde", "jingo", "bower", "serif", "facto", "belle", "inset", "bogus", "caved", "forte", "sooty", "bongo", "toves", "credo", "basal", "yella", "aglow", "glean", "gusto", "hymen", "ethos", "terra", "brash", "scrip", "swash", "aleph", "tinny", "itchy", "wanta", "trice", "jowls", "gongs", "garde", "boric", "twill", "sower", "henry", "awash", "libel", "spurn", "sabre", "rebut", "penal", "obese", "sonny", "quirt", "mebbe", "tacit", "greek", "xenon", "hullo", "pique", "roger", "negro", "hadst", "gecko", "beget", "uncut", "aloes", "louis", "quint", "clunk", "raped", "salvo", "diode", "matey", "hertz", "xylem", "kiosk", "apace", "cawed", "peter", "wench", "cohos", "sorta", "gamba", "bytes", "tango", "nutty", "axial", "aleck", "natal", "clomp", "gored", "siree", "bandy", "gunny", "runic", "whizz", "rupee", "fated", "wiper", "bards", "briny", "staid", "hocks", "ochre", "yummy", "gents", "soupy", "roper", "swath", "cameo", "edger", "spate", "gimme", "ebbed", "breve", "theta", "deems", "dykes", "servo", "telly", "tabby", "tares", "blocs", "welch", "ghoul", "vitae", "cumin", "dinky", "bronc", "tabor", "teeny", "comer", "borer", "sired", "privy", "mammy", "deary", "gyros", "sprit", "conga", "quire", "thugs", "furor", "bloke", "runes", "bawdy", "cadre", "toxin", "annul", "egged", "anion", "nodes", "picky", "stein", "jello", "audit", "echos", "fagot", "letup", "eyrie", "fount", "caped", "axons", "amuck", "banal", "riled", "petit", "umber", "miler", "fibre", "agave", "bated", "bilge", "vitro", "feint", "pudgy", "mater", "manic", "umped", "pesky", "strep", "slurp", "pylon", "puree", "caret", "temps", "newel", "yawns", "seedy", "treed", "coups", "rangy", "brads", "mangy", "loner", "circa", "tibia", "afoul", "mommy", "titer", "carne", "kooky", "motes", "amity", "suave", "hippo", "curvy", "samba", "newsy", "anise", "imams", "tulle", "aways", "liven", "hallo", "wales", "opted", "canto", "idyll", "bodes", "curio", "wrack", "hiker", "chive", "yokel", "dotty", "demur", "cusps", "specs", "quads", "laity", "toner", "decry", "writs", "saute", "clack", "aught", "logos", "tipsy", "natty", "ducal", "bidet", "bulgy", "metre", "lusts", "unary", "goeth", "baler", "sited", "shies", "hasps", "brung", "holed", "swank", "looky", "melee", "huffy", "loamy", "pimps", "titan", "binge", "shunt", "femur", "libra", "seder", "honed", "annas", "coypu", "shims", "zowie", "jihad", "savvy", "nadir", "basso", "monic", "maned", "mousy", "omega", "laver", "prima", "picas", "folio", "mecca", "reals", "troth", "testy", "balky", "crimp", "chink", "abets", "splat", "abaci", "vaunt", "cutie", "pasty", "moray", "levis", "ratty", "islet", "joust", "motet", "viral", "nukes", "grads", "comfy", "voila", "woozy", "blued", "whomp", "sward", "metro", "skeet", "chine", "aerie", "bowie", "tubby", "emirs", "coati", "unzip", "slobs", "trike", "funky", "ducat", "dewey", "skoal", "wadis", "oomph", "taker", "minim", "getup", "stoic", "synod", "runty", "flyby", "braze", "inlay", "venue", "louts", "peaty", "orlon", "humpy", "radon", "beaut", "raspy", "unfed", "crick", "nappy", "vizor", "yipes", "rebus", "divot", "kiwis", "vetch", "squib", "sitar", "kiddo", "dyers", "cotta", "matzo", "lager", "zebus", "crass", "dacha", "kneed", "dicta", "fakir", "knurl", "runny", "unpin", "julep", "globs", "nudes", "sushi", "tacky", "stoke", "kaput", "butch", "hulas", "croft", "achoo", "genii", "nodal", "outgo", "spiel", "viols", "fetid", "cagey", "fudgy", "epoxy", "leggy", "hanky", "lapis", "felon", "beefy", "coots", "melba", "caddy", "segue", "betel", "frizz", "drear", "kooks", "turbo", "hoagy", "moult", "helix", "zonal", "arias", "nosey", "paean", "lacey", "banns", "swain", "fryer", "retch", "tenet", "gigas", "whiny", "ogled", "rumen", "begot", "cruse", "abuts", "riven", "balks", "sines", "sigma", "abase", "ennui", "gores", "unset", "augur", "sated", "odium", "latin", "dings", "moire", "scion", "henna", "kraut", "dicks", "lifer", "prigs", "bebop", "gages", "gazer", "fanny", "gibes", "aural", "tempi", "hooch", "rapes", "snuck", "harts", "techs", "emend", "ninny", "guava", "scarp", "liege", "tufty", "sepia", "tomes", "carob", "emcee", "prams", "poser", "verso", "hubba", "joule", "baize", "blips", "scrim", "cubby", "clave", "winos", "rearm", "liens", "lumen", "chump", "nanny", "trump", "fichu", "chomp", "homos", "purty", "maser", "woosh", "patsy", "shill", "rusks", "avast", "swami", "boded", "ahhhh", "lobed", "natch", "shish", "tansy", "snoot", "payer", "altho", "sappy", "laxer", "hubby", "aegis", "riles", "ditto", "jazzy", "dingo", "quasi", "septa", "peaky", "lorry", "heerd", "bitty", "payee", "seamy", "apses", "imbue", "belie", "chary", "spoof", "phyla", "clime", "babel", "wacky", "sumps", "skids", "khans", "crypt", "inure", "nonce", "outen", "faire", "hooey", "anole", "kazoo", "calve", "limbo", "argot", "ducky", "faker", "vibes", "gassy", "unlit", "nervy", "femme", "biter", "fiche", "boors", "gaffe", "saxes", "recap", "synch", "facie", "dicey", "ouija", "hewer", "legit", "gurus", "edify", "tweak", "caron", "typos", "rerun", "polly", "surds", "hamza", "nulls", "hater", "lefty", "mogul", "mafia", "debug", "pates", "blabs", "splay", "talus", "porno", "moola", "nixed", "kilos", "snide", "horsy", "gesso", "jaggy", "trove", "nixes", "creel", "pater", "iotas", "cadge", "skyed", "hokum", "furze", "ankhs", "curie", "nutsy", "hilum", "remix", "angst", "burls", "jimmy", "veiny", "tryst", "codon", "befog", "gamed", "flume", "axman", "doozy", "lubes", "rheas", "bozos", "butyl", "kelly", "mynah", "jocks", "donut", "avian", "wurst", "chock", "quash", "quals", "hayed", "bombe", "cushy", "spacy", "puked", "leery", "thews", "prink", "amens", "tesla", "intro", "fiver", "frump", "capos", "opine", "coder", "namer", "jowly", "pukes", "haled", "chard", "duffs", "bruin", "reuse", "whang", "toons", "frats", "silty", "telex", "cutup", "nisei", "neato", "decaf", "softy", "bimbo", "adlib", "loony", "shoed", "agues", "peeve", "noway", "gamey", "sarge", "reran", "epact", "potty", "coned", "upend", "narco", "ikats", "whorl", "jinks", "tizzy", "weepy", "posit", "marge", "vegan", "clops", "numbs", "reeks", "rubes", "rower", "biped", "tiffs", "hocus", "hammy", "bunco", "fixit", "tykes", "chaws", "yucky", "hokey", "resew", "maven", "adman", "scuzz", "slogs", "souse", "nacho", "mimed", "melds", "boffo", "debit", "pinup", "vagus", "gulag", "randy", "bosun", "educe", "faxes", "auras", "pesto", "antsy", "betas", "fizzy", "dorky", "snits", "moxie", "thane", "mylar", "nobby", "gamin", "gouty", "esses", "goyim", "paned", "druid", "jades", "rehab", "gofer", "tzars", "octet", "homed", "socko", "dorks", "eared", "anted", "elide", "fazes", "oxbow", "dowse", "situs", "macaw", "scone", "drily", "hyper", "salsa", "mooch", "gated", "unjam", "lipid", "mitre", "venal", "knish", "ritzy", "divas", "torus", "mange", "dimer", "recut", "meson", "wined", "fends", "phage", "fiats", "caulk", "cavil", "panty", "roans", "bilks", "hones", "botch", "estop", "sully", "sooth", "gelds", "ahold", "raper", "pager", "fixer", "infix", "hicks", "tuxes", "plebe", "twits", "abash", "twixt", "wacko", "primp", "nabla", "girts", "miffs", "emote", "xerox", "rebid", "shahs", "rutty", "grout", "grift", "deify", "biddy", "kopek", "semis", "bries", "acmes", "piton", "hussy", "torts", "disco", "whore", "boozy", "gibed", "vamps", "amour", "soppy", "gonzo", "durst", "wader", "tutus", "perms", "catty", "glitz", "brigs", "nerds", "barmy", "gizmo", "owlet", "sayer", "molls", "shard", "whops", "comps", "corer", "colas", "matte", "droid", "ploys", "vapid", "cairn", "deism", "mixup", "yikes", "prosy", "raker", "flubs", "whish", "reify", "craps", "shags", "clone", "hazed", "macho", "recto", "refix", "drams", "biker", "aquas", "porky", "doyen", "exude", "goofs", "divvy", "noels", "jived", "hulky", "cager", "harpy", "oldie", "vivas", "admix", "codas", "zilch", "deist", "orcas", "retro", "pilaf", "parse", "rants", "zingy", "toddy", "chiff", "micro", "veeps", "girly", "nexus", "demos", "bibbs", "antes", "lulus", "gnarl", "zippy", "ivied", "epees", "wimps", "tromp", "grail", "yoyos", "poufs", "hales", "roust", "cabal", "rawer", "pampa", "mosey", "kefir", "burgs", "unmet", "cuspy", "boobs", "boons", "hypes", "dynes", "nards", "lanai", "yogis", "sepal", "quark", "toked", "prate", "ayins", "hawed", "swigs", "vitas", "toker", "doper", "bossa", "linty", "foist", "mondo", "stash", "kayos", "twerp", "zesty", "capon", "wimpy", "rewed", "fungo", "tarot", "frosh", "kabob", "pinko", "redid", "mimeo", "heist", "tarps", "lamas", "sutra", "dinar", "whams", "busty", "spays", "mambo", "nabob", "preps", "odour", "cabby", "conks", "sluff", "dados", "houri", "swart", "balms", "gutsy", "faxed", "egads", "pushy", "retry", "agora", "drubs", "daffy", "chits", "mufti", "karma", "lotto", "toffs", "burps", "deuce", "zings", "kappa", "clads", "doggy", "duper", "scams", "ogler", "mimes", "throe", "zetas", "waled", "promo", "blats", "muffs", "oinks", "viand", "coset", "finks", "faddy", "minis", "snafu", "sauna", "usury", "muxes", "craws", "stats", "condo", "coxes", "loopy", "dorms", "ascot", "dippy", "execs", "dopey", "envoi", "umpty", "gismo", "fazed", "strop", "jives", "slims", "batik", "pings", "sonly", "leggo", "pekoe", "prawn", "luaus", "campy", "oodle", "prexy", "proms", "touts", "ogles", "tweet", "toady", "naiad", "hider", "nuked", "fatso", "sluts", "obits", "narcs", "tyros", "delis", "wooer", "hyped", "poset", "byway", "texas", "scrod", "avows", "futon", "torte", "tuple", "carom", "kebab", "tamps", "jilts", "duals", "artsy", "repro", "modem", "toped", "psych", "sicko", "klutz", "tarns", "coxed", "drays", "cloys", "anded", "piker", "aimer", "suras", "limos", "flack", "hapax", "dutch", "mucky", "shire", "klieg", "staph", "layup", "tokes", "axing", "toper", "duvet", "cowry", "profs", "blahs", "addle", "sudsy", "batty", "coifs", "suety", "gabby", "hafta", "pitas", "gouda", "deice", "taupe", "topes", "duchy", "nitro", "carny", "limey", "orals", "hirer", "taxer", "roils", "ruble", "elate", "dolor", "wryer", "snots", "quais", "coked", "gimel", "gorse", "minas", "goest", "agape", "manta", "jings", "iliac", "admen", "offen", "cills", "offal", "lotta", "bolas", "thwap", "alway", "boggy", "donna", "locos", "belay", "gluey", "bitsy", "mimsy", "hilar", "outta", "vroom", "fetal", "raths", "renal", "dyads", "crocs", "vires", "culpa", "kivas", "feist", "teats", "thats", "yawls", "whens", "abaca", "ohhhh", "aphis", "fusty", "eclat", "perdu", "mayst", "exeat", "molly", "supra", "wetly", "plasm", "buffa", "semen", "pukka", "tagua", "paras", "stoat", "secco", "carte", "haute", "molal", "shads", "forma", "ovoid", "pions", "modus", "bueno", "rheum", "scurf", "parer", "ephah", "doest", "sprue", "flams", "molto", "dieth", "choos", "miked", "bronx", "goopy", "bally", "plumy", "moony", "morts", "yourn", "bipod", "spume", "algal", "ambit", "mucho", "spued", "dozer", "harum", "groat", "skint", "laude", "thrum", "pappy", "oncet", "rimed", "gigue", "limed", "plein", "redly", "humpf", "lites", "seest", "grebe", "absit", "thanx", "pshaw", "yawps", "plats", "payed", "areal", "tilth", "youse", "gwine", "thees", "watsa", "lento", "spitz", "yawed", "gipsy", "sprat", "cornu", "amahs", "blowy", "wahoo", "lubra", "mecum", "whooo", "coqui", "sabra", "edema", "mrads", "dicot", "astro", "kited", "ouzel", "didos", "grata", "bonne", "axmen", "klunk", "summa", "laves", "purls", "yawny", "teary", "masse", "largo", "bazar", "pssst", "sylph", "lulab", "toque", "fugit", "plunk", "ortho", "lucre", "cooch", "whipt", "folky", "tyres", "wheee", "corky", "injun", "solon", "didot", "kerfs", "rayed", "wassa", "chile", "begat", "nippy", "litre", "magna", "rebox", "hydro", "milch", "brent", "gyves", "lazed", "feued", "mavis", "inapt", "baulk", "casus", "scrum", "wised", "fossa", "dower", "kyrie", "bhoys", "scuse", "feuar", "ohmic", "juste", "ukase", "beaux", "tusky", "orate", "musta", "lardy", "intra", "quiff", "epsom", "neath", "ocher", "tared", "homme", "mezzo", "corms", "psoas", "beaky", "terry", "infra", "spivs", "tuans", "belli", "bergs", "anima", "weirs", "mahua", "scops", "manse", "titre", "curia", "kebob", "cycad", "talky", "fucks", "tapis", "amide", "dolce", "sloes", "jakes", "russe", "blash", "tutti", "pruta", "panga", "blebs", "tench", "swarf", "herem", "missy", "merse", "pawky", "limen", "vivre", "chert", "unsee", "tiros", "brack", "foots", "welsh", "fosse", "knops", "ileum", "noire", "firma", "podgy", "laird", "thunk", "shute", "rowan", "shoji", "poesy", "uncap", "fames", "glees", "costa", "turps", "fores", "solum", "imago", "byres", "fondu", "coney", "polis", "dictu", "kraal", "sherd", "mumbo", "wroth", "chars", "unbox", "vacuo", "slued", "weest", "hades", "wiled", "syncs", "muser", "excon", "hoars", "sibyl", "passe", "joeys", "lotsa", "lepta", "shays", "bocks", "endue", "darer", "nones", "ileus", "plash", "busby", "wheal", "buffo", "yobbo", "biles", "poxes", "rooty", "licit", "terce", "bromo", "hayey", "dweeb", "imbed", "saran", "bruit", "punky", "softs", "biffs", "loppy", "agars", "aquae", "livre", "biome", "bunds", "shews", "diems", "ginny", "degum", "polos", "desex", "unman", "dungy", "vitam", "wedgy", "glebe", "apers", "ridgy", "roids", "wifey", "vapes", "whoas", "bunko", "yolky", "ulnas", "reeky", "bodge", "brant", "davit", "deque", "liker", "jenny", "tacts", "fulls", "treap", "ligne", "acked", "refry", "vower", "aargh", "churl", "momma", "gaols", "whump", "arras", "marls", "tiler", "grogs", "memes", "midis", "tided", "haler", "duces", "twiny", "poste", "unrig", "prise", "drabs", "quids", "facer", "spier", "baric", "geoid", "remap", "trier", "gunks", "steno", "stoma", "airer", "ovate", "torah", "apian", "smuts", "pocks", "yurts", "exurb", "defog", "nuder", "bosky", "nimbi", "mothy", "joyed", "labia", "pards", "jammy", "bigly", "faxer", "hoppy", "nurbs", "cotes", "dishy", "vised", "celeb", "pismo", "casas", "withs", "dodgy", "scudi", "mungs", "muons", "ureas", "ioctl", "unhip", "krone", "sager", "verst", "expat", "gronk", "uvula", "shawm", "bilgy", "braes", "cento", "webby", "lippy", "gamic", "lordy", "mazed", "tings", "shoat", "faery", "wirer", "diazo", "carer", "rater", "greps", "rente", "zloty", "viers", "unapt", "poops", "fecal", "kepis", "taxon", "eyers", "wonts", "spina", "stoae", "yenta", "pooey", "buret", "japan", "bedew", "hafts", "selfs", "oared", "herby", "pryer", "oakum", "dinks", "titty", "sepoy", "penes", "fusee", "winey", "gimps", "nihil", "rille", "giber", "ousel", "umiak", "cuppy", "hames", "shits", "azine", "glads", "tacet", "bumph", "coyer", "honky", "gamer", "gooky", "waspy", "sedgy", "bents", "varia", "djinn", "junco", "pubic", "wilco", "lazes", "idyls", "lupus", "rives", "snood", "schmo", "spazz", "finis", "noter", "pavan", "orbed", "bates", "pipet", "baddy", "goers", "shako", "stets", "sebum", "seeth", "lobar", "raver", "ajuga", "riced", "velds", "dribs", "ville", "dhows", "unsew", "halma", "krona", "limby", "jiffs", "treys", "bauds", "pffft", "mimer", "plebs", "caner", "jiber", "cuppa", "washy", "chuff", "unarm", "yukky", "styes", "waker", "flaks", "maces", "rimes", "gimpy", "guano", "liras", "kapok", "scuds", "bwana", "oring", "aider", "prier", "klugy", "monte", "golem", "velar", "firer", "pieta", "umbel", "campo", "unpeg", "fovea", "abeam", "boson", "asker", "goths", "vocab", "vined", "trows", "tikis", "loper", "indie", "boffs", "spang", "grapy", "tater", "ichor", "kilty", "lochs", "supes", "degas", "flics", "torsi", "beths", "weber", "resaw", "lawny", "coven", "mujik", "relet", "therm", "heigh", "shnor", "trued", "zayin", "liest", "barfs", "bassi", "qophs", "roily", "flabs", "punny", "okras", "hanks", "dipso", "nerfs", "fauns", "calla", "pseud", "lurer", "magus", "obeah", "atria", "twink", "palmy", "pocky", "pends", "recta", "plonk", "slaws", "keens", "nicad", "pones", "inker", "whews", "groks", "mosts", "trews", "ulnar", "gyppy", "cocas", "expos", "eruct", "oiler", "vacua", "dreck", "dater", "arums", "tubal", "voxel", "dixit", "beery", "assai", "lades", "actin", "ghoti", "buzzy", "meads", "grody", "ribby", "clews", "creme", "email", "pyxie", "kulak", "bocci", "rived", "duddy", "hoper", "lapin", "wonks", "petri", "phial", "fugal", "holon", "boomy", "duomo", "musos", "shier", "hayer", "porgy", "hived", "litho", "fisty", "stagy", "luvya", "maria", "smogs", "asana", "yogic", "slomo", "fawny", "amine", "wefts", "gonad", "twirp", "brava", "plyer", "fermi", "loges", "niter", "revet", "unate", "gyved", "totty", "zappy", "honer", "giros", "dicer", "calks", "luxes", "monad", "cruft", "quoin", "fumer", "amped", "shlep", "vinca", "yahoo", "vulva", "zooey", "dryad", "nixie", "moper", "iambs", "lunes", "nudie", "limns", "weals", "nohow", "miaow", "gouts", "mynas", "mazer", "kikes", "oxeye", "stoup", "jujus", "debar", "pubes", "taels", "defun", "rands", "blear", "paver", "goosy", "sprog", "oleos", "toffy", "pawer", "maced", "crits", "kluge", "tubed", "sahib", "ganef", "scats", "sputa", "vaned", "acned", "taxol", "plink", "oweth", "tribs", "resay", "boule", "thous", "haply", "glans", "maxis", "bezel", "antis", "porks", "quoit", "alkyd", "glary", "beamy", "hexad", "bonks", "tecum", "kerbs", "filar", "frier", "redux", "abuzz", "fader", "shoer", "couth", "trues", "guyed", "goony", "booky", "fuzes", "hurly", "genet", "hodad", "calix", "filer", "pawls", "iodic", "utero", "henge", "unsay", "liers", "piing", "weald", "sexed", "folic", "poxed", "cunts", "anile", "kiths", "becks", "tatty", "plena", "rebar", "abled", "toyer", "attar", "teaks", "aioli", "awing", "anent", "feces", "redip", "wists", "prats", "mesne", "muter", "smurf", "owest", "bahts", "lossy", "ftped", "hunky", "hoers", "slier", "sicks", "fatly", "delft", "hiver", "himbo", "pengo", "busks", "loxes", "zonks", "ilium", "aport", "ikons", "mulct", "reeve", "civvy", "canna", "barfy", "kaiak", "scudo", "knout", "gaper", "bhang", "pease", "uteri", "lases", "paten", "rasae", "axels", "stoas", "ombre", "styli", "gunky", "hazer", "kenaf", "ahoys", "ammos", "weeny", "urger", "kudzu", "paren", "bolos", "fetor", "nitty", "techy", "lieth", "somas", "darky", "villi", "gluon", "janes", "cants", "farts", "socle", "jinns", "ruing", "slily", "ricer", "hadda", "wowee", "rices", "nerts", "cauls", "swive", "lilty", "micks", "arity", "pasha", "finif", "oinky", "gutty", "tetra", "wises", "wolds", "balds", "picot", "whats", "shiki", "bungs", "snarf", "legos", "dungs", "stogy", "berms", "tangs", "vails", "roods", "morel", "sware", "elans", "latus", "gules", "razer", "doxie", "buena", "overs", "gutta", "zincs", "nates", "kirks", "tikes", "donee", "jerry", "mohel", "ceder", "doges", "unmap", "folia", "rawly", "snark", "topoi", "ceils", "immix", "yores", "diest", "bubba", "pomps", "forky", "turdy", "lawzy", "poohs", "worts", "gloms", "beano", "muley", "barky", "tunny", "auric", "funks", "gaffs", "cordy", "curdy", "lisle", "toric", "soyas", "reman", "mungy", "carpy", "apish", "oaten", "gappy", "aurae", "bract", "rooky", "axled", "burry", "sizer", "proem", "turfy", "impro", "mashy", "miens", "nonny", "olios", "grook", "sates", "agley", "corgi", "dashy", "doser", "dildo", "apsos", "xored", "laker", "playa", "selah", "malty", "dulse", "frigs", "demit", "whoso", "rials", "sawer", "spics", "bedim", "snugs", "fanin", "azoic", "icers", "suers", "wizen", "koine", "topos", "shirr", "rifer", "feral", "laded", "lased", "turds", "swede", "easts", "cozen", "unhit", "pally", "aitch", "sedum", "coper", "ruche", "geeks", "swags", "etext", "algin", "offed", "ninja", "holer", "doter", "toter", "besot", "dicut", "macer", "peens", "pewit", "redox", "poler", "yecch", "fluky", "doeth", "twats", "cruds", "bebug", "bider", "stele", "hexer", "wests", "gluer", "pilau", "abaft", "whelm", "lacer", "inode", "tabus", "gator", "cuing", "refly", "luted", "cukes", "bairn", "bight", "arses", "crump", "loggy", "blini", "spoor", "toyon", "harks", "wazoo", "fenny", "naves", "keyer", "tufas", "morph", "rajas", "typal", "spiff", "oxlip", "unban", "mussy", "finny", "rimer", "login", "molas", "cirri", "huzza", "agone", "unsex", "unwon", "peats", "toile", "zombi", "dewed", "nooky", "alkyl", "ixnay", "dovey", "holey", "cuber", "amyls", "podia", "chino", "apnea", "prims", "lycra", "johns", "primo", "fatwa", "egger", "hempy", "snook", "hying", "fuzed", "barms", "crink", "moots", "yerba", "rhumb", "unarc", "direr", "munge", "eland", "nares", "wrier", "noddy", "atilt", "jukes", "ender", "thens", "unfix", "doggo", "zooks", "diddy", "shmoo", "brusk", "prest", "curer", "pasts", "kelpy", "bocce", "kicky", "taros", "lings", "dicky", "nerdy", "abend", "stela", "biggy", "laved", "baldy", "pubis", "gooks", "wonky", "stied", "hypos", "assed", "spumy", "osier", "roble", "rumba", "biffy", "pupal"];

    const answers = ["aback", "abase", "abate", "abbey", "abbot", "abhor", "abide", "abled", "abode", "abort", "about", "above", "abuse", "abyss", "acorn", "acrid", "actor", "acute", "adage", "adapt", "adept", "admin", "admit", "adobe", "adopt", "adore", "adorn", "adult", "affix", "afire", "afoot", "afoul", "after", "again", "agape", "agate", "agent", "agile", "aging", "aglow", "agony", "agora", "agree", "ahead", "aider", "aisle", "alarm", "album", "alert", "algae", "alibi", "alien", "align", "alike", "alive", "allay", "alley", "allot", "allow", "alloy", "aloft", "alone", "along", "aloof", "aloud", "alpha", "altar", "alter", "amass", "amaze", "amber", "amble", "amend", "amiss", "amity", "among", "ample", "amply", "amuse", "angel", "anger", "angle", "angry", "angst", "anime", "ankle", "annex", "annoy", "annul", "anode", "antic", "anvil", "aorta", "apart", "aphid", "aping", "apnea", "apple", "apply", "apron", "aptly", "arbor", "ardor", "arena", "argue", "arise", "armor", "aroma", "arose", "array", "arrow", "arson", "artsy", "ascot", "ashen", "aside", "askew", "assay", "asset", "atoll", "atone", "attic", "audio", "audit", "augur", "aunty", "avail", "avert", "avian", "avoid", "await", "awake", "award", "aware", "awash", "awful", "awoke", "axial", "axiom", "axion", "azure", "bacon", "badge", "badly", "bagel", "baggy", "baker", "baler", "balmy", "banal", "banjo", "barge", "baron", "basal", "basic", "basil", "basin", "basis", "baste", "batch", "bathe", "baton", "batty", "bawdy", "bayou", "beach", "beady", "beard", "beast", "beech", "beefy", "befit", "began", "begat", "beget", "begin", "begun", "being", "belch", "belie", "belle", "belly", "below", "bench", "beret", "berry", "berth", "beset", "betel", "bevel", "bezel", "bible", "bicep", "biddy", "bigot", "bilge", "billy", "binge", "bingo", "biome", "birch", "birth", "bison", "bitty", "black", "blade", "blame", "bland", "blank", "blare", "blast", "blaze", "bleak", "bleat", "bleed", "bleep", "blend", "bless", "blimp", "blind", "blink", "bliss", "blitz", "bloat", "block", "bloke", "blond", "blood", "bloom", "blown", "bluer", "bluff", "blunt", "blurb", "blurt", "blush", "board", "boast", "bobby", "boney", "bongo", "bonus", "booby", "boost", "booth", "booty", "booze", "boozy", "borax", "borne", "bosom", "bossy", "botch", "bough", "boule", "bound", "bowel", "boxer", "brace", "braid", "brain", "brake", "brand", "brash", "brass", "brave", "bravo", "brawl", "brawn", "bread", "break", "breed", "briar", "bribe", "brick", "bride", "brief", "brine", "bring", "brink", "briny", "brisk", "broad", "broil", "broke", "brood", "brook", "broom", "broth", "brown", "brunt", "brush", "brute", "buddy", "budge", "buggy", "bugle", "build", "built", "bulge", "bulky", "bully", "bunch", "bunny", "burly", "burnt", "burst", "bused", "bushy", "butch", "butte", "buxom", "buyer", "bylaw", "cabal", "cabby", "cabin", "cable", "cacao", "cache", "cacti", "caddy", "cadet", "cagey", "cairn", "camel", "cameo", "canal", "candy", "canny", "canoe", "canon", "caper", "caput", "carat", "cargo", "carol", "carry", "carve", "caste", "catch", "cater", "catty", "caulk", "cause", "cavil", "cease", "cedar", "cello", "chafe", "chaff", "chain", "chair", "chalk", "champ", "chant", "chaos", "chard", "charm", "chart", "chase", "chasm", "cheap", "cheat", "check", "cheek", "cheer", "chess", "chest", "chick", "chide", "chief", "child", "chili", "chill", "chime", "china", "chirp", "chock", "choir", "choke", "chord", "chore", "chose", "chuck", "chump", "chunk", "churn", "chute", "cider", "cigar", "cinch", "circa", "civic", "civil", "clack", "claim", "clamp", "clang", "clank", "clash", "clasp", "class", "clean", "clear", "cleat", "cleft", "clerk", "click", "cliff", "climb", "cling", "clink", "cloak", "clock", "clone", "close", "cloth", "cloud", "clout", "clove", "clown", "cluck", "clued", "clump", "clung", "coach", "coast", "cobra", "cocoa", "colon", "color", "comet", "comfy", "comic", "comma", "conch", "condo", "conic", "copse", "coral", "corer", "corny", "couch", "cough", "could", "count", "coupe", "court", "coven", "cover", "covet", "covey", "cower", "coyly", "crack", "craft", "cramp", "crane", "crank", "crash", "crass", "crate", "crave", "crawl", "craze", "crazy", "creak", "cream", "credo", "creed", "creek", "creep", "creme", "crepe", "crept", "cress", "crest", "crick", "cried", "crier", "crime", "crimp", "crisp", "croak", "crock", "crone", "crony", "crook", "cross", "croup", "crowd", "crown", "crude", "cruel", "crumb", "crump", "crush", "crust", "crypt", "cubic", "cumin", "curio", "curly", "curry", "curse", "curve", "curvy", "cutie", "cyber", "cycle", "cynic", "daddy", "daily", "dairy", "daisy", "dally", "dance", "dandy", "datum", "daunt", "dealt", "death", "debar", "debit", "debug", "debut", "decal", "decay", "decor", "decoy", "decry", "defer", "deign", "deity", "delay", "delta", "delve", "demon", "demur", "denim", "dense", "depot", "depth", "derby", "deter", "detox", "deuce", "devil", "diary", "dicey", "digit", "dilly", "dimly", "diner", "dingo", "dingy", "diode", "dirge", "dirty", "disco", "ditch", "ditto", "ditty", "diver", "dizzy", "dodge", "dodgy", "dogma", "doing", "dolly", "donor", "donut", "dopey", "doubt", "dough", "dowdy", "dowel", "downy", "dowry", "dozen", "draft", "drain", "drake", "drama", "drank", "drape", "drawl", "drawn", "dread", "dream", "dress", "dried", "drier", "drift", "drill", "drink", "drive", "droit", "droll", "drone", "drool", "droop", "dross", "drove", "drown", "druid", "drunk", "dryer", "dryly", "duchy", "dully", "dummy", "dumpy", "dunce", "dusky", "dusty", "dutch", "duvet", "dwarf", "dwell", "dwelt", "dying", "eager", "eagle", "early", "earth", "easel", "eaten", "eater", "ebony", "eclat", "edict", "edify", "eerie", "egret", "eight", "eject", "eking", "elate", "elbow", "elder", "elect", "elegy", "elfin", "elide", "elite", "elope", "elude", "email", "embed", "ember", "emcee", "empty", "enact", "endow", "enema", "enemy", "enjoy", "ennui", "ensue", "enter", "entry", "envoy", "epoch", "epoxy", "equal", "equip", "erase", "erect", "erode", "error", "erupt", "essay", "ester", "ether", "ethic", "ethos", "etude", "evade", "event", "every", "evict", "evoke", "exact", "exalt", "excel", "exert", "exile", "exist", "expel", "extol", "extra", "exult", "eying", "fable", "facet", "faint", "fairy", "faith", "false", "fancy", "fanny", "farce", "fatal", "fatty", "fault", "fauna", "favor", "feast", "fecal", "feign", "fella", "felon", "femme", "femur", "fence", "feral", "ferry", "fetal", "fetch", "fetid", "fetus", "fever", "fewer", "fiber", "fibre", "ficus", "field", "fiend", "fiery", "fifth", "fifty", "fight", "filer", "filet", "filly", "filmy", "filth", "final", "finch", "finer", "first", "fishy", "fixer", "fizzy", "fjord", "flack", "flail", "flair", "flake", "flaky", "flame", "flank", "flare", "flash", "flask", "fleck", "fleet", "flesh", "flick", "flier", "fling", "flint", "flirt", "float", "flock", "flood", "floor", "flora", "floss", "flour", "flout", "flown", "fluff", "fluid", "fluke", "flume", "flung", "flunk", "flush", "flute", "flyer", "foamy", "focal", "focus", "foggy", "foist", "folio", "folly", "foray", "force", "forge", "forgo", "forte", "forth", "forty", "forum", "found", "foyer", "frail", "frame", "frank", "fraud", "freak", "freed", "freer", "fresh", "friar", "fried", "frill", "frisk", "fritz", "frock", "frond", "front", "frost", "froth", "frown", "froze", "fruit", "fudge", "fugue", "fully", "fungi", "funky", "funny", "furor", "furry", "fussy", "fuzzy", "gaffe", "gaily", "gamer", "gamma", "gamut", "gassy", "gaudy", "gauge", "gaunt", "gauze", "gavel", "gawky", "gayer", "gayly", "gazer", "gecko", "geeky", "geese", "genie", "genre", "ghost", "ghoul", "giant", "giddy", "gipsy", "girly", "girth", "given", "giver", "glade", "gland", "glare", "glass", "glaze", "gleam", "glean", "glide", "glint", "gloat", "globe", "gloom", "glory", "gloss", "glove", "glyph", "gnash", "gnome", "godly", "going", "golem", "golly", "gonad", "goner", "goody", "gooey", "goofy", "goose", "gorge", "gouge", "gourd", "grace", "grade", "graft", "grail", "grain", "grand", "grant", "grape", "graph", "grasp", "grass", "grate", "grave", "gravy", "graze", "great", "greed", "green", "greet", "grief", "grill", "grime", "grimy", "grind", "gripe", "groan", "groin", "groom", "grope", "gross", "group", "grout", "grove", "growl", "grown", "gruel", "gruff", "grunt", "guard", "guava", "guess", "guest", "guide", "guild", "guile", "guilt", "guise", "gulch", "gully", "gumbo", "gummy", "guppy", "gusto", "gusty", "gypsy", "habit", "hairy", "halve", "handy", "happy", "hardy", "harem", "harpy", "harry", "harsh", "haste", "hasty", "hatch", "hater", "haunt", "haute", "haven", "havoc", "hazel", "heady", "heard", "heart", "heath", "heave", "heavy", "hedge", "hefty", "heist", "helix", "hello", "hence", "heron", "hilly", "hinge", "hippo", "hippy", "hitch", "hoard", "hobby", "hoist", "holly", "homer", "honey", "honor", "horde", "horny", "horse", "hotel", "hotly", "hound", "house", "hovel", "hover", "howdy", "human", "humid", "humor", "humph", "humus", "hunch", "hunky", "hurry", "husky", "hussy", "hutch", "hydro", "hyena", "hymen", "hyper", "icily", "icing", "ideal", "idiom", "idiot", "idler", "idyll", "igloo", "iliac", "image", "imbue", "impel", "imply", "inane", "inbox", "incur", "index", "inept", "inert", "infer", "ingot", "inlay", "inlet", "inner", "input", "inter", "intro", "ionic", "irate", "irony", "islet", "issue", "itchy", "ivory", "jaunt", "jazzy", "jelly", "jerky", "jetty", "jewel", "jiffy", "joint", "joist", "joker", "jolly", "joust", "judge", "juice", "juicy", "jumbo", "jumpy", "junta", "junto", "juror", "kappa", "karma", "kayak", "kebab", "khaki", "kinky", "kiosk", "kitty", "knack", "knave", "knead", "kneed", "kneel", "knelt", "knife", "knock", "knoll", "known", "koala", "krill", "label", "labor", "laden", "ladle", "lager", "lance", "lanky", "lapel", "lapse", "large", "larva", "lasso", "latch", "later", "lathe", "latte", "laugh", "layer", "leach", "leafy", "leaky", "leant", "leapt", "learn", "lease", "leash", "least", "leave", "ledge", "leech", "leery", "lefty", "legal", "leggy", "lemon", "lemur", "leper", "level", "lever", "libel", "liege", "light", "liken", "lilac", "limbo", "limit", "linen", "liner", "lingo", "lipid", "lithe", "liver", "livid", "llama", "loamy", "loath", "lobby", "local", "locus", "lodge", "lofty", "logic", "login", "loopy", "loose", "lorry", "loser", "louse", "lousy", "lover", "lower", "lowly", "loyal", "lucid", "lucky", "lumen", "lumpy", "lunar", "lunch", "lunge", "lupus", "lurch", "lurid", "lusty", "lying", "lymph", "lynch", "lyric", "macaw", "macho", "macro", "madam", "madly", "mafia", "magic", "magma", "maize", "major", "maker", "mambo", "mamma", "mammy", "manga", "mange", "mango", "mangy", "mania", "manic", "manly", "manor", "maple", "march", "marry", "marsh", "mason", "masse", "match", "matey", "mauve", "maxim", "maybe", "mayor", "mealy", "meant", "meaty", "mecca", "medal", "media", "medic", "melee", "melon", "mercy", "merge", "merit", "merry", "metal", "meter", "metro", "micro", "midge", "midst", "might", "milky", "mimic", "mince", "miner", "minim", "minor", "minty", "minus", "mirth", "miser", "missy", "mocha", "modal", "model", "modem", "mogul", "moist", "molar", "moldy", "money", "month", "moody", "moose", "moral", "moron", "morph", "mossy", "motel", "motif", "motor", "motto", "moult", "mound", "mount", "mourn", "mouse", "mouth", "mover", "movie", "mower", "mucky", "mucus", "muddy", "mulch", "mummy", "munch", "mural", "murky", "mushy", "music", "musky", "musty", "myrrh", "nadir", "naive", "nanny", "nasal", "nasty", "natal", "naval", "navel", "needy", "neigh", "nerdy", "nerve", "never", "newer", "newly", "nicer", "niche", "niece", "night", "ninja", "ninny", "ninth", "noble", "nobly", "noise", "noisy", "nomad", "noose", "north", "nosey", "notch", "novel", "nudge", "nurse", "nutty", "nylon", "nymph", "oaken", "obese", "occur", "ocean", "octal", "octet", "odder", "oddly", "offal", "offer", "often", "olden", "older", "olive", "ombre", "omega", "onion", "onset", "opera", "opine", "opium", "optic", "orbit", "order", "organ", "other", "otter", "ought", "ounce", "outdo", "outer", "outgo", "ovary", "ovate", "overt", "ovine", "ovoid", "owing", "owner", "oxide", "ozone", "paddy", "pagan", "paint", "paler", "palsy", "panel", "panic", "pansy", "papal", "paper", "parer", "parka", "parry", "parse", "party", "pasta", "paste", "pasty", "patch", "patio", "patsy", "patty", "pause", "payee", "payer", "peace", "peach", "pearl", "pecan", "pedal", "penal", "pence", "penne", "penny", "perch", "peril", "perky", "pesky", "pesto", "petal", "petty", "phase", "phone", "phony", "photo", "piano", "picky", "piece", "piety", "piggy", "pilot", "pinch", "piney", "pinky", "pinto", "piper", "pique", "pitch", "pithy", "pivot", "pixel", "pixie", "pizza", "place", "plaid", "plain", "plait", "plane", "plank", "plant", "plate", "plaza", "plead", "pleat", "plied", "plier", "pluck", "plumb", "plume", "plump", "plunk", "plush", "poesy", "point", "poise", "poker", "polar", "polka", "polyp", "pooch", "poppy", "porch", "poser", "posit", "posse", "pouch", "pound", "pouty", "power", "prank", "prawn", "preen", "press", "price", "prick", "pride", "pried", "prime", "primo", "print", "prior", "prism", "privy", "prize", "probe", "prone", "prong", "proof", "prose", "proud", "prove", "prowl", "proxy", "prude", "prune", "psalm", "pubic", "pudgy", "puffy", "pulpy", "pulse", "punch", "pupal", "pupil", "puppy", "puree", "purer", "purge", "purse", "pushy", "putty", "pygmy", "quack", "quail", "quake", "qualm", "quark", "quart", "quash", "quasi", "queen", "queer", "quell", "query", "quest", "queue", "quick", "quiet", "quill", "quilt", "quirk", "quite", "quota", "quote", "quoth", "rabbi", "rabid", "racer", "radar", "radii", "radio", "rainy", "raise", "rajah", "rally", "ralph", "ramen", "ranch", "randy", "range", "rapid", "rarer", "raspy", "ratio", "ratty", "raven", "rayon", "razor", "reach", "react", "ready", "realm", "rearm", "rebar", "rebel", "rebus", "rebut", "recap", "recur", "recut", "reedy", "refer", "refit", "regal", "rehab", "reign", "relax", "relay", "relic", "remit", "renal", "renew", "repay", "repel", "reply", "rerun", "reset", "resin", "retch", "retro", "retry", "reuse", "revel", "revue", "rhino", "rhyme", "rider", "ridge", "rifle", "right", "rigid", "rigor", "rinse", "ripen", "riper", "risen", "riser", "risky", "rival", "river", "rivet", "roach", "roast", "robin", "robot", "rocky", "rodeo", "roger", "rogue", "roomy", "roost", "rotor", "rouge", "rough", "round", "rouse", "route", "rover", "rowdy", "rower", "royal", "ruddy", "ruder", "rugby", "ruler", "rumba", "rumor", "rupee", "rural", "rusty", "sadly", "safer", "saint", "salad", "sally", "salon", "salsa", "salty", "salve", "salvo", "sandy", "saner", "sappy", "sassy", "satin", "satyr", "sauce", "saucy", "sauna", "saute", "savor", "savoy", "savvy", "scald", "scale", "scalp", "scaly", "scamp", "scant", "scare", "scarf", "scary", "scene", "scent", "scion", "scoff", "scold", "scone", "scoop", "scope", "score", "scorn", "scour", "scout", "scowl", "scram", "scrap", "scree", "screw", "scrub", "scrum", "scuba", "sedan", "seedy", "segue", "seize", "semen", "sense", "sepia", "serif", "serum", "serve", "setup", "seven", "sever", "sewer", "shack", "shade", "shady", "shaft", "shake", "shaky", "shale", "shall", "shalt", "shame", "shank", "shape", "shard", "share", "shark", "sharp", "shave", "shawl", "shear", "sheen", "sheep", "sheer", "sheet", "sheik", "shelf", "shell", "shied", "shift", "shine", "shiny", "shire", "shirk", "shirt", "shoal", "shock", "shone", "shook", "shoot", "shore", "shorn", "short", "shout", "shove", "shown", "showy", "shrew", "shrub", "shrug", "shuck", "shunt", "shush", "shyly", "siege", "sieve", "sight", "sigma", "silky", "silly", "since", "sinew", "singe", "siren", "sissy", "sixth", "sixty", "skate", "skier", "skiff", "skill", "skimp", "skirt", "skulk", "skull", "skunk", "slack", "slain", "slang", "slant", "slash", "slate", "slave", "sleek", "sleep", "sleet", "slept", "slice", "slick", "slide", "slime", "slimy", "sling", "slink", "sloop", "slope", "slosh", "sloth", "slump", "slung", "slunk", "slurp", "slush", "slyly", "smack", "small", "smart", "smash", "smear", "smell", "smelt", "smile", "smirk", "smite", "smith", "smock", "smoke", "smoky", "smote", "snack", "snail", "snake", "snaky", "snare", "snarl", "sneak", "sneer", "snide", "sniff", "snipe", "snoop", "snore", "snort", "snout", "snowy", "snuck", "snuff", "soapy", "sober", "soggy", "solar", "solid", "solve", "sonar", "sonic", "sooth", "sooty", "sorry", "sound", "south", "sower", "space", "spade", "spank", "spare", "spark", "spasm", "spawn", "speak", "spear", "speck", "speed", "spell", "spelt", "spend", "spent", "sperm", "spice", "spicy", "spied", "spiel", "spike", "spiky", "spill", "spilt", "spine", "spiny", "spire", "spite", "splat", "split", "spoil", "spoke", "spoof", "spook", "spool", "spoon", "spore", "sport", "spout", "spray", "spree", "sprig", "spunk", "spurn", "spurt", "squad", "squat", "squib", "stack", "staff", "stage", "staid", "stain", "stair", "stake", "stale", "stalk", "stall", "stamp", "stand", "stank", "stare", "stark", "start", "stash", "state", "stave", "stead", "steak", "steal", "steam", "steed", "steel", "steep", "steer", "stein", "stern", "stick", "stiff", "still", "stilt", "sting", "stink", "stint", "stock", "stoic", "stoke", "stole", "stomp", "stone", "stony", "stood", "stool", "stoop", "store", "stork", "storm", "story", "stout", "stove", "strap", "straw", "stray", "strip", "strut", "stuck", "study", "stuff", "stump", "stung", "stunk", "stunt", "style", "suave", "sugar", "suing", "suite", "sulky", "sully", "sumac", "sunny", "super", "surer", "surge", "surly", "sushi", "swami", "swamp", "swarm", "swash", "swath", "swear", "sweat", "sweep", "sweet", "swell", "swept", "swift", "swill", "swine", "swing", "swirl", "swish", "swoon", "swoop", "sword", "swore", "sworn", "swung", "synod", "syrup", "tabby", "table", "taboo", "tacit", "tacky", "taffy", "taint", "taken", "taker", "tally", "talon", "tamer", "tango", "tangy", "taper", "tapir", "tardy", "tarot", "taste", "tasty", "tatty", "taunt", "tawny", "teach", "teary", "tease", "teddy", "teeth", "tempo", "tenet", "tenor", "tense", "tenth", "tepee", "tepid", "terra", "terse", "testy", "thank", "theft", "their", "theme", "there", "these", "theta", "thick", "thief", "thigh", "thing", "think", "third", "thong", "thorn", "those", "three", "threw", "throb", "throw", "thrum", "thumb", "thump", "thyme", "tiara", "tibia", "tidal", "tiger", "tight", "tilde", "timer", "timid", "tipsy", "titan", "tithe", "title", "toast", "today", "toddy", "token", "tonal", "tonga", "tonic", "tooth", "topaz", "topic", "torch", "torso", "torus", "total", "totem", "touch", "tough", "towel", "tower", "toxic", "toxin", "trace", "track", "tract", "trade", "trail", "train", "trait", "tramp", "trash", "trawl", "tread", "treat", "trend", "triad", "trial", "tribe", "trice", "trick", "tried", "tripe", "trite", "troll", "troop", "trope", "trout", "trove", "truce", "truck", "truer", "truly", "trump", "trunk", "truss", "trust", "truth", "tryst", "tubal", "tuber", "tulip", "tulle", "tumor", "tunic", "turbo", "tutor", "twang", "tweak", "tweed", "tweet", "twice", "twine", "twirl", "twist", "twixt", "tying", "udder", "ulcer", "ultra", "umbra", "uncle", "uncut", "under", "undid", "undue", "unfed", "unfit", "unify", "union", "unite", "unity", "unlit", "unmet", "unset", "untie", "until", "unwed", "unzip", "upper", "upset", "urban", "urine", "usage", "usher", "using", "usual", "usurp", "utile", "utter", "vague", "valet", "valid", "valor", "value", "valve", "vapid", "vapor", "vault", "vaunt", "vegan", "venom", "venue", "verge", "verse", "verso", "verve", "vicar", "video", "vigil", "vigor", "villa", "vinyl", "viola", "viper", "viral", "virus", "visit", "visor", "vista", "vital", "vivid", "vixen", "vocal", "vodka", "vogue", "voice", "voila", "vomit", "voter", "vouch", "vowel", "vying", "wacky", "wafer", "wager", "wagon", "waist", "waive", "waltz", "warty", "waste", "watch", "water", "waver", "waxen", "weary", "weave", "wedge", "weedy", "weigh", "weird", "welch", "welsh", "wench", "whack", "whale", "wharf", "wheat", "wheel", "whelp", "where", "which", "whiff", "while", "whine", "whiny", "whirl", "whisk", "white", "whole", "whoop", "whose", "widen", "wider", "widow", "width", "wield", "wight", "willy", "wimpy", "wince", "winch", "windy", "wiser", "wispy", "witch", "witty", "woken", "woman", "women", "woody", "wooer", "wooly", "woozy", "wordy", "world", "worry", "worse", "worst", "worth", "would", "wound", "woven", "wrack", "wrath", "wreak", "wreck", "wrest", "wring", "wrist", "write", "wrong", "wrote", "wrung", "wryly", "yacht", "yearn", "yeast", "yield", "young", "youth", "zebra", "zesty", "zonal"];

    /* src\App.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (134:4) {:else}
    function create_else_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "box svelte-g3b5so");
    			set_style(div, "--color", /*_row*/ ctx[18][/*column*/ ctx[23]]);
    			add_location(div, file, 134, 5, 4538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*game*/ 1) {
    				set_style(div, "--color", /*_row*/ ctx[18][/*column*/ ctx[23]]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(134:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (124:4) {#if game.guesses[row]}
    function create_if_block_4(ctx) {
    	let previous_key = /*game*/ ctx[0].guesses[/*row*/ ctx[20]].charAt(/*column*/ ctx[23]).toUpperCase();
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

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
    			if (dirty & /*game*/ 1 && safe_not_equal(previous_key, previous_key = /*game*/ ctx[0].guesses[/*row*/ ctx[20]].charAt(/*column*/ ctx[23]).toUpperCase())) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
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
    		source: "(124:4) {#if game.guesses[row]}",
    		ctx
    	});

    	return block;
    }

    // (125:5) {#key game.guesses[row].charAt(column).toUpperCase()}
    function create_key_block(ctx) {
    	let div;
    	let t0_value = /*game*/ ctx[0].guesses[/*row*/ ctx[20]][/*column*/ ctx[23]].toUpperCase() + "";
    	let t0;
    	let t1;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "box svelte-g3b5so");
    			set_style(div, "--color", /*_row*/ ctx[18][/*column*/ ctx[23]]);
    			add_location(div, file, 125, 6, 4343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*game*/ 1) && t0_value !== (t0_value = /*game*/ ctx[0].guesses[/*row*/ ctx[20]][/*column*/ ctx[23]].toUpperCase() + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*game*/ 1) {
    				set_style(div, "--color", /*_row*/ ctx[18][/*column*/ ctx[23]]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, scale, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, scale, {}, false);
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
    		id: create_key_block.name,
    		type: "key",
    		source: "(125:5) {#key game.guesses[row].charAt(column).toUpperCase()}",
    		ctx
    	});

    	return block;
    }

    // (123:3) {#each _row as _, column}
    function create_each_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_4, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*game*/ ctx[0].guesses[/*row*/ ctx[20]]) return 0;
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
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(123:3) {#each _row as _, column}",
    		ctx
    	});

    	return block;
    }

    // (122:2) {#each game.coloredBoxes as _row, row}
    function create_each_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*_row*/ ctx[18];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
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
    			if (dirty & /*game*/ 1) {
    				each_value_1 = /*_row*/ ctx[18];
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(122:2) {#each game.coloredBoxes as _row, row}",
    		ctx
    	});

    	return block;
    }

    // (152:2) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Enter");
    			button.disabled = true;
    			attr_dev(button, "data-tooltip", /*inputValid*/ ctx[5]);
    			add_location(button, file, 152, 3, 4923);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*inputValid*/ 32) {
    				attr_dev(button, "data-tooltip", /*inputValid*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(152:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (150:2) {#if inputValid === true}
    function create_if_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Enter";
    			add_location(button, file, 150, 3, 4861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*processInput*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(150:2) {#if inputValid === true}",
    		ctx
    	});

    	return block;
    }

    // (158:1) {#if won && !closedWonPopup}
    function create_if_block_2(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				message: "🎉 You won " + (/*game*/ ctx[0].guesses.length === 1
    				? 'first try! (hacker)'
    				: `in ${/*game*/ ctx[0].guesses.length} tries!`),
    				onClose: /*closeWonPopup*/ ctx[11]
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

    			if (dirty & /*game*/ 1) popup_changes.message = "🎉 You won " + (/*game*/ ctx[0].guesses.length === 1
    			? 'first try! (hacker)'
    			: `in ${/*game*/ ctx[0].guesses.length} tries!`);

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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(158:1) {#if won && !closedWonPopup}",
    		ctx
    	});

    	return block;
    }

    // (167:1) {#if lose && !closedLosePopup}
    function create_if_block_1(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				message: "🎈 You lost, the word was " + /*game*/ ctx[0].word + "!",
    				onClose: /*closeLosePopup*/ ctx[12]
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
    			if (dirty & /*game*/ 1) popup_changes.message = "🎈 You lost, the word was " + /*game*/ ctx[0].word + "!";
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
    		source: "(167:1) {#if lose && !closedLosePopup}",
    		ctx
    	});

    	return block;
    }

    // (178:1) {#if settingsOpen}
    function create_if_block(ctx) {
    	let settings;
    	let current;
    	settings = new Settings({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(settings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings, target, anchor);
    			current = true;
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(178:1) {#if settingsOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let div1;
    	let input_1;
    	let input_1_maxlength_value;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let sidebar;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*game*/ ctx[0].coloredBoxes;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function select_block_type_1(ctx, dirty) {
    		if (/*inputValid*/ ctx[5] === true) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*won*/ ctx[2] && !/*closedWonPopup*/ ctx[6] && create_if_block_2(ctx);
    	let if_block2 = /*lose*/ ctx[3] && !/*closedLosePopup*/ ctx[7] && create_if_block_1(ctx);

    	sidebar = new Sidebar({
    			props: {
    				game: /*game*/ ctx[0],
    				openSettings: /*func*/ ctx[16]
    			},
    			$$inline: true
    		});

    	let if_block3 = /*settingsOpen*/ ctx[8] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			input_1 = element("input");
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			create_component(sidebar.$$.fragment);
    			t5 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div0, "class", "game svelte-g3b5so");
    			set_style(div0, "--max-guesses", /*game*/ ctx[0].maxGuesses);
    			set_style(div0, "--word-length", /*game*/ ctx[0].wordLength);
    			add_location(div0, file, 117, 1, 4072);
    			attr_dev(input_1, "class", "inputChildren svelte-g3b5so");
    			attr_dev(input_1, "maxlength", input_1_maxlength_value = /*game*/ ctx[0].wordLength);
    			add_location(input_1, file, 142, 2, 4677);
    			attr_dev(div1, "class", "input svelte-g3b5so");
    			add_location(div1, file, 141, 1, 4654);
    			add_location(main, file, 115, 0, 4047);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(main, t0);
    			append_dev(main, div1);
    			append_dev(div1, input_1);
    			set_input_value(input_1, /*_input*/ ctx[1]);
    			/*input_1_binding*/ ctx[15](input_1);
    			append_dev(div1, t1);
    			if_block0.m(div1, null);
    			append_dev(main, t2);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t3);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t4);
    			mount_component(sidebar, main, null);
    			append_dev(main, t5);
    			if (if_block3) if_block3.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[14]),
    					listen_dev(input_1, "keypress", /*onKeyPress*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*game*/ 1) {
    				each_value = /*game*/ ctx[0].coloredBoxes;
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
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*game*/ 1) {
    				set_style(div0, "--max-guesses", /*game*/ ctx[0].maxGuesses);
    			}

    			if (!current || dirty & /*game*/ 1) {
    				set_style(div0, "--word-length", /*game*/ ctx[0].wordLength);
    			}

    			if (!current || dirty & /*game*/ 1 && input_1_maxlength_value !== (input_1_maxlength_value = /*game*/ ctx[0].wordLength)) {
    				attr_dev(input_1, "maxlength", input_1_maxlength_value);
    			}

    			if (dirty & /*_input*/ 2 && input_1.value !== /*_input*/ ctx[1]) {
    				set_input_value(input_1, /*_input*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div1, null);
    				}
    			}

    			if (/*won*/ ctx[2] && !/*closedWonPopup*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*won, closedWonPopup*/ 68) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t3);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*lose*/ ctx[3] && !/*closedLosePopup*/ ctx[7]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*lose, closedLosePopup*/ 136) {
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

    			const sidebar_changes = {};
    			if (dirty & /*game*/ 1) sidebar_changes.game = /*game*/ ctx[0];
    			if (dirty & /*settingsOpen*/ 256) sidebar_changes.openSettings = /*func*/ ctx[16];
    			sidebar.$set(sidebar_changes);

    			if (/*settingsOpen*/ ctx[8]) {
    				if (if_block3) {
    					if (dirty & /*settingsOpen*/ 256) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, null);
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

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			/*input_1_binding*/ ctx[15](null);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_component(sidebar);
    			if (if_block3) if_block3.d();
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	class Game {
    		constructor(wordLength, maxGuesses) {
    			this.wordLength = wordLength;
    			this.maxGuesses = maxGuesses;
    			this.guesses = [];
    			this.boxes = [...Array(maxGuesses)].map(() => [...Array(wordLength)].map(() => "empty"));
    			this.word = answers[Math.floor(Math.random() * answers.length)];
    			this.started = Date.now();
    			this.endTimer = false;
    			console.log(this.word);
    		}

    		get coloredBoxes() {
    			return this.boxes.map(row => row.map(color => {
    				switch (color) {
    					case "correct":
    						return "#AFE1AF";
    					case "empty":
    						return "#D3D3D3";
    					case "semicorrect":
    						return "#FFC300";
    				}
    			}));
    		}

    		validateInput(input) {
    			if (!input) return "Enter something!";

    			if ((input === null || input === void 0
    			? void 0
    			: input.length) < this.wordLength) return "Input too short!";

    			if ((input === null || input === void 0
    			? void 0
    			: input.length) > this.wordLength) return "Input too long!";

    			if (this.guesses.includes(input)) return "Don't waste your guesses!";
    			if (!guesses.includes(input)) return `"${input}" is not a valid word!`;
    			return true;
    		}
    	}

    	function processInput() {
    		if (game.validateInput(input) !== true) return;

    		/* ---------------------------- Reset / add input --------------------------- */
    		$$invalidate(4, inputField.value = "", inputField);

    		$$invalidate(0, game.guesses = [...game.guesses, input], game);

    		/* -------------------------- Determine the colors -------------------------- */
    		for (let i = 0; i < input.length; i++) {
    			const letter = input[i];
    			const index = game.word.indexOf(letter);

    			if (index === -1) {
    				$$invalidate(0, game.boxes[game.guesses.length - 1][i] = "empty", game);
    				continue;
    			}

    			if (game.word[i] === letter) {
    				$$invalidate(0, game.boxes[game.guesses.length - 1][i] = "correct", game);
    				continue;
    			}

    			let found = false;

    			for (let i = 0; i < input.length; i++) {
    				if (game.word[i] === input[i] && input[i] === letter) {
    					found = true;
    					break;
    				}
    			}

    			if (found) {
    				$$invalidate(0, game.boxes[game.guesses.length - 1][i] = "empty", game);
    				continue;
    			}

    			$$invalidate(0, game.boxes[game.guesses.length - 1][i] = "semicorrect", game);
    		}

    		/* ------------------------------- Win / lose ------------------------------- */
    		if (input === game.word) {
    			$$invalidate(2, won = true);
    			$$invalidate(0, game.endTimer = true, game);
    		} else if (game.guesses.length >= game.maxGuesses) {
    			$$invalidate(3, lose = true);
    			$$invalidate(0, game.endTimer = true, game);
    		}
    	}

    	const game = new Game(5, 6);

    	/* --------------------------------- Inputs --------------------------------- */
    	let _input;

    	let input;
    	let inputField;
    	let inputValid = "Input too short!";

    	function onKeyPress(event) {
    		if (event.code === "Enter") processInput();
    	}

    	/* --------------------------------- Popups --------------------------------- */
    	let won = false;

    	let closedWonPopup = false;

    	function closeWonPopup() {
    		$$invalidate(6, closedWonPopup = true);
    	}

    	let lose = false;
    	let closedLosePopup = false;

    	function closeLosePopup() {
    		$$invalidate(7, closedLosePopup = true);
    	}

    	/* -------------------------------- Settings -------------------------------- */
    	let settingsOpen = false;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_1_input_handler() {
    		_input = this.value;
    		$$invalidate(1, _input);
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			inputField = $$value;
    			$$invalidate(4, inputField);
    		});
    	}

    	const func = () => $$invalidate(8, settingsOpen = true);

    	$$self.$capture_state = () => ({
    		scale,
    		Popup,
    		Settings,
    		Sidebar,
    		answers,
    		guesses,
    		Game,
    		processInput,
    		game,
    		_input,
    		input,
    		inputField,
    		inputValid,
    		onKeyPress,
    		won,
    		closedWonPopup,
    		closeWonPopup,
    		lose,
    		closedLosePopup,
    		closeLosePopup,
    		settingsOpen
    	});

    	$$self.$inject_state = $$props => {
    		if ('_input' in $$props) $$invalidate(1, _input = $$props._input);
    		if ('input' in $$props) $$invalidate(13, input = $$props.input);
    		if ('inputField' in $$props) $$invalidate(4, inputField = $$props.inputField);
    		if ('inputValid' in $$props) $$invalidate(5, inputValid = $$props.inputValid);
    		if ('won' in $$props) $$invalidate(2, won = $$props.won);
    		if ('closedWonPopup' in $$props) $$invalidate(6, closedWonPopup = $$props.closedWonPopup);
    		if ('lose' in $$props) $$invalidate(3, lose = $$props.lose);
    		if ('closedLosePopup' in $$props) $$invalidate(7, closedLosePopup = $$props.closedLosePopup);
    		if ('settingsOpen' in $$props) $$invalidate(8, settingsOpen = $$props.settingsOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*_input*/ 2) {
    			$$invalidate(13, input = _input === null || _input === void 0
    			? void 0
    			: _input.toLocaleLowerCase());
    		}

    		if ($$self.$$.dirty & /*won, lose, game, input*/ 8205) {
    			$$invalidate(5, inputValid = !won
    			? !lose ? game.validateInput(input) : "You lost!"
    			: "You won!");
    		}
    	};

    	return [
    		game,
    		_input,
    		won,
    		lose,
    		inputField,
    		inputValid,
    		closedWonPopup,
    		closedLosePopup,
    		settingsOpen,
    		processInput,
    		onKeyPress,
    		closeWonPopup,
    		closeLosePopup,
    		input,
    		input_1_input_handler,
    		input_1_binding,
    		func
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

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

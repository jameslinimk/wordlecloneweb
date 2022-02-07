
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

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (17:12) {:else}
    function create_else_block_1$1(ctx) {
    	let option;
    	let t0_value = /*i*/ ctx[7] + 3 + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" letter words\r\n                ");
    			option.__value = /*i*/ ctx[7] + 3;
    			option.value = option.__value;
    			add_location(option, file$3, 17, 16, 537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(17:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (13:12) {#if i + 3 === 5}
    function create_if_block_1$1(ctx) {
    	let option;
    	let t0_value = /*i*/ ctx[7] + 3 + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" letter words (deafult)\r\n                ");
    			option.selected = true;
    			option.__value = /*i*/ ctx[7] + 3;
    			option.value = option.__value;
    			add_location(option, file$3, 13, 16, 388);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(13:12) {#if i + 3 === 5}",
    		ctx
    	});

    	return block;
    }

    // (12:8) {#each Array(5) as _, i}
    function create_each_block_1$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[7] + 3 === 5) return create_if_block_1$1;
    		return create_else_block_1$1;
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
    		p: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(12:8) {#each Array(5) as _, i}",
    		ctx
    	});

    	return block;
    }

    // (30:12) {:else}
    function create_else_block$1(ctx) {
    	let option;
    	let t0_value = /*i*/ ctx[7] + 3 + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" tries ");
    			option.__value = /*i*/ ctx[7] + 3;
    			option.value = option.__value;
    			add_location(option, file$3, 30, 16, 937);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(30:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:12) {#if i + 3 === 6}
    function create_if_block$1(ctx) {
    	let option;
    	let t0_value = /*i*/ ctx[7] + 3 + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = text(" tries (deafult)\r\n                ");
    			option.selected = true;
    			option.__value = /*i*/ ctx[7] + 3;
    			option.value = option.__value;
    			add_location(option, file$3, 26, 16, 795);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(26:12) {#if i + 3 === 6}",
    		ctx
    	});

    	return block;
    }

    // (25:8) {#each Array(7) as _, i}
    function create_each_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*i*/ ctx[7] + 3 === 6) return create_if_block$1;
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
    		p: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(25:8) {#each Array(7) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let br;
    	let t0;
    	let select0;
    	let t1;
    	let select1;
    	let t2;
    	let button;
    	let strong;
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
    			br = element("br");
    			t0 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			strong = element("strong");
    			strong.textContent = "Apply settings (will reset)";
    			add_location(br, file$3, 9, 4, 261);
    			if (/*wordLength*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[3].call(select0));
    			add_location(select0, file$3, 10, 4, 273);
    			if (/*tries*/ ctx[1] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[4].call(select1));
    			add_location(select1, file$3, 23, 4, 685);
    			add_location(strong, file$3, 36, 9, 1085);
    			add_location(button, file$3, 35, 4, 1042);
    			attr_dev(div, "class", "settings svelte-1k2h89l");
    			add_location(div, file$3, 8, 0, 214);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, br);
    			append_dev(div, t0);
    			append_dev(div, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*wordLength*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*tries*/ ctx[1]);
    			append_dev(div, t2);
    			append_dev(div, button);
    			append_dev(button, strong);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[3]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[4]),
    					listen_dev(button, "click", /*applySettings*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*wordLength*/ 1) {
    				select_option(select0, /*wordLength*/ ctx[0]);
    			}

    			if (dirty & /*tries*/ 2) {
    				select_option(select1, /*tries*/ ctx[1]);
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
    	let wordLength;
    	let tries;

    	function applySettings() {
    		window.location.href = `./?wordLength=${wordLength}&maxGuesses=${tries}`;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function select0_change_handler() {
    		wordLength = select_value(this);
    		$$invalidate(0, wordLength);
    	}

    	function select1_change_handler() {
    		tries = select_value(this);
    		$$invalidate(1, tries);
    	}

    	$$self.$capture_state = () => ({ slide, wordLength, tries, applySettings });

    	$$self.$inject_state = $$props => {
    		if ('wordLength' in $$props) $$invalidate(0, wordLength = $$props.wordLength);
    		if ('tries' in $$props) $$invalidate(1, tries = $$props.tries);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		wordLength,
    		tries,
    		applySettings,
    		select0_change_handler,
    		select1_change_handler
    	];
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
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*label*/ ctx[0]);
    			add_location(button, file$2, 32, 0, 763);
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
    	let { label = "🌓" } = $$props;
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

    	const writable_props = ['label'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Darkmode> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Darkmode",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get label() {
    		throw new Error("<Darkmode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Darkmode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    	let br;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let t9;
    	let h3;
    	let t10;
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
    			br = element("br");
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "🔎➖";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "🔎➕";
    			t9 = space();
    			h3 = element("h3");
    			t10 = text(/*timeElapsed*/ ctx[3]);
    			add_location(button0, file$1, 17, 4, 414);
    			add_location(button1, file$1, 18, 4, 473);
    			add_location(br, file$1, 19, 4, 533);
    			add_location(button2, file$1, 20, 4, 545);
    			add_location(button3, file$1, 21, 4, 590);
    			attr_dev(h3, "class", "timer svelte-1uxou2x");
    			add_location(h3, file$1, 23, 4, 636);
    			attr_dev(div, "class", "sidebar svelte-1uxou2x");
    			add_location(div, file$1, 15, 0, 369);
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
    			append_dev(div, br);
    			append_dev(div, t5);
    			append_dev(div, button2);
    			append_dev(div, t7);
    			append_dev(div, button3);
    			append_dev(div, t9);
    			append_dev(div, h3);
    			append_dev(h3, t10);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[6], false, false, false),
    					listen_dev(
    						button2,
    						"click",
    						function () {
    							if (is_function(/*zoomOut*/ ctx[1])) /*zoomOut*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button3,
    						"click",
    						function () {
    							if (is_function(/*zoomIn*/ ctx[2])) /*zoomIn*/ ctx[2].apply(this, arguments);
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
    			if (!current || dirty & /*timeElapsed*/ 8) set_data_dev(t10, /*timeElapsed*/ ctx[3]);
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
    	let { toggleSettings } = $$props;
    	let { zoomOut } = $$props;
    	let { zoomIn } = $$props;
    	let timeElapsed = "00:00:00";

    	setInterval(
    		() => {
    			if (game.endTimer) return;
    			$$invalidate(3, timeElapsed = new Date(Date.now() - game.started).toISOString().substr(11, 8));
    		},
    		1000
    	);

    	const writable_props = ['game', 'toggleSettings', 'zoomOut', 'zoomIn'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toggleSettings();
    	const click_handler_1 = () => location.reload();

    	$$self.$$set = $$props => {
    		if ('game' in $$props) $$invalidate(4, game = $$props.game);
    		if ('toggleSettings' in $$props) $$invalidate(0, toggleSettings = $$props.toggleSettings);
    		if ('zoomOut' in $$props) $$invalidate(1, zoomOut = $$props.zoomOut);
    		if ('zoomIn' in $$props) $$invalidate(2, zoomIn = $$props.zoomIn);
    	};

    	$$self.$capture_state = () => ({
    		Darkmode,
    		game,
    		toggleSettings,
    		zoomOut,
    		zoomIn,
    		timeElapsed
    	});

    	$$self.$inject_state = $$props => {
    		if ('game' in $$props) $$invalidate(4, game = $$props.game);
    		if ('toggleSettings' in $$props) $$invalidate(0, toggleSettings = $$props.toggleSettings);
    		if ('zoomOut' in $$props) $$invalidate(1, zoomOut = $$props.zoomOut);
    		if ('zoomIn' in $$props) $$invalidate(2, zoomIn = $$props.zoomIn);
    		if ('timeElapsed' in $$props) $$invalidate(3, timeElapsed = $$props.timeElapsed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		toggleSettings,
    		zoomOut,
    		zoomIn,
    		timeElapsed,
    		game,
    		click_handler,
    		click_handler_1
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			game: 4,
    			toggleSettings: 0,
    			zoomOut: 1,
    			zoomIn: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*game*/ ctx[4] === undefined && !('game' in props)) {
    			console.warn("<Sidebar> was created without expected prop 'game'");
    		}

    		if (/*toggleSettings*/ ctx[0] === undefined && !('toggleSettings' in props)) {
    			console.warn("<Sidebar> was created without expected prop 'toggleSettings'");
    		}

    		if (/*zoomOut*/ ctx[1] === undefined && !('zoomOut' in props)) {
    			console.warn("<Sidebar> was created without expected prop 'zoomOut'");
    		}

    		if (/*zoomIn*/ ctx[2] === undefined && !('zoomIn' in props)) {
    			console.warn("<Sidebar> was created without expected prop 'zoomIn'");
    		}
    	}

    	get game() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set game(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleSettings() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleSettings(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoomOut() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoomOut(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoomIn() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoomIn(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	child_ctx[29] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	child_ctx[32] = i;
    	return child_ctx;
    }

    // (170:1) {#if game.wordLength !== 0}
    function create_if_block_3(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let input_1;
    	let input_1_maxlength_value;
    	let t1;
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
    		if (/*inputValid*/ ctx[5] === true) return create_if_block_4;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			input_1 = element("input");
    			t1 = space();
    			if_block.c();
    			attr_dev(div0, "class", "game svelte-1wj5s9n");
    			set_style(div0, "--max-guesses", /*game*/ ctx[0].maxGuesses);
    			set_style(div0, "--word-length", /*game*/ ctx[0].wordLength);
    			add_location(div0, file, 171, 2, 6080);
    			attr_dev(input_1, "class", "inputChildren svelte-1wj5s9n");
    			attr_dev(input_1, "maxlength", input_1_maxlength_value = /*game*/ ctx[0].wordLength);
    			add_location(input_1, file, 197, 3, 6733);
    			attr_dev(div1, "class", "input svelte-1wj5s9n");
    			add_location(div1, file, 196, 2, 6709);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div0_binding*/ ctx[17](div0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input_1);
    			set_input_value(input_1, /*_input*/ ctx[1]);
    			/*input_1_binding*/ ctx[19](input_1);
    			append_dev(div1, t1);
    			if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[18]),
    					listen_dev(input_1, "keypress", /*onKeyPress*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*game*/ 1) {
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

    			if (!current || dirty[0] & /*game*/ 1) {
    				set_style(div0, "--max-guesses", /*game*/ ctx[0].maxGuesses);
    			}

    			if (!current || dirty[0] & /*game*/ 1) {
    				set_style(div0, "--word-length", /*game*/ ctx[0].wordLength);
    			}

    			if (!current || dirty[0] & /*game*/ 1 && input_1_maxlength_value !== (input_1_maxlength_value = /*game*/ ctx[0].wordLength)) {
    				attr_dev(input_1, "maxlength", input_1_maxlength_value);
    			}

    			if (dirty[0] & /*_input*/ 2 && input_1.value !== /*_input*/ ctx[1]) {
    				set_input_value(input_1, /*_input*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
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
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			/*div0_binding*/ ctx[17](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			/*input_1_binding*/ ctx[19](null);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(170:1) {#if game.wordLength !== 0}",
    		ctx
    	});

    	return block;
    }

    // (189:5) {:else}
    function create_else_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "box svelte-1wj5s9n");
    			set_style(div, "--color", /*_row*/ ctx[27][/*column*/ ctx[32]]);
    			add_location(div, file, 189, 6, 6587);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*game*/ 1) {
    				set_style(div, "--color", /*_row*/ ctx[27][/*column*/ ctx[32]]);
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
    		source: "(189:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (179:5) {#if game.guesses[row]}
    function create_if_block_5(ctx) {
    	let previous_key = /*game*/ ctx[0].guesses[/*row*/ ctx[29]].charAt(/*column*/ ctx[32]).toUpperCase();
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
    			if (dirty[0] & /*game*/ 1 && safe_not_equal(previous_key, previous_key = /*game*/ ctx[0].guesses[/*row*/ ctx[29]].charAt(/*column*/ ctx[32]).toUpperCase())) {
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(179:5) {#if game.guesses[row]}",
    		ctx
    	});

    	return block;
    }

    // (180:6) {#key game.guesses[row].charAt(column).toUpperCase()}
    function create_key_block(ctx) {
    	let div;
    	let t0_value = /*game*/ ctx[0].guesses[/*row*/ ctx[29]][/*column*/ ctx[32]].toUpperCase() + "";
    	let t0;
    	let t1;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "box svelte-1wj5s9n");
    			set_style(div, "--color", /*_row*/ ctx[27][/*column*/ ctx[32]]);
    			add_location(div, file, 180, 7, 6383);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*game*/ 1) && t0_value !== (t0_value = /*game*/ ctx[0].guesses[/*row*/ ctx[29]][/*column*/ ctx[32]].toUpperCase() + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*game*/ 1) {
    				set_style(div, "--color", /*_row*/ ctx[27][/*column*/ ctx[32]]);
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
    		source: "(180:6) {#key game.guesses[row].charAt(column).toUpperCase()}",
    		ctx
    	});

    	return block;
    }

    // (178:4) {#each _row as _, column}
    function create_each_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_5, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*game*/ ctx[0].guesses[/*row*/ ctx[29]]) return 0;
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
    		source: "(178:4) {#each _row as _, column}",
    		ctx
    	});

    	return block;
    }

    // (177:3) {#each game.coloredBoxes as _row, row}
    function create_each_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*_row*/ ctx[27];
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
    			if (dirty[0] & /*game*/ 1) {
    				each_value_1 = /*_row*/ ctx[27];
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
    		source: "(177:3) {#each game.coloredBoxes as _row, row}",
    		ctx
    	});

    	return block;
    }

    // (207:3) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Enter");
    			button.disabled = true;
    			attr_dev(button, "data-tooltip", /*inputValid*/ ctx[5]);
    			add_location(button, file, 207, 4, 6989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*inputValid*/ 32) {
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
    		source: "(207:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (205:3) {#if inputValid === true}
    function create_if_block_4(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Enter";
    			add_location(button, file, 205, 4, 6925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*processInput*/ ctx[10], false, false, false);
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(205:3) {#if inputValid === true}",
    		ctx
    	});

    	return block;
    }

    // (214:1) {#if won && !closedWonPopup}
    function create_if_block_2(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				message: "🎉 You won " + (/*game*/ ctx[0].guesses.length === 1
    				? 'first try! (hacker)'
    				: `in ${/*game*/ ctx[0].guesses.length} tries!`),
    				onClose: /*closeWonPopup*/ ctx[12]
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

    			if (dirty[0] & /*game*/ 1) popup_changes.message = "🎉 You won " + (/*game*/ ctx[0].guesses.length === 1
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
    		source: "(214:1) {#if won && !closedWonPopup}",
    		ctx
    	});

    	return block;
    }

    // (223:1) {#if lose && !closedLosePopup}
    function create_if_block_1(ctx) {
    	let popup;
    	let current;

    	popup = new Popup({
    			props: {
    				message: "🎈 You lost, the word was " + /*game*/ ctx[0].word + "!",
    				onClose: /*closeLosePopup*/ ctx[13]
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
    			if (dirty[0] & /*game*/ 1) popup_changes.message = "🎈 You lost, the word was " + /*game*/ ctx[0].word + "!";
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
    		source: "(223:1) {#if lose && !closedLosePopup}",
    		ctx
    	});

    	return block;
    }

    // (240:1) {#if settingsOpen}
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
    		source: "(240:1) {#if settingsOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let sidebar;
    	let t3;
    	let current;
    	let if_block0 = /*game*/ ctx[0].wordLength !== 0 && create_if_block_3(ctx);
    	let if_block1 = /*won*/ ctx[2] && !/*closedWonPopup*/ ctx[6] && create_if_block_2(ctx);
    	let if_block2 = /*lose*/ ctx[3] && !/*closedLosePopup*/ ctx[7] && create_if_block_1(ctx);

    	sidebar = new Sidebar({
    			props: {
    				game: /*game*/ ctx[0],
    				toggleSettings: /*func*/ ctx[20],
    				zoomIn: /*zoomIn*/ ctx[14],
    				zoomOut: /*zoomOut*/ ctx[15]
    			},
    			$$inline: true
    		});

    	let if_block3 = /*settingsOpen*/ ctx[8] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			create_component(sidebar.$$.fragment);
    			t3 = space();
    			if (if_block3) if_block3.c();
    			add_location(main, file, 168, 0, 6023);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t1);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t2);
    			mount_component(sidebar, main, null);
    			append_dev(main, t3);
    			if (if_block3) if_block3.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*game*/ ctx[0].wordLength !== 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*game*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*won*/ ctx[2] && !/*closedWonPopup*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*won, closedWonPopup*/ 68) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t1);
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

    					if (dirty[0] & /*lose, closedLosePopup*/ 136) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			const sidebar_changes = {};
    			if (dirty[0] & /*game*/ 1) sidebar_changes.game = /*game*/ ctx[0];
    			if (dirty[0] & /*settingsOpen*/ 256) sidebar_changes.toggleSettings = /*func*/ ctx[20];
    			sidebar.$set(sidebar_changes);

    			if (/*settingsOpen*/ ctx[8]) {
    				if (if_block3) {
    					if (dirty[0] & /*settingsOpen*/ 256) {
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
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_component(sidebar);
    			if (if_block3) if_block3.d();
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
    		constructor(wordLength, maxGuesses, guessesList, answersList) {
    			this.wordLength = wordLength;
    			this.maxGuesses = maxGuesses;
    			this.guessesList = guessesList;
    			this.answersList = answersList;
    			this.guesses = [];
    			this.boxes = [...Array(maxGuesses)].map(() => [...Array(wordLength)].map(() => "empty"));
    			this.word = answersList[Math.floor(Math.random() * answersList.length)];
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
    			if (!this.guessesList.includes(input)) return `"${input}" is not a valid word!`;
    			return true;
    		}
    	}

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

    	async function start() {
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

    		return [_guesses, _answers];
    	}

    	let game = new Game(0, 0, [], []);
    	const guessesAnswers = start();

    	guessesAnswers.then(guessesAnswers => {
    		const guesses = guessesAnswers[0];
    		const answers = guessesAnswers[1];
    		$$invalidate(0, game = new Game(wordLength, maxGuesses, guesses, answers));
    		console.log("Done!", wordLength, maxGuesses);
    	});

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

    	/* -------------------------------- Game div -------------------------------- */
    	let gameDiv; /*: HTMLDivElement*/

    	function zoomIn() {
    		const style = getComputedStyle(gameDiv);
    		$$invalidate(9, gameDiv.style.zoom = parseFloat(style.zoom) + 0.1, gameDiv);
    	}

    	function zoomOut() {
    		const style = getComputedStyle(gameDiv);
    		$$invalidate(9, gameDiv.style.zoom = parseFloat(style.zoom) - 0.1, gameDiv);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			gameDiv = $$value;
    			$$invalidate(9, gameDiv);
    		});
    	}

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

    	const func = () => $$invalidate(8, settingsOpen = !settingsOpen);

    	$$self.$capture_state = () => ({
    		scale,
    		Popup,
    		Settings,
    		Sidebar,
    		Game,
    		wordLength,
    		maxGuesses,
    		searchParams,
    		start,
    		game,
    		guessesAnswers,
    		processInput,
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
    		settingsOpen,
    		gameDiv,
    		zoomIn,
    		zoomOut
    	});

    	$$self.$inject_state = $$props => {
    		if ('wordLength' in $$props) wordLength = $$props.wordLength;
    		if ('maxGuesses' in $$props) maxGuesses = $$props.maxGuesses;
    		if ('game' in $$props) $$invalidate(0, game = $$props.game);
    		if ('_input' in $$props) $$invalidate(1, _input = $$props._input);
    		if ('input' in $$props) $$invalidate(16, input = $$props.input);
    		if ('inputField' in $$props) $$invalidate(4, inputField = $$props.inputField);
    		if ('inputValid' in $$props) $$invalidate(5, inputValid = $$props.inputValid);
    		if ('won' in $$props) $$invalidate(2, won = $$props.won);
    		if ('closedWonPopup' in $$props) $$invalidate(6, closedWonPopup = $$props.closedWonPopup);
    		if ('lose' in $$props) $$invalidate(3, lose = $$props.lose);
    		if ('closedLosePopup' in $$props) $$invalidate(7, closedLosePopup = $$props.closedLosePopup);
    		if ('settingsOpen' in $$props) $$invalidate(8, settingsOpen = $$props.settingsOpen);
    		if ('gameDiv' in $$props) $$invalidate(9, gameDiv = $$props.gameDiv);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*_input*/ 2) {
    			$$invalidate(16, input = _input === null || _input === void 0
    			? void 0
    			: _input.toLocaleLowerCase());
    		}

    		if ($$self.$$.dirty[0] & /*won, lose, game, input*/ 65549) {
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
    		gameDiv,
    		processInput,
    		onKeyPress,
    		closeWonPopup,
    		closeLosePopup,
    		zoomIn,
    		zoomOut,
    		input,
    		div0_binding,
    		input_1_input_handler,
    		input_1_binding,
    		func
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

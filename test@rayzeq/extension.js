const { Clutter } = imports.gi;
const System = imports.system;

class Extension {
    constructor() {}

    enable() {
        this.main_container = new Clutter.Actor({
            layout_manager: new Clutter.BoxLayout({ orientation: Clutter.Orientation.VERTICAL }),
            x: 50,
            y: 100,
            width: 100,
            height: 500,
            background_color: Clutter.Color.from_string("grey")[1]
        });

        const expandable_container = new Clutter.Actor({
            background_color: Clutter.Color.from_string("red")[1],
            y_expand: true,
            width: 100
        });

        const broken_container = new Clutter.Actor({ layout_manager: new Clutter.BoxLayout() });

        //System.breakpoint();
        broken_container.add_child(
            // here, `CLUTTER_ACTOR_IS_VISIBLE(child) == false` (why ???)
            //       `expandable_container->priv->needs_compute_expand == true`,
            //       `expandable_container->priv->needs_x_expand == false`
            //       `expandable_container->priv->needs_y_expand == false`
            //
            //       `broken_container->priv->needs_compute_expand == false`
            //       `broken_container->priv->needs_x_expand == false`
            //       `broken_container->priv->needs_y_expand == false`
            //
            // checked using gdb (break clutter-actor.c:11256)
            // since the child is not visible, `clutter_actor_queue_compute_expand(self)` is NOT called.
            //
            // If I manually set `CLUTTER_ACTOR_IS_VISIBLE(child) = true` (with `set variable child->flags = CLUTTER_ACTOR_VISIBLE`)
            // then the expected behavior is observed (the full rectangle is red from the start)
            //
            expandable_container
        );
        //System.breakpoint();
        this.main_container.add_child(
            // here, `broken_container->priv->needs_compute_expand == false`
            broken_container
        );
        global.stage.add_child(this.main_container);

        // this returns `false`, so I suppose that `expand` hasn't been computed, otherwise
        // it should be `true`
        console.log(broken_container.needs_expand(Clutter.Orientation.VERTICAL));

        setTimeout(() => {
            broken_container.remove_child(expandable_container);

            console.log(expandable_container.needs_expand(Clutter.Orientation.VERTICAL)); // true
            console.log(broken_container.needs_expand(Clutter.Orientation.VERTICAL)); // false

            //System.breakpoint();
            broken_container.add_child(
                // this time, `CLUTTER_ACTOR_IS_VISIBLE(child) == true`
                //            `expandable_container->priv->needs_compute_expand == false`
                //            `expandable_container->priv->needs_x_expand == false`
                //            `expandable_container->priv->needs_y_expand == true`
                //
                //            `broken_container->priv->needs_compute_expand == false`
                //            `broken_container->priv->needs_x_expand == false`
                //            `broken_container->priv->needs_y_expand == false`
                //
                // checked using gdb (break clutter-actor.c:11256)
                // since the child is visible and `expandable_container->priv->needs_y_expand == true`,
                // `clutter_actor_queue_compute_expand(self)` is called.
                expandable_container
            );

            console.log(expandable_container.needs_expand(Clutter.Orientation.VERTICAL)); // true
            console.log(broken_container.needs_expand(Clutter.Orientation.VERTICAL)); // true
            console.log("DONE");
        }, 10000);
    }

    disable() {
        this.main_container.destroy();
    }
}

function init() {
    return new Extension();
}
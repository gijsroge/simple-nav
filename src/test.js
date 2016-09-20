$.fn.faq = function(options) {

    return this.each(function(i, el) {

        var base = el,
            $base = $(el);

        console.log(options);

        base.init = function() {
            // Do initialization stuff
            $base
                .find("dd")
                .hide()
                .end()
                .find("dt")
                .click(function() {

                    var ans = $(this).next();

                    if (ans.is(":visible")) {
                        base.closeQ(ans);
                    } else {
                        base.openQ(ans);
                    }

                })
        };

        base.openQ = function(ans) {
            // Open panel
            ans.show();

            // Do callback
            ans.trigger("ansOpen");
        };

        base.closeQ = function(ans) {
            // Open panel
            ans.hide();

            // Do callback
            ans.trigger("ansClose");
        };

        base.init();

    });

};

$("dl").faq();

$("dd").on("ansOpen", function() {
    alert("answer opened!");
});

$("dd").on("ansClose", function() {
    alert("answer closed!");
});
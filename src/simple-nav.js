(function ($) {
    $.fn.simplenav = function (options) {

        var instance = 0;
        var simplenav = this;
        var globalData = [];

        var settings = $.extend({
            toggle: 'js-simplenav-toggle',
            toggleWrapper: 'js-simplenav-wrapper',
            dropdown: 'js-simplenav-dropdown',
            parent: '.c-header',
            activeclass: 'is-open',
            throttle: 250,
            collapse: 0,
            more: $(this).data('simplenav-more') ? $(this).data('simplenav-more') : 'more',
            menu: $(this).data('simplenav-menu') ? $(this).data('simplenav-menu') : 'menu'
        }, options);


        var app = {
            /**
             * Prepare dropdown html
             *
             * @param $this
             * @param instance
             */
            prepareHtml: function ($this, instance) {
                var setting = globalData[instance].settings;
                $this.attr('data-simplenav-instance', instance);
                if ($this.find(settings.toggle).length) return;
                $this.append('' +
                    '<li class="' + settings.toggleWrapper + '" style="display:none;">' +
                    '<button id="menu-button-' + instance + '" aria-label="Menu" aria-expanded="false" aria-controls="menu-' + instance + '" type="button" class="' + settings.toggle + '"><span class="js-simplenav-label">' + settings.more + '</span></button>' +
                    '<ul id="menu-' + instance + '" aria-hidden="true" aria-labelledby="menu-button-' + instance + '" style="position: absolute;" class="' + settings.dropdown + '"></ul>' +
                    '</li>' +
                    '');
            },


            /**
             * Update variables
             */
            checkVars: function (data) {
                data.viewportWidth = $(window).width();
                data.menuHeight = data.element.height();
                data.itemHeight = this.maxHeight(data.element.children('li'));
                data.lowestViewport = this.getLowestViewportBreak(data.breaks);
            },

            /**
             * Retrieve lowest item
             *
             * @param array
             * @returns {number}
             */
            getLowestViewportBreak: function (array) {
                return Math.min.apply(Math, array.map(function (o) {
                    return o.break;
                }));
            },


            /**
             * Select tallest element in object
             *
             * @param selector must be jQuery object
             */
            maxHeight: function (selector) {
                var maxHeight = 0;
                selector.each(function () {
                    if (!$(this).is(":visible")) return;
                    var height = $(this).outerHeight();
                    if (height > maxHeight) {
                        maxHeight = height;
                    }
                });
                return maxHeight;
            },

            /**
             * Get remaining space from parent so we can check
             * if we can move an item back to the menu if there is space
             *
             * @param element
             * @returns {number}
             */
            calculateRemainingSpace: function (data, element) {
                var childrenWidth = 0;
                element.closest(data.settings.parent).children().not(element).each(function () {
                    if ($(this).is(":visible")) {
                        childrenWidth += $(this).outerWidth(true);
                    }
                });
                return element.parent().width() - element.outerWidth() - childrenWidth;
            },

            /**
             * Check if we have to move an item to dropdown
             * [menu item]--->>[dropdown]
             *
             * If the menu (ul) is higher than the highest menu item (li)
             * than it will move the last menu item
             */
            checkMove: function (data) {
                while (data.menuHeight > data.itemHeight + 5 && data.element.children('li').length > 0 || data.viewportWidth < data.settings.collapse && data.element.children('li').length > 1) {
                    app.moveItem(data.element);
                    app.checkVars(data);
                }
            },

            /**
             * Move item
             *
             * [menu item]--->>[dropdown]
             * @param $this
             */
            moveItem: function ($this) {
                var data = app.getDataFromInstance($this);
                var menuItem = data.element.children('li:nth-last-child(2)'); // second to last item
                var elementWidth = $(menuItem).outerWidth();

                menuItem.prependTo(data.element.find('.' + data.settings.dropdown));
                data.breaks.push({'break': data.viewportWidth, 'width': elementWidth});
                app.checklabel(data);

                /**
                 * Callback for when item is moved to dropdown
                 * @param element: returns element that has been moved
                 */
                data.element.trigger("toDropdown.simplenav", [menuItem]);
            },

            /**
             * Check if we have to retrieve an item
             * [dropdown item]--->>[menu]
             */
            checkRetrieve: function (data) {
                var remainingWidth = this.calculateRemainingSpace(data, data.element);
                var lastitemWidth = data.breaks[0].width;

                while (data.viewportWidth > data.lowestViewport && data.breaks.length > 0 || remainingWidth > lastitemWidth && data.breaks.length > 0) {
                    app.retrieveItem(data);
                    app.checkVars(data);
                }

                /**
                 * Recheck to make sure that not everything is moved back because they had the same
                 * breakpoint because of the collapse breakpoint setting was larger than the viewport.
                 */
                if (data.element.find('.' + data.settings.dropdown).children().length === 0) {
                    this.checkMove(data);
                }
            },

            /**
             * Retrieve item
             * [dropdown item]--->>[menu]
             *
             * @param data
             */
            retrieveItem: function (data) {
                var item = data.element.find('.' + data.settings.dropdown).children('li:first-child');
                item.insertBefore(data.element.children('li:last-child'));
                data.breaks.pop();
                this.checklabel(data);

                /**
                 * Callback for when item is moved back to menu
                 * @param jQuery object
                 */
                data.element.trigger("toMenu.simplenav", [item]);
            },

            /**
             * Toggle dropdown
             * @param $this
             */
            toggleDropdown: function ($this) {
                var _this = this;
                var data = app.getDataFromInstance($this);

                $(data.element).find('.' + data.settings.toggle).on('click', function () {
                    if ($(this).hasClass(data.settings.activeclass)) {
                        _this.closeDropdown(data);
                    } else {
                        _this.openDropdown(data, $(this));
                    }
                });
                $(document).on('click', function (e) {
                    if (!$(e.target).closest('.' + data.settings.toggleWrapper).length) {
                        _this.closeDropdown(data);
                    }
                });
                $(document).keyup(function (e) {
                    if (e.keyCode === 27) _this.closeDropdown(data);
                });

                /**
                 * Open dropdown
                 *
                 * @param element
                 */
                this.openDropdown = function (data, element) {

                    // Toggle aria attributes
                    data.element.find('.' + data.settings.toggle).attr('aria-expanded', 'true');
                    data.element.find('.' + data.settings.dropdown).attr('aria-hidden', 'false');
                    data.element.find('.' + data.settings.toggleWrapper).attr('tabindex', '0');
                    data.element.find('.' + data.settings.dropdown).children('li:first-child').find('a').focus();

                    // Add active classes
                    $(element)
                        .addClass(data.settings.activeclass)
                        .closest('.' + data.settings.toggleWrapper)
                        .addClass(data.settings.activeclass)
                        .find('.' + data.settings.dropdown)
                        .addClass(data.settings.activeclass);
                };

                /**
                 * Close dropdown
                 */
                this.closeDropdown = function (data) {

                    // Toggle aria attributes
                    $('.' + data.settings.toggle).attr('aria-expanded', 'false');
                    $('.' + data.settings.dropdown).attr('aria-hidden', 'true');

                    // Toggle classes
                    $(data.element).find('.' + data.settings.activeclass).removeClass(data.settings.activeclass);
                };
            },


            /**
             * Check if we have to show the more dropdown
             * @param data
             */
            checkDropdown: function (data) {
                if (data.breaks.length > 0) {
                    data.element.find('.' + data.settings.toggleWrapper).show();
                } else {
                    data.element.find('.' + data.settings.toggleWrapper).hide();
                }
            },


            /**
             * Check when to switch the labels from more to menu.
             * @param data
             */
            checklabel: function (data) {
                if ($(window).width() < data.settings.collapse || data.element.children().length === 1) {
                    data.element.find('.js-simplenav-label').html(data.settings.menu);
                } else {
                    data.element.find('.js-simplenav-label').html(data.settings.more);
                }
            },

            getDataFromInstance: function ($this) {
                var instance = $this.data('simplenav-instance');
                return globalData[instance];
            },

            /**
             * Debounced resize for optimized resize event
             *
             * source: https://davidwalsh.name/javascript-debounce-function
             * @param func
             * @param wait
             * @param immediate
             * @returns {Function}
             */
            debounce: function (func, wait, immediate) {
                var timeout;
                return function () {
                    var context = this, args = arguments;
                    var later = function () {
                        timeout = null;
                        if (!immediate) func.apply(context, args);
                    };
                    var callNow = immediate && !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                    if (callNow) func.apply(context, args);
                };
            },

            /**
             * Bind resize event
             * @param $this
             */
            bindResize: function ($this) {
                var data = app.getDataFromInstance($this)
                // Bind resize event to window object
                var check = this.debounce(function () {
                    simplenav.check($this);
                }, data.settings.throttle);
                $(window).on('resize', check);
            }
        };

        /**
         * Main logic check
         * @param $this
         */
        this.check = function ($this) {
            var _data = app.getDataFromInstance($this);
            app.checkVars(_data);
            app.checkMove(_data);
            if (_data.breaks.length > 0) app.checkRetrieve(_data);
            app.checkDropdown(_data);
            app.checklabel(_data);
            app.checkVars(_data);
            app.checkMove(_data);
        },


        this.each(function () {
            // Test if simple nav is binded to ul or ol before continuing.
            var test = $(this).is('ul') || $(this).is('ol');
            if (!test) {
                console.warn('[!] wrong element, please bind simplenav to ul\'s only');
                return;
            }

            /**
             * Set data object to store settings & breakpoints
             * @type {{}}
             */


            globalData.push({
                instance: instance,
                settings: settings,
                element: $(this),
                breaks: []
            });

            app.prepareHtml($(this), instance);
            simplenav.check($(this));
            app.toggleDropdown($(this));
            app.bindResize($(this));

            instance++;

        });

        return this;
    };
}(jQuery));
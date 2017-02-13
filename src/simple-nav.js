(function ($) {
    $.fn.simplenav = function (options) {

        var instance = 0;
        var simplenav = this;
        var globalData = [];
        var lastfocus;
        var focusableElements = 'a[href]:visible, area[href]:visible, input:not([disabled]):visible, select:not([disabled]):visible, textarea:not([disabled]):visible, button:not([disabled]):visible, iframe:visible, object:visible, embed:visible, [contenteditable]:visible, [tabindex]:not([tabindex^="-"]):visible';

        var settings = $.extend({
            buttonClasses: '',
            wrapperClasses: '',
            dropdownClasses: '',
            parent: '.c-header',
            openClass: 'is-open',
            activeClass: 'is-active',
            throttle: 250,
            collapse: 0,
            trapfocus: true,
            more: $(this).data('simplenav-more') ? $(this).data('simplenav-more') : 'more',
            menu: $(this).data('simplenav-menu') ? $(this).data('simplenav-menu') : 'menu',
            findActiveClasses: 'is-active',
            done: function () {
            }
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
                var dropdown = $this.find('.js-simplenav-wrapper');
                if (dropdown.length == 0){
                    console.warn('js-simplenav-wrapper class not found on <li> element');
                    return false;
                };
                $this.attr('data-simplenav-instance', instance);

                if ($this.find('.js-simplenav-toggle').length) {
                    dropdown.addClass(settings.wrapperClasses).hide();
                    $this.find('.js-simplenav-toggle').addClass(settings.buttonClasses).attr({
                        'aria-expanded': false,
                        'aria-controls': 'menu-' + instance
                    });
                    if (!dropdown.children('ul').length) {
                        dropdown.append('<ul></ul>');
                        dropdown.children('ul').attr({
                            'id': 'menu-' + instance,
                            'aria-hidden': true,
                            'aria-labelledby': 'menu-button-' + instance
                        }).css('position', 'absolute').addClass('js-simplenav-dropdown ' + settings.dropdownClasses);
                    }
                } else {
                    $this.append('' +
                        '<li class="js-simplenav-wrapper ' + settings.wrapperClasses + '" style="display:none;">' +
                        '<button id="menu-button-' + instance + '" aria-label="Menu" aria-expanded="false" aria-controls="menu-' + instance + '" type="button" class="js-simplenav-toggle ' + settings.buttonClasses + '"><span class="js-simplenav-label">' + settings.more + '</span></button>' +
                        '<ul id="menu-' + instance + '" aria-hidden="true" aria-labelledby="menu-button-' + instance + '" style="position: absolute;" class="js-simplenav-dropdown ' + settings.dropdownClasses + '"></ul>' +
                        '</li>' +
                        '');
                }

                return true;
            },

            /**
             * Set active state to toggle if submenu's contain active classes
             * @param data
             */
            handleActiveState: function (data) {
                var hasActiveClasses = $(data.dropdown).find('.js-simplenav-dropdown .'+settings.findActiveClasses).length > 0 ? true : false;
                if(hasActiveClasses){
                    $(data.toggle).addClass(data.settings.activeClass);
                }else{
                    $(data.toggle).removeClass(data.settings.activeClass);
                }
            },

            trapFocus: function (data) {
                // Set last focused element so we can re-focus on close
                lastfocus = document.activeElement;

                // All focusable elements
                // From: https://github.com/edenspiekermann/a11y-dialog/blob/master/a11y-dialog.js#L31
                var links = data.dropdown.find(focusableElements);

                // store first focusable element for future reference
                data.firstFocusElement = links.eq(1);

                // Set focus to first focusable element
                data.firstFocusElement.focus();

                /**
                 * Based on http://dylanb.github.io/javascripts/periodic-1.1.js
                 */
                data.dropdown.on('keydown', function (e) {
                    var cancel = false;

                    if (e.ctrlKey || e.metaKey || e.altKey || !data.open) {
                        return;
                    }

                    switch (e.which) {
                        case 27: // ESC
                            cancel = true;
                            break;
                        case 9: // TAB
                            if (e.shiftKey) {
                                if (e.target === links[0]) {
                                    links[links.length - 1].focus();
                                    cancel = true;
                                }
                            } else {
                                if (e.target === links[links.length - 1]) {
                                    links[0].focus();
                                    cancel = true;
                                }
                            }
                            break;
                    }
                    if (cancel) {
                        e.preventDefault();
                    }
                });
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

                menuItem.prependTo(data.element.find('.js-simplenav-dropdown'));
                data.breaks.push({'break': data.viewportWidth, 'width': elementWidth});
                app.checklabel(data);
                app.checkDropdown(data);

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
                    app.retrieveItem(data.element);
                    app.checkVars(data);
                    app.checkDropdown(data);
                }

                /**
                 * Recheck to make sure that not everything is moved back because they had the same
                 * breakpoint because of the collapse breakpoint setting was larger than the viewport.
                 */
                if (data.element.find('.js-simplenav-dropdown').children().length === 0) {
                    this.checkMove(data);
                }
            },


            /**
             * Retrieve item
             * [dropdown item]--->>[menu]
             *
             * @param $this
             */
            retrieveItem: function ($this) {
                var data = app.getDataFromInstance($this);
                var item = data.element.find('.js-simplenav-dropdown').children('li:first-child');
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

                data.toggle.on('click', function () {
                    if (data.open) {
                        _this.closeDropdown(data);
                    } else {
                        _this.openDropdown($this);
                    }
                });
                $(document).on('click', function (e) {
                    if (!$(e.target).closest('li.js-simplenav-wrapper').length || $(e.target).hasClass('js-simplenav-wrapper')) {
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
                this.openDropdown = function (element, kb) {
                    var data = app.getDataFromInstance(element);

                    // mark instance as open
                    if (!kb) {
                        data.open = true;
                    }

                    // Toggle aria attributes
                    data.element.find('.js-simplenav-toggle').attr('aria-expanded', 'true');
                    data.element.find('.js-simplenav-dropdown').attr('aria-hidden', 'false');

                    // Add active classes
                    $(element)
                        .addClass(data.settings.openClass)
                        .find('.js-simplenav-wrapper')
                        .show()
                        .addClass(data.settings.openClass);
                    $(element)
                        .find('.js-simplenav-dropdown')
                        .addClass(data.settings.openClass);
                    $(element)
                        .find('.js-simplenav-toggle')
                        .addClass(data.settings.openClass);

                    // Set focus loop inside dropdown content
                    if (data.settings.trapfocus) {
                        app.trapFocus(data);
                    }

                    // Triger custom open event
                    setTimeout(function () {
                        $(element).trigger("simplenav:open");
                    }, 1);
                };


                /**
                 * Close dropdown
                 */
                this.closeDropdown = function (data) {
                    // Toggle aria attributes
                    data.dropdown.find('.js-simplenav-toggle').attr('aria-expanded', 'false');
                    data.dropdown.find('.js-simplenav-dropdown').attr('aria-hidden', 'true');
                    if (lastfocus) {
                        lastfocus.focus();
                    }

                    // Toggle classes
                    $(data.dropdown).removeClass(data.settings.openClass).find('.' + data.settings.openClass).removeClass(data.settings.openClass);

                    // mark instance as closed
                    data.open = false;
                };
            },


            /**
             * Check if we have to show the more dropdown
             * @param data
             */
            checkDropdown: function (data) {
                if (data.breaks.length > 0) {
                    data.dropdown.show();
                } else {
                    data.dropdown.hide();
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
                var data = app.getDataFromInstance($this);
                // Bind resize event to window object
                var check = this.debounce(function () {
                    simplenav.check($this);
                }, data.settings.throttle);
                $(window).on('resize', check);
            },


            tabHandler: function ($this) {
                var data = app.getDataFromInstance($this);

                // All focusable elements
                // From: https://github.com/edenspiekermann/a11y-dialog/blob/master/a11y-dialog.js#L31
                var links = data.dropdown.find(focusableElements);

                /**
                 * Bind keydown on toggle/dropdown items so we
                 * can open/close dropdown when user tabs on the element
                 */
                data.dropdown.on('keydown', function (e) {
                    if (e.which == 9) {
                        // Shift tab
                        var item = $(e.target);
                        if (e.shiftKey) {
                            if (item.is(data.toggle)) {
                                app.closeDropdown(data);
                            }
                        } else {
                            if (item.is(links.last())) {
                                app.closeDropdown(data);
                            }
                        }
                    }
                });
            },


            /**
             * Bind events
             * @param $this
             */
            bindUIevents: function ($this) {
                var data = app.getDataFromInstance($this);

                if (!data.settings.trapfocus) {

                    $(window).on('keyup', function (e) {
                        var code = (e.keyCode ? e.keyCode : e.which);
                        if (code == 9 && data.toggle.is(':focus')) {
                            app.openDropdown($this, true);
                        }
                    });

                    app.tabHandler($this);
                }
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
            app.handleActiveState(_data);
        };

        // Expose our app
        this.app = app;

        // Expose each instant
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
                open: false,
                settings: settings,
                element: $(this),
                breaks: []
            });

            // Expose each instance its data
            this.globalData = globalData;

            // Prepare toggle/dropdown/aria
            if(!app.prepareHtml($(this), instance)){
                return;
            };

            // Store selectors after html has been prepared
            globalData[instance].toggle = $(this).find('.js-simplenav-toggle');
            globalData[instance].dropdown = $(this).find('.js-simplenav-wrapper');

            simplenav.check($(this));
            app.toggleDropdown($(this));
            app.bindResize($(this));
            app.bindUIevents($(this));

            // Increment instance id
            instance++;

            // Done callback
            settings.done.call(this);
        });

        return this;
    };
}(jQuery));
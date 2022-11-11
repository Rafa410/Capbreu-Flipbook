(function () {
    'use strict';

    const pfSettings = {
        width: 824,
        height: 1076,
        size: 'stretch',
        maxShadowOpacity: 0.5,
        minWidth: 200,
        minHeight: 200,
        maxWidth: 1649,
        maxHeight: 2153,
        showCover: true,
        autoSize: true,
        flippingTime: 1000,
        swipeDistance: 5,
    };

    const buildSettings = {
        numberOfPages: 472,
        path: 'images/',
        baseName: 'Capbreu_flipbook-',
        numberPadding: 3,
        extension: 'jpg',
        cover: true,
        backCover: true,
        preload: 5,
        depthPercentage: '4.25',
    };

    /**
     * Flipbook class
     *
     * @constructor
     * @param {HTMLElement} flipbookWrapper - The wrapper element for the flipbook
     * @param {HTMLElement} thumbnailWrapper - The wrapper element for the thumbnails
     * @param {object} pfSettings - The settings for the PageFlip instance
     * @param {object} buildSettings - The settings for the build process
     */
    function Flipbook(flipbookWrapper, thumbnailWrapper, pfSettings, buildSettings) {
        this.flipbookWrapper = flipbookWrapper;
        this.thumbnailWrapper = thumbnailWrapper;
        this.pfSettings = pfSettings;
        this.buildSettings = buildSettings;
    }

    /**
     * Pad a number with the specified number of zeros
     *
     * @param {(number|string)} number - The number to pad
     * @param {number} padding - The number of digits to pad to
     * @returns {string} The padded number
     */
    Flipbook.prototype.pad = function (number, padding) {
        number = number.toString();
        return number.length >= padding
            ? number
            : new Array(padding - number.length + 1).join('0') + number;
    };

    /**
     * Builds an HTML page of the flipbook
     *
     * @param {number} index - The index of the page to build
     * @returns {HTMLElement} The page element
     */
    Flipbook.prototype.buildPage = function (index) {
        const image = document.createElement('img');

        if (index <= this.buildSettings.preload) {
            // Preload the specified number of pages
            image.src =
                this.buildSettings.path +
                this.buildSettings.baseName +
                this.pad(index, this.buildSettings.numberPadding) +
                '.' +
                this.buildSettings.extension;
        } else {
            // Lazy load the rest of the pages
            image.classList.add('lazyload');
            image.src =
                'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            image.dataset.src =
                this.buildSettings.path +
                this.buildSettings.baseName +
                this.pad(index, this.buildSettings.numberPadding) +
                '.' +
                this.buildSettings.extension;
        }

        image.alt = 'Pàgina ' + index;

        const page = document.createElement('div');
        page.classList.add('page');

        // Set density of cover and back cover
        if (
            (index === 1 && this.buildSettings.cover) ||
            (index === this.buildSettings.numberOfPages && this.buildSettings.backCover)
        ) {
            page.dataset.density = 'hard';
        }

        page.appendChild(image);

        return page;
    };

    /**
     * Builds the HTML thumbnail of the flipbook
     *
     * @param {number} index - The index of the thumbnail to build
     * @returns {HTMLElement} The thumbnail element
     */
    Flipbook.prototype.buildPageThumbnail = function (index) {
        const image = document.createElement('img');

        if (index <= this.buildSettings.preload) {
            // Preload the specified number of pages
            image.src =
                this.buildSettings.path +
                this.buildSettings.baseName +
                this.pad(index, this.buildSettings.numberPadding) +
                '-thumbnail' +
                '.' +
                this.buildSettings.extension;
        } else {
            // Lazy load the rest of the pages
            image.classList.add('lazyload');
            image.src =
                'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            image.dataset.src =
                this.buildSettings.path +
                this.buildSettings.baseName +
                this.pad(index, this.buildSettings.numberPadding) +
                '-thumbnail' +
                '.' +
                this.buildSettings.extension;
        }

        image.alt = 'Pàgina ' + index;

        const thumbnail = document.createElement('div');
        thumbnail.classList.add('thumbnail');
        thumbnail.dataset.page = index;
        thumbnail.role = 'button';
        thumbnail.tabIndex = 0;
        thumbnail.title = 'Pàgina ' + index;
        thumbnail.setAttribute('aria-label', 'Pàgina ' + index);

        thumbnail.appendChild(image);

        return thumbnail;
    };

    /**
     * Builds the HTML and initializes the PageFlip instance
     */
    Flipbook.prototype.init = function () {
        for (let i = 1; i <= this.buildSettings.numberOfPages; i++) {
            // Build main flipbook
            this.flipbookWrapper.appendChild(this.buildPage(i));

            // Build thumbnails
            this.thumbnailWrapper.appendChild(this.buildPageThumbnail(i));
        }

        this.flipbookPages = this.flipbookWrapper.querySelectorAll('.page');
        this.pageFlip = new St.PageFlip(this.flipbookWrapper, this.pfSettings);
        this.pageFlip.loadFromHTML(this.flipbookPages);
    };

    /**
     * Handles the PageFlip events
     *
     * @param {string} event - The event name
     * @param {(function|function[])} callback - The callback function(s)
     * @returns {Flipbook} The Flipbook instance for chaining
     */
    Flipbook.prototype.on = function (event, callback) {
        const self = this;
        if (callback instanceof Array) {
            callback.forEach(function (cb) {
                self.pageFlip.on(event, cb.bind(self));
            });
        } else {
            self.pageFlip.on(event, callback.bind(self));
        }
        return self;
    };

    /**
     * Preloads the next page(s) when the flipbook is flipped
     *
     * @param {object} event - The event object
     * @param {(number|string)} event.data - Current page number
     * @param {PageFlip} event.object - The PageFlip instance
     */
    Flipbook.prototype.preloadNextPage = function ({ data, object }) {
        const numberOfPreloadedPages = this.buildSettings.preload;

        if (numberOfPreloadedPages <= 0 || data >= object.getPageCount()) {
            return;
        }

        const first = data + 1;
        const last = Math.min(data + numberOfPreloadedPages, object.getPageCount());

        for (let i = first; i <= last; i++) {
            const image = this.flipbookPages[i - 1].querySelector('img');
            if (image.classList.contains('lazyload')) {
                lazySizes.loader.unveil(image);
            }
        }
    };

    /**
     * Displays the current page number
     *
     * @param {object} event - The event object
     * @param {(number|string)} event.data - Current page number
     * @param {PageFlip} event.object - The PageFlip instance
     */
    Flipbook.prototype.displayPageNumber = function ({ data, object }) {
        const pageNumberEl = document.getElementById('pageNumber');
        const firstPageNumber = data + 1;
        const totalPageNumber = object.getPageCount();

        if (firstPageNumber > 1 && firstPageNumber < totalPageNumber) {
            const secondPageNumber = firstPageNumber + 1;
            pageNumberEl.value =
                firstPageNumber + '-' + secondPageNumber + ' de ' + totalPageNumber;
        } else {
            pageNumberEl.value = firstPageNumber + ' de ' + totalPageNumber;
        }
    };

    /**
     * Updates the depth of the flipbook
     *
     * @param {object} event - The event object
     * @param {(number|string)} event.data - Current page number
     * @param {PageFlip} event.object - The PageFlip instance
     */
    Flipbook.prototype.updateDepth = function ({ data, object }) {
        if (this.buildSettings.depth <= 0) {
            return;
        }

        var stfBlock = document.querySelector('.stf__block');
        var currentPage = data + 1;
        var totalPageNumber = object.getPageCount();
        var maxDepth = this.buildSettings.depthPercentage;

        stfBlock.style.setProperty(
            '--depth-left-width',
            Math.round((maxDepth / totalPageNumber) * currentPage * 100) / 100 + '%'
        );
        stfBlock.style.setProperty(
            '--depth-right-width',
            Math.round((maxDepth / totalPageNumber) * (totalPageNumber - currentPage) * 100) / 100 +
                '%'
        );

        // Hide both depths on the cover and back cover
        if (currentPage === 1 || currentPage === totalPageNumber) {
            stfBlock.style.setProperty('--depth-left-width', 0);
            stfBlock.style.setProperty('--depth-right-width', 0);
        }
        // Hide left depth just before the cover
        if (currentPage <= 3) {
            stfBlock.style.setProperty('--depth-left-width', 0);
        }
        // Hide right depth just before the back cover
        if (currentPage >= totalPageNumber - 2) {
            stfBlock.style.setProperty('--depth-right-width', 0);
        }
    };

    /**
     * Sets the initial page number
     *
     * @param {object} event - The event object
     * @param {(number|string)} event.data - Current page number
     * @param {PageFlip} event.object - The PageFlip instance
     */
    Flipbook.prototype.initPageNumber = function ({ object }) {
        const pageNumberEl = document.getElementById('pageNumber');
        const firstPageNumber = 1;
        const totalPageNumber = object.getPageCount();

        pageNumberEl.value = firstPageNumber + ' de ' + totalPageNumber;
        pageNumber.placeholder = firstPageNumber + '-' + totalPageNumber;
    };

    // Initialize the flipbook
    const flipbookWrapper = document.getElementById('flipbook');
    const thumbnailWrapper = document.getElementById('flipbookThumbnails');
    const flipbook = new Flipbook(flipbookWrapper, thumbnailWrapper, pfSettings, buildSettings);
    flipbook.init();

    // Flipbook event handlers
    flipbook
        .on('init', flipbook.initPageNumber)
        .on('flip', [flipbook.preloadNextPage, flipbook.displayPageNumber, flipbook.updateDepth]);

    //// Toolbar event handlers
    const pageSelector = document.getElementById('pageNumber');
    const firstButton = document.getElementById('firstPage');
    const prevButton = document.getElementById('previousPage');
    const nextButton = document.getElementById('nextPage');
    const lastButton = document.getElementById('lastPage');
    const fullscreenButton = document.getElementById('fullscreen');
    const zoomButton = document.getElementById('zoom');
    const initialZoom = 1.5;
    const zoomStep = 1;
    const maxZoom = 5;
    const menuButton = document.getElementById('menu');
    const thumbnails = document.querySelectorAll('.thumbnail');

    // Hide page number on focus, so the user can type one
    pageSelector.addEventListener('focus', function (event) {
        // Save the original value so it can be restored later
        this.dataset.value = this.value;
        this.value = '';
    });

    // Flip to the desired page on enter
    pageSelector.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const pageNumber = parseInt(event.target.value, 10);
            if (pageNumber > 0 && pageNumber <= flipbook.pageFlip.getPageCount()) {
                flipbook.pageFlip.flip(pageNumber - 1);
                this.dataset.value = '';
                this.blur();

                if (pageNumber === 1 || pageNumber === flipbook.pageFlip.getPageCount()) {
                    flipbook.updateDepth({ data: pageNumber - 1, object: flipbook.pageFlip });
                }
            }
        }
    });

    // Restore the page number on blur
    pageSelector.addEventListener('blur', function (event) {
        if (this.dataset.value) {
            this.value = this.dataset.value;
            this.dataset.value = '';
        }
    });

    // Flip to the first page
    firstButton.addEventListener('click', function (event) {
        flipbook.pageFlip.flip(0);
        flipbook.updateDepth({ data: 0, object: flipbook.pageFlip });
    });

    // Flip to the previous page
    prevButton.addEventListener('click', function (event) {
        flipbook.pageFlip.flipPrev();
    });

    // Flip to the next page
    nextButton.addEventListener('click', function (event) {
        flipbook.pageFlip.flipNext();
    });

    // Flip to the last page
    lastButton.addEventListener('click', function (event) {
        flipbook.pageFlip.flip(flipbook.pageFlip.getPageCount() - 1);
        flipbook.updateDepth({
            data: flipbook.pageFlip.getPageCount() - 1,
            object: flipbook.pageFlip,
        });
    });

    // Toggle fullscreen mode
    fullscreenButton.addEventListener('click', function (event) {
        toggleFullScreen();
        this.classList.toggle('active');
    });

    // Toggle zoom mode
    zoomButton.addEventListener('click', function (event) {
        const container = document.getElementById('zoomContainer');
        const isZoom = container.classList.toggle('zoom');
        zoomButton.classList.toggle('active', isZoom);

        if (isZoom) {
            var scale = initialZoom;
            container.style.transform = 'scale(' + scale + ')';
            container.style.transformOrigin = 'center';

            container.addEventListener('mousemove', onMouseMoveZoom);
            container.addEventListener('dblclick', onDoubleClickZoom);
        } else {
            container.style.transform = '';
            container.style.transformOrigin = '';
            container.removeEventListener('mousemove', onMouseMoveZoom);
            container.removeEventListener('dblclick', onDoubleClickZoom);
        }
    });

    // Toggle menu
    menuButton.addEventListener('click', function (event) {
        const target = this.dataset.target;
        const targetEl = document.getElementById(target);
        const isMenuOpen = targetEl.classList.toggle('open');
        this.classList.toggle('active', isMenuOpen);
        targetEl.setAttribute('aria-hidden', !isMenuOpen);

        if (isMenuOpen) {
            targetEl.focus();
        }
    });

    // Flip to the desired page on thumbnail click
    thumbnails.forEach(function (thumbnail) {
        thumbnail.addEventListener('click', function (event) {
            const pageNumber = parseInt(this.dataset.page, 10);
            flipbook.pageFlip.flip(pageNumber - 1);
        });
        thumbnail.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                this.click();
            }
        });
    });

    /**
     * Move the zoom container on mouse move
     *
     * @param {MouseEvent} event - Mouse move event
     */
    function onMouseMoveZoom(event) {
        this.style.transformOrigin = event.offsetX + 'px ' + event.offsetY + 'px';
    }

    /**
     * Zoom more on double click
     *
     * @param {MouseEvent} event - Mouse double click event
     */
    function onDoubleClickZoom(event) {
        var scale = parseFloat(this.style.transform.replace('scale(', ''));
        scale = Math.min(maxZoom, scale + zoomStep);
        this.style.transform = 'scale(' + scale + ')';
    }

    /**
     * Polyfill for entering fullscreen mode
     *
     * @param {HTMLElement} el - The element to toggle fullscreen mode, if not provided the documentElement will be used
     */
    function requestFullScreen(el = document.documentElement) {
        // Supports most browsers and their versions.
        var requestMethod =
            el.requestFullScreen ||
            el.webkitRequestFullScreen ||
            el.mozRequestFullScreen ||
            el.msRequestFullScreen;

        if (requestMethod) {
            // Native full screen.
            requestMethod.call(el);
        } else if (typeof window.ActiveXObject !== 'undefined') {
            // Older IE.
            var wscript = new ActiveXObject('WScript.Shell');
            if (wscript !== null) {
                wscript.SendKeys('{F11}');
            }
        }
    }

    /**
     * Polyfill for exiting fullscreen mode
     */
    function cancelFullScreen() {
        var el = document;
        var requestMethod =
            el.cancelFullScreen ||
            el.webkitCancelFullScreen ||
            el.mozCancelFullScreen ||
            el.exitFullscreen ||
            el.webkitExitFullscreen;

        if (requestMethod) {
            // cancel full screen.
            requestMethod.call(el);
        } else if (typeof window.ActiveXObject !== 'undefined') {
            // Older IE.
            var wscript = new ActiveXObject('WScript.Shell');
            if (wscript !== null) {
                wscript.SendKeys('{F11}');
            }
        }
    }

    /**
     * Toggle fullscreen mode
     *
     * @param {HTMLElement} el The element to toggle fullscreen mode, if not provided the documentElement will be used
     */
    function toggleFullScreen(el = document.documentElement) {
        var isInFullScreen =
            (document.fullScreenElement && document.fullScreenElement !== null) ||
            document.mozFullScreen ||
            document.webkitIsFullScreen;

        if (isInFullScreen) {
            cancelFullScreen();
        } else {
            requestFullScreen(el);
        }
        return false;
    }
})();

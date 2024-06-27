(function ($) {
    "use strict";

    // Testimonials Two Hover Img
    const link = document.querySelectorAll(".testimonials-two__right-list-item");
    const linkHoverReveal = document.querySelectorAll(".testimonials-two__img");
    const linkImages = document.querySelectorAll(".testimonials-two__img-hover");
    for (let i = 0; i < link.length; i++) {
        link[i].addEventListener("mousemove", (e) => {
            linkHoverReveal[i].style.opacity = 1;
            linkHoverReveal[i].style.transform = `translate(-250%, -50% ) rotate(5deg)`;
            linkImages[i].style.transform = "scale(1, 1)";
            linkHoverReveal[i].style.left = e.clientX + "px";
        });
        link[i].addEventListener("mouseleave", (e) => {
            linkHoverReveal[i].style.opacity = 0;
            linkHoverReveal[i].style.transform = `translate(-50%, -50%) rotate(-5deg)`;
            linkImages[i].style.transform = "scale(0.8, 0.8)";
        });
    }

    $("[data-background]").each(function () {
        $(this).css("background-image", "url(" + $(this).attr("data-background") + ")");
    });

    // FullHeight
    function fullHeight() {
        $(".full-height").css("height", $(window).height());
    }

    // ===Testimonials Two Carousel===
    if ($("#testimonials-two__thumb").length) {
        let testimonialsThumb = new Swiper("#testimonials-two__thumb", {
            slidesPerView: 4,
            spaceBetween: 20,
            speed: 1400,
            watchSlidesVisibility: true,
            watchSlidesProgress: true,
            loop: true,
            autoplay: {
                delay: 5000,
            },
        });

        let testimonialsCarousel = new Swiper("#testimonials-two__carousel", {
            observer: true,
            observeParents: true,
            speed: 1400,
            mousewheel: true,
            slidesPerView: 1,
            autoplay: {
                delay: 5000,
            },
            thumbs: {
                swiper: testimonialsThumb,
            },
            pagination: {
                el: "#testimonials-two__carousel-pagination",
                type: "bullets",
                clickable: true,
            },
        });
    }

    // ===Main Slider One Carousel===
    if ($(".main-slider-one__carousel").length > 0) {
        var totalSlides2 = $(".main-slider-one__carousel .swiper-slide").length;
        var gridCarusel = new Swiper(".main-slider-one__carousel", {
            preloadImages: false,
            loop: true,
            freeMode: false,
            slidesPerView: 1,
            spaceBetween: 0,
            grabCursor: true,
            mousewheel: false,
            speed: 1500,
            effect: "slide",
            autoplay: {
                delay: 9000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".swiper-pagination",
                type: "progressbar",
            },
            navigation: {
                nextEl: ".project-one__nav-next",
                prevEl: ".project-one__nav-prev",
            },
            breakpoints: {
                1600: {
                    slidesPerView: 1,
                },
                1200: {
                    slidesPerView: 1,
                },
                992: {
                    slidesPerView: 1,
                },
                768: {
                    slidesPerView: 1,
                },
            },
        });

        gridCarusel.on("slideChange", function () {
            var csli = gridCarusel.realIndex + 1,
                curnum = $("#current2");
            TweenMax.to(curnum, 0.2, {
                force3D: true,
                y: -10,
                opacity: 0,
                ease: Power2.easeOut,
                onComplete: function () {
                    TweenMax.to(curnum, 0.1, {
                        force3D: true,
                        y: 10,
                    });
                    curnum.html("0" + csli);
                },
            });
            TweenMax.to(curnum, 0.2, {
                force3D: true,
                y: 0,
                delay: 0.3,
                opacity: 1,
                ease: Power2.easeOut,
            });
        });

        var totalSlides2 = gridCarusel.slides.length - 6;
        $("#total2").html(totalSlides2);
    }

    // ===Blog Two Carousel===
    if ($(".blog-two__carousel").length) {
        var blogCarousel = $(".blog-two__carousel");
        var nextBtn = $(".blog-two__carousel-custom-nav .left-btn");
        var prevBtn = $(".blog-two__carousel-custom-nav .right-btn");
        blogCarousel.owlCarousel({
            loop: true,
            margin: 30,
            nav: true,
            smartSpeed: 500,
            autoHeight: false,
            autoplay: true,
            dots: false,
            autoplayTimeout: 10000,
            navText: ['<span class="icon-left"></span>', '<span class="icon-right"></span>'],
            responsive: {
                0: {
                    items: 1,
                },
                600: {
                    items: 1,
                },
                992: {
                    items: 3,
                },
                1024: {
                    items: 3,
                },
                1200: {
                    items: 3,
                },
            },
        });
        nextBtn.on("click", function (e) {
            e.preventDefault();
            blogCarousel.trigger("next.owl.carousel", [500]);
        });
        prevBtn.on("click", function (e) {
            e.preventDefault();
            blogCarousel.trigger("prev.owl.carousel", [500]);
        });
    }

    //Hide Loading Box (Preloader)
    function handlePreloader() {
        if ($(".loader-wrap").length) {
            $(".loader-wrap").delay(1000).fadeOut(500);
        }
    }

    if ($(".preloader-close").length) {
        $(".preloader-close").on("click", function () {
            $(".loader-wrap").delay(200).fadeOut(500);
        });
    }

    function thmSwiperInit() {
        // swiper slider
        if ($(".thm-swiper__slider").length) {
            $(".thm-swiper__slider").each(function () {
                let elm = $(this);
                let options = elm.data("swiper-options");
                let thmSwiperSlider = new Swiper(elm, options);
            });
        }
    }

    function thmOwlInit() {
        // owl slider

        if ($(".thm-owl__carousel").length) {
            $(".thm-owl__carousel").each(function () {
                let elm = $(this);
                let options = elm.data("owl-options");
                let thmOwlCarousel = elm.owlCarousel(options);
            });
        }

        if ($(".thm-owl__carousel--custom-nav").length) {
            $(".thm-owl__carousel--custom-nav").each(function () {
                let elm = $(this);
                let owlNavPrev = elm.data("owl-nav-prev");
                let owlNavNext = elm.data("owl-nav-next");
                $(owlNavPrev).on("click", function (e) {
                    elm.trigger("prev.owl.carousel");
                    e.preventDefault();
                });

                $(owlNavNext).on("click", function (e) {
                    elm.trigger("next.owl.carousel");
                    e.preventDefault();
                });
            });
        }
    }

    function dynamicCurrentMenuClass(selector) {
        let FileName = window.location.href.split("/").reverse()[0];

        selector.find("li").each(function () {
            let anchor = $(this).find("a");
            if ($(anchor).attr("href") == FileName) {
                $(this).addClass("current");
            }
        });
        // if any li has .current elmnt add class
        selector.children("li").each(function () {
            if ($(this).find(".current").length) {
                $(this).addClass("current");
            }
        });
        // if no file name return
        if ("" == FileName) {
            selector.find("li").eq(0).addClass("current");
        }
    }

    if ($(".main-menu__list").length) {
        // dynamic current class
        let mainNavUL = $(".main-menu__list");
        dynamicCurrentMenuClass(mainNavUL);
    }

    if ($(".service-details__sidebar-service-list").length) {
        // dynamic current class
        let mainNavUL = $(".service-details__sidebar-service-list");
        dynamicCurrentMenuClass(mainNavUL);
    }

    if ($(".main-menu__list").length && $(".mobile-nav__container").length) {
        let navContent = document.querySelector(".main-menu__list").outerHTML;
        let mobileNavContainer = document.querySelector(".mobile-nav__container");
        mobileNavContainer.innerHTML = navContent;
    }

    if ($(".sticky-header__content").length) {
        let navContent = document.querySelector(".main-menu").innerHTML;
        let mobileNavContainer = document.querySelector(".sticky-header__content");
        mobileNavContainer.innerHTML = navContent;
    }

    if ($(".mobile-nav__container .main-menu__list").length) {
        let dropdownAnchor = $(".mobile-nav__container .main-menu__list .dropdown > a");
        dropdownAnchor.each(function () {
            let self = $(this);
            let toggleBtn = document.createElement("BUTTON");
            toggleBtn.setAttribute("aria-label", "dropdown toggler");
            toggleBtn.innerHTML = "<i class='fa fa-angle-down'></i>";
            self.append(function () {
                return toggleBtn;
            });
            self.find("button").on("click", function (e) {
                e.preventDefault();
                let self = $(this);
                self.toggleClass("expanded");
                self.parent().toggleClass("expanded");
                self.parent().parent().children("ul").slideToggle();
            });
        });
    }

    if ($(".mobile-nav__toggler").length) {
        $(".mobile-nav__toggler").on("click", function (e) {
            e.preventDefault();
            $(".mobile-nav__wrapper").toggleClass("expanded");
            $("body").toggleClass("locked");
        });
    }

    //Fact Counter + Text Count
    if ($(".count-box").length) {
        $(".count-box").appear(
            function () {
                var $t = $(this),
                    n = $t.find(".count-text").attr("data-stop"),
                    r = parseInt($t.find(".count-text").attr("data-speed"), 10);

                if (!$t.hasClass("counted")) {
                    $t.addClass("counted");
                    $({
                        countNum: $t.find(".count-text").text(),
                    }).animate(
                        {
                            countNum: n,
                        },
                        {
                            duration: r,
                            easing: "linear",
                            step: function () {
                                $t.find(".count-text").text(Math.floor(this.countNum));
                            },
                            complete: function () {
                                $t.find(".count-text").text(this.countNum);
                            },
                        }
                    );
                }
            },
            {
                accY: 0,
            }
        );
    }

    // Progress Bar
    if ($(".count-bar").length) {
        $(".count-bar").appear(
            function () {
                var el = $(this);
                var percent = el.data("percent");
                $(el).css("width", percent).addClass("counted");
            },
            {
                accY: -50,
            }
        );
    }

    // Apartments Plan Tab Box
    if ($(".apartments-plan-tab-box").length) {
        $(".apartments-plan-tab-box .tabs-button-box .tab-btn-item").on("click", function (e) {
            e.preventDefault();
            var target = $($(this).attr("data-tab"));

            if ($(target).hasClass("actve-tab")) {
                return false;
            } else {
                $(".apartments-plan-tab-box .tabs-button-box .tab-btn-item").removeClass(
                    "active-btn-item"
                );
                $(this).addClass("active-btn-item");
                $(".apartments-plan-tab-box .tabs-content-box .tab-content-box-item").removeClass(
                    "tab-content-box-item-active"
                );
                $(target).addClass("tab-content-box-item-active");
            }
        });
    }

    // Search Form Tab Box
    if ($(".search-form-tab-box").length) {
        $(".search-form-tab-box .tabs-button-box .tab-btn-item").on("click", function (e) {
            e.preventDefault();
            var target = $($(this).attr("data-tab"));

            if ($(target).hasClass("actve-tab")) {
                return false;
            } else {
                $(".search-form-tab-box .tabs-button-box .tab-btn-item").removeClass(
                    "active-btn-item"
                );
                $(this).addClass("active-btn-item");
                $(".search-form-tab-box .tabs-content-box .tab-content-box-item").removeClass(
                    "tab-content-box-item-active"
                );
                $(target).addClass("tab-content-box-item-active");
            }
        });
    }

    // ===Portfolio Grid===
    function projectMasonaryLayout() {
        if ($(".masonary-layout").length) {
            $(".masonary-layout").isotope({
                layoutMode: "masonry",
            });
        }
        if ($(".post-filter").length) {
            $(".post-filter li")
                .children(".filter-text")
                .on("click", function () {
                    var Self = $(this);
                    var selector = Self.parent().attr("data-filter");
                    $(".post-filter li").removeClass("active");
                    Self.parent().addClass("active");
                    $(".filter-layout").isotope({
                        filter: selector,
                        animationOptions: {
                            duration: 500,
                            easing: "linear",
                            queue: false,
                        },
                    });
                    return false;
                });
        }

        if ($(".post-filter.has-dynamic-filters-counter").length) {
            // var allItem = $('.single-filter-item').length;
            var activeFilterItem = $(".post-filter.has-dynamic-filters-counter").find("li");
            activeFilterItem.each(function () {
                var filterElement = $(this).data("filter");
                var count = $(".filter-layout").find(filterElement).length;
                $(this)
                    .children(".filter-text")
                    .append('<span class="count">' + count + "</span>");
            });
        }
    }

    //====== Magnific Popup
    if ($(".video-popup").length) {
        $(".video-popup").magnificPopup({
            type: "iframe",
            mainClass: "mfp-fade",
            removalDelay: 160,
            preloader: true,

            fixedContentPos: false,
        });
    }

    //====== Img Popup
    if ($(".img-popup").length) {
        var groups = {};
        $(".img-popup").each(function () {
            var id = parseInt($(this).attr("data-group"), 10);

            if (!groups[id]) {
                groups[id] = [];
            }

            groups[id].push(this);
        });

        $.each(groups, function () {
            $(this).magnificPopup({
                type: "image",
                closeOnContentClick: true,
                closeBtnInside: false,
                gallery: {
                    enabled: true,
                },
            });
        });
    }

    //Contact Form Validation
    if ($("#contact-form").length) {
        $("#contact-form").validate({
            submitHandler: function (form) {
                var form_btn = $(form).find('button[type="submit"]');
                var form_result_div = "#form-result";
                $(form_result_div).remove();
                form_btn.before(
                    '<div id="form-result" class="alert alert-success" role="alert" style="display: none;"></div>'
                );
                var form_btn_old_msg = form_btn.html();
                form_btn.html(form_btn.prop("disabled", true).data("loading-text"));
                $(form).ajaxSubmit({
                    dataType: "json",
                    success: function (data) {
                        if ((data.status = "true")) {
                            $(form).find(".form-control").val("");
                        }
                        form_btn.prop("disabled", false).html(form_btn_old_msg);
                        $(form_result_div).html(data.message).fadeIn("slow");
                        setTimeout(function () {
                            $(form_result_div).fadeOut("slow");
                        }, 6000);
                    },
                });
            },
        });
    }

    if ($(".odometer").length) {
        var odo = $(".odometer");
        odo.each(function () {
            $(this).appear(function () {
                var countNumber = $(this).attr("data-count");
                $(this).html(countNumber);
            });
        });
    }

    if ($(".wow").length) {
        var wow = new WOW({
            boxClass: "wow", // animated element css class (default is wow)
            animateClass: "animated", // animation css class (default is animated)
            mobile: true, // trigger animations on mobile devices (default is true)
            live: true, // act on asynchronously loaded content (default is true)
        });
        wow.init();
    }

    if ($(".search-toggler").length) {
        $(".search-toggler").on("click", function (e) {
            e.preventDefault();
            $(".search-popup").toggleClass("active");
            $(".mobile-nav__wrapper").removeClass("expanded");
            $("body").toggleClass("locked");
        });
    }

    //Tabs Box
    if ($(".tabs-box").length) {
        $(".tabs-box .tab-buttons .tab-btn").on("click", function (e) {
            e.preventDefault();
            var target = $($(this).attr("data-tab"));

            if ($(target).is(":visible")) {
                return false;
            } else {
                target
                    .parents(".tabs-box")
                    .find(".tab-buttons")
                    .find(".tab-btn")
                    .removeClass("active-btn");
                $(this).addClass("active-btn");
                target.parents(".tabs-box").find(".tabs-content").find(".tab").fadeOut(0);
                target
                    .parents(".tabs-box")
                    .find(".tabs-content")
                    .find(".tab")
                    .removeClass("active-tab");
                $(target).fadeIn(300);
                $(target).addClass("active-tab");
            }
        });
    }

    //=== CountDownTimer===
    if ($(".time-countdown").length) {
        $(".time-countdown").each(function () {
            var Self = $(this);
            var countDate = Self.data("countdown-time"); // getting date

            Self.countdown(countDate, function (event) {
                $(this).html("<h2>" + event.strftime("%D : %H : %M : %S") + "</h2>");
            });
        });
    }

    if ($(".time-countdown-two").length) {
        $(".time-countdown-two").each(function () {
            var Self = $(this);
            var countDate = Self.data("countdown-time"); // getting date

            Self.countdown(countDate, function (event) {
                $(this).html(
                    '<li> <div class="box"> <span class="days">' +
                        event.strftime("%D") +
                        '</span> <span class="timeRef">days</span> </div> </li> <li> <div class="box"> <span class="hours">' +
                        event.strftime("%H") +
                        '</span> <span class="timeRef clr-1">hours</span> </div> </li> <li> <div class="box"> <span class="minutes">' +
                        event.strftime("%M") +
                        '</span> <span class="timeRef clr-2">min</span> </div> </li> <li> <div class="box"> <span class="seconds">' +
                        event.strftime("%S") +
                        '</span> <span class="timeRef clr-3">sec</span> </div> </li>'
                );
            });
        });
    }

    // Accrodion
    if ($(".accrodion-grp").length) {
        var accrodionGrp = $(".accrodion-grp");
        accrodionGrp.each(function () {
            var accrodionName = $(this).data("grp-name");
            var Self = $(this);
            var accordion = Self.find(".accrodion");
            Self.addClass(accrodionName);
            Self.find(".accrodion .accrodion-content").hide();
            Self.find(".accrodion.active").find(".accrodion-content").show();
            accordion.each(function () {
                $(this)
                    .find(".accrodion-title")
                    .on("click", function () {
                        if ($(this).parent().hasClass("active") === false) {
                            $(".accrodion-grp." + accrodionName)
                                .find(".accrodion")
                                .removeClass("active");
                            $(".accrodion-grp." + accrodionName)
                                .find(".accrodion")
                                .find(".accrodion-content")
                                .slideUp();
                            $(this).parent().addClass("active");
                            $(this).parent().find(".accrodion-content").slideDown();
                        }
                    });
            });
        });
    }

    function SmoothMenuScroll() {
        var anchor = $(".scrollToLink");
        if (anchor.length) {
            anchor.children("a").bind("click", function (event) {
                if ($(window).scrollTop() > 10) {
                    var headerH = "90";
                } else {
                    var headerH = "90";
                }
                var target = $(this);
                $("html, body")
                    .stop()
                    .animate(
                        {
                            scrollTop: $(target.attr("href")).offset().top - headerH + "px",
                        },
                        1200,
                        "easeInOutExpo"
                    );
                anchor.removeClass("current");
                anchor.removeClass("current-menu-ancestor");
                anchor.removeClass("current_page_item");
                anchor.removeClass("current-menu-parent");
                target.parent().addClass("current");
                event.preventDefault();
            });
        }
    }
    SmoothMenuScroll();

    function OnePageMenuScroll() {
        var windscroll = $(window).scrollTop();
        if (windscroll >= 117) {
            var menuAnchor = $(".one-page-scroll-menu .scrollToLink").children("a");
            menuAnchor.each(function () {
                var sections = $(this).attr("href");
                $(sections).each(function () {
                    if ($(this).offset().top <= windscroll + 100) {
                        var Sectionid = $(sections).attr("id");
                        $(".one-page-scroll-menu").find("li").removeClass("current");
                        $(".one-page-scroll-menu").find("li").removeClass("current-menu-ancestor");
                        $(".one-page-scroll-menu").find("li").removeClass("current_page_item");
                        $(".one-page-scroll-menu").find("li").removeClass("current-menu-parent");
                        $(".one-page-scroll-menu")
                            .find("a[href*=\\#" + Sectionid + "]")
                            .parent()
                            .addClass("current");
                    }
                });
            });
        } else {
            $(".one-page-scroll-menu li.current").removeClass("current");
            $(".one-page-scroll-menu li:first").addClass("current");
        }
    }

    gsap.registerPlugin(ScrollTrigger, SplitText);
    gsap.config({
        nullTargetWarn: false,
        trialWarn: false,
    });

    function tg_title_animation() {
        var tg_var = jQuery(".tg-heading-subheading");
        if (!tg_var.length) {
            return;
        }
        const quotes = document.querySelectorAll(".tg-heading-subheading .tg-element-title");

        quotes.forEach((quote) => {
            //Reset if needed
            if (quote.animation) {
                quote.animation.progress(1).kill();
                quote.split.revert();
            }

            var getclass = quote.closest(".tg-heading-subheading").className;
            var animation = getclass.split("animation-");
            if (animation[1] == "style4") return;

            quote.split = new SplitText(quote, {
                type: "lines,words,chars",
                linesClass: "split-line",
            });
            gsap.set(quote, { perspective: 400 });

            if (animation[1] == "style1") {
                gsap.set(quote.split.chars, {
                    opacity: 0,
                    y: "90%",
                    rotateX: "-40deg",
                });
            }
            if (animation[1] == "style2") {
                gsap.set(quote.split.chars, {
                    opacity: 0,
                    x: "50",
                });
            }
            if (animation[1] == "style3") {
                gsap.set(quote.split.chars, {
                    opacity: 0,
                });
            }
            quote.animation = gsap.to(quote.split.chars, {
                scrollTrigger: {
                    trigger: quote,
                    start: "top 90%",
                },
                x: "0",
                y: "0",
                rotateX: "0",
                opacity: 1,
                duration: 1,
                ease: Back.easeOut,
                stagger: 0.02,
            });
        });
    }
    ScrollTrigger.addEventListener("refresh", tg_title_animation);

    // window load event
    $(window).on("load", function () {
        thmSwiperInit();
        thmOwlInit();
        projectMasonaryLayout();
        handlePreloader();
        fullHeight();
        tg_title_animation();

        //Jquery Spinner / Quantity Spinner
        if ($(".quantity-spinner").length) {
            $("input.quantity-spinner").TouchSpin({
                verticalbuttons: true,
            });
        }

        //Jquery Curved Circle
        if ($(".curved-circle").length) {
            $(".curved-circle").circleType({
                position: "absolute",
                dir: 1,
                radius: 70,
                forceHeight: true,
                forceWidth: true,
            });
        }
    });

    // window scroll event
    $(window).on("scroll", function () {
        //Stricked Menu Fixed
        if ($(".stricked-menu").length) {
            var headerScrollPos = 130;
            var stricky = $(".stricked-menu");
            if ($(window).scrollTop() > headerScrollPos) {
                stricky.addClass("stricky-fixed");
            } else if ($(this).scrollTop() <= headerScrollPos) {
                stricky.removeClass("stricky-fixed");
            }
        }

        //Scroll To Top
        if ($(".scroll-to-top").length) {
            var strickyScrollPos = 100;
            if ($(window).scrollTop() > strickyScrollPos) {
                $(".scroll-to-top").fadeIn(500);
            } else if ($(this).scrollTop() <= strickyScrollPos) {
                $(".scroll-to-top").fadeOut(500);
            }
        }

        OnePageMenuScroll();
    });

    if ($(".scroll-to-target").length) {
        $(".scroll-to-target").on("click", function () {
            var target = $(this).attr("data-target");
            // animate
            $("html, body").animate(
                {
                    scrollTop: $(target).offset().top,
                },
                100
            );

            return false;
        });
    }

    $(document).ready(function () {
        $("select:not(.ignore)").niceSelect();
    });

    // Jquery Dependency
    $("input[data-type='currency']").on({
        keyup: function () {
            formatCurrency($(this));
        },
        blur: function () {
            formatCurrency($(this), "blur");
        },
    });

    if ($(".contact-form-validated").length) {
        $(".contact-form-validated").each(function () {
            let self = $(this);
            self.validate({
                // initialize the plugin
                rules: {
                    name: {
                        required: true,
                    },
                    email: {
                        required: true,
                        email: true,
                    },
                    message: {
                        required: true,
                    },
                    subject: {
                        required: true,
                    },
                },
                submitHandler: function (form) {
                    // sending value with ajax request
                    $.post($(form).attr("action"), $(form).serialize(), function (response) {
                        $(form).parent().find(".result").append(response);
                        $(form).find('input[type="text"]').val("");
                        $(form).find('input[type="email"]').val("");
                        $(form).find("textarea").val("");
                    });
                    return false;
                },
            });
        });
    }
})(jQuery);

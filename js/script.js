
$(document).ready(function () {
    /* ------------------- Preloader ------------------- */
    $(window).on("load", function(){
        $(".preloader").fadeOut("slow");
    });

    /* ------------------- Navbar Shrink ------------------- */
    $(window).on("scroll", function(){
        if($(this).scrollTop() > 90){
            $(".navbar").addClass("navbar-shrink");
        }
        else{
            $(".navbar").removeClass("navbar-shrink");
        }
    });

    /* ------------------- VIDEO POPUP ------------------- */
    const videoSrc = $("#player-1").attr("src");
    
    $(".video-play-btn, .video-popup").on("click", function(){
        if($(".video-popup").hasClass("open")){
            $(".video-popup").removeClass("open");
            $("#player-1").atrr("src", "");
        }
        else{
            $(".video-popup").addClass("open");
            if($("#player-1").attr("src") == ''){
                $("#player-1").attr("src", videoSrc);
            }
        }
    });

    /* ------------------- OWL CAROUSEL ------------------- */
    $('.features-carousel').owlCarousel({
        loop:true,
        margin:0,
        autoplay: true,
        responsiveClass:true,
        responsive:{
            0:{
                items:1,
            },
            600:{
                items:2,
            },
            1000:{
                items:3,
            }
        }
    });

    /* ------------------- NAVBAR COLLAPSE ------------------- */
    $(".nav-link").on("click", function(){
        $(".navbar-collapse").collapse("hide");
    });

    /* ------------------------- FAQ ------------------------- */
    var acc = document.getElementsByClassName("accordion");
    var i;
    var len = acc.length;
    for (i = 0; i < len; i++) {
        acc[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
            } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    }
    

    /* ------------------- TOGGLE THEME ------------------- */
    function toggleTheme(){
        if(localStorage.getItem("MoonsSwap Theme") !== null){
            if(localStorage.getItem("MoonsSwap Theme") === "dark"){
                $("body").addClass("dark");
            }
            else{
                $("body").addClass("light");
            }
        }
        updateIcon();
    };
    toggleTheme();
    $(".toggle-theme").on("click", function (){
        $("body").toggleClass("dark");
        if($("body").hasClass("dark")){
            localStorage.setItem("MoonsSwap Theme", "dark");
        }
        else{
            localStorage.setItem("MoonsSwap Theme", "light");
        }
        updateIcon();
    });
    function updateIcon(){
        if($("body").hasClass("dark")){
            $(".toggle-theme i").removeClass("fa-moon");
            $(".toggle-theme i").addClass("fa-sun");
        }
        else{
            $(".toggle-theme i").removeClass("fa-sun");
            $(".toggle-theme i").addClass("fa-moon");
        }
    };
    (function() {
        var images = [
          {
            url:  "img/showcase_1.webp"
          },
          {
            url:  "img/showcase_2.webp"
          },
          {
            url:  "img/showcase_3.webp"
          },
          {
            url:  "img/showcase_4.webp"
          }
        ];
        var image = images[Math.floor(Math.random() * images.length)];
        document.getElementById("image").innerHTML = '<img src="' + image.url + '" alt="Image of the subreddit">';
    })();
});
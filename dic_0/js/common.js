var commonUrl = "./";

var touchstart = "mousedown";
var touchmove = "mousemove";
var touchend = "mouseup";

var isMobile = false;

var isIE11 = navigator.userAgent.match("Trident/7.0") ? true : false;

if (
  navigator.userAgent.match(/Android/i) ||
  navigator.userAgent.match(/webOS/i) ||
  navigator.userAgent.match(/iPhone/i) ||
  navigator.userAgent.match(/iPad/i) ||
  navigator.userAgent.match(/iPod/i) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
  navigator.userAgent.match(/BlackBerry/i) ||
  (navigator.userAgent.match(/Windows Phone/i) && "ontouchend" in document)
) {
  touchstart = "touchstart";
  touchmove = "touchmove";
  touchend = "touchend";

  isMobile = true;
}

//documentReady
$(function () {
  //프로젝트 메인 생성
  $("*[data-ui='resize-window']").each(function (i) {
    var option = $(this).attr("data-option") ? $.parseJSON($(this).attr("data-option")) : {};
    $(this).resizeWindow(option);
  });
});

/**
 * 리사이즈 컨텐츠
 */
var contentWidth = 1280;
var contentHeight = 720;

(function ($) {
  "use strict";
  var ResizeWindow =
    ResizeWindow ||
    (function () {
      return Class.extend({
        init: function (element, options) {
          var owner = this;
          this.element = element;
          this.options = {};
          $.extend(this.options, options);

          if (!this.options.resize) return;

          contentWidth = this.element.width();
          contentHeight = this.element.height();

          this.element.css("position", "absolute");
          this.element.css("transform-origin", "0 0");
          $(window).on("resize", function () {
            var winWidth = $(window).width();
            var winHeight = $(window).height();
            var scaleX = winWidth / contentWidth;
            var scaleY = winHeight / contentHeight;
            var scale = Math.min(scaleX, scaleY);
            window.scale = scale;

            // transform-origin: 0 0;
            var left = 0;
            if (winWidth > contentWidth * scale) {
              left = (winWidth - contentWidth * scale) / 2;
            }
            var top = (winHeight - contentHeight * scale) / 2;
            if (owner.options.offsetTop) top = parseInt(owner.options.offsetTop.replace("px", ""));

            owner.element[0].style.transform = "scale(" + scale + ")";
            owner.element[0].style.left = left + "px";
            owner.element[0].style.top = top + "px";
          });

          $(window).on("load", function () {
            $(window).trigger("resize");
          });
        },

        getTest: function () {
          return "test";
        },
      });
    })();

  // 기본 옵션
  ResizeWindow.DEFAULT = { resize: false };

  function Plugin(option, params) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data("ui.resizeWindow");
      var options = $.extend({}, ResizeWindow.DEFAULT, typeof option == "object" && option);
      if (!data) $this.data("ui.resizeWindow", (data = new ResizeWindow($this, options)));
      if (typeof option == "string") data[option](params);
      $this.data("instance", data);
    });
  }

  window.ResizeWindow = ResizeWindow;

  $.fn.resizeWindow = Plugin;
  $.fn.resizeWindow.Constructor = ResizeWindow;
})(jQuery);

/*
 * 제이쿼리 확장
 */
(function ($) {
  $.extend({
    //파라메터 전체 가져오기
    getUrlVars: function () {
      var vars = [],
        hash;
      var hashes = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&");
      for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split("=");
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
      }
      return vars;
    },

    //파라메터 네임으로 가져오기
    getUrlVar: function (name) {
      return $.getUrlVars()[name];
    },

    //랜덤 만들기
    makeRandom: function (randomNum, arNum) {
      var randomAr = new Array();
      var rand = new Array();
      var temp = new Array();
      var r, p, i;

      for (i = 0; i < randomNum; i++) {
        temp[i] = i;
      }

      for (i = 0; i < randomNum; i++) {
        r = Math.floor(Math.random() * (randomNum - i));
        p = temp[r];
        randomAr[i] = p;
        for (var j = r; j < randomNum - i - 1; j++) {
          temp[j] = temp[j + 1];
        }
      }

      for (i = 0; i < arNum; i++) {
        rand[i] = randomAr[i];
      }

      return rand;
    },

    //앞뒤 공백제거
    trim: function (str) {
      return str.replace(/(^\s*)|(\s*$)/gi, "");
    },

    //앞문자 공백제거
    trimLeft: function (str) {
      return str.replace(/^\s*/g, "");
    },

    //뒤문자 공백제거
    trimRight: function (str) {
      return str.replace(/\s*$/g, "");
    },

    //  앞에 0 붙히기
    pad: function (num, size) {
      var s = "0000" + num;
      return s.substr(s.length - size);
    },

    //배열 비교
    complement: function (a, b) {
      var res = [];
      var tmp = [];
      for (var i = 0; i < a.length; i++) tmp.push(a[i]);
      for (var i = 0; i < b.length; i++) {
        if (tmp[i] && b[i]) res.push(true);
        else res.push(false);
      }
      return res;
    },

    //
    getRangeToArray: function (arr) {
      var value = arr;
      if (arr.length > 1) {
        var n1 = parseInt(arr[0]);
        var n2 = parseInt(arr[1]);
        value = [];
        for (var i = n1; i <= n2; i++) {
          value.push(i);
        }
      }
      return value;
    },

    // ie11 이하
    checkBroswerIE: function () {
      var agent = navigator.userAgent.toLowerCase();
      if ((navigator.appName == "Netscape" && navigator.userAgent.search("Trident") != -1) || agent.indexOf("msie") != -1) {
        return true;
      }
      return false;
    },

    // 숫자 오름차순 정렬
    numberSortAsc: function (a, b) {
      return a - b;
    },

    // 숫자 내림차순 정렬
    numberSortDesc: function (a, b) {
      return b - a;
    },
  });

  $.fn.extend({
    getTransform: function () {
      var value = undefined;
      var matrixStr = this.css("transform");
      if (matrixStr == "none" || matrixStr == undefined) return value;
      var matrixArr = matrixStr.split("(")[1].split(")")[0].split(",");
      if (matrixArr.length > 0) {
        value = {};

        var a = matrixArr[0];
        var b = matrixArr[1];
        var c = matrixArr[2];
        var d = matrixArr[3];

        value.scale = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
        var radian = Math.atan2(b, a);
        value.angle = Math.round(radian * (180 / Math.PI));
        value.angle = value.angle < 0 ? value.angle + 360 : value.angle;

        value.x = matrixArr[13] || matrixArr[4];
        value.y = matrixArr[14] || matrixArr[5];
        value.x = Math.round(value.x / value.scale);
        value.y = Math.round(value.y / value.scale);
      }

      return value;
    },

    animateRotateY: function (sangle, angle, duration, easing, complete) {
      var args = $.speed(duration, easing, complete);
      var step = args.step;
      return this.each(function (i, e) {
        args.complete = $.proxy(args.complete, e);
        args.step = function (now) {
          $(e).data("rotateY", now);
          $.style(e, "transform", "rotateY(" + now + "deg)");
          if (step) return step.apply(e, arguments);
        };

        $({ deg: sangle }).animate({ deg: angle }, args);
      });
    },
  });
})(jQuery);

//documentReady
$(function () {
  //프로젝트 메인 생성
  $("*[data-ui='popup']").each(function (i) {
    var option = $(this).attr("data-option") ? $.parseJSON($(this).attr("data-option")) : {};
    $(this).popup(option);
  });
});

/*
 *	오디오 컨트롤
 */
(function ($) {
  "use strict";

  var AudioControl =
    AudioControl ||
    (function () {
      /*
       * @ private 오디오 초기화
       * @ return void
       */
      function initAudio() {
        var owner = this;

        if (this.options.preload) {
          $(this.audio);
          this.audio = $("<audio preload='" + this.options.preload + "'><source src='" + this.source + "' type='audio/mpeg' /></audio>")[0];
        } else {
          this.audio = $("<audio preload='none'><source src='" + this.source + "' type='audio/mpeg' /></audio>")[0];
        }

        if ($("body").find("#audio-container").length < 1) {
          $("body").append($('<div id="audio-container"></div>'));
        }
        $("body #audio-container").append($(this.audio));

        AudioControl.audioList.push(this.audio);
      }

      /*
       * @ private 오디오 업데이트 이벤트
       * @ return void
       */
      function onUpdate() {
        $(this.audio).trigger("ON_UPDATE", { target: this });
        if (this.audio.currentTime >= this.audio.duration) {
          this.audio.pause();
          this.audio.currentTime = 0;
          if (this.options.onUpdate) this.options.onUpdate(this.audio, 1);
          if (this.options.onFinish) this.options.onFinish(this.audio, { type: "normal" });

          if (this.loop) {
            this.audio.play();
          } else {
            clearInterval(this.timer);
          }
        } else {
          var currentTime = this.audio.currentTime;
          var totalTime = this.audio.duration;
          var percent = this.audio.currentTime / this.audio.duration;
          if (this.options.onUpdate) this.options.onUpdate(this.audio, percent);
        }
      }

      return Class.extend({
        /*
         * @ public constructor
         * @ params {source:String 소스경로, options:JSONObject 옵션}
         * @ return void
         */
        init: function (source, options) {
          this.audio;
          this.source = source;
          this.timer;

          this.options = { onFinish: null, onUpdate: null, loop: false };
          $.extend(this.options, options);
          initAudio.call(this);
        },

        /*
         * @ public 오디오 플레이
         * @ params {seek:Number 시작 타임}
         * @ return void
         */
        play: function (seek) {
          if (this.audio.paused) {
            if (seek) {
              this.audio.currentTime = this.audio.duration * seek;
            }
            var playPromise = this.audio.play();
            if (playPromise !== undefined) {
              playPromise.then(function () {}).catch(function (error) {});
            }

            this.timer = setInterval($.proxy(onUpdate, this), 1000 / 30);
            onUpdate.call(this);
          }
        },

        /*
         * @ public 오디오 일시정지
         * @ return void
         */
        pause: function () {
          if (!this.audio.paused) {
            this.audio.pause();
            clearInterval(this.timer);
          }
        },

        /*
         * @ public 오디오 정지
         * @ return void
         */
        stop: function () {
          if (!this.audio.paused) {
            this.audio.pause();
            if (this.audio.currentTime > 0) this.audio.currentTime = 0;
            clearInterval(this.timer);
          }
          $(this.audio).trigger("ON_STOP");
        },

        /*
         * @ public 오디오 제거
         * @ return void
         */
        dispose: function () {
          $(this.audio).remove();
          this.audio = null;
          clearInterval(this.timer);
        },
      });
    })();

  AudioControl.audioList = [];
  window.AudioControl = AudioControl;
})(jQuery);

/**
 * 	Global Audio :: Static Plugin
 */
(function ($) {
  "use strict";

  var GlobalAudio =
    GlobalAudio ||
    function () {
      var list = {};
      var nowAudio = null;

      var instance = {
        init: function () {
          this.addAudio("button", commonUrl + "audio/button.mp3");

          return this;
        },
        addAudio: function (id, src) {
          var control = new AudioControl(src, {
            preload: "auto",
            onFinish: function () {
              nowAudio = null;
            },
          });
          list[id] = control;
        },
        play: function (id) {
          if (id == "" || id == null || id == undefined) return;

          if (nowAudio != null) nowAudio.stop();
          nowAudio = list[id];
          if (nowAudio) nowAudio.play();
        },
        pause: function () {
          nowAudio.pause();
        },
        getAudio: function (id) {
          return list[id];
        },
        getNowAudio: function () {
          return nowAudio;
        },
      };
      return instance;
    };

  window.GlobalAudio = new GlobalAudio().init();
})(jQuery);

/*
 *	Popup :: Class
 */
(function ($) {
  "use strict";

  var Popup =
    Popup ||
    (function () {
      function initFn() {
        var owner = this;

        // 열기 버튼
        if (this.toggleBtn) {
          $(this.toggleBtn).on("click", function () {
            GlobalAudio.play("button");
            checkOpen.call(owner);
          });
        }

        this.element.find(".btn-close").on("click", function () {
          GlobalAudio.play("button");
          owner.close();
        });
      }

      function checkOpen() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
          if (this.toggleBtn) this.toggleBtn.addClass("active");
          this.element.addClass("active");
          $("body").addClass("popup-open");
          this.element.trigger("POPUP_OPEN", { target: this.element });
        } else {
          if (this.toggleBtn) this.toggleBtn.removeClass("active");
          this.element.removeClass("active");
          $("body").removeClass("popup-open");
          this.element.trigger("POPUP_CLOSE", { target: this.element });
        }
      }

      return Class.extend({
        init: function (element, options) {
          this.element = element;
          this.options = {};
          $.extend(this.options, options);

          this.isOpen = false;
          this.toggleBtn;
          if (this.options.btn) this.toggleBtn = $(this.options.btn);
          this.slideIndex = 0;

          initFn.call(this);
        },

        open: function () {
          this.isOpen = false;
          checkOpen.call(this);
        },

        close: function () {
          var owner = this;

          // 스크롤 박스 리셋
          if (!this.element.hasClass("popup-dim")) {
            var scrollBoxs = $(".scroll-box").not('[data-reset="false"]');
            scrollBoxs.each(function (i) {
              var scrollBox = $(this).data("scrollbar");
              if (scrollBox) {
                scrollBox.scroll(0);
                scrollBox.update();
              }
            });
          }

          setTimeout(function () {
            owner.isOpen = true;
            checkOpen.call(owner);
          }, 10);
        },

        reset: function () {
          this.close();
        },
      });
    })();

  // 기본 옵션
  Popup.DEFAULT = {};

  function Plugin(option, params) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data("ui.popup");
      var options = $.extend({}, Popup.DEFAULT, typeof option == "object" && option);
      if (!data) $this.data("ui.popup", (data = new Popup($this, options)));
      if (typeof option == "string") data[option](params);
      $this.data("instance", data);
    });
  }

  $.fn.popup = Plugin;
  $.fn.popup.Constructor = Popup;
})(jQuery);

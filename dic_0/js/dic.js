$(function () {
  $("*[data-ui='app-dic']").each(function (i) {
    var option = $(this).attr("data-option") ? $.parseJSON($(this).attr("data-option")) : {};
    $(this).appDic(option);
  });
});

/*
 *	AppDic ::
 */
(function ($) {
  "use strict";

  var AppDic =
    AppDic ||
    (function () {
      var instance;
      var view_type = "dic";
      var dic_type_idx = 0;
      var card_type_idx = 0;
      var card_count_idx = 2;
      var card_max = 1;
      var all_list = [];
      var quiz_list = [];  // 여기 추가
      var choice_list = [];
      var random_list = [];
      var page_list = [];
      var page_current = 1;
      var card_page_current = 1;
      var game_check = [];
      var game_page_current = 1;
      var game_page_total = 1;
      var page_total = 1;
      var quiz_total = 1;
      var quiz_lesson = 1;
      var quiz_array = []

      function initFn() {
        var owner = this;

        // 선택 박스 공통
        $(".select-box .select").on("click", function () {
          GlobalAudio.play("button");

          var selectBox = $(this).parents(".select-box");
          $(".select-cont .select-box").not(selectBox).removeClass("open");
          if (selectBox.hasClass("open")) {
            selectBox.removeClass("open");
          } else {
            selectBox.addClass("open");
          }
        });

        // 선택 박스 공통
        $(".select-box .list-box li").on("click", function (e) {
          GlobalAudio.play("button");
          var type = $(this).parents(".select-box-cont").hasClass("lesson") ? "lesson" : "spelling";
          var idx = $(this).index();
          var all = $(this).hasClass("all") ? true : false;
          setList.call(instance, { type: type, target: $(this), idx: idx, all: all });
          choiceListAll.call(instance, "all")
          
          // if($('.view-cont').find('.img').hasClass('remove')){  // 123123
          //   $('.view-cont').css('justify-content','normal');
          //   $('.view-cont').css('flex-flow','');
          // } else {
          //   $('.view-cont').css('justify-content','space-around');
          // }
        });

        // 스크롤바 디자인 적용
        $(".scroll-box").each(function () {
          let instance = $(this)
            .overlayScrollbars({
              overflowBehavior: {
                x: "hidden",
                y: "scroll",
              },
            })
            .overlayScrollbars();
          $(this).data("scrollbar", instance);
        });

        // 모바일 아닌 기기에서만 모든 버튼 hover 기능 적용.
        if (!isMobile) {
          $("*[class*='btn']").each(function (i) {
            $(this).on("mouseenter", function (e) {
              $(this).addClass("hover");
              var targetElement = $(this).attr("targetElement");
              if (targetElement) $(targetElement).addClass("hover");
            });
            $(this).on("mouseleave", function (e) {
              $(this).removeClass("hover");
              var targetElement = $(this).attr("targetElement");
              if (targetElement) $(targetElement).removeClass("hover");
            });
          });
        }

        // $("*[class*='btn']").on("click", function(){
        //     GlobalAudio.play("button");
        // });

        // 용어 사전, 낱말 카드 전환 버튼
        this.element.find(".header .btns > .btn").on("click", function () {
          GlobalAudio.play("button");
          var type = $(this).hasClass("dic") ? "dic" : "card";
          var str = $(this).find("> span").text();
          changeView.call(instance, { type: type, str: str });
        });

        this.element.find(".link-manual-btn").on("click", function (e) {
          GlobalAudio.play("button");
          console.log("manual");
          var url = "helper/용어 사전 사용 방법.pdf";

          // var pathData = window.jj ? "../../../data/" : "../../data/";
          var pathData = "./";
          var src = pathData + url;

          // window.alert("src :: "+"/resource/"+url);

          if (window.jj && jj.native && jj.native.exe) window.jj.native.exe(src);
          else window.open(src, "_blank");
        });

        // 검색 기능
        this.element.find(".search input").on("focusin", function (e) {
          var container = $(this).parents(".container");
          container.addClass("focus");
        });
        this.element.find(".search input").on("focusout", function (e) {
          var container = $(this).parents(".container");
          container.removeClass("focus");
        });
        this.element.find(".search input").on("keydown", function (e) {
          if (e.keyCode == 13) {
            var str = $(this).val();
            searchWord.call(instance, str);
          }
        });
        this.element.find(".search .ico").on("click", function (e) {
          GlobalAudio.play("button");
          var str = instance.element.find(".search input").val();
          searchWord.call(instance, str);
        });

        // 용어 사전 확대 기능
        this.element.find(".view-dic #btn-zoomin").on("click", function () {
          GlobalAudio.play("button");
          if (!$(this).hasClass("active")) {                       
            $(this).addClass("active");
            zoomin.call(instance);
            $('.view-cont').find('.mean').css('order',2)                   // 여기 수정했음
            $('.view-cont').find('.mean').css('margin-bottom',"20px")                   
            $('.view-cont').find('.img').css('order',1)            
            $('.view-cont').find('.img').css('margin-bottom',"20px")                   
            $('.zoomin .view-cont').find('.mean').css("width","50%")
            $('.zoomin .view-cont').css('flex-wrap','wrap');
            $('.zoomin .view-cont').css('flex-direction','row');
            $('.zoomin .view-cont').css('justify-content','space-around');  
            $('.zoomin .view-cont .mean').css("padding","20px 40px 20px 0")
            $('.zoomin .view-cont .mean').css("align-items","center")
            $('.zoomin .view-cont .mean span').css("font-size","46px")
            $(".view-dic .view-cont .word > span").css("font-size","55px")
            if($('.zoomin .view-cont').find('.img').hasClass('remove')){
              $('.zoomin .view-cont').find('.mean').css("width","1180px")
              $('.zoomin .view-cont').css('flex-wrap','nowrap');
              $('.zoomin .view-cont').css('flex-direction','column');
              $('.zoomin .view-cont').css('justify-content','space-around');
              $('.zoomin .view-cont .mean').css("padding","20px 90px")    
              $('.zoomin .view-cont .mean span').css("font-size","50px")
            }                      
          } else {
          $(this).removeClass("active");
          $('.zoomin .view-cont').find('.mean').css("width","750px")
          $('.view-cont').find('.mean').css('order',1)            
          $('.view-cont').find('.mean').css('margin-bottom',"")    
          $('.view-cont .mean').css("padding","20px")
          $('.view-cont .mean').css("align-items","")
          $('.view-cont').find('.img').css('order',2)  
          $('.view-cont').find('.img').css('margin-bottom',"")            
          $('.zoomin .view-cont').css('justify-content','normal');
          $('.view-cont').css('flex-flow','');  
          $('.zoomin .view-cont .mean span').css("font-size","38px")
            zoomout.call(instance);
          }
          if(!$(this).hasClass("active") ){
            $(".explain-mean").css("font-size","38px")
            if($('.view-cont').find('.word.box span').eq(0).text().length >= 16){
              $(".view-dic .view-cont .word > span").css("font-size","43px")
              $(".view-dic .view-box .word").css("margin-top","32px")
            } else {
              $(".view-dic .view-cont .word > span").css("font-size","55px")
              $(".view-dic .view-box .word").css("margin-top","30px")
            }
            if($('.view-cont').find('.word.box span').eq(0).hasClass("3") && $('.view-cont').find('.word.box span').eq(0).hasClass("19") ||
            $('.view-cont').find('.word.box span').eq(0).hasClass("3") && $('.view-cont').find('.word.box span').eq(0).hasClass("20") ||
            $('.view-cont').find('.word.box span').eq(0).hasClass("3") && $('.view-cont').find('.word.box span').eq(0).hasClass("21")){
                $(".explain-mean").css("font-size","41px")
              }
            if($(".explain-mean").text().length >= 69 && !$('.view-cont').find('.img').hasClass("remove")){
              $(".explain-mean").css("font-size","36px")
              $(".explain-mean").css("line-height","1.4em")
            }
            if($(".example-mean").text().length >= 69 && !$('.view-cont').find('.img').hasClass("remove")){
              $(".example-mean").css("font-size","32px")
              $(".example-mean").css("line-height","1.4em")
            }
          }
        });
        
        // if((part === 3 && index === 19) || (part === 3 && index === 20) || (part === 3 && index === 21)){
        //   $(".explain-mean").css("font-size","41px")
        // }
        // 용어 사전 보기 설정 기능
        $(".popup-dic-setting .option .item").on("click", function () {
          GlobalAudio.play("button");
          $(this).siblings().removeClass("active");
          $(this).addClass("active");
          dic_type_idx = $(this).index();
        });
        $(".popup-dic-setting").on("POPUP_CLOSE", function () {
          viewDicSetting.call(instance);
        });

        // 낱말 카드 보기 설정 기능
        $(".popup-card-setting .option .item").on("click", function () {
          GlobalAudio.play("button");
          $(this).siblings().removeClass("active");
          $(this).addClass("active");
          if ($(this).parents(".option").hasClass("check")) {
            card_type_idx = $(this).index();
          } else {
            card_count_idx = $(this).index();
          }
        });
        $(".popup-card-setting").on("POPUP_CLOSE", function () {
          viewCardSetting.call(instance);
        });

        // $(".popup-image").on("POPUP_CLOSE", function (e) {
        //   let target = e.target;
        //   console.log(target);
        // });

        // 설명 보기, 예문 보기 버튼 
        $(".pager > .mean-view-btns > .explain-btn").on("click",function(){
          GlobalAudio.play("button")
          $(".pager > .mean-view-btns > .explain-btn").addClass("active")
          $(".pager > .mean-view-btns > .example-btn").removeClass("active")
          $(".explain-mean").css("display","block")
          $(".example-mean").css("display","none")
        })
        $(".pager > .mean-view-btns > .example-btn").on("click",function(){
          GlobalAudio.play("button")
          $(".pager > .mean-view-btns > .explain-btn").removeClass("active")
          $(".pager > .mean-view-btns > .example-btn").addClass("active")
          $(".explain-mean").css("display","none")
          $(".example-mean").css("display","block")
        })

        // 페이지 기능
        this.element.find(".pager-cont .btn-prev").on("click", function () {   // 여기 수정했음
          GlobalAudio.play("button");
          movePage.call(instance, -1,1);

          if($('.zoomin .view-cont').find('.img').hasClass('remove')){
            $('.zoomin .mean').css('width','1180px')
            $('.zoomin .view-cont').css('flex-wrap','nowrap');
            $('.zoomin .view-cont').css('flex-direction','column');
            // $('.zoomin .view-cont').css('justify-content','normal');
            $('.zoomin .view-cont').css('justify-content','space-around');
            $('.zoomin .view-cont .mean').css("padding","20px 90px")
            $('.zoomin .view-cont .mean span').css("font-size","50px")
          } else {
            $('.zoomin .mean').css('width','50%')
            $('.zoomin .view-cont').css('flex-wrap','wrap');
            $('.zoomin .view-cont').css('flex-direction','row');
            $('.zoomin .view-cont').css('justify-content','space-around');
            $('.zoomin .view-cont .mean').css("padding","20px 40px 20px 0")
            $('.zoomin .view-cont .mean span').css("font-size","46px")
            // $('.zoomin .view-cont').css('justify-content','normal');
          }
        });
        this.element.find(".pager-cont .btn-next").on("click", function () {
          GlobalAudio.play("button");
          movePage.call(instance, 1,1);

          if($('.zoomin .view-cont').find('.img').hasClass('remove')){
            $('.zoomin .mean').css('width','1180px')
            $('.zoomin .view-cont').css('flex-wrap','nowrap');
            $('.zoomin .view-cont').css('flex-direction','column');
            // $('.zoomin .view-cont').css('justify-content','normal');
            $('.zoomin .view-cont').css('justify-content','space-around');
            $('.zoomin .view-cont .mean').css("padding","20px 90px")
            $('.zoomin .view-cont .mean span').css("font-size","50px")
          } else {
            $('.zoomin .mean').css('width','50%')
            $('.zoomin .view-cont').css('flex-wrap','wrap');
            $('.zoomin .view-cont').css('flex-direction','row');
            $('.zoomin .view-cont').css('justify-content','space-around');
            $('.zoomin .view-cont .mean').css("padding","20px 40px 20px 0")
            $('.zoomin .view-cont .mean span').css("font-size","46px")
            // $('.zoomin .view-cont').css('justify-content','normal');
          }
        });

        this.element.find(".btn-choice-all").on("click", function () {
          GlobalAudio.play("button");
          if (!$(this).hasClass("active")) {
            choiceListAll.call(instance, "all");
          } else {
            choiceListAll.call(instance, "one");
          }
        });


        
        function quiz_default(){
          $('.choice-list-box .quiz_list li').eq(0).addClass("active")
          var quiz_lesson_data = quiz_list.filter(data => data.part === 0)

            for(let i = 0; i < quiz_lesson_data.length; i++){
              quiz_array.push(quiz_lesson_data[i])
            }
            quiz_total = quiz_array.length
            // movePage.call($(this), 0,1);
        }

        this.element.find(".quiz_btn-choice-all").on("click", function () {
          var add = 0
          GlobalAudio.play("button");
          if (!$(this).hasClass("active")) {
            $(this).addClass("active")
            add = 1
            // choiceListAll.call(instance, "all");
            quiz_array = []
            $(".quiz_list .btn-choice").each(function(){
              $(this).addClass("active");
            })

            for(let i = 0; i < quiz_list.length; i++){
              quiz_array.push(quiz_list[i])
            }
            // quiz_array.push(quiz_list)
            
          } else {
            $(this).removeClass("active")
            // choiceListAll.call(instance, "one");
            quiz_array = []
            $(".quiz_list .btn-choice").each(function(){
              $(this).removeClass("active");
            })

            // quiz_array.push(quiz_list.filter(data => data.part === 0))
            var quiz_lesson_data = quiz_list.filter(data => data.part === 0)

            for(let i = 0; i < quiz_lesson_data.length; i++){
              quiz_array.push(quiz_lesson_data[i])
            }


            $(".quiz_list .btn-choice").eq(0).addClass("active")

          }

          quiz_total = quiz_array.length
          movePage.call($(this), 0,1);
          // movePage.call(this, 0);
          // movePage.call(instance, "card");
          // quiz_total = quiz_array.length
        });


        
        
        this.element.find(".quiz_list .btn-choice").on("click", function () {
          var add = 0
          GlobalAudio.play("button");
          if (!$(this).hasClass("active")) {
            // choiceListAll.call(instance, "all");
            $(this).addClass("active")
            
            add = 1
            // quiz_lesson = ($(this).find(".part").text()) - 1
            quiz_lesson = $(this)[0].value

            var quiz_lesson_data = quiz_list.filter(data => data.part === quiz_lesson)

            for(let i = 0; i < quiz_lesson_data.length; i++){
              quiz_array.push(quiz_lesson_data[i])
            }

            // console.log($(this).find(".part").text());
          } else if ($(".quiz_list .btn-choice.active").length === 1){
              return ;
          }  else {
            // choiceListAll.call(instance, "one");
            $(this).removeClass("active")
            // quiz_lesson = ($(this).find(".part").text()) - 1
            quiz_lesson = $(this)[0].value

            // quiz_array = quiz_array.filter(data => data.part !== quiz_lesson)
            // let aa = quiz_array.filter(data => data.part !== quiz_lesson)
            for(let i = 0; i < quiz_array.length; i++){
              if(quiz_array[i].part === quiz_lesson) {
                quiz_array.splice(i,1);
                i--
              }
            }
            
          }
          quiz_total = quiz_array.length
          movePage.call($(this)[0], 0,1);
        });


        this.element
          .find(".view-card")
          .find(".view-cont .card .btn-image")
          .on("click", function (e) {
            GlobalAudio.play("button");
            let target = e.target;
            let part = $(target).data("part");
            let index = $(target).data("index");
            openImagePop(part, index);
          });

        // 랜덤팝업 기능
        this.element.find(".view-card .btn.image").on("click", function () {
          if (random_list.length > 0) {
            GlobalAudio.play("button");
            let random = Math.floor(Math.random() * random_list.length);
            openImagePop(random_list[random].part, random_list[random].index);
          }
        });

        // 게임팝업 기능
        this.element.find(".view-card .btn.game").on("click", function () {
          if (page_list.length > 0 && !$(".btn.game").hasClass("active")) {  
            GlobalAudio.play("button");

            $(".btn.game").addClass("active")
            openGamePop();
            // $(".hint").removeClass("active");
            $(".mean.box").css("width","1060px")
          } else {
            closeGamePop();
            // $(".hint").removeClass("active");
            $(".mean.box").css("width","750px")
          }
        });

        $(".popup-game .item").on("click", function (e) {
          let target = e.target;
          if ($(target).hasClass("checked")) {
            $(target).toggleClass("checked", false);
            if ($(target).hasClass("word")) {
              game_check[game_page_current].word = true;
            }  else if ($(target).hasClass("mean")) {   // 여기 게임부분 수정
                game_check[game_page_current].mean = true;
              }
            // else if ($(target).hasClass("image")) {   
            //   game_check[game_page_current].image = true;
            // }
            GlobalAudio.play("button");
          }
        });
        
        // 용어사전 이미지 확대 
        // $(".imgBig").on("click",openImageZoom())
        $(".imgBig").on("click",function(e){
          GlobalAudio.play("button")
          
          let target = e.target;  
            // let part = $(target).parent().data("part");

            // let num = $(target).parent().attr('class').slice(12);
          let num = $(target).parent().attr('class').slice(12)
          let hyphen = num.indexOf("-")
          
          let part = num.slice(0,hyphen)
          let index = num.slice(hyphen + 1)

          openImageZoom(part, index)
        })

        // 용어퀴즈 이미지 확대
        $(".image-zoom").on('click',function(){   // 이미지 확대 수정해야함
          // console.log($(".view-box .card").find(".word span").text());
          GlobalAudio.play("button")
          let num = $(".view").find(".card").attr("class").slice(10)
          let hyphen = num.indexOf("-")
          
          let part = num.slice(0,hyphen)
          let index = num.slice(hyphen + 1)
          // console.log(index);

          openImageZoom(part, index)
        })
        
        // 퀴즈 힌트 팝업

        GlobalAudio.addAudio("hintOpen", "./audio/모범답안터치시_샤라랑.mp3");

        $(".btn-hint").on("click",function(){  
          // $(".hint").toggleClass("active");
          GlobalAudio.play("button")
          $(".popup-hint").data("instance").open();
          $("#btn-hint").addClass("active")
        })
        $(".popup-hint .hint-initial").on("click",function(){  // 힌트 정답 표시
          GlobalAudio.play("hintOpen")
          $(this).css("display","none")
        })
        $(".popup-hint .btn-close").on("click",function(){
          GlobalAudio.play("button")
          $(".hint-initial").css("display","block")
          $("#btn-hint").removeClass("active")
        })


        function openImageZoom(part,index){
          let image = $(".popup-image-zoom").find(".cont-box .image");
            // image.removeClass();
            // image.toggleClass("image", true);
            // image.addClass(`img-${part}-${index}`);
            // let imgSrc = '../images/content/dic_' + part + '_'+ index + '.png' 
            let imgSrc = './images/content/pop_image_' + part + '_'+ index + '.png' 
            // console.log(imgSrc);
            image.css("background-image", `url("${imgSrc}")`)
            image.css("background-size", "100% 100%")
            // image.css("background-size", "cover")
            image.css("background-repeat", "no-repeat")
            $(".popup-image-zoom").data("instance").open();
        }

        
        // 페이지 기능
        $(".popup-game")
          .find(".pager-cont .btn-prev")
          .on("click", function () {
            GlobalAudio.play("button");
            moveGamePop(game_page_current - 1); 
          });

        $(".popup-game")
          .find(".pager-cont .btn-next")
          .on("click", function () {
            GlobalAudio.play("button");
            moveGamePop(game_page_current + 1);
          });

        // 인쇄 기능
        this.element.find(".view-card .btn.print").on("click", function () {
          GlobalAudio.play("button");

          const beforePrint = () => {
            document.body.classList.toggle("print", true);
          };

          const afterPrint = () => {
            document.body.classList.toggle("print", false);
          };

          if ("matchMedia" in window) {
            window.matchMedia("print").addListener(function (mql) {
              if (mql.matches) {
                beforePrint();
              } else {
                afterPrint();
              }
            });
          } else {
            window.onbeforeprint = beforePrint;
            window.onafterprint = afterPrint;
          }

          window.print();
        });

        // 데이터 정리
        for (var i = 0; i < dicData.part.length; i++) {
          var lessonData = dicData.part[i].list;
          for (var j = 0; j < lessonData.length; j++) {
            var obj = lessonData[j];
            obj.part = i;
            obj.index = j;
            all_list.push(obj);
          }
        }

        var quizData = dicData
        // var quizData = JSON.parse(JSON.stringify(dicData)); 깊은 복사 
        // var ShiftData = quizData.part.shift()

        // for (var i = 0; i < dicData.quiz.length; i++){
          // var quizLessonData = dicData.quiz[i].list;
        for (var i = 0; i < quizData.part.length; i++){
          var quizLessonData = quizData.part[i].list;
          for(var j = 0; j < quizLessonData.length; j++){
            var obj2 = quizLessonData[j];
            obj2.part = i;
            obj2.index = j;
            quiz_list.push(obj2);
          }
        }

        // 순차 정렬
        all_list.sort(function (a, b) {
          return a.word < b.word ? -1 : a.word > b.word ? 1 : 0;
        });

        // quiz_list.sort(function (a, b) {
          // return a.word < b.word ? -1 : a.word > b.word ? 1 : 0;
        // });
        quiz_list.sort(()=>Math.random() - 0.5)

        // 디폴트 셋팅
        // setList.call(instance, {all:true});
        // setList.call(instance, { type: "lesson", target: $(".select-box-cont.lesson .select-box .list-box li").eq(0), idx: 0, all: false });
        setList.call(instance, { type: "lesson", target: $(".select-box-cont.lesson .select-box .text.all").eq(0), all: true });
        choiceListAll.call(instance, "all")
        // $('.choice-list-box .quiz_list li').eq(0).addClass("active")
        quiz_default();
        // console.log(quiz_array);
        // 카드 6장으로 셋팅
        // viewCardSetting.call(instance);
      }

      function searchWord(str) {
        var str1 = $.trim(str);

        if (str1 == "") {
          alert("검색어를 입력해 주세요.");
          return;
        }

        var dummy_list = [];
        str = str.replace(/\s+/g, '').toLowerCase(); // 공백없애기 
        str1 = str.replace(/\s+/g, '').toLowerCase(); // 공백없애기 
        
        // ------------------------------ 1. 단어 포함 검색
        if (this.options.searchType == "word") {
          var strList = str1.split(" ");
          var seart_word_list = [];

          for (var i = 0; i < strList.length; i++) {
            str1 = strList[i];

            for (var j = 0; j < all_list.length; j++) {
              var obj = all_list[j];
              var word = obj.word;
              word = word.replace(/\s+/g, '').toLowerCase(); // 공백없애기 
              var bool = word.match(str1);
              var bool2 = seart_word_list.indexOf(word);
              if (bool && bool2 < 0) {
                dummy_list.push(obj);
                seart_word_list.push(word);
              }
            }
          }
        }

        // ------------------------------------  2. 초성 검색
        else if (this.options.searchType == "spell") {
          var strArr = str1.split("");
          var strSpellArr = [];

          for (var i = 0; i < strArr.length; i++) {
            var arr = getSpell(strArr[i]);
            strSpellArr.push(arr);
          }

          for (var i = 0; i < all_list.length; i++) {
            var obj = all_list[i];
            var word = obj.word;
            word = word.replace(/\s+/g, '').toLowerCase(); // 공백없애기 
            var bool = matchWord(strSpellArr, word);
            if (bool) dummy_list.push(obj);
          }
        }

        // 순차 정렬
        dummy_list.sort(function (a, b) {
          return a.word < b.word ? -1 : a.word > b.word ? 1 : 0;
        });

        setList.call(instance, { type: "search", list: dummy_list });
      }

      function setList(data) {
        var dummy_list = [];

        if (!data) return;

        // 단원 선택
        if (data.type == "lesson") {
          for (var i = 0; i < all_list.length; i++) {
            var obj = all_list[i];
            // console.log(data.idx);
            // if(data.idx == 0){   // 전체 단원 수정
              // dummy_list.push(all_list[i]);
            // }
            if (obj.part == data.idx) {
              dummy_list.push(obj);
            }
          }

          if (dummy_list.length > 0) {
            var html = data.target.find(".text").html();
            var selectBox = data.target.parents(".select-box");
            selectBox.removeClass("open");
            selectBox.find(".select .text").html(html);
            selectBox.find(".select .text").removeClass("all");

            this.element.find(".select-box-cont.spelling .select > .text").text("전체");
            // this.element.find(".select-box-cont.spelling .select > .text").text("ㄱㄴㄷ");
            this.element.find(".select-box-cont.spelling .select > .text").addClass("all");

            this.element.find(".select-box-cont.lesson .select-box").attr("select", "on");
            this.element.find(".select-box-cont.spelling .select-box").attr("select", "");
          }
        }

        // 자음 선택
        if (data.type == "spelling") {
          console.log("자음 선택" + spell);
          var spell = data.target.text();

          for (var i = 0; i < all_list.length; i++) {
            var obj = all_list[i];
            var word = obj.word;

            var bool = matchCho(spell, word);
            if (bool) dummy_list.push(obj);
          }

          // lesson select box reset
          if (dummy_list.length > 0) {
            var html = data.target.html();
            var selectBox = data.target.parents(".select-box");
            selectBox.removeClass("open");
            selectBox.find(".select .text").html(html);
            // selectBox.find(".select .text").removeClass("all");

            this.element.find(".select-box-cont.lesson .select > .text").text("전체");
            this.element.find(".select-box-cont.lesson .select > .text").addClass("all");

            this.element.find(".select-box-cont.lesson .select-box").attr("select", "");
            this.element.find(".select-box-cont.spelling .select-box").attr("select", "on");
          }
        }

        // 검색
        if (data.type == "search") {
          dummy_list = data.list;

          if (dummy_list.length > 0) {
            this.element.find(".select-box-cont.spelling .select > .text").text("전체");
            // this.element.find(".select-box-cont.spelling .select > .text").text("ㄱㄴㄷ");
            // this.element.find(".select-box-cont.lesson .select > .text").text("단원 선택"); // 글씨 수정
            // this.element.find(".select-box-cont.lesson .select > .text").text("전체 단원");
            this.element.find(".select-box-cont.lesson .select > .text").text("사회 ① 전체 단원");
            this.element.find(".select-box-cont.lesson .select > .text").addClass("all");

            this.element.find(".select-box-cont.lesson .select-box").attr("select", "");
            this.element.find(".select-box-cont.spelling .select-box").attr("select", "");
          }

          this.element.find(".select-box-cont .select-box").removeClass("open");
        }

        // 전체 선택
        if (data.all == true) {
          for (var i = 0; i < all_list.length; i++) {
            dummy_list.push(all_list[i]);
          }
          // this.element.find(".select-box-cont.spelling .select > .text").text("전체");
          this.element.find(".select-box-cont.spelling .select > .text").text("ㄱㄴㄷ");
          // this.element.find(".select-box-cont.lesson .select > .text").text("단원 선택");
          // this.element.find(".select-box-cont.lesson .select > .text").text("전체 단원");
          this.element.find(".select-box-cont.lesson .select > .text").text("사회 ① 전체 단원");
          this.element.find(".select-box-cont.lesson .select > .text").addClass("all");

          this.element.find(".select-box-cont.lesson .select-box").attr("select", "");
          this.element.find(".select-box-cont.spelling .select-box").attr("select", "on");

          this.element.find(".select-box-cont .select-box").removeClass("open");
        }

        if (dummy_list.length < 1) {
          alert("목록을 찾을 수 없습니다.");
          return;
        }

        this.element.find(".choice-list-box .list").empty();
        for (var i = 0; i < dummy_list.length; i++) {
          var obj = dummy_list[i];
          choice_list.push(obj);

          var li = $('<li class="btn-choice box">');
          var cb = $('<span class="check-box"></span>');
          var tb = $('<span class="text-box"></span>');
          tb.html(obj.word);
          li.append(cb).append(tb);
          this.element.find(".choice-list-box .list").append(li);

          li.data("obj", obj);
          li.off("click").on("click", function () {
            GlobalAudio.play("button");
            var obj = $(this).data("obj");
            choiceList.call(instance, $(this));
          });
        }

        choice_list = [];
        choiceList.call(instance, this.element.find(".choice-list-box .list > li").eq(0));

        /**
             * <li class="btn-choice box active">
                    <span class="check-box"></span>
                    <span class="text-box">등고선</span>
                </li>
             */
      }

      function choiceListAll(type) {
        page_list = [];
        random_list = [];

        switch (type) {
          case "all":
            this.element.find(".choice-list-box .list > li").each(function (i) {
              $(this).addClass("active");
              page_list.push($(this).data("obj"));
              if ($(this).data("obj").imageBool) {
                random_list.push($(this).data("obj"));
              }
            });
            break;

          case "one":
            this.element.find(".choice-list-box .list > li").removeClass("active");
            this.element
              .find(".choice-list-box .list > li")
              .eq(0)
              .each(function (i) {
                $(this).addClass("active");
                page_list.push($(this).data("obj"));
                if ($(this).data("obj").imageBool) {
                  random_list.push($(this).data("obj"));
                }
              });
            break;
        }

        // if (random_list.length == 0) {
        //   $(`#btn-image`).toggleClass("active", false);
        //   $(`#btn-game`).toggleClass("active", false);
        // } else {
        //   $(`#btn-image`).toggleClass("active", true);
        //   $(`#btn-game`).toggleClass("active", true);
        // }
        page_total = page_list.length;
        movePage.call(this,0,0);
      }

      function choiceList(li) {
        var add = 0;

        if (!li.hasClass("active")) {
          li.addClass("active");
          
         

          add = 1;
        } else {
          if (this.element.find(".choice-list-box .list > li.active").length == 1) return;
          li.removeClass("active");
        }
        

        page_list = [];
        random_list = [];
        this.element.find(".choice-list-box .list > li").each(function (i) {
          if ($(this).hasClass("active")) {
            page_list.push($(this).data("obj"));
            if ($(this).data("obj").imageBool) {
              random_list.push($(this).data("obj"));
            }
          }
        });

        // if (random_list.length == 0) {
        //   $(`#btn-image`).toggleClass("active", false);
        //   $(`#btn-game`).toggleClass("active", false);
        // } else {
        //   $(`#btn-image`).toggleClass("active", true);
        //   $(`#btn-game`).toggleClass("active", true);
        // }
        page_total = page_list.length;
        movePage.call(this, 0,0);
        // console.log(this); // 제발
      }
      
      $(".all-choice-list").on("click",function(){
        // choiceListAll()
        setList.call(instance, {  all: true });
        choiceListAll.call(instance, "all")
      })
      
      // $(".selector_dic .dic_choice_cont").on("click",function(){  // 123123
      //   if($('.view-cont').find('.img').hasClass('remove')){
      //       $('.view-cont').css('justify-content','normal');
      //       $('.view-cont').css('flex-flow','');
      //     } else {
      //       $('.view-cont').css('justify-content','space-around');
      //     }
      // })
      // $(".ansWordLine > span").on("click",function(){
      //   console.log("dd");
      // })

      //  페이지 이동
      
      function movePage(add, sel) {
        // console.log(this.element);
        // console.log(this);
        // console.log($(this)[0]);
        // this.element.find(".choice-list-box .quiz_list > li").length == quiz_total
        if (sel === 0){

          if (this.element.find(".choice-list-box .list > li").length == page_total) {
            this.element.find(".btn-choice-all").addClass("active");
          } else {
            this.element.find(".btn-choice-all").removeClass("active");
          }
        }
        page_current = page_current + add;
        page_current = page_current > page_total ? page_total : page_current;
        page_current = page_current < 1 ? 1 : page_current;
        if (add == 0) page_current = 1;

        var word = page_list[page_current - 1].word;
        var word_q = page_list[page_current - 1].word_q;
        var mean = page_list[page_current - 1].mean;
        var part = page_list[page_current - 1].part;
        var index = page_list[page_current - 1].index;
        var imageBool = page_list[page_current - 1].imageBool;

        var example_f = page_list[page_current - 1].example_f // 추가
        var example_b = page_list[page_current - 1].example_b // 추가
        var hint = page_list[page_current - 1].hint // 추가
        var hint_b = page_list[page_current - 1].hint_b // 추가
        var lineBreak = page_list[page_current - 1].lineBreak // 추가
        var abbreviation = page_list[page_current - 1].abbreviastion // 추가


        // --- view에 따른 처리
        if (view_type == "dic") {
          // setList()
          this.element.find(".view-dic").find(".pager-cont .num-total").html(page_total);
          this.element.find(".view-dic").find(".pager-cont .num-current").html(page_current);
          this.element.find(".view-dic").find(".view-cont .word > span").html(word);
          this.element.find(".view-dic").find(".view-cont .word > span").attr("class",`${part} ${index}`);
          // this.element.find(".view-dic").find(".view-cont .mean > span").html(mean);
          this.element.find(".view-dic").find(".view-cont .mean > .explain-mean").html(mean);
          // this.element.find(".view-dic").find(".view-cont .mean > .example-mean").html(example_f + " " + word_q + "" + example_b);
          this.element.find(".view-dic").find(".view-cont .mean > .example-mean").html(example_f + " <span class=example-word>"+word_q+"</span>"  + example_b);

          $(".explain-mean").css("font-size","38px")
          $(".example-mean").css("font-size","38px")
          if(mean.length > 69 && imageBool){
            $(".explain-mean").css("font-size","36px")
            $(".explain-mean").css("line-height","1.4em")
          } 
          if($(".example-mean").text().length >= 69 && imageBool){
            $(".example-mean").css("font-size","32px")
            $(".example-mean").css("line-height","1.4em")
          } 
          if((part === 3 && index === 19) || (part === 3 && index === 20) || (part === 3 && index === 21)){
            $(".explain-mean").css("font-size","41px")
          }
         
          let imgDiv = this.element.find(".view-dic").find(".view-cont .img");
          let Checkbool = imgDiv.hasClass("checked");
          imgDiv.removeClass();
          imgDiv.addClass("img box");
          imgDiv.toggleClass("checked", Checkbool);
          imgDiv.toggleClass("remove", !imageBool);
          this.element.find(".view-dic").toggleClass("isImg", imageBool);
          if (imageBool) {
            imgDiv.addClass(`img-${part}-${index}`);
          }
          if(word.length >= 16){
            $(".view-dic .view-cont .word > span").css("font-size","43px")
            $(".view-dic .view-box .word").css("margin-top","32px")
          } else {
            $(".view-dic .view-cont .word > span").css("font-size","55px")
            $(".view-dic .view-box .word").css("margin-top","30px")
          }
          $('.selector_quiz').css("display","none")
          $('.selector_dic').css("display","block")
          $('.search').css("display","block")
          $(".mean.box").css("width","750px")
          // if($(".choice-cont .list li").hasClass("active")){    //<-- 이거 처럼 액티브 클래스 된거 다시 바로 지우면 체크는 안되지만 오른쪽 view 화면에 바로 뜨긴함 
          //   $(".choice-cont .list li").each(function(){
          //     $(this).removeClass("active")
          //   })
          // }
        }

        // --- view에 따른 처리                                  
        if (view_type == "card") {
          // this.element.find(".choice-list-box .list").empty();
          $('.selector_quiz').css("display","block")
          $('.selector_dic').css("display","none")
          $('.search').css("display","none")
          // $(".mean.box").css("width","650px")
          if($('body').hasClass("zoominPopup"))$(".mean.box").css("width","1060px") // 퀴즈부분 단어뜻 넓이
          // else $(".mean.box").css("width","640px")

          // $('.dic_choice_cont .btn-choice-all').addClass("active")
          // choiceListAll.call(instance, "all");
          // if(!$(".choice-cont .list li").hasClass("active")){    
            // $(".list .btn-choice").each(function(){
            //   $(this).addClass("active")
            // })
          // }
          
          // var card_page_total = Math.ceil(page_total / card_max);
          // var card_page_total = Math.ceil(quiz_total / card_max)
          ////////////////////////////////////////////////////////////////////////////////
          if(sel === 1){
          var card_page_total = quiz_total
          
          // console.log($(this)[0]);
          // console.log($(this));

          card_page_current = card_page_current + add;
          card_page_current = card_page_current > card_page_total ? card_page_total : card_page_current;
          card_page_current = card_page_current < 1 ? 1 : card_page_current;
          if (add == 0) card_page_current = 1;

          var word_idx = (card_page_current - 1) * card_max;
          // card_page_current = card_page_current + add;
          // card_page_current = card_page_current > card_page_total ? card_page_total : card_page_current;
          // card_page_current = card_page_current < 1 ? 1 : card_page_current;
          // if (add == 0) card_page_current = 1;

          // var word_idx = (card_page_current - 1) * card_max;
          // console.log(word_idx);

          // $(this).find(".view-card").find(".pager-cont .num-total").html(card_page_total);
            // $(this).find(".view-card").find(".pager-cont .num-current").html(card_page_current);
            
          $(".viewer").find(".view-card .num-total").html(card_page_total);
          $(".viewer").find(".view-card .num-current").html(card_page_current);
          $(".quiz_num_box .quiz_num").html(card_page_current)
            
            // console.log($(".viewer").find(".view-card").find(".view-cont .card").eq(i).part);
            
            for (var i = 0; i < card_max; i++) {
              if (word_idx + i < quiz_array.length) {
                word = quiz_array[word_idx + i].word;
                mean = quiz_array[word_idx + i].mean;
                imageBool = quiz_array[word_idx + i].imageBool;
                part = quiz_array[word_idx + i].part;
                index = quiz_array[word_idx + i].index;
                example_f = quiz_array[word_idx + i].example_f
                hint = quiz_array[word_idx + i].hint
                hint_b = quiz_array[word_idx + i].hint_b
                lineBreak = quiz_array[word_idx + i].lineBreak
                abbreviation = quiz_array[word_idx + i].abbreviastion

                // console.log(word);
              // word = page_list[word_idx + i].word;
              // mean = page_list[word_idx + i].mean;
              // imageBool = page_list[word_idx + i].imageBool;
              // part = page_list[word_idx + i].part;
              // index = page_list[word_idx + i].index;
              // console.log($(".viewer").find(".view-card").find(".view-cont .card").eq(i).attr("class"));
              if(imageBool === false){
                // console.log("이미지없어");
                $("#btn-image-zoom").css("display","none")
              } else {
                $("#btn-image-zoom").css("display","block")
              }
              $(".popup-hint").find(".hint-mean .mean-front").html(example_f)
              $(".popup-hint").find(".hint-mean .hint-box .hint-answer").html(word)
              $(".popup-hint").find(".hint-mean .hint-box .hint-initial").html(hint)
              $(".popup-hint").find(".hint-mean .mean-back").html(hint_b)
              // $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".word > span").html(word); 
              // console.log(word);
              var wordQuiz = $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".word .wordLine")
              var ansWordQuiz = $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".word .ansWordLine")
              var wordQuizLineBreak = $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".word .wordLineBreak") 
              var ansWordQuizLineBreak = $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".word .ansWordLineBreak") 
              // var abbreviationWord =$(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".word div span:last-child") 

              var wordLength;
              if (hint.length <= 2) {
                  wordLength = 1;
              } else if (hint.length <= 7) {
                  wordLength = 2;
              } else {
                  wordLength = 3;
              }

              if(hint.indexOf(" ") >= 7 || hint.length >= 12 || (!lineBreak && hint.length >= 7)){
                wordLength = 4;
              }

              // if(hint.indexOf("(") > 0){
              //   hint.slice(0,hint.indexOf("("))
              // }
              wordQuiz.empty()
              ansWordQuiz.empty()
              wordQuizLineBreak.empty()
              ansWordQuizLineBreak.empty()
              // abbreviation.empty()
              for(let i =0; i< hint.length; i++){

                // var wordLine = document.createElement("div");
                // var wordLineBreak = document.createElement("div");
                var creatWord = document.createElement("span");
                var creatWordAns = document.createElement("span");

                creatWordAns.className = `word-ans-box${wordLength}`
                creatWord.className = `word-initial-box${wordLength}`
                if(hint[i] === " "){
                  // creatWord.classList.remove = "word-initial"
                  creatWord.className = "word-space"
                  creatWordAns.className = "word-space"
                }

                creatWord.innerText = hint[i]
                creatWordAns.innerText = word[i]

                
                // if(hint.indexOf("(") > 0){

                //   if(i >= hint.indexOf("(")){

                //     // wordQuiz.append(miniWordBox)
                //     // var topminiWord = document.createElement("span")
                //     // var topminiWord1 = document.createElement("span")

                //     // topminiWord.className = "wordAbbreviation"
                //     // topminiWord1.className = "wordAbbreviation"
                //     creatWord.className = "wordAbbreviation"
                //     creatWordAns.className = "wordAbbreviation"
                    
                //     // console.log("Gdgd");
                  
                //   }
                //    if(abbreviation === true){
               
                //     if(i === Number(hint.indexOf("(") - 1)){
                //       // var miniWord = document.querySelector("span")
                //       var miniWord = document.createElement("span")
                //       var miniWord1 = document.createElement("span")
                //       miniWord.innerHTML = hint.slice(hint.indexOf("("))
                //       miniWord1.innerHTML = hint.slice(hint.indexOf("("))
                //       miniWord.className += "miniWord"
                //       miniWord1.className += "miniWord"
                //       // wordQuizLineBreak.append(miniWord)
                //       // creatWord.className += " lastWord"
                    
                //       }
                //     }

                // // hint.slice(0,hint.indexOf("("))
                // }
                if(hint.indexOf("(") > 0){

                  if(i >= hint.indexOf("(")){

                    creatWord.className = "wordAbbreviation"
                    creatWordAns.className = "wordAbbreviation"
                    
                  }
                  //  if(abbreviation === true){
               
                    if(i === Number(hint.indexOf("(") - 1)){
                      // var miniWord = document.querySelector("span")
                      var miniWord = document.createElement("span")
                      var miniWord1 = document.createElement("span")
                      miniWord.innerHTML = hint.slice(hint.indexOf("("))
                      miniWord1.innerHTML = hint.slice(hint.indexOf("("))
                      miniWord.className += "miniWord"
                      miniWord1.className += "miniWord"
                      // wordQuizLineBreak.append(miniWord)
                      // creatWord.className += " lastWord"
                    
                      }
                    // }

                // hint.slice(0,hint.indexOf("("))
                }
       
              // console.log(word.indexOf(" "));
              // if(lineBreak != 0){
                //   if(i <= lineBreak){
                  //     wordQuiz.append(creatWord)
                  //   } 
                  //   if(i > lineBreak) {
                    //     wordQuizLineBreak.append(creatWord)
                    //   }
                    // } else {
                      //   wordQuiz.append(creatWord)
                      // }
                      
                      // console.log(hint.slice(0,hint.indexOf("(")));
                      
                      // console.log(abbreviation);
                      
               if (lineBreak != 0) {       //////////
                  if (i <= lineBreak) {
                    ansWordQuiz.append(creatWordAns);
                    wordQuiz.append(creatWord);
                  } else {
                    ansWordQuizLineBreak.append(creatWordAns);
                    wordQuizLineBreak.append(creatWord);
                  }
                } else {
                  ansWordQuiz.append(creatWordAns);
                  wordQuiz.append(creatWord);
                }                             //////////
                if(abbreviation === true) {
                  ansWordQuiz.append(miniWord1);
                  wordQuiz.append(miniWord)
                }
                if (lineBreak != 0 && abbreviation === true) {
                  ansWordQuizLineBreak.append(miniWord1);
                  wordQuizLineBreak.append(miniWord)
                }
                
                // $(".ansWordLine").css("top","")
                // $(".ansWordLineBreak").css("top","")

                // if($(".ansWordLine > span").hasClass("word-ans-box3")  && ansWordQuizLineBreak.children().length) {
                //   $(".ansWordLine").css("top",40)
                //   $(".ansWordLineBreak").css("top",140)
                // }
                
                // if($("body").hasClass("zoominPopup") && $(".ansWordLine > span").hasClass("word-ans-box3")  && ansWordQuizLineBreak.children().length){
                //   $(".ansWordLine").css("top",25)
                //   $(".ansWordLineBreak").css("top",165)

                // }

                // if($(".ansWordLine > span").hasClass("word-ans-box4") && ansWordQuizLineBreak.children().length) {
                //   $(".ansWordLine").css("top",46)
                //   $(".ansWordLineBreak").css("top",140)
                // }
                // if($("body").hasClass("zoominPopup") && $(".ansWordLine > span").hasClass("word-ans-box4")  && ansWordQuizLineBreak.children().length){
                //   $(".ansWordLine").css("top",42)
                //   $(".ansWordLineBreak").css("top",165)
                // }
                
                function setWordLinePosition(topValue, breakTopValue) {
                  $(".ansWordLine").css("top", topValue);
                  $(".ansWordLineBreak").css("top", breakTopValue);
                }
                
                // 초기화
                setWordLinePosition("", "");
                
                if($(".ansWordLine > span").hasClass("word-ans-box3") && ansWordQuizLineBreak.children().length) {
                  if($("body").hasClass("zoominPopup")) {
                    setWordLinePosition(25, 165);
                  } else {
                    setWordLinePosition(40, 140);
                  }
                }
                
                if($(".ansWordLine > span").hasClass("word-ans-box4") && ansWordQuizLineBreak.children().length) {
                  if($("body").hasClass("zoominPopup")) {
                    setWordLinePosition(42, 165);
                  } else {
                    setWordLinePosition(46, 140);
                  }
                }


                $("#btn-game").on("click",function(){

                  $(".ansWordLine").css("top","")
                  $(".ansWordLineBreak").css("top","")

                  if($(".ansWordLine > span").hasClass("word-ans-box3")  && ansWordQuizLineBreak.children().length) {
                    $(".ansWordLine").css("top",40)
                    $(".ansWordLineBreak").css("top",140)
                  }
                  
                  if($("body").hasClass("zoominPopup") && $(".ansWordLine > span").hasClass("word-ans-box3")  && ansWordQuizLineBreak.children().length){
                    $(".ansWordLine").css("top",25)
                    $(".ansWordLineBreak").css("top",165)
  
                  }
  
                  if($(".ansWordLine > span").hasClass("word-ans-box4") && ansWordQuizLineBreak.children().length) {
                    $(".ansWordLine").css("top",46)
                    $(".ansWordLineBreak").css("top",140)
                  }
                  if($("body").hasClass("zoominPopup") && $(".ansWordLine > span").hasClass("word-ans-box4")  && ansWordQuizLineBreak.children().length){
                    $(".ansWordLine").css("top",42)
                    $(".ansWordLineBreak").css("top",165)
                  }
                })
                
                $(".wordAbbreviation").remove()
                
              }
              

              // console.log(wordQuiz.children().length);
              // console.log(wordQuizLineBreak.children().length);
              $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".mean > span").html(mean);
              $(".viewer").find(".view-card").find(".view-cont .card").eq(i).attr("class",`card card-${part}-${index}`)  // 카드에 데이터 번호 입력
              $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".btn-image").toggleClass("hide", !imageBool);
              if (imageBool) {
                $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".btn-image").data("part", part);
                $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".btn-image").data("index", index);
              }
            } else {
              $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".word > span").html("");
              $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".mean > span").html("");
              $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".btn-image").addClass("hide");
              $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".btn-image").data("part", null);
              $(".viewer").find(".view-card").find(".view-cont .card").eq(i).find(".btn-image").data("index", null);
            }

            GlobalAudio.addAudio("ppyog", "./audio/터치시_뾱.mp3");

            if($(".ansWordLine").children().eq(-1).attr("class") === "word-space"){
              $(".ansWordLine").children().eq(-1).css("width","0")
              $(".wordLine").children().eq(-1).css("width","0")
            }
            // console.log($(".ansWordLine").children().eq(-1).attr("class"));

            $(".ansWordLine > span").on("click",function(){
              GlobalAudio.play("ppyog");  // 퀴즈 사운드
              $(".wordLine").children().eq($(this).index()).css("opacity",0)
              $(this).css("opacity",1)
            })
            $(".ansWordLineBreak > span").on("click",function(){
              GlobalAudio.play("ppyog");  // 퀴즈 사운드
              $(".wordLineBreak").children().eq($(this).index()).css("opacity",0)
              $(this).css("opacity",1)
            })
          }
        }
        // console.log( $(".viewer").find(".view-card").find(".view-cont .card").eq(0).find(".btn-image").data());
          ///////////////////////////////////////////////////////////////////////////////////////
        }
      }

      function viewDicSetting() {
        this.element.find(".view-dic .box").removeClass("checked");

        if (dic_type_idx == 1) {
          console.log(this);
          this.element.find(".view-dic .mean.box").addClass("checked");
        } else if (dic_type_idx == 2) {
          this.element.find(".view-dic .word.box").addClass("checked");
        } else if (dic_type_idx == 3) {
          this.element.find(".view-dic .img.box").addClass("checked");
        }
      }

      function viewCardSetting() {                   // 여기 수정했음 타입 바꾸는거 주석처리
        this.element.find(".view-card .box").removeClass("checked");

        if (card_type_idx == 1) {
          this.element.find(".view-card .mean.box").addClass("checked");
        } else if (card_type_idx == 2) {
          this.element.find(".view-card .word.box").addClass("checked");
        }

        this.element.find(".view-card .view-cont").removeClass("type-2 type-3");

        var target_card_max = 1;
        // if (card_count_idx == 1) {
        //   target_card_max = 2;
        //   this.element.find(".view-card .view-cont").addClass("type-2");
        // }
        // if (card_count_idx == 2) {
        //   target_card_max = 6;
        //   this.element.find(".view-card .view-cont").addClass("type-3");
        // }

        this.element.find(".view-card .view-cont .card").hide();
        this.element.find(".view-card .view-cont .card").each(function (i) {
          if (i < target_card_max) $(this).show();
        });
        if (card_max != target_card_max) {
          card_max = target_card_max;
          movePage.call(this, 0, 1);
        }
      }

      function openImagePop(part, index) {
        let image = $(".popup-image").find(".view .image");
        image.removeClass();
        image.toggleClass("image", true); 
        image.addClass(`img-${part}-${index}`);
        $(".popup-image").find(".view .os-viewport").scrollTop(0);
        $(".popup-image").data("instance").open();
      }

      function openGamePop() {
        setGamePop(0);
        // $(".popup-game").data("instance").open();
        // if(!$('#btn-game').hasClass("active")){
          zoominPop.call(instance);
          $('.btn.game').addClass("active")
        // }else {
          // $('#btn-game').removeClass("active")
          
          // zoomout.call(instance);
        // }
      }
      function closeGamePop(){ // 여기 추가
        zoomoutPop.call(instance);
        GlobalAudio.play("button")
        $('.btn.game').removeClass("active")
      }

      function moveGamePop(page) {
        game_page_current = page;
        game_page_current = game_page_current >= game_page_total ? game_page_total - 1 : game_page_current;
        game_page_current = game_page_current < 0 ? 0 : game_page_current;

        // if (game_check[game_page_current].word) {
        //   $(".popup-game .word").toggleClass("checked", false);
        // } else {
        //   $(".popup-game .word").toggleClass("checked", true);
        // }
        // if (game_check[game_page_current].image) {
        //   $(".popup-game .image").toggleClass("checked", false);
        // } else {
        //   $(".popup-game .image").toggleClass("checked", true);
        // }
       
        $(".popup-game").find(".pager-cont .num-total").html(game_page_total);
        $(".popup-game")
          .find(".pager-cont .num-current")
          .html(game_page_current + 1);
          // console.log(page);
          // console.log(random_list);   
        // $(".popup-game").find(".word > span").html(random_list[game_page_current].word);  // 여기 수정함
        // $(".popup-game").find(".mean > span").html(random_list[game_page_current].mean);
        $(".popup-game").find(".word > span").html(page_list[game_page_current].word);  
        $(".popup-game").find(".mean > span").html(page_list[game_page_current].mean);
        // let imgDiv = $(".popup-game").find(".image .img");
        // imgDiv.removeClass();
        // imgDiv.addClass("img");
        // imgDiv.addClass(`img-${random_list[game_page_current].part}-${random_list[game_page_current].index}`);
      }

      function setGamePop(page) {
        game_check = [];
        // game_page_total = random_list.length; // 여기 해보자
        game_page_total = page_list.length;
        for (let i = 0; i < game_page_total; i++) {
          game_check.push({
            word: false,
            // image: false,
            mean: false,
          });
        }
        moveGamePop(page);
      }

      function zoomin() {
        $("body").addClass("zoomin");
      }

      function zoomout() {
        $("body").removeClass("zoomin");
      }
      function zoominPop() {
        $("body").addClass("zoominPopup");
      }

      function zoomoutPop() {
        $("body").removeClass("zoominPopup");
      }

      function changeView(data) {
        var nowType = this.element.hasClass("dic") ? "dic" : "card";
        if (nowType != data.type) {
          console.log("change", data.type, data.str);
          view_type = data.type;
          this.element.removeClass("dic card");
          this.element.addClass(data.type);
          this.element.find(".header .title .text > span").text(data.str);

          this.element.find(".viewer > .view").removeClass("active");
          this.element.find(".viewer > .view-" + data.type).addClass("active");

          this.element.find(".header .btns > .btn").removeClass("active");
          this.element.find(".header .btns > .btn." + data.type).addClass("active");

          // setList.call(instance, {all:true});
          movePage.call(instance, 0,1); // 체인지 수정
        }
      }

      return Class.extend({
        init: function (element, options) {
          instance = this;
          this.element = element;
          this.options = options;

          console.log(this.options.searchType);

          initFn.call(this);
        },
        start: function () {},
        reset: function () {},
        dispose: function () {
          // this.element.removeClass("start active finish");
        },
      });
    })();

  // 기본 옵션
  /**
   * searchType : "word", "spell"
   */
  AppDic.DEFAULT = { width: 1280, height: 720, searchType: "word" };

  function Plugin(option, params) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data("ui.appDic");
      var options = $.extend({}, AppDic.DEFAULT, typeof option == "object" && option);
      if (!data) $this.data("ui.appDic", (data = new AppDic($this, options)));
      if (typeof option == "string") data[option](params);
      $this.data("instance", data);
    });
  }

  $.fn.appDic = Plugin;
  $.fn.appDic.Constructor = AppDic;
})(jQuery);

// 초성 검색
var rCho = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
var rJung = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
var rJong = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

var rJaeum = [
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

function getSpell(word) {
  var arr = [];

  var code = word.charCodeAt(0);
  // console.log("code:", code);
  // 자음만 있는 문자
  if (code >= 12593 && code <= 12622) {
    console.log("자음만 있는 한글 문자");
    var nTmp = word.charCodeAt(0) - 12593;
    var jaeum = nTmp;
    arr.push(rJaeum[jaeum]);
    return arr;
  }
  // 한글 문자
  if (code >= 44032 && code <= 55203) {
    var nTmp = word.charCodeAt(0) - 0xac00;
    var jong = nTmp % 28; // 종성
    var jung = ((nTmp - jong) / 28) % 21; // 중성
    var cho = ((nTmp - jong) / 28 - jung) / 21; // 종성

    arr.push(rCho[cho]);
    arr.push(rJung[jung]);
    arr.push(rJong[jong]);

    return arr;
  }

  return ["a", "a", "a"];
}

function matchCho(spell, word) {
  var bool = false;

  var nTmp = word.charCodeAt(0) - 0xac00;
  var jong = nTmp % 28; // 종성
  var jung = ((nTmp - jong) / 28) % 21; // 중성
  var cho = ((nTmp - jong) / 28 - jung) / 21; // 종성

  if (spell == rCho[cho]) bool = true;

  // console.log(
  // "단어:"+word+" "
  // +"초성:"+rCho[cho]+" "
  // +"중성:"+rJung[jung]+" "
  // +"종성:"+rJong[jong]
  // );

  return bool;
}
function matchSpell(spell, word) {
  var bool = false;

  var total = spell.length;
  var count = 0;
  for (var i = 0; i < spell.length; i++) {
    if (i == 2 && spell[i] == "") {
      count++;
      continue;
    }
    // console.log(spell[i], word[i]);
    if (spell[i] == word[i]) count++;
  }
  if (count == total) bool = true;

  return bool;
}

function matchWord(strSpellArr, word) {
  var bool = false;
  var total = strSpellArr.length;
  var count = 0;

  var wordArr = word.split("");
  var wordSpellArr = [];
  for (var i = 0; i < wordArr.length; i++) {
    var arr = getSpell(wordArr[i]);
    wordSpellArr.push(arr);
  }

  for (var i = 0; i < strSpellArr.length; i++) {
    if (!wordSpellArr[i]) continue;

    var right = matchSpell(strSpellArr[i], wordSpellArr[i]);
    if (right) count++;
  }

  // console.log(">>", count, "/", total);
  if (count == total) bool = true;
  // if(bool) console.log(count, total, word, strSpellArr);

  return bool;
}

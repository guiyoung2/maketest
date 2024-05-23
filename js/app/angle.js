/*
 *	AngleTool
 * <div class="app-angle-tool" data-ui="app-angle-tool" data-option='{}'></div>
 */
(function ($) {
  'use strict';

  var AngleTool =
    AngleTool ||
    (function () {
      var instance;
      var viewport = { scale: 1 };
      var ratioData = { min: 0.4, max: 2 }; // 기존 0.2 , 3
      var transformOriginY = 0; // 컨텐츠 엘리먼트 영역의 scaleY 기준 점
      var objData = [
        {
          key: 'protractor',
          width: 130,
          // height: 115,
          height: 90,
          source: '<img src="./svg/svg_1_1.svg" alt="">'
        },
        {
          key: 'ruler',
          width: 130,
          // height: 115,
          height: 90,
          source: '<img src="./svg/svg_1_2.svg" alt="">'
        }
        // {key:"protractor", width:620, height:337, source:'<img src="../common/images/app_angle_tool/obj_protractor.svg" alt="">'},
        // {key:"ruler", width:906, height:161, source:'<img src="../common/images/app_angle_tool/obj_ruler.svg" alt="">'},
        // {key:"triangle", width:522, height:308, source:'<img src="../common/images/app_angle_tool/obj_triangle.svg" alt="">'}
      ];
      var nowObj = null;
      const undoObj = [];
      var undoObjNum = 0;
      const undoObjAll = [];
      
      function initFn() {
        var owner = this;

        $(window).on('resize', function () {
          viewport.scale = window.scale;
        });

        this.element.find('.test-point').hide();

        // this.element.find(".btn-open").on("click", function(e){
        // 	checkOpen();

        // 	e.preventDefault();
        // 	e.stopPropagation();
        // });

        // function checkOpen(type) {
        // 	if(type == "hide")
        // 	{
        // 		owner.element.removeClass("open");
        // 		return;
        // 	}

        // 	if(owner.element.hasClass("open"))
        // 	{
        // 		owner.element.removeClass("open");
        // 	}
        // 	else
        // 	{
        // 		owner.element.addClass("open");
        // 	}
        // }

        if (this.options.autoStart) this.start();
      }
      
      function initEvent() {
        var owner = this;

        setTools.call(this);

        // 오브젝트 외 영역
        this.element.find('.not-obj').on(touchstart, function (e) {
          if (owner.touchMode == 'lineDraw') return;

          // console.log("not-obj");
          owner.unselectObj();

          // e.preventDefault();
          // e.stopPropagation();
        });

        // 라인 그리기용
        this.element.on(touchstart, function (e) {
          if (owner.touchMode == 'lineDraw') {
            onTouchStartLine.call(owner, e);
          }
        });

        $(window).on(touchmove, $.proxy(onTouchMove, this));
        $(window).on(touchend, $.proxy(onTouchEnd, this));

        // 리사이즈 체크
        $(window).on('resize', $.proxy(onResize, this));
        onResize.call(this);
      }

      function onResize(e) {
        var resizeContainer = $('.content-container');
        if (resizeContainer.length < 1) return;
        this.resizeLeft = resizeContainer.offset().left;
        this.resizeTop = resizeContainer.offset().top;
        this.resizeScale = viewport.scale;
      }

      function setTools() {
        var owner = this;

        this.element.find('.select-btn').each(function (i) {
          $(this).on(touchstart, function (e) {
            var idx = $(this).index();
            if ($(this).hasClass('btn-del')) {
              owner.deleteObj();
            } else {
              owner.setTool(idx);
            }

            e.preventDefault();
            e.stopPropagation();
          });
        });
      }

      function onTouchStartLine(e) {
        var owner = this;

        if (!this.element.hasClass('open')) return;
        if (this.touchMode != 'lineDraw') return;

        console.log('line draw start');
        this.touchTarget = $(e.currentTarget);

        var pageX = e.pageX;
        var pageY = e.pageY;

        if (e.originalEvent.changedTouches) {
          pageX = e.originalEvent.changedTouches[0].clientX;
          pageY = e.originalEvent.changedTouches[0].clientY;
        }

        this.startX = (pageX - this.element.offset().left) / viewport.scale;
        this.startY = (pageX - this.element.offset().top) / viewport.scale;
        // this.startY = (pageY - transformOriginY) / viewport.scale + transformOriginY; /* content-container 확대 기준 transform-origin y좌료 예외 처리 */

        this.targetPath = makeLineSVG.call(this);
      }

      function onTouchStart(e) {
        var owner = this;

        
        if (!this.element.hasClass('open')) return;
        if (this.touchMode == 'lineDraw') return;

        
        var target = $(e.currentTarget);
        this.touchMode = target.data('touch-mode');
        this.touchTarget = $(e.currentTarget).parents('.obj');
        
        if (this.touchMode == 'line') {
          this.touchTarget = target.data('paper');
        }
        
        var pageX = e.pageX;
        var pageY = e.pageY;
        
        if (e.originalEvent.changedTouches) {
          pageX = e.originalEvent.changedTouches[0].clientX;
          pageY = e.originalEvent.changedTouches[0].clientY;
        }
        
        this.startX = (pageX - this.element.offset().left) / viewport.scale;
        this.startY = (pageY - this.element.offset().top) / viewport.scale;
        
        // this.startX = (pageX - this.element.offset().left) / viewport.scale;
        // this.startY = (pageY - transformOriginY) / viewport.scale + transformOriginY; /* content-container 확대 기준 transform-origin y좌료 예외 처리 */
        
        GlobalAudio.play('button');
        
        console.log(this.startX, this.startY);
        // this.startY = pageY / viewport.scale;
        
        this.startBound = this.touchTarget[0].getBoundingClientRect();
        this.startRadian = null;
        this.startPosition = null;
        this.startScale = null;
        
        
        // $(".btn-del").on("click",function(){
          //   console.log("Dd");
          // })
          
          
        // 기본값 셋팅;
        // console.log($(e.target).parent().hasClass("obj-text"));
        if($(e.target).parent().hasClass("obj-text")){      // 아이콘과 텍스트에 따른 최대 크기 조절 
          ratioData = { min: 0.4, max: 2.5 }
        } else {
          ratioData = { min: 0.4, max: 2 }
        }


        var data = this.touchTarget.data('objData');
        var transform = this.touchTarget.data('transform');
        if (!transform)
        this.touchTarget.data('transform', { radian: 0, angle: 0 });
      var position = this.touchTarget.data('position');
      if (!position) {
        var left =
        (this.touchTarget.offset().left - this.element.offset().left) /
        viewport.scale;
        var top =
        (this.touchTarget.offset().top - this.element.offset().top) /
        viewport.scale;
        // var top = (this.touchTarget.offset().top - transformOriginY) / viewport.scale + transformOriginY; /* content-container 확대 기준 transform-origin y좌료 예외 처리 */
        this.touchTarget.data('position', { left: left, top: top });
      }
      var scale = this.touchTarget.data('scale'); 
      
      if (!scale ){
        this.touchTarget.data('scale', {
          width: data.width,
          height: data.height
        });
      }
      if(this.touchMode == 'del'){              // 삭제 추가
        // console.log($('.drawing-content').find('.obj.select').remove());
        
        // console.log(undoData);
        $('.drawing-content').find('.obj.select').remove();
        // $('.drawing-content .drawing-cont').find(`.${undoData[undoData.length - 1]}`).remove()
          undoData.pop()
          if($('.drawing-content .drawing-cont .obj').length === 0){
            $('.undo-btn').addClass("not-undo")
          }
          // console.log(undoData);
      }
      }
      

      // TODO: 이미지 스케일 
      function onTouchMove(e) {
        var owner = this;

        if (this.touchTarget) {
          var pageX = e.pageX;
          var pageY = e.pageY;

          if (e.originalEvent.changedTouches) {
            pageX = e.originalEvent.changedTouches[0].clientX;
            pageY = e.originalEvent.changedTouches[0].clientY;
          }

          var moveX = (pageX - this.element.offset().left) / viewport.scale;
          var moveY = (pageY - this.element.offset().top) / viewport.scale;
          // var moveY = (pageY - transformOriginY) / viewport.scale + transformOriginY; /* content-container 확대 기준 transform-origin y좌료 예외 처리 */
          moveX = parseInt(moveX);
          moveY = parseInt(moveY);

          var centerX =
            (this.startBound.left + this.startBound.width / 2) / viewport.scale;
          centerX -= this.element.offset().left / viewport.scale;
          var centerY =
            (this.startBound.top + this.startBound.height / 2) / viewport.scale;
          centerY -= this.element.offset().top / viewport.scale;

          var data = this.touchTarget.data('objData');
          var scale = this.touchTarget.data('scale');
          var transform = this.touchTarget.data('transform');
          var position = this.touchTarget.data('position');

          if (this.touchMode == 'move' || this.touchMode == 'line') {
            TweenLite.set($('.test-point.p-01'), {
              x: this.startX,
              y: this.startY
            });
            TweenLite.set($('.test-point.p-02'), { x: moveX, y: moveY });

            if (this.startPosition == null) {
              this.startPosition = position;
            }

            const targetScale = this.touchTarget.data('scale');
            const dragArea = document.querySelector('.drawing-cont');
            // const dragTarget = document.querySelector('.obj.obj-svg.select');

            // 비
            // w : h = left : top
            // scale = 3,  390 : 345 = 130 : 115
            // scale = 0.2, 26 : 23 = -52 : -46
            // scale = 1, 130 : 115 = 0 : 0

            // w: left = h: top
            // scale = 3, 390 : 130 = 345 : 115
            // scale = 0.2, 26 : -52 = 23 : -46
            // scale = 1, 130 : 0 = 115 : 0

            // 선형 보간법
            // 스케일이 적용되지 않은(1) dragTarget의 width, height
            // const unscaledWidth = 130;
            // const unscaledHeight = 115;

            // 스케일이 적용되지 않은 dragTarget에 적용이 필요한 left, top
            // const unscaledLeft = 0;
            // const unscaledTop = 0;

            // Scale 값
            const scale = targetScale.width / data.width;

            // 스케일이 적용된 후의 dragTarget의 width, height
            // var scaledWidth = unscaledWidth * scale;
            // var scaledHeight = unscaledHeight * scale;

            // 스케일이 0.2일 때의 left, top
            const leftAtScaleMin = -52;
            const topAtScaleMin = -46;

            // 스케일이 3일 때의 left, top
            const leftAtScaleMax = 130;
            const topAtScaleMax = 115;

            // 스케일이 적용된 후의 dragTarget에 적용이 필요한 left, top
            const scaledLeft =
              leftAtScaleMin +
              ((scale - 0.2) * (leftAtScaleMax - leftAtScaleMin)) / (3 - 0.2);
            const scaledTop =
              topAtScaleMin +
              ((scale - 0.2) * (topAtScaleMax - topAtScaleMin)) / (3 - 0.2);

            var targetX = this.startPosition.left + (moveX - this.startX);
            var targetY = this.startPosition.top + (moveY - this.startY);

            if (targetX < 0 + scaledLeft) targetX = 0 + scaledLeft;
            if (targetY < 0 + scaledTop) targetY = 0 + scaledTop;
            if (targetX + data.width > dragArea.offsetWidth - scaledLeft) {
              targetX = dragArea.offsetWidth - data.width - scaledLeft;
            }
            if (targetY + data.height > dragArea.offsetHeight - scaledTop) {
              targetY = dragArea.offsetHeight - data.height - scaledTop;
            }

            TweenLite.set(this.touchTarget, { x: targetX, y: targetY });
            this.touchTarget.data('position', { left: targetX, top: targetY });
          }

          
          if (this.touchMode == 'scale') {
            TweenLite.set($('.test-point.p-01'), { x: centerX, y: centerY });
            TweenLite.set($('.test-point.p-02'), { x: moveX, y: moveY });

            var distX = moveX - centerX;
            var distY = moveY - centerY;
            var dist = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));

            this.startScale = scale;

            var tarWidth =
              Math.sqrt(
                Math.pow(dist, 2) - Math.pow(this.startScale.height / 2, 2)
              ) * 2;
            var ratioW = tarWidth / data.width;
            if (isNaN(tarWidth)) ratioW = ratioData.min;
            if (ratioW < ratioData.min) ratioW = ratioData.min;
            if (ratioW > ratioData.max) ratioW = ratioData.max;
            tarWidth = data.width * ratioW;
            var tarHeight = data.height * ratioW;

            // TweenLite.set(this.touchTarget, { scale: ratioW });
            TweenLite.set(this.touchTarget, {
              scale: ratioW
            });

            this.touchTarget.data('scale', {
              width: tarWidth,
              height: tarHeight
            });
            TweenLite.set(this.touchTarget.find('.scale'), {
              scale: 1 / ratioW
            });
            TweenLite.set(this.touchTarget.find('.rotate'), {
              scale: 1 / ratioW
            });
            TweenLite.set(this.touchTarget.find('.btn-del'), {
              scale: 1 / ratioW
            });
          }

          if (this.touchMode == 'rotate') {
            TweenLite.set($('.test-point.p-01'), { x: centerX, y: centerY });
            TweenLite.set($('.test-point.p-02'), { x: moveX, y: moveY });

            var rad = Math.atan2(moveY - centerY, moveX - centerX);

            if (this.startRadian == null) {
              this.startRadian = rad - transform.radian;
            }

            var tarRad = rad - this.startRadian;
            var angle = (tarRad * 180) / Math.PI;

            TweenLite.set(this.touchTarget, { rotation: angle });
            this.touchTarget.data('transform', {
              radian: tarRad,
              angle: angle
            });
          }

          if (
            this.touchMode == 'lineDraw' &&
            this.targetPath != null &&
            this.paper != null
          ) {
            TweenLite.set($('.test-point.p-01'), {
              x: this.startX,
              y: this.startY
            });
            TweenLite.set($('.test-point.p-02'), { x: moveX, y: moveY });

            this.endX = moveX;
            this.endY = moveY;

            if (this.targetPath != null) {
              this.targetPath.attr(
                'd',
                'M ' +
                  this.startX +
                  ' ' +
                  this.startY +
                  ' L ' +
                  this.endX +
                  ' ' +
                  this.endY
              );
            }
          }

          this.isDrag = true;

          e.preventDefault();
          e.stopPropagation();
        }
      }

      function onTouchEnd(e) {
        var owner = this;

        // !! 수정 2021.01.27 :: 모바일 .on("click")클릭 오류 수정
        if (this.touchTarget) {
          var dist = Math.sqrt(
            Math.pow(this.startX - this.endX, 2) +
              Math.pow(this.startY - this.endY, 2)
          );

          var sx = Math.min(this.startX, this.endX);
          var sy = Math.min(this.startY, this.endY);

          if (
            this.touchMode == 'lineDraw' &&
            this.targetPath != null &&
            this.paper != null
          ) {
            console.log(dist);
            if (dist > 20) {
              var rect = $(
                document.createElementNS('http://www.w3.org/2000/svg', 'rect')
              );
              rect.attr('class', 'rect');
              rect.attr('x', sx - 4);
              rect.attr('y', sy - 4);
              rect.attr('width', Math.abs(this.endX - this.startX) + 8);
              rect.attr('height', Math.abs(this.endY - this.startY) + 8);
              rect.attr('stroke', '#000').attr('stroke-width', 1);
              rect.attr('fill-opacity', 0);
              rect.data('paper', this.paper);
              rect.data('touch-mode', 'line');

              // this.unselectObj();
              this.paper.data('objData', { width: 1280, height: 660 });
              // this.paper.addClass("select");
              this.paper.append(rect);

              rect.on(touchstart, function (e) {
                if (owner.touchMode != 'lineDraw') {
                  var paper = $(this).data('paper');
                  owner.selectObj(paper);
                  // owner.unselectObj();
                  // paper.addClass("select");
                  onTouchStart.call(owner, e);
                }
              });

              // this.targetPath.on(touchstart, function(e){
              // 	e.preventDefault();
              // 	e.stopPropagation();
              // });
            } else {
              this.paper.remove();
            }
          }

          this.paper = null;
          this.targetPath = null;

          this.touchTarget = null;
          this.isDrag = false;

          e.preventDefault();
          e.stopPropagation();
        }
      }

      function makeLineSVG() {
        var owner = this;

        this.paper = $(
          '<svg class="lines" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:100%;height:100%"></svg>'
        );
        this.objectContainer.append(this.paper);

        var path = $(
          document.createElementNS('http://www.w3.org/2000/svg', 'path')
        );
        path.attr('class', 'line');
        path
          .attr('stroke', '#000')
          .attr('stroke-width', owner.options.thickness);
        this.paper.append(path);
        return path;
      }

      return Class.extend({
        init: function (element, options) {
          this.element = element;
          this.options = options;

          instance = this;

          // this.element.append($(angleInner));

          this.touchTarget = null;
          this.touchMode = 'move'; // "move", "scale", "rotate"

          this.startX = 0;
          this.startY = 0;
          this.selectIndex = 0;
          this.thickness = this.options.thickness;

          this.startBound = {};
          this.startRadian = null;
          this.startPosition = null;
          this.startScale = null;

          this.objectContainer = this.element.find('.drawing-cont');

          this.paper = null;
          this.targetPath = null;

          this.isDrag = false;

          this.resizeLeft = 0;
          this.resizeTop = 0;
          this.resizeScale = 1;

          initFn.call(this);
        },

        start: function () {
          initEvent.call(this);
        },

        setTool: function (idx) {
          var owner = this;

          this.selectIndex = 0;

          if (idx > -1) {
            this.selectIndex = idx;
            if (
              this.selectIndex == 1 ||
              this.selectIndex == 2 ||
              this.selectIndex == 3
            ) {
              console.log('오브젝트 추가', this.selectIndex);

              this.element.find('.select-btn').removeClass('active');
              this.element.find('.select-btn').eq(idx).addClass('active');

              this.addObj();
            } else if (idx == 0) {
              console.log('라인 그리기 툴', this.selectIndex);

              if (this.element.find('.select-btn').eq(idx).hasClass('active')) {
                this.element.find('.select-btn').eq(idx).removeClass('active');
                this.touchMode = null;
              } else {
                owner.unselectObj();
                this.element.find('.select-btn').eq(idx).addClass('active');
                this.touchMode = 'lineDraw';
              }
            }
          }
        },

        addObj: function (_data, type) {
          var owner = this;

          // var data = objData[this.selectIndex-1];
          var data = objData[0];
          if (_data) data = _data;
          undoObjNum++
          // var obj = $('<div class="obj"></div>');
          var obj = $(`<div class="obj obj${undoObjNum}"></div>`);
          var source = $(data.source);
          // var del = $('<div class="btn- btn-del" data-touch-mode="del"><span></span></div>');  // 임시 삭제 버튼 생성
          var del = $('<div class="btn- btn-del" data-touch-mode="del"></div>');  // 임시 삭제 버튼 생성
          var rect = $('<div class="btn- rect" data-touch-mode="move"></div>');
          var scale = $(
            '<div class="btn- scale scale1" data-touch-mode="scale"></div>'
          );
          var scale1 =  $(
            '<div class="btn- scale scale2" data-touch-mode="scale"></div>'
          );
          var scale2 =  $(
            '<div class="btn- scale scale3" data-touch-mode="scale"></div>'
          );
          var rotate = $(
            '<div class="btn- rotate" data-touch-mode="rotate"></div>'
          );

          var lineBreak = source.text().length;  // 텍스트 짜르기 
          var koreanRegExp = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
          var numberRegExp = /^-?\d+(\.\d+)?$/;
          var englishRegExp = /^[a-zA-Z]+$/

          var linewidth = 0;
          var lineNumWidth = 0;
          var lineSliceNum = 0;
          
          var breakNum = Math.floor(lineBreak)
          if(lineBreak > 27){
            var textBreak = source.text().split('');

            for(let i = 0; i < breakNum; i++){
              if(koreanRegExp.test(textBreak[i]) || (!numberRegExp.test(textBreak[i]) && !englishRegExp.test(textBreak[i]))){   // 한글과 숫자,영어가 아닐 때 줄바꿈
                linewidth += 2  
                // if( linewidth % (50 - (lineNumWidth * 2) ) === 0 || linewidth % 50 === 0) {
                if(linewidth % 50 === 0) {
                textBreak[i] += " "
                linewidth = 0
                lineNumWidth = 0
                }
              }
              if(numberRegExp.test(textBreak[i]) || englishRegExp.test(textBreak[i])){
                lineNumWidth += 1
                // if(((lineNumWidth * 2) + linewidth) % 50 === 0 || lineNumWidth % 39 === 0 ) {
                if(lineNumWidth % 39 === 0 ) {   // 숫자일 때 줄바꿈 
                textBreak[i] += " "
                linewidth = 0
                lineNumWidth = 0
                }
              }
              if(linewidth != 0 && lineNumWidth != 0 ){
                if( linewidth % (50 - (lineNumWidth * 2) ) === 0 || ((lineNumWidth * 2) + linewidth) % 50 === 0){   // 숫자와 한글이 섞일시에 줄바꿈
                textBreak[i] += " "
                // console.log(linewidth, lineNumWidth);
                linewidth = 0
                lineNumWidth = 0
                }
              }
            }
            // console.log(textBreak.indexOf(numberRegExp));
            textBreak = textBreak.slice(0, 300)
            source = textBreak.join('');
          }
          
          obj.append(source);
          obj.append(rect);
          obj.append(del);   // 임시 생성
          obj.append(scale);
          obj.append(scale1);
          obj.append(scale2);
          obj.append(rotate);
          obj.addClass(data.key);
          obj.addClass(data.value);
          
          // console.log(typeof source[0]);
          

          this.objectContainer.append(obj);

        //   if(typeof source[0] === "string"){  
        //     // data.width = obj.width();       
        //   // data.height = obj.height();
        // }
        
        // $('.aside-right .slide-controls .tabs').append(tab);
        // if(source === '<div style="color:' + color + '; ">' + str + '</div>'){
          if(type = 'file'){
            // console.log($(obj).children().eq(0)[0].tagName);
            if($(obj).children().eq(0)[0].tagName == "IMG"){
              $(obj).children().eq(0).css("width", "130px");
              // $(obj).children().eq(0).css("height", "115px");
              $(obj).children().eq(0).css("height", "90px");
            }
            // console.log($(obj).children().eq(0));
          }
          // if(type == 'text'){               // 아이콘 클릭시와 텍스트 클릭시 크기 조절할때 오류가 나서 추가함 
            // data.width = obj.width();         //  data.width = obj,width() 추가하면 아이콘크기 조절에 문제 생김 
            // data.height = obj.height();
          // }
          // }
          data.width = obj.width();
          data.height = obj.height();
          
          
          var x = this.element.width() / 2 - data.width / 2;
          var y = this.element.height() / 2 - data.height / 2;
          TweenLite.set(obj, { x: x, y: y });
          
          obj.data('objData', data);
          
          obj.find('.btn-').on(touchstart, function (e) {
            if (owner.touchMode != 'lineDraw') {
              var obj = $(this).parents('.obj');
              owner.element.find('.obj').removeClass('select');
              owner.selectObj(obj);
              
              onTouchStart.call(owner, e);
            }
          });
          
          if (type !== 'undoObj') {
            owner.selectObj(obj);
          }
          
          owner.selectObj(obj);
          // console.log($('.drawing-content .drawing-cont .obj').length);
        },
        

        addText: function (str, color) {
          console.log('addText in angle.js');
          var source = '<div style="color:' + color + '; ">' + str + '</div>';
          // var source = `<div style="color:${color};" value=text${undoTextObj}> ${str} </div>`;
          var data = {
            key: 'obj-text',
            width: 130,
            height: 115,
            // height: 90,
            source: source
          };
          this.addObj(data, 'text');

          if($('.drawing-content .drawing-cont .obj').length > 0){  // undo 길이 0일때 이벤트 막기
            $('.undo-btn').removeClass("not-undo")
          }
        },
       

        selectObj: function (obj) {
          this.unselectObj();
          obj.addClass('select');

          if ($('.btn-del-select').hasClass('undo')) {
            $('.btn-del-select')?.text('선택 삭제');
            $('.btn-del-select')?.removeClass('undo');
          }
          
          if ($('.btn-del-all').hasClass('undo')) {
            $('.btn-del-all')?.text('전체 삭제');
            $('.btn-del-all')?.removeClass('undo');
          }

          this.objectContainer.append(obj);
          this.touchMode = null;
        },

        unselectObj: function () {
          this.objectContainer.find('.obj').removeClass('select');
          this.objectContainer.find('.lines').removeClass('select');
          this.element.find('.select-btn').eq(0).removeClass('active');
          this.touchMode = null;
        },

        deleteObj: function () {
          if (!this.objectContainer.find('.obj.select')[0]) return;

          const coord = {
            x: this.objectContainer.find('.obj.select')[0]?._gsTransform.x,
            y: this.objectContainer.find('.obj.select')[0]?._gsTransform.y
          };

          undoObj.push({
            objData: this.objectContainer.find('.obj.select')?.data('objData'),
            coord: coord
          });

          $('.btn-del-select')?.text('되돌리기');
          $('.btn-del-select')?.addClass('undo');

          this.objectContainer.find('.obj.select').remove();
          this.objectContainer.find('.lines.select').remove();

        },

        undoObj: function () {
          if (undoObj.length > 0) {
            const info = undoObj.pop();
            this.addObj(info.objData, 'undoObj');
            TweenLite.set(this.objectContainer.find('.obj').last(), {
              x: info.coord.x,
              y: info.coord.y
            });
          }
        },

        deleteAllObj: function () {
          if (!this.objectContainer.find('.obj').length) return;

          undoObjAll.length = 0;

          this.objectContainer.find('.obj').each(function () {
            const coord = {
              x: this._gsTransform.x,
              y: this._gsTransform.y
            };
            
            // console.log($(this).data('objData'))
            undoObjAll.push({
              objData: $(this).data('objData'),
              coord: coord
            });
          });

          this.objectContainer.find('.obj').remove();
          this.objectContainer.find('.lines').remove();

          $('.btn-del-all')?.text('전체 되돌리기');
          $('.btn-del-all')?.addClass('undo');
        },

        undoAllObj: function () {
          if (undoObjAll.length > 0) {
            undoObjAll.forEach(info => {
              this.addObj(info.objData);
              TweenLite.set(this.objectContainer.find('.obj').last(), {
                x: info.coord.x,
                y: info.coord.y
              });
            });

            undoObjAll.length = 0;
          }
        },

        dispose: function () {
          this.selectIndex = 0;
          this.element.find('.select-btn').removeClass('active');
          this.element.find('.select-btn').off('mouseup touchend');
          this.canvas.off('mousedown touchstart');
          $(window).off('mousemove touchmove mouseup touchend');
        },

        reset: function () {
          var owner = this;
          this.element.removeClass('open');
          this.element.find('.select-btn').removeClass('active');
          // this.deleteAllObj();
        }

        // reStart : function () {
        // 	this.dispose();
        // 	this.init(this.element, this.options);
        // 	this.start();
        // }
      });
    })();
    
    

  // 메인 기본 옵션
  AngleTool.DEFAULT = { autoStart: true, thickness: 2 };

  function Plugin(option, params) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('ui.angleTool');
      var options = $.extend(
        {},
        AngleTool.DEFAULT,
        typeof option == 'object' && option
      );
      if (!data)
        $this.data('ui.angleTool', (data = new AngleTool($this, options)));
      if (typeof option == 'string') data[option](params);
      $this.data('instance', data);
    });
  }

  window.AngleTool = AngleTool;

  $.fn.angleTool = Plugin;
  $.fn.angleTool.Constructor = AngleTool;
})(jQuery);

// var angleInner =
// '<div class="test-point p-01"></div>'
// +'<div class="test-point p-02"></div>'
// +'<div class="drawing-content">'
// +'	<div class="drawing-cont">'
// +'		<div class="not-obj"></div>'
// +'	</div>'
// +'	<div class="tool-container">'
// +'		<div class="ico-info btn-open">'
// +'			<span>그려보세요</span>'
// +'			<span class="ico-arr"></span>'
// +'		</div>'
// +'		<div class="tool-box">'
// +'			<ul class="list">'
// +'				<li class="btn- select-btn"></li>'
// +'				<li class="btn- select-btn"></li>'
// +'				<li class="btn- select-btn"></li>'
// +'				<li class="btn- select-btn"></li>'
// +'				<li class="btn- select-btn btn-del"></li>'
// +'			</ul>'
// +'		</div>'
// +'	</div>'
// +'</div>'

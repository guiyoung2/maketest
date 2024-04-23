$(function () {
  $("*[data-ui='make-map-svg']").each(function (i) {
    var option = $(this).attr('data-option')
      ? $.parseJSON($(this).attr('data-option'))
      : {};
    $(this).makeMapSvg(option);
  });
});

/*
 *	MakeMapSvg :: require (raphael.js, raphael.free_transform.js, html2canvas.js)
 */
(function ($) {
  'use strict';

  var MakeMapSvg =
    MakeMapSvg ||
    (function () {
      var instance;
      var nowObj = null;
      var isMove, startPt, oldPt, nowPt;
      var isRotate;
      var imgBg;
      var imgBgClone;
      var dataDep1,
        dataDep2 = [],
        loadIdx = null;
      var svgSaveSnap;
      var ftList = [];
      var location_dep1, location_dep2, location_dep2_select;

      var svgObjList = null;
      var svgPageMax = 6;
      var svgPageTotal, svgPageNow;
      var svgPageHeight = 375;

      function initFn() {
        var owner = this;

        // 선택 박스 공통
        $('.select-box .select').on('click', function () {
          var selectBox = $(this).parents('.select-box');

          $('.select-cont .select-box').not(selectBox).removeClass('open');
          if (selectBox.hasClass('open')) {
            selectBox.removeClass('open');
          } else {
            selectBox.addClass('open');
          }
        });

        // 스크롤바 디자인 적용
        $('.scroll-box').each(function () {
          let instance = $(this)
            .overlayScrollbars({
              overflowBehavior: {
                x: 'hidden',
                y: 'scroll'
              }
            })
            .overlayScrollbars();
          $(this).data('scrollbar', instance);
        });

        // 지도 크기 조정 팝업
        $('.popup-scale .list-box > .list > li').on('click', function () {
          var idx = $(this).index();
          var txt = $.trim($(this).text());
          var per = parseInt(txt.replace('%', '')) / 100;
          bgScale(per);

          $('.popup-scale .select-box').removeClass('open');
        });

        $('.popup-scale .btns-zoom > .btn').on('click', function () {
          var type = $(this).data('type');

          var imgBg = $('.img-bg');
          var transform = imgBg[0]._gsTransform;
          var scale = transform.scaleX;

          if (type == 'up') scale += 0.1;
          else scale -= 0.1;

          bgScale(scale);
        });

        $('.popup-scale .btns > .btn').on('click', function () {
          var type = $(this).data('type');
          if (type == 'cancel') {
            imgBg.remove();

            $('.bg-content').append(imgBgClone);
            imgBg = imgBgClone;
            imgBg.off(touchstart).on(touchstart, startDragBg);
            instance.endBgControl();
          } else {
            console.log(location_dep2_select);
            var txt = $('.select-cont .dep2 .list-box .list > li')
              .eq(location_dep2_select)
              .attr('value');
            $('.select-cont .dep2 .select .text').text(txt);
            instance.endBgControl();
          }
          imgBg.find('.box').remove();
        });

        // svg 오브젝트 관련 버튼
        $('.slide-controls .btn-prev').on('click', function () {
          var pageIdx = svgPageNow - 1;
          setSvgPage(pageIdx - 1);
        });
        $('.slide-controls .btn-next').on('click', function () {
          var pageIdx = svgPageNow + 1;
          setSvgPage(pageIdx - 1);
        });

        $('.btn-del-select').on('click', function () {
          instance.deleteObj();
        });
        $('.btn-del-all').on('click', function () {
          instance.deleteObjAll();
        });

        // svg 리스트 로드
        this.loadXML('./xml/svgList.xml', $.proxy(loadedSvgList, this));

        if (window.hasOwnProperty('mapData') && $('.select-cont').length > 0) {
          console.log('mapData: ', mapData);
          dataDep1 = mapData.dep1;
          makeDep1();
          loadDep2(0);

          // $("#dep1").on("change", function(e){
          // 	console.log(this.value);
          // 	var	idx = dataDep1.indexOf(this.value);
          // 	loadDep2(idx);
          // });

          // $("#dep2").on("change", function(e){
          // 	var idx = $(this).find("option:selected").index() - 1;
          // 	if(idx < 0) return;
          // 	var img = $(this).find("option:selected").attr("img");
          // 	var file = "./images/" + img + ".png";
          // 	instance.setBg(file);
          // });

          $('.select-cont .file-input').change(function (e) {
            var file = e.target.files[0],
              imageType = /image.*/;

            if (!file.type) return;
            if (!file.type.match(imageType)) return;

            fileRead(file);
          });
          $('.btn-file').on('click', function () {
            $('.select-cont .file-input').trigger('click');
          });
         

          var dropZone = $('body');
          //Drag기능
          dropZone.on('dragenter', function (e) {
            e.stopPropagation();
            e.preventDefault();
            dropZone.addClass('over');
          });
          dropZone.on('dragleave', function (e) {
            e.stopPropagation();
            e.preventDefault();
            dropZone.removeClass('over');
          });
          dropZone.on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
            dropZone.addClass('over');
          });
          dropZone.on('drop', function (e) {
            e.preventDefault();
            dropZone.removeClass('over');

            var files = e.originalEvent.dataTransfer.files;
            if (files != null) {
              if (files.length < 1) {
                /* alert("폴더 업로드 불가"); */
                console.log('폴더 업로드 불가');
                return;
              } else {
                selectFile(files);
              }
            } else {
              alert('ERROR');
            }
          });
        }
      }

      function makeDep1() {
        for (var i = 0; i < dataDep1.length; i++) {
          var name = dataDep1[i];
          var opt = $(
            '<li><span class="text"></span><span class="ico"></span></li>'
          );
          opt.find('.text').text(name);
          opt.attr('value', name);
          $('.select-cont .dep1 .list').append(opt);

          opt.on('click', function (e) {
            console.log(this);
            var idx = $(this).index();
            console.log(idx);
            loadDep2(idx);
          });
        }
      }

      function makeDep2(idx) {
        var array = dataDep2[idx];
        if (array.length < 1) return;

        $('.select-cont .dep2 .list').empty();
        for (var i = 0; i < array.length; i++) {
          var obj = array[i];

          var opt = $(
            '<li><span class="text"></span><span class="ico"></span></li>'
          );
          opt.find('.text').text(obj.name);
          opt.attr('value', obj.name);
          opt.attr('img', obj.id);
          $('.select-cont .dep2 .list').append(opt);

          opt.on('click', function (e) {
            console.log(this);
            var idx = $(this).index();
            var txt = $(this).attr('value');
            if (idx < 0) return;

            var img = $(this).attr('img');
            var file = './images/map/' + img + '.png';
            instance.setBg(file);
            $('.select-cont .dep2 .select-box').removeClass('open');
            // $(".select-cont .dep2 .select .text").text(txt);
            location_dep2_select = idx;
          });
        }
        location_dep1 = idx;
        $('.select-cont .dep1 .select .text').text(dataDep1[idx]);
      }

      function loadDep2(idx) {
        if (!dataDep2[idx]) {
          instance.loadIdx = idx;
          var url = './xml/mapData_' + idx + '.xml';
          instance.loadXML(url, $.proxy(loadedDep2, this));
        } else {
          makeDep2(idx);
        }
        $('.select-cont .dep1 .list li').removeClass('active');
        $('.select-cont .dep1 .list li').eq(idx).addClass('active');
        $('.select-cont .dep1 .select-box').removeClass('open');
        // $(".select-cont .dep2 .select-box").addClass("open");
      }

      function loadedDep2(xml) {
        var xmlDoc = xml;
        var location = xmlDoc.getElementsByTagName('location');
        var array = [];
        for (var i = 0; i < location.length; i++) {
          var obj = {};
          obj.name =
            location[i].getElementsByTagName('name')[0].childNodes[0].nodeValue;
          obj.id =
            location[i].getElementsByTagName('id')[0].childNodes[0].nodeValue;
          array.push(obj);
        }
        dataDep2[instance.loadIdx] = array;
        makeDep2(instance.loadIdx);
        instance.loadIdx = null;
      }

      function loadedSvg(xml) {
        var svg = $(xml).find('svg');
        var data = new XMLSerializer().serializeToString(svg[0]);
        instance.addSVG(data);
      }

      function loadedSvgList(xml) {
        var xmlDoc = xml;
        svgObjList = xmlDoc.getElementsByTagName('location');

        // svg 리스트 작성
        for (var i = 0; i < svgObjList.length; i++) {
          var node = svgObjList[i];
          var name = node.getAttribute('name');

          var li = $(
            '<li><span class="text"></span><span class="ico"></span></li>'
          );
          li.find('.text').text(name);
          $('.aside-right .list-box .list').append(li);

          li.on('click', function () {
            var idx = $(this).index();
            makeSvgList(idx);
            $('.aside-right .select-box').removeClass('open');
          });
        }
        makeSvgList(0);
      }

      function makeSvgList(idx) {
        var svgListUL = $('.aside-right .svg-list .list');
        svgListUL.empty();

        var location = svgObjList[idx];
        $('.aside-right .select .text').text(location.getAttribute('name'));
        var list = location.getElementsByTagName('list');

        for (var i = 0; i < list.length; i++) {
          var name =
            list[i].getElementsByTagName('name')[0].childNodes[0].nodeValue;
          var src =
            list[i].getElementsByTagName('file')[0].childNodes[0].nodeValue;

          var li = $(
            '<li><img src="./svg/svg_1_1.svg" alt=""><span>병원</span></li>'
          );
          li.find('span').text(name);
          li.find('img').attr('src', src);
          $('.aside-right .svg-list .list').append(li);

          li.on('click', function () {
            var svg = $(this).find('img').attr('src');
            instance.loadXML(svg, $.proxy(loadedSvg, this));
          });
        }

        // 탭 작성
        $('.aside-right .slide-controls .tabs').empty();

        svgPageTotal = 0;
        if (list.length > svgPageMax) {
          svgPageNow = 1;
          svgPageTotal = Math.ceil(list.length / svgPageMax);

           for (var i = 0; i < svgPageTotal; i++) {
            var tab = $('<div class="tab btn"></div>');
            tab.on('click', function (e) {
              GlobalAudio.play('button');

              setSvgPage($(this).index());
            });
            $('.aside-right .slide-controls .tabs').append(tab);
          }
        }

        setSvgPage(0);
      }

      function setSvgPage(idx) {
        $('.aside-right .svg-list .list').css('top', -(idx * svgPageHeight));

        svgPageNow = idx + 1;
        $('.aside-right .slide-controls .tabs .tab').removeClass('active');
        $('.aside-right .slide-controls .tabs .tab')
          .eq(svgPageNow - 1)
          .addClass('active');

        $('.aside-right .slide-controls .btn-prev').addClass('dim');
        $('.aside-right .slide-controls .btn-next').addClass('dim');

        if (svgPageTotal < 2) return;

        if (svgPageNow > 1) {
          $('.aside-right .slide-controls .btn-prev').removeClass('dim');
        }
        if (svgPageNow < svgPageTotal) {
          $('.aside-right .slide-controls .btn-next').removeClass('dim');
        }
      }

      function selectFile(fileObject) {
        var files = null;

        if (fileObject != null) {
          files = fileObject;
        } else {
          // 직접 파일 등록시
          files = $('#multipaartFileList_' + fileIndex)[0].files;
        }
        console.log('selectFile: ', files);
        // 다중파일 등록
        if (files != null) {
          var file = files[0];
          fileRead(file);
        }

        resetLocation();
      }

      function fileRead(file) {
        var reader = new FileReader();
        reader.onload = fileOnload;
        reader.readAsDataURL(file);
      }

      function fileOnload(e) {
        var imgURI = e.target.result;
        instance.setBg(imgURI);
        $('.select-cont .file-input').val('');
        $('#dep2').val('');
        resetLocation();
      }

      function bgScale(scale) {
        console.log(scale);
        if (scale < 0.1) return;

        var imgBg = $('.img-bg');
        TweenLite.to(imgBg, 0, { scale: scale });

        if (scale <= 1) {
          TweenLite.set(imgBg, { x: 0, y: 0 });
        }

        var txt = Math.round(scale * 10) * 10;
        console.log(txt);
        $('.popup-scale .select .text').text(txt + '%');
        $('.btns-scale .text').text(txt + '%');
      }

      function resetLocation() {
        $('.select-cont .select-box').removeClass('open');
        $('.select-cont .dep1 .select-box .list-box .list > li').removeClass(
          'active'
        );
        $('.select-cont .dep1 .select-box .select .text').text('선택');
        $('.select-cont .dep2 .select-box .select .text').text('선택');
      }

      function startDragBg(e) {
        console.log('startDrag');
        imgBg.data('drag', true);
        $(window).on(touchmove, moveDragBg);
        $(window).on(touchend, endDragBg);
        var pageX = e.pageX || e.originalEvent.changedTouches[0].clientX;
        var pageY = e.pageY || e.originalEvent.changedTouches[0].clientY;
        imgBg.data('startPos', { x: pageX, y: pageY });
      }
      function moveDragBg(e) {
        if (!imgBg.data('drag')) return;

        var pageX = e.pageX || e.originalEvent.changedTouches[0].clientX;
        var pageY = e.pageY || e.originalEvent.changedTouches[0].clientY;

        var dx = pageX - imgBg.data('startPos').x;
        var dy = pageY - imgBg.data('startPos').y;

        var transform = imgBg[0]._gsTransform;
        var scale = transform.scaleX;

        if (scale <= 1) return;
        // console.log("move");
        // console.log(dx, dy);

        var x = transform.x + dx; // imgBg.position().left;
        var y = transform.y + dy; // imgBg.position().top;
        var width = imgBg.width();
        var height = imgBg.height();
        var bound = { x: x, y: y, width: width, height: height };

        // TweenLite.set(imgBg, {x: bound.x, y: bound.y});
        TweenLite.set(imgBg, { x: x, y: y });
        // console.log(transform.x, transform.y);
        // console.log(bound);

        imgBg.data('startPos', { x: pageX, y: pageY });
      }
      function endDragBg(e) {
        console.log('end');
        var pageX = e.pageX || e.originalEvent.changedTouches[0].clientX;
        var pageX = e.pageY || e.originalEvent.changedTouches[0].clientY;

        $(window).off(touchmove, moveDragBg);
        $(window).off(touchend, endDragBg);

        imgBg.data('drag', false);
      }

      return Class.extend({
        init: function (element, options) {
          instance = this;
          this.element = element;
          this.options = options;

          this.printContainer, this.drawContainer;
          this.paperObject, this.drawCont;

          // this.controlSet = null;

          this.paperWidth = this.options.width;
          this.paperHeight = this.options.height;
          this.setPaper();
          console.log('options: ', this.options);
          initFn.call(this);
        },
        setPaper: function () {
          this.printContainer = $('<div class="print-container"></div>');
          this.drawContainer = $('<div class="draw-container"></div>');
          this.element.prepend(this.printContainer);
          this.printContainer.prepend(this.drawContainer);
          this.drawContainer.prepend(
            $('<div class="svg svg-object" id="svg-object"></div>')
          );
          this.drawContainer.prepend(
            $('<div class="bg-content"><div class="img-bg"></div></div>')
          );
          this.element.find('.svg').css('position', 'absolute');
          // this.element.find(".img-bg").prepend($('<img src="" alt=""/>'));
          // this.element.find(".img-bg").append($('<div class="box"></div>'));
          this.paperObject = Raphael(
            this.element.find('.svg-object')[0],
            this.paperWidth,
            this.paperHeight
          );

          // ------------------------------------------- 이미지 저장할 때 폰트 스타일 안 먹는 이슈 saveImage;
          // var defs = this.paperObject.defs;
          this.element.find('.svg-object svg').find('defs').remove();

          const defs = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'defs'
          );
          const style = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'style'
          );
          style.type = 'text/css';
          style.innerHTML = `
									@font-face {
										font-family: "NanumGothicB";
											src: url("./fonts/NanumGothic-Bold.woff") format("woff");
										}
									}
									* {
										font-family: 'NanumGothicB';
    									font-size: 20px !important;
									}
									`;
          defs.appendChild(style);
          this.element.find('.svg-object svg')[0].appendChild(defs);
          // ------------------------------------------- 이미지 저장할 때 폰트 스타일 안 먹는 이슈;

          svgSaveSnap = Snap(document.getElementById('svg-save'));

          // this.element.find(".svg-object").css({"width": thispaperWidth, "height": thispaperHeight});
          var back = this.paperObject.rect(
            0,
            0,
            this.paperWidth,
            this.paperHeight
          );
          back.attr('fill', 'f00').attr('opacity', 0).attr('stroke', 'none');
          $(back.node).addClass('back');
          $(back.node).on(touchend, function (e) {
            instance.unselectObj(null);
          });

          imgBg = this.element.find('.img-bg');
          imgBg.on(touchstart, startDragBg);
        },
        setBg: function (imgUrl) {
          var owner = this;

          imgBgClone = imgBg.clone();

          imgBg.empty();
          imgBg.append($('<div class="box"></div>'));

          if (imgUrl) {
            var image = new Image();
            image.addEventListener('load', function () {
              var paper = {
                width: owner.paperWidth,
                height: owner.paperHeight
              };
              var bound = owner.getBoundLimit(paper, image);
              imgBg.append(image);

              TweenLite.set(imgBg, { scale: 1, x: 0, y: 0 });
              var x = (paper.width - bound.width) / 2;
              var y = (paper.height - bound.height) / 2;
              TweenLite.set(image, {
                width: bound.width,
                height: bound.height,
                x: x,
                y: y
              });
              TweenLite.set(imgBg.find('.box'), {
                width: bound.width,
                height: bound.height,
                x: x,
                y: y
              });
              startBgControl();
            });
            image.src = imgUrl;
          }

          function startBgControl() {
            $('body').addClass('bg-control');
            owner.element.addClass('bg-control');
            $('.popup-scale').show();
            $('.popup-scale .select .text').text(parseInt(1 * 100) + '%');
            $('.btns-scale').show();
            $('.btns-scale .text').text(parseInt(1 * 100) + '%');
          }
        },
        endBgControl: function () {
          $('.popup-scale .select-box').removeClass('open');
          $('body').removeClass('bg-control');
          this.element.removeClass('bg-control');
          $('.popup-scale').hide();
          $('.btns-scale').hide();
        },
        addSVG: function (svgStr) {
          console.log('addSVG');
          var paper = this.paperObject;
          var set = paper.set();
          paper.importSVG(svgStr, set);
          // paper.importSVG('<svg><rect x="50" y="50" fill="#FF00FF" width="100" height="100" /></svg>', set);

          var bound = set.getBBox();
          var boxBound = set.getBBox();

          var boxAttr = {
            fill: '#ffff00',
            'fill-opacity': 0,
            stroke: '#1344B4',
            'stroke-width': 4,
            'stroke-opacity': 0
          };
          var box = paper.rect(
            boxBound.x,
            boxBound.y,
            boxBound.width,
            boxBound.height
          );
          box.attr(boxAttr);

          set.push(box);

          var ft = paper.freeTransform(
            set,
            {
              keepRatio: true,
              attrs: { stroke: '#999' },
              distance: 1,
              draw: ['bbox'],
              rotate: ['axisX'],
              // rotate: ['axisX', 'axisY'],
              scale: ['bboxCorners'],
              // size: { "axes": "20", "bboxCorners": 20, bboxSides: 20, center: 0 }
              size: '10'
            },
            function (ft, events) {
              console.log(ft.attrs);
              // console.log(events);
              if (events == 'rotate start') {
                isRotate = true;
              } else if (events == 'rotate end') {
                isRotate = false;
              } else if (events == 'rotate') {
              }
            }
          );

          ftList.push(ft);

          var x = paper.width / 2 - bound.width / 2;
          var y = paper.height / 2 - bound.height / 2;
          ft.attrs.translate = { x: x, y: y };
          ft.apply();

          instance.selectObj(ft);

          box.data('ft', ft);
          $(box[0]).addClass('active');
          box.mouseover(function (e) {
            var box = $(e.target);
            box.addClass('hover');
          });
          box.mouseout(function (e) {
            var box = $(e.target);
            box.removeClass('hover');
          });
          box.mousedown(function (e) {
            var ft = this.data('ft');
            instance.selectObj(ft);

            var box = $(e.target);
            box.addClass('active');
          });
        },
        addText: function (str) {
          var paper = this.paperObject;
          // var t = paper.text(50, 50, "Raphaël\nkicks\nbutt!");
          var obj = paper.text(50, 50, str);
          obj.attr({ 'font-size': 40 });
          // obj.attr({"font-family": "NanumGothicB", "font-size": 20});

          var bound = obj.getBBox();
          var boxBound = obj.getBBox();
          var boxAttr = {
            fill: '#ffff00',
            'fill-opacity': 0,
            stroke: '#1344B4',
            'stroke-width': 4,
            'stroke-opacity': 0,
            cursor: 'move'
          };
          var box = paper.rect(
            boxBound.x,
            boxBound.y,
            boxBound.width,
            boxBound.height
          );
          box.attr(boxAttr);

          var set = paper.set(obj, box);
          var ft = paper.freeTransform(
            set,
            {
              keepRatio: true,
              attrs: { stroke: '#999' },
              distance: 1,
              draw: ['bbox'],
              rotate: ['axisX'],
              scale: ['bboxCorners'],
              // size: { "axes": "10", "bboxCorners": 10, bboxSides: 10, center: 0 }
              size: '10'
            },
            function (ft, events) {
              // console.log(ft.attrs);
              // console.log(events);
            }
          );

          ftList.push(ft);

          var x = paper.width / 2 - bound.width / 2;
          var y = paper.height / 2 - bound.height / 2;
          ft.attrs.translate = { x: x, y: y };
          ft.apply();

          instance.selectObj(ft);

          box.data('ft', ft);
          $(box[0]).addClass('active');
          box.mouseover(function (e) {
            var box = $(e.target);
            box.addClass('hover');
          });
          box.mouseout(function (e) {
            var box = $(e.target);
            box.removeClass('hover');
          });
          box.mousedown(function (e) {
            var ft = this.data('ft');
            instance.selectObj(ft);

            var box = $(e.target);
            box.addClass('active');
          });
        },
        selectObj: function (ft) {
          if (nowObj == ft) return;
          instance.unselectObj();
          nowObj = ft;
          ft.showHandles();

          console.log('selectObj');
        },
        unselectObj: function () {
          if (isRotate == true) {
            isRotate = false;
            return;
          }

          $('svg rect').removeClass('active');
          if (nowObj == null) return;
          nowObj.hideHandles();
          nowObj = null;

          console.log('unselectObj');
        },
        getBoundOuter: function (n) {},
        getTransformStr: function () {
          var str = 'T';
          str += x + ',' + y;
          // str +=
          return str;
        },
        getBoundLimit: function (paper, image) {
          var bound = { x: 0, Y: 0, width: 0, height: 0 };

          var ratioX = paper.width / image.width;
          var ratioY = paper.height / image.height;
          var ratio = Math.min(ratioX, ratioY);

          bound.width = image.width * ratio;
          bound.height = image.height * ratio;
          bound.x = (paper.width - bound.width) / 2;
          bound.y = (paper.height - bound.height) / 2;

          return bound;
        },
        setMoveEvent: function (svgElement, onMoveCallback) {
          var node = svgElement.node;
          $(node).on(touchstart, function (e) {
            isMove = true;
            startPt = getMousePoint(e);
            oldPt = startPt;

            instance.element.find('.svg-object').on(touchmove, function (e) {
              if (!isMove) return;
              nowPt = getMousePoint(e);
              if (onMoveCallback) {
                onMoveCallback.call(instance, e);
              }
              oldPt = nowPt;
            });
            instance.element.find('.svg-object').on(touchend, function (e) {
              isMove = false;
              console.log('end');

              $(this).off(touchmove);
              $(this).off(touchend);

              e.preventDefault();
              e.stopPropagation();
            });
          });
        },
        deleteObj: function () {
          if (nowObj == null) return;

          var newList = [];
          for (var i = 0; i < ftList.length; i++) {
            var ft = ftList[i];
            if (ft != nowObj) {
              newList.push(ft);
            }
          }

          ftList = newList;

          $(nowObj.items).each(function (i) {
            this.el.remove();
          });
          nowObj.unplug();
        },
        deleteObjAll: function () {
          console.log(nowObj);
          for (var i = 0; i < ftList.length; i++) {
            var ft = ftList[i];
            $(ft.items).each(function (i) {
              this.el.remove();
            });
            ft.unplug();
          }

          ftList = [];
        },
        saveImage: function (name) {
          instance.unselectObj();

          /**
           * :: ie11 이슈 :: 결론적으로 ie11이하 브라우저는 "이미지 저장", "인쇄" 기능을 막아야 할 듯!!!
           *
           *
           * !!!! ie11 저장만 하지 않는다면 snap.js 라이브러리 사용하지 않아도 됨.
           *
           * 1. svg-object의 데이터를 svg-save로 jQuery로 복사하여 append 시켜주는 것이 안된다.(ie11만 안됨) -- snap.svg 라이브러리 사용으로 해결
           * 2. html2canvas 라이브러리 :: ie11 promise 오류 == "es6-promise.auto.js" 삽입하면 해결 됨.
           * 2. object canvas toDataURL에서 safe 오류 발생.
           * 3. bg 그림 크기, 위치가 맞지 않게 들어간다.
           *
           * 4. 이미지로 저장할 때 svg로 넣은 텍스트의 폰트가 적용되지 않는다.
           *    ==> 폰트를 살려야겠다면 텍스트 입력은 svg가 아닌 다른 방식으로 넣어야겠다.
           */

          // this.element.find(".svg-object svg").find("defs").remove();
          // this.element.find(".svg-object svg").find("desc").remove();
          // $(svgSaveSnap.node).find("defs").remove();
          // $(svgSaveSnap.node).find("desc").remove();

          svgSaveSnap.clear();

          var children = $('#svg-object svg').children();
          children.each(function (i) {
            var clone = $(this).clone()[0];
            svgSaveSnap.append(clone);
          });

          var bg = $('.bg-content')[0];

          var svg = $('.svg-object svg')[0];
          // var svg = $("#svg-save")[0];

          var canvas = $('.save-canvas')[0];
          var ctx = canvas.getContext('2d');
          var width = this.options.width;
          var height = this.options.height;
          ctx.clearRect(0, 0, width, height);

          var bgCanvas = null;
          if (imgBg.find('img').attr('src') == '') {
            next();
          } else {
            // 1. bg -> image (html2canvas.js)
            html2canvas(bg).then(function (_canvas) {
              bgCanvas = _canvas;
              next();
            });
          }
          // 2. object -> image (native)
          function next() {
            var data = new XMLSerializer().serializeToString(svg);
            // console.log(data);
            var DOMURL = window.URL || window.webkitURL || window;
            var svgBlob = new Blob([data], {
              type: 'image/svg+xml;charset=utf-8'
            });
            var url = DOMURL.createObjectURL(svgBlob);

            // var url = svgSaveSnap.toDataURL();
            // console.log(url);

            var img = new Image();
            img.onload = function (e) {
              if (bgCanvas != null) ctx.drawImage(bgCanvas, 0, 0);
              else {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, instance.paperWidth, instance.paperHeight);
              }
              ctx.drawImage(img, 0, 0);

              DOMURL.revokeObjectURL(url);

              var imgURI = canvas
                .toDataURL('image/png')
                .replace('image/png', 'image/octet-stream');

              // --- save
              instance.downloadURI(imgURI, name + '.png');

              // --- test
              $('.img-debug img').attr('src', imgURI);
            };
            img.src = url;
          }
        },
        downloadURI: function (uri, name) {
          var link = document.createElement('a');
          link.download = name;
          link.href = uri;
          document.body.appendChild(link);
          link.click();
        },
        loadXML: function (url, callback) {
          var jqxhr = $.ajax({
            type: 'GET',
            url: url,
            dataType: 'xml'
          })
            .done(function (xml) {
              console.log('xml load success!');
              if (callback) callback(xml);
            })
            .fail(function () {
              alert('error');
            });
        },
        start: function () {},
        reset: function () {
          imgBg.empty();
          this.deleteObjAll();

          $('.select-cont .dep2 .select-box .select .text').text('선택');
        },
        dispose: function () {
          // this.element.removeClass("start active finish");
        }
      });
    })();

  // 기본 옵션
  MakeMapSvg.DEFAULT = { width: 1280, height: 800 };
  
  

  function Plugin(option, params) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('ui.makeMapSvg');
      var options = $.extend(
        {},
        MakeMapSvg.DEFAULT,
        typeof option == 'object' && option
      );
      if (!data)
        $this.data('ui.makeMapSvg', (data = new MakeMapSvg($this, options)));
      if (typeof option == 'string') data[option](params);
      $this.data('instance', data);
    });
  }

  $.fn.makeMapSvg = Plugin;
  $.fn.makeMapSvg.Constructor = MakeMapSvg;
})(jQuery);

window.debug = function (str) {
  $('.debug').append(str + '\n');
};
window.debugOn = function () {
  var display = $('.save-canvas').css('display');
  if (display == 'none') display = 'block';
  else display = 'none';

  $('.save-canvas').css('display', display);
  $('.img-debug').css('display', display);
};

function getMousePoint(e) {
  var pageX = e.pageX;
  var pageY = e.pageY;

  if (e.originalEvent.changedTouches) {
    pageX = e.originalEvent.changedTouches[0].clientX;
    pageY = e.originalEvent.changedTouches[0].clientY;
  }
  console.log(window.scale);
  return { x: pageX, y: pageY };
}

'use strict';

var makemapF = function () {
  var lib, nowObj, isMove;
  var bgBounds = { x: 0, y: 0, width: 1180, height: 700 };
  var canvasBounds = { x: 0, y: 0, width: 1280, height: 800 };

  function makeDep1() {
    for (var i = 0; i < instance.dataDep1.length; i++) {
      var name = instance.dataDep1[i];
      var opt = $('<option></option>');
      opt.attr('value', name);
      opt.text(name);
      $('#dep1').append(opt);
    }
    // instance.dataDep1.map((name) => {
    // 	var opt = $('<option></option>');
    // 	opt.attr("value", name);
    // 	opt.text(name);
    // 	$("#dep1").append(opt);
    // });
  }

  function makeDep2(idx) {
    var array = instance.dataDep2[idx];
    if (array.length < 1) return;

    $('#dep2').empty();
    var opt = $('<option value="">선택</option>');
    $('#dep2').append(opt);
    for (var i = 0; i < array.length; i++) {
      var obj = array[i];
      var opt = $('<option></option>');
      opt.attr('value', obj.name);
      opt.text(obj.name);
      opt.attr('img', obj.id);
      $('#dep2').append(opt);
    }
    // array.map((obj) => {
    // 	var opt = $('<option></option>');
    // 	opt.attr("value", obj.name);
    // 	opt.text(obj.name);
    // 	opt.attr("img", obj.id);
    // 	$("#dep2").append(opt);
    // });
  }

  function loadDep2(idx) {
    if (!instance.dataDep2[idx]) {
      instance.loadIdx = idx;
      var url = 'mapData_' + idx + '.xml';
      instance.loadXml(url);
    } else {
      makeDep2(idx);
    }
  }

  // 파일 선택시
  function selectFile(fileObject) {
    var files = null;

    if (fileObject != null) {
      // 파일 Drag 이용하여 등록시
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
  }

  function fileRead(file) {
    console.log('fileRead');
    var reader = new FileReader();
    reader.onload = fileOnload;
    reader.readAsDataURL(file);
  }

  function fileOnload(e) {
    var $img = $('<img>', { src: e.target.result });

    // 캔버스에 그리기
    var bg = exportRoot.getChildByName('bg');
    instance.removeBg();

    $img.on('load', function (e) {
      var image = $img[0];

      var wid = image.width > bgBounds.width ? bgBounds.width : image.width;
      var hei = image.height > bgBounds.height ? bgBounds.height : image.height;
      var ratioX = wid / image.width;
      var ratioY = hei / image.height;
      var ratio = Math.min(ratioX, ratioY);
      var bounds = {
        x: 0,
        y: 0,
        width: image.width * ratio + 2,
        height: image.height * ratio + 2
      };

      var obj = new createjs.Bitmap(image);
      obj.setTransform(bgBounds.x, bgBounds.y, ratio, ratio);
      obj.nominalBounds = bounds;

      var mc = new lib.controlBox();
      mc.imgBox.addChild(obj);
      mc.obj = obj;
      mc.on('added', function () {
        setTimeout(function () {
          instance.selectObj(mc);
        }, 100);
      });

      bg.addChild(mc);
    });

    $('#dep2').val('');
  }

  var instance = {
    init: function () {
      console.log('makemap init');

      // 캔버스 셋팅
      createjs.Touch.enable(stage);
      stage.enableMouseOver();
      var comp = AdobeAn.getComposition('5E665500903C37419BE6B08396E12638');
      lib = comp.getLibrary();

      var mc = new createjs.MovieClip();
      mc.name = 'bg';
      exportRoot.addChild(mc);
      // console.log(exportRoot.getChildByName("bg"));

      // 지역 셋팅
      this.dataDep1 = mapData.dep1;
      this.dataDep2 = [];
      this.loadIdx = null;
      makeDep1();
      loadDep2(0);

      $('#dep1').on('change', function (e) {
        console.log(this.value);
        var idx = instance.dataDep1.indexOf(this.value);
        loadDep2(idx);
      });

      $('#dep2').on('change', function (e) {
        var idx = $(this).find('option:selected').index() - 1;
        var img = $(this).find('option:selected').attr('img');
        instance.setImage(img);
      });

      $('#file-input').change(function (e) {
        var file = e.target.files[0],
          imageType = /image.*/;

        if (!file.type) return;
        if (!file.type.match(imageType)) return;

        fileRead(file);
      });
      $('.btn-file').on('click', function () {
        console.log('btn-file click');
        GlobalAudio.play('button');
        $('#file-input').trigger('click');
      });

      // var dropZone = $('body');
      // //Drag기능
      // dropZone.on('dragenter', function(e) {
      //     e.stopPropagation();
      //     e.preventDefault();
      //     dropZone.addClass("over");
      // });
      // dropZone.on('dragleave', function(e) {
      //     e.stopPropagation();
      //     e.preventDefault();
      //     dropZone.removeClass("over");
      // });
      // dropZone.on('dragover', function(e) {
      //     e.stopPropagation();
      //     e.preventDefault();
      //     dropZone.addClass("over");
      // });
      // dropZone.on('drop', function(e) {
      //     e.preventDefault();
      //     dropZone.removeClass("over");

      //     var files = e.originalEvent.dataTransfer.files;
      //     if (files != null) {
      //         if (files.length < 1) {
      //             /* alert("폴더 업로드 불가"); */
      //             console.log("폴더 업로드 불가");
      //             return;
      //         } else {
      //             selectFile(files)
      //         }
      //     } else {
      //         alert("ERROR");
      //     }
      // });

      // 오브젝트 버튼
      $('.btn-obj').on(touchstart, function (e) {
        var idx = $(this).index();
        // instance.addObject(idx);
        var obj = new lib['obj' + (idx + 1)]();
        var mc = new lib.controlBox();
        mc.imgBox.addChild(obj);
        mc.obj = obj;
        mc.on('added', function () {
          setTimeout(function () {
            instance.selectObj(mc);
          }, 100);
        });
        exportRoot.addChild(mc);

        e.preventDefault();
        e.stopPropagation();
      });

      $('body').on(touchstart, function () {
        if (!isMove) instance.selectObj(null);
      });

      return this;
    },

    loadXml: function (url) {
      var jqxhr = $.ajax({
        url: url
      })
        .done(function (xml) {
          // console.log("success");
          instance.xmlToJson(xml);
        })
        .fail(function () {
          alert('error');
        })
        .always(function () {
          // alert( "complete" );
        });
    },

    xmlToJson: function (xml) {
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
      this.dataDep2[instance.loadIdx] = array;
      makeDep2(instance.loadIdx);
      instance.loadIdx = null;
    },

    setImage: function (img) {
      var file = './images/' + img + '.png';
      // 1. 엘리먼트에 그리기
      $('.location-map img').attr('src', file);

      // 2. 캔버스에 그리기
      instance.removeBg();

      if (!img) return;

      console.log('bg 그리기');
      var image = new Image();
      image.addEventListener('load', function () {
        console.log('image loaded');
        var ratioX = canvasBounds.width / image.width;
        var ratioY = canvasBounds.height / image.height;
        var ratio = Math.min(ratioX, ratioY);
        var tw = image.width * ratio;
        var th = image.height * ratio;
        var left = (canvasBounds.width - tw) / 2;
        var top = (canvasBounds.height - th) / 2;

        var bitmap = new createjs.Bitmap(image);
        var bg = exportRoot.getChildByName('bg');
        bg.addChild(bitmap);
        bitmap.setTransform(left, top, ratio, ratio);
      });
      image.src = file;
    },

    removeBg: function () {
      var bg = exportRoot.getChildByName('bg');
      bg.removeAllChildren();
      $('#file-input').val('');
    },

    selectObj: function (mc) {
      if (nowObj) nowObj.deselect();

      if (!mc) {
        nowObj = null;
        return;
      } else {
        nowObj = mc;
        mc.select();
      }
    }
  };

  return instance;
};

$(function () {
  init();
});

function initMap() {
  window.makemap = new makemapF();
  window.makemap.init();
}

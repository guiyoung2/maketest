'use strict';

var makemapF = function () {
  var svg = null;
  var isMove = false;
  var nowObj = null;

  function makeDep1() {
    for (var i = 0; i < instance.dataDep1.length; i++) {
      var name = instance.dataDep1[i];
      var opt = $('<option></option>');
      opt.attr('value', name);
      opt.text(name);
      $('#dep1').append(opt);
    }
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
  }

  var instance = {
    init: function () {
      console.log('makemap init');

      svg = $('#svg');

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
  window.makemap = new makemapF();
  window.makemap.init();

  var paper = Raphael(document.getElementById('svg'), 1280, 800);
  paper.setViewBox(0, 0, 1280, 800);
  var rect = paper.rect(100, 200, 40, 80);
  var box = paper.rect(100, 200, 40, 80);
  box.attr({ stroke: '#0ff' });

  rect.attr({ fill: '#f00', stroke: '#fff', cursor: 'pointer' });
  rect.transform('r 0');
  var bound = rect.getBBox();
  // box.attr("x", bound.x).attr("y"+bound.y).attr("width", bound.width).attr("height", bound.height);

  // "t100,100r30,100,100s2,2,100,100r45s1.5"
  console.log(bound);

  rect.mousedown(function (e) {
    console.log('mousedown');
    var obj = $('#svg-object').find('.obj-01');
    console.log(obj[0]);
    console.log(this);
    // rect.transform("r" + 45);
    var rot = rect.attr('transform')[0][1];
    console.log(rot);
    rot += 50;
    rect.animate({ transform: 'r' + rot }, 500, 'easeInOut', function () {
      console.log('animation ended');
      console.log(this.transform());
      var box = rect.getBBox();
      console.log(box);
    });
    // rect.animate({x: 500}, 1000);
  });

  var rect2 = paper.rect(300, 200, 40, 80);
  rect2.attr({ fill: '#f00', stroke: '#fff', cursor: 'pointer' });
  rect2.mousedown(function (e) {
    rect.animate({ transform: 'r' + 0 }, 500, 'easeInOut', function () {
      console.log('animation ended');
      console.log(this.transform());
    });
  });
});

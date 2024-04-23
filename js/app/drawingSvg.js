var createDrawingSvg = function () {
  'use strict';

  var isIOS =
    /iPad|iPhone|iPod/.test(navigator.platform) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  var width = 1170 - margin.left - margin.right;
  var height = 691 - margin.top - margin.bottom;

  var path;

  var pathData = {
    fill: 'none',
    stroke: 'rgba(0,0,0,0.3)',
    width: 3,
    linecap: 'round',
    linejoin: 'round'
  };

  var ptdata = [];
  var session = [];

  var scale = 1;

  var drawing = false;
  var erase = false;

  var line = d3
    .line()
    .x(function (d, i) {
      return d.x;
    })
    .y(function (d, i) {
      return d.y;
    })
    .curve(d3.curveBasis);

  var svg = d3
    .select('#sketch')
    .append('svg')
    .attr('width', '980px')
    .attr('height', '650px');

  // svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.on(touchstart, listen).on(touchend, ignore).on(touchleave, ignore);

  // ignore default touch behavior
  // !! 수정 2021.01.27 :: 모바일 클릭 오류
  /**
    var touchEvents = [touchstart, touchmove, touchend];
    touchEvents.forEach(function(eventName) {
        document.body.addEventListener(eventName, function(e) {
            e.preventDefault();
        });
    });
    */

  function listen() {
    if (erase) {
      var target = d3.event.target;
      // console.log("target :: ", target.nodeName);
      if (target.nodeName === 'path') {
        var parentNode = target.parentNode;
        parentNode.removeChild(target);
      }
      return;
    }
    drawing = true;
    // output.text('event: ' + d3.event.type);
    ptdata = []; // reset point data
    path = svg
      .append('path') // start a new line
      .data([ptdata])
      // .attr("class", "line")
      // .attr("id", "line-path")
      .attr('fill', pathData.fill)
      .attr('stroke', pathData.stroke)
      .attr('stroke-width', pathData.width)
      .attr('stroke-linecap', pathData.linecap)
      .attr('stroke-linejoin', pathData.linejoin)
      .attr('d', line);

    svg.on(touchmove, onmove);
  }

  function ignore() {
    svg.on(touchmove, null);

    if (!drawing) return;
    drawing = false;

    // simplify
    ptdata = simplify(ptdata);
    // after = ptdata.length;

    if (ptdata.length === 0) {
      path.remove();
      return;
    }

    // add newly created line to the drawing session
    session.push(ptdata);

    // redraw the line after simplification
    tick();
  }

  function onmove(e) {
    var type = d3.event.type;
    var point;

    if (type === 'mousemove') {
      point = d3.mouse(this);
    } else {
      point = d3.touches(this)[0];
    }

    var x = point[0];
    var y = point[1];
    console.log(x,y);

    /**
     * IOS - Safari, Chrome 브라우저에서 scale에 따른 point 좌표값이 안 나옴.
     */
    if (isIOS) {
      x = point[0] / scale;
      y = point[1] / scale;
    }

    ptdata.push({ x: x, y: y });
    tick();
  }

  function tick() {
    path.attr('d', function (d) {
      return line(d);
    }); // Redraw the path:
  }

  function setColor(color) {
    // console.log(color);
    pathData.stroke = color;
  }

  function setStrokeWidth(w) {
    pathData.width = w;
  }

  function eraseOn() {
    erase = true;
  }

  function eraseOff() {
    erase = false;
  }

  function clear() {
    // d3.select("svg").remove();
    svg.selectAll('*').remove();
  }

  broadcaster.on('RESIZE_WINDOW', function (e) {
    scale = e.windowRatio;
    console.log('scale :: ', scale);
  });
  $(window).on('resize', function (e) {
    scale = window.scale;
    // console.log('scale :: ', scale);
  });

  var instance = {
    setColor: setColor,
    setStrokeWidth: setStrokeWidth,
    eraseOn: eraseOn,
    eraseOff: eraseOff,
    clear: clear
  };
  return instance;
};

var drawingTool = function (spec) {
  'use strict';

  var drawingSvg;

  var PENCIL_WIDTH = 3;
  var PEN_WIDTH = 10;
  var HIGHLIGHT_WIDTH = 20;

  var selectedColor = 0;
  var selectedTool = 0;

  var arrayColor = [];
  var arrayHighlightColor = [];

  var doc = document;
  var button = doc.querySelector('.button-pentool');
  var root = doc.querySelector('#draw-tool');
  var sketch = root.querySelector('#sketch');
  var toolBox = root.querySelector('.controller');
  var colorButtons = toolBox.querySelectorAll('.color-box > div');
  var penButtons = toolBox.querySelectorAll('.tool-box > div');
  var insert_text = doc.querySelector('.insert-text')
  var btn_file = doc.querySelector('.aside-button-cont .btn-file')

  button.addEventListener('mouseover', hnMouseOverButton);
  button.addEventListener('mouseout', hnMouseOutButton);
  button.addEventListener(touchend, hnClickButton);
  insert_text.addEventListener('mouseover', hnMouseOverButton);
  insert_text.addEventListener('mouseout', hnMouseOutButton);
  // insert_text.addEventListener(touchend, hnClickButton);
  btn_file.addEventListener('mouseover', hnMouseOverButton);
  btn_file.addEventListener('mouseout', hnMouseOutButton);
  // btn_file.addEventListener(touchend, hnClickButton);

  toolBox.addEventListener('mouseover', hnMouseOverToolBox);
  toolBox.addEventListener('mouseout', hnMouseOutToolBox);
  toolBox.addEventListener(touchend, hnClickToolBox);

  $('.btn-reset').on(touchstart, function (e) {
    clear();
  });

  function init() {
    var i;
    for (i = 0; i < spec.colors.length; ++i) {
      arrayColor[i] = hexToRGB(spec.colors[i], 1);
      arrayHighlightColor[i] = hexToRGB(spec.colors[i], 0.3);
    }
    drawingSvg = createDrawingSvg();
    setColor(0);
    setTool(0);

    return instance;
  }

  function hnMouseOverToolBox(e) {
    var target = e.target;
    var index = _.indexOf(colorButtons, target);
    if (index > -1) {
      if (target.classList.contains('on')) return;
      target.classList.add('over');
    }

    var index = _.indexOf(penButtons, target);
    if (index > -1) {
      if (target.classList.contains('on')) return;
      target.classList.add('over');
    }
  }

  function hnMouseOutToolBox(e) {
    var target = e.target;
    var index = _.indexOf(colorButtons, target);
    if (index > -1) {
      if (target.classList.contains('on')) return;
      target.classList.remove('over');
    }

    var index = _.indexOf(penButtons, target);
    if (index > -1) {
      if (target.classList.contains('on')) return;
      target.classList.remove('over');
    }
  }

  function hnClickToolBox(e) {
    GlobalAudio.play('button');
    var target = e.target;
    var index = _.indexOf(colorButtons, target);
    if (index > -1) {
      setColor(index);
    }

    index = _.indexOf(penButtons, target);
    if (index > -1) {
      if (index === 4) {
        clear();
      } else {
        setTool(index);
      }
    }
  }

  function hnMouseOverButton(e) {
    var button = e.currentTarget;
    if (button.classList.contains('on')) return;
    button.classList.add('over');
  }

  function hnMouseOutButton(e) {
    var button = e.currentTarget;
    if (button.classList.contains('on')) return;
    button.classList.remove('over');
  }

  function hnClickButton(e) {
    GlobalAudio.play('button');
    var button = e.currentTarget;
    if (!button.classList.contains('on')) {
      button.classList.add('on');
      toolBox.classList.remove('hide');
      openDraw();
      $(".insert-text").css("pointer-events","none")
      $(".btn-file").css("pointer-events","none")
      $(".aside-right").css("pointer-events","none")
      // $("*:not(.button-pentool)").css("pointer-events", "none");
    } else {
      button.classList.remove('on');
      toolBox.classList.add('hide');
      closeDraw();
      $(".insert-text").css("pointer-events","all")
      $(".btn-file").css("pointer-events","all")
      $(".aside-right").css("pointer-events","all")
    }
  }

  function openDraw() {
    // sketch.classList.remove("hide");
    sketch.style.pointerEvents = 'all';
    broadcaster.trigger('TOOL_OPENED', { name: instance.name });
  }

  function closeDraw() {
    sketch.style.pointerEvents = 'none';
    // sketch.classList.add("hide");
  }

  function setColor(index) {
    selectedColor = index;
    resetColorButtons();
    var button = colorButtons[index];
    button.classList.toggle('on');
    if (selectedTool === 2) {
      drawingSvg.setColor(arrayHighlightColor[index]);
    } else {
      // console.log(arrayColor[index]);
      drawingSvg.setColor(arrayColor[index]);
    }
  }

  function setTool(index) {
    selectedTool = index;
    resetPenButtons();
    var button = penButtons[index];
    button.classList.toggle('on');
    drawingSvg.eraseOff();

    switch (index) {
      case 0:
        drawingSvg.setStrokeWidth(PENCIL_WIDTH);
        break;
      case 1:
        drawingSvg.setStrokeWidth(PEN_WIDTH);
        break;
      case 2:
        drawingSvg.setStrokeWidth(HIGHLIGHT_WIDTH);
        break;
      case 3:
        drawingSvg.eraseOn();
        break;
    }
    setColor(selectedColor);
  }

  function clear() {
    selectedColor = 0;
    selectedTool = 0;
    setColor(0);
    setTool(0);
    drawingSvg.clear();
  }

  function close() {
    button.classList.remove('on');
    button.classList.remove('over');
    toolBox.classList.add('hide');
    closeDraw();
    clear();
  }

  function resetPenButtons() {
    for (var i = 0; i < penButtons.length; ++i) {
      var button = penButtons[i];
      button.classList.remove('on');
      button.classList.remove('over');
    }
  }

  function resetColorButtons() {
    for (var i = 0; i < colorButtons.length; ++i) {
      var button = colorButtons[i];
      button.classList.remove('on');
      button.classList.remove('over');
    }
  }

  function hexToRGB(hex, alpha) {
    if (!hex || [4, 7].indexOf(hex.length) === -1) {
      return; // throw new Error('Bad Hex');
    }

    hex = hex.substr(1);
    // if shortcuts (#F00) -> set to normal (#FF0000)
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map(function (el) {
          return el + el + '';
        })
        .join('');
    }

    var r = parseInt(hex.slice(0, 2), 16),
      g = parseInt(hex.slice(2, 4), 16),
      b = parseInt(hex.slice(4, 6), 16);

    if (alpha !== undefined) {
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    } else {
      return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }
  }

  var instance = {
    init: init,
    name: 'draw',
    close: close
  };
  return instance;
};

drawingTool({
  colors: [
    '#000000',
    '#ff2525',
    '#ffa800',
    '#FFE900',
    '#8CD900',
    '#00A20F',
    '#00DBFF',
    '#275DBE',
    '#FF82FE',
    '#632CAE'
  ]
}).init();

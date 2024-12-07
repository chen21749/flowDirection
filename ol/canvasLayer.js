
var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) { if (b.hasOwnProperty(p)) { d[p] = b[p]; } } };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}


function __spreadArrays() {
    var arguments$1 = arguments;

    for (var s = 0, i = 0, il = arguments.length; i < il; i++) { s += arguments$1[i].length; }
    for (var r = Array(s), k = 0, i = 0; i < il; i++) {
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) { r[k] = a[j]; }
    }
    return r;
}


function assign(target) {
    var arguments$1 = arguments;

    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments$1[_i];
    }
    return Object.assign.apply(Object, __spreadArrays([target], sources));
}

function transform2D(flatCoordinates, offset, end, stride, transform, opt_dest) {
    var dest = opt_dest ? opt_dest : [];
    var i = 0;
    for (var j = offset; j < end; j += stride) {
        var x = flatCoordinates[j];
        var y = flatCoordinates[j + 1];
        dest[i++] = transform[0] * x + transform[2] * y + transform[4];
        dest[i++] = transform[1] * x + transform[3] * y + transform[5];
    }
    if (opt_dest && dest.length != i) {
        dest.length = i;
    }
    return dest;
}

function equals(arr1, arr2) {
    var len1 = arr1.length;
    if (len1 !== arr2.length) {
        return false;
    }
    for (var i = 0; i < len1; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

var Files = (function () {
    function Files() { }
    Files.prototype.preData = function (datas) {
        var resultArray = [];
        for (var j = 0; j < datas.length; j++) {
            //if(j == 1675) debugger;
            var data = datas[j];
            var pixelCoordinates = [];
            for (var i = 0; i < data.coordinates.length; i++) {
                var item = data.coordinates[i];
                var pixelCoordinate = this.project(item);
                pixelCoordinates.push(pixelCoordinate);
            }

            var result = this.innerCoordinates(pixelCoordinates, 1);

            resultArray.push({
                // pixelCoordinates: pixelCoordinates,
                paths: result.paths,
                length: result.paths.length,
                index: 0,
                angles: result.angles,
                color: data.color
            });
        }

        return resultArray;
    }

    //canvas坐标系像素点
    Files.prototype.innerCoordinates = function (points, distDivision) {
        var paths = [];
        var angles = [];

        for (var k = 0; k < points.length - 1; k++) {
            var startPoint = points[k];
            var endPoint = points[k + 1];
            var angle = this.getRotateAngle(startPoint, endPoint);

            var daltX = endPoint[0] - startPoint[0];
            var daltY = endPoint[1] - startPoint[1];
            var distance = Math.sqrt(Math.pow(daltX, 2) + Math.pow(daltY, 2));
            if (distDivision >= distance) {
                paths.push(startPoint);
                paths.push(endPoint);

                //angles.push(angle);
            } else {
                
                var radian = angle / 180 * Math.PI;

                var daltX_division = Math.abs(distDivision * Math.cos(radian));
                var daltY_division = Math.abs(distDivision * Math.sin(radian));

                for (var i = 0; i < parseInt(distance / distDivision); i++) {
                    var innerItem, c = 1, x = 1;
                    if ((startPoint[0] > endPoint[0])) {
                        c = -1;
                    }

                    if (startPoint[1] > endPoint[1]) {
                        x = -1;
                    }

                    var innerItem;
                    if (daltX == 0) {
                        innerItem = [startPoint[0], startPoint[1] + i * distDivision * x];
                    } else if (daltY == 0) {
                        innerItem = [startPoint[0] + i * distDivision * c, startPoint[1]];
                    } else {
                        innerItem = [startPoint[0] + (i * daltX_division * c), (startPoint[1] + i * daltY_division * x)];
                    }

                    paths.push(innerItem);
                    // if(angle == -90)
                    // {
                    //     angle = 0
                    // }
                    // if(angle == -0)
                    // {
                    //     angle = 90
                    // }
                    //angles.push(angle);
                }
            }
        }


        return {
            paths: paths,
            angles: angles
        };
    }

    //两点之间角度canvas坐标系
    Files.prototype.getRotateAngle = function (startPoint, endPoint) {
        var daltX = endPoint[0] - startPoint[0];
        var daltY = (endPoint[1] - startPoint[1]) * (-1);

        return Math.atan(daltY / daltX) * 180 / Math.PI;
    }
    return Files;
}())


//CanvasLayer
var CanvasLayer = (function (_super) {

    __extends(CanvasLayer, _super);

    function CanvasLayer(data, options) {

        var _this = this;
        var opt = assign({}, {}, options);

        _this = _super.call(this, opt) || this;

        this._files = new Files();
        if (data) {
            this._data = data;
        }

        return _this;
    }

    CanvasLayer.prototype.render = function (frameState, target) {
        var layerRenderer = this.getRender();
        this._files.project = layerRenderer.getPixelFromCoordinateInternal.bind(this, frameState);
        layerRenderer._pathsInfo = this._files.preData(this._data);

        return layerRenderer.renderFrame(frameState, target);
    };

    CanvasLayer.prototype.getRender = function () {
        if (!this._renderer) {
            this._renderer = this.createRenderer();
        }
        return this._renderer;
    };

    CanvasLayer.prototype.createRenderer = function () {
        return new CanvasLayerRender(this);
    }


    CanvasLayer.prototype.setData = function (coordinate) {
        if (this._renderer) {
            this._renderer.setData(coordinate);
        }
    }


    return CanvasLayer;
})(ol.layer.Layer)


var CanvasLayerRender = (function (_super) {
    __extends(CanvasLayerRender, _super);
    function CanvasLayerRender(layer) {
        this.animate = this.animate.bind(this);
        this.pointerCoordinate = [];
        this.angle = 0;
        _super.call(this, layer) || this;
    }

    CanvasLayerRender.prototype.useContainer = function (target, transform, opacity) {
        _super.prototype.useContainer.call(this, null, transform, opacity);
    }

    CanvasLayerRender.prototype.renderFrame = function (frameState, target) {
        var canvasTransform = ol.transform.toString(this.pixelTransform);
        this.useContainer(target, canvasTransform, 1);

        var size = frameState.size;
        var width = size[0];
        var height = size[1];

        this.project = this.getPixelFromCoordinateInternal.bind(this, frameState);

        var context = this.context;
        var canvas = context.canvas;
        if (canvas.width != width || canvas.height != height) {
            canvas.width = width;
            canvas.height = height;
        }
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.draw();

        return this.container;
    }

    CanvasLayerRender.prototype.getPixelFromCoordinateInternal = function (frameState, coordinate) {
        var viewState = frameState.viewState;

        var point = ol.proj.transform(coordinate, 'EPSG:4326', viewState.projection);
        var viewCoordinate = ol.proj.fromUserCoordinate(point, viewState.projection);
        if (!frameState) {
            return null;
        }
        else {
            var pixelCoordinates = ol.transform.apply(frameState.coordinateToPixelTransform, viewCoordinate.slice(0, 2));

            return pixelCoordinates
        }
    }

    CanvasLayerRender.prototype.setData = function (data) {
        this._data = data;
    }

    CanvasLayerRender.prototype.draw = function () {
        this.prerender();
    }


    CanvasLayerRender.prototype.prerender = function () {
        this.animate();
    }

    CanvasLayerRender.prototype.animate = function () {
        if (this.animateLoop) {
            cancelAnimationFrame(this.animateLoop);
        }

        this.animateLoop = requestAnimationFrame(this.animate);

        //if(this.pointerCoordinate.length == 0) return;
        this.fadeIn();
        for(var i = 0; i < this._pathsInfo.length; i++)
        {
            var index = this._pathsInfo[i].index % this._pathsInfo[i].paths.length;
            // var lineCoordinate = this.getRotateLineCoordinate(this._pathsInfo[i].paths[index], this._pathsInfo[i].angles[index], 20);
            var lineCoordinate = this.getRotateLineCoordinate(this._pathsInfo[i].paths[index], 0, 4);


            this.context.strokeStyle = this._pathsInfo[i].color;
            var startPixel = lineCoordinate[0];
            var targetPixel = lineCoordinate[1];
    
            //按像素
            // var coordinatePixel = this.project(this.pointerCoordinate);
            // var lineCoordinate = this.getRotateLineCoordinate(coordinatePixel, 45, 10);
            // var startPixel = lineCoordinate[0];
            // var targetPixel = lineCoordinate[1];
    
            //按经纬度
            // var lineCoordinate = this.getRotateLineCoordinate(this.pointerCoordinate, 0, 0.001);
            // var startPixel = this.project(lineCoordinate[0]);
            // var targetPixel = this.project(lineCoordinate[1]);
    
            // this.fadeIn();
    
            this.context.beginPath();
            this.context.moveTo(startPixel[0], startPixel[1]);
            this.context.lineTo(targetPixel[0], targetPixel[1]);
            this.context.stroke();
    
            this._pathsInfo[i].index = index + 1;
        }

    
        //this.tempCoordinate = [this.pointerCoordinate[0], this.pointerCoordinate[1]];
    }

    CanvasLayerRender.prototype.fadeIn = function () {

        var prev = this.context.globalCompositeOperation; // lighter
        this.context.globalCompositeOperation = 'destination-in';
        this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

        this.context.globalCompositeOperation = prev;
        this.context.globalAlpha = 0.9;
        //this.context.strokeStyle = '#ff473c';
        
        this.context.lineWidth = 5;
    };

    CanvasLayerRender.prototype.setData = function (coordinate) {
        this.pointerCoordinate = coordinate;
    }

    //根据中点、角度计算两端点坐标,角度是与之垂直的角度;经纬度坐标
    CanvasLayerRender.prototype.getRotateLineCoordinate = function (coordinate, angle, dist) {
        if (angle % 90 == 0 && angle != 0)
            return [[coordinate[0] + dist / 2, coordinate[1]], [coordinate[0] - dist / 2, coordinate[1]]];

        if (angle == 0 || angle == -0)
            return [[coordinate[0], coordinate[1] + dist / 2], [coordinate[0], coordinate[1] - dist / 2]];

        var radian = angle / 180 * Math.PI;
        var k = 1 / Math.tan(radian);

        try{
            var b = coordinate[1] - k * coordinate[0];
        }catch(error)
        {
            debugger;
        }
        

        var x1 = coordinate[0] + Math.cos(radian) * dist / 2;
        var x2 = coordinate[0] - Math.cos(radian) * dist / 2;

        var y1 = k * x1 + b;
        var y2 = k * x2 + b;

        return [[x1, y1], [x2, y2]];
    }


    //根据中点、角度计算两端点坐标,角度是与之垂直的角度;
    CanvasLayerRender.prototype.getRotateLinePixel = function (pixelCoordinate, angle, dist) {
        if (angle % 90 == 0 && angle != 0)
            return [[pixelCoordinate[0] + dist, pixelCoordinate[1]], [pixelCoordinate[0] - dist, pixelCoordinate[1]]];

        if (angle == 0 || angle == -0)
            return [[pixelCoordinate[0], pixelCoordinate[1] + dist], [pixelCoordinate[0], pixelCoordinate[1] - dist]];

        var radian = angle / 180 * Math.PI;
        var k = 1 / Math.tan(radian) * (-1);

        var b = pixelCoordinate[1] - k * pixelCoordinate[0];

        var x1 = pixelCoordinate[0] + Math.cos(radian) * dist;
        var x2 = pixelCoordinate[0] - Math.cos(radian) * dist;

        var y1 = k * x1 + b;
        var y2 = k * x2 + b;

        return [[x1, y1], [x2, y2]];
    }

    return CanvasLayerRender;
})(ol.renderer.canvas.ImageLayer)

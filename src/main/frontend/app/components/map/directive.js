/*
 * Data HUb Service (DHuS) - For Space data distribution.
 * Copyright (C) 2013,2014,2015,2016 European Space Agency (ESA)
 * Copyright (C) 2013,2014,2015,2016 GAEL Systems
 * Copyright (C) 2013,2014,2015,2016 Serco Spa
 *
 * This file is part of DHuS software sources.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

///////////////////////////////////**************************************//////
/*
 (c) 2013, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/

(function () {
    'use strict';

    // to suit your point format, run search/replace for '.x' and '.y';
    // for 3D version, see 3d branch (configurability would draw significant performance overhead)

    // square distance between 2 points
    function getSqDist(p1, p2) {

        var dx = p1.x - p2.x,
            dy = p1.y - p2.y;

        return dx * dx + dy * dy;
    }

    // square distance from a point to a segment
    function getSqSegDist(p, p1, p2) {

        var x = p1.x,
            y = p1.y,
            dx = p2.x - x,
            dy = p2.y - y;

        if (dx !== 0 || dy !== 0) {

            var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = p2.x;
                y = p2.y;

            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = p.x - x;
        dy = p.y - y;

        return dx * dx + dy * dy;
    }
    // rest of the code doesn't care about point format

    // basic distance-based simplification
    function simplifyRadialDist(points, sqTolerance) {

        var prevPoint = points[0],
            newPoints = [prevPoint],
            point;

        for (var i = 1, len = points.length; i < len; i++) {
            point = points[i];

            if (getSqDist(point, prevPoint) > sqTolerance) {
                newPoints.push(point);
                prevPoint = point;
            }
        }

        if (prevPoint !== point) newPoints.push(point);

        return newPoints;
    }

    function simplifyDPStep(points, first, last, sqTolerance, simplified) {
        var maxSqDist = sqTolerance,
            index;

        for (var i = first + 1; i < last; i++) {
            var sqDist = getSqSegDist(points[i], points[first], points[last]);

            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }

        if (maxSqDist > sqTolerance) {
            if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
            simplified.push(points[index]);
            if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
        }
    }

    // simplification using Ramer-Douglas-Peucker algorithm
    function simplifyDouglasPeucker(points, sqTolerance) {
        var last = points.length - 1;

        var simplified = [points[0]];
        simplifyDPStep(points, 0, last, sqTolerance, simplified);
        simplified.push(points[last]);

        return simplified;
    }

    // both algorithms combined for awesome performance
    function simplify(points, tolerance, highestQuality) {

        if (points.length <= 2) return points;

        var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

        points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
        // points = simplifyDouglasPeucker(points, sqTolerance);

        return points;
    }

    // export as AMD module / Node module / browser or worker variable
    if (typeof define === 'function' && define.amd) define(function () {
        return simplify;
    });
    else if (typeof module !== 'undefined') module.exports = simplify;
    else if (typeof self !== 'undefined') self.simplify = simplify;
    else window.simplify = simplify;

})();
///////////////////////////////////**************************************//////
var MAX_SHAPE_FILE_SIZE = 5242880;
var MAX_SHAPE_FILE_SIZE_MESSAGE = "Your shapefile cannot be uploaded because it is too large. Shapefiles must be no larger than 5.00 MB.";
var MOUSE_POSITION_FORMAT = 'dd';
var coordinateStatus = 'dd';

var ddCoordTemplate = 'Lat Lon: {y}, {x}';
var Product = {
    create: function (product, footprint) {
        return {
            name: product.identifier,
            footprint: footprint,
            id: product.uuid,
            default_style: product.default_style,
            selected_style: product.selected_style,
            highlighted_style: product.highlighted_style
        };
    }
};

var DHuSMapConfig = {
    webAppRoot: "",
    styles: {
        selection: {
            fill: {
                color: [255, 255, 255, 0.6]
            },
            stroke: {
                color: [255, 255, 255, 1],
                width: 5
            }
        },
        highlight: {
            fill: {
                color: [255, 255, 255, 0.3]
            },
            stroke: {
                color: [255, 255, 255, 0.6],
                width: 1
            }
        },
        "default": {
            fill: {
                color: [255, 255, 255, 0.4]
            },
            stroke: {
                color: [0, 153, 255, 1],
                width: 1
            }
        }
    },
    mapToggleButton: {
        active3DlabelText: "3d Map",
        active2DlabelText: "2d Map"
    },
    selectionButton: {
        activedText: "Disable selection",
        disabledText: "Active selection",
        activedIcon: "flip-to-front",
        disabledIcon: "open-with",
        clearImageIcon: "flip-to-back"
    },
    map3dActive: false,
    map: {
        transformation: {
            source: 'EPSG:4326',
            destination: 'EPSG:3857'
        },
        defaultCenter: {
            coordinates: [13.707047, 51.060086]
        },

        defaultZoom: 4,
        minZoom: 1.3,
        maxZoom: 19,
        defaultLayer: 'sat'
    },
    cesium: {
        terrainProviderUrl: '//cesiumjs.org/stk-terrain/tilesets/world/tiles'
    },
    events: {
        changedModel: 'changed-model',
        newModel: 'new-model'
    },

};

angular.module('DHuS-webclient').factory('OLMap', function (Logger, SearchModel, CartModel, ConfigurationService, CartStatusService) {
    return {
        productModel: {
            list: "hello"
        },
        map: {},
        map3d: {},
        mapModel: {
            footprintLayerId: 3,
            selectionLayerId: 5,
            shapeLayerId: 4,
            currentZoom: 0,
            currentPosition: {}
        },
        map3dActive: false,
        activedSelection: true,
        externalInterface: {
            sendSelectionCoordinates: null
        },
        selectionStyle: new ol.style.Style({
            fill: new ol.style.Fill(DHuSMapConfig.styles.selection.fill),
            stroke: new ol.style.Stroke(DHuSMapConfig.styles.selection.stroke)
        }),
        highlightStyle: new ol.style.Style({
            fill: new ol.style.Fill(DHuSMapConfig.styles.highlight.fill),
            stroke: new ol.style.Stroke(DHuSMapConfig.styles.highlight.stroke)
        }),
        defaultStyle: new ol.style.Style({
            fill: new ol.style.Fill(DHuSMapConfig.styles["default"].fill),
            stroke: new ol.style.Stroke(DHuSMapConfig.styles["default"].stroke)
        }),

        setActivedSelection: function (status) {
            Logger.log("map", "setActivedSelection()");
            this.activedSelection = status;
        },

        clearSelection: function () {
            Logger.log("map", "clearSelection()");
            this.map.getLayers().item(this.mapModel.selectionLayerId).setSource(new ol.source.Vector({
                features: [],
                wrapX: false
            }));
            this.map.getLayers().item(this.mapModel.shapeLayerId).setSource(new ol.source.Vector({
                features: [],
                wrapX: false
            }));
            this.externalInterface.sendSelectionCoordinates(null);
            if (this.model && this.model.length) {
                for (var i = 0; i < this.model.length; i++) {
                    // this.model[i].selected = false; // rbua
                }
                $(document).trigger(DHuSMapConfig.events.changedModel, 'false');
            }
        },

        renderFootprintLayer: function (products) {
            Logger.log("map", "renderFootprintLayer()");
            var self = this;
            var format = new ol.format.WKT();
            var features = [];
            for (var i = 0; i < products.length; i++) {
                var feature = format.readFeature(products[i].footprint);
                feature.getGeometry().transform(DHuSMapConfig.map.transformation.source, DHuSMapConfig.map.transformation.destination);
                feature.product = products[i];
                feature.setStyle(feature.product.default_style);
                features.push(feature);
            }

            this.map.getLayers().item(this.mapModel.footprintLayerId).setSource(new ol.source.Vector({
                features: features,
                wrapX: false
            }));
            self.refresh3dMap();
        },

        refresh3dMap: function () {
            Logger.log("map", "refresh3dMap()");
            if (this.map3dActive) {
                var is3D = this.map3d.getEnabled();
                if (is3D) {
                    this.map3d.setEnabled(false);
                }
                this.setup3dMap();
                if (is3D) {
                    this.map3d.setEnabled(true);
                }
            }
        },

        setup3dMap: function () {
            Logger.log("map", "setup3dMap()");
            this.map3d = new olcs.OLCesium({
                map: this.map
            });
            this.scene = this.map3d.getCesiumScene().terrainProvider = new Cesium.CesiumTerrainProvider({
                url: DHuSMapConfig.cesium.terrainProviderUrl
            });
        },

        olCoords2LatLon: function (olcoords) {
            Logger.log("map", "olCoords2LatLon()");
            Logger.log("map", "coordinates: " + JSON.stringify(coords));
            var coords = olcoords[0];
            var points = [];
            var coordsModel = [];
            for (var j = 0; j < coords.length; j++) {
                points.push(ol.proj.transform([coords[j][0], coords[j][1]], 'EPSG:3857', 'EPSG:4326'));
            }
            for (var i = 0; i < points.length; i++) {
                coordsModel.push({
                    lat: points[i][1],
                    lon: points[i][0]
                });
            }
            Logger.log("map", "points: " + JSON.stringify(coordsModel));
            return coordsModel;
        },
        

        switchCoordinate: function (format) {

            this.map.removeControl(this.mousePositionControl);
            // console.log("format", format);
            this.mousePositionControl = new ol.control.MousePosition({
                coordinateFormat: function (coord) {
                    if (format.localeCompare('dd') == 0) {
                        return ol.coordinate.format(coord, ddCoordTemplate, 2);

                    } else {
                        var coordinate = ol.coordinate.toStringHDMS(coord);
                        return 'Lat Lon: ' + coordinate;
                    }
                },
                projection: 'EPSG:4326',
                undefinedHTML: '&nbsp;'
            });
            this.map.addControl(this.mousePositionControl);
        },

        setupBoxSelection: function () {
            var self = this;
            var isFirst = 0;
            document.getElementById('map').addEventListener('contextmenu', function (evt) {
                evt.preventDefault();
                var selectedFeature;
                if (self.mapButton == 'Box' && evt.button != 0) {
                    if (selectedFeature) {
                        selectedFeature.setStyle(null);
                    }
                    var pixel = [evt.offsetX, evt.offsetY];
                    selectedFeature = self.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                        if (layer === self.map.getLayers().item(self.mapModel.footprintLayerId))
                            return feature;
                    });

                    SearchModel.deselectAll({ uuid: null, sender: 'OLMap' });
                    CartModel.deselectAll({ uuid: null, sender: 'OLMap' });
                    if (selectedFeature && selectedFeature.product) {
                        if (CartStatusService.getCartActive() == true) {
                            if (CartStatusService.getCartFootprints() == true) {
                                CartModel.callEventSelectProduct({ uuid: selectedFeature.product.id, sender: "OLMap" });
                            } else
                                ToastManager.error('Map selection disabled. Please load Cart Footprints to select them');
                        } else {
                            SearchModel.selectProduct({ uuid: selectedFeature.product.id, sender: "OLMap" });
                            selectedFeature.setStyle(selectedFeature.product.selected_style);
                        }
                    }
                    SearchModel.OnSelectionChange(); //Update product Count
                } else {
                    return;
                }
            });
            document.getElementById('map').addEventListener('mouseup', function (evt) {
                //var self=this;
                if (self.mapButton.localeCompare('Box') == 0) {
                    if (evt.button == 0) {
                        if (self.map.getLayers().item(self.mapModel.selectionLayerId).getSource().getFeatures().length == 0) {
                            return;
                        } else {
                            if (self.clearOnly) {
                                if (self.selectionType && self.selectionType.localeCompare('Polygon') == 0)
                                    self.clearSelection();
                            } else {
                                return;
                            }
                        }
                    } else {
                    }
                } else {
                    if (evt.button == 0) {

                    } else {
                        if (self.map.getLayers().item(self.mapModel.selectionLayerId).getSource().getFeatures().length == 0) {
                            return;

                        } else {
                            if (self.clearOnly) {
                                if (self.selectionType && self.selectionType.localeCompare('Polygon') == 0)
                                    self.clearSelection();
                            } else {
                                return;
                            }
                        }
                    }
                }
            });
            document.getElementById('map').addEventListener('mousedown', function (evt) {
                self.clearOnly = false;
                self.map.addInteraction(self.dragBox);
                self.map.addInteraction(self.drawBox);
                if (self.mapButton.localeCompare('Box') == 0) {
                    if (evt.button == 0) {
                        if (self.map.getLayers().item(self.mapModel.selectionLayerId).getSource().getFeatures().length == 0) {
                            return;
                        } else {
                            self.clearOnly = true;
                            if (self.selectionType && self.selectionType.localeCompare('Box') == 0) {
                                self.clearSelection();
                                self.map.removeInteraction(self.dragBox);
                                self.map.removeInteraction(self.drawBox);
                            } else {
                                self.map.addInteraction(self.dragBox);
                                self.map.addInteraction(self.drawBox);
                            }
                        }
                    }
                } else {
                    if (evt.button == 0) {
                    } else if (self.map.getLayers().item(self.mapModel.selectionLayerId).getSource().getFeatures().length == 0) {
                        return;
                    } else {
                        self.clearOnly = true;
                        if (self.selectionType && self.selectionType.localeCompare('Box') == 0) {
                            self.clearSelection();
                            self.map.removeInteraction(self.dragBox);
                            self.map.removeInteraction(self.drawBox);
                        } else {
                            self.map.addInteraction(self.dragBox);
                            self.map.addInteraction(self.drawBox);
                        }
                    }
                }
            });
            self.dragBox = new ol.interaction.DragBox({
                condition: function (e) {

                    if (self.mapButton == 'Pan') {
                        if (e.originalEvent.button == 0) {
                            return false;
                        }
                        else {
                            return true;
                        }
                    } else {
                        if (e.originalEvent.button == 0) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                },
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: [255, 255, 255, 0.4]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [0, 0, 255, 1]
                    })
                })
            });
            self.dragBox.setActive(true);
            this.map.addInteraction(self.dragBox);

            self.drawBox = new ol.interaction.Draw({
                source: self.map.getLayers().item(self.mapModel.selectionLayerId).getSource(),
                type: 'Polygon',
                geometryFunction: function (coords, geom) {

                    if (!geom) geom = new ol.geom.Polygon(null);
                    geom.setCoordinates(coords);
                    //if linestring changed

                    return geom;
                },
                condition: function (e) {
                    if (self.mapButton == 'Pan') {
                        if (e.originalEvent.button == 0)
                            return false;
                        else
                            return true;
                    } else {
                        if (e.originalEvent.button == 0)
                            return true;
                        else
                            return false;
                    }
                },
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: [255, 255, 255, 0.4]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [0, 0, 255, 1]
                    })
                })
            });
            self.drawBox.setActive(true);
            this.map.addInteraction(self.drawBox);

            self.dragBox.on('boxend', function (e) {
                /* Fix visualization of both box and polygon drawing when dragging the mouse after drawstart  BEGIN*/
                self.drawBox.abortDrawing_();
                /* Fix visualization of both box and polygon drawing when dragging the mouse after drawstart  END*/
                var geometry = new ol.geom.Polygon(null);

                self.end = e.coordinate;
                geometry.setCoordinates([
                    [self.start, [self.start[0], self.end[1]], self.end, [self.end[0], self.start[1]], self.start]
                ]);
                var feature = new ol.Feature;
                feature.setStyle(
                    // todo: to move this style !!!!~!!!!
                    new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: [220, 142, 2, 0.5]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [220, 142, 2, 1]
                        })
                    }));
                //feature.setGeometry(self.dragBox.getGeometry());
                feature.setGeometry(geometry);
                self.map.getLayers().item(self.mapModel.selectionLayerId).setSource(new ol.source.Vector({
                    features: [feature],
                    wrapX: false
                }));
                self.map.getLayers().item(self.mapModel.shapeLayerId).setSource(new ol.source.Vector({
                    features: [],
                    wrapX: false
                }));
                self.setCurrentSelection(self.processSelection(feature));
                self.selectionType = "Box";
            });
            self.dragBox.on('boxstart', function (e) {
                self.start = e.coordinate;
                self.externalInterface.sendSelectionCoordinates(null);
            });
            self.drawBox.on('drawstart', function (e) {
                if (self.clearOnly || (self.map.getLayers().item(self.mapModel.selectionLayerId).getSource().getFeatures().length > 0) /*|| (self.selectionType && self.selectionType.localeCompare('Box')==0)*/) {
                    self.drawBox.removeLastPoint();
                }
                //self.map.getLayers().item(self.mapModel.selectionLayerId).getSource().clear();

            });
            self.drawBox.on('drawend', function (e) {
                //console.log("called drawend", e);
                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: [220, 142, 2, 0.5]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [220, 142, 2, 1]
                    })
                });
                e.feature.setStyle(style);
                self.map.getLayers().item(self.mapModel.selectionLayerId).setSource(new ol.source.Vector({
                    features: [e.feature],
                    wrapX: false
                }));
                self.map.getLayers().item(self.mapModel.shapeLayerId).setSource(new ol.source.Vector({
                    features: [],
                    wrapX: false
                }));
                self.setCurrentSelection(self.processSelection(e.feature, 'Polygon'));
                self.selectionType = "Polygon";
            });
        },
        /* DRAG AND DROP FEATURE BEGIN */

        //manage only one file
        loadShapeFile: function (shapefile) {
            var file = shapefile;
            var self = this;
            if ((file && file.name.toLowerCase().indexOf('.shp', file.name.length - 4)) == -1) {
                AlertManager.info("Unsupported file", "Only files with extension .shp are supported.");
                SpinnerManager.off();
                return;
            }
            try {
                var reader = new FileReader();
                reader.onloadend = function () {
                    var binary = "";
                    var bytes = new Uint8Array(reader.result);
                    var length = bytes.byteLength;
                    for (var i = 0; i < length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    var binaryFile = binary;
                    var features = [];
                    var originalShapesFeatures = [];
                    getOpenLayersFeatures(file.name, binaryFile, function (fs) {
                        if (!fs || !fs.data || fs.message) {
                            AlertManager.info("Unsupported shapefile", fs.message);
                            SpinnerManager.off();
                            return;
                        }
                        var format = new ol.format.WKT();
                        var originalfeature = format.readFeature(fs.data);
                        var feature = angular.copy(originalfeature);
                        var geometry = feature.getGeometry();

                        //--------------------------------//
                        // begin shape file

                        var points = [];
                        var simplifyPoints = [];
                        var simplifiedPoints = [];
                        points = geometry.getCoordinates();
                        var completedPointReduction = false;
                        var tolerance = 0.01;
                        var maxPoints = (ApplicationService.settings.max_points_shape_file) ? ApplicationService.settings.max_points_shape_file : 50;
                        var OriginalTotalPoints = 0;
                        var previousProcessedCount = -1;

                        do {
                            simplifiedPoints = [];
                            for (var i = 0; i < points.length; i++) {
                                simplifyPoints[i] = [];
                                for (var j = 0; j < points[i].length; j++) {
                                    simplifyPoints[i].push({ x: points[i][j][0], y: points[i][j][1] });
                                }
                                var simplified = simplify(simplifyPoints[i], tolerance);
                                if (simplified.length > 3)
                                    simplifiedPoints.push(simplified);
                            }

                            var processedCount = 0;

                            for (var e = 0; e < simplifiedPoints.length; e++) {
                                processedCount += parseInt(simplifiedPoints[e].length);
                            }

                            var originCount = 0;
                            var polygonsCount = 0;
                            for (var e = 0; e < points.length; e++) {
                                originCount += parseInt(points[e].length);
                                polygonsCount++;
                            }
                            previousProcessedCount = processedCount;
                            if (processedCount > maxPoints) {
                                tolerance += 0.01
                                completedPointReduction = false;
                            } else {
                                completedPointReduction = true;
                            }
                        } while (!completedPointReduction);

                        // convert coordinates
                        var simplifiedAndConvertedPoints = []
                        for (var k = 0; k < simplifiedPoints.length; k++) {
                            simplifiedAndConvertedPoints[k] = [];
                            for (var z = 0; z < simplifiedPoints[k].length; z++) {
                                simplifiedAndConvertedPoints[k][z] = [];
                                simplifiedAndConvertedPoints[k][z].push(simplifiedPoints[k][z].x);
                                simplifiedAndConvertedPoints[k][z].push(simplifiedPoints[k][z].y);
                            }
                        }

                        var shapefeature = new ol.Feature({
                            name: "shp",
                            geometry: geometry
                        });

                        shapefeature.getGeometry().setCoordinates(simplifiedAndConvertedPoints);
                        shapefeature.getGeometry().transform(DHuSMapConfig.map.transformation.source, DHuSMapConfig.map.transformation.destination);
                        shapefeature.setStyle(new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: [220, 142, 2, 0.5]
                            }),
                            stroke: new ol.style.Stroke({
                                color: [220, 142, 2, 1]
                            })
                        }));

                        // end shape file
                        //-------------------------//

                        originalfeature.getGeometry().transform(DHuSMapConfig.map.transformation.source, DHuSMapConfig.map.transformation.destination);
                        originalfeature.setStyle(new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: [147, 237, 147, 0.5]
                            }),
                            stroke: new ol.style.Stroke({
                                color: [147, 237, 147, 1]
                            })
                        }));

                        originalShapesFeatures.push(originalfeature);
                        features.push(shapefeature);
                        var vectorSource = new ol.source.Vector({
                            features: features,
                            wrapX: false
                        });

                        var originalShapeVector = new ol.source.Vector({

                            features: originalShapesFeatures,
                            wrapX: false
                        });

                        self.map.getLayers().item(self.mapModel.selectionLayerId).setSource(vectorSource);
                        self.map.getLayers().item(self.mapModel.shapeLayerId).setSource(originalShapeVector);

                        self.setCurrentSelection(self.processSelection(shapefeature, 'Shape'));
                        var view = self.map.getView();
                        view.fit(
                            vectorSource.getExtent(), /** @type {ol.Size} */(self.map.getSize()));
                        SpinnerManager.off();
                    });
                };

                // Read in the image file as a data URL.
                reader.readAsArrayBuffer(file);
            } catch (err) {
                AlertManager.info("Unsupported shapefile", "Unsupported shapefile type. Shapefiles are limited to one record of type POLYGON.");
                SpinnerManager.off();
            }
        },

        setupDragAndDrop: function () {
            var self = this;
            function handleFileSelect(evt) {
                SpinnerManager.on();
                evt.stopPropagation();
                evt.preventDefault();
                var files = evt.dataTransfer.files; // FileList object.
                if (files && files.length > 0) {
                    if ((files[0] && files[0].name.toLowerCase().indexOf('.shp', files[0].name.length - 4)) == -1) {
                        AlertManager.info("Unsupported file", "Only files with extension .shp are supported.");
                        SpinnerManager.off();
                    } else {
                        if (files[0].size > MAX_SHAPE_FILE_SIZE) {
                            SpinnerManager.off();
                            AlertManager.info("File too large",
                                MAX_SHAPE_FILE_SIZE_MESSAGE);
                        } else {
                            self.loadShapeFile(files[0]);
                        }
                    }
                } else {
                    SpinnerManager.off();
                    AlertManager.info("Unsupported file", "Only files with extension .shp are supported.");
                }
            }

            function handleDragOver(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
            }
            document.getElementById('map').addEventListener('dragover', handleDragOver, false);
            document.getElementById('map').addEventListener('drop', handleFileSelect, false);
        },

        testGeomIsValid: function (testGeometry) {
            var result = {};
            var wktReader = new jsts.io.WKTReader();
            var jstsGeometry = wktReader.read(testGeometry);
            var isValidOp = new jsts.operation.valid.IsValidOp(jstsGeometry);
            var valid = isValidOp.isValid();
            return valid;
        },

        testPolygonOutOfBounds: function (extent) {
            var top = extent[3];
            var bottom = extent[1];
            var left = extent[0];
            var right = extent[2];
            return top <= 85.05 && bottom >= -85.05 && left >= -180 && right <= 180;
        },

        testPolygonOutOfMap: function (extent) {
            var top = extent[3];
            var bottom = extent[1];
            var left = extent[0];
            var right = extent[2];
            return (Math.abs(top) > 85.05 && Math.abs(bottom) > 85.05) || (Math.abs(left)  > 180 && Math.abs(right) > 180);
        },

        displayFeatureInfo: function (pixel) {
            var self = this;
            var features = [];
            self.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                features.push(feature);
            });
            if (features.length > 0) {
                var info = [];
                var i, ii;
                for (i = 0, ii = features.length; i < ii; ++i) {
                    info.push(features[i].get('name'));
                }
                document.getElementById('info').innerHTML = info.join(', ') || '&nbsp';
            } else {
                document.getElementById('info').innerHTML = '&nbsp;';
            }
        },

        setCurrentSelection: function (coords) {
            if (this.externalInterface.sendSelectionCoordinates) {
                this.externalInterface.sendSelectionCoordinates(coords);
            } else {
                Logger.error("map", "[MAP] - sendSelectionCoordinates not implemented");
            }
        },

        initMap: function (mapDomNode, model) {
            var self = this;
            if (!ConfigurationService.isLoaded())
                ConfigurationService.getConfiguration().then(function (data) {
                    if (data) {
                        ApplicationService = data;
                        if (ApplicationService.settings.shapefile_max_size &&
                            ApplicationService.settings.shapefile_max_size_message) {
                            MAX_SHAPE_FILE_SIZE = ApplicationService.settings.shapefile_max_size
                            MAX_SHAPE_FILE_SIZE_MESSAGE = ApplicationService.settings.shapefile_max_size_message;
                        }
                    }
                });
            else if (ApplicationService.settings.shapefile_max_size &&
                ApplicationService.settings.shapefile_max_size_message) {
                MAX_SHAPE_FILE_SIZE = ApplicationService.settings.shapefile_max_size
                MAX_SHAPE_FILE_SIZE_MESSAGE = ApplicationService.settings.shapefile_max_size_message;
            }

            var bounds = [-180, -80, 180, 80];
            Logger.log("map", "initMap()");
            // var self = this;
            self.productModel.list = model && model.list;
            self.footprintLayer = new ol.layer.Vector({
                source: new ol.source.Vector({ wrapX: false }),
                displayInLayerSwitcher: false
            });

            var generateLayer = function (model) {
                var layersX = [];
                if (model && model.sources) {
                    for (var i = 0; model && i < model.sources.length; i++) {
                        var sourceParams = model.sources[i].params;
                        if (model.sources[i].attributions) {
                            var attributions = new ol.Attribution({ html: model.sources[i].attributions })
                            sourceParams.attributions = [attributions];
                        }
                        layersX.push(new ol.layer.Tile({
                            source: new ol.source[model.sources[i].class](sourceParams)
                        }));
                    }
                }
                return new ol.layer.Group({
                    title: (model) ? model.title : "",
                    type: (model) ? model.type : "",
                    visible: (model) ? model.visible : false,
                    layers: layersX,
                    wrapX: false
                });
            };

            var getConfiguredLayers = function () {
                var _layers = [];
                var layers_keys = Object.keys(ApplicationService.settings.map);
                for (var i = 0; i < layers_keys.length; i++) {
                    _layers.push(generateLayer(ApplicationService.settings.map[layers_keys[i]]));
                }
                return _layers;
            };

            var generateMapLayers = function () {
                self.mapLayers = [];
                self.mapLayers = getConfiguredLayers();
                self.mapLayers.push(self.footprintLayer);
                self.mapLayers.push(new ol.layer.Vector({
                    source: new ol.source.Vector({ wrapX: false }),
                    displayInLayerSwitcher: false
                }));
                self.mapLayers.push(new ol.layer.Vector({
                    source: new ol.source.Vector({ features: [], wrapX: false }),
                    displayInLayerSwitcher: false
                }));
                return self.mapLayers;
            };



            this.mousePositionControl = new ol.control.MousePosition({
                coordinateFormat: function (coord) { return ol.coordinate.format(coord, ddCoordTemplate, 2); },

                projection: 'EPSG:4326',
                undefinedHTML: '&nbsp;'
            });


            this.map = new ol.Map({
                /*interactions: ol.interaction.defaults().extend([dragAndDropInteraction]),*/
                target: mapDomNode,
                layers: generateMapLayers(),
                view: new ol.View({
                    center: ol.proj.transform(DHuSMapConfig.map.defaultCenter.coordinates, DHuSMapConfig.map.transformation.source, DHuSMapConfig.map.transformation.destination),
                    zoom: DHuSMapConfig.map.defaultZoom,
                    minZoom: DHuSMapConfig.map.minZoom,
                    maxZoom: DHuSMapConfig.map.maxZoom,
                    extent: ol.proj.transformExtent(bounds, DHuSMapConfig.map.transformation.source, DHuSMapConfig.map.transformation.destination)
                }),
                controls: ol.control.defaults({
                    attributionOptions: ({
                        collapsible: false
                    })
                }).extend([this.mousePositionControl])
            });
            self.mapModel.footprintLayerId = self.map.getLayers().getLength() - 3;
            self.mapModel.shapeLayerId = self.map.getLayers().getLength() - 2;
            self.mapModel.selectionLayerId = self.map.getLayers().getLength() - 1;
            if (ApplicationService.settings.isMapLayerSwitcherVisible) {
                var layerSwitcher = new ol.control.LayerSwitcherImage({
                    tipLabel: 'Map Layers' // Optional label for button
                });
                self.map.addControl(layerSwitcher);
            }
            if (ApplicationService.settings.enable_shapefile) self.setupDragAndDrop();
            self.setupBoxSelection();

            self.setActivedSelection(true); //todo to check
            $(document).on('zoom-to', function (event, product) {
                var zoomModel = {};
                if (CartStatusService.getCartFootprints() === true) {
                    zoomModel = CartModel.model;
                } else {
                    zoomModel = SearchModel.model;
                }
                for (var i = 0; i < zoomModel.list.length; i++) {
                    if (zoomModel.list[i]) {
                        if (zoomModel.list[i].uuid == product.uuid) {
                            var selectedFeature = self.map.getLayers()
                                .item(self.mapModel.footprintLayerId).getSource()
                                .getFeatures()[_.findIndex(self.map.getLayers()
                                    .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                                    function (element) {
                                        return (self.model[i].uuid == element.product.id)
                                    })];
                            var duration = 800;
                            var start = +new Date();
                            var pan = ol.animation.pan({
                                duration: duration,
                                source: (self.map.getView().getCenter()),
                                start: start
                            });

                            var zoom = ol.animation.zoom({
                                duration: duration,
                                resolution: self.map.getView().getResolution(),
                                start: start
                            });
                            self.map.beforeRender(pan, zoom);
                            if (selectedFeature) self.map.getView().fit(selectedFeature.getGeometry().getExtent(), self.map.getSize());
                        }
                    }
                }
            });
        },

        setGraticule: function (coordinates) {

            //Graticule CONFIGURATION
            graticule_step = ApplicationService.settings.graticule_step || 0.2;
            graticule_stepCoord = ApplicationService.settings.graticule_stepCoord || 2;
            graticule_maxResolution = ApplicationService.settings.graticule_maxResolution || 10000;

            //Graticule Style: get fro application.json or aplpy default values
            graticule_style = ApplicationService.settings.graticule_style || {
                "color": "#808080",
                "width": 1
            };
            graticul_color = graticule_style.color || "#808080";
            graticul_width = graticule_style.width || 1;

            // 0 0 for Continous line
            graticule_min_dash = ApplicationService.settings.graticule_min_dash;
            graticule_max_dash = ApplicationService.settings.graticule_max_dash;

            //Graticule Configuration log
            // console.log("GRATICULE CONFIGURATION:",
            //     "graticule_step:", graticule_step,
            //     "graticule_stepCoord:", graticule_stepCoord,
            //     "graticule_maxResolution:", graticule_maxResolution,
            //     "graticule_style:", graticule_style
            // );

            this.graticule = new ol.control.Graticule({
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: graticule_style.color,
                        width: graticule_style.width,
                        lineDash: [graticule_min_dash, graticule_max_dash]
                    }),
                    fill: new ol.style.Fill({ color: "#fff" }),
                    text: new ol.style.Text({
                        stroke: new ol.style.Stroke({ color: "#fff", width: 1 }),
                        fill: new ol.style.Fill({ color: "#000" }),
                    })
                }),
                // Graticule SETUP by configuration
                step: graticule_step,
                stepCoord: graticule_stepCoord,
                borderWidth: 1,
                margin: 0,
                maxResolution: graticule_maxResolution,
                formatCoord: function (c) {

                    //Handle different coordinates values
                    if (coordinates === 'dd') {
                        return c.toFixed(1);
                    } else {
                        var absolute = Math.abs(c);
                        var degrees = Math.floor(absolute);
                        var minutesNotTruncated = (absolute - degrees) * 60;
                        var minutes = Math.floor(minutesNotTruncated);
                        var seconds = Math.floor((minutesNotTruncated - minutes) * 60);
                        sign = (c < 0) ? "-" : ""; //Assign sign to show

                        return sign + degrees + "°" + minutes + "'"
                            // + seconds + "\""
                            ;
                    }
                }
            });
            this.graticule.setMap(this.map);
        },

        //Destroy Graticul 
        unsetGraticule: function () {
            this.graticule.setMap(null);
        },

        setupSelection: function () {
            Logger.log("map", "setupSelection()");
            var self = this;
            var selectedFeature;
            self.map.on('click', function (e) {
                if (self.mapButton == 'Box') {
                    e.preventDefault();
                    return;
                }
                if (!(self.mapButton == 'Pan' && e.originalEvent.button == 0
                    && self.map.getLayers().item(self.mapModel.selectionLayerId).getSource().getFeatures().length > 0)) {
                    self.clearSelection();
                }

                if (selectedFeature) selectedFeature.setStyle(null);
                selectedFeature = self.map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                    if (layer === self.map.getLayers().item(self.mapModel.footprintLayerId))
                        return feature;
                });

                SearchModel.deselectAll({ uuid: null, sender: 'OLMap' });
                CartModel.deselectAll({ uuid: null, sender: 'OLMap' });
                if (selectedFeature && selectedFeature.product) {
                    if (CartStatusService.getCartActive() == true) {
                        if (CartStatusService.getCartFootprints() == true) {
                            CartModel.callEventSelectProduct({ uuid: selectedFeature.product.id, sender: "OLMap" });
                        } else
                            ToastManager.error('Map selection disabled. Please load Cart Footprints to select them');
                    } else {
                        SearchModel.selectProduct({ uuid: selectedFeature.product.id, sender: "OLMap" });
                        selectedFeature.setStyle(selectedFeature.product.selected_style);
                    }
                }
                SearchModel.OnSelectionChange(); //Update product Count
            });
        },

        setupMap: function (mapDomNode) {
            Logger.log("map", "setupMap()");
            this.initMap(mapDomNode);
            this.setupSelection();
        },
        setupCesium: function () {
            Logger.log("map", "setupCesium()");
            this.setup3dMap();
            this.map3d.setEnabled(true); //To check
            this.map3dActive = true;
        },
        createJTSMultipolygon: function (multipoly) {
            var jtsmultipoly = 'MULTIPOLYGON(';
            for (var i = 0; i < multipoly.length; i++) {
                var poly = multipoly[i];
                jtsmultipoly += '((';
                var ycoord;
                var y0coord;
                for (var j = 0; j < poly.length - 1; j++) {
                    if (poly[j][1] > 85.05)
                        ycoord = 85.05;
                    else if (poly[j][1] < -85.05)
                        ycoord = -85.05;
                    else
                        ycoord = poly[j][1];
                    jtsmultipoly += poly[j][0] + ' ' + ycoord + ',';
                }
                if (poly[0][1] > 85.05)
                    y0coord = 85.05;
                else if (poly[0][1] < -85.05)
                    y0coord = -85.05;
                else
                    y0coord = poly[0][1];
                jtsmultipoly += (poly[0][0]) + ' ' + y0coord + ')),';
            }
            jtsmultipoly = jtsmultipoly.substring(0, jtsmultipoly.length - 1) + ')';
            return jtsmultipoly;
        },
        setModel: function (model) {
            Logger.log("map", "setModel()");
            var newValue = model;
            this.model = model;
            var products = [];
            var length = (model && model.length) ? model.length : 0;
            for (var i = 0; i < length; i++) {
                var productIndex = _.findIndex(
                    model[i].indexes,
                    function (element) {
                        return (element.name == "product");
                    }
                );
                var footprint = model[i].footprint;
                var jtsFootprint = '';

                var wkt = model[i].wkt;
                if (wkt) {

                    products.push(
                        Product.create(model[i], wkt));
                } else {
                    if (footprint) {
                        console.log("No WKT found, rebuild from coordinates...")
                        jtsFootprint = this.createJTSMultipolygon(footprint);
                        //console.log("footprint is", jtsFootprint)
                        products.push(
                            Product.create(model[i], jtsFootprint));
                    }
                }
            }
            this.renderFootprintLayer(products);
        },

        updateHighlightProducts: function () {
            var self = this;
            if (SearchModel.model.list) {
                for (var i = 0; i < SearchModel.model.list.length; i++) {
                    if (SearchModel.model.list[i]) {
                        var elem = self.map.getLayers()
                            .item(self.mapModel.footprintLayerId).getSource()
                            .getFeatures()[_.findIndex(self.map.getLayers()
                                .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                                function (element) {
                                    return (SearchModel.model.list[i].uuid == element.product.id)
                                })];
                        if (elem) {
                            elem.setStyle((SearchModel.model.list[i].selected) ? (SearchModel.model.list[i].selected_style) :
                                ((SearchModel.model.list[i].highlight) ? (SearchModel.model.list[i].highlighted_style) : (SearchModel.model.list[i].default_style))
                            );
                        }
                    }
                }
            }
        },

        updateModel: function (performZoom) {
            Logger.log("map", "updateModel()  " + performZoom);
            var self = this;

            //Update Searchmodel
            if (SearchModel.model.list) {
                for (var i = 0; i < SearchModel.model.list.length; i++) {
                    if (SearchModel.model.list[i]) {
                        var elem = self.map.getLayers()
                            .item(self.mapModel.footprintLayerId).getSource()
                            .getFeatures()[_.findIndex(self.map.getLayers()
                                .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                                function (element) {
                                    return (SearchModel.model.list[i].uuid == element.product.id);
                                })];
                        if (elem)
                            elem.setStyle((SearchModel.model.list[i].selected) ? SearchModel.model.list[i].selected_style : SearchModel.model.list[i].default_style);
                    }

                    //Zoom
                    if (SearchModel.model.list[i].selected && performZoom) {
                        var selectedFeature = self.map.getLayers()
                            .item(self.mapModel.footprintLayerId).getSource()
                            .getFeatures()[_.findIndex(self.map.getLayers()
                                .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                                function (element) {
                                    return (self.model[i].uuid == element.product.id)
                                })];
                        var duration = 800;
                        var start = +new Date();
                        var pan = ol.animation.pan({
                            duration: duration,
                            source: /** @type {ol.Coordinate} */ (self.map.getView().getCenter()),
                            start: start
                        });

                        var zoom = ol.animation.zoom({
                            duration: duration,
                            resolution: self.map.getView().getResolution(),
                            start: start
                        });
                        var zoom = function () { };

                        self.map.beforeRender(pan, zoom);
                        if (selectedFeature) {
                            var extentCoords = selectedFeature.getGeometry().getExtent();
                            var centerCoordinate = ol.extent.getCenter(extentCoords);
                            self.map.getView().setCenter(centerCoordinate);
                        }
                    }
                }
            }

            //Update Cart Model   // using j as index
            if (CartStatusService.getCartFootprints())
                self.updateCartFootprints();

        },

        updateCartHighlightedProducts: function () {
            var self = this;
            if (CartStatusService.getCartFootprints() === true && CartModel.model.list) self.updateCartFootprints();
        },

        //Update Cart Footprints on Map on Highligh or Selection
        updateCartFootprints: function () {
            var self = this;
            CartModel.model.list.forEach(function (elem, i) {
                elem = self.map.getLayers().item(self.mapModel.footprintLayerId).getSource().getFeatures()[_.findIndex(self.map.getLayers()
                    .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                    function (element) { return (CartModel.model.list[i].uuid == element.product.id); })];
                var cartItem = CartModel.model.list[i];
                if(elem)
                    elem.setStyle((cartItem.selected) ? (cartItem.selected_style) : ((cartItem.highlight) ? (cartItem.highlighted_style) : (cartItem.default_style)));
            });
        },

        polygon2String: function (polygon) {
            var polygonString = 'POLYGON(('
            for (var i = 0; i < polygon.length; i++)
                polygonString += ((polygon[i][0]) + ' ' + (polygon[i][1]) + ',');
            return polygonString + (polygon[0][0]) + ' ' + (polygon[0][1]) + '))';
        },
        // from old dhus
        /* added parameter isShape to be used for selection after having fixed simplified WKT from shapefile*/
        processSelection: function (feature, format) {
            var self = this;
            var currentPolygonSearchString = "";
            var featureX = feature.clone();
            var geometry = featureX.getGeometry();

            var points = [];
            var simplifyPoints = [];
            var simplifiedPoints = [];
            geometry = geometry.transform(DHuSMapConfig.map.transformation.destination, DHuSMapConfig.map.transformation.source);
            points = geometry.getCoordinates();
            var _poly = '';
            for (var i = 0; i < points.length; i++) {
                _poly += self.polygon2String(points[i]);
            }
            if (format) {
                if (format.localeCompare('Polygon') == 0 && (!self.testGeomIsValid(_poly) || !self.testPolygonOutOfBounds(geometry.getExtent()))) {

                    alert('Not a valid polygon!');
                    self.clearSelection();
                    return "";
                }

                currentPolygonSearchString = '( ';
                for (var i = 0; i < points.length; i++) {

                    //for(var j = 0; j < points[i].length; j++){
                    currentPolygonSearchString += 'footprint:\"Intersects(';
                    currentPolygonSearchString += self.polygon2String(points[i]);
                    currentPolygonSearchString += ')\"';
                    //}

                    if (i < (points.length - 1))
                        currentPolygonSearchString += ' OR ';
                }
                currentPolygonSearchString += ')';



            } else {

                if(self.testPolygonOutOfMap(geometry.getExtent())) {
                    alert('Not a valid polygon!');
                    self.clearSelection();
                    return "";
                }

                var extent = geometry.getExtent();
                var top = extent[3];
                var bottom = extent[1];
                var left = extent[0];
                var right = extent[2];
                var leftWasNeg = false;
                var rightWasPos = false;
                var currentPolygonSearchString = '';
                var polygon = {};
                if (left < -180 & right > 180) {
                    currentPolygonSearchString = "( ";
                    currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                        [-180, bottom],
                        [0, bottom],
                        [0, top],
                        [-180, top]
                    ]) + ')" OR ';
                    currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                        [0, bottom],
                        [180, bottom],
                        [180, top],
                        [0, top]
                    ]) + ')" )';
                } else {
                    while (left < -180) {
                        leftWasNeg = true;
                        left += 360;
                    }
                    while (right > 180) {
                        rightWasPos = true;
                        right -= 360;
                    }
                    if (right > left) {
                        if (right - left > 180) {
                            currentPolygonSearchString = "( ";
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [left, bottom],
                                [0, bottom],
                                [0, top],
                                [left, top]
                            ]) + ')" OR ';
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [0, bottom],
                                [right, bottom],
                                [right, top],
                                [0, top]
                            ]) + ')" )';
                        } else if (leftWasNeg || rightWasPos) {
                            currentPolygonSearchString = "( ";
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [-180, bottom],
                                [0, bottom],
                                [0, top],
                                [-180, top]
                            ]) + ')" OR ';
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [0, bottom],
                                [180, bottom],
                                [180, top],
                                [0, top]
                            ]) + ')" )';
                        } else {
                            currentPolygonSearchString = "( ";
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [left, bottom],
                                [right, bottom],
                                [right, top],
                                [left, top]
                            ]) + ')" )';
                        }
                    } else {
                        if (left < 0) {
                            currentPolygonSearchString = "( ";
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [left, bottom],
                                [0, bottom],
                                [0, top],
                                [left, top]
                            ]) + ')" OR ';
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [0, bottom],
                                [180, bottom],
                                [180, top],
                                [0, top]
                            ]) + ')" OR ';
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [-180, bottom],
                                [right, bottom],
                                [right, top],
                                [-180, top]
                            ]) + ')" )';
                        } else if (right > 0) {
                            currentPolygonSearchString = "( ";
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [left, bottom],
                                [180, bottom],
                                [180, top],
                                [left, top]
                            ]) + ')" OR ';
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [-180, bottom],
                                [0, bottom],
                                [0, top],
                                [-180, top]
                            ]) + ')" OR ';
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [0, bottom],
                                [right, bottom],
                                [right, top],
                                [0, top]
                            ]) + ')" )';
                        } else {
                            currentPolygonSearchString = "( ";
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [left, bottom],
                                [180, bottom],
                                [180, top],
                                [left, top]
                            ]) + ')" OR ';
                            currentPolygonSearchString += 'footprint:\"Intersects(' + self.polygon2String([
                                [-180, bottom],
                                [right, bottom],
                                [right, top],
                                [-180, top]
                            ]) + ')" )';
                        }
                    }
                }
            }



            //
            // for(var i = 0; i < points.length; i++){
            //   simplifyPoints[i] = [];
            //   simplifiedPoints[i] = [];
            //   for(var j = 0; j < points[i].length; j++){
            //     simplifyPoints[i].push({x:points[i][j][0],y:points[i][j][1]});
            //   }
            //   var simplified = simplify(simplifyPoints[i], 40);
            //   simplifiedPoints[i] = simplified;
            // }


            // convert coordinates
            // var simplifiedAndConvertedPoints =  []
            // for(var k = 0; k < simplifiedPoints.length; selectSingleProductk++){
            //   simplifiedAndConvertedPoints[k] = [];
            //   for (var z = 0;  z < simplifiedPoints[k].length; z++){
            //     simplifiedAndConvertedPoints[k][z] = [];
            //     simplifiedAndConvertedPoints[k][z].push(simplifiedPoints[k][z].x);
            //     simplifiedAndConvertedPoints[k][z].push(simplifiedPoints[k][z].y);
            //   }
            // }
            // console.log("simplifiedAndConvertedPoints: ", simplifiedAndConvertedPoints);

            // end shape file
            //-------------------------//
            return currentPolygonSearchString;
        },
        setDrawOnMap: function (status) {
            if (!status)
                this.clearSelection();
            this.dragBox.setActive(status);
            this.drawBox.setActive(status);
        },

        init: function (mapDomNode) {
            Logger.log("map", "init()");
            var self = this;
            this.setupMap(mapDomNode);
            if (DHuSMapConfig.map3dActive)
                this.setupCesium();
        }
    };
});

angular.module('DHuS-webclient').directive('dhusMap', function ($document, $location, $rootScope, $window, GraticuleService, CartModel, CartStatusService, ConfigurationService, LayoutManager, Logger, OLMap, SearchBoxService, SearchModel) {
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'components/map/view.html',
        scope: {
            text: "="
        },
        createdSearchModel: function () { },
        productDidSelected: function () { },
        singleProductDidSelected: function () { },
        productDidDeselected: function () { },
        productDidHighlighted: function () { },
        OnSelectProduct: function () { }, //Select Cart item
        OnHighlight: function () { },
        compile: function (tElem, tAttrs) {
            var self = this;
            var anim = false;
            return {
                pre: function (scope, iElem, iAttrs) {
                    SearchModel.sub(self);
                    CartModel.sub(self); //CartModel Subscription

                    var resizeMap = function () {
                        $('#map').css('top', (parseInt(LayoutManager.getToolbarHeight())) + 'px');
                        $('#map').css('height', (parseInt(LayoutManager.getScreenHeight()) - parseInt(LayoutManager.getToolbarHeight())) + 'px');
                    };

                    angular.element($window).bind('resize', function () {
                        resizeMap();
                    });

                    angular.element($document).ready(resizeMap);

                    angular.element($window).bind('resize',
                        function () {
                            setTimeout(function () {
                                OLMap.map.updateSize();
                            }, 0);
                        });

                    angular.element($window).ready(
                        function () {
                            setTimeout(function () {
                                OLMap.map.updateSize();
                            }, 0);
                        });
                },
                post: function (scope, iElem, iAttrs) {
                    if (!ConfigurationService.isLoaded()) {
                        ConfigurationService.getConfiguration().then(function (data) {
                            if (data) {
                                ApplicationService = data;
                                if (ApplicationService.settings.shapefile_max_size &&
                                    ApplicationService.settings.shapefile_max_size_message) {
                                    MAX_SHAPE_FILE_SIZE = ApplicationService.settings.shapefile_max_size
                                    MAX_SHAPE_FILE_SIZE_MESSAGE = ApplicationService.settings.shapefile_max_size_message;
                                }
                            }
                        });
                    } else {
                        if (ApplicationService.settings.shapefile_max_size &&
                            ApplicationService.settings.shapefile_max_size_message) {
                            MAX_SHAPE_FILE_SIZE = ApplicationService.settings.shapefile_max_size
                            MAX_SHAPE_FILE_SIZE_MESSAGE = ApplicationService.settings.shapefile_max_size_message;
                        }
                    }
                    scope.format = MOUSE_POSITION_FORMAT;
                    scope.titleformat = 'Convert to Degree Minute Second';
                    scope.model = SearchBoxService.model;
                    scope.toggleBtnMap = false;
                    OLMap.mapButton = 'Box';
                    scope.drawByDefault = ApplicationService.settings.draw_by_default

                    function init() {
                        OLMap.init("map");
                        OLMap.externalInterface.sendSelectionCoordinates = function (coords) {
                            scope.model.geoselection = coords;
                        };

                        /**CartModel Protocol Implementation  **/
                        self.OnSelectProduct = function (param) { OLMap.updateModel(false); };
                        self.OnDeselectCurrentProduct = function (param) { OLMap.updateModel(false); };
                        self.OnHighlight = function (param) { OLMap.updateCartHighlightedProducts(); };

                        //TODO: More Cart methods here based on CartModel protocol if needed...

                        /** SearchModel Protocol implementation. Check Searchmodel **/
                        self.createdSearchModel = function () { OLMap.setModel(SearchModel.model.list); };
                        self.productDidSelected = function (param) { OLMap.updateModel(false); };
                        self.productDidDeselected = function (param) { OLMap.updateModel(false); };
                        self.singleProductDidSelected = function (param) { OLMap.updateModel(false); };
                        self.productDidHighlighted = function (param) { OLMap.updateHighlightProducts(); };
                        self.productDidntHighlighted = function (param) { OLMap.updateHighlightProducts(); };
                        self.clearMap = function () { OLMap.clearSelection(); };
                        self.updatedSearchModel = function () {
                            //OLMap.updateModel(performZoom);
                        };
                    }

                    scope.toggle3dMap = function () {
                        Logger.log("map", "toggle3dMap()");
                        OLMap.map3d.setEnabled(!OLMap.map3d.getEnabled());
                        OLMap.toggleButtonLabel = (OLMap.map3d.getEnabled()) ? DHuSMapConfig.mapToggleButton.active2DlabelText : DHuSMapConfig.mapToggleButton.active3DlabelText;
                    };

                    scope.toggleActivedSelection = function () {
                        if (CartStatusService.getCartActive() == true) {
                            ToastManager.error("Disabled When Cart is Active")
                            return;
                        }
                        Logger.log("map", "toggleActivedSelection()");
                        OLMap.setActivedSelection(!OLMap.activedSelection);
                        scope.toggleBtnMap = !OLMap.activedSelection;
                        OLMap.mapButton = (scope.toggleBtnMap) ? 'Pan' : 'Box';
                        scope.animateCircle();
                    };

                    //Switcher animation
                    scope.animateCircle = function () {
                        if (CartStatusService.getCartActive() == true) {
                            ToastManager.error('Toggle button disabled when Cart is active');
                            return;
                        }
                        var elem = document.getElementById("moving-circle-toggle");

                        if (anim) {
                            $(elem).animate({ top: '30px' }, 300);
                            scope.toggleSwitcherTitle = "Switch to Area Mode";
                        } else {
                            $(elem).animate({ top: ('-' + parseInt($(elem).height() + -28) + 'px') }, 300);
                            scope.toggleSwitcherTitle = "Switch to Navigation Mode";
                        }
                        anim = !anim;
                    };

                    scope.activatePan = function () {
                        OLMap.setActivedSelection(false);
                        scope.toggleBtnMap = true;
                        OLMap.mapButton = 'Pan';
                    };

                    scope.activateBox = function () {
                        OLMap.setActivedSelection(true);
                        scope.toggleBtnMap = false;
                        OLMap.mapButton = 'Box';
                        OLMap.setupBoxSelection();
                    };

                    scope.activatePolygon = function () {
                        OLMap.setActivedSelection(true);
                        scope.toggleBtnMap = false;
                        OLMap.mapButton = 'Polygon';
                        OLMap.setupBoxSelection();
                    };

                    scope.clearSelection = function () {
                        OLMap.clearSelection();
                    };

                    scope.switchCoordinate = function () {

                        //Show Graticule for the different Coordinates format on switching
                        if (GraticuleService.getGraticuleStatus() == false) {

                            //Delete current Graticule
                            OLMap.unsetGraticule()

                            //Set Graticule on the opposite of he current coordinate value
                            OLMap.setGraticule((scope.format == 'dd') ? 'dms' : 'dd');
                        }

                        if (scope.format.localeCompare('dd') == 0) {
                            scope.format = 'dms';
                            coordinateStatus = scope.format;
                            scope.titleformat = 'Convert to Decimal Degree';
                        } else {
                            scope.format = 'dd';
                            coordinateStatus = scope.format;
                            scope.titleformat = 'Convert to Degree Minute Second';
                        }
                        OLMap.switchCoordinate(scope.format);
                    }
                    scope.isMapLayerSwitcherVisible = ApplicationService.settings.isMapLayerSwitcherVisible;
                    scope.showmap = ApplicationService.settings.showmap;
                    init();
                    if (!scope.drawByDefault) scope.toggleActivedSelection();
                }
            };
        }
    };
});

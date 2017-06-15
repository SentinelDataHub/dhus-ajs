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

(function() {
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
        points = simplifyDouglasPeucker(points, sqTolerance);

        return points;
    }

    // export as AMD module / Node module / browser or worker variable
    if (typeof define === 'function' && define.amd) define(function() {
        return simplify;
    });
    else if (typeof module !== 'undefined') module.exports = simplify;
    else if (typeof self !== 'undefined') self.simplify = simplify;
    else window.simplify = simplify;

})();
///////////////////////////////////**************************************//////

var Product = {
    create: function(product, footprint) {
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


angular.module('DHuS-webclient').factory('OLMap', function(Logger, SearchModel, ConfigurationService) {
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
        setActivedSelection: function(status) {
            Logger.log("map", "setActivedSelection()");
            this.activedSelection = status;
            if(this.dragBox)
                this.dragBox.setActive(status);
        },
        clearSelection: function() {
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
        renderFootprintLayer: function(products) {
            Logger.log("map", "renderFootprintLayer()");
            var self = this;
            var format = new ol.format.WKT();
            var features = [];
            for (var i = 0; i < products.length; i++) {
                var feature = format.readFeature(products[i].footprint);
                feature.getGeometry().transform(DHuSMapConfig.map.transformation.source, DHuSMapConfig.map.transformation.destination);
                feature.product = products[i];
                //self.model[i].style=style;
                feature.setStyle(feature.product.default_style);
                features.push(feature);
            }

            this.map.getLayers().item(this.mapModel.footprintLayerId).setSource(new ol.source.Vector({
                features: features,
                wrapX: false
            }));
            self.refresh3dMap();
        },
        refresh3dMap: function() {
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
        setup3dMap: function() {
            Logger.log("map", "setup3dMap()");
            this.map3d = new olcs.OLCesium({
                map: this.map
            });
            this.scene = this.map3d.getCesiumScene().terrainProvider = new Cesium.CesiumTerrainProvider({
                url: DHuSMapConfig.cesium.terrainProviderUrl
            });
        },
        olCoords2LatLon: function(olcoords) {
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
        setupBoxSelection: function() {
            var self = this;
            var isFirst=0;
            // todo: to move this style !!!!~!!!!
            if(self.dragBox) {
                this.map.removeInteraction(self.dragBox);
            }
            if(this.mapButton == 'Box') {
                self.dragBox = new ol.interaction.DragBox({               
                    condition: ol.events.condition.always,
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: [255, 255, 255, 0.4]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0, 0, 255, 1]
                        })
                    })
                });

                this.map.addInteraction(self.dragBox);

                
                
                self.dragBox.on('boxend', function(e) {
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
                    feature.setGeometry(self.dragBox.getGeometry());
                    self.map.getLayers().item(self.mapModel.selectionLayerId).setSource(new ol.source.Vector({
                        features: [feature],
                        wrapX: false
                    }));
                    self.map.getLayers().item(self.mapModel.shapeLayerId).setSource(new ol.source.Vector({
                        features: [],
                        wrapX: false
                    }));
                    self.setCurrentSelection(self.processSelection(feature));
                });
                self.dragBox.on('boxstart', function(e) {
                    self.externalInterface.sendSelectionCoordinates(null);
                });
            } else if(this.mapButton == 'Polygon') {                
                
                self.dragBox = new ol.interaction.Draw({
                    source: self.map.getLayers().item(self.mapModel.selectionLayerId).getSource(),
                    type: 'Polygon',
                    geometryFunction: function(coords, geom) {
                        if (!geom) geom = new ol.geom.Polygon(null);
                        geom.setCoordinates(coords);
                        //if linestring changed

                        return geom;
                    },
                    condition: ol.events.condition.always,
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: [255, 255, 255, 0.4]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0, 0, 255, 1]
                        })
                    })
                });

                this.map.addInteraction(self.dragBox);/*self.map.on('click'*/
                self.dragBox.on('drawstart',function(e){
                     self.map.getLayers().item(self.mapModel.selectionLayerId).getSource().clear();
                   
                });
                self.dragBox.on('drawend',function(e){
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
                    self.setCurrentSelection(self.processSelection(e.feature,'Polygon'));                    
                    
                });
                
            } else
                return;


        },
        /* DRAG AND DROP FEATURE BEGIN */

        loadShapeFile: function(shapefile) {
            //manage only one file
            var file = shapefile;
            var self = this;
            if ((file.name.toLowerCase().indexOf('.shp', file.name.length - 4)) == -1) {

                AlertManager.warn("Unsupported shape file", "Only files with extension .shp are supported");
                SpinnerManager.off();
                return;
            }
            try {

                var reader = new FileReader();

                reader.onloadend = function() {


                    var binary = "";
                    var bytes = new Uint8Array(reader.result);
                    var length = bytes.byteLength;
                    for (var i = 0; i < length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    var binaryFile = binary;
                    var features = [];
                    var originalShapesFeatures = [];
                    getOpenLayersFeatures(file.name, binaryFile, function(fs) {
                        if (!fs) {
                            AlertManager.warn("Unexpected Error", "Error Loading Shapefile ");
                            SpinnerManager.off();
                        }
                        var format = new ol.format.WKT();

                        var originalfeature = format.readFeature(fs);
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
                        view.fitExtent(
                            vectorSource.getExtent(), /** @type {ol.Size} */ (self.map.getSize()));
                        SpinnerManager.off();
                    });
                }

                // Read in the image file as a data URL.
                reader.readAsArrayBuffer(file);
            } catch (err) {
                AlertManager.warn("Unexpected Error", "Error Loading Shapefile ");
                SpinnerManager.off();
            }

        },

        setupDragAndDrop: function() {

            var self = this;

            function handleFileSelect(evt) {
                SpinnerManager.on();
                evt.stopPropagation();
                evt.preventDefault();

                var files = evt.dataTransfer.files; // FileList object.
                if (files && files.length > 0) {
                    self.loadShapeFile(files[0]);
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

        testGeomIsValid: function(testGeometry){
            var result = {};
            var wktReader = new jsts.io.WKTReader();
            var jstsGeometry = wktReader.read(testGeometry);
            var isValidOp = new jsts.operation.valid.IsValidOp(jstsGeometry);
            var valid = isValidOp.isValid();
            return valid;
        },

        displayFeatureInfo: function(pixel) {
            var self = this;
            var features = [];
            self.map.forEachFeatureAtPixel(pixel, function(feature, layer) {
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


        setCurrentSelection: function(coords) {
            if (this.externalInterface.sendSelectionCoordinates) {
                this.externalInterface.sendSelectionCoordinates(coords);
            } else {
                Logger.error("map", "[MAP] - sendSelectionCoordinates not implemented");
            }
        },

        initMap: function(mapDomNode, model) {
            var self = this;
            if (!ConfigurationService.isLoaded())
                ConfigurationService.getConfiguration().then(function(data) {

                    if (data)
                        ApplicationService = data;
                });
            else {

            }

            var bounds = [-180, -80, 180, 80];
            Logger.log("map", "initMap()");
            var self = this;
            self.productModel.list = model && model.list;
            self.footprintLayer = new ol.layer.Vector({
                source: new ol.source.Vector({ wrapX: false })
            });

            var generateLayer = function(model) {
                var layersX = [];
                for (var i = 0; i < model.sources.length; i++)
                    layersX.push(new ol.layer.Tile({
                        source: new ol.source[model.sources[i].class](model.sources[i].params)
                    }));

                return new ol.layer.Group({
                    title: model.title,
                    type: model.type,
                    visible: model.visible,
                    layers: layersX,
                    wrapX: false
                });

            };

            var mousePositionControl = new ol.control.MousePosition({
                coordinateFormat: ol.coordinate.createStringXY(4),
                projection: 'EPSG:4326',
                // comment the following two lines to have the mouse position
                // be placed within the map.
                // className: 'custom-mouse-position',
                // target: document.getElementById('mouse-position'),
                undefinedHTML: '&nbsp;'
            });

            this.map = new ol.Map({


                /*interactions: ol.interaction.defaults().extend([dragAndDropInteraction]),*/
                target: mapDomNode,
                layers: [
                    generateLayer(ApplicationService.settings.map.Satellite),
                    generateLayer(ApplicationService.settings.map.Road),
                    generateLayer(ApplicationService.settings.map.Hybrid),
                    self.footprintLayer,
                    new ol.layer.Vector({
                        source: new ol.source.Vector({ wrapX: false })
                    }),
                    new ol.layer.Vector({
                        source: new ol.source.Vector({ features: [], wrapX: false })
                    })
                ],


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
                }).extend([mousePositionControl])
            });
            if (ApplicationService.settings.isMapLayerSwitcherVisible) {
                var layerSwitcher = new ol.control.LayerSwitcher({
                    tipLabel: 'Map Layers' // Optional label for button
                });
                self.map.addControl(layerSwitcher);
            }

            self.setupBoxSelection();
            if (ApplicationService.settings.enable_shapefile)
                self.setupDragAndDrop();
            self.setActivedSelection(true); //todo to check
            $(document).on('zoom-to', function(event, product) {
                for (var i = 0; i < SearchModel.model.list.length; i++) {
                    if (SearchModel.model.list[i]) {
                        if (SearchModel.model.list[i].uuid == product.uuid) {
                            var selectedFeature = self.map.getLayers()
                                .item(self.mapModel.footprintLayerId).getSource()
                                .getFeatures()[_.findIndex(self.map.getLayers()
                                    .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                                    function(element) {
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
                            if (selectedFeature)
                                self.map.getView().fitExtent(selectedFeature.getGeometry().getExtent(), self.map.getSize());

                        }
                    }
                }

            });

        },

        setupSelection: function() {
            Logger.log("map", "setupSelection()");
            var self = this;
            var selectedFeature;
            self.map.on('click', function(e) {
                // here rbua
                if(self.mapButton == 'Polygon') {                    
                    e.preventDefault();
                    return;
                }
                self.clearSelection();
                self.setCurrentSelection(null);

                if (selectedFeature) {
                    selectedFeature.setStyle(null);
                }
                selectedFeature = self.map.forEachFeatureAtPixel(e.pixel, function(feature, layer) {
                    return feature;
                });

                if (selectedFeature && selectedFeature.product) {
                    //selectSingleProduct
                    SearchModel.selectSingleProduct({ uuid: selectedFeature.product.id, sender: 'OLMap' });
                    selectedFeature.setStyle(selectedFeature.product.selected_style);
                } else {
                    SearchModel.deselectAll({ uuid: null, sender: 'OLMap' });
                }
            });
        },




        setupMap: function(mapDomNode) {
            Logger.log("map", "setupMap()");
            this.initMap(mapDomNode);
            this.setupSelection();
        },
        setupCesium: function() {
            Logger.log("map", "setupCesium()");
            this.setup3dMap();
            this.map3d.setEnabled(true); //To check
            this.map3dActive = true;
        },
        createJTSMultipolygon: function(multipoly) {
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
        setModel: function(model) {
            Logger.log("map", "setModel()");
            var newValue = model;
            this.model = model;
            var products = [];

            for (var i = 0; i < model.length; i++) {
                var productIndex = _.findIndex(
                    model[i].indexes,
                    function(element) {
                        return (element.name == "product")
                    }
                );
                var footprint = model[i].footprint;
                var jtsFootprint = '';
                if (footprint) {
                    jtsFootprint = this.createJTSMultipolygon(footprint);
                    products.push(
                        Product.create(model[i], jtsFootprint));
                }
            }
            this.renderFootprintLayer(products);
        },
        updateHighlightProducts: function() {

            var self = this;
            if (SearchModel.model.list) {
                for (var i = 0; i < SearchModel.model.list.length; i++) {
                    if (SearchModel.model.list[i]) {
                        var elem = self.map.getLayers()
                            .item(self.mapModel.footprintLayerId).getSource()
                            .getFeatures()[_.findIndex(self.map.getLayers()
                                .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                                function(element) {
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
        updateModel: function(performZoom) {
            Logger.log("map", "updateModel()  " + performZoom);
            var self = this;
            if (SearchModel.model.list) {
                for (var i = 0; i < SearchModel.model.list.length; i++) {
                    if (SearchModel.model.list[i]) {
                        var elem =
                            self.map.getLayers()
                            .item(self.mapModel.footprintLayerId).getSource()
                            .getFeatures()[_.findIndex(self.map.getLayers()
                                .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                                function(element) {
                                    return (SearchModel.model.list[i].uuid == element.product.id)
                                })];
                        if (elem) {
                            elem.setStyle((SearchModel.model.list[i].selected) ?
                                SearchModel.model.list[i].selected_style :
                                SearchModel.model.list[i].default_style);
                        }
                    }

                    if (SearchModel.model.list[i].selected && performZoom) {
                        var selectedFeature = self.map.getLayers()
                            .item(self.mapModel.footprintLayerId).getSource()
                            .getFeatures()[_.findIndex(self.map.getLayers()
                                .item(self.mapModel.footprintLayerId).getSource().getFeatures(),
                                function(element) {
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
                        var zoom = function() {};


                        self.map.beforeRender(pan, zoom);
                        if (selectedFeature) {
                            var extentCoords = selectedFeature.getGeometry().getExtent();
                            var centerCoordinate = ol.extent.getCenter(extentCoords);
                            self.map.getView().setCenter(centerCoordinate);
                        }


                    }

                }
            }
        },
        polygon2String: function(polygon) {

            var polygonString = 'POLYGON(('
            for (var i = 0; i < polygon.length; i++)
                polygonString += ((polygon[i][0]) + ' ' + (polygon[i][1]) + ',');
            return polygonString + (polygon[0][0]) + ' ' + (polygon[0][1]) + '))';
        },
        // from old dhus
        /* added parameter isShape to be used for selection after having fixed simplified WKT from shapefile*/
        processSelection: function(feature, format) {
            var self = this;
            var currentPolygonSearchString = "";

            var featureX = feature.clone();
            var geometry = featureX.getGeometry();

            var points = [];
            var simplifyPoints = [];
            var simplifiedPoints = [];
            geometry = geometry.transform(DHuSMapConfig.map.transformation.destination, DHuSMapConfig.map.transformation.source);
            points = geometry.getCoordinates();
            var _poly='';
            for (var i = 0; i < points.length; i++) {
                _poly += self.polygon2String(points[i]);
            }
            
            if (format) {
                if(format.localeCompare('Polygon') == 0 && !self.testGeomIsValid(_poly)) {
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

                var extent = geometry.getExtent();

                console.log('extent', extent);
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
            // for(var k = 0; k < simplifiedPoints.length; k++){
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
        init: function(mapDomNode) {
            Logger.log("map", "init()");
            var self = this;
            this.setupMap(mapDomNode);

            if (DHuSMapConfig.map3dActive)
                this.setupCesium();

        }
    };
});





angular.module('DHuS-webclient').directive('dhusMap', function(OLMap, $window, $document, Logger, LayoutManager, $rootScope, $location, SearchBoxService, SearchModel, ConfigurationService) {

    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'components/map/view.html',
        scope: {
            text: "="
        },
        createdSearchModel: function() {},
        productDidSelected: function() {},
        singleProductDidSelected: function() {},
        productDidDeselected: function() {},
        productDidHighlighted: function() {},
        compile: function(tElem, tAttrs) {
            var self = this;
            return {
                pre: function(scope, iElem, iAttrs) {
                    SearchModel.sub(self);

                    var resizeMap = function() {
                        $('#map').css('top', (parseInt(LayoutManager.getToolbarHeight())) + 'px');
                        $('#map').css('height', (parseInt(LayoutManager.getScreenHeight()) - parseInt(LayoutManager.getToolbarHeight())) + 'px');
                    };

                    angular.element($window).bind('resize', function() {
                        resizeMap();

                    });
                    angular.element($document).ready(resizeMap);

                    angular.element($window).bind('resize',
                        function() {
                            setTimeout(function() {
                                OLMap.map.updateSize();
                            }, 0);
                        });
                    angular.element($window).ready(
                        function() {
                            setTimeout(function() {
                                OLMap.map.updateSize();
                            }, 0);
                        });

                },
                post: function(scope, iElem, iAttrs) {
                    if (!ConfigurationService.isLoaded())
                        ConfigurationService.getConfiguration().then(function(data) {
                            if (data)
                                ApplicationService = data;
                        });

                    scope.model = SearchBoxService.model;
                    scope.toggleBtnMap = false;
                    OLMap.mapButton = 'Box';
                    scope.showMapToolbar = ApplicationService.settings.show_map_toolbar;
                    function init() {
                        OLMap.init("map");
                        OLMap.externalInterface.sendSelectionCoordinates = function(coords) {
                                scope.model.geoselection = coords;
                            }
                            /** SearchModel Protocol implementation **/
                        self.createdSearchModel = function() {
                            OLMap.setModel(SearchModel.model.list);
                        };
                        self.productDidSelected = function(param) {
                            OLMap.updateModel(false);
                        };
                        self.productDidDeselected = function(param) {
                            OLMap.updateModel(false);
                        };
                        self.singleProductDidSelected = function(param) {
                            OLMap.updateModel(false);
                        };
                        self.productDidHighlighted = function(param) {
                            OLMap.updateHighlightProducts();
                        };
                        self.productDidntHighlighted = function(param) {
                            OLMap.updateHighlightProducts();
                        };
                        self.updatedSearchModel = function() {
                            //OLMap.updateModel(performZoom);
                        };

                        if (SearchModel.model && SearchModel.model.list) {
                            OLMap.setModel(SearchModel.model.list);
                        }

                    };

                    scope.toggle3dMap = function() {
                        Logger.log("map", "toggle3dMap()");
                        OLMap.map3d.setEnabled(!OLMap.map3d.getEnabled());
                        OLMap.toggleButtonLabel = (OLMap.map3d.getEnabled()) ? DHuSMapConfig.mapToggleButton.active2DlabelText : DHuSMapConfig.mapToggleButton.active3DlabelText;
                    };

                    scope.toggleActivedSelection = function() {
                        Logger.log("map", "toggleActivedSelection()");
                        OLMap.setActivedSelection(!OLMap.activedSelection);
                        scope.toggleBtnMap = !OLMap.activedSelection;
                        OLMap.mapButton = (scope.toggleBtnMap) ? 'Pan' : 'Box';                        
                    };

                    scope.activatePan = function() {
                        OLMap.setActivedSelection(false);
                        scope.toggleBtnMap = true;
                        OLMap.mapButton = 'Pan';                        
                    };

                    scope.activateBox = function() {
                        OLMap.setActivedSelection(true);
                        scope.toggleBtnMap = false;
                        OLMap.mapButton = 'Box';
                        OLMap.setupBoxSelection();                        
                    };

                    scope.activatePolygon = function() {
                        OLMap.setActivedSelection(true);
                        scope.toggleBtnMap = false;
                        OLMap.mapButton = 'Polygon';
                        OLMap.setupBoxSelection();                        
                    };

                    scope.clearSelection = function() {
                        OLMap.clearSelection();
                    };

                    scope.isMapLayerSwitcherVisible = ApplicationService.settings.isMapLayerSwitcherVisible;

                    init();

                }
            }
        }
    };
});

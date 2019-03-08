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
function getOpenLayersFeatures(filename, binaryFile, callback) {
    var self = {};
    //self.shpURL = 'config/mapIndia.shp';
    //self.dbfURL = 'config/mapIndia.shp';
    self.callback = callback;
    self.filename = filename;
    self.binaryFile = binaryFile;
    var instance = self;
    var response = {
        data: null,
        message: ""
    };

    // Parse into OL features
    var parseShapefile = function() {
        // we can assume that shapefile and dbf have loaded at this point, but check anyhow
        if (!(instance.dbfFile && instance.shpFile)) {
            response.message = "Shapefiles are limited to one record of type POLYGON.";
            response.data = null;
            self.callback(response);
            return;
        }

        var features = [];
        var wkt;
        try {
            var recsLen = instance.shpFile.records.length;
            //console.log("instance.shpFile.records is ", instance.shpFile.records);
            if (recsLen == 0) {
                response.message = "Your shapefile doesn't contain any record. Shapefiles are limited to one record of type POLYGON.";
                response.data = null;

            } else if (recsLen > 1) {
                response.message = "Shapefiles containing more than one record are not supported. Shapefiles are limited to one record of type POLYGON.";
                response.data = null;

            } else {

                var record = instance.shpFile.records[0];
                var attrs = instance.dbfFile.records[0];

                // turn shapefile geometry into WKT
                // points are easy!
                if (instance.shpFile.header.shapeType == ShpType.SHAPE_POINT) {
                    //wkt = 'POINT(' + Number(record.shape.x) + ' ' + Number(record.shape.y) + ')';
                    response.message = "Unsupported shapefile type. Shapefiles are limited to one record of type POLYGON.";
                    response.data = null;

                }

                // lines: not too hard--
                else if (instance.shpFile.header.shapeType == ShpType.SHAPE_POLYLINE) {
                    // prepopulate the first point
                    // var points = [];//record.shape.rings[0].x + ' ' + record.shape.rings[0].y];
                    // var pointsLen = Number(record.shape.rings[0].length);
                    // for (var j = 0; j < pointsLen; j++) {
                    //     points.push(Number(record.shape.rings[0][j].x) + ' ' + Number(record.shape.rings[0][j].y));
                    // }

                    //  wkt = 'LINESTRING(' + points.join(', ') + ')';
                    response.message = "Unsupported shapefile type. Shapefiles are limited to one record of type POLYGON.";
                    response.data = null;


                }

                // polygons: donuts
                else if (instance.shpFile.header.shapeType == ShpType.SHAPE_POLYGON) {
                    var ringsLen = Number(record.shape.rings.length);
                    var wktOuter = [];
                    for (var j = 0; j < ringsLen; j++) {
                        var ring = record.shape.rings[j];
                        if (Number(ring.length) < 1) continue;
                        var wktInner = []; //ring.x + ' ' + ring.y];
                        var ringLen = Number(ring.length);
                        for (var k = 0; k < ringLen; k++) {
                            wktInner.push(Number(ring[k].x) + ' ' + Number(ring[k].y));
                        }
                        wktOuter.push('(' + wktInner.join(', ') + ')');
                    }
                    wkt = 'POLYGON(' + wktOuter.join(', ') + ')';
                } else {
                    response.message = "Unsupported shapefile type. Shapefiles are limited to one record of type POLYGON.";

                }

                features = wkt;
                response.data = features;
            }

            self.callback(response);
        } catch (err) {
            if (!response.message)
                response.message = "Unsupported shapefile type. Shapefiles are limited to one record of type POLYGON.";
            self.callback(response);
        }

    };

    var onShpFail = function() {
        console.warn('failed to load ' + instance.filename);
    };
    var onDbfFail = function() {
        console.warn('failed to load ' + instance.filename);
    }

    var onShpComplete = function(oHTTP) {
        var binFile = oHTTP.binaryResponse;
        //console.log("1");
        //console.log('got data for ' + instance.filename + ', parsing shapefile');
        instance.shpFile = new ShpFile(binFile);
        instance.dbfFile = new DbfFile(binFile);
        if (instance.dbfFile) parseShapefile();
    }

    var onDbfComplete = function(oHTTP) {
        //console.log("2");
        var binFile = oHTTP.binaryResponse;
        //console.log('got data for ' + instance.filename + ', parsing dbf file');
        instance.dbfFile = new DbfFile(binFile);
        if (instance.shpFile) parseShapefile();
    }


    //console.log('getting data for ' + instance.filename + '...  ');
    var binFile = new BinaryFile(instance.binaryFile, 0, 0);
    instance.shpFile = new ShpFile(binFile);
    if (!instance.shpFile || !instance.shpFile.records || instance.shpFile.records.length == 0) {
        response.message = "Unsupported shapefile type. Shapefiles are limited to one record of type POLYGON.";
        self.callback(response);
    } else {
        instance.dbfFile = new DbfFile(binFile);
        //console.log('instance.dbfFile', instance.dbfFile);
        //console.log('instance.shpFile', instance.shpFile);
        if (instance.dbfFile) {
            parseShapefile();
        } else {
            response.message = "Unsupported shapefile type. Shapefiles are limited to one record of type POLYGON.";
            self.callback(response);
        }

    }





}

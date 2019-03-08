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


angular.module('DHuS-webclient')

.directive('evictionItem', function($window, ODataEvictionService, EvictionModel) {
    var SELECTED_ITEM_BACKGROUND_COLOR = '#eCF0F1';
    var HIGHLIGHT_ITEM_BACKGROUND_COLOR = '#F5F5F5';
    var DEFAULT_ITEM_BACKGROUND_COLOR = 'transparent';
    var baseUrl = '';
    var directive = {

        restrict: 'AE',
        replace: true,
        templateUrl: 'components/eviction-container/eviction-item/view.html',
        scope: {
            eviction: "="
        },
        compile: function(tElem, tAttrs) {
            var self = this;
            return {
                pre: function(scope, iElem, iAttrs) {

                },
                post: function(scope, iElem, iAttrs) {

                    scope.startEviction = function() {
                        var model = {
                            Status: "STARTED"
                        };
                        var msg = "error starting eviction";
                        ODataEvictionService.startEviction(scope.eviction.Name, model)
                            .then(function(response) {
                                    var responseStatus = parseInt(response.status);
                                    if (responseStatus >= 200 && responseStatus < 300) {
                                        ODataEvictionService.getEvictionList()
                                            .then(function(response) {
                                                var modelFromServer = response.data.value;
                                                EvictionModel.createModel(modelFromServer, modelFromServer.length);
                                                ToastManager.success("eviction started");
                                            });
                                    } else {
                                        (response.data && response.data.error && response.data.error.message) ? msg=msg + ". Reason: " + response.data.error.message : msg
                                        ToastManager.error(msg);
                                    }
                                },
                                function(response) {
                                    (response.data && response.data.error && response.data.error.message) ? msg=msg + ". Reason: " + response.data.error.message : msg
                                    ToastManager.error(msg);
                                }
                            );
                    };

                    scope.stopEviction = function() {
                        var model = {
                            Status: "STOPPED"                            
                        };
                        var msg = "error stopping eviction";
                        ODataEvictionService.stopEviction(scope.eviction.Name, model)
                            .then(function(response) {
                                    var responseStatus = parseInt(response.status);
                                    if (responseStatus >= 200 && responseStatus < 300) {
                                        ODataEvictionService.getEvictionList()
                                            .then(function(response) {
                                                
                                                var modelFromServer = response.data.value;
                                                
                                                EvictionModel.createModel(modelFromServer, modelFromServer.length);
                                                ToastManager.success("eviction stopped");
                                            });
                                    } else {
                                        (response.data && response.data.error && response.data.error.message) ? msg=msg + ". Reason: " + response.data.error.message : msg
                                        ToastManager.error(msg);
                                    }
                                },
                                function(response) {
                                    (response.data && response.data.error && response.data.error.message) ? msg=msg + ". Reason: " + response.data.error.message : msg
                                    ToastManager.error(msg);
                                }
                            );
                    };

                    scope.deleteEviction = function() {
                        ODataEvictionService.deleteEviction(scope.eviction.Name)
                            .then(function(response) {
                                    var responseStatus = parseInt(response.status);
                                    if (responseStatus >= 200 && responseStatus < 300) {
                                        ODataEvictionService.getEvictionList()
                                            .then(function(response) {
                                                var modelFromServer = response.data.value;
                                                EvictionModel.createModel(modelFromServer, modelFromServer.length);
                                                ToastManager.success("eviction deleted");
                                            });
                                    } else {
                                        ToastManager.error("error deleting eviction");
                                    }
                                },
                                function(data) {
                                    ToastManager.error("error deleting eviction");
                                }
                            );
                    };

                    scope.editEviction = function() {
                       console.log("124 edit eviction...");
                       
                        EvictionDetailsManager.getEvictionDetails(scope.eviction.Name, false);

                    };

                    scope.hoverIn = function() {
                        scope.visibleItemButton = true;
                    };

                    scope.hoverOut = function() {
                        scope.visibleItemButton = false;
                    };

                }
            };
        }
    };

    return directive;
});

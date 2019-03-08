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

angular.module('DHuS-webclient').directive('evictionList', function (ODataEvictionService, EvictionModel) {
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'components/eviction-container/eviction-list/view.html',
        compile: function (tElem, tAttrs) {
            var self = this;
            return {
                pre: function (scope, iElem, iAttrs) {
                    scope.evictionsCount = 0;
                    scope.currentPage = 1;
                },
                post: function (scope, iElem, iAttrs) {


                    scope.init = function () {
                        ODataEvictionService.getEvictionList()
                            .then(function (response) {
                                var modelFromServer = response.data.value;
                                // console.log("All Ev: ", modelFromServer);
                                EvictionModel.createModel(modelFromServer, modelFromServer.length);
                                scope.evictionList = EvictionModel.model.list;
                                scope.evictionsCount = EvictionModel.evictionsCount;

   

                            });

                    };
                    scope.$watch(function () {
                        // console.log("scope watch Eviction List");
                        return EvictionModel.model.list;
                    }, function (newvalue) {
                        scope.evictionList = newvalue;
                    });
                    scope.$watch(function () {
                        // console.log("scope watch Eviction List count");
                        return EvictionModel.evictionsCount;
                    }, function (newvalue) {
                        scope.evictionsCount = newvalue;
                    });
                    scope.evictionsPerPage = 25;

                    scope.currentPage = 1;

                    scope.pageCount = Math.floor(scope.evictionsCount / scope.evictionsPerPage) + ((scope.evictionsCount % scope.evictionsPerPage) ? 1 : 0);



                    scope.gotoFirstPage = function () {
                        goToPage(1);
                    };

                    scope.gotoPreviousPage = function () {
                        goToPage(scope.currentPage - 1);
                    };

                    scope.gotoNextPage = function () {
                        goToPage(scope.currentPage + 1);
                    };

                    scope.gotoLastPage = function () {
                        goToPage(scope.pageCount);
                    };

                    scope.selectPageDidClicked = function (xx) {

                    };

                    scope.createEviction = function () {
                        console.log("creating eviction list...");
                        EvictionDetailsManager.getEvictionDetails(null, true);
                    };

                    scope.init();


                }
            }
        }
    };
});

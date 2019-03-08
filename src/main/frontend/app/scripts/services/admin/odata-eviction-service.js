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

angular
    .module('DHuS-webclient')
    .factory('ODataEvictionService', function($http, $q) {
        var service = {
            model: null,
            evictionsUrl: "odata/v2/Evictions",
            evictionUrl: "odata/v2/Evictions(':name')",
            collectionsUrl: "odata/v1/Collections",
            formatParameter: "$format=json",
            requestHeaders: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            getEvictionList: function() {
                var self = this;
                return $http({
                    url: ApplicationConfig.baseUrl + self.evictionsUrl + '?' + self.formatParameter,
                    method: "GET",
                    headers: self.requestHeaders
                });
            },
            collections: function() {
                var self = this;
                return $http({
                    url: ApplicationConfig.baseUrl + self.collectionsUrl + '?$select=Name&' + self.formatParameter,
                    method: "GET",
                    headers: self.requestHeaders
                });
            },
            updateEviction: function(name, model) {
                var self = this;
                return $http({
                    url: ApplicationConfig.baseUrl + self.evictionUrl.replace(':name', name),
                    method: "PATCH",
                    data: model,
                    headers: self.requestHeaders
                });
            },

            stopEviction: function(name, model) {
                var self = this;
                return $http({
                    url: ApplicationConfig.baseUrl + self.evictionUrl.replace(':name', name),
                    method: "PATCH",
                    data: model,
                    headers: self.requestHeaders
                });
            },

            startEviction: function(name, model) {
                var self = this;
                return $http({
                    url: ApplicationConfig.baseUrl + self.evictionUrl.replace(':name', name),
                    method: "PATCH",
                    data: model,
                    headers: self.requestHeaders
                });
            },

            deleteEviction: function(name) {
                var self = this;
                return $http({
                    url: ApplicationConfig.baseUrl + self.evictionUrl.replace(':name', name),
                    method: "DELETE"
                });
            },

            createEviction: function(model) {
                var self = this;
                return $http({
                    url: ApplicationConfig.baseUrl + self.evictionsUrl,
                    method: "POST",
                    data: model
                });
            },
            readEviction: function(name) {
                var self = this;
                return $http({
                    url: ApplicationConfig.baseUrl + self.evictionUrl.replace(':name', name) + '?' + self.formatParameter,
                    method: "GET"
                });
            }
        };


        return service;

    });

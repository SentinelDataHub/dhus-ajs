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
(function () { 'use strict'; }());
angular.module('DHuS-webclient').directive('datastoreList', function (ODataDatastoreService, DatastoreModel) {
	return {
		restrict: 'AE',
		replace: true,
		templateUrl: 'components/datastore/datastore-list/view.html',
		compile: function (tElem, tAttrs) {
			return {
				pre: function (scope, iElem, iAttrs) {
					scope.init = function () { 
						ODataDatastoreService.getDatastoreList()
							.then(function (response) {
								// console.log("All DS: ", response.data.value);
								DatastoreModel.createModel(response.data.value, response.data.value.length);
								scope.dslist = DatastoreModel.dsModel.dslist;
								scope.datastoresCount = DatastoreModel.datastoresCount;
								
							});
					};
 
					//Watch Data Stores Model List
					scope.$watch(function () {
						return DatastoreModel.dsModel.dslist;
					}, function (newvalue) {
						scope.dslist = newvalue;
					});

					//Watch Data Stores Counter
					scope.$watch(function () {
						return DatastoreModel.datastoresCount;
					}, function (newvalue) {
						scope.datastoresCount = newvalue;
					});

					scope.createDatastore = function () {
						DatastoreDetailsManager.getDatastoreDetails(null, true);
					};

					scope.init();
				},

				post: function (scope, iElem, iAttrs) {}
			};
		}
	};
});

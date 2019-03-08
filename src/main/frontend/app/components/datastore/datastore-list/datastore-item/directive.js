/* 
 * Data HUb Service (DHuS) - For Space data distribution.
 * Copyright (C) 2013,2014,2015,2016-2017-2018-2019 European Space Agency (ESA)
 * Copyright (C) 2013,2014,2015,2016-2017-2018-2019 GAEL Systems
 * Copyright (C) 2013,2014,2015,2016-2017-2018-2019 Serco Spa
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
angular.module('DHuS-webclient').directive('datastoreItem', function (ODataDatastoreService, DatastoreModel) {
	var directive = {
		restrict: 'AE',
		replace: true,
		templateUrl: 'components/datastore/datastore-list/datastore-item/view.html',
		scope: {
			datastore: "="
		},
		compile: function (tElem, tAttrs) {
			return {
				post: function (scope, iElem, iAttrs) {
					scope.objName = "Data Store";

					//Open Feature Details
					scope.editDatastore = function () {
						DatastoreDetailsManager.getDatastoreDetails(scope.datastore.Name, false);
					};

					//DELETE Feature by clicking on a button on item itself
					scope.deleteDatastore = function () {
						ODataDatastoreService.deleteDatastore(scope.datastore.Name)
							.then(function (response) {
								if (response.status >= 200 && response.status < 300) {
									ODataDatastoreService.getDatastoreList()
										.then(function (response) {
											DatastoreModel.createModel(response.data.value, response.data.value.length);
											ToastManager.success(scope.objName + " deleted");
										});
								} else {
									ToastManager.error("error deleting " + scope.objName);
								}
							}, function (data) {
								ToastManager.error("error deleting " + scope.objName);
							});
					};

					scope.hoverIn = function () {
						scope.visibleItemButton = true;
					};

					scope.hoverOut = function () {
						scope.visibleItemButton = false;
					};
				}
			};
		}
	};
	return directive;
});

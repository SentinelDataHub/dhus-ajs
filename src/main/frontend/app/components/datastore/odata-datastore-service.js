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
angular.module('DHuS-webclient').factory('ODataDatastoreService', function ($http) {
	var service = {
		model: null,
		datastoreUrl: "odata/v2/DataStores(':name')",
		getAllDatastoresUrl: "odata/v2/DataStores",
		evictionsUrl: "odata/v2/Evictions",

		expandParameter: "$expand=Eviction",
		formatParameter: "$format=json",
		requestHeaders: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},

		evictions: function () {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.evictionsUrl + '?$select=Name&' + self.formatParameter,
				method: "GET",
				headers: self.requestHeaders
			});
		},

		//Returns current Eviction linked to a specific Datastore
		checkCurrentDataStore: function (ds) {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.getAllDatastoresUrl + "('" + ds + "')? " + self.expandParameter,
				method: "GET",
				headers: self.requestHeaders
			});
		},

		//Perform A 1-1 link Datastore-Eviction
		linkEvictionToDatastore: function (ev, ds) {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.getAllDatastoresUrl + "('" + ds + "')/Eviction/\$ref",
				method: "PATCH",
				data: {
					"\@odata.id": "Evictions('" + ev + "')"
				},
				headers: self.requestHeaders
			});
		},

		//GET-ALL
		getDatastoreList: function () {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.getAllDatastoresUrl + '?' + self.formatParameter,
				method: "GET",
				headers: self.requestHeaders
			});
		},

		//CREATE
		createDatastore: function (bodyRequest) {
			var self = this;
			var b = DatastoreUtils.getOdataFromDatastoreType(bodyRequest.Type);
			switch (bodyRequest.Type) {

				//OPENSTACK REQUEST
				case "Open Stack Data Store":
					return $http({
						url: ApplicationConfig.baseUrl + self.getAllDatastoresUrl,
						method: "POST",
						data: {
							"@odata.type": b,
							"Name": bodyRequest.Name,
							"ReadOnly": bodyRequest.ReadOnly,
							"Priority": bodyRequest.Priority,
							"MaximumSize": bodyRequest.MaximumSize,
							"CurrentSize": bodyRequest.CurrentSize,
							"AutoEviction": bodyRequest.AutoEviction,
							"Provider": bodyRequest.Provider,
							"Identity": bodyRequest.Identity,
							"Credential": bodyRequest.Credential,
							"Url": bodyRequest.Url,
							"Region": bodyRequest.Region,
							"Container": bodyRequest.Container
						},
						headers: self.requestHeaders
					});

				//HFS REQUEST
				case "HFS Data Store":
					return $http({
						url: ApplicationConfig.baseUrl + self.getAllDatastoresUrl,
						method: "POST",
						data: {
							"@odata.type": b,
							"Name": bodyRequest.Name,
							"ReadOnly": bodyRequest.ReadOnly,
							"Priority": bodyRequest.Priority,
							"MaximumSize": bodyRequest.MaximumSize,
							"CurrentSize": bodyRequest.CurrentSize,
							"AutoEviction": bodyRequest.AutoEviction,
							"Path": bodyRequest.Path,
							"MaxFileDepth": bodyRequest.MaxFileDepth,
							"MaxItems": bodyRequest.MaxItems
						},
						headers: self.requestHeaders
					});

				//REMOTE 
				case "DHuS Remote Data Store":
					return $http({
						url: ApplicationConfig.baseUrl + self.getAllDatastoresUrl,
						method: "POST",
						data: {
							"@odata.type": b,
							"Name": bodyRequest.Name,
							"ServiceUrl": bodyRequest.ServiceUrl,
							"Login": bodyRequest.Login,
							"Password": bodyRequest.Password,
							"Priority": bodyRequest.Priority,
							"ReadOnly": bodyRequest.ReadOnly
						},
						headers: self.requestHeaders
					});

				//GMP
				case "GMP Data Store":
					return $http({
						url: ApplicationConfig.baseUrl + self.getAllDatastoresUrl,
						method: "POST",
						data: {
							"@odata.type": b,
							"Name": bodyRequest.Name,
							"Priority": bodyRequest.Priority,
							"ReadOnly": bodyRequest.ReadOnly,
							"MaximumSize": bodyRequest.MaximumSize,
							"CurrentSize": bodyRequest.CurrentSize,
							"AutoEviction": bodyRequest.AutoEviction,
							"RepoLocation": bodyRequest.RepoLocation,
							"HFSLocation": bodyRequest.HFSLocation,
							"MaxQueuedRequest": bodyRequest.MaxQueuedRequest,
							"Quotas":
							{
								"MaxQueryPerUser": bodyRequest.Quotas.MaxQueryPerUser,
								"Timespan": bodyRequest.Quotas.Timespan
							},
							"IsMaster": true,
							"MySQLConnectionInfo":
							{
								"DatabaseUrl": bodyRequest.MySQLConnectionInfo.DatabaseUrl,
								"User": bodyRequest.MySQLConnectionInfo.User,
								"Password": bodyRequest.MySQLConnectionInfo.Password
							},
							"Configuration":
							{
								"AgentId": bodyRequest.Configuration.AgentId,
								"TargetId": bodyRequest.Configuration.TargetId
							}
						},
						headers: self.requestHeaders
					});

				default:
					console.warn("can't identify Type!!! for:", bodyRequest);
					break;
			}
		},

		//GET-ONE
		readDatastore: function (name) {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.datastoreUrl.replace(':name', name) + '?' + self.formatParameter,
				method: "GET"
			});
		},

		//UPDATE
		updateDatastore: function (name, model) {
			var self = this;
			model["@odata.type"] = DatastoreUtils.getOdataFromDatastoreType(model.Type);

			//Reset unecessary fields. TODO: pass the right model
			model.Type = undefined;
			model.Eviction = undefined;
			model.CurrentEviction = undefined;
			model.evictions = undefined;
			return $http({
				url: ApplicationConfig.baseUrl + self.datastoreUrl.replace(':name', name),
				method: "PATCH",
				data: model,
				headers: self.requestHeaders
			});
		},

		//DELETE            
		deleteDatastore: function (name) {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.datastoreUrl.replace(':name', name),
				method: "DELETE",
				headers: self.requestHeaders
			});
		}
	};
	return service;
});
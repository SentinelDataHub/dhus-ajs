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
angular.module('DHuS-webclient').factory('AdminUploadService', function ($http, Logger) {
	return {
		filescannerRequestUrl: "odata/v2/Scanners?$expand=Collections",
		filescannerCreateRequestUrl: "odata/v2/Scanners",
		scannerUrl: "odata/v2/Scanners(:fsid)",
		linkCollectionUrl: "odata/v2/Scanners(:fsid)/Collections/$ref",
		filescannerUpdateDeleteRequestUrl: "odata/v2/Scanners(:fsid)",
		filescannerStarStoptUrl: "odata/v2/Scanners(:fsid)",
		fsCollectionUpdate: "odata/v1/Scanners(:fsid)/$links/Collections",

		// fsCollectionDelete: "odata/v1/Scanners(:fsid)/$links/Collections(':collName')", //V2
		fsCollectionDelete2: "odata/v2/Scanners(:fsid)/Collections(':coll')/$ref",
		collectionsUrl: "odata/v2/Collections",

		defaultHeaders: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},

		//GET-ALL
		getFileScanners: function () {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.filescannerRequestUrl,
				contentType: 'application/json',
				method: "GET",
				headers: self.defaultHeaders
			});
		},

		//GET-ONE
		getOneFileScanner: function (fsid) {
			var self = this;
			return $http({
				url: (ApplicationConfig.baseUrl + self.scannerUrl).replace(":fsid", fsid),
				contentType: 'application/json',
				method: "GET",
				headers: self.defaultHeaders
			});
		},

		//CREATE
		createFileScanner: function (fs) {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.filescannerCreateRequestUrl,
				method: "POST",
				data: fs,
				headers: self.defaultHeaders
			}).then(function (response) {
				return response;
			}, function (response) {
				return response;
			});
		},

		//UPDATE
		updateFileScanner: function (fs) {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.filescannerUpdateDeleteRequestUrl.replace(":fsid", fs.Id),
				method: "PUT",
				contentType: 'application/json',
				data: JSON.stringify(fs),
				headers: self.defaultHeaders
			}).then(function (response) {
				return response;

			}, function (response) {
				return response;
			});
		},

		//DELETE
		removeFileScanner: function (fsid) {
			var self = this;
			return $http({
				url: (ApplicationConfig.baseUrl + self.filescannerUpdateDeleteRequestUrl).replace(":fsid", fsid),
				method: "DELETE"
			}).then(function (result) {
				return result;
			}, function (result) {
				return result;
			});
		},

		//Start Scanner
		startFileScanner: function (fsid) {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.filescannerStarStoptUrl.replace(":fsid", fsid) + "/OData.DHuS.StartScanner",
				method: "POST",
				contentType: 'application/json',
				data: JSON.stringify({}),
				headers: self.defaultHeaders
			}).then(function (response) {
				console.log("startFileScanner response", response);
				return response;

			}, function (response) {
				console.log("startFileScanner response: ", response);
				return response;
			});
		},

		//Stop Scanner
		stopFileScanner: function (fsid, status) {
			console.log("stopFileScanner", fsid);
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.filescannerStarStoptUrl.replace(":fsid", fsid) + "/OData.DHuS.StopScanner",
				method: "POST",
				contentType: 'application/json',
				data: JSON.stringify({}),
				headers: self.defaultHeaders
			}).then(function (response) {
				console.log("stopFileScanner response", response);
				return response;

			}, function (response) {
				console.log("stopFileScanner response: ", response);
				return response;
			});
		},

		//Get All collections
		getAllCollections: function () {
			var self = this;
			return $http({
				url: (ApplicationConfig.baseUrl + self.collectionsUrl),
				contentType: 'application/json',
				method: "GET",
				headers: self.defaultHeaders
			});
		},

		//Add Collection to Scanner
		addCollectionsToFS: function (fsid, model) {
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.linkCollectionUrl.replace(":fsid", fsid),
				method: "POST",
				contentType: 'application/json',
				data: JSON.stringify(model),
				headers: self.defaultHeaders
			}).then(function (response) {
				return response;
			}, function (response) {
				return response;
			});
		},

		//Remove Collection from Scanner
		removeCollectionsToFS: function (fsid, collName) {
			var self = this;
			return $http({
				url: (ApplicationConfig.baseUrl + self.fsCollectionDelete2).replace(":fsid", fsid).replace(":coll", collName),
				method: "DELETE",
				contentType: 'application/json',
				headers: self.defaultHeaders
			}).then(function (result) {
				return result;

			}, function (result) {
				return result;
			});
		},

		uploadProduct: function (file, collections) {
			var fd = new FormData();
			fd.append('product', file);
			fd.append('collections', collections);
			return $http({
				url: ApplicationConfig.baseUrl + '/api/upload',
				method: "POST",
				data: fd,
				transformRequest: angular.identity,
				headers: { 'Content-Type': undefined }
			}).then(function (response) {
				//console.log("uploadProduct response",response);
				return response;

			}, function (response) {
				//console.log("uploadProduct response: ", response);
				return response;
			});
		},

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//OLD
		getFileScannersCount: function () {
			console.log("getting file scanner count");
			var self = this;
			return $http({
				url: ApplicationConfig.baseUrl + self.filescannerCountRequestUrl,
				method: "GET"
			});
		}
	};
});

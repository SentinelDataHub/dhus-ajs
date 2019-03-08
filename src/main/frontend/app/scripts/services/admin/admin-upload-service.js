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

'use strict';
angular
  .module('DHuS-webclient')
.factory('AdminUploadService', function($http, Logger){
    return {
	  filescannerRequestUrl: "odata/v1/Scanners?$expand=Collections",
    filescannerCreateRequestUrl: "odata/v1/Scanners",
    filescannerCountRequestUrl: "odata/v1/Scanners/$count",
    filescannerUpdateDeleteRequestUrl: "odata/v1/Scanners(:fsidL)",
    filescannerActivateDeactivateUrl: "odata/v1/Scanners(:fsidL)",
    filescannerStartUrl: "odata/v1/StartScanner?id=:fsid",
    filescannerStopUrl: "odata/v1/StopScanner?id=:fsid",    
    fsCollectionUpdate: "odata/v1/Scanners(:fsidL)/$links/Collections",
    fsCollectionDelete: "odata/v1/Scanners(:fsidL)/$links/Collections(':collName')",


  	getFileScanners: function(){
       var self = this;
       return $http({
        url: ApplicationConfig.baseUrl + self.filescannerRequestUrl,
        contentType: 'application/json',
        method: "GET",
        headers: {'Content-Type': 'application/json',
                  'Accept':'application/json'}
        });
    },

    getFileScannersCount: function(){
       var self = this;
       return $http({
        url: ApplicationConfig.baseUrl + self.filescannerCountRequestUrl,
        method: "GET"
        });
    },
  	removeFileScanner: function(fsid){
          var self = this;
          return $http({
              url: (ApplicationConfig.baseUrl + self.filescannerUpdateDeleteRequestUrl).replace(":fsid",fsid),
              method: "DELETE"
          }).then(function(result) {
            //console.log('get response');
            //console.log("removeFileScanner response",result);
            return result;

          }, function(result){
              //console.log("removeFileScanner response: ", result);
              return result;
          });
  	},
    createFileScanner: function(fs) {
      var self = this;
      return $http({
        url: ApplicationConfig.baseUrl + self.filescannerCreateRequestUrl,
        method: "POST",
        contentType: 'application/json',
        data: JSON.stringify(fs),
        headers: {'Content-Type': 'application/json',
                  'Accept':'application/json'}
      }).then(function(response) {
      //console.log("createFileScanner response",response);
      return response;

      }, function(response){
        //console.log("createFileScanner response: ", response);
        return response;
      });

    },
    updateFileScanner: function(fs) {
      var self = this;
      //console.log('filescanner to update', fs);
      return $http({
        url: ApplicationConfig.baseUrl + self.filescannerUpdateDeleteRequestUrl.replace(":fsid",fs.Id),
        method: "PUT",
        contentType: 'application/json',
        data: JSON.stringify(fs),
        headers: {'Content-Type': 'application/json',
                  'Accept':'application/json'}
      }).then(function(response) {
        //  console.log("updateFileScanner response",response);
          return response;

      }, function(response){
          //  console.log("updateFileScanner response: ", response);
            return response;
      });

    },
    activateDeactivateFileScanner: function(fsid, status) {
      var self = this;
      var fs = {Active: status};
      return $http({
        url: ApplicationConfig.baseUrl + self.filescannerActivateDeactivateUrl.replace(":fsid",fsid),
        method: "PUT",
        contentType: 'application/json',
        data: JSON.stringify(fs),
        headers: {'Content-Type': 'application/json',
                  'Accept':'application/json'}
      }).then(function(response) {
          //console.log("activateDeactivateFileScanner response",response);
          return response;

      }, function(response){
            //console.log("activateDeactivateFileScanner response: ", response);
            return response;
      });

    },
    startFileScanner: function(fsid) {
      var self = this;
      return $http({
        url: ApplicationConfig.baseUrl + self.filescannerStartUrl.replace(":fsid",fsid),
        method: "POST",
        contentType: 'application/json',
        data: JSON.stringify({}),
        headers: {'Content-Type': 'application/json',
                  'Accept':'application/json'}
      }).then(function(response) {
          //console.log("startFileScanner response",response);
          return response;

      }, function(response){
            //console.log("startFileScanner response: ", response);
            return response;
      });

    },
    stopFileScanner: function(fsid, status) {
      var self = this;
      return $http({
        url: ApplicationConfig.baseUrl + self.filescannerStopUrl.replace(":fsid",fsid),
        method: "POST",
        contentType: 'application/json',
        data: JSON.stringify({}),
        headers: {'Content-Type': 'application/json',
                  'Accept':'application/json'}
      }).then(function(response) {
          //console.log("stopFileScanner response",response);
          return response;

      }, function(response){
          //  console.log("stopFileScanner response: ", response);
            return response;
      });

    },
    uploadProduct: function(file, collections){
        var fd = new FormData();
        fd.append('product', file);
        fd.append('collections', collections);
        return $http({
          url: ApplicationConfig.baseUrl + '/api/upload',
          method: "POST",
          data: fd,
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
        }).then(function(response) {
            //console.log("uploadProduct response",response);
            return response;

        }, function(response){
              //console.log("uploadProduct response: ", response);
              return response;
        });
    },
    addCollectionsToFS: function(fsid,model) {
      var self = this;
      return $http({
        url: ApplicationConfig.baseUrl + self.fsCollectionUpdate.replace(":fsid",fsid),
        method: "POST",
        contentType: 'application/json',
        data: JSON.stringify(model),
        headers: {'Content-Type': 'application/json',
                  'Accept':'application/json'}
      }).then(function(response) {
      //console.log("createFileScanner response",response);
      return response;

      }, function(response){
        //console.log("createFileScanner response: ", response);
        return response;
      });

    },
    removeCollectionsToFS: function(fsid,collName) {
      var self = this;
        return $http({
            url: (ApplicationConfig.baseUrl + self.fsCollectionDelete).replace(":fsid",fsid).replace(":collName",collName),
            method: "DELETE"
        }).then(function(result) {
          //console.log('get response');
          //console.log("removeFileScanner response",result);
          return result;

        }, function(result){
            //console.log("removeFileScanner response: ", result);
            return result;
        });
    }
  };
});

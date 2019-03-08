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

angular.module('DHuS-webclient').factory('UserService', function($http, $q){

    return{
        model: null,
        signUpUrl:'api/stub/signup',
        userRequestUrl: "api/stub/users/0",
        signup: function(userModel){
            var self = this;
            return $http({
                url: ApplicationConfig.baseUrl + self.signUpUrl,
                method: "POST",
                contentType: 'application/json',
                data: JSON.stringify(userModel)
            });
        },

        //Get User. Reload page if response.status is 401
        getUser: function(){
            var self = this;
            return $http({
                url: ApplicationConfig.baseUrl + self.userRequestUrl,
                method: "GET"})

                .then(function(result) {
                    self.model = result.data;
                    return result.data;
                },

                function(response){
                    switch (response.status){
                        case 401:
                            location.reload(); //Page reload
                            return {};
                            break;

                        default:
                            AlertManager.error("ERROR");
                    }
                });
        },

        //Get Collection Products List
        getCollectionProductsList: function(query, offset, limit){
            var self = this;
            return $http({
                url: ApplicationConfig.baseUrl + self.createSearchRequest(query, offset, limit),
                method: "GET"})

                .then(function(result){
                    self.collectionProductsModel.list=result.data.products;
                    self.collectionProductsModel.count=result.data.totalresults;
                },

                function(response){
                    switch (response.status){
                        case 401:
                            var defer = $q.defer();
                            defer.resolve(false);
                            break;

                        case 400:
                            var error_title = (self.error_title) ? self.error_title : "Invalid request";
                            var error_message = (self.error_message) ? self.error_message : "Your request cannot be processed by the server. Please check the request's parameters.";
                            AlertManager.error(error_title, error_message);
                            break;

                        default:
                            AlertManager.error("Error retrieving products", "Your request cannot be processed by the server. Please check the request's parameters.");
                    }
                });
        },

        //Get Odata User
        getODataUser: function(username){
            var self = this;
            if(self.model){
                var deferred = $q.defer();
                deferred.resolve(self.model);
                return deferred.promise;
            }else{
                return $http({url: ApplicationConfig.baseUrl + "odata/v1/Users('" +  username + "')?$format=json&$expand=SystemRoles", method: "GET"})

                .then(function(response) {
                    if (response.status == 200) {
                        return response.data
                    } else return {};
                });
            }
        },

    getODataUserRoles: function(username){
      var self = this;
      if(self.model && self.model.roles){
        var deferred = $q.defer();
        deferred.resolve(self.model.roles);
        return deferred.promise;            
      }else{
        return $http({url: ApplicationConfig.baseUrl + "odata/v1/Users('" +  username + "')/SystemRoles?$format=json", method: "GET"})
          .then(function(response) {          
            if (response.status == 200) {              
              return response.data
            }
            else return {};
          });
      }
    },
    /* to be removed after having replaced all stubs related to users with OData BEGIN*/
    setUserModel:function(response){
      var self=this;
      //populate html fields
      if(response && response.d) {
        self.model={};
        self.model.username=response.d.Username;
        self.model.password=response.d.Password;
        self.model.firstname=response.d.FirstName;
        self.model.lastname=response.d.LastName;                
        self.model.email=response.d.Email;
        self.model.domain=response.d.Domain;
        self.model.subDomain=response.d.SubDomain;
        self.model.usage=response.d.Usage;
        self.model.subUsage=response.d.SubUsage;
        self.model.country=response.d.Country;       
      }

    },
    setUserRolesModel:function(response){
      var self=this;
      if(response && response.d && response.d.SystemRoles && response.d.SystemRoles.results) {
        if(self.model) {  
          var roles=[];        
          for(var i=0; i < response.d.SystemRoles.results.length; i++) {
            roles.push(response.d.SystemRoles.results[i].Name);
          }
          self.model.roles=roles;
        }
      }

    },

    getUserModel:function() {
      return this.model;
    },
    /* to be removed after having replaced all stubs related to users with OData END*/
    refreshModel: function(){
      var self=this;
      this.getUser().then(function(user){self.model = user;});
    },
    updateUser: function(user, passwordModel, delegate){
      var self = this;
      self.model = user;
      return $http({
        url: ApplicationConfig.baseUrl + self.userRequestUrl,
        method: "PUT", 
        contentType: 'application/json',         
        data: {
        	user: user,
        	pm: passwordModel
         }
        ,       
        headers: {'Content-Type': 'application/json',
    			  'Accept':'application/json'}        
      });
    },
    retrievePassword: function(user, delegate) {
      var self = this;      
      return $http({
        url: ApplicationConfig.baseUrl + "api/stub/forgotpwd",
        method: "POST", 
        contentType: 'application/json',         
        data: JSON.stringify(user),       
        headers: {'Content-Type': 'application/json',
            'Accept':'application/json'}        
      }).then(function(response) {
          return response.data;
        });
    },
    checkUserCodeForPasswordReset: function(code) {
      var self = this;      
      return $http({
        url: ApplicationConfig.baseUrl + "api/stub/usercode?code="+code,
        method: "GET"               
      });
    },
    resetPassword: function(code, password) {
      var self = this;   
      var encoded = encodeURIComponent(password).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");   
      return $http({
        url: ApplicationConfig.baseUrl + "api/stub/resetpwd?code="
            +code+"&password="+encoded,
        method: "POST" 
      });
    },    
  };
});




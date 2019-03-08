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
.factory('AuthenticationService', function($q, $injector, SearchModel, UserService, AdvancedFilterService,AdvancedSearchService){


  var UserService =  $injector.get('UserService');  
  return {
    logged: false,
    basicAuth: '',
    loginUrl: '/login',
    logoutUrl: '/logout',

    odataAuthTest: function(){
      var self = this;
      http({
        url: ApplicationConfig.baseUrl +"odata/v1/",
        headers: { 'Authorization' : "Basic " + self.basicAuth }
      });
    },

    login: function(username, password, delegate){
      var self = this;
      return http({
        url: ApplicationConfig.baseUrl + self.loginUrl,
        method: "POST",
        contentType: 'application/x-www-form-urlencoded',
        data: $.param({ "login_username" : username, "login_password" : password}),
        headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization' : "Basic " + window.btoa(username+':'+password) }
      });
    },

    showLogin: function(){
        //console.log("authentication-service", "show login function called");
    },

    setLoginMethod: function(method){
      this.showLogin = method;
    },

    clearSearchFilters: function(){

      var SearchService = $injector.get('SearchService');
      SearchService.clearSearchInput();
      SearchService.clearGeoSelection();
      AdvancedFilterService.clearAdvancedFilter();
      AdvancedSearchService.clearAdvFilter();
    },

    logout: function(){
      var Session = $injector.get('Session');
      
      var self = this;
       self.basicAuth = '';
       self.logged = false;
       Session.removeSession();
       SearchModel.createModel([]);
       self.clearSearchFilters();       
       $(document).trigger("closeSession");
       return http({
        url: ApplicationConfig.baseUrl + self.logoutUrl,
        method: "POST"
       }) ;
    },

    /*
    * Function to handle user which seems logged but can't use DhUS functions
    */
    refresh: function(){
       window.location.reload(true);
    }
  };
});

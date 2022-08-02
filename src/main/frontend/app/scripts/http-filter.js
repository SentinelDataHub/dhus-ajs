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

/*
 *  AuthorizationInterceptor
 *
*/

angular
  .module('DHuS-webclient')
  .factory('AuthorizationInterceptor', function($q, $injector, $location, Logger,UserInfoService) {

  var exceptions = [
    {url: /components\/.*\/view.html/g, method: "GET"},
    {url: /template\/.*\/.*.html/g, method: "GET"},
    {url: /sections\/.*\/view.html/g,method: "GET"},
    {url:/application_layout.html/g,method: "GET"},
    {url:/config\/appconfig.json/g,method: "GET"},
    {url:/config\/styles.json/g,method: "GET"},
    {url:/.*\/\/login/g,method: "POST"},
    {url:/.*\/\/logout/g,method: "POST"},
    {url: /ngToast\/toast.html/g,method: "GET"},
    {url: /ngToast\/toastMessage.html/g,method: "GET"},
    {url:/.*api\/ui\/signup/g,method: "POST"},
	{url:/.*api\/ui\/version/g,method: "GET"},
    {url:/.*api\/ui\/configuration/g,method: "GET"},
    {url:/.*api\/ui\/countries/g,method: "GET"},
    {url:/.*api\/ui\/forgotpwd/g,method: "POST"},
    {url:/.*api\/ui\/resetpwd/g,method: "POST"}
  ];

  return {
    request: function(config) {
      if(config.bypassCheck){
        return config;
      }

      /*
      * Inject AuthenticationService, SessionService, SearchModel
      */
      var AuthenticationService = $injector.get('AuthenticationService');
      var Session = $injector.get('Session');
      var SearchModel = $injector.get('SearchModel');
      SpinnerManager.on();

      // Exceptions Mapper Handler:
      for(var i = 0; i < exceptions.length; i++){
        var match = config.url.match(exceptions[i].url);
        if(match && config.method==exceptions[i].method){
          return config;
        }
      }

      //Log config
      //console.log("http-filter", config);
	  
      if(AuthenticationService.logged && Session.isSessionPresent()){
        return config;
      }

      /*Unuseful here, since the request failure can be detected on server side*/
      // else{

      //   return Session.checkSession().then(function(isLogged){

      //      if(!isLogged){
      //        AuthenticationService.showLogin();
      //        Session.setUserLoggedOut();
      //        SpinnerManager.off();
      //        SearchModel.createModel({});
      //        $(document).trigger("closeSession");
      //        return $q.reject(config);
      //      }else{
      //        return config;
      //      }
      //    });

      // }

      return config;
    },

    requestError: function(rejection) {
      Logger.warn("http","http request error:" + JSON.stringify(rejection));
      SpinnerManager.off();
    },

    response: function(response) {
	  var AuthenticationService = $injector.get('AuthenticationService');
      var Session = $injector.get('Session');
      var SearchModel = $injector.get('SearchModel');	
      Logger.log("http","http response:" + JSON.stringify(response));
      SpinnerManager.off();
      if(ApplicationService.settings.gdpr && ApplicationService.settings.gdpr.enabled  
			&& response.status == 200 && response.data && (JSON.stringify(response.data)).indexOf("SAMLRequest") >= 0) {
	    AuthenticationService.showLogin();
		Session.setUserLoggedOut();
		SearchModel.createModel({});
		if(Session.isSessionPresent()) {
			Session.removeSession();
		}
        $(document).trigger("closeSession");
		window.location.reload();
        return $q.reject(response);
	  } else {
        return response; 
	  }
    },

    responseError: function(rejection) {
      var AuthenticationService = $injector.get('AuthenticationService');
      var Session = $injector.get('Session');
      var SearchModel = $injector.get('SearchModel');
      Logger.warn("http","http response error:" + JSON.stringify(rejection));
      SpinnerManager.off();
      if(rejection.status == 401) {
        AuthenticationService.showLogin();
        Session.setUserLoggedOut();
        SearchModel.createModel({});
        $(document).trigger("closeSession");
		return $q.reject(rejection);
      }
      return $q.reject(rejection);

    }

  };
});


angular
  .module('DHuS-webclient').config(function ($httpProvider) {
    
    $httpProvider.interceptors.push('AuthorizationInterceptor');
});

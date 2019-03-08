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
.factory('Session', function($q, $http, UserService, AuthenticationService, UserInfoService, $rootScope){
  /*

    SESSION model
    {
      "expiration_date":"YYYY-MM-DDTHH:mm:ss",
      "username":"pippo"
    }

  */
  var defaultSessionModel = {
    "expiration_date":"",
    "username":""
  };

  var SESSION_DURATION_MINUTES = 300;
  var SESSION_LOCAL_STORAGE_KEY = "ajs-session";
  var isLocalStoragePresent = function(){
    var test = 'test';
    try {
      localStorage.setItem(test, test); localStorage.removeItem(test);
      return true;
    } catch(e) {
      return false;
    }
  };

  var availableLocalStorage = isLocalStoragePresent();

  var session = {

    getSessionDurationMinutes: function(){
        return session_duration_minutes;
    },

    getSessionUsername: function(){
        if(availableLocalStorage)
            var sessionModel = localStorage.getItem(SESSION_LOCAL_STORAGE_KEY);
        if(sessionModel && JSON.parse(sessionModel).username){
            return JSON.parse(sessionModel).username;
        }
        return null;
    },

    setSessionUsername: function(username){
        if(availableLocalStorage){
            var sessionModel = localStorage.getItem(SESSION_LOCAL_STORAGE_KEY);

            if(sessionModel == null || sessionModel == undefined)
                sessionModel = _.clone(defaultSessionModel);
            else
                sessionModel = JSON.parse(sessionModel);
            sessionModel.username = username;
            localStorage.setItem(SESSION_LOCAL_STORAGE_KEY, JSON.stringify(sessionModel));
        }
    },

    loadUserModel: function(){
        var username = this.getSessionUsername();
            UserService.getODataUser(username).then(function(res){
                UserService.setUserModel(res);
                UserService.setUserRolesModel(res);
        });
    },

    updateSession: function(){
      if(availableLocalStorage){
        var now = moment();
        var newExpirationDate =  now.add(SESSION_DURATION_MINUTES, 'minutes');
        var sessionModel = localStorage.getItem(SESSION_LOCAL_STORAGE_KEY);
        if(sessionModel == null || sessionModel == undefined)
          sessionModel = _.clone(defaultSessionModel);
        else
          sessionModel = JSON.parse(sessionModel);
        sessionModel.expiration_date = newExpirationDate.format("YYYY-MM-DDTHH:mm:ss");
        localStorage.setItem(SESSION_LOCAL_STORAGE_KEY, JSON.stringify(sessionModel));
      }
    },

    isSessionExpired: function(){
        if(availableLocalStorage){
            var sessionModel = localStorage.getItem(SESSION_LOCAL_STORAGE_KEY);
            if(sessionModel == null || sessionModel == undefined)
                sessionModel = _.clone(defaultSessionModel);
            else
                sessionModel = JSON.parse(sessionModel);
            var expirationDate = moment(sessionModel.expiration_date);
            var now = moment();
        return now.isAfter(expirationDate);
        }
        return true;
    },

    isSessionPresent: function(){
        if(!availableLocalStorage) {
            return false;
        }
        var result =  localStorage.getItem(SESSION_LOCAL_STORAGE_KEY) != null;
        return result;
    },

    removeSession: function(){
        UserService.model = null;
        if(availableLocalStorage){
        localStorage.removeItem(SESSION_LOCAL_STORAGE_KEY);
      }
    },

    serverLogout: function(){
      AuthenticationService.logout();
    },

    isUserLoggedOnServer: function(){
        var username = this.getSessionUsername();
        //console.log("session-service. username:", username);
        return $http({url: ApplicationConfig.baseUrl + "odata/v1", method: "HEAD",bypassCheck:true})
        .then(function(response) {
          if (response.status == 200)
            return true;
          else
            return false;
        });
    },

    setUserLoggedIn: function(){
      AuthenticationService.logged = true;
    },

    setUserLoggedOut: function(){
        setTimeout(function(){
        AuthenticationService.logged = false;
        window.location.replace("#/home");
      })
    },

    /*
    *   Function to Handle Session?
    */
    checkSession: function(){
//        console.log(
//            "session-service checksession",
//            "Session:", session,
//            "defaultSession", defaultSessionModel,
//            "availableLocalStorage", availableLocalStorage);

        var self = this;
        if(!this.isSessionPresent()){
            var defer = $q.defer();
            defer.resolve(false);
            self.removeSession();
            return defer.promise;
        }

        if(this.isSessionExpired()){
            this.serverLogout();
            this.removeSession();
            var defer = $q.defer();
            defer.resolve(false);
            return defer.promise;
        }
        this.updateSession();
        return this.isUserLoggedOnServer()
        .then(function(isLogged){
            if(isLogged){
                self.setUserLoggedIn();
                self.loadUserModel();
                UserInfoService.userInfo.isLogged = true;
                return true;
            } else {
                AuthenticationService.logged = false;
                self.removeSession();
                return false;
            }
        });
    }
  };

  return session;

});

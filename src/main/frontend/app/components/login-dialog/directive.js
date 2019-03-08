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

 /*
 *  OLD LOGIN DIALOG
 *
 */


angular.module('DHuS-webclient')

.directive('loginDialog', function($location, AuthenticationService, UserInfoService, ConfigurationService, UserService, Session) {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/login-dialog/view.html',
    scope: {
      text: "="
    },
    compile: function(tElem, tAttrs){
        return {
          pre: function(scope, iElem, iAttrs){
            scope.showsignup = ApplicationService.settings.signup;
            scope.forgotpassword = ApplicationService.settings.forgotpassword;
            if(!ConfigurationService.isLoaded()) {
              ConfigurationService.getConfiguration().then(function(data) {
                  // promise fulfilled
                  if (data) {
                      ApplicationService=data;
                      scope.showsignup = ApplicationService.settings.signup;
                      scope.forgotpassword = ApplicationService.settings.forgotpassword;
                  } else {

                  }
              }, function(error) {
                  // promise rejected, could log the error with: console.log('error', error);
              });
            }
            else
              scope.showsignup = ApplicationService.settings.signup;
              scope.forgotpassword = ApplicationService.settings.forgotpassword;
          },
          post: function(scope, iElem, iAttrs){

            AuthenticationService.setLoginMethod(
              function(){
                //Clear wronglogin div
                $('#wronglogin').html('');
                $('#wronglogin').html('');
                $('#loginModal').modal('show'); //show the loginModal div
              }
            );

            scope.user = {};
            scope.userInfo = UserInfoService.userInfo;
            scope.showsignup = false;
            scope.forgotpassword =  false;

            function init(){
            $('#loginModal').on('shown.bs.modal', function (e) {

                    //$(this).find('input').val('').end(); //clear fields
                    $('#wronglogin').html('');
                    $('#loginUsername').focus();
                });
            };

            scope.login = function() {
              console.log("login-dialog scope.login");
              var self = this;

              if(scope.user.username != null){ //Username field not null
                scope.user.username = scope.user.username.toLowerCase();
                  AuthenticationService.login(scope.user.username, scope.user.password,self).success(function(response){
                  UserService.getODataUser(scope.user.username).then(function(res){

                      window.user = scope.user.username;
                      AuthenticationService.logged = true;
                      AuthenticationService.basicAuth = window.btoa(scope.user.username+':'+scope.user.password);
                      Session.setSessionUsername(scope.user.username);
                      Session.updateSession();
                      UserService.setUserModel(res);
                      UserService.setUserRolesModel(res);
                      scope.manageLoginResult();
                      ToastManager.success("Login successful");
                      //go home
                  },
                  function(data) {
                    AuthenticationService.logout()
                      .success(function(){
                        ToastManager.error("Login failed");
                        $('#wronglogin').html('Login failed.\n Please try again.');
                      })
                      .error(function(){
                        ToastManager.error("Login failed");
                        $('#wronglogin').html('Login failed.\n Please try again.');
                      })
                  });
                })
                .error(function(response){
                  ToastManager.error("Login failed");
                  $('#wronglogin').html('!The username and password you entered don\'t match.');

                });
              } else{ //Username field is empty
                ToastManager.error("!Login failed");
                $('#wronglogin').html('!The username and password you entered don\'t match.');
              }


            };

            scope.close = function() {
              $('#loginModal').modal('hide');
            };

            scope.signup = function() {
              $('#loginModal').modal('hide');
              location.href = '#/self-registration';

            };

            scope.manageLoginResult = function() {

              $('#loginModal').modal('hide');
              scope.userInfo.isLogged = true;
              window.location.replace("#/home");
            };

            init();
          }

        }
      }
  };
});

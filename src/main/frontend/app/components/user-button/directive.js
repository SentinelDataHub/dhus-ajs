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
angular.module('DHuS-webclient')

.directive('userButton', function($location, SearchService, UserService, UserInfoService, Session, CartStatusService) {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/user-button/view.html',
    scope: {
      text: "="
    },
    compile: function(tElem, tAttrs){
        return {
          pre: function(scope, iElem, iAttrs){
          },
          post: function(scope, iElem, iAttrs){
            scope.openBadge = function(){
                              //check if Session is present
                Session.checkSession().then(function(response){                  
                  if(response) {
                    UserInfoService.userInfo.isLogged = true;                    
                    UserDetailsManager.getUserDetails();
                  } else {
                    UserInfoService.userInfo.isLogged = false;
                    UserDetailsManager.getUserDetails();
                  }
                },function(response){
                  UserInfoService.userInfo.isLogged = false;
                  UserDetailsManager.getUserDetails();
                });
                
            };            
          }
        }
      }
  };
});

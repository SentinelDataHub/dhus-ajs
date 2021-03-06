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

/**
 * @ngdoc overview
 * @name DHuS-webclient
 * @description
 * # DHuS-webclient
 *
 * Main module of the application.
 */

var DHuSModule = angular
    .module('DHuS-webclient', [
        'ngAnimate',
        'ngAria',
        'ngCookies',
        'ngMessages',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'ngToast',
        'ui.bootstrap'
    ]);

/*
*   <DhUS Module> routing Configuration
*/
DHuSModule.config(function($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'sections/main/view.html',
            controller: 'MainCtrl'
        })
        .when('/home/:r', {
            templateUrl: 'sections/reset-password/view.html',
            controller: 'ResetPasswordCtrl',
            resolve: {
                usercode: function($route) {
                    return $route.current.params.r.replace('r=', '');
                }
            }
        })
        .when('/user-profile', {
            templateUrl: 'sections/user-profile/view.html',
            controller: 'UserProfileCtrl'
        })
        .when('/self-registration', {
            templateUrl: 'sections/self-registration/view.html',
            controller: 'SelfRegistrationCtrl'
        })
        .when('/forgot-password', {
            templateUrl: 'sections/forgot-password/view.html',
            controller: 'ForgotPasswordCtrl'
        })
        .when('/example', {
            templateUrl: 'sections/example/view.html',
            controller: 'ExampleCtrl'
        })
        .when('/user-cart', {
            templateUrl: 'sections/user-cart/view.html',
            controller: 'UserCartCtrl'
        })
        .when('/user-searches', {
            templateUrl: 'sections/user-searches/view.html',
            controller: 'UserSearchesCtrl'
        })
        .when('/terms-conditions', {
            templateUrl: 'sections/terms-conditions/view.html',
            controller: 'TermsConditionsCtrl'
        })
        .when('/management', {
            templateUrl: 'sections/management/view.html',
            controller: 'ManagementCtrl'
        })
        .when('/odata-synchronizer', {
            templateUrl: 'sections/admin-odata-synchronizer/view.html',
            controller: 'OdataSynchronizerCtrl'
        })
        .when('/upload-product', {
            templateUrl: 'sections/upload-product/view.html',
            controller: 'UploadCtrl'
        })
        //TODO delete?
        // .when('/user-products', {
        //     templateUrl: 'sections/user-products/view.html',
        //     controller: 'UserProductsCtrl'
        // })
        // .when('/reset-password/:r', {
        //    templateUrl: 'sections/reset-password/view.html',
        //    controller: 'ResetPasswordCtrl',
        //    resolve : {
        //        usercode:  function(){
        //            return $routeParams.r.replace('r=','');
        //        }
        //    }
        //  })

    .otherwise({
        redirectTo: '/home'
    });
})

  /** APPLICATION INITIALIZATION **/
  /*
  * Dependency              Path
  *
  * LayoutManager           src/main/frontend/app/scripts/layout_manager.js
  * StyleService            src/main/frontend/app/scripts/services/style-service.js
  * ConfigurationService    src/main/frontend/app/scripts/services/configuration-service.js
  * $rootScope
  * $location
  * $http
  * Session                 src/main/frontend/app/scripts/services/session-service.js
  *
  * ApplicationService      src/main/frontend/app/scripts/services/application-service.js
  */
  .run(function(LayoutManager, StyleService, ConfigurationService, $rootScope, $location, $http, Session){
    window.http= $http;

    // Identify requests coming from GUI application
    $http.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';

    //Initialize LayoutManager and StyleService
    LayoutManager.init();
    StyleService.init();

    var self = this;
      if (!ConfigurationService.isLoaded()) {
        ConfigurationService.getConfiguration().then(function(data) {
            if (data) { // promise fulfilled
                ApplicationService = data;
            }
            $rootScope.debugMode = ApplicationService.debugMode;
        }, function(error) {
           //console.log('app.js - Error in ConfigurationService');
        });
      } else {
        $rootScope.debugMode = ApplicationService.debugMode;
      }
    jQuery.ajaxSettings = null; //super test
    Session.checkSession();
  });

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

.directive('productQuicklook', function($location,$document, ProductDetailsModelService, ConfigurationService) {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/product-quicklook/view.html',
    scope: {
      text: "="
    },
    compile: function(tElem, tAttrs){
        return {
          pre: function(scope, iElem, iAttrs){
            if(!ConfigurationService.isLoaded) {
              ConfigurationService.getConfiguration().then(function(data) {
                      // promise fulfilled
                  if (data) {
                      ApplicationService=data;
                  } else {

                  }
              }, function(error) {
                  // promise rejected, could log the error with: console.log('error', error);
                  
              });
            }
          },
          post: function(scope, iElem, iAttrs){

            scope.noquicklook = "images/bigplaceholder.png";
            scope.odataReqUrl = "odata/v1/";
            scope.url = 'images/bigplaceholder.png';
            scope.hasQuicklook=iAttrs.hasQuicklook;
            scope.products = ProductDetailsModelService.products;
            iAttrs.$observe('productUuid',
              function(newValue){
                for(var i = 0 ; i < scope.products.list.length; i++){
                    if(scope.products.list[i].uuid == newValue){
                        var entry = scope.products.list[i];
                        scope.product=entry;
                    }
                }
                scope.url = ApplicationConfig.baseUrl + scope.odataReqUrl;
                scope.url += "Products('" + newValue +"')/Products('Quicklook')/$value";

                if(newValue.trim() != ''  && scope.product.quicklook)
                {
                    scope.url = ApplicationConfig.baseUrl + scope.odataReqUrl;
                    scope.url += "Products('" + newValue +"')/Products('Quicklook')/$value";
                }
                else
                {
                  scope.url = "images/bigplaceholder.png";
                }

            });
            $('#productView').on('shown.bs.modal', function (e) {
              if(scope.uuid && scope.product.quicklook)
              {
                  scope.url = ApplicationConfig.baseUrl + scope.odataReqUrl;
                  scope.url += "Products('" + scope.uuid +"')/Products('Quicklook')/$value";
              }
              //console.log(scope.product);
            });

            function init(){

            };

            init();
          }

        }
      }
  };
});

angular.module('DHuS-webclient')
.directive('fallbackSrc', function() {
  var fallbackSrc = {
    link: function postLink(scope, iElem, iAttrs) {
      iElem.bind('error', function() {
        angular.element(this).attr("src", iAttrs.fallbackSrc);
      });
    }
  }
  return fallbackSrc;
});

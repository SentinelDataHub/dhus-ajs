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
.factory('ProductCartService', function($http, CartModel, Logger, AuthenticationService){
    return {
	cartRequestUrl: "api/stub/users/0/carts/0?offset=:offset&count=:count",
	removeProductUrl: "api/stub/users/0/cart/0/removeproduct?productId=:productId",
	clearCartUrl: "api/stub/users/0/cart/0/clear",
	addProductToCartUrl: "api/stub/users/0/cart/0/addproduct?productId=:productId",
	getCartsIdsUrl: "api/stub/users/0/cart/0/getcartids", //TODO to refactor: it is not restful!
    odataReqUrl:"odata/v1/",
    removeTransformationFromCartUrl: "api/stub/users/0/transformations/:transformationId",
    offset: 0, 
    limit: 25,  
    setOffset: function(offset){
      this.offset = offset;
    },
    setLimit: function(limit){
      this.limit = limit;
    },
    gotoPage: function(pageNumber){
      this.setOffset((pageNumber * this.limit) - this.limit);
      return this.getCart();
    },
	createCartRequest: function(offset,count){
		var self = this;
        offset = (offset)?offset:'0';
        count = (count)?count:'25';
        var cartUrl = angular.copy(self.cartRequestUrl);        
        cartUrl = cartUrl.replace(":offset", offset);
        cartUrl = cartUrl.replace(":count", count);
        return cartUrl;
	},
	getCart: function(){
		Logger.log("cart","sent ajax request to get cart");
		var self = this;              
        return $http({
            url: ApplicationConfig.baseUrl + self.createCartRequest(self.offset,self.limit),
            method: "GET"}).then(function(result){  
          CartModel.model.count = result.data.totalresults;  
          CartModel.createModel(result.data.products,CartModel.model.count, result.data.totalproducts);                               
        }, function(response){
            if(response.status == 401) {
                AuthenticationService.refresh(); //calls a service to reload page
                var defer = $q.defer();
                defer.resolve(false);
                return;
            }
            else
// Create empty model in case of error
            CartModel.createModel([],0, 0); 
        });                
    },

	removeProductFromCart: function(productId){
        var self = this;          
        return $http({
            url: (ApplicationConfig.baseUrl + self.removeProductUrl).replace(":productId",productId),
            method: "POST"
        }); 
        
	},
	clearCart: function(){
		var self = this;          
        return $http({
            url: ApplicationConfig.baseUrl + self.clearCartUrl,
            method: "POST"
        });
	},
	addProductToCart: function(productId){		
		var self = this;				
        return $http({
            url:  (ApplicationConfig.baseUrl + self.addProductToCartUrl).replace(":productId",productId),
            method: "POST"
            }); 
	},
	getIdsInCart: function(){	
	    var self = this;			
        return $http({
            url: ApplicationConfig.baseUrl + self.getCartsIdsUrl
        });        
	},
    removeTransformationFromCart: function(transformationId){
        var self = this;          
        return $http({
            url: (ApplicationConfig.baseUrl + self.removeTransformationFromCartUrl).replace(":transformationId",transformationId),
            method: "POST"
        }); 
        
    },
};
});

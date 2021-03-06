/* 
 * Data HUb Service (DHuS) - For Space data distribution.
 * Copyright (C) 2013,2014,2015,2016,2017,2018 European Space Agency (ESA)
 * Copyright (C) 2013,2014,2015,2016,2017,2018 GAEL Systems
 * Copyright (C) 2013,2014,2015,2016,2017,2018 Serco Spa
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
 /*TODO: remove*/
(function () { 'use strict'; }());
angular.module('DHuS-webclient').directive('productCart', function (CartModel) {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/cart/product-cart/view.html',
    scope: {
      text: "="
    },
    compile: function (tElem, tAttrs) {
      var self = this;
      return {
        pre: function (scope, iElem, iAttrs) {
          scope.model = CartModel.model.list;
          CartModel.sub(self);
        },
        post: function (scope, iElem, iAttrs) {
          self.createdCartModel = function () {
            scope.model = [];
            scope.model = CartModel.model.list;
          };
        }
      };
    }
  };
});

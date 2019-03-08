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
(function () { 'use strict'; }());
angular.module('DHuS-webclient').directive('cartItem', function ($document, $window, AdvancedSearchService, CartMenuService, CartModel, 
  ConfigurationService, ProductCartService, OLMap, SearchModel, SearchService, Session, UIUtils, UserInfoService, UserService, CartStatusService) {
  var SELECTED_ITEM_BACKGROUND_COLOR = '#dbdbdb';
  var HIGHLIGHT_ITEM_BACKGROUND_COLOR = '#F5F5F5';
  var DEFAULT_ITEM_BACKGROUND_COLOR = 'transparent';
  var SENDER = 'cartItem';
  var CONTENT_ID = "#cart-menu-content";
  const SUCC_REMOVED = "Product removed from cart" //Messages
  const ERR_ZOOM = "Can't zoom to Cart Product right now";
  const ERR_NO_FOOTPRINTS_LOADED = "List selection disabled, please load Cart Footprints to select Cart items";
  const ERR_REMOVE_FAILED = "Removed product failed";
  const CONFIRM_DELETE = "Want to delete?";
  var baseUrl = '';
  var directive = {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/cart/cart-item/view.html',
    scope: {
      product: "=",
      uuid: "="
    },

    compile: function (tElem, tAttrs) {
      // console.log('45 cart item, SearchModel is ', SearchModel );
      var self = this;
      return {
        
        post: function (scope, iElem, iAttrs) {
          baseUrl = ApplicationConfig.baseUrl; //BASEURL
          scope.showquicklook = ApplicationService.settings.showquicklook;
          scope.hide_popover_list = ApplicationService.settings.hide_popover_list;
          scope.satellite = scope.product.identifier.substring(0, 2);
          scope.enableLta = ApplicationService.settings.enable_lta;
          scope.mission = scope.product.identifier.substring(0, 3);
          scope.attributeTitles = ["Select Cart product", "Zoom to product", "Remove Product from Download Cart", "View Product Details", "Download Product"]; //Attribute Titles

          var resizeItem = function () { };
          angular.element($window).bind('resize', resizeItem);
          self.cartModelSubscription(scope.product, iElem, scope);
          var summary = _.findWhere(scope.product.indexes, { name: "summary" });
          if (summary) {
            var satellitename = _.findWhere(summary.children, { name: "Satellite" });
            var date = _.findWhere(summary.children, { name: "Date" });
            var size = _.findWhere(summary.children, { name: "Size" });
            scope.satellitename = satellitename ? satellitename.value : '';
            scope.date = date ? date.value : '';
            scope.size = size ? size.value : '';
            scope.summary = "";
            scope.summary += (scope.satellitename) ? "Mission: " + scope.satellitename + "; " : "";
            scope.summary += (scope.product.instrument) ? "Instrument: " + scope.product.instrument + "; " : "";
            scope.summary += (scope.date) ? "Sensing Date: " + scope.date + "; " : "";
            scope.summary += (scope.size) ? "Size: " + scope.size : "";
          }
          (scope.enableLta) ? scope.product.offline = scope.product.offline : scope.product.offline = false;
          scope.link = baseUrl + "odata/v1/Products('" + scope.product.uuid + "')/$value";
          scope.quicklooksrc = (scope.product.quicklook) ? baseUrl + "odata/v1/Products('" + scope.product.uuid + "')/Products('" + 'Thumbnail' + "')/$value" : null;
          scope.bigQuicklooksrc = (scope.product.quicklook) ? baseUrl + "odata/v1/Products('" + scope.product.uuid + "')/Products('" + 'Quicklook' + "')/$value" : null;
          const me = { uuid: scope.product.uuid, sender: SENDER } //IMPORTANT

          //Popover
          //prevent other popover fade in before showing the new one       
          $("[data-toggle='pop']").on('show.bs.popover', function(){
              $('.popover').removeClass('in');          
          });
          $("[data-toggle=pop]").popover({
            html: true,
            content: function () {
              if (scope.hide_popover_list == true) return undefined; //Configurable Popover
              return ((scope.bigQuicklooksrc != undefined) || (scope.hide_popover_list != true)) ? ('<img style="opacity:1; max-width: 300px; max-height: 200px;  display: inline-block; " src=' + scope.bigQuicklooksrc + '>') : undefined;
            },
            animation: true,
            trigger: "hover",
            delay: { "show": 200, "hide": 100 }
          });

          scope.hoverIn = function () {//ng-mouseover="hoverIn"
            scope.visibleItemButton = true;
            if (!scope.product.selected) {
              CartModel.callEventHighlightProduct(me);
            }
          };

          scope.hoverOut = function () {//ng-mouseover="hoverOut"
            scope.visibleItemButton = false;
            scope.product.selected ? CartModel.callEventSelectProduct(me) : CartModel.callEventResetUi(me);
          };

          scope.selectProduct = function () {//ng-click="selectProduct" : Select product if is not selected, otherwise deselect and highlight it
            if (CartStatusService.getCartFootprints() === false) {
              ToastManager.error(ERR_NO_FOOTPRINTS_LOADED);
            }
            if (!scope.product.selected) {
              CartModel.callEventSelectProduct(me);
            } else {
              CartModel.callEventDeselectCurrentProduct(me);
              CartModel.callEventHighlightProduct(me);
            }
          };

          scope.zoomCart = function () {//Zoom
            CartStatusService.getCartFootprints() ? $(document).trigger("zoom-to", this.product) : ToastManager.error(ERR_ZOOM);
          };

          scope.showProductDetails = function () {//Show Product Details
            ProductDetailsManager.getProductDetails(scope.product.uuid, CartModel.model.list, true);
          };

          scope.removeProductFromCart = function () {//Remove Product 
            if (!confirm(CONFIRM_DELETE)) return;
            ProductCartService.removeProductFromCart(scope.product.id)
              .success(function () {
                //Update Cart model
                ProductCartService.getCart().then(function(){
                  //Update SearchModel
                  ProductCartService.getIdsInCart().then(function (res) {
                    SearchModel.model.cartids = res.data;
                    if(!SearchModel.model.list) return;
                    SearchModel.model.list.forEach(function(element){
                      if (SearchModel.model.cartids.includes(element.id)){
                            element.isincart = true;
                          } else{
                            element.isincart = false;
                          }             
                    });
                  });
                });
                ToastManager.success(SUCC_REMOVED);
              })
              .error(function () {
                ToastManager.error(ERR_REMOVE_FAILED);
              });
              OLMap.setModel(CartModel.model.list);
              setTimeout(function () { scope.$apply(); }, 0);//RESET UI
          };

          scope.downloadProduct = function () {//Download Product
            if (!scope.product.offline) { //Online
              window.location = scope.link;
            } else { //Offline
              var errMsg = "Product " + scope.product.identifier + " is offline";
              ProductService.getProduct(scope.link)
                .then(function (response) {
                  if (response.status == 202) {
                    AlertManager.success("Offline product retrieval initiated", "Offline product retrieval has been initiated. Please check again your Cart to know when it will be online.");
                  } else {
                    (response.data.error.message.value) ? errMsg = response.data.error.message.value : errMsg = errMsg;
                  }
                  AlertManager.error("Product unavailable", errMsg);
                }, function (response) {
                  (response.data.error.message.value) ? errMsg = response.data.error.message.value : errMsg = errMsg;
                  AlertManager.error("Product unavailable", errMsg);
                }).catch(function (response) {
                  (response.data.error.message.value) ? errMsg = response.data.error.message.value : errMsg = errMsg;
                  AlertManager.error("Product unavailable", errMsg);
                });
            }
          };
        }
      };
    },

    //Update cart-item UI On Specific Events Called by Cartmodel (cart-model-service)
    cartModelSubscription: function (product, element, scope) {
      CartModel.sub({
        scope: scope,
        id: SENDER,
        product: product,
        element: element,

        OnHighlight: function (param) {
          element.css((param.uuid == product.uuid) ? { 'background-color': HIGHLIGHT_ITEM_BACKGROUND_COLOR } : {});
        },

        OnSelectProduct: function (param) {
          element.css({ 'background-color': param.uuid == product.uuid ? SELECTED_ITEM_BACKGROUND_COLOR : DEFAULT_ITEM_BACKGROUND_COLOR });
          setTimeout(function () { scope.$apply(); }, 0);//RESET UI
          $(CONTENT_ID).animate((param.uuid == product.uuid && param.sender == 'OLMap') ? { scrollTop: angular.element(element).position().top + $(CONTENT_ID).scrollTop() - 57 } : {});
        },

        OnResetUi: function () {
          element.css({ 'background-color': CartModel.getProductByUUID(product.uuid).selected ? SELECTED_ITEM_BACKGROUND_COLOR : DEFAULT_ITEM_BACKGROUND_COLOR });
        }
      });
    }
  };
  return directive;
});
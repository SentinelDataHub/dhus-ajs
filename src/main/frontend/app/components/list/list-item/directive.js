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
angular.module('DHuS-webclient').directive('listItem', function (
  $rootScope,
  $window,
  CartModel,
  CartMenuService,
  ConfigurationService,
  ProductCartService,
  ProductListService,
  SearchModel,
  SearchService,
  Session,
  UserInfoService,
  UserService
) {
  var SELECTED_ITEM_BACKGROUND_COLOR = '#dbdbdb';
  var HIGHLIGHT_ITEM_BACKGROUND_COLOR = '#F5F5F5';
  var DEFAULT_ITEM_BACKGROUND_COLOR = 'transparent';
  var baseUrl = '';
  var directive = {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/list/list-item/view.html',
    scope: {
      product: "=",
      uuid: "="
    },

    //Shortens name with "..." if its too long
    getShortString: function (string, maxLength) {
      return (string.length <= maxLength) ? string : string.substring(0, maxLength / 2) + '...' + string.substring(string.length - maxLength / 2 - 3);
    },

    //Subscription to SearchModel
    searchModelSubscription: function (product, element, scope) {
      SearchModel.sub({
        scope: scope,
        id: 'listItem',
        product: product,
        element: element,

        //SetUI
        productDidSelected: function (param) {
          var self = this;
          if (param.uuid == this.product.uuid) {
            setTimeout(function () {
              self.element.css({ 'background-color': SELECTED_ITEM_BACKGROUND_COLOR });
              scope.$apply();
            }, 0);
          } else {
            setTimeout(function () {
              if (param.sender == 'OLMap') {
                self.element.css({ 'background-color': DEFAULT_ITEM_BACKGROUND_COLOR });
                scope.$apply();
              }
            }, 0);
          }
          //Reset UI
          // setTimeout(function () removeAllSelected{scope.$apply();}, 0);
          //Scroll to item if selecting from map

          if (param.uuid == this.product.uuid && param.sender == 'OLMap') {            
            ProductListService.scrollToItem(this.element);
          }
        },

        //Highlight product
        productDidHighlighted: function (param) {
          if (param.uuid == this.product.uuid && SearchModel.getProductByUUID(this.product.uuid) && !SearchModel.getProductByUUID(this.product.uuid).selected) {
            this.element.css({ 'background-color': HIGHLIGHT_ITEM_BACKGROUND_COLOR });
          }

          if (param.uuid != this.product.uuid && !SearchModel.getProductByUUID(this.product.uuid).selected) {
            this.element.css({ 'background-color': DEFAULT_ITEM_BACKGROUND_COLOR });
          }
        },
      });
    },
    updatedSearchModel: function () { },
    productDidSelected: function () { },
    productDidDeselected: function () { },
    productDidntHighlighted: function () { },
    setUI: function () { },
    compile: function (tElem, tAttrs) {
      var self = this;
      return {
        pre: function (scope, iElem, iAttrs) {
          scope.showquicklook = ApplicationService.settings.showquicklook;
          scope.showcart = ApplicationService.settings.showcart;
          scope.enableLta = ApplicationService.settings.enable_lta;
          if (!ConfigurationService.isLoaded()) {
            ConfigurationService.getConfiguration().then(function (data) {
              if (data) {
                ApplicationService = data;
                scope.showquicklook = ApplicationService.settings.showquicklook;
                scope.showcart = ApplicationService.settings.showcart;
                baseUrl = ApplicationConfig.baseUrl;
                scope.enableLta = ApplicationService.settings.enable_lta;
                scope.hide_popover_list = ApplicationService.settings.hide_popover_list;
              }
            },
              function (error) { });
          }
          else {
            baseUrl = ApplicationConfig.baseUrl;
          }
        },
        post: function (scope, iElem, iAttrs) {
          if (!scope.user) {
            if (!UserService.getUserModel()) {
              var username = Session.getSessionUsername();
              UserService.getODataUser(username).then(function (res) {
                UserService.setUserModel(res);
                UserService.setUserRolesModel(res);
                scope.user = UserService.getUserModel();
                Session.setUserLoggedIn();
                UserInfoService.userInfo.isLogged = true;
                scope.showDeleteButton = false;
                scope.hide_popover_list = ApplicationService.settings.hide_popover_list;
                for (var i = 0; i < scope.user.roles.length; i++) if (scope.user.roles[i] == "DATA_MANAGER") scope.showDeleteButton = true;
                scope.showSelect = scope.showDeleteButton || scope.showcart;
              });
            } else {
              scope.user = UserService.getUserModel();
              scope.showDeleteButton = false;
              scope.hide_popover_list = ApplicationService.settings.hide_popover_list;
              for (var i = 0; i < scope.user.roles.length; i++) if (scope.user.roles[i] == "DATA_MANAGER") scope.showDeleteButton = true;
              scope.showSelect = scope.showDeleteButton || scope.showcart;
            }
          }
          scope.showSelect = scope.showDeleteButton || scope.showcart;
          scope.hide_popover_list = ApplicationService.settings.hide_popover_list;
          scope.satellite = scope.product.identifier.substring(0, 2);
          scope.mission = scope.product.identifier.substring(0, 3);
          var resizeItem = function () { };
          angular.element($window).bind('resize', resizeItem);
          self.searchModelSubscription(scope.product, iElem, scope);
          var summary = _.findWhere(scope.product.indexes, { name: "summary" });
          if (summary) {
            var size = _.findWhere(summary.children, { name: "Size" });
            var date = _.findWhere(summary.children, { name: "Date" });
            var satellitename = _.findWhere(summary.children, { name: "Satellite" });
            scope.size = (size) ? size.value : '';
            scope.date = (date) ? date.value : '';
            scope.satellitename = (satellitename) ? satellitename.value : '';
            scope.summary = "";
            scope.summary += (scope.satellitename) ? "Mission: " + scope.satellitename + "; " : "";
            scope.summary += (scope.product.instrument) ? "Instrument: " + scope.product.instrument + "; " : "";
            scope.summary += (scope.date) ? "Sensing Date: " + scope.date + "; " : "";
            scope.summary += (scope.size) ? "Size: " + scope.size : "";
          }
          scope.link = baseUrl + "odata/v1/Products('" + scope.product.uuid + "')/$value";
          (scope.enableLta) ? scope.product.offline = scope.product.offline : scope.product.offline = false;
          if (scope.product.quicklook) {
            scope.quicklooksrc = baseUrl + "odata/v1/Products('" + scope.product.uuid + "')/Products('Thumbnail')/$value";
            scope.bigQuicklooksrc = baseUrl + "odata/v1/Products('" + scope.product.uuid + "')/Products('Quicklook')/$value";
          }

          //Popover   
          //prevent other popover fade in before showing the new one       
          $("[data-toggle='pop']").on('show.bs.popover', function(){
              $('.popover').removeClass('in');          
          });
          //show popover
          $("[data-toggle=pop]").popover({
            html: true,
            content: function () {              
              if (scope.hide_popover_list == true) return undefined; //Configurable Popover              
              var popoverData = ('<img style="opacity:1; max-width: 300px; max-height: 200px;  display: inline-block; " src=' + scope.bigQuicklooksrc + '>');
              return (scope.bigQuicklooksrc != undefined) ? popoverData : undefined;
            }
          });          

          scope.hoverIn = function () {
            SearchModel.highlightProduct({ uuid: scope.product.uuid, sender: "listItem" });
            scope.visibleItemButton = true;
          };

          scope.hoverOut = function () {
            SearchModel.nohighlightProduct({ uuid: scope.product.uuid, sender: "listItem" });
            scope.visibleItemButton = false;
          };

          //Toggle select on item checkbox
          scope.selectProduct = function () {
            if (scope.product.selected) {
              SearchModel.deselectProduct({ uuid: scope.product.uuid, sender: "listItem" });
            } else {
              SearchModel.selectProduct({ uuid: scope.product.uuid, sender: "listItem" });
            }
            SearchModel.highlightProduct({ uuid: scope.product.uuid, sender: "listItem" });
            SearchModel.OnSelectionChange();
          };

          //Zoom
          scope.zoomTo = function (product) {
            $(document).trigger("zoom-to", product);
          };

          //Show Details
          scope.showProductDetails = function () {
            if(!scope.product.selected){
              scope.selectProduct();
            }
            ProductDetailsManager.getProductDetails(scope.product.uuid, SearchModel.model.list);


          };

          //Cart Add
          scope.addProductToCart = function () {
            ProductCartService.addProductToCart(scope.product.id)
              .success(function () {
                ToastManager.success("Product added to cart");
                scope.product.isincart = true;
              })
              .error(function () {
                ToastManager.error("Added product failed");
              });
              // ProductCartService.getCart();
          };

          //Cart Remove
          scope.removeProductFromCart = function () {
            ProductCartService.removeProductFromCart(scope.product.id)
              .success(function () {
                ToastManager.success("Product removed from cart");
                scope.product.isincart = false;
              })
              .error(function () {
                ToastManager.error("Removed product failed");
              });
              // ProductCartService.getCart();
          };

          scope.isInCart = function (){
            var res = false;
            CartModel.model.list.forEach(function(element) {
              if(scope.product.id === element.id){
                res = true;
              }
            });
            return res;
          };

          //Download
          scope.downloadProduct = function () {
            if (!scope.product.offline) {
              window.location = scope.link;
            } else {
              var errMsg = "Product " + scope.product.identifier + " is offline";
              ProductService.getProduct(scope.link).then(function (response) {
                if (response.status == 202) {
                  if (scope.product.isincart) {
                    AlertManager.success("Offline product retrieval initiated", "Offline product retrieval has been initiated. Please check again your Cart to know when it will be online.");
                  } else {
                    ProductCartService.addProductToCart(scope.product.id)
                      .success(function () {
                        AlertManager.success("Offline product retrieval initiated", "Offline product retrieval has been initiated and the product has been moved to Cart. Please check your Cart to know when it will be online.");
                        scope.product.isincart = true;
                      })
                      .error(function () {
                        AlertManager.warning("Offline product retrieval initiated", "Offline product retrieval has been initiated, but there was an error while adding product to cart. Please check again product list to know when it will be online.");
                      });
                  }
                } else {
                  (response.data && response.data.error && response.data.error.message && response.data.error.message.value)
                    ? errMsg = response.data.error.message.value : errMsg = errMsg;
                  AlertManager.error("Product unavailable", errMsg);
                }
              }, function (response) {
                (response.data && response.data.error && response.data.error.message && response.data.error.message.value)
                  ? errMsg = response.data.error.message.value : errMsg = errMsg;
                AlertManager.error("Product unavailable", errMsg);

              }).catch(function (response) {
                (response.data && response.data.error && response.data.error.message && response.data.error.message.value)
                  ? errMsg = response.data.error.message.value : errMsg = errMsg;
                AlertManager.error("Product unavailable", errMsg);
              });
            }
          };

          //Delete Product
          scope.deleteProduct = function () {
            var outcome = confirm("Delete the product?");
            var deletionCause = null;
            if (outcome) {
              if (ApplicationService.settings.deleted_product.show_deletion_cause) {
                var cause = prompt("Please enter a deletion cause. \n" +
                  "Valid causes are: \"" + ApplicationService.settings.deleted_product.causes +
                  "\". \nClick on 'Cancel' if you want to use the default cause: " + "\"" + ApplicationService.settings.deleted_product.default_cause + "\"");
                if (cause != null && cause.length > 0) {
                  if (ApplicationService.settings.deleted_product.causes.indexOf(cause) >= 0) {
                    deletionCause = cause;
                  } else {
                    deletionCause = ApplicationService.settings.deleted_product.default_cause;
                  }
                } else {
                  deletionCause = ApplicationService.settings.deleted_product.default_cause;
                }
              }
              ProductService.removeProduct(scope.product.uuid, deletionCause)
                .success(function () {
                  SearchService.search();
                  ToastManager.success("Product removed");
                })
                .error(function () {
                  ToastManager.error("Remove product failed");
                });
            }
          };
        }
      }
    }
  };
  return directive;
});

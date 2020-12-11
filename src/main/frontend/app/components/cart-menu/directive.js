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
angular.module('DHuS-webclient').directive('cartMenu', function ($document, $window, AdvancedSearchService, CartMenuService, CartModel, ConfigurationService, ProductCartService, OLMap, SearchModel, Session, UIUtils, UserInfoService, UserService, CartStatusService) {
  var CART_MENU_CONTAINER = '#cart-menu-container';
  var SEARCH_BOX_ID = '#search-box-container';
  var LIST_BOX_DELTA = 30;
  var LIST_BOX_TOP_MARGIN = 10;
  var LIST_BOX_MARGIN = 20;

  //Auto-Resize Panel accordingly to new Screen Resolution
  resizeCartMenu = function () {
    UIUtils.responsiveLayout(
      function xs() {
        $(CART_MENU_CONTAINER).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
        if (CartMenuService.model.hidden) $(CART_MENU_CONTAINER).css('left', ('-' + parseInt($(CART_MENU_CONTAINER).width() + 20) + 'px'));
      },
      function sm() {
        $(CART_MENU_CONTAINER).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
        if (CartMenuService.model.hidden) $(CART_MENU_CONTAINER).css('left', ('-' + parseInt($(CART_MENU_CONTAINER).width() + 20) + 'px'));
      },
      function md() {
        if (!ApplicationService.settings.show_extended_list) $(CART_MENU_CONTAINER).css('width', 'calc(50% - 40px)');
        else $(CART_MENU_CONTAINER).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
        if (CartMenuService.model.hidden) $(CART_MENU_CONTAINER).css('left', ('-' + parseInt($(CART_MENU_CONTAINER).width() + 20) + 'px'));
      },
      function lg() {
        if (!ApplicationService.settings.show_extended_list) $(CART_MENU_CONTAINER).css('width', 'calc(40% - 40px)');
        else $(CART_MENU_CONTAINER).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
        if (CartMenuService.model.hidden) $(CART_MENU_CONTAINER).css('left', ('-' + parseInt($(CART_MENU_CONTAINER).width() + 20) + 'px'));
      }
    );
    if ($(SEARCH_BOX_ID) && $(SEARCH_BOX_ID).position()) {
      var top = (parseInt($(SEARCH_BOX_ID).height()) + LIST_BOX_TOP_MARGIN + parseInt($(SEARCH_BOX_ID).position().top));
      $(CART_MENU_CONTAINER).css('top', top);
      $(CART_MENU_CONTAINER).css('height', (parseInt(UIUtils.getScreenHeight()) - top - LIST_BOX_DELTA - LIST_BOX_TOP_MARGIN) + 'px');
    }
  };

  return {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/cart-menu/view.html',
    scope: { text: "=" },
    expandedCartMenu: false,
    createdCartModel: function () { },
    compile: function (tElem, tAttrs) {
      var self = this;
      return {
        pre: function (scope, iElem, iAttrs) {
          CartModel.sub(self);
          scope.productCount = 0;
          scope.hasProducts = true;            
          scope.currentPage = 1;

        },
        post: function (scope, iElem, iAttrs) {
          scope.downloadCartTitle = "Download Cart";
          scope.clearCartTitle = "Clear Cart";
          scope.productsPerPageTitle = "Products per Page";
          scope.goToFirstPageTitle = "Go To First Page";
          scope.goToPreviousPageTitle = "Go To Previous Page";
          scope.goToNextPageTitle = "Go To Next Page";
          scope.goToLastPageTitle = "Go To Last Page";
          scope.currentPageTitle = "Enter page number";
          scope.toggleButtonClass = "glyphicon glyphicon-resize-full";
          scope.toggleClosePanelTitle = "Close Cart-List";
          scope.toggleExpandTitle = "Expand Cart-List";
          self.productsPerPagePristine = true;
          self.currentPagePristine = true;
          scope.currentPage = 1;
          scope.currentPageCache = 1;
          scope.MSG_CART_EMPTY = "Your cart is empty";

          //On Ready
          angular.element($document).ready(function () {
            if (!ConfigurationService.isLoaded()) {
              ConfigurationService.getConfiguration().then(function (data) {
                if (data) {
                  ApplicationService = data;
                }
              }, function (error) { });
            } else {
              scope.showtoggle = false;
            }
            resizeCartMenu();
          });

          //On Resize
          angular.element($window).bind('resize', function () {
            resizeCartMenu();
          });

          scope.initCart = function () {
            scope.toggleShowCartFootprints = false;
            ProductCartService.getCart();
            scope.refreshCounters();
          };

          //Toggle Cart/Products Footprints
          scope.getCartFootprints = function () {
            if (!(Object.keys(OLMap.map).length === 0 && OLMap.map.constructor === Object)) {
              OLMap.setModel(CartModel.model.list);
            }
            // OLMap.setModel(!scope.toggleShowCartFootprints ? CartModel.model.list : SearchModel.model.list);
            // scope.toggleShowCartFootprints = !scope.toggleShowCartFootprints;
            // CartStatusService.setCartFootprints(!CartStatusService.getCartFootprints());
          };

          //Close Cart-menu panel click the X button
          scope.closeCartMenuPanel = function () {
            CartMenuService.hide();
          };

          var goToPage = function (pageNumber, free) {
            if (CartStatusService.getCartActive() === false) return;
            if ((pageNumber <= scope.pageCount && pageNumber > 0) || free) {
              scope.currentPage = pageNumber;
              ProductCartService.gotoPage(pageNumber).then(function () {
                scope.refreshCounters();
                if (CartStatusService.getCartFootprints() === true) {
                  if (!(Object.keys(OLMap.map).length === 0 && OLMap.map.constructor === Object)) {
                    OLMap.setModel(CartModel.model.list);
                  }
                }
              });
            }
          };

          scope.refreshCounters = function () {
            scope.productCount = CartModel.model.count;
            scope.hasProducts = CartModel.model.hasProducts;
            scope.pageCount = Math.floor(CartModel.model.count / scope.productsPerPage) + ((CartModel.model.count % scope.productsPerPage) ? 1 : 0);
          };

          self.createdCartModel = function () {
            scope.model = CartModel.model.list;
            scope.refreshCounters();
            scope.visualizedProductsFrom = (CartModel.model.count) ? ProductCartService.offset + 1 : 0;
            scope.visualizedProductsTo = (((CartModel.model.count) ? (scope.currentPage * scope.productsPerPage) : 0) > scope.productCount) ? scope.productCount : ((CartModel.model.count) ? (scope.currentPage * scope.productsPerPage) : 0);
            scope.getCartFootprints(); //automatically load cart
          };

          self.updatedCartModel = function () { };
          scope.productsPerPage = '25';
          scope.$watch('productsPerPage', function (productsPerPage) {
            if (self.productsPerPagePristine) {
              self.productsPerPagePristine = false;
              return;
            }
            ProductCartService.setLimit(productsPerPage);
            goToPage(1, true);
          });

          var managePageSelector = function () {
            var newValue = parseInt(scope.currentPage);
            if (isNaN(newValue)) {
              scope.$apply(function () {
                scope.currentPage = scope.currentPageCache;
              });
              return;
            }

            if (newValue <= 0) {
              scope.$apply(function () {
                scope.currentPage = scope.currentPageCache;
              });
              return;
            }

            if (newValue > scope.pageCount) {
              scope.$apply(function () {
                scope.currentPage = scope.currentPageCache;
              });
              return;
            }
            goToPage(scope.currentPage);
          };

          $('#cart-page-selector').bind("enterKey", function (e) { managePageSelector(); });
          $('#cart-page-selector').focusout(function (e) { managePageSelector(); });
          $('#cart-page-selector').keyup(function (e) { if (e.keyCode == 13) $(this).trigger("enterKey"); });

          scope.currentPage = 1;
          scope.gotoFirstPage = function () { goToPage(1); };
          scope.gotoPreviousPage = function () { goToPage(scope.currentPage - 1); };
          scope.gotoNextPage = function () { goToPage(scope.currentPage + 1); };
          scope.gotoLastPage = function () { goToPage(scope.pageCount); };
          scope.selectPageDidClicked = function (xx) { };

          //Show and Hide initialization
          CartMenuService.setShow(function () {
            CartStatusService.setCartActive(true);
            CartStatusService.setCartFootprints(true);
            AdvancedSearchService.hide();
            scope.initCart();
            CartMenuService.model.hidden = false;
            if (!(Object.keys(OLMap.map).length === 0 && OLMap.map.constructor === Object)) {
              OLMap.setDrawOnMap(false);
            }
            $(CART_MENU_CONTAINER).animate({ left: '20px' }, 300);
            document.getElementById("menu-cart-icon").classList.add("cart-button-active");
            document.getElementById("search-button").classList.add("grayfy");
          });

          CartMenuService.setHide(function () {
            CartStatusService.setCartActive(false);
            CartStatusService.setCartFootprints(false);
            CartMenuService.model.hidden = true;
            $(CART_MENU_CONTAINER).animate({ left: ('-' + parseInt($(CART_MENU_CONTAINER).width() + 20) + 'px') }, 300);
            scope.gotoFirstPage();
            if (!(Object.keys(OLMap.map).length === 0 && OLMap.map.constructor === Object)) {
              OLMap.setDrawOnMap(true);
              OLMap.setModel(SearchModel.model.list);
            }
            var menuCartItem = document.getElementById("menu-cart-icon");
            if (menuCartItem !== null) {
              menuCartItem.classList.remove("cart-button-active");
              document.getElementById("search-button").classList.remove("grayfy");
            }
          });

          scope.toggleExpandCartMenu = function (isExpanded) {
            isExpanded ? this.expandedCartMenu = true : this.expandedCartMenu = !this.expandedCartMenu;
            if (this.expandedCartMenu) {
              $(CART_MENU_CONTAINER).css('width', 'calc(100% - 40px)');
              scope.toggleButtonClass = "glyphicon glyphicon-resize-small";
              scope.toggleExpandTitle = "Compact Cart-menu";
            } else {
              resizeCartMenu();
              scope.toggleButtonClass = "glyphicon-resize-full glyphicon ";
              scope.toggleExpandTitle = "Expand Cart-menu";
            }
          };

          scope.downloadCart = function () {
            if (scope.hasProducts === false) return;
            var urlRequest = "odata/v1/Users(':userid')/Cart?$format=application/metalink4%2Bxml&$top=" + scope.productCount;
            var url;
            var user = UserService.getUserModel();
            if (!user) {
              var username = Session.getSessionUsername();
              UserService.getODataUser(username).then(function (res) {
                UserService.setUserModel(res);
                UserService.setUserRolesModel(res);
                Session.setUserLoggedIn();
                UserInfoService.userInfo.isLogged = true;
                user = UserService.getUserModel();
                url = ApplicationConfig.baseUrl + urlRequest.replace(':userid', ((user.username) ? user.username : ''));
                window.location = url;
              });
            } else {
              url = ApplicationConfig.baseUrl + urlRequest.replace(':userid', ((user.username) ? user.username : ''));
              window.location = url;
            }
          };

          scope.clearCart = function () {
            if (scope.hasProducts === false) return;
            if (!confirm("Want to Clear Cart?")) return;//Delete confirm
            ProductCartService.clearCart()
              .then(function (result) {
                if (result.status == 200) {
                  //Update SearchModel
                  ProductCartService.getIdsInCart().then(function (res) {
                    SearchModel.model.cartids = res.data;
                    if (!SearchModel.model.list) return;
                    SearchModel.model.list.forEach(function (element) {
                      if (SearchModel.model.cartids.includes(element.id)) {
                        element.isincart = true;
                      } else {
                        element.isincart = false;
                      }
                    });
                  });
                  setTimeout(function () { scope.closeCartMenuPanel(); }, 1000);
                  ToastManager.success("user cart cleared");
                } else {
                  ToastManager.error("error cleaning user cart");
                }
              });
          };
        }
      };
    }
  };
});

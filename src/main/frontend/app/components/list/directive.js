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


angular.module('DHuS-webclient')



  .directive('listContainer', function (UIUtils, $document, $window, SearchModel, SearchService, $q,
    ProductCartService, UserService, ConfigurationService, AuthenticationService, Session, UserInfoService) {
    var SEARCH_BOX_ID = '#search-box-container',
      LIST_ID = '#list-container',
      LIST_BOX_DELTA = '30',
      LIST_BOX_TOP_MARGIN = '10',
      LIST_SWITCH_ID = "#show-list-button",
      LIST_BOX_MARGIN = 20,
      HEIGHT_MARGIN = 0;

    var resizeList = function (productsPerPage, requestDone) {
      var wth = $("#list-container").width();

      UIUtils.responsiveLayout(
        function xs() {
          $(LIST_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
          if (wth < 550) {
            $("#product-per-page-label").hide();
          } else {
            $("#product-per-page-label").show();
          }
        },
        function sm() {
          $(LIST_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
          if (wth < 550) {
            $("#product-per-page-label").hide();
          } else {
            $("#product-per-page-label").show();
          }
        },
        function md() {
          if (!ApplicationService.settings.show_extended_list) {
            $(LIST_ID).css('width', (parseInt(UIUtils.getScreenWidth() * 0.5) - (LIST_BOX_MARGIN * 2)) + 'px');
            if (wth < 550) {
              $("#product-per-page-label").hide();
            } else {
              $("#product-per-page-label").show();
            }
          }
          else {
            $(LIST_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
          }
        },
        function lg() {
          if (!ApplicationService.settings.show_extended_list) {
            $(LIST_ID).css('width', (parseInt(UIUtils.getScreenWidth() * 0.4) - (LIST_BOX_MARGIN * 2)) + 'px');
            if (wth < 550) {
              $("#product-per-page-label").hide();
            } else {
              $("#product-per-page-label").show();
            }
          } else {
            $(LIST_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
          }
        }
      );

      var top;
      var height;
      if ($(SEARCH_BOX_ID) && $(SEARCH_BOX_ID).position()) {
        top = (parseInt($(SEARCH_BOX_ID).height()) + parseInt(LIST_BOX_TOP_MARGIN) + parseInt($(SEARCH_BOX_ID).position().top));
        $(LIST_ID).css('top', top + 'px');
        if (requestDone && requestDone.length > 0)
          height = (parseInt(UIUtils.getScreenHeight()) - top - parseInt(LIST_BOX_DELTA) - parseInt(LIST_BOX_TOP_MARGIN) - $(".request-done").outerHeight());
        else
          height = (parseInt(UIUtils.getScreenHeight()) - top - parseInt(LIST_BOX_DELTA) - parseInt(LIST_BOX_TOP_MARGIN));
        $(LIST_ID).animate({ 'height': parseInt((($(".item").outerHeight() * productsPerPage)) + $(".list-header").outerHeight() + $(".list-toolbar").outerHeight() + HEIGHT_MARGIN) + 'px' }, 0);
        $(LIST_ID).css('max-height', height + 'px');
        $(LIST_SWITCH_ID).css('top', top + 'px');
      }
    };
    return {
      showList: false,
      restrict: 'AE',
      replace: true,
      templateUrl: 'components/list/view.html',
      scope: {
        text: "="
      },
      expandedList: false,
      createdSearchModel: function () { },
      compile: function (tElem, tAttrs) {
        var self = this;
        return {
          
          pre: function (scope, iElem, iAttrs) {
            SearchModel.sub(self);
            if (!AuthenticationService.logged) {
              scope.productCount = 0;
              scope.currentPage = 1;
              scope.showDeleteButton = false;
              $('#show-list-button').hide();
              $("#showBr1").hide();
            }
          },
          
          post: function (scope, iElem, iAttrs) {
            scope.toggleButtonClass = "glyphicon glyphicon-resize-full";
            scope.toggleExpandListTitle = "Expand list";
            scope.selectAll = false;
            scope.selectLabel = 'Select All';
            scope.selectStatus = 'Selected:';
            scope.selectCounter = '0';
            scope.checkboxStatus = 'none';

            /*
            *  Setting function which will be called by list-item directive
            */
            SearchModel.setOnSelectionChange(function () {
              scope.OnSelectionChange();
            });

            if (!AuthenticationService.logged) {
              $('#show-list-button').hide();
              scope.visibleList = false;
              scope.currentPageCache = 1;
              self.productsPerPagePristine = true;
              self.currentPagePristine = true;
              self.visibleListPristine = true;
              scope.showDeleteButton = false;
              scope.currentPage = 1;
            }

            if (!ConfigurationService.isLoaded()) {
              ConfigurationService.getConfiguration().then(function (data) {
                if (data) { // promise fulfilled
                  ApplicationService = data;
                  scope.options = ApplicationService.settings.pagination_limit;
                  SearchService.setErrorMessage(ApplicationService.settings.search_error_message);
                  SearchService.setInvalidGeometryMessage(ApplicationService.settings.invalid_geometry_message);
                  SearchService.setErrorTitle(ApplicationService.settings.search_error_title);
                  if (scope.options[0] !== null && angular.isNumber(scope.options[0]) && scope.options[0] >= 0) {
                    scope.productsPerPage = scope.options[0];
                    SearchService.setLimit(scope.productsPerPage);
                  }
                  else {
                    scope.options = [25, 50, 75, 100, 125, 150];
                    scope.productsPerPage = scope.options[0];
                    SearchService.setLimit(scope.productsPerPage);
                  }
                  scope.showcart = ApplicationService.settings.showcart;
                } else {
                  scope.options = [25, 50, 75, 100, 125, 150];
                  scope.productsPerPage = scope.options[0];
                  SearchService.setLimit(scope.productsPerPage);
                }
              },
                function (error) {
                  // promise rejected, could log the error with: console.log('error', error);
                });
            } else { //Configuration not loaded
              scope.options = ApplicationService.settings.pagination_limit;
              scope.showcart = ApplicationService.settings.showcart;
              SearchService.setErrorMessage(ApplicationService.settings.search_error_message);
              SearchService.setInvalidGeometryMessage(ApplicationService.settings.invalid_geometry_message);                  
              SearchService.setErrorTitle(ApplicationService.settings.search_error_title);
              if (scope.options[0] !== null && angular.isNumber(scope.options[0]) && scope.options[0] >= 0) {
                scope.productsPerPage = scope.options[0];
                SearchService.setLimit(scope.productsPerPage);
              }
              else {
                scope.options = [25, 50, 75, 100, 125, 150];
                scope.productsPerPage = scope.options[0];
                SearchService.setLimit(scope.productsPerPage);
              }
            }
            if (SearchModel.model.list && SearchModel.model.list.length > 0) {
              setTimeout(function () { self.createdSearchModel() }, 0);
            } else {
              setTimeout(function () { resizeList(0); $('#show-list-button').hide() }, 0);
            }

            /*
            * Toggle Select All
            */
            scope.toggleSelectAll = function () {
              scope.selectAll = !scope.selectAll;
              for (var i = 0; i < scope.model.length; i++) {
                scope.model[i].selected = scope.selectAll;
              }
              scope.selectAll ? scope.selectLabel = 'Deselect All' : scope.selectLabel = 'Select All';
            };

            scope.checkSomeSelected = function () {
              var a = SearchModel.countSelected();

              if (scope.model == undefined)
                return;
              var max = scope.model.length;
              if (a > 0 && a < max) {
                return true;
              } else {
                return false;
              }
            };

            scope.checkIsOneSelected = function () {
              var a = SearchModel.countSelected();
              if (a == 1) {
                return true;
              } else {
                return false;
              }
            };


            scope.checkFull = function () {
              var a = SearchModel.countSelected();

              if (scope.model == undefined)
                return;

              var max = scope.model.length;
              if (a == max) {
                return true;
              } else {
                return false;
              }
            };

            scope.checkEmpty = function () {
              var a = SearchModel.countSelected();
              if (a == 0) {
                return true;
              } else {
                return false;
              }
            };

            // Select All
            scope.SelectAll = function () {
              scope.selectAll = true;
              for (var i = 0; scope.model && i < scope.model.length; i++) {
                scope.model[i].selected = true;
              }

              /* Change CSS for each item
              * Another for cycle is necessary because the uuid is different
              */
              for (var i = 0; scope.model && i < scope.model.length; i++) {
                SearchModel.selectProduct({ uuid: scope.model[i].uuid, sender: "listItem" });
              }
              scope.OnSelectionChange();
            };

            //Deselect All
            scope.DeselectAll = function () {
              scope.selectAll = false;
              for (var i = 0; scope.model && i < scope.model.length; i++) {
                scope.model[i].selected = false;
              }

              /* Change CSS for each item
              * Another for is necessary because the uuid is different
              */

              for (var i = 0; scope.model && i < scope.model.length; i++) {
                SearchModel.deselectProduct({ uuid: scope.model[i].uuid, sender: "listItem" });
                SearchModel.nohighlightProduct({ uuid: scope.model[i].uuid, sender: "listItem" });
                //Update the CSS on each item
                // SearchModel.highlightProduct({uuid:scope.model[i].uuid, sender:"listItem"});
              }
              scope.OnSelectionChange();

              //Reset UI
              setTimeout(function () { scope.$apply(); }, 0);
            };

            //Update list UI with the number received from Search model counter
            scope.UpdateUI = function () {
              scope.selectCounter = SearchModel.countSelected();
            };

            scope.OnSelectionChange = function () {
              scope.UpdateUI();
            };

            scope.toggleExpandList = function (isExpanded) {
              if (isExpanded) {
                this.expandedList = true;
              } else {
                this.expandedList = !this.expandedList;
              }

              if (this.expandedList) {
                $(LIST_ID).css('width', 'calc(100% - 40px)');
                scope.toggleButtonClass = "glyphicon glyphicon-resize-small";
                scope.toggleExpandListTitle = "Compact list";
              } else {
                setTimeout(function () {
                  resizeList(scope.productCount, SearchService.doneRequest);
                  scope.toggleButtonClass = "glyphicon glyphicon-resize-full";
                  scope.toggleExpandListTitle = "Expand list";
                  $(window).trigger('resize');
                }, 0);
              }
            };

            //Show Product List
            scope.showList = function () {
              $(window).resize();
              $(window).trigger('resize');
              self.toggle = true;
              if (scope.model) {
                if (ApplicationService.settings.show_extended_list) {
                  scope.toggleExpandList(ApplicationService.settings.show_extended_list);
                }
                if (!UserService.getUserModel()) {
                  var username = Session.getSessionUsername();
                  UserService.getODataUser(username).then(function (res) {
                    UserService.setUserModel(res);
                    UserService.setUserRolesModel(res);
                    Session.setUserLoggedIn();
                    UserInfoService.userInfo.isLogged = true;
                  });
                }
                scope.user = UserService.getUserModel();
                scope.showDeleteButton = false;
                for (var i = 0; i < scope.user.roles.length; i++) {
                  if (scope.user.roles[i] == "DATA_MANAGER") {
                    scope.showDeleteButton = true;
                  }
                }
                scope.showSelect = scope.showDeleteButton || scope.showcart;
              }
              scope.visibleList = true;
              $(LIST_ID).animate({ opacity: 0.9 }, 500);
            };

            scope.hideList = function () {
              scope.visibleList = false;
              //$(LIST_ID).animate({opacity:0},500, function(){$(LIST_ID).css({height:0})});
            };

            scope.goToPage = function (pageNumber, free) {

              if ((pageNumber <= scope.pageCount && pageNumber > 0) || free) {
                scope.currentPage = pageNumber;
                return SearchService.gotoPage(pageNumber).then(function () {
                  scope.refreshCounters();
                  scope.currentPageCache = pageNumber;
                  scope.currentPage = pageNumber;
                });
              } else {
                var deferred = $q.defer();
                return deferred.promise;
              }
            };
            var resizeId;

            angular.element($window).bind('resize', function (e) {
              clearTimeout(resizeId);
              resizeId = setTimeout(function () {
                if (scope.model)
                  resizeList(scope.model.length, SearchService.doneRequest)
              }, 0);

            });

            self.toggle = false;
            scope.refreshCounters = function () {
              scope.productCount = SearchModel.model.count;
              scope.pageCount = Math.floor(SearchModel.model.count / scope.productsPerPage) + ((SearchModel.model.count % scope.productsPerPage) ? 1 : 0);
            };
            self.createdSearchModel = function () {
              scope.DeselectAll();
              scope.model = SearchModel.model.list;
              scope.productCount = SearchModel.model.count;
              scope.showtoggle = (scope.productCount || (SearchService.doneRequest && SearchService.doneRequest.length > 0))
                && !ApplicationService.settings.show_extended_list;
              scope.refreshCounters();
              scope.showList(scope.productCount, SearchService.doneRequest);
              scope.order = SearchService.getOrderName();
              scope.sortedby = SearchService.getSortedName();
              if (SearchService.offset == 0) {
                scope.currentPageCache = 1;
                scope.currentPage = 1;
              } else {
                scope.currentPageCache = (SearchModel.model.count) ? scope.currentPage : 1;
                scope.currentPage = (SearchModel.model.count) ? scope.currentPage : 1;
              }

              scope.visualizedProductsFrom = (SearchModel.model.count) ? SearchService.offset + 1 : 0;
              scope.visualizedProductsTo =
                (((SearchModel.model.count) ?
                  (scope.currentPage * scope.productsPerPage) : 1) > scope.productCount)
                  ? scope.productCount
                  : ((SearchModel.model.count)
                    ? (scope.currentPage * scope.productsPerPage)
                    : 1);

              if (!ApplicationService.settings.show_extended_list)
                setTimeout(function () { resizeList((scope && scope.model && scope.model.length) ? scope.model.length : 0, SearchService.doneRequest) }, 0);
              else
                setTimeout(function () { resizeList((scope && scope.model && scope.model.length) ? scope.model.length : 0, SearchService.doneRequest); scope.toggleExpandList(ApplicationService.settings.show_extended_list) }, 0);


              setTimeout(function () {
                $("#product-list").animate({ scrollTop: 0 });
              }, 0);
            };
            self.updatedSearchModel = function () {
            };
            scope.toggleList = function () {
              self.toggle = !self.toggle;
              if (self.toggle) {
                scope.showList();
                scope.visibleList = true;
              } else {
                scope.hideList();
                scope.visibleList = false;
              }
            };

            scope.closeList = function () {
              scope.hideList();
              scope.visibleList = false;
            };

            $(document).on('closeSession', function () {
              scope.closeList();
              setTimeout(function () { $('#show-list-button').hide() }, 0);
            });
            scope.switchButtonLabel = "+";

            ConfigurationService.getConfiguration().then(function (data) { // promise fulfilled
              if (data) {
                scope.ApplicationConf = data;
                scope.options = scope.ApplicationConf.settings.pagination_limit;
                if (scope.options[0] !== null && angular.isNumber(scope.options[0]) && scope.options[0] >= 0) {
                  scope.productsPerPage = scope.options[0];
                  SearchService.setLimit(scope.productsPerPage);
                } else {
                  scope.options = [25, 50, 75, 100, 125, 150];
                  scope.productsPerPage = scope.options[0];
                  SearchService.setLimit(scope.productsPerPage);
                }
              } else {
                scope.options = [25, 50, 75, 100, 125, 150];
                scope.productsPerPage = scope.options[0];
                SearchService.setLimit(scope.productsPerPage);
              }
            }, function (error) {
              // promise rejected, console.log('error', error);
            });
            scope.switchButtonLabel = "+";

            scope.updateValue = function () {
              if (this.productsPerPagePristine) {
                this.productsPerPagePristine = false;
                return;
              }
              SearchService.setLimit(scope.productsPerPage);
              scope.goToPage(1, true);
            };

            scope.clearCart = function () {
              if (scope.productCount == 0) return;
              ProductCartService.clearCart()
                .then(function (result) {
                  if (result.status == 200) {
                    // scope.initCart();
                    SearchService.search();
                    ToastManager.success("user cart cleared");
                  }
                  else {
                    ToastManager.error("error cleaning user cart");
                  }
                });
            };

            scope.$watch('visibleList', function (newValue) {
              if (self.visibleListPristine) {
                self.visibleListPristine = false;
                return;
              }
              if (newValue) {
                $('#show-list-button').animate(
                  { opacity: 0 },
                  500,
                  "linear",
                  function () {
                    $('#show-list-button').hide();
                  });
              } else {
                $('#show-list-button').show();
                $('#show-list-button').animate(
                  { opacity: 1 },
                  500,
                  "linear",
                  function () {
                  });
              }
            });

            var managePageSelector = function () {
              var newValue = parseInt(scope.currentPage);
              if (isNaN(newValue) || !(/^\d+$/.test(scope.currentPage))) {
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
              scope.goToPage(scope.currentPage, true);
            }

            $('#page-selector').bind("enterKey", function (e) {
              managePageSelector();
            });
            $('#page-selector').focusout(function (e) {
              managePageSelector();
            });
            $('#page-selector').keyup(function (e) {
              if (e.keyCode == 13) {
                $(this).trigger("enterKey");
              }
            });
            scope.currentPage = 1;

            scope.gotoFirstPage = function () {
              scope.goToPage(1, false);
            };

            scope.gotoPreviousPage = function () {
              scope.goToPage(scope.currentPageCache - 1, false);
            };

            scope.gotoNextPage = function () {
              scope.goToPage(parseInt(scope.currentPageCache) + parseInt(1), false);
            };

            scope.gotoLastPage = function () {
              scope.goToPage(scope.pageCount, false);
            };

            scope.selectPageDidClicked = function (xx) {
              // console.log('select page did clicked');
            };

            scope.hasSelectedProducts = function () {
              // console.warn('579 list menu');

              for (var i = 0; i < scope.model.length; i++) {
                if (scope.model[i].selected) {
                  return true;
                }
              }
              return false;
            };

            scope.addAllToCart = function () {
              var promises = [];
              var success = 0;
              for (var i = 0; i < scope.model.length; i++) {
                if (scope.model[i].selected) {
                  scope.model[i].isincart = true;
                  promises.push(ProductCartService.addProductToCart(scope.model[i].id)
                    .success(function () {
                      success++;
                    })
                    .error(function () {
                      ToastManager.error("Added product to cart failed");
                    }));
                }
              }
              $q.all(promises).then(function () {
                if (success > 0) {
                  var productWord = (success > 1) ? "products" : "product";
                  ToastManager.success(success + " " + productWord + " added to cart");
                  scope.DeselectAll();
                }
              });

            };

            scope.removeAllSelected = function () {
              var promises = [];
              var success = 0;
              for (var i = 0; i < scope.model.length; i++) {
                if (scope.model[i].selected) {
                  scope.model[i].isincart = false;
                  promises.push(ProductCartService.removeProductFromCart(scope.model[i].id)
                    .success(function () {
                      success++;
                    })
                    .error(function () {
                      ToastManager.error("Removed product to cart failed");
                    }));
                }
              }
              $q.all(promises).then(function () {
                if (success > 0) {
                  var productWord = (success > 1) ? "products" : "product";
                  ToastManager.success(success + " " + productWord + " added to cart");
                  scope.DeselectAll();
                }
              });

            };

            scope.deleteAll = function () {
              if (!scope.hasSelectedProducts()) return;
              var promises = [];
              var success = 0;
              var deletionCause = null;
              var outcome = confirm("Delete the product?")
              if (outcome) {
                if (ApplicationService.settings.deleted_product.show_deletion_cause) {
                  var cause = prompt("Please enter a deletion cause.\n " +
                    "Valid causes are: \"" + ApplicationService.settings.deleted_product.causes +
                    "\". \nClick on 'Cancel' if you don't want to insert any cause.", "");
                  if (cause != null && cause.length > 0) {
                    if (ApplicationService.settings.deleted_product.causes.indexOf(cause) >= 0) {
                      deletionCause = cause;
                    } else {
                      deletionCause = ApplicationService.settings.deleted_product.default_cause;
                    }
                  }
                }
                for (var i = 0; i < scope.model.length; i++) {
                  if (scope.model[i].selected) {
                    scope.model[i].isincart = true;
                    promises.push(ProductService.removeProduct(scope.model[i].uuid, deletionCause)
                      .success(function () {
                        success++;
                      })
                      .error(function () {
                        ToastManager.error("Delete product failed");
                      }));
                  }
                }
                $q.all(promises).then(function () {
                  if (success > 0) {
                    var productWord = (success > 1) ? "products" : "product";
                    ToastManager.success(success + " " + productWord + " deleted");
                    scope.DeselectAll();
                    SearchService.search();
                  }
                });
              }
            };
          }
        }
      }
    };
  });

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
angular.module('DHuS-webclient').directive('searchBox', function ($window, $document, UIUtils, SearchBoxService, SearchService, SearchModel,
  AdvancedSearchService, CartMenuService, ConfigurationService, AdvancedFilterService, AuthenticationService, UserService, CartStatusService, OLMap) {

  var span = $('<span>').css('display', 'inline-block').css('word-break', 'break-all').appendTo('body').css('visibility', 'hidden');
  var SEARCH_BOX_ID = '#search-box-container',
    SUGGESTER_CLASS = '#ui-id-1',
    TOOLBAR_ID = '#dhus-toolbar-container',
    SEARCH_BOX_ID = '#search-box-container',
    SEARCH_BOX_DELTA = '10',
    SEARCH_BOX_MARGIN = 20;
  var resizeSearchBox = function () {
    var searchInput = $("#search-input");
    var SEARCH_BUTTONS_WIDTH = 150;
    UIUtils.responsiveLayout(
      function xs() {
        $(SEARCH_BOX_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2)) + 'px');
        $(SUGGESTER_CLASS).css('width', (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2)) + 'px !important');
      },
      function sm() {
        $(SEARCH_BOX_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2)) + 'px');
        $(SUGGESTER_CLASS).css('width', (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2)) + 'px !important');
      },
      function md() {
        if (!ApplicationService.settings.show_extended_list) {
          if (span.outerWidth() < ((parseInt(UIUtils.getScreenWidth()) * 0.5) - SEARCH_BUTTONS_WIDTH)) {
            $(SEARCH_BOX_ID).css('width', '50%');
            $(SUGGESTER_CLASS).css('width', (parseInt(UIUtils.getScreenWidth()) * 0.5 - (SEARCH_BOX_MARGIN * 2)) + 'px !important');
          }
          else {
            var barLength = parseInt(span.outerWidth()) + SEARCH_BUTTONS_WIDTH;
            if (barLength > (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2))) {
              $(SEARCH_BOX_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2)) + 'px');
            }
            else {
              $(SEARCH_BOX_ID).css('width', (parseInt(span.outerWidth() + SEARCH_BUTTONS_WIDTH)) + 'px');
            }
          }
        }
        else {
          $(SEARCH_BOX_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2)) + 'px');
        }
      },
      function lg() {
        if (!ApplicationService.settings.show_extended_list) {
          if (span.outerWidth() < ((parseInt(UIUtils.getScreenWidth()) * 0.4) - SEARCH_BUTTONS_WIDTH)) {
            $(SEARCH_BOX_ID).css('width', '40%');
            $(SUGGESTER_CLASS).css('width', (parseInt(UIUtils.getScreenWidth()) * 0.4 - (SEARCH_BOX_MARGIN * 2)) + 'px !important');
          }
          else {
            var barLength = parseInt(span.outerWidth()) + SEARCH_BUTTONS_WIDTH;
            if (barLength > (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2))) {
              $(SEARCH_BOX_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2)) + 'px');
            }
            else {
              $(SEARCH_BOX_ID).css('width', (parseInt(span.outerWidth() + SEARCH_BUTTONS_WIDTH)) + 'px');
            }
          }
        }
        else {
          $(SEARCH_BOX_ID).css('width', (parseInt(UIUtils.getScreenWidth()) - (SEARCH_BOX_MARGIN * 2)) + 'px');
        }
      }
    );

    var top = (parseInt($(TOOLBAR_ID).height()) + parseInt(SEARCH_BOX_DELTA)) + 'px';
    $(SEARCH_BOX_ID).css('top', top);
  };

  return {
    restrict: 'AE',
    replace: true,
    templateUrl: 'components/search-box/view.html',
    scope: {
      text: "="
    },

    compile: function (tElem, tAttrs) {
      return {
        pre: function (scope, iElem, iAttrs) {
          scope.solrindexes = "";
          scope.showcart = false;
        },
        post: function (scope, iElem, iAttrs) {
          scope.$watch('model.textQuery', function (query) {
            span.text(query);
            resizeSearchBox();
          });
          if (!ConfigurationService.isLoaded()) {
            ConfigurationService.getConfiguration().then(function (data) {
              // promise fulfilled
              if (data) {
                ApplicationService = data;
                if (ApplicationService.settings.showcart)
                  scope.showcart = ApplicationService.settings.showcart;
                if (ApplicationService.settings.search_max_length)
                  SearchService.setSearchMaxLength(ApplicationService.settings.search_max_length);
                resizeSearchBox();
              } else {
              }
            }, function (error) {
            });
          } else {
            if (ApplicationService.settings.search_max_length)
              SearchService.setSearchMaxLength(ApplicationService.settings.search_max_length);
            if (ApplicationService.settings.showcart)
              scope.showcart = ApplicationService.settings.showcart;
          }

          $('#search-input').autocomplete({
            source: scope.solrindexes,
            delay: 500    // default 300
          });

          SearchService.setClearSearchInput(function () { scope.clearSearchInput(); });
          SearchService.setClearGeoSelection(function () { scope.clearGeoSelection(); });
          scope.advancedSearchButtonActive = false;
          scope.cartStatus = false;

          scope.showCartMenu = function () {
            if (!AuthenticationService.logged) return;

            // OLMap.toggleActivedSelection();
            CartMenuService.show();
            scope.cartMenuButtonActive = true;
            scope.cartStatus = true;
          };

          scope.hideAdvancedMenu = function () {
            CartMenuService.hide();
            scope.cartMenuButtonActive = false;
            scope.cartStatus = false;
          };

          scope.toggleAdvancedMenu = function () {
            if (AdvancedSearchService.model.hidden) AdvancedSearchService.show();
            else AdvancedSearchService.hide();
          };

          scope.toggleMenuCart = function () {
            if (UserService.model === null) {
              UserDetailsManager.getUserDetails();
              return;
            }
            if (CartMenuService.model.hidden) {
              CartMenuService.show();
            }
            else {
              CartMenuService.hide();
            }
          };

          var debounced = _.debounce(function (event) {
            // ignore left and right buttons
            if (event.keyCode == 37 || event.keyCode == 39 || AuthenticationService.logged == false) return;
            if (scope.model.textQuery) {
              SearchService.getSuggestions(scope.model.textQuery).then(function (result) {
                if (result) {
                  resizeSearchBox();
                  result = result.split('\r\n');
                  scope.solrindexes = result;
                  $('#search-input').autocomplete({
                    source: scope.solrindexes,
                    delay: 500
                  });
                }
              });
            }
          }, 800);
          scope.getSuggestions = debounced;

          scope.clearSearchInput = function () {
            scope.model.textQuery = "";
            SearchService.setTextQuery(scope.model.textQuery);
          };

          scope.clearGeoSelection = function () {
            scope.model.geoselection = "";
            SearchService.setGeoselection(scope.model.geoselection);
            SearchModel.clearMap();
          };

          scope.saveSearch = function () {
            //check session for save search API
            if (CartStatusService.getCartActive()) {
              ToastManager.error("Save user search disabled when cart mode");
              return;
            }

            if (UserService.model == null) {
              UserDetailsManager.getUserDetails();
              return;
            }
            SearchService.saveUserSearch(SearchBoxService.model.textQuery,
              SearchBoxService.model.geoselection,
              SearchBoxService.model.advancedFilter,
              SearchBoxService.model.missionFilter)
              .then(function (result) {
                if (result.status == 200)
                  ToastManager.success("User search saved successfully");
              }, function (result) {
                if (AuthenticationService.logged)
                  ToastManager.error("Save user search operation failed");
              });
          };

          scope.showClear = function () {
            $('.clear-button').css('display', 'block');
          };

          scope.hideClear = function () {
            setTimeout(function () {
              $('.clear-button').css('display', 'none');
            }, 300);
          };

          scope.clearFilter = function () {
            scope.model.textQuery = "";
            scope.model.sortedby = "";
            scope.model.order = "";
            SearchService.setTextQuery(scope.model.textQuery);
            SearchService.clearGeoSelection();
            SearchService.setSortedBy(scope.model.sortedby);
            SearchService.setOrder(scope.model.order);
            AdvancedFilterService.clearAdvancedFilter();
            AdvancedSearchService.clearAdvFilter();
            CartMenuService.clearAdvFilter();
            $('#advanced-search-icon').removeClass('glyphicon-filter colored').addClass('glyphicon-menu-hamburger');
            $('.clear-button').css('display', 'none');
          };

          scope.search = function () {
            //Search not allowed when cart is on
            if (CartStatusService.getCartActive()) {
              ToastManager.error("Search Disabled when cart is active");
              return;
            }

            //If user model is null, show the login form panel
            if (UserService.model == null) {
              UserDetailsManager.getUserDetails();
              return;
            } else {
              var query = $('#search-input').text();
              SearchService.setTextQuery(scope.model.textQuery);
              SearchService.setGeoselection(scope.model.geoselection); // todo: refactor setting by map
              SearchService.setOffset(0);
              SearchService.search();
              setTimeout(function () {
                AdvancedSearchService.hide();
                CartMenuService.hide();
              }, 100);
            }
          };

          //Open Cart Panel after 1 second if selecting form menu after entering any of the statuses
          if (CartStatusService.getIsUserDialog() === true) {
            setTimeout(function () {
              scope.showCartMenu();
            }, 1000);
          }

          iElem.bind("keypress", function (event) {
            if (event.which === 13) {
              scope.search();
            }
          });

          $('#search-button').click(function () { });
          angular.element($window).bind('resize', function () { $('#search-input').blur(); resizeSearchBox(); });
          angular.element($document).ready(resizeSearchBox);
          scope.model = SearchBoxService.model;
          scope.ad = {};
          scope.ad.advancedSearchBoxHidden = AdvancedSearchService.model.hidden;
          if (SearchBoxService.model.advancedFilter.trim() != '' ||
            SearchBoxService.model.missionFilter.trim() != '') {
            $('#advanced-search-icon').removeClass('glyphicon-menu-hamburger').addClass('glyphicon-filter colored');
          }
        }
      };
    }
  };
})

  .factory('SearchBoxService', function () {
    return {
      model: {
        textQuery: '',
        list: '',
        geoselection: '',
        offset: 0,
        pagesize: 25,
        advancedFilter: '',
        missionFilter: '',
        sortedby: '',
        order: ''
      }
    };
  });

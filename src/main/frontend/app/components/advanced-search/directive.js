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
var fileToUpload;

angular.module('DHuS-webclient').directive('shapefileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.shapefileModel);
            var modelSetter = model.assign;
            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope, element[0].files[0]);
                    fileToUpload = element[0].files[0];
                });
            });
        }
    };
}]);

angular.module('DHuS-webclient').directive('advancedSearch', function ($window, $document, CartMenuService, UIUtils, AdvancedSearchService, SearchService,
    SearchModel, SearchBoxService, AdvancedFilterService, ConfigurationService, OLMap, $timeout) {
    var ADVANCED_SEARCH_CONTAINER = '#advanced-search-container',
        TOOLBAR_ID = '#dhus-toolbar-container',
        SEARCH_BOX_ID = '#search-box-container',
        LIST_ID = '#list-container',
        LIST_BOX_DELTA = '30',
        LIST_BOX_TOP_MARGIN = '10',
        LIST_SWITCH_ID = "#show-list-button",
        LIST_BOX_MARGIN = 20,
        SEARCH_BOX_DELTA = '15',
        HEIGHT_MARGIN = 20;
    var MAX_SHAPE_FILE_SIZE = 5242880;
    var MAX_SHAPE_FILE_SIZE_MESSAGE = "Your shapefile cannot be uploaded because it is too large. Shapefiles must be no larger than 5.00 MB.";

    AdvancedSearchService.model.hidden = true;

    var resizeAdvancedSearch = function () {
        UIUtils.responsiveLayout(
            function xs() {
                $(ADVANCED_SEARCH_CONTAINER).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');

                if (AdvancedSearchService.model.hidden) {
                    $(ADVANCED_SEARCH_CONTAINER).css('left', ('-' + parseInt($(ADVANCED_SEARCH_CONTAINER).width() + 20) + 'px'));
                }
            },
            function sm() {
                $(ADVANCED_SEARCH_CONTAINER).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
                if (AdvancedSearchService.model.hidden) {
                    $(ADVANCED_SEARCH_CONTAINER).css('left', ('-' + parseInt($(ADVANCED_SEARCH_CONTAINER).width() + 20) + 'px'));
                }
            },
            function md() {
                if (!ApplicationService.settings.show_extended_list)
                    $(ADVANCED_SEARCH_CONTAINER).css('width', 'calc(50% - 40px)');
                else
                    $(ADVANCED_SEARCH_CONTAINER).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');
                if (AdvancedSearchService.model.hidden) {
                    $(ADVANCED_SEARCH_CONTAINER).css('left', ('-' + parseInt($(ADVANCED_SEARCH_CONTAINER).width() + 20) + 'px'));
                }
            },
            function lg() {
                if (!ApplicationService.settings.show_extended_list)
                    $(ADVANCED_SEARCH_CONTAINER).css('width', 'calc(40% - 40px)');
                else
                    $(ADVANCED_SEARCH_CONTAINER).css('width', (parseInt(UIUtils.getScreenWidth()) - (LIST_BOX_MARGIN * 2)) + 'px');

                if (AdvancedSearchService.model.hidden) {
                    $(ADVANCED_SEARCH_CONTAINER).css('left', ('-' + parseInt($(ADVANCED_SEARCH_CONTAINER).width() + 20) + 'px'));
                }
            }
        );
        var top, height;
        if ($(SEARCH_BOX_ID) && $(SEARCH_BOX_ID).position()) {
            top = (parseInt($(SEARCH_BOX_ID).height()) + parseInt(LIST_BOX_TOP_MARGIN) + parseInt($(SEARCH_BOX_ID).position().top));
            $(ADVANCED_SEARCH_CONTAINER).css('top', top);
            height = (parseInt(UIUtils.getScreenHeight()) - top - parseInt(LIST_BOX_DELTA) - parseInt(LIST_BOX_TOP_MARGIN));

            $(ADVANCED_SEARCH_CONTAINER).css('height', height + 'px');
        }
    };


    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'components/advanced-search/view.html',
        scope: {
            text: "="
        },
        expandedAdvancedSearch: false,
        compile: function (tElem, tAttrs) {
            var self = this;
            return {
                pre: function (scope, iElem, iAttrs) {

                    scope.showingestionfilter = ApplicationService.settings.showingestionfilter;
                    scope.showsensingfilter = ApplicationService.settings.showsensingfilter;
                    scope.enable_shapefile = ApplicationService.settings.enable_shapefile;
                    scope.shapefile_description = (ApplicationService.settings.shapefile_description) ? ApplicationService.settings.shapefile_description : "You can also drag & drop the shapefile on map. Only files with extension .shp are supported. Shapefiles are limited to one record of type POLYGON and must be no larger than 5.00 MB.";

                    var span = document.createElement('div');
                    if ('draggable' in span || ('ondragstart' in span && 'ondrop' in span)) {
                        scope.isdragsupported = true;
                    }
                    scope.showSortMessage = false;
                    scope.sortmessage = {};
                },
                post: function (scope, iElem, iAttrs) {
                    scope.toggleButtonClass = "glyphicon glyphicon-resize-full";
                    scope.toggleExpandTitle = "Expand AdvancedSearch";

                    SearchModel.sub(self);


                    scope.model = SearchService.filterContext;
                    AdvancedSearchService.setClearAdvFilter(function () { scope.clearAdvFilter() });

                    self.createdSearchModel = function () {
                        scope.doneRequest = SearchService.doneRequest;
                    };

                    var utcDateConverter = function (date) {
                        var result = date;
                        if (date != undefined) {
                            var day = moment(date).get('date');
                            var month = moment(date).get('month');
                            var year = moment(date).get('year');
                            var utcDate = moment(year + "-" + (parseInt(month) + 1) + "-" + day + " 00:00 +0000", "YYYY-MM-DD HH:mm Z"); // parsed as 4:30 UTC
                            result = utcDate;
                        }

                        return result;
                    };

                    scope.updateFilter = function () {
                        scope.model.sortFilter = (scope.sortmessage.selected) ? scope.sortfilter : '';
                        var advancedFilter = {
                            sensingPeriodFrom: utcDateConverter(scope.model.sensingPeriodFrom),
                            sensingPeriodTo: utcDateConverter(scope.model.sensingPeriodTo),
                            ingestionFrom: utcDateConverter(scope.model.ingestionFrom),
                            ingestionTo: utcDateConverter(scope.model.ingestionTo),
                            sortFilter: scope.model.sortFilter,
                        };


                        // update advanced filter for save search
                        AdvancedSearchService.setAdvancedSearchFilter(advancedFilter, scope.model);
                        SearchBoxService.model.advancedFilter = AdvancedSearchService.getAdvancedSearchFilter();
                        // SearchBoxService.model.hasSortFilter = scope.sortmessage.selected;
                        // SearchBoxService.model.sortMessage = scope.sortMessage;

                        //SearchService.setAdvancedFilter(AdvancedSearchService.getAdvancedSearchFilter(advancedFilter, scope.model));
                        SearchService.setAdvancedFilter(SearchBoxService.model.advancedFilter);

                    };

                    scope.loadSettings = function () {
                        scope.showingestionfilter = ApplicationService.settings.showingestionfilter;
                        scope.showsensingfilter = ApplicationService.settings.showsensingfilter;
                        scope.enable_shapefile = ApplicationService.settings.enable_shapefile;

                        scope.model.options = ApplicationService.settings.sortOptions;
                        if (!scope.model.sortedby) {
                            scope.model.sortedby = scope.model.options[0].value;
                            SearchService.setSortedBy(scope.model.options[0].value)
                            SearchService.setSortedName(scope.model.options[0].name);
                        }
                        scope.model.orderOptions = ApplicationService.settings.orderOptions;
                        if (!scope.model.order) {
                            scope.model.order = scope.model.orderOptions[0].value;
                            SearchService.setOrder(scope.model.orderOptions[0].value);
                            SearchService.setOrderName(scope.model.orderOptions[0].name);
                        }
                        scope.showtoggle = !ApplicationService.settings.show_extended_list;
                    };

                    /*scope.$watch('model.sensingPeriodFrom', updateFilter);
                    scope.$watch('model.sensingPeriodTo', updateFilter);
                    scope.$watch('model.ingestionFrom', updateFilter);
                    scope.$watch('model.ingestionTo', updateFilter);*/

                    angular.element($window).bind('resize', function () {
                        resizeAdvancedSearch();
                    });

                    angular.element($document).ready(function () {
                        if (!ConfigurationService.isLoaded()) {
                            ConfigurationService.getConfiguration().then(function (data) {
                                if (data) {
                                    ApplicationService = data;
                                    if (ApplicationService.settings.shapefile_max_size &&
                                        ApplicationService.settings.shapefile_max_size_message) {
                                        MAX_SHAPE_FILE_SIZE = ApplicationService.settings.shapefile_max_size;
                                        MAX_SHAPE_FILE_SIZE_MESSAGE = ApplicationService.settings.shapefile_max_size_message;
                                    }
                                    if (ApplicationService.settings.shapefile_description) {
                                        scope.shapefile_description = ApplicationService.settings.shapefile_description;
                                    }
                                    scope.loadSettings();
                                } else {

                                }
                            }, function (error) {

                            });
                        } else {
                            if (ApplicationService.settings.shapefile_max_size &&
                                ApplicationService.settings.shapefile_max_size_message) {
                                MAX_SHAPE_FILE_SIZE = ApplicationService.settings.shapefile_max_size;
                                MAX_SHAPE_FILE_SIZE_MESSAGE = ApplicationService.settings.shapefile_max_size_message;
                            }
                            if (ApplicationService.settings.shapefile_description) {
                                scope.shapefile_description = ApplicationService.settings.shapefile_description;
                            }
                            scope.loadSettings();

                        }

                        resizeAdvancedSearch();
                    });

                    AdvancedSearchService.setHide(function () {
                        AdvancedSearchService.model.hidden = true;
                        $(ADVANCED_SEARCH_CONTAINER).animate({ left: ('-' + parseInt($(ADVANCED_SEARCH_CONTAINER).width() + 20) + 'px') }, 300);
                        if (SearchBoxService.model.advancedFilter.trim() != '' ||
                            SearchBoxService.model.missionFilter.trim() != '') {
                            $('#advanced-search-icon').removeClass('glyphicon-menu-hamburger').addClass('glyphicon-filter colored');
                        }
                    });

                    AdvancedSearchService.setShow(function () {
                        CartMenuService.hide();
                        AdvancedSearchService.model.hidden = false;
                        resizeAdvancedSearch();
                        $(ADVANCED_SEARCH_CONTAINER).animate({ left: '20px' }, 300);
                        $('#advanced-search-icon').removeClass('glyphicon-filter colored').addClass('glyphicon-menu-hamburger');
                        scope.sortedbyChange(true);
                        $('#advanced-search-content').scrollTop(0);
                    });


                    scope.today = function () {
                        scope.dt = new Date();
                    };
                    scope.today();

                    scope.clear = function () {
                        scope.dt = null;
                    };
                    scope.clearAdvFilter = function () {
                        scope.model.sensingPeriodFrom = null;
                        scope.model.sensingPeriodTo = null;
                        scope.model.ingestionFrom = null;
                        scope.model.ingestionTo = null;
                        scope.model.sortFilter = null;
                        scope.showSortMessage = false;
                        scope.sortmessage.selected = false;
                        scope.sortfilter = "";
                        scope.sortMessage = "";
                        scope.showCheckbox = false;
                        scope.disableAdvFilter = "";
                        scope.resetSortingToDefault();
                        $('#advanced-search-icon').removeClass('glyphicon-filter colored').addClass('glyphicon-menu-hamburger');
                        $('.clear-button').css('display', 'none');
                        scope.updateFilter();
                    };

                    scope.clearFilter = function () {
                        SearchService.clearSearchInput();
                        SearchService.clearGeoSelection();
                        AdvancedFilterService.clearAdvancedFilter();
                        AdvancedSearchService.clearAdvFilter();
                        $('#advanced-search-icon').removeClass('glyphicon-filter colored').addClass('glyphicon-menu-hamburger');
                        $('.clear-button').css('display', 'none');
                    };

                    scope.resetSortingToDefault = function () {
                        scope.model.sortedby = scope.model.options[0].value;
                        SearchService.setSortedBy(scope.model.options[0].value)
                        SearchService.setSortedName(scope.model.options[0].name);


                        scope.model.order = scope.model.orderOptions[0].value;
                        SearchService.setOrder(scope.model.orderOptions[0].value);
                        SearchService.setOrderName(scope.model.orderOptions[0].name);
                    };


                    scope.disabled = function (date, mode) {
                        return false;
                    };

                    function removeDayNamesInCalendar() {
                        setTimeout(function () {
                            var elements = [];
                            elements.push($('[aria-label="Thursday"]'))
                            elements.push($('[aria-label="Friday"]'))
                            elements.push($('[aria-label="Saturday"]'))
                            elements.push($('[aria-label="Sunday"]'))
                            elements.push($('[aria-label="Monday"]'))
                            elements.push($('[aria-label="Tuesday"]'))
                            elements.push($('[aria-label="Wednesday"]'))

                            for (var i = 0; i < elements.length; i++) {
                                elements[i] && elements[i].remove();
                            }

                        }, 0);
                    }


                    scope.openSensingPeriodFrom = function ($event) {
                        scope.lastOpenEvent = $event;
                        scope.status.openedSensingPeriodFrom = true;
                        removeDayNamesInCalendar();

                    };
                    scope.openSensingPeriodTo = function ($event) {
                        scope.lastOpenEvent = $event;
                        scope.status.openedSensingPeriodTo = true;
                        removeDayNamesInCalendar();
                    };
                    scope.openIngestionFrom = function ($event) {
                        scope.lastOpenEvent = $event;
                        scope.status.openedIngestionFrom = true;
                        removeDayNamesInCalendar();
                    };
                    scope.openIngestionTo = function ($event) {
                        scope.lastOpenEvent = $event;
                        scope.status.openedIngestionTo = true;
                        removeDayNamesInCalendar();
                    };
                    scope.dateOptions = {
                        formatYear: 'yy',
                        startingDay: 1
                    };

                    scope.formats = ['yyyy/MM/dd', 'dd-MMMM-yyyy', 'dd.MM.yyyy', 'shortDate'];
                    scope.format = scope.formats[0];

                    scope.status = {
                        opened: false
                    };

                    scope.sortedbyChange = function (preserve) {
                        /*
                        "show_checkbox": true,
                        "checkbox_checked": true,
                        "disable_filters": true
                        */

                        SearchService.setSortedBy(scope.model.sortedby);
                        if (!preserve)
                            scope.sortmessage.selected = false;

                        var itemValue = scope.model.sortedby;

                        var itemName = $.grep(scope.model.options, function (item) {
                            return item.value === itemValue;
                        })[0].name;

                        var itemMessage = $.grep(scope.model.options, function (item) {
                            return item.value === itemValue;
                        })[0].message;

                        var itemFilter = $.grep(scope.model.options, function (item) {
                            return item.value === itemValue;
                        })[0].filter;

                        var itemShowCheckbox = $.grep(scope.model.options, function (item) {
                            return item.value === itemValue;
                        })[0].show_checkbox;

                        var itemShowCkeckedCheckbox = $.grep(scope.model.options, function (item) {
                            return item.value === itemValue;
                        })[0].checkbox_checked;

                        var itemDisableAdvFilter = $.grep(scope.model.options, function (item) {
                            return item.value === itemValue;
                        })[0].disable_filters;

                        if (itemMessage) {
                            scope.showSortMessage = true;
                            scope.sortMessage = itemMessage;
                            scope.sortfilter = (itemFilter) ? itemFilter : "";
                            scope.showCheckbox = (itemShowCheckbox) ? true : false;
                            if (scope.showCheckbox) {
                                scope.sortmessage.selected = (itemShowCkeckedCheckbox) ? true : false;
                            } else {
                                scope.sortmessage.selected = true;
                            }
                            scope.disableAdvFilter = (itemDisableAdvFilter) ? "disabled" : "";
                        } else {
                            scope.showSortMessage = false;
                            scope.sortMessage = "";
                            scope.sortfilter = "";
                            scope.showCheckbox = false;
                            scope.disableAdvFilter = "";
                            scope.sortmessage.selected = false;
                        }

                        SearchService.setSortedName(itemName);
                        scope.updateFilter();
                    };

                    scope.orderbyChange = function () {
                        SearchService.setOrder(scope.model.order);
                        var orderValue = scope.model.order;
                        var orderName = $.grep(scope.model.orderOptions, function (ord) {
                            return ord.value === orderValue;
                        })[0].name;
                        SearchService.setOrderName(orderName);
                    }

                    var tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    var afterTomorrow = new Date();
                    afterTomorrow.setDate(tomorrow.getDate() + 2);


                    scope.getDayClass = function (date, mode) {
                        if (mode === 'day') {
                            var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

                            for (var i = 0; i < scope.events.length; i++) {
                                var currentDay = new Date(scope.events[i].date).setHours(0, 0, 0, 0);

                                if (dayToCheck === currentDay) {
                                    return scope.events[i].status;
                                }
                            }
                        }
                        return '';
                    };

                    scope.setIfSelectedFile = function () {
                        var namefile = document.querySelector('#shape-file-info').innerText;
                        if (namefile != "No file choosen") {
                            scope.isSelectedFile = true;
                        } else {
                            scope.isSelectedFile = false;
                        }
                    };

                    scope.uploadShapeFile = function () {

                        var file = fileToUpload;

                        var namefile = document.querySelector('#shape-file-info').innerText;
                        if (!namefile || namefile == "No file choosen") {
                            AlertManager.info("No file selected", "Only files with extension .shp are supported.");
                            return;
                        }
                        if (namefile && (namefile.toLowerCase().indexOf('.shp', namefile.length - 4)) == -1) {
                            AlertManager.info("Unsupported file", "Only files with extension .shp are supported.");
                        } else {
                            if (file.size > MAX_SHAPE_FILE_SIZE) {
                                AlertManager.info("File too large",
                                    MAX_SHAPE_FILE_SIZE_MESSAGE);
                            } else {
                                SpinnerManager.on();
                                OLMap.loadShapeFile(file);
                            }
                        }

                    };

                    scope.toggleExpandAdvancedSearch = function (isExpanded) {
                        if (isExpanded)
                            this.expandedAdvancedSearch = true;
                        else
                            this.expandedAdvancedSearch = !this.expandedAdvancedSearch;
                        if (this.expandedAdvancedSearch) {
                            $(ADVANCED_SEARCH_CONTAINER).css('width', 'calc(100% - 40px)');
                            scope.toggleButtonClass = "glyphicon glyphicon-resize-small";
                            scope.toggleExpandTitle = "Compact Advanced Search";
                        } else {
                            resizeAdvancedSearch();
                            scope.toggleButtonClass = "glyphicon glyphicon-resize-full";
                            scope.toggleExpandTitle = "Expand Advanced Search";
                        }
                    };

                    scope.closeAdvancedSearch = function () {
                        if (AdvancedSearchService.model.hidden) {
                            AdvancedSearchService.show();
                        }
                        else {
                            AdvancedSearchService.hide();
                        }
                    };
                }
            }
        }
    };
})

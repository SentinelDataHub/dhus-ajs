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
angular.module('DHuS-webclient').factory('SearchService',
function($q, $http, SearchModel, ProductCartService, AuthenticationService){
  return{
    textQuery: '',
    geoselection: '',
    advancedFilter: '',
    missionFilter:'',
    sortedby : '',
    sortedName:'',
    order:'',
    orderName:'',
    offset: 0,
    limit: 25,
    filterContext:{
      doneRequest: '',
      sensingPeriodFrom: '',
      sensingPeriodTo: '',
      ingestionFrom: '',
      ingestionTo: '',
      sortFilter: ''
    },
    collectionProductsModel: {list:[], count:0},
    collectionAllProductsModel: {list:[]},
    search_max_length: 5000,

    goToPage: function(){

    },
    getTextQuery: function(){
      return this.textQuery;
    },
    setTextQuery: function(textQuery){
      this.textQuery = textQuery;
    },
    setSortedBy: function(sortedby){
      this.sortedby = sortedby;
    },
    getSortedBy: function(){
      return this.sortedby;
    },
    setSortedName: function(sortedName){
      this.sortedName = sortedName;
    },
    getSortedName: function(e){
      return this.sortedName;
    },
    setOrder: function(order){
      this.order = order;
    },
    getOrder: function(){
        return this.order;
    },
    setOrderName: function(orderName){
      this.orderName = orderName;
    },
    getOrderName: function(e){
      return this.orderName;
    },
    setGeoselection: function(geoselection){
      this.geoselection = geoselection;
    },
    setAdvancedFilter: function(advancedFilter){
      this.advancedFilter = advancedFilter;
    },
    setMissionFilter: function(missionFilter){
      this.missionFilter = missionFilter;
    },
    setOffset: function(offset){
      this.offset = offset;
    },
    setLimit: function(limit){
      this.limit = limit;
    },
    setErrorMessage: function(error_message){
      this.error_message = error_message;
    },
    setErrorTitle: function(error_title){
      this.error_title = error_title;
    },
    setSearchMaxLength: function(maxlength) {
      this.search_max_length = maxlength;
    },

    //GET GEOQUERY COORDS
    getGeoQueryByCoordsOld: function(coords){
        if(!coords) return;
        var query = "(footprint:\"Intersects(POLYGON((";
        for(var i = 0; i < coords.length; i++) query += coords[i].lon + " " + coords[i].lat + ((i != (coords.length - 1))?",":"");
        query +=")))\")";

        return query;
   },

    //CREATE SEARCH REQUEST
    createSearchRequest: function(filter, offset, limit, sortedby, order){
        var searchUrl = "api/stub/products?filter=:filter&offset=:offset&limit=:limit&sortedby=:sortedby&order=:order";
        searchUrl = searchUrl.replace(":filter", (filter)?filter:'*');
        searchUrl = searchUrl.replace(":offset", (offset)?offset:'0');
        searchUrl = searchUrl.replace(":limit", (limit)?limit:'10');
        searchUrl = searchUrl.replace(":sortedby", (sortedby)?sortedby:'ingestiondate');
        searchUrl = searchUrl.replace(":order", (order)?order:'desc');
        this.doneRequest = filter;
        return searchUrl;
   },

    //CREATE SEARCH FILTER
    createSearchFilter: function(textQuery,geoselection, advancedFilter, missionFilter){
        var searchFilter='';
        if(textQuery) searchFilter += textQuery;
        if(geoselection) searchFilter += ((textQuery)?' AND ':'') + this.getGeoQueryByCoords(geoselection);
        if(advancedFilter) searchFilter += ((textQuery || geoselection) ? ' AND ': '') + advancedFilter;
        if(missionFilter) searchFilter += ((textQuery || geoselection || advancedFilter) ? ' AND ': '') + '(' + missionFilter + ')';

        return searchFilter;
   },

    //SAVE USER SEARCH
    saveUserSearch: function(textQuery,geoselection, advancedFilter, missionFilter){
        var filter = '', self = this;
        filter = this.createSearchFilter(textQuery, geoselection, advancedFilter, missionFilter);
        var saveSearchUrl = 'api/stub/users/0/searches?complete=:complete';
        saveSearchUrl = saveSearchUrl.replace(":complete", (filter)?filter:'*');

        return http({
            url: ApplicationConfig.baseUrl + saveSearchUrl,
            method: "POST"})

            .then(function(response) {                
                return (response.status == 200)?response:[];
            },function(response){
                if(response.status == 401) {
                    AuthenticationService.refresh(); //calls a service to reload page
                    var defer = $q.defer();
                    defer.resolve(false);    
                } else 
                    ToastManager.error("Save user search operation failed");                        
            });
    },

    //CLEAR SEARCH INPUT
    clearSearchInput: function(){},

    //SET CLEAR SEARCH INPUT
    setClearSearchInput: function(method){
        this.clearSearchInput = method;
    },

    //CLEAR SEARCH INPUT
    clearGeoSelection: function(){},

    //SET CLEAR SEARCH INPUT
    setClearGeoSelection: function(method){
        this.clearGeoSelection = method;
    },

    //SEARCH
    search: function(query){
        var self = this;
        var filter = '';
        if(query)
            filter = self.createSearchFilter(query, '', '', '');
        else
            filter = self.createSearchFilter(self.textQuery, self.geoselection,
            self.advancedFilter, self.missionFilter);
        var request = ApplicationConfig.baseUrl + self.createSearchRequest(filter, self.offset, self.limit, self.sortedby, self.order)

        if(request.length > self.search_max_length) {
            AlertManager.error("Error processing request", "Your request cannot be processed by the server because exceeds the allowed length of "+ self.search_max_length +" characters.");
            return ;
        }

        return $http({
            url: request,
            method: "GET"})

            .then(function(result){
                SearchModel.model.count = result.data.totalresults;
                SearchModel.model.list=result.data.products;
                // console.warn('201 SEARCH MODEL LIST ', SearchModel.model.list);
                ProductCartService.getIdsInCart()

            .success(function(result){
                SearchModel.model.cartids = result;
                SearchModel.createModel(SearchModel.model);
                
            })

            .error(function(){
                AlertManager.error("Error while retrieving cart");
                SearchModel.createModel(SearchModel.model);
            });
        },

        function(response){

          switch (response.status){
            case 401:

                AuthenticationService.refresh(); //calls a service to reload page
                var defer = $q.defer();
                defer.resolve(false);
                break;

            case 400:
                var error_title = (self.error_title) ? self.error_title : "Invalid request";
                var error_message = (self.error_message) ? self.error_message : "Your request cannot be processed by the server. Please check the request's parameters.";
                AlertManager.error(error_title, error_message);
                break;

             default:
                AlertManager.error("Error retrieving products", "Your request cannot be processed by the server. Please check the request's parameters.");
          }
        });
    },

    //GO TO PAGE
    gotoPage: function(pageNumber){
        this.setOffset((pageNumber * this.limit) - this.limit);
        return this.search();
    },

    //GET SUGGESTIONS
    getSuggestions: function(query){
        var suggesturl = 'search/suggest/'+query;

        return http({
            url: ApplicationConfig.baseUrl + suggesturl,
            method: "GET"})

            .then(function(response) {
                return (response.status == 200)?response.data:[];
            });
    },

    //GET GEOQUERY COORDS
    getGeoQueryByCoords: function(query){
      return query;
    },

    //GET COLLECTION PRODUCTS LIST
    getCollectionProductsList: function(query, offset, limit){
        var self = this;

        return $http({
            url: ApplicationConfig.baseUrl + self.createSearchRequest(query, offset, limit),
            method: "GET"})

            .then(function(result){
                self.collectionProductsModel.list=result.data.products;
                self.collectionProductsModel.count=result.data.totalresults;
            },

            function(response){

                switch (response.status){
                            case 401:
                                var defer = $q.defer();
                                defer.resolve(false);
                                break;

                            case 400:
                                var error_title = (self.error_title) ? self.error_title : "Invalid request";
                                var error_message = (self.error_message) ? self.error_message : "Your request cannot be processed by the server. Please check the request's parameters.";
                                AlertManager.error(error_title, error_message);
                                break;

                             default:
                                AlertManager.error("Error retrieving products", "Your request cannot be processed by the server. Please check the request's parameters.");
                          }
      });
    },

    //GET ALL COLLECTION PRODUCTS
    getAllCollectionProducts: function(query, offset, limit){
        var self = this;
        return $http({
            url: ApplicationConfig.baseUrl + self.createSearchRequest(query, offset, limit),
            method: "GET"})

            .then(function(result){
                self.collectionAllProductsModel.list=result.data;
            });
    },
  };
});

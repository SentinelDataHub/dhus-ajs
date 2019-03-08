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


var ProductService = {
	getNode: function(productUrl){		
        var self = this;         
        return http({
            url: (productUrl).replace((new RegExp("'", 'g')),"%27")+'Nodes',
            method: "GET"            
        });               
	},
	getElement: function(nodeurl){
		return http({
            url: nodeurl,
            type: "GET"                   
        }); 
	},
    removeProduct: function(productUUid, deletionCause){     
        var queryString = (deletionCause) ? "?cause="+deletionCause : "";   
        return http({
            url: ApplicationConfig.baseUrl + "odata/v1/Products('"+productUUid+"')"+queryString,
            method: "DELETE"                   
        });  
    },
    getGranule: function(granuleUrl){     
        return http({
            url: ApplicationConfig.baseUrl + granuleUrl,
            method: "GET"                   
        });  
    },
    getTCI: function(tciUrl){     
        return http({
            url: ApplicationConfig.baseUrl + tciUrl,
            method: "HEAD"                   
        });  
    },
    getProductHeader: function(requestUrl){   
        return http({
            url: requestUrl,
            method: "HEAD"//,
            //headers: {'Cache-Control': 'no-cache, no-cache, no-cache'}  //NOT NEEDED                
        });  
    },
    getProduct: function(requestUrl){   
        return http({
            url: requestUrl,
            method: "GET"                   
        });  
    }
};
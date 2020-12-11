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
    },
    getLTAProduct: function(requestUrl){   
        return http({
            url: requestUrl,
            method: "POST"                   
        });  
    },

    //Perform a get request froma a specific url
    getOrder: function(data){
        var order = {};
        order.id = data.Id;
        order.status = data.Status;
        order.estimatedTime = data.EstimatedTime;
        order.submissionTime = data.SubmissionTime;
        order.statusMessage = data.StatusMessage;
        return order;
    },

    submitOnDemandRequest: function(productUuid) {
        return http({
            url: ApplicationConfig.baseUrl + "odata/v2/Products('"+productUuid+"')/OData.DHuS.TransformProduct",
            method: "POST",
            contentType: 'application/json',
            data: JSON.stringify({"TransformerName": "L2AOnDemand"}),
            headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            }
        });
    },

    getProductOut: function(transformationUuid) {
        return http({
            url: ApplicationConfig.baseUrl + "odata/v2/Transformations('"+transformationUuid+"')/Product?$select=Id,Name",
            method: "GET",
            contentType: 'application/json',
            headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
            }
        });
    }


};
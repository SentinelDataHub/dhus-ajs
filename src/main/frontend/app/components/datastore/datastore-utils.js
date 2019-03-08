/* 
 * Data HUb Service (DHuS) - For Space data distribution.
 * Copyright (C) 2013,2014,2015,2016-2017-2018-2019 European Space Agency (ESA)
 * Copyright (C) 2013,2014,2015,2016-2017-2018-2019 GAEL Systems
 * Copyright (C) 2013,2014,2015,2016-2017-2018-2019 Serco Spa
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
var DatastoreUtils = {
  getDatastoreTypeFromOdata: function (odataDatastoreType) {
    var ret = {};
    switch (odataDatastoreType) {
      case "#OData.DHuS.OpenStackDataStore":
        ret = "Open Stack Data Store";
        break;
      case "#OData.DHuS.HFSDataStore":
        ret = "HFS Data Store";
        break;
      case "#OData.DHuS.RemoteDHuSDataStore":
        ret = "DHuS Remote Data Store";
        break;
      case "#OData.DHuS.GMPDataStore":
        ret = "GMP Data Store";
        break;
      default:
        console.warn("cant identify Odata Datastore Type!!!", odataDatastoreType);
        break;
    }
    return ret;
  },

  getOdataFromDatastoreType: function (dataStoreType) {
    var ret = {};
    switch (dataStoreType) {
      case "Open Stack Data Store":
        ret = "#OData.DHuS.OpenStackDataStore";
        break;
      case "HFS Data Store":
        ret = "#OData.DHuS.HFSDataStore";
        break;
      case "DHuS Remote Data Store":
        ret = "#OData.DHuS.RemoteDHuSDataStore";
        break;
      case "GMP Data Store":
        ret = "#OData.DHuS.GMPDataStore";
        break;
      default:
        console.warn("cant identify Type!!!", dataStoreType);
        break;
    }
    return ret;
  }
};
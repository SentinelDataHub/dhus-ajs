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
angular.module('DHuS-webclient')

.directive('productDetails', function($q, $location, $document, $window,
    ProductDetailsModelService, SearchModel, ProductOLMap, ProductCartService) {
    var DEFAULT_QL_CONTAINER_HEIGHT = 320;
    return {
        restrict: 'AE',
        replace: true,
        templateUrl: 'components/product-details/view.html',
        scope: {
            text: "="
        },
        compile: function(tElem, tAttrs) {
            return {
                pre: function(scope, iElem, iAttrs) {},
                post: function(scope, iElem, iAttrs) {
                    scope.product = {};
                    scope.nextProdUuid = null;
                    scope.prevProdUuid = null;
                    scope.currentProdUuid = null;
                    scope.currentList = null;
                    scope.nextbutton = {};
                    scope.prevbutton = {};
                    scope.model = {};
                    scope.windows = {};

                    function Product(name, footprint, id) {
                        scope.product.name = name;
                        scope.product.footprint = footprint;
                        scope.product.id = id;
                    };

                    function init() {

                        ProductDetailsManager.setProductDetails(function(productId, productList, isCalledFromCart) { scope.getProductDetails(productId, productList, isCalledFromCart) });

                        scope.nextbutton.disabled = true;
                        scope.prevbutton.disabled = true;
                        scope.windows.map = true;
                        //scope.windows.oldmap=true;  //take old map show/hide status
                        scope.windows.quicklook = true;
                        scope.windows.attributes = true;
                        scope.windows.inspector = true;
                        scope.showquicklook = ApplicationService.settings.showquicklook;
                        scope.hideminimap = ApplicationService.settings.hideminimap;

                        $('#productView').on('shown.bs.modal', function(e) {
                            scope.showquicklook = ApplicationService.settings.showquicklook;
                            scope.hideminimap = ApplicationService.settings.hideminimap;
                            scope.$digest();
                            //console.log(scope.showquicklook);                           

                        });

                        $('#productView').on('hide.bs.modal', function(e) {
                            //scope.windows.oldmap=scope.windows.map; 
                            //scope.windows.map=true; 
                            if (!scope.isCalledFromCart)
                                SearchModel.selectProduct({ uuid: scope.currentProdUuid, sender: 'productDetails' });
                        });

                    };

                    scope.close = function() {
                        // SearchModel.selectProduct({ uuid: scope.currentProdUuid, sender: 'productDetails' });
                        SearchModel.OnSelectionChange();
                        $('#productView').modal('hide');
                    };

                    scope.downloadProduct = function() {
                        if (!scope.product.offline) {
                            window.location = scope.product.link;
                        } else {
                            var errMsg="Product " + scope.product.identifier + " is offline";
                            ProductService.getProduct(scope.product.link).then(function(response) {

                                if (response.status == 202) {
                                    if (scope.product.isincart) {
                                        AlertManager.success("Offline product retrieval initiated", "Offline product retrieval has been initiated. Please check again your Cart to know when it will be online.");
                                    } else {
                                        ProductCartService.addProductToCart(scope.product.cartid)
                                            .success(function() {
                                                AlertManager.success("Offline product retrieval initiated", "Offline product retrieval has been initiated and the product has been moved to Cart. Please check your Cart to know when it will be online.");
                                                scope.product.isincart = true;
                                            })
                                            .error(function() {
                                                AlertManager.warning("Offline product retrieval initiated", "Offline product retrieval has been initiated, but there was an error while adding product to cart. Please check again product list to know when it will be online.");
                                            });

                                    }
                                } else {
                                    (response.data && response.data.error && response.data.error.message && response.data.error.message.value) 
                                    ? errMsg = response.data.error.message.value : errMsg=errMsg;
                                    AlertManager.error("Product unavailable", errMsg);
                                }
                            }, function(response) {
                                (response.data && response.data.error && response.data.error.message && response.data.error.message.value) 
                                ? errMsg = response.data.error.message.value : errMsg=errMsg;
                                AlertManager.error("Product unavailable", errMsg);

                            }).catch(function(response) {
                                (response.data && response.data.error && response.data.error.message && response.data.error.message.value) 
                                ? errMsg = response.data.error.message.value : errMsg=errMsg;
                                AlertManager.error("Product unavailable", errMsg);
                            });
                        }
                    };

                    scope.downloadTCI = function() {
                        if (!scope.product.offline) {
                            window.location = scope.product.tci_link;
                        } else {
                            var errMsg="Product " + scope.product.identifier + " is offline";
                            ProductService.getProduct(scope.product.tci_link).then(function(response) {
                                if (response.status == 202) {
                                    if (scope.product.isincart) {
                                        AlertManager.success("Offline product retrieval initiated", "Offline product retrieval has been initiated. Please check again your Cart to know when it will be online.");
                                    } else {
                                        ProductCartService.addProductToCart(scope.product.cartid)
                                            .success(function() {
                                                AlertManager.success("Offline product retrieval initiated", "Offline product retrieval has been initiated and the product has been moved to Cart. Please check your Cart to know when it will be online.");
                                                scope.product.isincart = true;
                                            })
                                            .error(function() {
                                                AlertManager.warning("Offline product retrieval initiated", "Offline product retrieval has been initiated, but there was an error while adding product to cart. Please check again product list to know when it will be online.");
                                            });

                                    }
                                } else {
                                    (response.data && response.data.error && response.data.error.message && response.data.error.message.value) 
                                    ? errMsg = response.data.error.message.value : errMsg=errMsg;
                                    AlertManager.error("Product unavailable", errMsg);
                                }
                            }, function(response) {
                                (response.data && response.data.error && response.data.error.message && response.data.error.message.value) 
                                ? errMsg = response.data.error.message.value : errMsg=errMsg;
                                AlertManager.error("Product unavailable", errMsg);

                            }).catch(function(response) {
                                (response.data && response.data.error && response.data.error.message && response.data.error.message.value) 
                                ? errMsg = response.data.error.message.value : errMsg=errMsg;
                                AlertManager.error("Product unavailable", errMsg);
                            });
                        }
                    };

                    scope.showNextProduct = function() {
                        if (!scope.isCalledFromCart)
                            SearchModel.selectProduct({ uuid: scope.nextProdUuid, sender: 'productDetails' });
                        scope.getProductDetails(scope.nextProdUuid, null);
                    };

                    scope.showPrevProduct = function() {
                        if (!scope.isCalledFromCart)
                            SearchModel.selectProduct({ uuid: scope.prevProdUuid, sender: 'productDetails' });
                        scope.getProductDetails(scope.prevProdUuid, null);
                    };

                    scope.pad = function(n, width, z) {
                        z = z || '0';
                        n = n + '';
                        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
                    };

                    scope.getOrbitNumber = function(entry) {
                        var absOrbitNumber;
                        var product = _.findWhere(entry.indexes, { name: "product" });
                        if (product) {
                            var orbit = _.findWhere(product.children, { name: "Orbit number (start)" });
                            absOrbitNumber = (orbit) ? "A" + scope.pad(orbit.value, 6) : 'A000000';
                        }
                        return absOrbitNumber;
                    };

                    scope.getTCILink = function(entry) {
                        var tci_link = null;
                        var granule_link = "odata/v1/Products(%27" + entry.uuid + "%27)/Nodes(%27" +
                            entry.identifier + ".SAFE%27)/Nodes(%27GRANULE%27)/Nodes?$format=json";
                        var granule_name = "";
                        var s2L1CRegex = new RegExp("S2(A|B)_MSIL1C.*", "g");
                        var s2L2ARegex = new RegExp("S2(A|B)_MSIL2A.*", "g");
                        var deferred = $q.defer();
                        if (s2L1CRegex.test(entry.identifier)) {
                            //console.log('match1',entry.identifier);
                            ProductService.getGranule(granule_link).then(function(response) {
                                if (response.status == 200) {
                                    granule_name = (response.data && response.data.d.results[0]) ? response.data.d.results[0].Name : "";
                                    tci_link = "odata/v1/Products(%27" + entry.uuid + "%27)/Nodes(%27" +
                                        entry.identifier + ".SAFE%27)/Nodes(%27GRANULE%27)/Nodes(%27" +
                                        granule_name + "%27)/Nodes(%27IMG_DATA%27)/Nodes(%27" +
                                        entry.identifier.substring(38, 44) + "_" + entry.identifier.substring(11, 26) + "_TCI.jp2%27)";

                                     deferred.resolve(tci_link);

                                } else {
                                    console.error("unable to get granule information");
                                     deferred.reject(null);
                                }

                            }, function() {
                                console.error("unable to get granule information");
                                deferred.reject(null);
                            });


                            // tci_link = "odata/v1/Products(%27" + entry.uuid + "%27)/Nodes(%27" +
                            //     entry.identifier + ".SAFE%27)/Nodes(%27GRANULE%27)/Nodes(%27L1C_" +
                            //     entry.identifier.substring(38, 44) + "_" + scope.getOrbitNumber(entry) + "_" +
                            //     entry.identifier.substring(45, 60) + "%27)/Nodes(%27IMG_DATA%27)/Nodes(%27" +
                            //     entry.identifier.substring(38, 44) + "_" + entry.identifier.substring(11, 26) + "_TCI.jp2%27)"

                        } else if (s2L2ARegex.test(entry.identifier)) {
                            var TCI_prefix = (entry.productType == 'S2MSI2Ap') ? 'L2A_' : '';
                            ProductService.getGranule(granule_link).then(function(response) {
                                if (response.status == 200) {
                                    granule_name = (response.data && response.data.d.results[0]) ? response.data.d.results[0].Name : "";
                                    tci_link = "odata/v1/Products(%27" + entry.uuid + "%27)/Nodes(%27" +
                                        entry.identifier + ".SAFE%27)/Nodes(%27GRANULE%27)/Nodes(%27" +
                                        granule_name + "%27)/Nodes(%27IMG_DATA%27)/Nodes(%27R10m%27)/Nodes(%27" +
                                        TCI_prefix + entry.identifier.substring(38, 44) + "_" + entry.identifier.substring(11, 26) + "_TCI_10m.jp2%27)";
                                     deferred.resolve(tci_link);

                                } else {
                                    console.error("unable to get granule information");
                                     deferred.reject(null);
                                }

                            }, function() {
                                console.error("unable to get granule information");
                                 deferred.reject(null);
                            });                            

                        } else {
                             deferred.reject(null);
                        }
                        return deferred.promise;
                    }

                    scope.getProductDetails = function(prodid, model, isCalledFromCart) {
                        scope.currentProdUuid = prodid;
                        scope.product = {};

                        if (model) //not null only if model is changed
                        {
                            scope.currentList = model;
                            scope.products.list = model;
                        }
                        if (isCalledFromCart) {
                            scope.isCalledFromCart = true;
                        }
                        for (var i = 0; i < scope.currentList.length; i++) {
                            if (scope.currentList[i].uuid == prodid) {
                                var entry = scope.currentList[i];

                                var product = new Product();
                                product.id = entry.uuid;
                                product.cartid = entry.id;
                                product.title = entry.identifier;
                                product.hasQuicklook = entry.quicklook;
                                product.quicklook = ApplicationConfig.baseUrl + "odata/v1/Products('" + entry.uuid + "')/Products('Quicklook')/$value";
                                product.link = ApplicationConfig.baseUrl + "odata/v1/Products('" + entry.uuid + "')/$value";
                                product.alternative = ApplicationConfig.baseUrl + "odata/v1/Products('" + entry.uuid + "')/";
                                product.offline = entry.offline;
                                /*****************************************************************************/
                                /* MANAGE getTCI link in another way, since it returns a promise now 
                                /*****************************************************************************/
                                scope.product = product;
                                if ((i + 1) < scope.currentList.length) {

                                    scope.nextProdUuid = scope.currentList[i + 1].uuid;
                                    scope.nextbutton.disabled = false;
                                } else {
                                    scope.nextbutton.disabled = true;
                                };
                                if ((i - 1) >= 0) {
                                    scope.prevbutton.disabled = false;
                                    scope.prevProdUuid = scope.currentList[i - 1].uuid;
                                } else {

                                    scope.prevbutton.disabled = true;
                                };
                                if (!product.offline) {
                                    scope.getTCILink(entry).then(function(tci_link) {
                                        if (tci_link) {
                                            ProductService.getTCI(tci_link).then(function(response) {

                                                if (response && response.status == 200) {

                                                    scope.product.tci_link = ApplicationConfig.baseUrl + tci_link + "/$value";
                                                    scope.resizeQuicklook();
                                                    if (!$('#productView').hasClass('in'))
                                                        $('#productView').modal('show');
                                                }
                                            }, function() {
                                                scope.product.tci_link = null;
                                                scope.resizeQuicklook();
                                                if (!$('#productView').hasClass('in'))
                                                    $('#productView').modal('show');
                                            });

                                        } else {
                                            scope.product.tci_link = null;
                                            scope.resizeQuicklook();

                                            if (!$('#productView').hasClass('in'))
                                                $('#productView').modal('show');
                                        }

                                    }, function() {
                                        scope.product.tci_link = null;
                                        scope.resizeQuicklook();

                                        if (!$('#productView').hasClass('in'))
                                            $('#productView').modal('show');
                                    });
                                } else {
                                    scope.product.tci_link = null;
                                    scope.resizeQuicklook();

                                    if (!$('#productView').hasClass('in'))
                                        $('#productView').modal('show');
                                }

                            }
                        }

                    };

                    scope.resizeQuicklook = function() {

                        if (scope.showquicklook && scope.hideminimap) {
                          $('#carousel-container').outerHeight(DEFAULT_QL_CONTAINER_HEIGHT);
                          $('#noquicklook-container').outerHeight(DEFAULT_QL_CONTAINER_HEIGHT);
                        } else {
                          if(!scope.windows.map) return;
                          //console.log('resizeQuicklook');
                          $('#carousel-container').outerHeight($('#map-container').outerHeight());
                          $('#noquicklook-container').outerHeight($('#map-container').outerHeight());
                        }                        
                    }

                    scope.maximizeMap = function() {

                        ProductOLMap.initProductMap('productmap', { list: scope.products.list, uuid: scope.currentProdUuid })
                        scope.windows.map = !scope.windows.map;
                    }

                    init();
                    scope.products = ProductDetailsModelService.products;
                    angular.element($window).bind('resize', function() { scope.resizeQuicklook(); });
                }
            }
        }
    };
})

.factory('ProductDetailsModelService', function() {
    return {
        products: {
            list: ''
        }
    }
});

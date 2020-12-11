package fr.gael.dhus.server.http.webapp.stub.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.olingo.server.api.uri.queryoption.TopOption;
import org.apache.olingo.server.core.uri.queryoption.TopOptionImpl;
import org.dhus.api.JobStatus;
import org.dhus.olingo.v2.visitor.TransformationSQLVisitor;
import org.dhus.store.derived.DerivedProductStoreService;
import org.dhus.transformation.TransformationStatusUtil;
import org.geotools.gml2.GMLConfiguration;
import org.geotools.xml.Configuration;
import org.geotools.xml.Parser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import fr.gael.dhus.database.object.MetadataIndex;
import fr.gael.dhus.database.object.Order;
import fr.gael.dhus.database.object.Product;
import fr.gael.dhus.database.object.Transformation;
import fr.gael.dhus.database.object.User;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.MetadataIndexData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.OrderData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.ProductData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.ProductsData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.TransformationData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.UserData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.exceptions.ProductCartServiceException;
import fr.gael.dhus.server.http.webapp.stub.util.FootprintUtility;
import fr.gael.dhus.service.SecurityService;
import fr.gael.dhus.spring.context.ApplicationContextProvider;

@RestController
public class StubCartController
{
   private static Log logger = LogFactory.getLog(StubCartController.class);
   
   @Autowired
   private SecurityService securityService;

   @RequestMapping (value = "/users/{userid}/cart/{cartid}/addproduct",
      method = RequestMethod.POST)
   public void addProductToCart(@PathVariable (value = "userid") String userid,
      @PathVariable (value = "cartid") String cartid,
      @RequestParam (value = "productId", defaultValue = "") Long pId) 
         throws ProductCartServiceException
   {
      User user = securityService.getCurrentUser();
      fr.gael.dhus.service.ProductCartService productCartService =
         ApplicationContextProvider.getBean(
            fr.gael.dhus.service.ProductCartService.class);

      try
      {
         productCartService.addProductToCart(user.getUUID(), pId);
      }
      catch (Exception e)
      {
         e.printStackTrace();
         throw new ProductCartServiceException(e.getMessage());
      }
   }

   @RequestMapping (value = "/users/{userid}/cart/{cartid}/removeproduct",
      method = RequestMethod.POST)
   public void removeProductFromCart(@PathVariable (value = "userid") String userid,
      @PathVariable (value = "cartid") String cartid,
      @RequestParam (value = "productId", defaultValue = "") Long pId)
         throws ProductCartServiceException
   {
      User user = securityService.getCurrentUser();
      fr.gael.dhus.service.ProductCartService productCartService =
         ApplicationContextProvider.getBean(
            fr.gael.dhus.service.ProductCartService.class);
      try
      {
         productCartService.removeProductFromCart(user.getUUID(), pId);
      }
      catch (Exception e)
      {
         e.printStackTrace();
         throw new ProductCartServiceException(e.getMessage());
      }
   }

   @RequestMapping (value = "/users/{userid}/cart/{cartid}/getcartids",
      method = RequestMethod.GET)
   public List<Long> getProductsIdOfCart(@PathVariable (value = "userid") String userid,
      @PathVariable (value = "cartid") String cartid)
         throws ProductCartServiceException
   {

      User user = securityService.getCurrentUser();
      fr.gael.dhus.service.ProductCartService productCartService =
         ApplicationContextProvider.getBean(
            fr.gael.dhus.service.ProductCartService.class);
      try
      {
         return productCartService.getProductsIdOfCart(user.getUUID());
      }
      catch (Exception e)
      {
         e.printStackTrace();
         throw new ProductCartServiceException(e.getMessage());
      }
   }

	@RequestMapping(value = "/users/{userid}/carts/{cartid}", method = RequestMethod.GET)
	public ResponseEntity<?> getCart(@PathVariable(value = "userid") String userid,
			@PathVariable(value = "cartid") String cartid, @RequestParam(value = "offset", defaultValue = "") int start,
			@RequestParam(value = "count", defaultValue = "") int count) throws ProductCartServiceException {
		User user = securityService.getCurrentUser();
		fr.gael.dhus.service.ProductCartService productCartService = ApplicationContextProvider
				.getBean(fr.gael.dhus.service.ProductCartService.class);

		fr.gael.dhus.service.TransformationService transformationService = ApplicationContextProvider
				.getBean(fr.gael.dhus.service.TransformationService.class);

		try {
			ProductsData productList = new ProductsData();
			int transformationsCount = transformationService.countTransformationsOfUser(new TransformationSQLVisitor(null,null,null,null), user);
			TopOption topOption = new TopOptionImpl().setValue(transformationsCount);
			TransformationSQLVisitor visitor = new TransformationSQLVisitor(null,null,topOption,null);
			List<Transformation> transformations = transformationService.getTransformationsOfUser(visitor, user);
			
			logger.debug("transformations count is: " + transformationsCount);
			logger.debug("user is: " + user.getUsername() + ", with UUID: " + user.getUUID());
			int cartcount = productCartService.countProductsInCart(user.getUUID());
			productList.setTotalresults(transformations.size() + cartcount);
			productList.setTotalproducts(cartcount);
			List<Transformation> transformationsPage;
			if (transformations != null && transformations.isEmpty()) {
				logger.debug("No On-Demand requests found, getting products in cart...");
				productList.setProducts(getProductsOfCart(userid, cartid, start, count));

			} else {
				if (transformations.size() >= start + count) {
					// Product List contains just the Transformations
					logger.debug("Found " + transformations.size() + " On-Demand requests");
					transformationsPage = transformations.subList(start, start + count);
					logger.debug("Found " + transformationsPage.size() + " On-Demand requests in the current page");
					ArrayList<ProductData> productDataList = getProductsOfTransformations(transformationsPage);
					logger.debug("Setting products of transformations");
					productList.setProducts(productDataList);

				} else {
					logger.debug("start is  " + start);
					int currentPage = (int) Math.ceil((float)((float)(start+1) / (float) count));
					logger.debug("currentPage is (int) Math.ceil((start+1) / count) " + currentPage);
					
					if (start > transformations.size()) {
						logger.debug("Found " + transformations.size() + " On-Demand requests but none available in the current page");
						// no transformations available in the current page
						// get the remaining products in the cart
						int startIndex = (((currentPage - 1) * count)) - transformations.size();
						logger.debug("Getting " + startIndex + " to " + count + "products in the cart in the current page " + currentPage);						
						productList.setProducts(getProductsOfCart(userid, cartid, startIndex, count));
						

					} else {
						// get transformations
						transformationsPage = transformations.subList(start, transformations.size());
						logger.debug("Found " + transformationsPage.size() + " On-Demand requests in the current page");
						ArrayList<ProductData> productsDataList = getProductsOfTransformations(transformationsPage);
						// get remaining cart products for the current page
						productsDataList
								.addAll(getProductsOfCart(userid, cartid, 0, count - transformationsPage.size()));
						logger.debug("Setting remaining cart products in the current page");
						productList.setProducts(productsDataList);
					}

				}
			}
			return new ResponseEntity<>(productList, HttpStatus.OK);

		} catch (Exception e) {
			e.printStackTrace();
			throw new ProductCartServiceException(e.getMessage());
		}
	}

   
   public ArrayList<ProductData> getProductsOfCart(@PathVariable (value = "userid") String userid,
      @PathVariable (value = "cartid") String cartid,
      @RequestParam (value = "offset", defaultValue = "") int start,
      @RequestParam (value = "count", defaultValue = "")  int count)
         throws ProductCartServiceException
   {
      User user = securityService.getCurrentUser();
      fr.gael.dhus.service.ProductCartService productCartService =
         ApplicationContextProvider.getBean(
            fr.gael.dhus.service.ProductCartService.class);
      fr.gael.dhus.service.ProductService productService =
         ApplicationContextProvider.getBean(
            fr.gael.dhus.service.ProductService.class);
      fr.gael.dhus.service.OrderService orderService =
    	         ApplicationContextProvider.getBean(
    	            fr.gael.dhus.service.OrderService.class);
      final org.dhus.store.derived.DerivedProductStoreService derivedProductService = ApplicationContextProvider
				.getBean(org.dhus.store.derived.DerivedProductStoreService.class);	

      try
      {
         List<Product> products = productCartService.getProductsOfCart(
            user.getUUID(), start, count);
         ArrayList<ProductData> productDataList = new ArrayList<ProductData>();
         Configuration configuration = new GMLConfiguration();
      
         @SuppressWarnings ("unused")
         Parser parser = new Parser(configuration);

         if (products != null)
         {
            // logger.info("products not null");
            for (Product product : products)
            {
               if (product != null)
               {
                  // logger.info("product not null");
                  ProductData productData =
                     new ProductData(product.getId(), product.getUuid(),
                                     product.getIdentifier());

                  ArrayList<String> summary = new ArrayList<String>();
                  ArrayList<MetadataIndexData> indexes =
                     new ArrayList<MetadataIndexData>();

                  for (MetadataIndex index :
                       productService.getIndexes(product.getUuid()))
                  {
                     MetadataIndexData category =
                        new MetadataIndexData(index.getCategory(), null);
                     int i = indexes.indexOf(category);
                     if (i < 0)
                     {
                        category.addChild(new MetadataIndexData(index.getName(),
                           index.getValue()));
                        indexes.add(category);
                     }
                     else
                     {
                        indexes.get(i).addChild(
                           new MetadataIndexData(index.getName(), 
                              index.getValue()));
                     }

                     if ("summary".equals(index.getCategory()))
                     {
                        summary.add(index.getName() + " : " + index.getValue());
                        Collections.sort(summary, null);
                     }

                     if ("Instrument".equalsIgnoreCase(index.getName()))
                     {
                        productData.setInstrument(index.getValue());
                     }

                     if ("Product type".equalsIgnoreCase(index.getName()))
                     {
                        productData.setProductType(index.getValue());
                     }
                     if (index.getQueryable() != null && index.getQueryable().equalsIgnoreCase("footprint")) {
						      productData.setWkt(FootprintUtility.reprocessWkt(FootprintUtility.getOriginalWktFromGml(product
                              .getFootPrint())));
					}

                  }
                  if(productData.getWkt() == null && 
							product.getFootPrint() != null) {
						logger.info("no Wkt found, try to recompute...");
						productData.setWkt(FootprintUtility.getWktFromGml(product
								.getFootPrint()));
						// Set the Footprint if any
						productData.setFootprint(FootprintUtility
								.convertGMLToDoubleLonLat(product
										.getFootPrint()));			
					}
                  productData.setSummary(summary);
                  productData.setIndexes(indexes);

                  productData.setHasQuicklook(derivedProductService.hasDerivedProduct(product.getUuid(), DerivedProductStoreService.QUICKLOOK_TAG));
                  productData.setHasThumbnail(derivedProductService.hasDerivedProduct(product.getUuid(), DerivedProductStoreService.THUMBNAIL_TAG));
                  productData.setOffline(!product.isOnline());		
                  Order productOrder = orderService.getOrderByProductUuid(product.getUuid());						
                  if (productOrder != null && productOrder.getOrderId() != null) {
					String status = "RUNNING";
					String orderId = productOrder.getOrderId().getDataStoreName()+"-"+productOrder.getOrderId().getProductUuid();					
					try {
						status = productOrder.getStatus().name();
					} catch (Exception e) {
						logger.error("Exception thrown while getting order status name" + e.getMessage());
					}
					logger.info("Found order for product " + product.getIdentifier());
					OrderData orderData = new OrderData(orderId, 
							status,
							productOrder.getSubmissionTime(),
							productOrder.getEstimatedTime(),
                     productOrder.getStatusMessage());
					
					productData.setOrder(orderData);
				  } else {
					productData.setOrder(null);
			      }	
                  productDataList.add(productData);
               }
            }
         }
         return productDataList;
      }
      catch (Exception e)
      {
         e.printStackTrace();
         throw new ProductCartServiceException(e.getMessage());
      }
   }
   
	public ArrayList<ProductData> getProductsOfTransformations(List<Transformation> transformations)
			throws ProductCartServiceException {
		
		fr.gael.dhus.service.ProductService productService = ApplicationContextProvider
				.getBean(fr.gael.dhus.service.ProductService.class);
		final org.dhus.store.derived.DerivedProductStoreService derivedProductService = ApplicationContextProvider
				.getBean(org.dhus.store.derived.DerivedProductStoreService.class);

		try {
			ArrayList<ProductData> productDataList = new ArrayList<ProductData>();
			Configuration configuration = new GMLConfiguration();

			@SuppressWarnings("unused")
			Parser parser = new Parser(configuration);

			for (Transformation transformation : transformations) {
				Product product;
			    String odataStatus = TransformationStatusUtil.fromString(transformation.getStatus()).name();
			    logger.debug("odataStatus is " + odataStatus);
				if(odataStatus.equals(JobStatus.COMPLETED.toString()) && transformation.getProductOut() != null) {
					product = productService.getProduct(transformation.getProductOut());
				} else {
					product = productService.getProduct(transformation.getProductIn());					
				}
				
				if (product != null) {
					// logger.info("product not null");
					ProductData productData = new ProductData(product.getId(), product.getUuid(),
							product.getIdentifier());

					ArrayList<String> summary = new ArrayList<String>();
					ArrayList<MetadataIndexData> indexes = new ArrayList<MetadataIndexData>();

					for (MetadataIndex index : productService.getIndexes(product.getUuid())) {
						MetadataIndexData category = new MetadataIndexData(index.getCategory(), null);
						int i = indexes.indexOf(category);
						if (i < 0) {
							category.addChild(new MetadataIndexData(index.getName(), index.getValue()));
							indexes.add(category);
						} else {
							indexes.get(i).addChild(new MetadataIndexData(index.getName(), index.getValue()));
						}

						if ("summary".equals(index.getCategory())) {
							summary.add(index.getName() + " : " + index.getValue());
							Collections.sort(summary, null);
						}

						if ("Instrument".equalsIgnoreCase(index.getName())) {
							productData.setInstrument(index.getValue());
						}

						if ("Product type".equalsIgnoreCase(index.getName())) {
							productData.setProductType(index.getValue());
						}
						if (index.getQueryable() != null && index.getQueryable().equalsIgnoreCase("footprint")) {
							productData.setWkt(FootprintUtility
									.reprocessWkt(FootprintUtility.getOriginalWktFromGml(product.getFootPrint())));
						}

					}
					if (productData.getWkt() == null && product.getFootPrint() != null) {
						logger.info("no Wkt found, try to recompute...");
						productData.setWkt(FootprintUtility.getWktFromGml(product.getFootPrint()));
						// Set the Footprint if any
						productData.setFootprint(FootprintUtility.convertGMLToDoubleLonLat(product.getFootPrint()));
					}
					productData.setSummary(summary);
					productData.setIndexes(indexes);

					productData.setHasQuicklook(derivedProductService.hasDerivedProduct(product.getUuid(),
							DerivedProductStoreService.QUICKLOOK_TAG));
					productData.setHasThumbnail(derivedProductService.hasDerivedProduct(product.getUuid(),
							DerivedProductStoreService.THUMBNAIL_TAG));
					productData.setOffline(!product.isOnline());

					TransformationData transformationData = new TransformationData();
					transformationData.setId(transformation.getUuid());
					transformationData.setProductIn(transformation.getProductIn());
					transformationData.setProductOut(transformation.getProductOut());
					transformationData.setResultUrl(transformation.getResultUrl());
					transformationData.setStatus(TransformationStatusUtil.fromString(transformation.getStatus()).name());
					
					transformationData.setSubmissionTime(transformation.getCreationDate());
					transformationData.setTransformer(transformation.getTransformer());
					logger.debug("transformationData - " + transformationData.toString());
					productData.setTransformation(transformationData);

					productDataList.add(productData);
				}

			}
			return productDataList;
		} catch (Exception e) {
			e.printStackTrace();
			throw new ProductCartServiceException(e.getMessage());
		}
	}

   @RequestMapping (value = "/users/{userid}/cart/{cartid}/clear",
      method = RequestMethod.POST)
   public void clearCart(@PathVariable (value = "userid") String userid,
      @PathVariable (value = "cartid") String cartid)
         throws ProductCartServiceException
   {
      User user = securityService.getCurrentUser();
      fr.gael.dhus.service.ProductCartService productCartService =
         ApplicationContextProvider.getBean(
            fr.gael.dhus.service.ProductCartService.class);

      try
      {
         productCartService.clearCart(user.getUUID());
      }
      catch (Exception e)
      {
         e.printStackTrace();
         throw new ProductCartServiceException(e.getMessage());
      }
   }

   @RequestMapping (value = "/users/{userid}/cart/{cartid}/testcart",
      method = RequestMethod.GET)
   public String signupValidate(
      @PathVariable (value = "userid") String userid,
      @PathVariable (value = "cartid") String cartid)
   {
      return "hello from cart stub test webservice";
   }   
   
   @RequestMapping (value = "/users/{userid}/transformations/{tranformationid}",
		      method = RequestMethod.POST)
   public ResponseEntity<?> removeTransformationFromCart(@PathVariable(value="userid") String userid,
		   @PathVariable(value="tranformationid") String tranformationid)
         throws ProductCartServiceException
   {
      User user = securityService.getCurrentUser();
      fr.gael.dhus.service.TransformationService transformationService =
         ApplicationContextProvider.getBean(
            fr.gael.dhus.service.TransformationService.class);

      try
      {
    	  Transformation transformation = transformationService.getTransformation(tranformationid);
    	  transformationService.removeUser(transformation, user);
    	  return new ResponseEntity<>("{\"code\":\"success\"}", HttpStatus.OK);
      }
      catch (Exception e)
      {
         e.printStackTrace();
         return new ResponseEntity<>("{\"code\":\"error\"}", HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }
}

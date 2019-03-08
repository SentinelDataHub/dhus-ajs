package fr.gael.dhus.server.http.webapp.stub.controller;

import java.io.File;
import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dhus.store.derived.DerivedProductStoreService;
import org.geotools.gml2.GMLConfiguration;
import org.geotools.xml.Configuration;
import org.geotools.xml.Parser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.w3c.dom.Document;

import fr.gael.dhus.database.object.MetadataIndex;
import fr.gael.dhus.database.object.Product;
import fr.gael.dhus.database.object.User;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.MetadataIndexData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.ProductData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.ProductsData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.exceptions.ProductCartServiceException;
import fr.gael.dhus.server.http.webapp.stub.util.FootprintUtility;
import fr.gael.dhus.service.SecurityService;
import fr.gael.dhus.service.exception.UserNotExistingException;
import fr.gael.dhus.spring.context.ApplicationContextProvider;
import fr.gael.dhus.system.config.ConfigurationManager;
import fr.gael.dhus.util.MetalinkBuilder;
import fr.gael.dhus.util.MetalinkBuilder.MetalinkFileBuilder;

@RestController
public class StubCartController
{
   private static Log logger = LogFactory.getLog(StubCartController.class);

   @Autowired
   private ConfigurationManager configurationManager;
   
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

   @RequestMapping (value = "/users/{userid}/carts/{cartid}",
      method = RequestMethod.GET)
   public ResponseEntity<?> getProductsOfCart(@PathVariable (value = "userid") String userid,
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
      final org.dhus.store.derived.DerivedProductStoreService derivedProductService = ApplicationContextProvider
				.getBean(org.dhus.store.derived.DerivedProductStoreService.class);	

      try
      {
         List<Product> products = productCartService.getProductsOfCart(
            user.getUUID(), start, count);
         int cartcount = productCartService.countProductsInCart(user.getUUID());
         ArrayList<ProductData> productDatas = new ArrayList<ProductData>();
         ProductsData productList = new ProductsData();
         productList.setTotalresults(cartcount);
         Configuration configuration = new GMLConfiguration();
      
         @SuppressWarnings ("unused")
         Parser parser = new Parser(configuration);

         if (products != null)
         {
            logger.info("products not null");
            for (Product product : products)
            {
               if (product != null)
               {
                  logger.info("product not null");
                  ProductData productData =
                     new ProductData(product.getId(), product.getUuid(),
                                     product.getIdentifier());

                  ArrayList<String> summary = new ArrayList<String>();
                  ArrayList<MetadataIndexData> indexes =
                     new ArrayList<MetadataIndexData>();

                  for (MetadataIndex index :
                       productService.getIndexes(product.getId()))
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
                  productDatas.add(productData);
               }
            }
         }
         productList.setProducts(productDatas);
         return new ResponseEntity<>(productList, HttpStatus.OK);
      }
      catch (Exception e)
      {
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
}

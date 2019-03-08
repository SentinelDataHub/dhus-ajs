package fr.gael.dhus.server.http.webapp.stub.controller;

import java.util.AbstractList;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrQuery.SortClause;
import org.apache.solr.common.SolrDocumentList;
import org.dhus.store.derived.DerivedProductStoreService;
import org.geotools.gml2.GMLConfiguration;
import org.geotools.xml.Configuration;
import org.geotools.xml.Parser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import fr.gael.dhus.database.object.MetadataIndex;
import fr.gael.dhus.database.object.Product;
import fr.gael.dhus.search.SolrDao;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.MetadataIndexData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.ProductData;
import fr.gael.dhus.server.http.webapp.stub.controller.stub_share.ProductsData;
import fr.gael.dhus.server.http.webapp.stub.util.FootprintUtility;
import fr.gael.dhus.spring.context.ApplicationContextProvider;

@RestController
public class StubSearchController {

	private static Log logger = LogFactory.getLog(StubSearchController.class);

	@Autowired
	private SolrDao solrDao;

	@RequestMapping(value = "/products")
	public ResponseEntity<?> newsearch(
			@RequestParam(value = "filter", defaultValue = "") String filter,
			@RequestParam(value = "offset", defaultValue = "0") int startIndex,
			@RequestParam(value = "limit", defaultValue = "") int numElement,
			@RequestParam(value = "sortedby", defaultValue = "ingestiondate") String sortedby,
			@RequestParam(value = "order", defaultValue = "desc") String order){
		fr.gael.dhus.service.SearchService searchService = ApplicationContextProvider
				.getBean(fr.gael.dhus.service.SearchService.class);

		final fr.gael.dhus.service.ProductService productService = ApplicationContextProvider
				.getBean(fr.gael.dhus.service.ProductService.class);
		final org.dhus.store.derived.DerivedProductStoreService derivedProductService = ApplicationContextProvider
				.getBean(org.dhus.store.derived.DerivedProductStoreService.class);		
		ArrayList<ProductData> productDatas = new ArrayList<ProductData>();
		ProductsData productList = new ProductsData();
		try {
			SolrQuery.ORDER solrOrder = SolrQuery.ORDER.desc;
			if (order.equalsIgnoreCase("asc")) {
				solrOrder = SolrQuery.ORDER.asc;
			}
			List<SortClause> sortClauseList = new ArrayList<SortClause>();
			String[] sorts = sortedby.split(",");
			for (String sort : sorts) {
				SortClause clause = new SortClause(sort, solrOrder);
				sortClauseList.add(clause);
			}
			SolrQuery sQuery = new SolrQuery();
			sQuery.setQuery(filter);
			sQuery.setSorts(sortClauseList);
			sQuery.setStart(startIndex);
			sQuery.setRows(numElement);
			final SolrDocumentList results = searchService.search(sQuery);
			productList.setTotalresults(results.getNumFound());
			List<Product> products = new AbstractList<Product>() {
				@Override
				public Product get(int index) {					
					String puuid = (String) results.get(index).get("uuid");										
					return productService.getProduct(puuid);
				}

				@Override
				public int size() {
					return results.size();
				}
			};
			if (products != null) {
				for (Product product : products) {
					if (product != null) {
						ProductData productData = new ProductData(
								product.getId(), product.getUuid(),
								product.getIdentifier());
														
						ArrayList<String> summary = new ArrayList<String>();
						ArrayList<MetadataIndexData> indexes = new ArrayList<MetadataIndexData>();

						for (MetadataIndex index : productService
								.getIndexes(product.getId())) {
							MetadataIndexData category = new MetadataIndexData(
									index.getCategory(), null);
							int i = indexes.indexOf(category);
							if (i < 0) {
								category.addChild(new MetadataIndexData(index
										.getName(), index.getValue()));
								indexes.add(category);
							} else {
								indexes.get(i).addChild(
										new MetadataIndexData(index.getName(),
												index.getValue()));
							}

							if ("summary".equals(index.getCategory())) {
								summary.add(index.getName() + " : "
										+ index.getValue());
								Collections.sort(summary, null);
							}

							if ("Instrument".equalsIgnoreCase(index.getName())) {
								productData.setInstrument(index.getValue());
							}

							if ("Product type"
									.equalsIgnoreCase(index.getName())) {
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
						productData.setItemClass(product.getItemClass());
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
		catch (Exception e) {
			logger.error("Exception thrown while searching products" + e.getMessage());
			//FORMATTED MESSAGE "{\"message\":\"" + e.getMessage().replaceAll("\"", "\\\\\"")+"\"}"
			return new ResponseEntity<>(productList,HttpStatus.BAD_REQUEST);
		}
		
	}
}

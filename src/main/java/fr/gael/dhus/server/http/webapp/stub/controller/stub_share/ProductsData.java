package fr.gael.dhus.server.http.webapp.stub.controller.stub_share;

import java.util.ArrayList;

public class ProductsData {
	
	ArrayList<ProductData> products;
	long totalresults;
	long totalproducts;
	
	public ProductsData() {
		this.products = new ArrayList<ProductData>();
		this.totalresults = 0;
		this.totalproducts = 0;
		
	}
	
	public void setProducts(ArrayList<ProductData> products) {
		this.products = products;		
	}
	
	public ArrayList<ProductData> getProducts() {
		return this.products;
	}
	
	public void setTotalresults(long totalresults) {
		this.totalresults = totalresults;
	}
	
	public long getTotalresults() {
		return this.totalresults;
	}

	public long getTotalproducts() {
		return totalproducts;
	}

	public void setTotalproducts(long totalproducts) {
		this.totalproducts = totalproducts;
	}
	
	

}

package fr.gael.dhus.server.http.webapp.stub.util;

import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geotools.gml2.GMLConfiguration;
import org.geotools.xml.Configuration;
import org.geotools.xml.Parser;
import org.xml.sax.InputSource;

import com.spatial4j.core.context.jts.JtsSpatialContext;
import com.spatial4j.core.context.jts.JtsSpatialContextFactory;
import com.spatial4j.core.context.jts.ValidationRule;
import com.spatial4j.core.shape.jts.JtsGeometry;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LinearRing;
import com.vividsolutions.jts.geom.MultiPolygon;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.io.WKTWriter;

import fr.gael.dhus.util.WKTFootprintParser;

public class FootprintUtility {
	
	private static Log logger = LogFactory.getLog(FootprintUtility.class);

	private FootprintUtility() {}
	
	public static Double [][][]convertGMLToDoubleLonLat (String gml)
	   {
	      if (gml ==null || gml.trim ().isEmpty ()) return null;
	      Configuration configuration = new GMLConfiguration ();
	      Parser parser = new Parser (configuration);
	      
	      Geometry footprint;
	      try
	      {
	         footprint = (Geometry) parser.parse (new InputSource (
	            new StringReader (gml)));
	      }
	      catch (Exception e)
	      {
	         logger.error ("Cannot read GML coordinates: " +
	            (gml==null?gml:gml.trim ()), e);
	         return null;
	      }
	      
	      JtsSpatialContext ctx = JtsSpatialContext.GEO;
	      GeometryFactory geometryFactory = ctx.getGeometryFactory();

	      List<Coordinate> sequence = new ArrayList<Coordinate>();
	      for (Coordinate coord : footprint.getCoordinates ())
	      {
	         ctx.verifyX(coord.y);
	         ctx.verifyY(coord.x);         
	         sequence.add(new Coordinate (coord.y, coord.x));
	      }

	      LinearRing shell = geometryFactory.createLinearRing
	          (sequence.toArray(new Coordinate[sequence.size()]));
	      
	      Polygon p = geometryFactory.createPolygon(shell, null);
	      JtsSpatialContextFactory factory = new JtsSpatialContextFactory ();
	      ValidationRule validationRule = factory.validationRule;
	      JtsGeometry jts;
	      try {
	        jts = ctx.makeShape(p, true, ctx.isAllowMultiOverlap());
	        if (validationRule != ValidationRule.none)
	          jts.validate();
	      } catch (RuntimeException re) {
	        //repair:
	        if (validationRule == ValidationRule.repairConvexHull) {
	          jts = ctx.makeShape(p.convexHull(), true, ctx.isAllowMultiOverlap());
	        } else if (validationRule == ValidationRule.repairBuffer0) {
	          jts = ctx.makeShape(p.buffer(0), true, ctx.isAllowMultiOverlap());
	        } else if (validationRule == ValidationRule.error) {   
	        	//get original coordinates without transformations
	        	logger.debug("ValidationRule.error");
	            return getDoubleLonLatFromOriginalCoordinates(footprint.getCoordinates ());
	            
	          }else {
	          //TODO there are other smarter things we could do like repairing inner holes and subtracting
	          //  from outer repaired shell; but we needn't try too hard.          
	          try {
	        	  jts = ctx.makeShape(p.getBoundary());
			} catch (Exception e) {
				logger.error("Not possible to get JTS footprint. Error: " + e.getMessage());
				e.printStackTrace();
				return null;
			}
	          re.printStackTrace();
	          logger.error(re.getMessage());
	          return null;
	        }
	      }
	      if (factory.autoIndex)
	        jts.index();
	      
	      Double[][][] pts;
	      if (jts.getGeom () instanceof MultiPolygon)
	      {       	  
	         pts = new Double [((MultiPolygon)jts.getGeom ()).getNumGeometries ()][][];
	         for (int j = 0; j < ((MultiPolygon)jts.getGeom ()).getNumGeometries (); j++)
	         {
	            pts[j] = new Double[((MultiPolygon)jts.getGeom ()).getGeometryN (j).getNumPoints ()][2];
	            int i = 0;
	            for (Coordinate coord : ((MultiPolygon)jts.getGeom ()).getGeometryN (j).getCoordinates ())
	            {
	               pts[j][i] = new Double[2];
	               pts[j][i][0] = coord.x;
	               pts[j][i][1] = coord.y;
	               i++;
	            }
	         }         
	      }
	      else
	      {     	  
	         pts = new Double[1][jts.getGeom ().getNumPoints ()][2];
	         int i = 0;
	         for (Coordinate coord : jts.getGeom ().getCoordinates ())
	         {
	            pts[0][i] = new Double[2];
	            pts[0][i][0] = coord.x;
	            pts[0][i][1] = coord.y;
	            i++;
	         }
	      }      
	      return pts;
	   }
	   
	   /** 
	    *
	    * @param coords
	    * @return Double Lon Lat from Original coordinates
	    */
	   public static Double [][][] getDoubleLonLatFromOriginalCoordinates(Coordinate[] coords) {
		   Double[][][] pts;
		    	    	  
	     pts = new Double[1][coords.length][2];
	     int i = 0;
	     for (Coordinate coord : coords)
	     {
	        pts[0][i] = new Double[2];
	        pts[0][i][0] = coord.y;
	        pts[0][i][1] = coord.x;
	        i++;
	     }
		   return pts;
		   
	   }
	   
	   public static String getOriginalWktFromGml(String gml) {
			String wkt = null;
			if (gml == null || gml.trim().isEmpty())
				return null;
			Configuration configuration = new GMLConfiguration();
			Parser parser = new Parser(configuration);

			Geometry footprint;
			try {
				footprint = (Geometry) parser.parse(new InputSource(
						new StringReader(gml)));
			} catch (Exception e) {
				logger.error("Cannot read GML coordinates: "
						+ (gml == null ? gml : gml.trim()), e);
				return null;
			}
			
			
			WKTWriter wktWriter = new WKTWriter();		
			JtsSpatialContext ctx = JtsSpatialContext.GEO;
			GeometryFactory fact = new GeometryFactory();
			List<Coordinate> sequence = new ArrayList<Coordinate>();
			for (Coordinate coord : footprint.getCoordinates()) {
				ctx.verifyX(coord.y);
				ctx.verifyY(coord.x);
				sequence.add(new Coordinate(coord.y, coord.x));
			}
			LinearRing linear = new GeometryFactory().createLinearRing(sequence
					.toArray(new Coordinate[sequence.size()]));
			 Polygon poly = new Polygon(linear, null, fact);
			 wkt = wktWriter.write(poly);
			logger.debug("Output WKT: " + wkt);
			return wkt;

		}
	   
	   public static String getWktFromGml(String gml) {
			String computedWkt = null;
			try {
				String original_wkt = getOriginalWktFromGml(gml);
				
				if(original_wkt != null) {
					computedWkt = WKTFootprintParser.reformatWKTFootprint(original_wkt);
				}
			} catch (Exception e) {
				logger.error("Error parsing polygon: " + e.getMessage());
				e.printStackTrace();
			}		
			return computedWkt;
		}
	   
	   public static String reprocessWkt(String wkt) {
			
			String computedWkt = null;
			try {
				if(wkt != null) {
					computedWkt = WKTFootprintParser.reformatWKTFootprint(wkt);
				}
			} catch (Exception e) {
				logger.error("Error parsing polygon: " + e.getMessage());
				e.printStackTrace();
			}
			return computedWkt;
		}
	
	
}

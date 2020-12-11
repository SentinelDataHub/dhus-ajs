package fr.gael.dhus.server.http.webapp.stub.controller;

import org.json.JSONException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StubVersionController
{

   @RequestMapping(value = "/version", method = RequestMethod.GET)
   public ResponseEntity<?> getVersion() throws JSONException
   {                
      final String version = System.getProperty("fr.gael.dhus.version");
      return new ResponseEntity<>("{\"value\":\""+version+"\"}",
				HttpStatus.OK);
   }

}

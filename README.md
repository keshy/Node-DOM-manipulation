Node-DOM-modifier
=================

NodeJS server with phantomJS support to manipulate webpages on a server side test framework


Requirements:
=============

1. NodeJS installed
   Download from http://nodejs.org/
       
2. PhantomJS installed. 
   Download from http://phantomjs.org/
   Do not forget to put phantomjs in the path. It should be directly accessible via calling phantomjs
   i.e. in windows do set PATH=%PATH%;path\to\your\phantomJS\installation\
     
3. Download node module 'phantom' 
   npm install phantom
   

Run configurations:
==================

Step 1. Run server
		node> node server.js
		

Step 2. Go to browser and enter the url to decorate: 
		http://\<server\>:\<port\>/extract/\<website address without protocol specification\>/
		OR
		use any command line http client tool to make the request to avoid additional browser specific calls like /favicon etc. 
		sample : http://localhost:8080/extract/www.youtube.com (currently this wont work if you use .../decorate/http://www.youtube.com....need to handle this case). 

Step 3. Once the operation is complete go to /images folder to check out the snapshot of the site
		
Future work:
===========

This is a work in progress. Some of the future tasks to be completed are:

1. Ability to decorate pages.
2. Ability to identify items on the page. 
3. Reduce turn around time by allowing phantomJS page settings to be configurable and not always load external scripts and images for all page loads. 
4. Convert this framework into a plug and play module which can be easily added via npm. (E.g. npm install decorate)



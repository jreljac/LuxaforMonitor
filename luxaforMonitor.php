<?php
	//Turn off all error reporting just in case
	error_reporting(E_ALL & ~E_NOTICE);
	ini_set('display_errors', 'off');

	$msg = 'Success';
	
	//OPTIONAL - check to see if the database is responding as well as the web server
	/*
	$DB_HOST 	 	= '';
	$DB_USERNAME 	= '';
	$DB_PASSWORD 	= '';
	$DB_NAME 		= '';

	//Check MySQL using the provided connection information
	$DBi = mysqli_connect($DB_HOST, $DB_USERNAME, $DB_PASSWORD, $DB_NAME);
	if($mysqli->connect_error) {
		$msg  = 'Server up, database down';
	};
	*/

	//If we get "Success" then the web server is at least responding to simple requests
	echo $msg;
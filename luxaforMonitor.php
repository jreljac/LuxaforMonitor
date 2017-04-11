<?php
	error_reporting(E_ALL & ~E_NOTICE);
	ini_set('display_errors', 'off');
		
	$DB_HOST 	 	= '';
	$DB_USERNAME 	= '';
	$DB_PASSWORD 	= '';
	$DB_NAME 		= '';

	$msg 		= 'Success';

	// Check MySQL using the provided connection information
	$DBi = mysqli_connect($DB_HOST, $DB_USERNAME, $DB_PASSWORD, $DB_NAME);
	if($mysqli->connect_error) {
		$msg  = 'Server up, database down';
	};

	echo $msg;
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>Quarry Admin</title>

<!-- CSS -->
<link href="/style/css/transdmin.css" rel="stylesheet" type="text/css" media="screen" />
<!--[if IE 6]><link rel="stylesheet" type="text/css" media="screen" href="/style/css/ie6.css" /><![endif]-->
<!--[if IE 7]><link rel="stylesheet" type="text/css" media="screen" href="/style/css/ie7.css" /><![endif]-->

<!-- JavaScripts-->
<script type="text/javascript" src="/style/js/jquery.js"></script>
<script type="text/javascript" src="/style/js/jNice.js"></script>

<script>
$(function () {
		
	$('textarea').bind('keypress', function(e) { 
   	
	   	 if (e.keyCode == 9) {
	        var myValue = "    ";
	        var startPos = this.selectionStart;
	        var endPos = this.selectionEnd;
	        var scrollTop = this.scrollTop;
	        this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos,this.value.length);
	        this.focus();
	        this.selectionStart = startPos + myValue.length;
	        this.selectionEnd = startPos + myValue.length;
	        this.scrollTop = scrollTop;
	
	        e.preventDefault();
	    }
    
	});
	
});
</script>

<style>

	form .label {
	
		padding-top:8px;
		width:120px;
		display:block;
		float:left;
		
	}
	
	.error {
	
		background-color:#900;
		color:#fff;
		font-weight:bold;
		padding:3px;
	}
	
	.message {
	
		background-color:#090;
		color:#fff;
		font-weight:bold;
		padding:3px;
	}
	
	 .vgap {
	 	margin-bottom:8px;	
	 }
	
</style>

</head>

<body>
	<div id="wrapper">
    	
        <!-- You can name the links with lowercase, they will be transformed to uppercase by CSS, we prefered to name them with uppercase to have the same effect with disabled stylesheet -->
        <ul id="mainNav">
        	<li><a href="/admin" class="active">Installations</a></li> <!-- Use the "active" class for the active menu item  -->
        	<li><a href="/admin/rabbit">RabbitMQ</a></li>
        	<!--<li><a href="#">ADMINISTRATION</a></li>
        	<li><a href="#">DESIGN</a></li>
        	<li><a href="#">OPTION</a></li>
        	<li class="logout"><a href="#">LOGOUT</a></li>-->
        </ul>
        <!-- // #end mainNav -->
        
        <div id="containerHolder">
			<div id="container">
        		<div id="sidebar">
                	<ul class="sideNav">
                		<?= $menu ?>
                    </ul>
                    <!-- // .sideNav -->
                </div>    
                <!-- // #sidebar -->
                
                <!-- h2 stays for breadcrumbs -->
                <h2><a href="/admin"><?= $section_title ?></a> &raquo; <a href="#" class="active"><?= $page_title ?></a></h2>
                
                <div id="main">
                	<?= $body ?>
                </div>
                <!-- // #main -->
                
                <div class="clear"></div>
            </div>
            <!-- // #container -->
        </div>	
        <!-- // #containerHolder -->
        
        <p id="footer">the root is in the house - <a href="http://www.perspectived.com">Nice template!.</a></p>
    </div>
    <!-- // #wrapper -->
</body>
</html>



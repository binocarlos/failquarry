$(function() {
	
	function websiteError(text) {
		if(text) {
			$('#website_error_span').html(text);
			$('#website_error_span').show();
		} else {
			$('#website_error_span').hide();
		}
	}
	
	function databaseError(text) {
		if(text) {
			$('#database_error_span').html(text);
			$('#database_error_span').show();
		} else {
			$('#database_error_span').hide();
		}
	}
	
	function loadData() {
	
		$.ajax({
			url:'/account/homepage',
			type:'GET',
			dataType:'json',
			data:{
				
			},
			success:function(data) {
				
				
				var websiteHTML = templates.renderWebsites({websites:data.websites});
				var databaseHTML = templates.renderDatabases({databases:data.databases});
				
				$('#website_container').html(websiteHTML);
				$('#database_container').html(databaseHTML);
				
				$("#website_accordion").accordion({
					active:false,
					header: "h3"
			    });
			    
			    $("#database_accordion").accordion({
					active:false,
					header: "h3"
			    });
				
			}
			
		});
		
	}
	
	var templates = {};
	
	function setupTemplates() {
		
		_.templateSettings = {
			interpolate: /\<\@\-(.+?)\@\>/gim,
			escape: /\<\@\=(.+?)\@\>/gim,
      		evaluate: /\<\@(.+?)\@\>/gim
		};
		
		$('script[type="text/template"]').each(function() {
			templates[$(this).attr('id')] = _.template($(this).html());
		});
	}
	
	setupTemplates();
	
	function compileTemplate(id, data) {
		
		var template = templates[id];
		
		//var html = template(data);
		
		//console.log(html);
		
	}
	
	function submitWebsiteForm() {
		
		var data = {
			website_id:$('#website_id').val(),
			name:$('#websitename').val(),
			subdomain:$('#subdomain').val()
		};
		
		if(!data.name.match(/\w/)) {
			websiteError('Please enter a name');
			return;
		}
		
		if(!data.subdomain.match(/\w/)) {
			websiteError('Please enter a subdomain');
			return;
		}
		
		websiteError();
		
		$.ajax({
			url:'/account/savewebsite',
			type:'POST',
			dataType:'json',
			data:data,
			success:function(response) {
				
				if(response.status) {
					$("#add_website_dialog").dialog('close');
					loadData();
				} else {
					websiteError(response.error);
				}
				
			}
		});
	}
	
	
	function submitDatabaseForm() {
		
		var data = {
			database_id:$('#database_id').val(),
			name:$('#databasename').val(),
			drive:$('#databasedrive').val(),
		};
		
		if(!data.name.match(/\w/)) {
			databaseError('Please enter a name');
			return;
		}
		
		if(!data.drive.match(/^\w+$/)) {
			databaseError('Please enter a drive name (all one word)');
			return;
		}
		
		databaseError();
		
		$.ajax({
			url:'/account/savedatabase',
			type:'POST',
			dataType:'json',
			data:data,
			success:function(response) {
				
				if(response.status) {
					$("#add_database_dialog").dialog('close');
					loadData();
				} else {
					databaseError(response.error);
				}
				
			}
		});
	}
	
	
	$("#add_website_dialog").dialog({
        autoOpen: false,
        modal: true,
        width:600,
        buttons:{
        	
            Ok: function () {
            	
            	submitWebsiteForm();
                
            },
            Cancel: function() {
        		
        		$(this).dialog("close");
        	}
        }
    });
    
    $("#add_database_dialog").dialog({
        autoOpen: false,
        modal: true,
        width:600,
        buttons: {
            Ok: function () {
            	
            	submitDatabaseForm();
                
            },
            Cancel: function() {
        		
        		$(this).dialog("close");
        	}
        }
    });
    
	// Modal Link
    $('#add_website').click(function () {
    	$('#website_id').val('');
    	$('#websitename').val('');
    	$('#subdomain').val('');
        $('#add_website_dialog').dialog('open');
        return false;
    });
    
    // Modal Link
    $('#add_database').click(function () {
    	$('#database_id').val('');
    	$('#databasename').val('');
    	$('#databasedrive').val('');
        $('#add_database_dialog').dialog('open');
        return false;
    });
    
    $('#website_error_span').hide();
    $('#database_error_span').hide();
	
	loadData();
	
});	
$(function() {
	
	function showError(text) {
		$('#website_error_span').html(text);
		$('#website_error_span').show();
	}
	
	function submitWebsiteForm() {
		
		var data = {
			name:$('#websitename').val(),
			subdomain:$('#subdomain').val()
		};
		
		if(!data.name.match(/\w/)) {
			showError('Please enter a name');
			return;
		}
		
		if(!data.subdomain.match(/\w/)) {
			showError('Please enter a subdomain');
			return;
		}
		
		$.ajax({
			url:'/addwebsite',
			type:'POST',
			dataType:'json',
			data:data,
			success:function(response) {
				
				console.log(response);
				//$("#add_website_dialog").dialog("close");
				
			}
		});
	}
	
	
	function submitDatabaseForm() {
		
		var data = {
			name:$('#databasename').val(),
			drive:$('#databasedrive').val(),
		};
		
		if(!data.name.match(/\w/)) {
			showError('Please enter a name');
			return;
		}
		
		if(!data.drive.match(/^\w+$/)) {
			showError('Please enter a drive name (all one word)');
			return;
		}
		
		$.ajax({
			url:'/adddatabase',
			type:'POST',
			dataType:'json',
			data:data,
			success:function(response) {
				
				console.log(response);
				
				//$("#add_website_dialog").dialog("close");
				
			}
		});
	}
	
	$("#add_website_dialog").dialog({
        autoOpen: false,
        modal: true,
        width:600,
        buttons: {
            Ok: function () {
            	
            	submitWebsiteForm();
                
            }
        }
    });
    
    $("#add_database_dialog").dialog({
        autoOpen: false,
        modal: true,
        width:600,
        buttons: {
            Ok: function () {
            	
            	submitWebsiteForm();
                
            }
        }
    });
    
	// Modal Link
    $('#add_website').click(function () {
        $('#add_website_dialog').dialog('open');
        return false;
    });
    
    // Modal Link
    $('#add_database').click(function () {
        $('#add_database_dialog').dialog('open');
        return false;
    });
    
    $('#website_error_span').hide();
    $('#database_error_span').hide();
	
});	
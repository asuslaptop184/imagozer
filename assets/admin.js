jQuery(function() {
	var $ = jQuery;
	$("body.post-type-attachment").each(function(){

    	$(".row-actions").each(function(){
    		var that = $(this),
    			id = that.parents('tr').attr('id').replace("post-", '');
    		that.append('<span class="view">  |  <a href="' + ( NIM.edit_url + id ) + '" target="_blank">Pro Image Editor</a></span>');
    	})
	})
});

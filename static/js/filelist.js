var parentFolder	;
var uploading = false;
function setupButtons(){
	$('.fileItem').click(function(event){
		event.stopPropagation();
		var name = $(this).attr('name');
		window.location.href = '/getFile'+createPath()+'/'+name
		event.preventDefault();
	
	});
	$('.folderSecret').click(function(event){
		event.stopPropagation();
		$(this).attr("type","text");
	});
	$('.folderSecret').blur(function(event){
		$(this).attr("type","password");
	});
	$('#addSecret').click(function(event){
		$('#addSecretModal').modal('show');
	});
	$('#secretInput').popover({'trigger':'manual'});
	$('#dirInput').popover({'trigger':'manual'});
	// $('#doneUpload').click(function(event)){
	// 	$('#uploadModal').modal('hide');
	// });
	$('#confirmAddSecret').click(function(event){
		var secret = $('#secretInput').val();
		var dir = $('#dirInput').val();
		if (dir.length!=0 && dir!='/'){
			
			var result; 
			// alert(dir);
			var checked = $('#createFolder').prop('checked');
			$.get('/dirExists',{'path':dir,'create':checked},function(data){
				if (data=='true'){
					result=true;
				}
				else if (data=='notAllowed'){
					result = -1;
				}
				else{
					result=false;
				}
				if (result===true && secret.length>0){
					$.post('/sync',{'method':'add_folder','dir':dir,'secret':secret},function(data){
						data = JSON.parse(data);
						if (data['error']!=0){
							var error=data['message'];
							$('#secretInput').attr('data-content',error);
							$('#secretInput').popover('show');
						}
						else{
							$('#dirInput').val('');
							$('#secretInput').val('');
							$('#secretInput').popover('hide');
							$('#dirInput').popover('hide');
							$('#addSecretModal').modal('hide');
							updateFolders();
						}
					});
				}
				else if (result===true && secret.length==0){
					$.post('/sync',{'method':'add_folder','dir':dir},function(data){
						data = JSON.parse(data);
						if (data['error']!=0){
							var error=data['message'];
							$('#dirInput').attr('data-content',error);
							$('#dirInput').popover('show');
						}
						else{
							$('#dirInput').val('');
							$('#secretInput').val('');
							$('#secretInput').popover('hide');
							$('#dirInput').popover('hide');
							$('#addSecretModal').modal('hide');
							updateFolders();
						}
					});
				}
				else if (result===false){
					$('#dirInput').attr('data-content',"This directory does not exist. You can create it manually or check the box below.");
					$('#dirInput').popover('show');
				}
				else{
					$('#dirInput').attr('data-content',"You do not have write permission to this directory.");
					$('#dirInput').popover('show');
				}
				
			});
			
			
		}
		else if (dir=='/'){
			$('#dirInput').attr('data-content',"You cannot choose / as your directory.");
			$('#dirInput').popover('show');
		}
	});
	$('#addSecretModal').keypress(function(event){
		if (event.which==13){
			$('#confirmAddSecret').click();
		}
	});
	$('#addSecretModal').on('hide.bs.modal',function(event){
		$('#secretInput').popover('hide');
		$('#dirInput').popover('hide');
	});
	$('#dirInput').on('input',function(event){
		$('#dirInput').popover('hide');
	});
	$('#secretInput').on('input',function(event){
		$('#dirInput').popover('hide');
	});
	$('#upload').change(function(event){
		var fileList = $('#upload')[0].files
		var path = createPath()+'/'+fileList[0].name
		if (fileList.length==1){
			$.get('/file_exists',{'path':path},function(data){
				if (data=='false'){	
					$('#uploadStatus').text("Uploading");
					uploading = true;
					startUploadingDots();
					//JSON likes to not handle files correctly, so we use FormData
					data = new FormData()
					data.append('f',fileList[0]);
					var path = createPath()+'/'+fileList[0].name;
					data.append('path',path);
					// var data = {'f':$('#upload')[0].files, 'path':'null for now'}
					$.ajax({
						url:'/upload',
						type:'POST',
						data:data,
						processData:false,
						contentType:false,
						success:function(data){
							$('#uploadStatus').text("Done.");
							stopUploadingDots();
							$('#uploadModal').modal('hide');
							updateFolders();
						}
					});
				}
				else{
					$('#uploadStatus').text("This file already exists. Either rename the file you are uploading or choose another file.");
					$('#uploadStatus').addClass('error');
					
				}
			});
		}
		
	});
	$('#uploadButton').click(function(event){
		$('#uploadModal').modal('show');
	});
	
	$('.deleteButton').click(function(event){
		event.stopPropagation();
		
		var item = $(this).parent().find("> a.folderPath");
		
		$('#deleteFilename').text(item.text());
		$('#deleteModal').modal('show');
		
	});
	$('#confirmDelete').click(function(event){
		event.stopPropagation();
		var item = $('#deleteFilename').text()
		var fullPath = createPath()+"/"+item;
		$.post('/delete',{'path':fullPath},function(data){
			data = JSON.parse(data);
			if (data['error']==0){
				updateFolders();
				$('#deleteModal').modal('hide');
			}
			else{
				console.log("Error deleting.")
			}
		});
		
	});
	$('.publicButton').click(function(event){
		event.stopPropagation();
		var item = $(this).parent().find("> a.folderpath")
		var fullPath = createPath()+item.attr('name');
		console.log(fullPath);
		$.post('/makePublic',{'path':fullPath},function(data){
			data = JSON.parse(data);
			if (data['error']==0){
				$('#publicURL').val(window.location.origin+data['url'])
				$('#publicModal').modal('show');
			}
			else{
				console.log('Error making public.');
			}
		});
	});
	$('#donePublic').click(function(event){
		event.stopPropagation();
		$('publicModal').modal('hide');
	});
}
function createPath(){
	if (window.location.pathname.indexOf('/folder/') > -1)
		return window.location.pathname.split('/folder/').join('/');
	return window.location.pathname
}
function hideDeleted(){
	var items = $('.folderItem');
	for (var i=0; i<items.length; i++){
		if ($(items[i]).attr('state')=="deleted")
			$(items[i]).hide();
	}
}
function startUploadingDots(count){
	if (uploading){
		if (count===undefined)
			count = 0;
		if (count==4)
			count = -1; //count +1 will make this zero
		$('#uploadStatus').text("Uploading"+".".repeat(count));
		setTimeout(function(){startUploadingDots(count+1)}, 500);
	}
}
function stopUploadingDots(){
	uploading=false;
	$('#uploadStatus').text();
}
function secretInPage(){
	var items = $('.folderItem');
	for (var i=0; i<items.length; i++){
		if ($(items[i]).attr('secret')!="null"){
			return $(items[i]).attr('secret');
		}
	}
	return null;
}
function isRoot(){
	if (window.location.pathname=='/'){
		return true;
	}
	return false;
}
function updateFolders(){
	$('#folderList' ).load(window.location.pathname+' #folderList',function(){		
		setupButtons();
		hideDeleted();
		outputLength = $('#folderList');	
	});
	
}
function getPing(){
	var time = new Date().getTime();
	$.ajax({
		type: "GET",
		url: '/hello',
		async: false
	});
	return new Date().getTime() - time;
}
//stolen from stackoverflow, allows me to repeat strings.
String.prototype.repeat = function(num)
{
	return new Array( num + 1 ).join(this);
}
$(document).ready(function(){
	if (window.location.href[window.location.href.length-1]!='/'){
		window.location.href+='/';
	}
	if (!isRoot()){
		$('#addSecret').hide();
	}
	else{
		$('#uploadButton').hide();
	}
	setupButtons();
	hideDeleted();
	outputLength = $('#folderList').length;
});
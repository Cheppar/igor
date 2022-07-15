

fetch('https://livecapture-420.s3.amazonaws.com/2022-07-02_105342_34.6771060209393_-111.97143420594738.json2').then((data)=>{
	//console.log(data);
	return data.json();
}).then((completedata)=>{
		 //console.log(completedata.METADATA.TOUR_NAME);
		 //document.getElementById('tit').innerHTML=completedata.METADATA.TOUR_NAME;
		 
	}).catch((err)=>{
		console.log(err);
	});
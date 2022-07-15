

fetch('https://livecapture-420.s3.amazonaws.com/2022-07-02_104904_34.671924815774275_-111.94961049960204.json2').then((data)=>{
	//console.log(data);
	return data.json();
}).then((completedata)=>{
		 document.getElementById('pat').value=completedata.METADATA.TOUR_NAME;
		 document.getElementById('tourguide').value=completedata.METADATA.GUIDE_NAME;
		 document.getElementById('photographer').value=completedata.METADATA.LOCATION.PLACE;
		 

	}).catch((err)=>{
		console.log(err);
	});
function updateCOBox(coValue) {
    const coBox = document.getElementById('coBox');
    const coDescription = document.getElementById('coDescription');
    if (coValue <= 4) {
        coBox.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
        coDescription.innerText = 'Baik';
    } else if (coValue <= 9) {
        coBox.style.backgroundColor = 'yellow';
        coDescription.innerText = 'Sedang';
    } else if (coValue <= 15) {
        coBox.style.backgroundColor = 'orange';
        coDescription.innerText = 'Tidak Sehat bagi Kelompok Rentan';
    } else if (coValue <= 30) {
        coBox.style.backgroundColor = 'red';
        coDescription.innerText = 'Tidak Sehat';
    } else if (coValue <= 40) {
        coBox.style.backgroundColor = 'purple';
        coDescription.innerText = 'Sangat Tidak Sehat';
    } else {
        coBox.style.backgroundColor = 'maroon';
        coDescription.innerText = 'Berbahaya';
    }
}

function updatePM25Box(pm25Value) {
    const pm25Box = document.getElementById('pm25Box');
    const pm25Description = document.getElementById('pm25Description');
    if (pm25Value <= 12) {
        pm25Box.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
        pm25Description.innerText = 'Baik';
    } else if (pm25Value <= 35.4) {
        pm25Box.style.backgroundColor = 'yellow';
        pm25Description.innerText = 'Sedang';
    } else if (pm25Value <= 55.4) {
        pm25Box.style.backgroundColor = 'orange';
        pm25Description.innerText = 'Tidak Sehat bagi Kelompok Rentan';
    } else if (pm25Value <= 150.4) {
        pm25Box.style.backgroundColor = 'red';
        pm25Description.innerText = 'Tidak Sehat';
    } else if (pm25Value <= 250.4) {
        pm25Box.style.backgroundColor = 'purple';
        pm25Description.innerText = 'Sangat Tidak Sehat';
    } else {
        pm25Box.style.backgroundColor = 'brown';
        pm25Description.innerText = 'Berbahaya';
    }
}

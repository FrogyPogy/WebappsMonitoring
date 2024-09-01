function hideShow(){
    var x = document.getElementById("predictionContent");
    if (x.style.display === "none"){
        x.style.display = "block";
    }else{
        x.style.display = "none";
    }
}
//update single chart js
function updateSingleChart(canvasId, labels, label, data, backgroundColor, borderColor, chartInstance, lastLabels, ylabels) {
    var ctx = document.getElementById(canvasId).getContext('2d');
    if (!chartInstance) {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 1,
                    pointStyle: false,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio:false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: formatDate(lastLabels),
                            font:{
                                weight: 'bold',
                                family: 'Arial',
                                size: '16'
                            },
                            padding:{
                                top: 15,
                                bottom: 25
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title:{
                            display: true,
                            text: ylabels,
                            font: {
                                family: 'Arial',
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    } else {
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = data;
        chartInstance.update();
    }
}

function updateCOBox(coValue, idBox, idDescription) {
    const coBox = document.getElementById(idBox);
    const coDescription = document.getElementById(idDescription);
    coBox.className = 'col-12 col-md-5 info-box mb-3 mb-md-0'; // Reset kelas

    if (coValue <= 4) {
        coBox.classList.add('green');
        coDescription.innerText = 'Baik';
    } else if (coValue <= 9) {
        coBox.classList.add('yellow');
        coDescription.innerText = 'Sedang';
    } else if (coValue <= 15) {
        coBox.classList.add('orange');
        coDescription.innerText = 'Tidak Sehat bagi Kelompok Rentan';
    } else if (coValue <= 30) {
        coBox.classList.add('red');
        coDescription.innerText = 'Tidak Sehat';
    } else if (coValue <= 40) {
        coBox.classList.add('purple');
        coDescription.innerText = 'Sangat Tidak Sehat';
    } else {
        coBox.classList.add('maroon');
        coDescription.innerText = 'Berbahaya';
    }
}

function updatePM25Box(pm25Value, idBox, idDescription) {
    const pm25Box = document.getElementById(idBox);
    const pm25Description = document.getElementById(idDescription);
    pm25Box.className = 'col-12 col-md-5 info-box mb-3 mb-md-0'; // Reset kelas

    if (pm25Value <= 12) {
        pm25Box.classList.add('greenPM');
        pm25Description.innerText = 'Baik';
    } else if (pm25Value <= 35.4) {
        pm25Box.classList.add('yellowPM');
        pm25Description.innerText = 'Sedang';
    } else if (pm25Value <= 55.4) {
        pm25Box.classList.add('orangePM');
        pm25Description.innerText = 'Tidak Sehat bagi Kelompok Rentan';
    } else if (pm25Value <= 150.4) {
        pm25Box.classList.add('redPM');
        pm25Description.innerText = 'Tidak Sehat';
    } else if (pm25Value <= 250.4) {
        pm25Box.classList.add('purplePM');
        pm25Description.innerText = 'Sangat Tidak Sehat';
    } else {
        pm25Box.classList.add('brownPM');
        pm25Description.innerText = 'Berbahaya';
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const time = date.toLocaleTimeString('id-ID', { hour: 'numeric', minute: '2-digit' });

    return `${dayName} ${day} ${monthName}, ${time} WIB`;
}
function formatTime(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];

    return `${dayName} ${day} ${monthName}`;
}

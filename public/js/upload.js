// $("#file-upload").css("opacity", "0");

// $("#file-browser").click(function(e) {
//   e.preventDefault();
//   $("#file-upload").trigger("click");
// });

document.getElementById('file-browser').addEventListener('click', function(event) {
  event.preventDefault();// Mencegah default action dari elemen <a>
  document.getElementById('file-upload').click();
});

document.getElementById('file-upload').addEventListener('change', async function(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];

  if (file) {
      const formData = new FormData();
      formData.append('dataset', file);

      try {
          const response = await fetch('/uploadData', {
              method: 'POST',
              body: formData
          });

          const result = await response.text();
          alert(result); // Atau tampilkan hasil di elemen tertentu di halaman Anda
      } catch (error) {
          console.error('Error:', error);
          alert('An error occurred while uploading the file');
      }
  }
});
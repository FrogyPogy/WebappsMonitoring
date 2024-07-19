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

// Event listener untuk file-browser-test
document.getElementById('file-browser-test').addEventListener('click', function(event) {
  event.preventDefault(); // Mencegah default action dari elemen <a>
  document.getElementById('file-upload-test').click();
});

// Event listener untuk file-upload-test
document.getElementById('file-upload-test').addEventListener('change', async function(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];

  if (file) {
      const formData = new FormData();
      formData.append('dataset-test', file);

      try {
          const response = await fetch('/uploadDatatest', {
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
const name = document.querySelector('#name');
const email = document.querySelector('#email');
const img = document.querySelector('#img');
const photo = document.querySelector('#photo');
const passwordCurrent = document.querySelector('#password-current');
const password = document.querySelector('#password');
const passwordConfirm = document.querySelector('#password-confirm');
const dataForm = document.querySelector('.form-user-data');
const passwordForm = document.querySelector('.form-user-password');

photo.addEventListener('change', () => {
  const [file] = photo.files;
  if (file) {
    img.src = URL.createObjectURL(file)
  }
})

dataForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = new FormData();
  form.set('name', name.value);
  form.set('email', email.value);
  form.set('photo', photo.files[0]);

  const response = await fetch('/api/v1/users/me/update-authenticated-user', {
    //headers: {
    //  'Content-Type': 'application/json'    
    //},
    method: 'PATCH',
    //body: JSON.stringify({ name: name.value, email: email.value }),
    body: form
  }).then(r => r.json());

  if (response.status === 'success') {
    showAlert('success', 'Data updated successfully!')
  }
})

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const response = await fetch('/change-password', {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'PATCH',
    body: JSON.stringify({ currentPassword: passwordCurrent.value, password: password.value, passwordConfirm: passwordConfirm.value }),
  }).then(r => r.json());

  if (response.status === 'success') {
    showAlert('success', 'Password updated successfully!')
  }
})

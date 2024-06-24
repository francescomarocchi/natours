document.querySelector('.form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  }).then((r) => r.json());

  if (res.status === 'success') {
    showAlert('success', 'logged in successfully');
    window.setTimeout(() => {
      location.assign('/');
    }, 1_500);
  } else {
    showAlert('error', 'login failed!')
  }
});

const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  setTimeout(hideAlert, 5_000);
}

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) {
    el.parentElement.removeChild(el);
  }
}

const logoutButton = document.querySelector('.nav__el--logout')
if (logoutButton) {
  logoutButton.addEventListener('click', async (e) => {
    e.preventDefault();

    const res = await fetch('/logout', {
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((r) => r.json());

    if (res.status === 'success') {
      showAlert('success', 'logged out successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1_500);
    } else {
      showAlert('error', 'logout failed!')
    }
  });
}

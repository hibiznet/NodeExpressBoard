document.addEventListener('click', (e) => {
  if (e.target.matches('[data-copy-text]')) {
    navigator.clipboard.writeText(e.target.getAttribute('data-copy-text'));
    alert('복사되었습니다.');
  }
});

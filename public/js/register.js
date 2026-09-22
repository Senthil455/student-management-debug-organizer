const form = document.getElementById('registerForm');
const msg = document.getElementById('formMessage');

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  clearMessage(msg);

  const registerNumber = document.getElementById('regno').value;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const department = document.getElementById('department').value;
  const year = document.getElementById('year').value;

  if (registerNumber.trim() === '') {
    showMessage(msg, 'Register number is required.', 'error');
    return;
  }
  if (name.trim() === '') {
    showMessage(msg, 'Student name is required.', 'error');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage(msg, 'Please enter a valid email address.', 'error');
    return;
  }
  if (!/^\d{10}$/.test(phone)) {
    showMessage(msg, 'Phone number must be exactly 10 digits.', 'error');
    return;
  }
  if (department === '') {
    showMessage(msg, 'Please select a department.', 'error');
    return;
  }
  if (year === '') {
    showMessage(msg, 'Please select a year.', 'error');
    return;
  }

  const result = await api('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registerNumber: registerNumber, name: name, email: email, phone: phone, department: department, year: Number(year) }),
  });

  if (result.ok && result.data.success) {
    showMessage(msg, 'Student added successfully!', 'success');
    form.reset();
  } else {
    showMessage(msg, result.data.message || 'Registration failed. Please try again.', 'error');
  }
});

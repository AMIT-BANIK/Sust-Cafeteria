// --- Orders Panel Status ---
document.querySelectorAll('.status-checkbox').forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    const span = this.nextElementSibling;
    const row = this.closest('tr');
    if(this.checked){
      span.textContent = 'Served';
      row.style.backgroundColor = '#66bb6a'; // middle green
      span.style.color = '#fff';
    } else {
      span.textContent = 'Pending';
      row.style.backgroundColor = '';
      span.style.color = '#333';
    }
  });
});

// Menu Management
const addItemForm = document.getElementById('addItemForm');
const menuTableBody = document.querySelector('#menuTable tbody');

addItemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const itemName = document.getElementById('itemName').value;
  const itemPrice = document.getElementById('itemPrice').value;

  // Create new row
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>${itemName}</td>
    <td>${itemPrice}</td>
    <td>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </td>
  `;

  menuTableBody.appendChild(row);
  addItemForm.reset();
});

// Delegate click events to handle Edit/Delete
menuTableBody.addEventListener('click', (e) => {
  const target = e.target;
  const row = target.closest('tr');

  // Delete button
  if (target.classList.contains('delete-btn')) {
    row.remove();
  }

  // Edit button
  if (target.classList.contains('edit-btn')) {
    // Get current values
    const nameCell = row.children[0];
    const priceCell = row.children[1];

    const newName = prompt("Enter new item name:", nameCell.textContent);
    if (newName !== null && newName.trim() !== '') {
      nameCell.textContent = newName.trim();
    }

    const newPrice = prompt("Enter new item price:", priceCell.textContent);
    if (newPrice !== null && !isNaN(newPrice) && newPrice.trim() !== '') {
      priceCell.textContent = parseFloat(newPrice).toFixed(2);
    }
  }
});
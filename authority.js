document.querySelectorAll('.status-checkbox').forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    const span = this.nextElementSibling;
    const row = this.closest('tr');
    if(this.checked){
      span.textContent = 'Served';
      row.style.backgroundColor = '#66bb6a'; 
      span.style.color = '#fff';
    } else {
      span.textContent = 'Pending';
      row.style.backgroundColor = '';
      span.style.color = '#333';
    }
  });
});

const API_BASE = "http://localhost:3000"
const addItemForm = document.getElementById('addItemForm');
const menuTableBody = document.querySelector('#menuTable tbody');

function loadMenu() {
  fetch(`${API_BASE}/menu`)
    .then(res => res.json())
    .then(data => {
      menuTableBody.innerHTML = "";
      data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${Number(item.price).toFixed(2)}</td>
          <td>
            <button class="edit-btn" data-id="${item.id}">Edit</button>
            <button class="delete-btn" data-id="${item.id}">Delete</button>
          </td>
        `;
        menuTableBody.appendChild(row);
      });
    })
    .catch(err => {
      console.error("Error loading menu:", err);
      alert("Failed to load menu. Check server and table name.");
    });
}

addItemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('itemName').value.trim();
  const price = document.getElementById('itemPrice').value;

  if (!name || price === "") {
    return alert("Please enter item name and price.");
  }

  fetch(`${API_BASE}/menu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price })
  })
    .then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e)))
    .then(() => {
      addItemForm.reset();
      loadMenu();
    })
    .catch(err => {
      console.error("Add error:", err);
      alert(`Failed to add item: ${err.error || 'server error'}`);
    });
});

menuTableBody.addEventListener('click', (e) => {
  const btn = e.target;
  const id = btn.dataset.id;
  if (!id) return;

  if (btn.classList.contains('delete-btn')) {
    fetch(`${API_BASE}/menu/${id}`, { method: "DELETE" })
      .then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e)))
      .then(() => loadMenu())
      .catch(err => {
        console.error("Delete error:", err);
        alert(`Failed to delete: ${err.error || 'server error'}`);
      });
  }

  if (btn.classList.contains('edit-btn')) {
    const currentRow = btn.closest('tr');
    const currentName = currentRow.children[0].textContent.trim();
    const currentPrice = currentRow.children[1].textContent.trim();

    const newName = prompt("Enter new item name:", currentName);
    if (newName === null) return;

    const newPrice = prompt("Enter new item price:", currentPrice);
    if (newPrice === null) return;

    if (newName.trim() === "" || isNaN(newPrice) || newPrice === "") {
      return alert("Invalid values.");
    }

    fetch(`${API_BASE}/menu/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), price: newPrice })
    })
      .then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e)))
      .then(() => loadMenu())
      .catch(err => {
        console.error("Update error:", err);
        alert(`Failed to update: ${err.error || 'server error'}`);
      });
  }
});

loadMenu();

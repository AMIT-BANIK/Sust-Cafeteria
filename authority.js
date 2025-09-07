const API_BASE = "http://localhost:3000";

const addItemForm = document.getElementById('addItemForm');
const menuTableBody = document.querySelector('#menuTable tbody');
const ordersTableBody = document.querySelector("#ordersTable tbody");
const orderDateFilter = document.getElementById("orderDateFilter");
const socket = io(API_BASE);

// ================= Menu Management =================
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
    .catch(err => console.error("Error loading menu:", err));
}

addItemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('itemName').value.trim();
  const price = document.getElementById('itemPrice').value;

  if (!name || price === "") return alert("Please enter item name and price.");

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
  .catch(err => alert(`Failed to add item: ${err.error || 'server error'}`));
});

menuTableBody.addEventListener('click', (e) => {
  const btn = e.target;
  const id = btn.dataset.id;
  if (!id) return;

  if (btn.classList.contains('delete-btn')) {
    fetch(`${API_BASE}/menu/${id}`, { method: "DELETE" })
      .then(res => res.ok ? res.json() : res.json().then(e => Promise.reject(e)))
      .then(() => loadMenu())
      .catch(err => alert(`Failed to delete: ${err.error || 'server error'}`));
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
      .catch(err => alert(`Failed to update: ${err.error || 'server error'}`));
  }
});

loadMenu();


orderDateFilter.addEventListener("change", () => {
  const selectedDate = orderDateFilter.value; 
  loadOrders(selectedDate);
});

function loadOrders(filterDate = "") {
  fetch(`${API_BASE}/orders`)
    .then(res => res.json())
    .then(data => {
      ordersTableBody.innerHTML = "";

      let filteredOrders = data;
      if (filterDate) {
        filteredOrders = data.filter(order => {
          const orderDate = new Date(order.created_at).toISOString().split('T')[0];
          return orderDate === filterDate;
        });
      }

      filteredOrders.forEach(order => appendOrderRow(order));
    })
    .catch(err => console.error("Error loading orders:", err));
}

function appendOrderRow(order) {
  const tr = document.createElement("tr");

  const itemsStr = formatItems(order.items);

  tr.innerHTML = `
    <td>${order.id}</td>
    <td>${order.order_code}</td>
    <td>${itemsStr}</td>
    <td>Tk ${order.total}</td>
    <td>
      <select class="status-select" data-id="${order.id}">
        <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
        <option value="Served" ${order.status === "Served" ? "selected" : ""}>Served</option>
      </select>
    </td>
    <td>${new Date(order.created_at).toLocaleString()}</td>
  `;

  if (order.status === "Served") {
    tr.style.backgroundColor = "#d4edda"; 
  }

  ordersTableBody.prepend(tr); 
  attachStatusListener(tr.querySelector(".status-select"), tr);
}

function formatItems(items) {
  let parsedItems = [];
  try {
    parsedItems = typeof items === "string" ? JSON.parse(items) : items;
  } catch (err) {
    console.error("Failed to parse order items:", err);
  }
  return parsedItems.map(i => `${i.name} x ${i.qty}`).join(", ");
}

function attachStatusListener(select, row) {
  select.addEventListener("change", () => {
    const id = select.dataset.id;
    const status = select.value;

    fetch(`${API_BASE}/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
    .then(res => res.json())
    .then(() => {
      console.log(`Order ${id} status updated to ${status}`);

      if (status === "Served") {
        row.style.backgroundColor = "#4fac4fff"; 
      } else {
        row.style.backgroundColor = ""; 
      }
    })
    .catch(err => console.error("Error updating status:", err));
  });
}

// ================= Socket.io for live orders =================
socket.on("newOrder", order => {
  const selectedDate = orderDateFilter.value;
  if (!selectedDate || new Date(order.created_at).toISOString().split('T')[0] === selectedDate) {
    appendOrderRow(order);
  }
});

loadOrders();

// Fetch products from the backend and display them
fetch("/api/products")
  .then((response) => response.json())
  .then((products) => {
    const container = document.getElementById("product-list");

    products.forEach((product) => {
      const div = document.createElement("div");
      div.className = "product";
      div.innerHTML = `
        <h3>${product.name}</h3>
        <p>Price: $${product.price}</p>
        <p>Category: ${product.category}</p>
      `;
      container.appendChild(div);
    });
  })
  .catch((err) => {
    console.error("Error loading products:", err);
  });

const params = new URLSearchParams(window.location.search);
const category = params.get("type"); // 'masabeh' or 'asawer'

document.getElementById("category-title").textContent =
  category === "masabeh" ? "Rosaries Collection" : "Bracelets Collection";

// Fetch products from backend based on category
fetch(`/api/products?category=${category}`)
  .then((res) => res.json())
  .then((products) => {
    const list = document.getElementById("product-list");

    products.forEach((product) => {
      const card = document.createElement("div");
      card.className = "product-card";

      const imgSrc = `data:${product.image.contentType};base64,${btoa(
        new Uint8Array(product.image.data.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      )}`;

      card.innerHTML = `
        <img src="${imgSrc}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span class="price">$${product.price}</span>
        <a href="product.html?id=${product._id}" class="view-btn">View</a>
      `;

      list.appendChild(card);
    });
  })
  .catch(() => {
    document.getElementById("product-list").innerHTML =
      "<p>Could not load products.</p>";
  });

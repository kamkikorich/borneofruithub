const GITHUB_USERNAME = "kamkikorich";
const REPO_NAME = "borneoHubFruit";
const FILE_PATH = "stok.js";

let products = [];
let fileSha = "";
let currentBase64 = "";

/* Auto load token */
if (sessionStorage.getItem('gh_token')) {
    loadFromGitHub();
} else {
    let token = prompt("Masukkan GitHub Token Admin:");
    if (!token) alert("Token diperlukan!");
    sessionStorage.setItem('gh_token', token);
    loadFromGitHub();
}

function logout() {
    sessionStorage.removeItem('gh_token');
    window.location.href = "index.html";
}

/* Handle Upload + Resize */
function handleFile(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;

        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const MAX_WIDTH = 400;
            const scale = MAX_WIDTH / img.width;

            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            currentBase64 = canvas.toDataURL("image/jpeg", 0.7);
            document.getElementById("preview-img").src = currentBase64;
            document.getElementById("preview-img").style.display = "block";
        };
    };
    reader.readAsDataURL(file);
}

/* Load product list */
async function loadFromGitHub() {
    document.getElementById("msg").style.display = "block";
    const token = sessionStorage.getItem("gh_token");

    try {
        const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
        const res = await fetch(url, { headers: { Authorization: `token ${token}` } });

        const data = await res.json();
        fileSha = data.sha;

        const json = atob(data.content);
        let arrStart = json.indexOf("[");
        let arrEnd = json.lastIndexOf("]");

        products = JSON.parse(json.substring(arrStart, arrEnd + 1));
        renderList();
    } catch (e) {
        alert("Gagal muat stok: " + e.message);
    }
    document.getElementById("msg").style.display = "none";
}

/* Save to GitHub */
async function saveToGitHub() {
    document.getElementById("msg").innerText = "Mengemaskini GitHub...";
    document.getElementById("msg").style.display = "block";

    const token = sessionStorage.getItem("gh_token");

    const newContent = `const products = ${JSON.stringify(products, null, 4)};`;
    const encoded = btoa(unescape(encodeURIComponent(newContent)));

    const body = {
        message: "Update stok",
        content: encoded,
        sha: fileSha
    };

    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;

    try {
        const res = await fetch(url, {
            method: "PUT",
            headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        fileSha = data.content.sha;

        alert("Produk berjaya disimpan!");
        location.reload();
    } catch (e) {
        alert("Ralat simpan: " + e.message);
    }
}

/* Add Product */
function addProduct() {
    let name = document.getElementById("p-name").value;
    let price = document.getElementById("p-price").value;

    if (!name || !price) {
        alert("Isi nama & harga.");
        return;
    }

    products.push({
        id: Date.now(),
        name,
        desc: document.getElementById("p-desc").value,
        price: parseFloat(price),
        unit: document.getElementById("p-unit").value,
        img: currentBase64
    });

    saveToGitHub();
}

/* Delete Product */
function delProduct(i) {
    if (!confirm("Padam produk ini?")) return;
    products.splice(i, 1);
    saveToGitHub();
}

/* Render Table */
function renderList() {
    let html = "";
    products.forEach((p, i) => {
        html += `
        <tr>
            <td><img class="list-img" src="${p.img}"></td>
            <td>${p.name}</td>
            <td>RM ${p.price}</td>
            <td>${p.unit}</td>
            <td><button style="background:red; color:white;" onclick="delProduct(${i})">X</button></td>
        </tr>
        `;
    });
    document.getElementById("product-list").innerHTML = html;
}


const tableBody = document.getElementById('category-table-body');
const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');

let editingId = null;

let allCategories = [];

const loadCategories = async () => {
    try {
        allCategories = await api.get('/categories');
        renderCategories(allCategories);
    } catch (err) {
        console.error(err);
    }
};

const renderCategories = (categories) => {
    if (categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No categories found</td></tr>';
        return;
    }
    tableBody.innerHTML = categories.map(cat => `
        <tr>
            <td><img src="${cat.image}" style="width: 50px; border-radius: 5px;"></td>
            <td>${cat.name}</td>
            <td>${cat.description.slice(0, 50)}...</td>
            <td>
                <button onclick="editCat('${cat._id}', '${cat.name}', '${cat.description}', '${cat.image}')" class="btn-icon"><i class="fa-solid fa-edit"></i></button>
                <button onclick="deleteCat('${cat._id}')" class="btn-icon" style="color: #ff4444;"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

document.getElementById('category-search')?.addEventListener('keyup', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm) ||
        cat.description.toLowerCase().includes(searchTerm)
    );
    renderCategories(filtered);
});

window.editCat = (id, name, desc, img) => {
    editingId = id;
    document.getElementById('modal-title').innerText = 'Edit Category';
    document.getElementById('cat-name').value = name;
    document.getElementById('cat-desc').value = desc;

    if (img && img !== 'undefined') {
        const previewImg = document.querySelector('#cat-image-preview img');
        previewImg.src = img;
        previewImg.style.display = 'block';
    }

    modal.style.display = 'block';
    overlay.style.display = 'block';
};

window.deleteCat = async (id) => {
    if (confirm('Are you sure?')) {
        try {
            await api.delete(`/categories/${id}`);
            showToast('Category deleted', 'success');
            loadCategories();
        } catch (err) {
            console.error(err);
        }
    }
};

document.getElementById('add-btn').onclick = () => {
    editingId = null;
    document.getElementById('category-form').reset();
    document.getElementById('modal-title').innerText = 'Add Category';
    const previewImg = document.querySelector('#cat-image-preview img');
    previewImg.src = '';
    previewImg.style.display = 'none';
    modal.style.display = 'block';
    overlay.style.display = 'block';
};

document.getElementById('cancel-btn').onclick = () => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
};

document.getElementById('category-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('cat-name').value);
    formData.append('description', document.getElementById('cat-desc').value);

    const imageFile = document.getElementById('cat-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        if (editingId) {
            await api.put(`/categories/${editingId}`, formData);
        } else {
            await api.post('/categories', formData);
        }
        modal.style.display = 'none';
        overlay.style.display = 'none';
        loadCategories();
    } catch (err) {
        showToast(err.message || 'Error saving category', 'error');
    }
};

document.addEventListener('DOMContentLoaded', loadCategories);

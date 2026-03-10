const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'opushire-backend/.env' });

const token = jwt.sign({ id: 'admin-id', role: 'admin' }, process.env.JWT_SECRET);

fetch('http://localhost:5000/api/admin/reports', {
    headers: { Authorization: `Bearer ${token}` }
})
    .then(r => r.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(console.error);

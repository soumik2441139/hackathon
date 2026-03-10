const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'opushire-backend/.env' });

const token = jwt.sign({ id: 'admin-id', role: 'admin' }, process.env.JWT_SECRET);

fetch('http://localhost:5000/api/admin/bots/pipeline', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
})
    .then(r => r.json())
    .then(data => console.log(data))
    .catch(console.error);

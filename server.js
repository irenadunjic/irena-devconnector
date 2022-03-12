// Dependencies
const express = require('express');
// Constants
const PORT = process.env.PORT || 5000;

// App origin
const app = express();
app.get('/', (req, res) => res.send('API Running'));
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
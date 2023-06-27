const express = require('express');

const router = express.Router();

router.get('/hello', async (_, res) => {
  res.status(200).json({ message: 'Hello World!' });
});

// router.get('/run', async (_, res) => {
//   res.status(200).json({ message: 'Started downloading reddit saved data' });
// });

module.exports = router;

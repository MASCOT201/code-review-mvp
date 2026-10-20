const express = require('express');
const cors = require('cors');
const parseDiff = require('parse-diff');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Create a Patch
app.post('/api/patches', async (req, res) => {
  const { title, raw_diff } = req.body;
  if (!title || !raw_diff) {
    return res.status(400).json({ error: 'Title and raw_diff are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO patches (title, raw_diff) VALUES ($1, $2) RETURNING *',
      [title, raw_diff]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create patch.' });
  }
});

// 2. Fetch Patch with Parsed Diffs & Comments
app.get('/api/patches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const patchResult = await pool.query('SELECT * FROM patches WHERE id = $1', [id]);
    if (patchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patch not found.' });
    }

    const patch = patchResult.rows[0];
    const parsedDiff = parseDiff(patch.raw_diff);

    const commentsResult = await pool.query(
      'SELECT * FROM comments WHERE patch_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      patch,
      files: parsedDiff,
      comments: commentsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patch details.' });
  }
});

// 3. Post a Line-Level Comment
app.post('/api/comments', async (req, res) => {
  const { patch_id, file_path, line_number, author, comment_text } = req.body;
  if (!patch_id || !file_path || !line_number || !comment_text) {
    return res.status(400).json({ error: 'Missing required comment fields.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (patch_id, file_path, line_number, author, comment_text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patch_id, file_path, line_number, author || 'Reviewer', comment_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// 4. Resolve/Unresolve Comment Thread
app.patch('/api/comments/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { is_resolved } = req.body;

  try {
    const result = await pool.query(
      'UPDATE comments SET is_resolved = $1 WHERE id = $2 RETURNING *',
      [is_resolved, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update thread status.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [patchId, setPatchId] = useState(null);
  const [patchData, setPatchData] = useState(null);
  const [title, setTitle] = useState('');
  const [rawDiff, setRawDiff] = useState('');
  const [activeLine, setActiveLine] = useState(null);
  const [newComment, setNewComment] = useState('');

  const sampleDiff = `diff --git a/src/app.js b/src/app.js
index 8325871..b293811 100644
--- a/src/app.js
+++ b/src/app.js
@@ -1,4 +1,4 @@
-console.log("Hello World");
+console.log("Hello Code Review MVP!");
 function add(a, b) {
-  return a - b;
+  return a + b;
 }`;

  const handleCreatePatch = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/patches`, {
        title: title || 'Sample Feature Patch',
        raw_diff: rawDiff || sampleDiff,
      });
      setPatchId(res.data.id);
    } catch (err) {
      alert('Error creating patch');
    }
  };

  const fetchPatch = async () => {
    if (!patchId) return;
    try {
      const res = await axios.get(`${API_BASE}/patches/${patchId}`);
      setPatchData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPatch();
  }, [patchId]);

  const handleAddComment = async (filePath, lineNumber) => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`${API_BASE}/comments`, {
        patch_id: patchId,
        file_path: filePath,
        line_number: lineNumber,
        comment_text: newComment,
        author: 'Reviewer',
      });
      setNewComment('');
      setActiveLine(null);
      fetchPatch();
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const handleToggleResolve = async (commentId, currentStatus) => {
    try {
      await axios.patch(`${API_BASE}/comments/${commentId}/resolve`, {
        is_resolved: !currentStatus,
      });
      fetchPatch();
    } catch (err) {
      alert('Failed to update comment status');
    }
  };

  if (!patchId) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h2>Create / Upload Code Patch</h2>
        <form onSubmit={handleCreatePatch}>
          <div>
            <label>Title:</label><br />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix addition logic"
              style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            />
          </div>
          <div>
            <label>Raw Git Diff / Patch:</label><br />
            <textarea
              rows="10"
              value={rawDiff}
              onChange={(e) => setRawDiff(e.target.value)}
              placeholder="Paste git diff here or leave empty to use sample diff..."
              style={{ width: '100%', padding: '8px', fontFamily: 'monospace' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', marginTop: '10px' }}>
            Submit Patch for Review
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <button onClick={() => setPatchId(null)}>← Upload New Patch</button>
      <h2>{patchData?.patch?.title}</h2>

      {patchData?.files?.map((file, fIdx) => (
        <div key={fIdx} style={{ border: '1px solid #ccc', marginBottom: '20px', borderRadius: '4px' }}>
          <div style={{ background: '#f5f5f5', padding: '10px', fontWeight: 'bold' }}>
            {file.to}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            {file.chunks.map((chunk, cIdx) => (
              <React.Fragment key={cIdx}>
                {chunk.changes.map((change, chIdx) => {
                  const lineNum = change.ln || change.ln2 || change.ln1;
                  const commentsForLine = patchData.comments.filter(
                    (c) => c.file_path === file.to && c.line_number === lineNum
                  );

                  let bg = '#fff';
                  if (change.type === 'add') bg = '#e6ffec';
                  if (change.type === 'del') bg = '#ffebe9';

                  return (
                    <div key={chIdx}>
                      <div
                        style={{
                          display: 'flex',
                          backgroundColor: bg,
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                        }}
                        onClick={() => setActiveLine({ filePath: file.to, lineNumber: lineNum })}
                      >
                        <span style={{ width: '50px', color: '#888', userSelect: 'none', textAlign: 'right', paddingRight: '10px' }}>
                          {lineNum}
                        </span>
                        <span style={{ whiteSpace: 'pre-wrap' }}>{change.content}</span>
                      </div>

                      {commentsForLine.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            marginLeft: '60px',
                            padding: '8px',
                            margin: '4px 0 4px 60px',
                            background: c.is_resolved ? '#f0f0f0' : '#eef6ff',
                            borderLeft: c.is_resolved ? '3px solid #888' : '3px solid #0066cc',
                          }}
                        >
                          <strong>{c.author}:</strong> {c.comment_text}
                          <button
                            onClick={() => handleToggleResolve(c.id, c.is_resolved)}
                            style={{ marginLeft: '15px', fontSize: '12px' }}
                          >
                            {c.is_resolved ? 'Unresolve' : 'Resolve Thread'}
                          </button>
                        </div>
                      ))}

                      {activeLine?.filePath === file.to && activeLine?.lineNumber === lineNum && (
                        <div style={{ marginLeft: '60px', padding: '10px', background: '#fafafa' }}>
                          <input
                            type="text"
                            placeholder="Type line comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            style={{ width: '70%', padding: '6px' }}
                          />
                          <button
                            onClick={() => handleAddComment(file.to, lineNum)}
                            style={{ marginLeft: '10px', padding: '6px 12px' }}
                          >
                            Post Comment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

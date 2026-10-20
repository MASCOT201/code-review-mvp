# Code Review MVP

An end-to-end web interface for importing code diffs/patches, leaving inline line-level comments, and resolving code review threads.

## 🚀 Features
- **Patch & Diff Ingestion:** Parse raw Git diffs into structured file chunks and line numbers.
- **Line-Level Commenting:** Interactive line selection to add inline code review feedback.
- **Thread Resolution:** Ability to toggle and mark review threads as resolved or unresolved.
- **Database Persistence:** Real-time state preservation using PostgreSQL.

---

## 🛠️ Tech Stack & Architecture
- **Frontend:** React + Vite, Axios
- **Backend:** Node.js, Express, `parse-diff`
- **Database:** PostgreSQL (`pg` pool driver)

---

## 🗄️ Database Schema

### `patches`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY |
| `title` | VARCHAR(255) | NOT NULL |
| `raw_diff` | TEXT | NOT NULL |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### `comments`
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY |
| `patch_id` | INT | FOREIGN KEY (patches.id) |
| `file_path` | VARCHAR(255) | NOT NULL |
| `line_number` | INT | NOT NULL |
| `author` | VARCHAR(100) | DEFAULT 'Reviewer' |
| `comment_text` | TEXT | NOT NULL |
| `is_resolved` | BOOLEAN | DEFAULT FALSE |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/codereview_db

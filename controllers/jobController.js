import { pool } from "../db.js";

export const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, location, category } = req.body;

    if (!title || !description || !location || !category) {
      return res.status(400).json({
        message:
          "All fields (title, description, location, category) are required.",
      });
    }

    const result = await pool.query(
      `INSERT INTO jobs (employer_id, title, description, location, category)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
      [userId, title, description, location, category]
    );

    const job = result.rows[0];

    res.status(201).json({ job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const listJobs = async (req, res) => {
  try {
    const { title, location, category } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const filters = [];
    const params = [];
    let idx = 1;

    if (title) {
      filters.push(`title ILIKE $${idx++}`);
      params.push(`%${title}%`);
    }
    if (location) {
      filters.push(`location ILIKE $${idx++}`);
      params.push(`%${location}%`);
    }
    if (category) {
      filters.push(`category ILIKE $${idx++}`);
      params.push(`%${category}%`);
    }

    const where = filters.length ? "WHERE " + filters.join(" AND ") : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM jobs ${where}`,
      params
    );

    const totalJobs = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalJobs / limit);

    const result = await pool.query(
      `SELECT * FROM jobs ${where} 
       ORDER BY created_at DESC 
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    );

    res.json({
      page,
      totalJobs,
      totalPages,
      jobs: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.userId;
    const { title, description, location, category } = req.body;

    const jobRes = await pool.query("SELECT * FROM jobs WHERE id = $1", [
      jobId,
    ]);
    
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    const job = jobRes.rows[0];

    if (job.employer_id !== userId) {
      return res
        .status(403)
        .json({ message: "You can only update your own jobs" });
    }

    const newTitle = title || job.title;
    const newDescription = description || job.description;
    const newLocation = location || job.location;
    const newCategory = category || job.category;

    const result = await pool.query(
      `UPDATE jobs 
       SET title = $1, description = $2, location = $3, category = $4 
       WHERE id = $5 
       RETURNING *`,
      [newTitle, newDescription, newLocation, newCategory, jobId]
    );

    res.status(200).json({ job: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const jobRes = await pool.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    const job = jobRes.rows[0];

    if (userRole === "employer" && job.employer_id !== userId) {
      return res.status(403).json({ message: "You can only delete your own jobs" });
    }

    await pool.query("DELETE FROM jobs WHERE id = $1", [jobId]);

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}; 